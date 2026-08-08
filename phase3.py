import re
from phase1 import has_measurement
# import requests

OLLAMA_URL = "http://localhost:11434/api/generate"

# Measurability keywords
MEASURABLE_PATTERNS = [
    r'\d+\s*(seconds?|minutes?|hours?|days?|weeks?|months?)',
    r'\d+\s*(ms|milliseconds?)',
    r'\d+\s*%',
    r'\d+\s*(users?|requests?|transactions?)',
    r'\d+\s*(mb|gb|kb|bytes?)',
    r'\d+\s*(times?|attempts?)',
    r'within\s+\d+',
    r'at\s+least\s+\d+',
    r'maximum\s+of\s+\d+',
    r'minimum\s+of\s+\d+',
    r'no\s+more\s+than\s+\d+',
    r'less\s+than\s+\d+',
    r'more\s+than\s+\d+',
]

# Conciseness 
REDUNDANT_PHRASES = [
    "in order to", "due to the fact that", "at this point in time",
    "in the event that", "for the purpose of", "it is important that",
    "it should be noted that", "as a matter of fact", "in terms of",
    "with regard to", "on the other hand", "in addition to",
    "as well as", "each and every", "first and foremost",
    "the fact that", "in nature", "basically", "actually",
    "essentially", "generally speaking"
]

def measure_score(sentence):

    if has_measurement(sentence):
        return 100
    else:
        return 20

def conciseness_score(sentence):
    """Rule-based:  detect redundant words"""
    sentence_lower = sentence.lower()
    word_count = len(sentence.split())
    redundant_count = 0
    
    for phrase in REDUNDANT_PHRASES:
        if phrase in sentence_lower:
            redundant_count += 1
    
    # Word count penalty 
    length_penalty = 0
    if word_count > 40:
        length_penalty = 20
    elif word_count > 30:
        length_penalty = 10
    
    if redundant_count == 0:
        base_score = 100
    elif redundant_count == 1:
        base_score = 70
    else:
        base_score = 40
    
    return max(0, base_score - length_penalty)

def completeness_score_llm(llm_output):
    import re
    lines = llm_output.split('\n')
    for line in lines:
        if 'COMPLETENESS_SCORE:' in line:
            numbers = re.findall(r'\d+', line)
            if numbers:
                score = int(numbers[0])
                return min(100, max(0, score))
    return 50

def overall_score(measurability, completeness, conciseness):
    """Weighted average"""
    return round(
    (measurability * 0.35) +
    (completeness * 0.45) +
    (conciseness * 0.20)
)

def score_requirement(sentence, llm_output=None):
    print(f"  Scoring: {sentence[:60]}...")
    
    m_score = measure_score(sentence)
    c_score = conciseness_score(sentence)
    
    print(f"  Completeness check (LLM)...")

    if llm_output:
        comp_score = completeness_score_llm(llm_output)
    else:
        comp_score = 90
    total = overall_score(m_score, comp_score, c_score)
    
    return {
        "sentence": sentence,
        "measurability": m_score,
        "completeness": comp_score,
        "conciseness": c_score,
        "overall": total
    }

def grade(score):
    if score >= 80:
        return "Good"
    elif score >= 60:
        return "Acceptable"
    elif score >= 40:
        return "Poor"
    else:
        return "Very Poor"

def run_phase3(sentences, flagged_list=None):
    print("\n" + "="*60)
    print("Phase 3 — Requirement Quality Scoring")
    print("="*60)

    llm_scores = {}
    if flagged_list:
        for req in flagged_list:
            comp = completeness_score_llm(req['llm'])
            llm_scores[req['sentence']] = comp

    results = []
    for sentence in sentences:
        m_score = measure_score(sentence)
        c_score = conciseness_score(sentence)

        # reuse of LLm score
        if sentence in llm_scores:
            comp_score = llm_scores[sentence]
            print(f"\n  Scoring: {sentence[:60]}...")
            print(f"  Completeness (from Phase 2): {comp_score}")
        else:
            print(f"\n  Scoring: {sentence[:60]}...")
            comp_score = 90  

        total = overall_score(m_score, comp_score, c_score)
        results.append({
            "sentence": sentence,
            "measurability": m_score,
            "completeness": comp_score,
            "conciseness": c_score,
            "overall": total
        })

        print(f"  Measurability : {m_score}/100")
        print(f"  Completeness  : {comp_score}/100")
        print(f"  Conciseness   : {c_score}/100")
        print(f"  Overall Score : {total}/100 — {grade(total)}")
        print("-"*40)

    avg = round(sum(r['overall'] for r in results) / len(results)) if results else 0
    print(f"\nSRS Overall Quality Score: {avg}/100 — {grade(avg)}")

    return results, avg