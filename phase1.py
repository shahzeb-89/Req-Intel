import fitz  # pymupdf
from docx import Document as DocxDocument
import spacy
import nltk
from nltk.tokenize import sent_tokenize
import os
import re

nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)

nlp = spacy.load("en_core_web_sm")

# Weak/vague words list (ISO-based)
WEAK_WORDS = {
    "Performance": [
        "fast", "faster", "fastest", "quick", "quickly",
        "rapid", "rapidly", "slow", "responsive",
        "efficient", "efficiently", "performant"
    ],

    "Quantity": [
        "large", "larger", "small", "smaller", "few",
        "many", "several", "numerous", "adequate",
        "sufficient", "reasonable", "maximum", "minimum"
    ],

    "Quality": [
        "good", "better", "best", "poor",
        "acceptable", "appropriate", "proper",
        "correct", "optimal", "optimized"
    ],

    "Usability": [
        "easy", "easier", "simple", "user-friendly",
        "intuitive", "convenient", "straightforward",
        "smooth", "seamless"
    ],

    "Security": [
        "secure", "safe", "reliable",
        "robust", "stable", "accurate",
        "trustworthy"
    ],

    "Time": [
        "regularly", "frequently", "often",
        "sometimes", "occasionally",
        "immediately", "instantly",
        "soon", "periodically"
    ],
    "Scalability": [
        "scalable", "maintainable", "extensible",
        "flexible", "modular", "portable",
        "compatible", "interoperable"
    ],

    "General": [
        "standard", "normal", "abnormal", "typical",
        "usual", "common", "general", "generic",
        "basic", "advanced", "modern", "latest",
        "current", "updated", "improved", "enhanced",
        "low", "high", "always", "never"
    ]
}

def load_srs(filepath):
    if filepath.endswith(".pdf"):
        text = ""
        doc = fitz.open(filepath)
        for page in doc:
            text += page.get_text()
        return text
    elif filepath.endswith(".docx"):
        doc = DocxDocument(filepath)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text
    else:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()

def preprocess(text):
    sentences = sent_tokenize(text)
    # Remove empty lines and numbering
    cleaned = []
    for s in sentences:
        s = s.strip()
        if len(s) > 10 and any(word in s.lower() for word in ['shall', 'must', 'will', 'should']):
            cleaned.append(s)
    return cleaned

def has_measurement(sentence):
    sentence = sentence.lower()

    patterns = [
        r'\d+\s*(ms|milliseconds?|seconds?|minutes?|hours?)',
        r'\d+\s*%',
        r'\d+\s*(users?|requests?|transactions?)',
        r'\d+\s*(kb|mb|gb|tb)',
        r'within\s+\d+',
        r'at\s+least\s+\d+',
        r'no\s+more\s+than\s+\d+'
    ]

    for pattern in patterns:
        if re.search(pattern, sentence):
            return True

    return False

def detect_weak_words(sentence):

    doc = nlp(sentence.lower())

    found = []
    # categories = []
    pos_tags = []

    measurable = has_measurement(sentence)

    for token in doc:

        pos_tags.append(f"{token.text}({token.pos_})")

        # for category, words in WEAK_WORDS.items():
        for _, words in WEAK_WORDS.items():

            if token.lemma_ in words or token.text in words:

                # measurable requirement hai
                if measurable:

                    if token.text in [
                        "maximum",
                        "minimum",
                        "large",
                        "small"
                    ]:
                        continue

                found.append(token.text)

    return found, pos_tags
    

def analyze_srs(filepath):
    print(f"\n{'='*60}")
    print(f"Analyzing: {os.path.basename(filepath)}")
    print(f"{'='*60}")
    
    text = load_srs(filepath)
    sentences = preprocess(text)
    
    total = 0
    flagged = 0
    
    for i, sentence in enumerate(sentences, 1):
        weak, pos_tags = detect_weak_words(sentence)
        if weak:
            flagged += 1
            print(f"\n[REQ {i}] {sentence}")
            print(f"  POS Tags     : {' | '.join(pos_tags)}")
            print(f"  Weak words   : {weak}")
            # print(f"Category     : {categories}")
        total += 1
    
    print(f"\n--- Summary ---")
    print(f"Total Requirements : {total}")
    print(f"Flagged            : {flagged}")
    print(f"Clean              : {total - flagged}")
