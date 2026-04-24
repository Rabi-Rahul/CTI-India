import os
from threading import Lock

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

_predictor = None
_predictor_lock = Lock()


class PredictRequest(BaseModel):
    description: str = Field(min_length=5, max_length=10000)
    product: str = Field(min_length=1, max_length=500)
    cvss: float = Field(ge=0.0, le=10.0)


class PredictResponse(BaseModel):
    risk_score: float
    priority: str
    probability: str


def _resolve_priority(risk_score: float) -> str:
    if risk_score >= 70:
        return "Critical"
    if risk_score >= 35:
        return "Medium"
    return "Low"


def _resolve_probability(risk_score: float) -> str:
    if risk_score >= 66:
        return "High"
    if risk_score >= 33:
        return "Medium"
    return "Low"


def _get_predictor():
    global _predictor

    if _predictor is not None:
        return _predictor

    with _predictor_lock:
        if _predictor is not None:
            return _predictor

        try:
            # Import lazily so app startup does not fail if ML deps are missing.
            from ml.step_6_prediction import CVEPredictor

            model_dir = os.path.normpath(
                os.path.join(os.path.dirname(__file__), "..", "ml", "models")
            )
            _predictor = CVEPredictor(model_dir=model_dir)
            return _predictor
        except Exception as exc:
            raise RuntimeError(f"Failed to initialize prediction model: {exc}") from exc


@router.post("/predict", response_model=PredictResponse)
def predict_vulnerability(payload: PredictRequest):
    description = payload.description.strip()
    product = payload.product.strip()

    if not description or not product:
        raise HTTPException(status_code=400, detail="Description and product are required")

    try:
        predictor = _get_predictor()
        prediction = predictor.predict(
            cve_id="UI_INPUT",
            cvss_score=payload.cvss,
            description=description,
            product=product,
        )

        risk_score = float(prediction["risk_score"])
        return {
            "risk_score": round(risk_score, 2),
            "priority": _resolve_priority(risk_score),
            "probability": _resolve_probability(risk_score),
        }
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc