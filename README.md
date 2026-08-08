# Req-Intel

**An AI-Powered Framework for Requirement Quality Assurance and Ambiguity Detection**

Req-Intel is a hybrid tool that analyzes Software Requirements Specification (SRS) documents to detect ambiguous requirements and assess overall requirement quality. It combines rule-based Natural Language Processing with a locally hosted large language model, so requirement text is never sent to an external cloud API.

Final Year Project — Department of Software Engineering, Sindh Madressatul Islam University, Karachi (Batch 2022–2026).

## How It Works

Req-Intel processes an uploaded SRS document through a four-phase pipeline:

1. **Rule-Based Detection**  Scans requirement sentences for lexically vague terms (e.g., "fast", "user-friendly") using NLP techniques (tokenization, POS tagging, lemmatization), based on a taxonomy informed by ISO/IEC/IEEE 29148.
2. **LLM Contextual Analysis**  Re-evaluates flagged requirements using a locally hosted language model (Phi-3 mini, via Ollama) to confirm genuine ambiguity and suggest measurable rewrites.
3. **Quality Scoring**  Scores each requirement on measurability, completeness, and conciseness.
4. **Validation & Benchmarking**  Compares the rule-based detector's output against the LLM's judgments, reporting Precision, Recall, F1-score, and Accuracy.

## Tech Stack

**Backend:** Python, FastAPI, spaCy, NLTK, Ollama (Phi-3 mini), SQLite, ReportLab
**Frontend:** React (Vite), Tailwind CSS, Framer Motion, Axios

## Features

- Upload SRS documents in PDF, DOCX, or TXT format
- Real-time analysis progress tracking
- Detailed ambiguity detection with AI-suggested rewrites
- Quality scoring (measurability, completeness, conciseness)
- Automated validation benchmarking (Precision, Recall, F1, Accuracy)
- Downloadable PDF analysis reports
- Persistent analysis history

## Setup & Installation

### Prerequisites

- Python 3.x
- Node.js
- [Ollama](https://ollama.com) installed locally, with the `phi3:mini` model pulled:
  ```
  ollama pull phi3:mini
  ```

### Backend

```bash
pip install -r requirements.txt --break-system-packages
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Project Structure

```
Req-Intel/
├── phase1.py        # Rule-based ambiguity detection
├── phase2.py        # LLM contextual analysis
├── phase3.py        # Quality scoring
├── phase4.py        # Validation & benchmarking
├── database.py      # SQLite history storage
├── main.py          # PDF report generation
├── api.py            # FastAPI backend & endpoints
├── test_pipeline.py # Unit & integration tests
├── frontend/
│   └── src/
│       ├── pages/       # UploadPage, ResultsPage, HistoryPage
│       └── App.jsx
└── README.md
```

## Testing

Automated unit and integration tests are included (`test_pipeline.py`), covering Phase 1, Phase 3, and Phase 4 logic:

```bash
cd backend
pytest test_pipeline.py -v
```

## Team

- **Shahzeb** (BSE-22F-016)
- **Hamza Khan** (BSE-22F-035)

**Supervisor:** Ma'am Saima Sipy Nangraj

## License

This project is shared for academic and reference purposes.