"""
KERANGKA serving model intent untuk tim Gen AI (FastAPI).
Model dilatih sendiri oleh tim Gen AI (scikit-learn, tanpa AutoML / model siap pakai),
disimpan sebagai `model/intent_pipeline.joblib` (Pipeline: preprocessing + vectorizer + classifier).
File model TIDAK di-commit -> unggah ke Google Drive, cantumkan tautannya di README.

Jalankan:  uvicorn app:app --host 0.0.0.0 --port 8000
Dokumentasi interaktif (Swagger): http://localhost:8000/docs
"""
import os
import re

import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

MODEL_PATH = os.getenv("MODEL_PATH", "model/intent_pipeline.joblib")

app = FastAPI(title="Halika.Clo Intent API", version="1.0.0")
model = None


class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500, examples=["aruna linen dress ukuran M masih ada?"])


class PredictResponse(BaseModel):
    intent: str = Field(..., examples=["tanya_stok"])
    confidence: float = Field(..., ge=0, le=1, examples=[0.91])


def preprocess(text: str) -> str:
    """HARUS sama persis dengan preprocessing saat training (lebih aman: masukkan ke dalam Pipeline)."""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


@app.on_event("startup")
def load_model():
    global model
    model = joblib.load(MODEL_PATH)


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict-intent", response_model=PredictResponse)
def predict_intent(req: PredictRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model belum dimuat")
    text = preprocess(req.text)
    if not text:
        raise HTTPException(status_code=422, detail="text kosong setelah preprocessing")
    proba = model.predict_proba([text])[0]
    idx = int(proba.argmax())
    return PredictResponse(intent=str(model.classes_[idx]), confidence=round(float(proba[idx]), 4))
