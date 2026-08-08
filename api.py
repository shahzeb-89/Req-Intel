import asyncio
from concurrent.futures import ThreadPoolExecutor
from database import init_db, save_analysis, get_all_history
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import shutil
import os

from phase1 import load_srs, preprocess, detect_weak_words
from phase2 import analyze_with_llm
from phase3 import measure_score, conciseness_score, completeness_score_llm, overall_score, grade, run_phase3
from phase4 import run_phase4
from main import generate_pdf_report

app = FastAPI()
init_db()
executor = ThreadPoolExecutor(max_workers=1)

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# global dic to analyze current progress
progress_status = {
    "stage": "idle",
    "current_step": 0,
    "total_steps": 0,
    "detail": "Waiting for document..."
}

@app.get("/")
def root():
    return {"status": "Req-Intel API is running"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    
    loop = asyncio.get_event_loop() 
    # reset progress to start new
    progress_status["stage"] = "reading"
    progress_status["current_step"] = 0
    progress_status["total_steps"] = 0
    progress_status["detail"] = "Reading document..."
    await asyncio.sleep(1)   
    # File save
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Phase 1
    text = load_srs(file_path)
    sentences = preprocess(text)

    # update progress when new req finds out
    progress_status["stage"] = "detecting"
    progress_status["total_steps"] = len(sentences)
    progress_status["detail"] = f"Scanning {len(sentences)} requirements for ambiguity..."
    await asyncio.sleep(1)
    total = 0
    flagged_list = []
    all_sentences = []

    for i, sentence in enumerate(sentences, 1):
        weak, pos_tags = detect_weak_words(sentence)
        total += 1
        all_sentences.append(sentence)

        if weak:
            # progress update after each flaged req accour
            progress_status["stage"] = "analyzing"
            progress_status["current_step"] = i
            progress_status["detail"] = f"AI analyzing requirement {i} of {len(sentences)}..."

            llm_output = await loop.run_in_executor(executor, analyze_with_llm, sentence)
            comp_score = completeness_score_llm(llm_output)

            flagged_list.append({
                "req_num": i,
                "sentence": sentence,
                "weak_words": weak,
                "pos_tags": pos_tags,
                "llm": llm_output,
                "completeness_from_llm": comp_score
            })

    # progress update befire p3
    progress_status["stage"] = "scoring"
    progress_status["detail"] = "Calculating quality scores..."
    await asyncio.sleep(1)
    # P3
    phase3_results, srs_score = await loop.run_in_executor(executor, run_phase3, all_sentences, flagged_list)
    # phase3_results, srs_score = run_phase3(all_sentences, flagged_list)

    # progress update before P4
    progress_status["stage"] = "validating"
    progress_status["detail"] = "Running validation metrics..."
    await asyncio.sleep(1)
    # P4
    phase4_metrics = await loop.run_in_executor(executor, lambda: run_phase4(flagged_list, all_sentences))
    # phase4_metrics = run_phase4(flagged_list, all_sentences)

    # Clean requirements
    flagged_sentences = {r['sentence'] for r in flagged_list}
    clean_list = [s for s in all_sentences if s not in flagged_sentences]

    progress_status["stage"] = "generating_report"
    progress_status["detail"] = "Generating final report..."
    await asyncio.sleep(1)
    base_name = os.path.splitext(file.filename)[0]
    report_filename = f"{base_name}_report.pdf"

    report_data = [{
        "filename": file.filename,
        "total": total,
        "flagged": len(flagged_list),
        "clean": total - len(flagged_list),
        "srs_score": srs_score,
        "requirements": flagged_list,
        "phase3": phase3_results,
        "phase4": phase4_metrics
    }]
    # PDF report gen
    await loop.run_in_executor(executor, generate_pdf_report, report_data, report_filename)

    save_analysis(
        filename=file.filename,
        total=total,
        flagged=len(flagged_list),
        clean=total - len(flagged_list),
        srs_score=srs_score,
        srs_grade=grade(srs_score),
        phase4_metrics=phase4_metrics,
        report_path=report_filename
    )

    progress_status["stage"] = "complete"
    progress_status["detail"] = "Analysis complete!"

    return {
        "filename": file.filename,
        "total": total,
        "flagged": len(flagged_list),
        "clean": total - len(flagged_list),
        "srs_score": srs_score,
        "srs_grade": grade(srs_score),
        "report_filename": report_filename,
        "requirements": [
            {
                "req_num": r["req_num"],
                "sentence": r["sentence"],
                "weak_words": r["weak_words"],
                "pos_tags": r["pos_tags"][:6],
                "llm": r["llm"]
            }
            for r in flagged_list
        ],
        "phase3": [
            {
                "sentence": r["sentence"],
                "measurability": r["measurability"],
                "completeness": r["completeness"],
                "conciseness": r["conciseness"],
                "overall": r["overall"],
                "grade": grade(r["overall"])
            }
            for r in phase3_results
        ],
        "phase4": phase4_metrics
    }

@app.get("/download-report")
def download_report(filename: str = None):
    if filename:
        base_name = os.path.splitext(filename)[0]
        report_path = f"{base_name}_report.pdf"
    else:
        report_path = "req_intel_report.pdf"

    if os.path.exists(report_path):
        return FileResponse(
            report_path,
            media_type="application/pdf",
            filename=os.path.basename(report_path)
        )
    return {"error": "Report not found"}

@app.get("/history")
def history():
    return get_all_history()

@app.get("/sample-report")
def sample_report():
    sample_path = "sample_report.pdf"
    if os.path.exists(sample_path):
        return FileResponse(
            sample_path,
            media_type="application/pdf",
            filename="req_intel_sample_report.pdf"
        )
    return {"error": "Sample report not found"}

# new endpoint to poll real progress 
@app.get("/progress")
def get_progress():
    return progress_status