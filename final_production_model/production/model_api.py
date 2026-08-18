"""HTTP service wrapping the fraud model.

WHY THIS EXISTS

Scoring a row costs ~66ms. Loading the model costs ~1550ms. The previous
design spawned a fresh `python predict_batch.py` per batch, so it paid that
1550ms every single run and threw the loaded model away afterwards -- roughly
95% of each run was startup overhead repaid for nothing.

A web service is simply a process that does not exit. The model is unpickled
once, at boot, and stays resident; every later request skips straight to the
66ms. That is the entire optimisation. Nothing about HTTP is special here --
HTTP is just how the long-lived process is reached.

RUN

    uvicorn model_api:app --port 8000        # from this directory

Interactive docs are served at /docs.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from schemas import (
    HealthResponse,
    ModelInfoResponse,
    PredictRequest,
    PredictResponse,
)

logger = logging.getLogger("model_api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# Populated once during startup. Kept module-level so every request handler
# reads the same resident model rather than reloading it.
_model = {"predict": None, "loaded": False, "error": None}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the model once, before the service accepts traffic.

    Importing predict.py is what unpickles the model, so the cost lands here
    rather than on the first unlucky request. A failure is recorded instead of
    raised: the service still starts, /health reports the problem, and /predict
    returns 503. That is deliberate -- a service that reports "I am broken" is
    far more debuggable than one that refuses to start with no endpoint to ask.
    """
    try:
        import predict as predict_module

        _model["predict"] = predict_module.predict
        _model["module"] = predict_module
        _model["loaded"] = True
        logger.info("Model loaded; service ready.")
    except Exception as exc:  # noqa: BLE001 - surfaced via /health and /predict
        _model["error"] = str(exc)
        logger.exception("Model failed to load; /predict will return 503.")
    yield


app = FastAPI(
    title="SecureAuth Fraud Model API",
    description="Behavioural fraud scoring. The model is loaded once at startup.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Liveness probe.

    Deliberately trivial and dependency-free so it answers even when the model
    failed to load -- that is precisely when you need to ask. Also the way to
    warm a cold-started container before it serves real traffic.
    """
    return HealthResponse(
        status="ok" if _model["loaded"] else "degraded",
        model_loaded=_model["loaded"],
    )


@app.get("/model-info", response_model=ModelInfoResponse)
def model_info() -> ModelInfoResponse:
    """Report the thresholds this process is actually applying.

    Confirms which configuration is live. `decision_threshold` is learned
    during training and read from decision_threshold.pkl; HIGH_RISK_THRESHOLD
    is a hand-set policy boundary. Reading them from the loaded module rather
    than restating them keeps this honest if either changes.
    """
    if not _model["loaded"]:
        raise HTTPException(status_code=503, detail="Model not loaded")
    m = _model["module"]
    return ModelInfoResponse(
        decision_threshold=float(m.model_threshold),
        high_risk_threshold=float(m.HIGH_RISK_THRESHOLD),
        feature_count=len(m.feature_cols),
    )


@app.post("/predict", response_model=PredictResponse)
def score(request: PredictRequest) -> PredictResponse:
    """Score a batch of behavioural rows.

    POST rather than GET because rows are data, not identifiers: a batch is far
    too large for a URL, and URLs land in access logs, which is the wrong place
    for user behavioural data.

    Results are positionally aligned with `request.rows`. Malformed input is
    rejected by Pydantic before reaching this handler (422). A model failure
    returns 503 rather than a default verdict -- an earlier version of the Node
    caller fell back to "Low" on error, which made a broken model look like a
    safe one. Silence is the dangerous failure mode here.
    """
    if not _model["loaded"]:
        raise HTTPException(
            status_code=503,
            detail=f"Model not loaded: {_model['error']}",
        )

    history = (
        [h.model_dump() for h in request.user_history] if request.user_history else None
    )

    try:
        results = [_model["predict"](row.model_dump(), history) for row in request.rows]
    except Exception as exc:  # noqa: BLE001 - converted to an explicit 5xx
        logger.exception("Scoring failed")
        raise HTTPException(status_code=500, detail=f"Scoring failed: {exc}") from exc

    return PredictResponse(results=results)


@app.get("/")
def root() -> JSONResponse:
    return JSONResponse(
        {"service": "SecureAuth Fraud Model API", "docs": "/docs", "health": "/health"}
    )
