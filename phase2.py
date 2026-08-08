import requests
import json
from phase1 import load_srs, preprocess, detect_weak_words


def clean_llm_output(text):
    valid_fields = ['AMBIGUOUS', 'TYPE', 'REASON', 'SUGGESTION', 'COMPLETENESS_SCORE', 'MISSING']
    lines = text.split('\n')
    cleaned = []
    current_field = None
    seen_fields = set()

    for line in lines:
        line = line.strip()
        if not line:
            continue

        field_found = False
        for field in valid_fields:
            if line.upper().startswith(field):
                if field not in seen_fields:
                    current_field = field
                    seen_fields.add(field)
                    # NAYA - field naam normalize karo, value same rakho
                    colon_idx = line.find(':')
                    if colon_idx != -1:
                        normalized_line = field + ':' + line[colon_idx+1:]
                    else:
                        normalized_line = line
                    cleaned.append(normalized_line)
                    # cleaned.append(line)
                field_found = True
                break

        if not field_found and current_field:
            if not any(x in line for x in ['http', 'www', 'Corp', 'CORP', '©', 'Ltd', 'https']):
                cleaned.append(line)

    result = '\n'.join(cleaned)
    result = result.replace('SUGGECTION:', 'SUGGESTION:')
    result = result.replace('COMPLETENSES_COST:', 'COMPLETENESS_SCORE:')
    result = result.replace('COMPLETENSE_SCORE:', 'COMPLETENESS_SCORE:')
    return result
    # return '\n'.join(cleaned)


OLLAMA_URL = "http://localhost:11434/api/generate"

def analyze_with_llm(requirement, max_retries=2):
    prompt = f"""You are a software requirements quality expert following ISO/IEC/IEEE 29148 standards.

Below are examples of requirement analysis:

Example 1:
Requirement: "The system shall respond quickly to user requests."
AMBIGUOUS: Yes
TYPE: Non-functional requirement with vague performance term
REASON: "quickly" has no measurable threshold defined.
SUGGESTION: "The system shall respond to user requests within 2 seconds under normal load."
COMPLETENESS_SCORE: 75
MISSING: No measurable threshold defined.

Example 2:
Requirement: "The system shall allow librarians to issue books to registered members."
AMBIGUOUS: No
TYPE: Functional requirement
REASON: The requirement clearly defines actor, action, and object with no vague terms.
SUGGESTION: No change needed.
COMPLETENESS_SCORE: 95
MISSING: Nothing significant missing.

Example 3:
Requirement: "The system shall be secure and protect sensitive data."
AMBIGUOUS: Yes
TYPE: Non-functional requirement with vague security term
REASON: "secure" is not measurable without defining specific security standards.
SUGGESTION: "The system shall encrypt all sensitive data using AES-256 encryption standard."
COMPLETENESS_SCORE: 60
MISSING: No specific security standard or encryption method defined.

Now analyze the requirement using ISO/IEC/IEEE 29148.

Rules:

1. Mark AMBIGUOUS as Yes ONLY if the requirement contains ambiguity, vagueness, missing measurable criteria, missing actor, missing action, conflicting statements, or incomplete information.

2. Do NOT mark a requirement ambiguous only because it contains words like "fast", "secure", "easy", etc. If those words are already supported by measurable values or standards, then mark AMBIGUOUS as No.

3. If the requirement is already clear, write:
SUGGESTION: No change needed.

4. COMPLETENESS_SCORE must be an integer between 0 and 100.

5. Output ONLY these fields exactly:

Requirement: "{requirement}"

AMBIGUOUS:
TYPE:
REASON:
SUGGESTION:
COMPLETENESS_SCORE:
MISSING:
"""
    
    for attempt in range(max_retries):
        try:
            response = requests.post(
                OLLAMA_URL,
                json={
                    "model": "phi3:mini",
                    "options": {
                        "temperature": 0,
                        "top_p": 0.1
                    },
                    "prompt": prompt,
                    "stream": False
                },
                timeout=90
            )
            response_json = response.json()

            if "response" not in response_json:
                print(f"WARNING: Unexpected response (attempt {attempt+1})")
                continue

            result = response_json["response"].strip()
            cleaned = clean_llm_output(result)

            # Valid check: should be AMBIGUOUS field 
            if "AMBIGUOUS:" in cleaned.upper():
                return cleaned
            else:
                print(f"WARNING: Missing AMBIGUOUS field (attempt {attempt+1})")
                continue

        except Exception as e:
            print(f"ERROR in analyze_with_llm (attempt {attempt+1}): {e}")
            continue

    # if both attempts fails then give honest fallback
    return "AMBIGUOUS: Yes\nTYPE: Unknown\nREASON: LLM response error.\nSUGGESTION: Unable to analyze - please review manually.\nCOMPLETENESS_SCORE: 50\nMISSING: Analysis failed."

def run_phase2(filepath):
    import os
    print(f"\n{'='*60}")
    print(f"Phase 2 LLM Analysis: {os.path.basename(filepath)}")
    print(f"{'='*60}")
    
    text = load_srs(filepath)
    sentences = preprocess(text)
    results = []
    
    for i, sentence in enumerate(sentences, 1):
        weak, pos_tags = detect_weak_words(sentence)
        print(f"\n[REQ {i}] {sentence}")
        print(f"  Weak words: {weak}")
        print(f"  LLM Analysis:")
        llm_output = analyze_with_llm(sentence)
        print(f"  {llm_output}")
        print("-" * 40)
        
        results.append({
            "sentence": sentence,
            "weak_words": weak,
            "llm": llm_output
        })
    
    return results

def save_output(filepath, output):
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(output)

# Capture output to file
import io
import sys

output_buffer = io.StringIO()
sys.stdout = output_buffer

sys.stdout = sys.__stdout__
output_text = output_buffer.getvalue()
