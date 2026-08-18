"""Request/response contract for the model API.

Validation philosophy: check TYPES, allow ABSENCE.

predict.py already imputes missing columns (see `imputation_values` in
preprocess_input) and maps unseen categories to 'unknown'. Real browser data
legitimately lacks fields -- a user who denies location permission sends no
geolocation_city. Rejecting those rows would discard data the model handles
correctly, so every field here is optional with a neutral default.

What we DO reject is malformed data: a string where a number belongs, a
negative transaction amount, or a batch large enough to stall the service.
Validation catches data that is broken; the model judges data that is merely
suspicious. High event counts are not a validation error -- they are exactly
the anomaly the model exists to flag.
"""

from pydantic import BaseModel, Field


class BehaviorRow(BaseModel):
    """One second of observed session behaviour.

    Mirrors the columns of the `modelInput` table and the feature names the
    model was trained on.

    Every field defaults to None, meaning "not observed", and such fields are
    dropped before reaching the model so predict.py imputes them from the
    training distribution. That distinction matters: a defaulted 0 is not
    missing data, it is a positive claim that the user clicked nothing, moved
    nothing and spent no time on the page. That profile reads as a bot, and
    the model rightly flags it -- so defaulting to zero made every request
    from a caller without behavioural data score High.
    """

    device_type: str | None = None
    click_events: int | None = Field(None, ge=0)
    scroll_events: int | None = Field(None, ge=0)
    touch_events: int | None = Field(None, ge=0)
    keyboard_events: int | None = Field(None, ge=0)
    device_motion: float | None = None
    time_on_page: int | None = Field(None, ge=0)
    screen_size: str | None = None
    browser_info: str | None = None
    language: str | None = None
    timezone_offset: int | None = None
    device_orientation: str | None = None
    geolocation_city: str | None = None
    # Negative amounts never appeared in training, so model behaviour there is
    # undefined. Reject rather than score something meaningless.
    transaction_amount: float | None = Field(None, ge=0)
    transaction_date: str | None = None
    mouse_movement: int | None = Field(None, ge=0)

    def to_model_input(self) -> dict:
        """Drop unobserved fields so predict.py can impute them."""
        return {k: v for k, v in self.model_dump().items() if v is not None}


class PredictRequest(BaseModel):
    """A batch to score, plus the history needed to personalise it.

    `user_history` carries that user's OWN earlier sessions. predict.py uses it
    to measure deviation from their personal baseline -- new device, new city,
    unusual click volume -- which is what catches account-takeover fraud. It
    must EXCLUDE the session being scored: if the current session is present,
    its device is trivially "already seen" and the signal silently dies.

    Omitting it is safe but weakens detection: the deviation features degrade
    to 0 ("no deviation observed"), which is honest rather than a guess.
    Z-score features additionally need at least 2 history rows.
    """

    # Upper bound is a safety valve: at ~66ms per row, 100 rows is ~6.6s. An
    # unbounded list would let one request stall the service for everyone.
    rows: list[BehaviorRow] = Field(..., min_length=1, max_length=100)
    user_history: list[BehaviorRow] | None = None


class RiskResult(BaseModel):
    """One scored row. Field names match predict.py's return value exactly."""

    predicted_label: int
    anomaly_score: float
    risk_level: str
    risk_reason: str


class PredictResponse(BaseModel):
    """Results are positionally aligned with the submitted `rows`."""

    results: list[RiskResult]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool


class ModelInfoResponse(BaseModel):
    """Thresholds the running service is actually applying.

    Lets a caller confirm which configuration is live rather than assuming the
    deployed copy matches the repository.
    """

    decision_threshold: float
    high_risk_threshold: float
    feature_count: int
