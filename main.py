from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to specific origins if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
def get_db_connection():
    conn = sqlite3.connect("riddles.db")
    conn.row_factory = sqlite3.Row
    return conn

class AnswerRequest(BaseModel):
    riddle: str
    answer: str

@app.get("/riddle/{length}")
def get_riddle(length: int):
    """Serve a random riddle from the database with an answer of specified length."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT question, answer FROM riddles WHERE LENGTH(answer) = ? ORDER BY RANDOM() LIMIT 1", (length,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"question": row["question"], "answer": row["answer"]}
    else:
        raise HTTPException(status_code=404, detail="No riddles found with the specified answer length")


@app.post("/check-answer")
def check_answer(request: AnswerRequest):
    """Check if the user's answer is correct by querying the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT answer FROM riddles WHERE question = ?", (request.riddle,))
    row = cursor.fetchone()
    conn.close()
    if row:
        correct_answer = row["answer"].strip().lower()
        user_answer = request.answer.strip().lower()
        return {"correct": correct_answer == user_answer}
    else:
        raise HTTPException(status_code=404, detail="Riddle not found")

