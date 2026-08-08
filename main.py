from reportlab.graphics.shapes import Drawing, Rect
from phase3 import run_phase3, grade
from phase4 import run_phase4
import os
import sys
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib import colors

from phase1 import load_srs, preprocess, detect_weak_words
from phase2 import analyze_with_llm

def run_analysis(filepath):
    filename = os.path.basename(filepath)

    text = load_srs(filepath)
    sentences = preprocess(text)

    total = 0
    flagged_list = []
    all_sentences = []

    for i, sentence in enumerate(sentences, 1):
        weak, pos_tags = detect_weak_words(sentence)
        total += 1
        all_sentences.append(sentence)
        if weak:
            print(f"\n[REQ {i}] {sentence}")
            print(f"  Weak words: {weak}")
            print(f"  Running LLM analysis...")
            llm_output = analyze_with_llm(sentence)
    
            from phase3 import completeness_score_llm
            comp_score = completeness_score_llm(llm_output)
            print(f"  Done.")
            flagged_list.append({
                "req_num": i,
                "sentence": sentence,
                "weak_words": weak,
                "pos_tags": pos_tags,
                "llm": llm_output,
                "completeness_from_llm": comp_score
            })

    # Phase 3 
    phase3_results, srs_score = run_phase3(all_sentences, flagged_list)
    # Phase 4
    all_sentences_list = preprocess(text)
    phase4_metrics = run_phase4(flagged_list, all_sentences_list)

    return {
    "filename": filename,
    "total": total,
    "flagged": len(flagged_list),
    "clean": total - len(flagged_list),
    "srs_score": srs_score,
    "requirements": flagged_list,
    "phase3": phase3_results,
    "phase4": phase4_metrics
}

def generate_pdf_report(data, output_path="req_intel_report.pdf"):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=0.7*inch,
        leftMargin=0.7*inch,
        topMargin=0,
        bottomMargin=0.6*inch
    )

    styles = getSampleStyleSheet()

    # UI design
    NAVY = colors.HexColor('#1E293B')
    CREAM = colors.HexColor('#F8F7F4')
    BLUE = colors.HexColor('#2563EB')
    AMBER = colors.HexColor('#F59E0B')
    EMERALD = colors.HexColor('#10B981')
    SLATE = colors.HexColor('#64748B')
    SLATE_DARK = colors.HexColor('#334155')

    title_style = ParagraphStyle('Title', fontSize=22, fontName='Helvetica-Bold',
                                  textColor=colors.white, spaceAfter=4)
    subtitle_style = ParagraphStyle('Subtitle', fontSize=10, fontName='Helvetica',
                                     textColor=colors.HexColor('#94A3B8'))
    section_label_style = ParagraphStyle('SectionLabel', fontSize=8, fontName='Helvetica-Bold',
                                          textColor=BLUE, spaceAfter=2)
    heading_style = ParagraphStyle('Heading', fontSize=13, fontName='Helvetica-Bold',
                                    spaceAfter=10, textColor=SLATE_DARK)
    normal_style = ParagraphStyle('Normal', fontSize=9, fontName='Helvetica',
                                   spaceAfter=4, leading=14, textColor=SLATE_DARK)
    mono_style = ParagraphStyle('Mono', fontSize=8, fontName='Courier',
                                 spaceAfter=3, leading=12, textColor=SLATE)
    weak_style = ParagraphStyle('Weak', fontSize=8, fontName='Helvetica-Bold',
                                 textColor=colors.HexColor('#B45309'), spaceAfter=4)
    req_text_style = ParagraphStyle('ReqText', fontSize=9.5, fontName='Helvetica-Bold',
                                     spaceAfter=4, leading=14, textColor=SLATE_DARK)

    def grade_color(g):
        if g == "Good":
            return EMERALD
        elif g == "Acceptable":
            return AMBER
        else:
            return colors.HexColor('#EF4444')

    def score_bar_table(score, width=200):
        filled_width = (score / 100) * width
        bar_color = EMERALD if score >= 80 else (AMBER if score >= 60 else colors.HexColor('#EF4444'))
        d = Drawing(width, 8)
        d.add(Rect(0, 0, width, 8, fillColor=colors.HexColor('#E2E8F0'), strokeColor=None))
        d.add(Rect(0, 0, filled_width, 8, fillColor=bar_color, strokeColor=None))
        return d

    from reportlab.graphics.shapes import Drawing, Rect
    from reportlab.platypus import Table as RLTable
    from reportlab.platypus import TableStyle as RLTableStyle

    story = []

    for file_idx, file_data in enumerate(data):

        title_dark_style = ParagraphStyle('TitleDark', fontSize=22, fontName='Helvetica-Bold',
                                    textColor=SLATE_DARK, spaceAfter=14, leading=26)
        subtitle_dark_style = ParagraphStyle('SubtitleDark', fontSize=10, fontName='Helvetica',
                                       textColor=SLATE, spaceAfter=2, leading=14)

        story.append(Paragraph("Req-Intel", title_dark_style))
        story.append(Paragraph("Requirement Quality Analysis Report", subtitle_dark_style))
        story.append(Spacer(1, 8))
        story.append(Paragraph(f"FILE &nbsp;&middot;&nbsp; {file_data['filename']}", subtitle_dark_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=NAVY))
        story.append(Spacer(1, 0.25*inch))

        srs_score = file_data.get('srs_score', 0)
        srs_grade = grade(srs_score)

        metric_data = [[
            Paragraph(f"<font size=18 face='Helvetica-Bold' color='#0B1120'>{file_data['total']}</font><br/><font size=7 color='#64748B'>TOTAL</font>", normal_style),
            Paragraph(f"<font size=18 face='Helvetica-Bold' color='#B45309'>{file_data['flagged']}</font><br/><font size=7 color='#64748B'>FLAGGED</font>", normal_style),
            Paragraph(f"<font size=18 face='Helvetica-Bold' color='#047857'>{file_data['clean']}</font><br/><font size=7 color='#64748B'>CLEAN</font>", normal_style),
            Paragraph(f"<font size=18 face='Helvetica-Bold' color='#0B1120'>{srs_score}</font><br/><font size=7 color='#64748B'>QUALITY SCORE</font>", normal_style),
        ]]
        metric_table = RLTable(metric_data, colWidths=[1.775*inch]*4)
        metric_table.setStyle(RLTableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), CREAM),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 14),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
            ('LINEAFTER', (0, 0), (2, 0), 0.5, colors.HexColor('#E2E8F0')),
        ]))
        story.append(metric_table)
        story.append(Spacer(1, 0.15*inch))

        # SRS SCORE BAR 
        bar_row = RLTable(
            [[Paragraph("<font face='Helvetica-Bold' size=10>SRS Overall Quality</font>", normal_style),
              Paragraph(f"<font face='Helvetica-Bold' size=9 color='{grade_color(srs_grade).hexval().replace('0x','#')}'>{srs_grade} · {srs_score}/100</font>", normal_style)]],
            colWidths=[4.5*inch, 2.6*inch]
        )
        bar_row.setStyle(RLTableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ]))
        story.append(bar_row)
        story.append(Spacer(1, 4))
        story.append(score_bar_table(srs_score, width=510))
        story.append(Spacer(1, 0.3*inch))

        # PHASE 1 & 2 
        story.append(Paragraph("PHASE 1 &amp; 2", section_label_style))
        story.append(Paragraph("Ambiguity Detection", heading_style))

        for req in file_data['requirements']:
            req_block = []
            req_block.append(Paragraph(f"REQ {req['req_num']}  ·  {req['sentence']}", req_text_style))
            weak_tags = "  ".join([f"<font color='#B45309'>● {w}</font>" for w in req['weak_words']])
            req_block.append(Paragraph(weak_tags, weak_style))
            req_block.append(Paragraph(' · '.join(req['pos_tags'][:6]), mono_style))
            req_block.append(Spacer(1, 4))

            llm_lines = [l.strip() for l in req['llm'].split('\n') if l.strip()]
            llm_para_lines = []
            for line in llm_lines:
                llm_para_lines.append(line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))
            llm_text = '<br/>'.join(llm_para_lines)
            req_block.append(Paragraph(llm_text, mono_style))

            req_table = RLTable([[req_block]], colWidths=[7.1*inch])
            req_table.setStyle(RLTableStyle([
                ('BACKGROUND', (0,0), (-1,-1), CREAM),
                ('LEFTPADDING', (0,0), (-1,-1), 16),
                ('RIGHTPADDING', (0,0), (-1,-1), 16),
                ('TOPPADDING', (0,0), (-1,-1), 14),
                ('BOTTOMPADDING', (0,0), (-1,-1), 14),
            ]))
            story.append(req_table)
            story.append(Spacer(1, 10))

        story.append(Spacer(1, 0.15*inch))

        # PHASE 3 TABLE 
        if file_data.get('phase3'):
            story.append(Paragraph("PHASE 3", section_label_style))
            story.append(Paragraph("Requirement Quality Scores", heading_style))

            table_data = [['REQUIREMENT', 'MEASURABILITY', 'COMPLETENESS', 'CONCISENESS', 'OVERALL', 'GRADE']]
            row_colors = [NAVY]
            for r in file_data['phase3']:
                short = r['sentence'][:42] + '...' if len(r['sentence']) > 42 else r['sentence']
                g = grade(r['overall'])
                table_data.append([
                    short, f"{r['measurability']}", f"{r['completeness']}",
                    f"{r['conciseness']}", f"{r['overall']}", g
                ])

            score_table = RLTable(table_data, colWidths=[195, 75, 75, 70, 55, 75])
            style_cmds = [
                ('BACKGROUND', (0, 0), (-1, 0), NAVY),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 7.5),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [CREAM, colors.white]),
                ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#E2E8F0')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 7),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
                ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ]
            for i, r in enumerate(file_data['phase3'], start=1):
                g = grade(r['overall'])
                style_cmds.append(('TEXTCOLOR', (5, i), (5, i), grade_color(g)))
                style_cmds.append(('FONTNAME', (5, i), (5, i), 'Helvetica-Bold'))
            score_table.setStyle(RLTableStyle(style_cmds))
            story.append(score_table)
            story.append(Spacer(1, 0.3*inch))

        # PHASE 4 
        if file_data.get('phase4'):
            p4 = file_data['phase4']
            story.append(Paragraph("PHASE 4", section_label_style))
            story.append(Paragraph("Validation &amp; Benchmarking", heading_style))

            tp_row = [[
                Paragraph(f"<font size=16 face='Helvetica-Bold' color='#0B1120'>{p4['TP']}</font><br/><font size=7 color='#64748B'>TRUE POSITIVES</font>", normal_style),
                Paragraph(f"<font size=16 face='Helvetica-Bold' color='#0B1120'>{p4['FP']}</font><br/><font size=7 color='#64748B'>FALSE POSITIVES</font>", normal_style),
                Paragraph(f"<font size=16 face='Helvetica-Bold' color='#0B1120'>{p4['FN']}</font><br/><font size=7 color='#64748B'>FALSE NEGATIVES</font>", normal_style),
                Paragraph(f"<font size=16 face='Helvetica-Bold' color='#0B1120'>{p4['TN']}</font><br/><font size=7 color='#64748B'>TRUE NEGATIVES</font>", normal_style),
            ]]
            tp_table = RLTable(tp_row, colWidths=[1.775*inch]*4)
            tp_table.setStyle(RLTableStyle([
                ('BACKGROUND', (0,0), (-1,-1), CREAM),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('TOPPADDING', (0,0), (-1,-1), 12),
                ('BOTTOMPADDING', (0,0), (-1,-1), 12),
            ]))
            story.append(tp_table)
            story.append(Spacer(1, 6))

            metrics_row = [[
                Paragraph(f"<font size=16 face='Helvetica-Bold' color='#2563EB'>{p4['precision']}%</font><br/><font size=7 color='#64748B'>PRECISION</font>", normal_style),
                Paragraph(f"<font size=16 face='Helvetica-Bold' color='#2563EB'>{p4['recall']}%</font><br/><font size=7 color='#64748B'>RECALL</font>", normal_style),
                Paragraph(f"<font size=16 face='Helvetica-Bold' color='#2563EB'>{p4['f1_score']}%</font><br/><font size=7 color='#64748B'>F1 SCORE</font>", normal_style),
                Paragraph(f"<font size=16 face='Helvetica-Bold' color='#2563EB'>{p4['accuracy']}%</font><br/><font size=7 color='#64748B'>ACCURACY</font>", normal_style),
            ]]
            metrics_table = RLTable(metrics_row, colWidths=[1.775*inch]*4)
            metrics_table.setStyle(RLTableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EFF6FF')),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('TOPPADDING', (0,0), (-1,-1), 12),
                ('BOTTOMPADDING', (0,0), (-1,-1), 12),
            ]))
            story.append(metrics_table)
            story.append(Spacer(1, 0.3*inch))

        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E2E8F0')))
        story.append(Spacer(1, 8))
        story.append(Paragraph(
            "<font size=7 color='#94A3B8'>Req-Intel — SMI University, Karachi</font>",
            normal_style
        ))

        if file_idx < len(data) - 1:
            story.append(Spacer(1, 0.4*inch))

    doc.build(story)
    print(f"\nPDF Report saved: {output_path}")
    
FILES_TO_ANALYZE = [
    "data/Library_test.docx"
]

if __name__ == "__main__":
    all_results = []
    for f in FILES_TO_ANALYZE:
        print(f"\nAnalyzing: {f}")
        result = run_analysis(f)
        all_results.append(result)

    output_filename = "req_intel_report.pdf"
    generate_pdf_report(all_results, output_filename)