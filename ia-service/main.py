"""MandaRim — Serviço de IA (FastAPI).

Recebe vocabulário do backend e gera exercícios / frases de exemplo com o
Gemini. Sem GEMINI_API_KEY, responde com um gerador mock (source="mock").
"""
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import gemini

app = FastAPI(title="MandaRim IA Service", version="1.0.0")

# Liberado para todas as origens (o consumidor principal é o backend Node).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExerciseRequest(BaseModel):
    word: str
    pinyin: str = ""
    meaning: str = ""


class FlashcardRequest(BaseModel):
    word: str


@app.get("/")
def root():
    return {"name": "MandaRim IA Service", "status": "ok", "gemini": gemini.gemini_available()}


@app.get("/health")
def health():
    return {"status": "ok", "gemini": gemini.gemini_available(), "model": gemini.MODEL}


@app.post("/generate/exercise")
def generate_exercise(req: ExerciseRequest):
    return gemini.generate_exercise(req.word, req.pinyin, req.meaning)


@app.post("/generate/flashcard")
def generate_flashcard(req: FlashcardRequest):
    return gemini.generate_flashcard(req.word)
