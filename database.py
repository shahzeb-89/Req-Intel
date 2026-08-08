import sqlite3
import os
from datetime import datetime

DB_PATH = "req_intel.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            upload_date TEXT NOT NULL,
            total_requirements INTEGER,
            flagged INTEGER,
            clean INTEGER,
            srs_score INTEGER,
            srs_grade TEXT,
            precision_score REAL,
            recall_score REAL,
            f1_score REAL,
            accuracy_score REAL,
            report_path TEXT
        )
    """)
    conn.commit()
    conn.close()

def save_analysis(filename, total, flagged, clean, srs_score, srs_grade, phase4_metrics, report_path):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO analysis_history 
        (filename, upload_date, total_requirements, flagged, clean, srs_score, srs_grade,
         precision_score, recall_score, f1_score, accuracy_score, report_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        filename,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        total, flagged, clean, srs_score, srs_grade,
        phase4_metrics.get('precision', 0),
        phase4_metrics.get('recall', 0),
        phase4_metrics.get('f1_score', 0),
        phase4_metrics.get('accuracy', 0),
        report_path
    ))
    conn.commit()
    conn.close()

def get_all_history():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analysis_history ORDER BY id DESC")
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    conn.close()
    return [dict(zip(columns, row)) for row in rows]