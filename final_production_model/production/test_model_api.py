"""Tests for the model API.

Run from this directory:

    python -m pytest test_model_api.py -v

These use FastAPI's TestClient, which drives the app in-process. No server
needs to be running, and no port is bound -- so this is safe to run in CI.

What these tests are actually protecting:

1. The wire contract. Field names here (`anomaly_score`, `risk_level`, ...)
   are the exact names the Node caller reads. A rename in predict.py that
   silently broke the website would fail here first.

2. The validation boundary. Malformed input must be rejected (422) and never
   reach the model; merely *unusual* input must be scored, not rejected.
   Confusing those two is how a fraud detector starts throwing away the
   anomalies it exists to catch.

3. The failure mode. A broken model must surface as 503, never as a default
   "Low" verdict. An earlier version of the Node caller defaulted to "Low" on
   error, which made an outage look like a clean bill of health.
"""

import pytest
from fastapi.testclient import TestClient

from model_api import app

# A well-formed, unremarkable row. Individual tests copy and mutate it so each
# one states only the field it actually cares about.
BASE_ROW = {
    "device_type": "PC",
    "click_events": 12,
    "scroll_events": 5,
    "touch_events": 0,
    "keyboard_events": 40,
    "device_motion": 0,
    "time_on_page": 120,
    "screen_size": "1920x1080",
    "browser_info": "Chrome",
    "language": "English",
    "timezone_offset": -330,
    "device_orientation": "Landscape",
    "geolocation_city": "Mumbai",
    "transaction_amount": 5000,
    "transaction_date": "2026-08-14 10:00:00",
    "mouse_movement": 300,
}


@pytest.fixture(scope="module")
def client():
    """TestClient as a context manager so lifespan startup actually runs.

    Without the `with` block FastAPI skips lifespan, the model is never loaded,
    and every test would see a 503 -- passing tests that prove nothing.
    """
    with TestClient(app) as c:
        yield c


def row(**overrides):
    return {**BASE_ROW, **overrides}


# --------------------------------------------------------------------------
# Service health
# --------------------------------------------------------------------------


def test_health_reports_model_loaded(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True


def test_model_info_exposes_live_thresholds(client):
    """The point of this endpoint is confirming which config is *running*.

    Asserting the values rather than just the keys is deliberate: if someone
    edits HIGH_RISK_THRESHOLD without intending to, this test says so.
    """
    resp = client.get("/model-info")
    assert resp.status_code == 200
    body = resp.json()
    assert body["decision_threshold"] == pytest.approx(0.4)
    assert body["high_risk_threshold"] == pytest.approx(0.65)
    assert body["feature_count"] > 0


# --------------------------------------------------------------------------
# The contract the Node caller depends on
# --------------------------------------------------------------------------


def test_predict_returns_the_four_fields_node_reads(client):
    resp = client.post("/predict", json={"rows": [row()]})
    assert resp.status_code == 200

    results = resp.json()["results"]
    assert len(results) == 1

    r = results[0]
    assert set(r) == {
        "predicted_label",
        "anomaly_score",
        "risk_level",
        "risk_reason",
    }
    assert isinstance(r["anomaly_score"], float)
    assert 0.0 <= r["anomaly_score"] <= 1.0
    assert r["risk_level"] in {"Low", "Medium", "High"}


def test_results_are_positionally_aligned_with_input(client):
    """Callers match results to rows by index, so order is part of the contract."""
    rows = [
        row(transaction_amount=1),
        row(transaction_amount=500000),
        row(transaction_amount=100),
    ]
    resp = client.post("/predict", json={"rows": rows})
    assert resp.status_code == 200
    assert len(resp.json()["results"]) == 3


def test_scoring_is_deterministic(client):
    """Identical input must score identically.

    This is what makes the API a safe drop-in for the old spawn path: if these
    diverged, swapping transports would silently change verdicts.
    """
    payload = {"rows": [row()]}
    first = client.post("/predict", json=payload).json()["results"][0]
    second = client.post("/predict", json=payload).json()["results"][0]
    assert first["anomaly_score"] == second["anomaly_score"]
    assert first["risk_level"] == second["risk_level"]


# --------------------------------------------------------------------------
# Risk banding
# --------------------------------------------------------------------------


def test_risk_level_agrees_with_the_score_bands(client):
    """risk_level must be derivable from anomaly_score, not drift from it.

    Bands: <0.4 Low, 0.4-0.65 Medium, >=0.65 High. Asserting the relationship
    rather than a hardcoded verdict keeps this test valid after retraining,
    when the same input may legitimately score differently.
    """
    rows = [row(transaction_amount=amt) for amt in (0, 100, 5000, 250000, 999999)]
    results = client.post("/predict", json={"rows": rows}).json()["results"]

    for r in results:
        score, level = r["anomaly_score"], r["risk_level"]
        if score < 0.4:
            assert level == "Low"
        elif score < 0.65:
            assert level == "Medium"
        else:
            assert level == "High"


def test_flagged_rows_carry_a_reason_and_clean_rows_do_not(client):
    rows = [row(transaction_amount=amt) for amt in (0, 250000)]
    for r in client.post("/predict", json={"rows": rows}).json()["results"]:
        if r["predicted_label"] == 1:
            assert r["risk_reason"] != ""
        else:
            assert r["risk_reason"] == ""


# --------------------------------------------------------------------------
# Validation: reject broken data, score unusual data
# --------------------------------------------------------------------------


def test_missing_fields_are_accepted_and_defaulted(client):
    """Real browsers omit fields -- a denied location permission sends no city.

    predict.py imputes these, so rejecting them would discard usable data.
    """
    resp = client.post("/predict", json={"rows": [{"click_events": 5}]})
    assert resp.status_code == 200
    assert len(resp.json()["results"]) == 1


def test_empty_row_object_is_accepted(client):
    """Every field is optional, so `{}` is the fully-defaulted row."""
    resp = client.post("/predict", json={"rows": [{}]})
    assert resp.status_code == 200


def test_wrong_type_is_rejected_before_reaching_the_model(client):
    resp = client.post("/predict", json={"rows": [row(click_events="banana")]})
    assert resp.status_code == 422


def test_negative_values_are_rejected(client):
    """Training data had no negatives, so model behaviour there is undefined."""
    assert client.post(
        "/predict", json={"rows": [row(transaction_amount=-100)]}
    ).status_code == 422
    assert client.post(
        "/predict", json={"rows": [row(click_events=-1)]}
    ).status_code == 422


def test_empty_batch_is_rejected(client):
    """An empty list is a caller mistake, not a request to score nothing."""
    assert client.post("/predict", json={"rows": []}).status_code == 422


def test_oversized_batch_is_rejected(client):
    """Bounded work per request: one caller must not be able to stall the service."""
    assert client.post("/predict", json={"rows": [row()] * 101}).status_code == 422


def test_extreme_but_wellformed_values_are_scored_not_rejected(client):
    """The distinction this whole service depends on.

    50,000 clicks in one second is absurd -- and flagging absurd behaviour is
    the model's entire job. Rejecting it as invalid would throw away exactly
    the anomaly we are trying to catch.
    """
    resp = client.post("/predict", json={"rows": [row(click_events=50000)]})
    assert resp.status_code == 200
    assert resp.json()["results"][0]["risk_level"] in {"Low", "Medium", "High"}


# --------------------------------------------------------------------------
# user_history: the account-takeover signal
# --------------------------------------------------------------------------


def test_history_is_optional(client):
    """Omitting history must not fail; the deviation features degrade to 0."""
    assert client.post("/predict", json={"rows": [row()]}).status_code == 200


def test_history_is_accepted_and_scored(client):
    history = [row(device_type="PC", geolocation_city="Mumbai") for _ in range(3)]
    resp = client.post(
        "/predict", json={"rows": [row()], "user_history": history}
    )
    assert resp.status_code == 200


def test_a_new_device_scores_no_lower_than_a_familiar_one(client):
    """The account-takeover signal must actually move the needle.

    Same user, same behaviour, but a device and city never seen before should
    not look *safer* than the familiar case. Asserting >= rather than > keeps
    this honest: the feature is one input among many, and the test should not
    claim a strict increase the model does not guarantee.
    """
    history = [
        row(device_type="PC", browser_info="Chrome", geolocation_city="Mumbai")
        for _ in range(5)
    ]

    familiar = client.post(
        "/predict",
        json={
            "rows": [row(device_type="PC", browser_info="Chrome",
                         geolocation_city="Mumbai")],
            "user_history": history,
        },
    ).json()["results"][0]["anomaly_score"]

    unfamiliar = client.post(
        "/predict",
        json={
            "rows": [row(device_type="Mobile", browser_info="Safari",
                         geolocation_city="Chennai")],
            "user_history": history,
        },
    ).json()["results"][0]["anomaly_score"]

    assert unfamiliar >= familiar


def test_history_shorter_than_two_rows_is_safe(client):
    """Z-scores need >=2 history rows; fewer must degrade quietly, not crash."""
    for n in (0, 1):
        resp = client.post(
            "/predict",
            json={"rows": [row()], "user_history": [row()] * n},
        )
        assert resp.status_code == 200
