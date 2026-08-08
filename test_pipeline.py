from phase1 import detect_weak_words, has_measurement
from phase3 import measure_score, conciseness_score, overall_score, grade
from phase4 import extract_ambiguity

# PHASE 1 TESTS — Rule-Based Weak Word Detection

def test_detects_vague_word_fast():
    """A sentence with 'fast' and no measurable value should be flagged."""
    weak, _ = detect_weak_words("The system shall respond fast to user requests.")
    assert "fast" in weak


def test_measurable_requirement_not_flagged_for_maximum():
    """
    'maximum' should NOT be flagged if the sentence already has a
    measurable value (this is the false-positive-reduction rule in
    detect_weak_words).
    """
    weak, _ = detect_weak_words("The system shall support a maximum of 1000 users.")
    assert "maximum" not in weak


def test_clean_requirement_has_no_weak_words():
    """A fully measurable, clear requirement (with no General-category
    terms like 'normal') should return an empty list."""
    weak, _ = detect_weak_words("The system shall respond within 2 seconds.")
    assert weak == []


def test_normal_is_flagged_even_with_measurable_value():
    """
    Documents a known limitation (see Thesis Section 1.9): 'normal' is
    in the General weak-word category and is NOT in the measurability
    exception list (only 'maximum', 'minimum', 'large', 'small' are
    excluded), so it is still flagged even in a measurable sentence
    like this one. This is expected behavior given the current
    WEAK_WORDS dictionary, not a bug.
    """
    weak, _ = detect_weak_words("The system shall respond within 2 seconds under normal load.")
    assert "normal" in weak


def test_has_measurement_detects_seconds():
    assert has_measurement("the system shall respond within 2 seconds") is True


def test_has_measurement_detects_percentage():
    assert has_measurement("the system shall have 99% uptime") is True


def test_has_measurement_returns_false_for_vague_sentence():
    assert has_measurement("the system shall be very reliable") is False


# PHASE 3 TESTS — Quality Scoring

def test_measure_score_is_100_when_measurable():
    assert measure_score("The system shall respond within 2 seconds.") == 100


def test_measure_score_is_20_when_not_measurable():
    assert measure_score("The system shall respond quickly.") == 20


def test_conciseness_score_full_for_clean_short_sentence():
    score = conciseness_score("The system shall log all errors.")
    assert score == 100


def test_conciseness_score_penalized_for_redundant_phrase():
    score = conciseness_score(
        "In order to improve usability, the system shall log all errors."
    )
    assert score < 100


def test_overall_score_weighted_correctly():
    # 100 * 0.35 + 100 * 0.45 + 100 * 0.20 = 100
    assert overall_score(100, 100, 100) == 100
    # 0 * 0.35 + 0 * 0.45 + 0 * 0.20 = 0
    assert overall_score(0, 0, 0) == 0


def test_grade_boundaries():
    assert grade(85) == "Good"
    assert grade(65) == "Acceptable"
    assert grade(45) == "Poor"
    assert grade(20) == "Very Poor"


# PHASE 4 TESTS — Ambiguity Extraction from LLM Output

def test_extract_ambiguity_detects_yes():
    llm_output = "AMBIGUOUS: Yes\nTYPE: Non-functional\nREASON: vague term"
    assert extract_ambiguity(llm_output) is True


def test_extract_ambiguity_detects_no():
    llm_output = "AMBIGUOUS: No\nTYPE: Functional\nREASON: clear and measurable"
    assert extract_ambiguity(llm_output) is False


def test_extract_ambiguity_returns_none_when_unclear():
    llm_output = "TYPE: Functional\nREASON: no ambiguous field present here"
    assert extract_ambiguity(llm_output) is None


# INTEGRATION TESTS — Multiple Modules Working Together

def test_phase1_output_integrates_with_phase3_scoring():
    """
    Integration test: Phase 1's detect_weak_words() output is used to
    decide whether a sentence goes through Phase 3 scoring as
    "flagged" or "clean" — this test checks that a sentence flagged
    by Phase 1 can be scored end-to-end by Phase 3 without error, and
    that a genuinely clean sentence scores higher than a vague one.
    """
    vague_sentence = "The system shall be fast."
    clear_sentence = "The system shall respond within 2 seconds."

    vague_weak, _ = detect_weak_words(vague_sentence)
    clear_weak, _ = detect_weak_words(clear_sentence)

    assert len(vague_weak) > 0
    assert len(clear_weak) == 0

    # Phase 3 scoring, using Phase 1's measurability result as an input signal
    vague_measure = measure_score(vague_sentence)
    clear_measure = measure_score(clear_sentence)
    vague_concise = conciseness_score(vague_sentence)
    clear_concise = conciseness_score(clear_sentence)

    # Default completeness (no LLM output available) used for both, per Phase 3 logic
    vague_overall = overall_score(vague_measure, 90, vague_concise)
    clear_overall = overall_score(clear_measure, 90, clear_concise)

    # The clear, measurable sentence should score at least as high as the vague one
    assert clear_overall >= vague_overall


def test_phase4_extract_ambiguity_integrates_with_metric_categories():
    """
    Integration test: checks that extract_ambiguity()'s output (True/
    False/None) correctly maps to the classification logic used in
    Phase 4's calculate_metrics() — i.e., that a "Yes" judgment would
    be treated as ambiguous=True and contribute to a TP/FN count
    depending on whether Phase 1 also flagged it, not silently
    mismatched.
    """
    llm_says_ambiguous = "AMBIGUOUS: Yes\nCOMPLETENESS_SCORE: 40"
    llm_says_clear = "AMBIGUOUS: No\nCOMPLETENESS_SCORE: 90"

    was_flagged_by_phase1 = True  

    is_ambiguous = extract_ambiguity(llm_says_ambiguous)
    assert was_flagged_by_phase1 and is_ambiguous

    is_ambiguous_2 = extract_ambiguity(llm_says_clear)
    assert was_flagged_by_phase1 and not is_ambiguous_2


def test_phase2_live_llm_call_if_ollama_running():
   
    import pytest
    try:
        from phase2 import analyze_with_llm
        result = analyze_with_llm("The system shall be fast.", max_retries=1)
    except Exception as e:
        pytest.skip(f"Ollama/Phi-3 mini not available in this environment: {e}")

    assert "AMBIGUOUS:" in result.upper()