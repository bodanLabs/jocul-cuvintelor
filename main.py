from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import random

app = FastAPI()

# Enable CORS for all origins (adjust as needed for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)

class AnswerRequest(BaseModel):
    riddle_id: int
    answer: str

def get_random_riddle():
    conn = sqlite3.connect('riddles.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, question FROM riddles ORDER BY RANDOM() LIMIT 1")
    riddle = cursor.fetchone()
    conn.close()
    if riddle:
        return {"id": riddle[0], "question": riddle[1]}
    return None

def check_answer(riddle_id, user_answer):
    conn = sqlite3.connect('riddles.db')
    cursor = conn.cursor()
    cursor.execute("SELECT answer FROM riddles WHERE id = ?", (riddle_id,))
    result = cursor.fetchone()
    conn.close()
    return result and user_answer.strip().lower() == result[0].strip().lower()

@app.get("/get-riddle")
async def get_riddle():
    riddle = get_random_riddle()
    if not riddle:
        raise HTTPException(status_code=404, detail="No riddles found")
    return riddle

@app.post("/submit-answer")
async def submit_answer(request: AnswerRequest):
    if check_answer(request.riddle_id, request.answer):
        return {"result": "correct"}
    return {"result": "wrong"}
