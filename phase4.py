import re

def extract_ambiguity(llm_output):
    """Extract Ambiguous YES/NO or Unknown from LLM output in Phase2"""
    lines = llm_output.split('\n')
    for line in lines:
        if 'AMBIGUOUS:' in line.upper():
            if 'UNKNOWN' in line.upper():
                return None
            elif 'YES' in line.upper():
                return True
            elif 'NO' in line.upper():
                return False
    return None

def calculate_metrics(flagged_list, all_sentences):
    TP = 0
    FP = 0
    FN = 0
    TN = 0
    excluded = 0
    results = []

    # dict of flagged sen
    flagged_sentences = {r['sentence']: r for r in flagged_list}
    weak_word_detected = {
        r['sentence'] for r in flagged_list
        if len(r['weak_words']) > 0
    }

    # loop
    for sentence in all_sentences:
        was_flagged = sentence in weak_word_detected

        if sentence in flagged_sentences:
            llm_output = flagged_sentences[sentence]['llm']
            is_ambiguous = extract_ambiguity(llm_output)
        else:
            is_ambiguous = False

        if is_ambiguous is None:
            excluded += 1
            category = "Excluded"
        elif was_flagged and is_ambiguous:
            category = "TP"
            TP += 1
        elif was_flagged and not is_ambiguous:
            category = "FP"
            FP += 1
        elif not was_flagged and is_ambiguous:
            category = "FN"
            FN += 1
        else:
            category = "TN"
            TN += 1

        results.append({
            "sentence": sentence,
            "flagged_by_phase1": was_flagged,
            "llm_ambiguous": is_ambiguous,
            "category": category
        })

    precision = round(TP / (TP + FP) * 100, 2) if (TP + FP) > 0 else 0
    recall = round(TP / (TP + FN) * 100, 2) if (TP + FN) > 0 else 0
    f1 = round(2 * precision * recall / (precision + recall), 2) if (precision + recall) > 0 else 0
    accuracy = round((TP + TN) / (TP + TN + FP + FN) * 100, 2) if (TP + TN + FP + FN) > 0 else 0

    return {
        "TP": TP, "FP": FP, "FN": FN, "TN": TN,
        "excluded": excluded,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "accuracy": accuracy,
        "details": results
    }


def run_phase4(flagged_list, all_sentences=None):
    print("\n" + "="*60)
    print("Phase 4 — Validation & Benchmarking")
    print("="*60)

    if all_sentences is None:
        all_sentences = [r['sentence'] for r in flagged_list]
    
    weak_word_detected = {
        r["sentence"]
        for r in flagged_list
        if len(r["weak_words"]) > 0
    }

    metrics = calculate_metrics(flagged_list, all_sentences)

    print(f"\n  True Positives  (TP): {metrics['TP']}")
    print(f"  False Positives (FP): {metrics['FP']}")
    print(f"  False Negatives (FN): {metrics['FN']}")
    print(f"  True Negatives  (TN): {metrics['TN']}")
    print(f"  Excluded (LLM failed): {metrics['excluded']}")
    print(f"\n  Precision : {metrics['precision']}%")
    print(f"  Recall    : {metrics['recall']}%")
    print(f"  F1 Score  : {metrics['f1_score']}%")
    print(f"  Accuracy  : {metrics['accuracy']}%")

    return metrics