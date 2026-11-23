from fastapi import FastAPI
from pydantic import BaseModel, field_validator

app = FastAPI(title="Halika.Clo Intent Model Service")

class PredictRequest(BaseModel):
    text: str
    
    @field_validator("text")
    @classmethod
    def text_tidak_kosong(cls, v):
        if not v.strip():
            raise ValueError("Text tidak boleh kosong")
        return v

class PredictResponse(BaseModel):
    intent: str
    confidence: float
    
@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest): #DUMMY sementara
    return {"intent": "tanya_stok", "confidence": 0.9}
