"""
Production prediction -- judge (Random Forest) only.

History: earlier versions combined this model with a hand-written heuristic
rule (flag_obvious_anomalies) and an unsupervised "spotter" (Isolation
Forest), each running independently and merged only at a final decision
step. Both were REMOVED after evaluate_final_honest.py showed, on a
genuinely held-out test set (2,000 rows, 0 user/date/row overlap with
training -- see generate_final_honest_test.py):
  - The heuristic caught ZERO fraud cases the judge didn't already catch,
    while adding 11 extra false alarms (11 -> 22, precision 75% -> 60%,
    recall unchanged at 82.5%). Strictly harmful, not just redundant.
  - The spotter's one genuine strength (rapid_fire_relay-style unusually
    short sessions, see evaluate_spotter_acceptance_suite.py) is now
    covered by the judge's own is_short_session / transaction_per_min
    features after retraining; its other four tested patterns showed weak
    or no independent value, and keeping a second full model/pipeline
    running for that narrow, now-redundant benefit wasn't worth the
    ongoing maintenance cost (a second feature pipeline, a second set of
    saved artifacts, a second thing that can silently drift out of sync
    with the judge -- see train_isolation_forest.py's own imputation-gap
    fix for an example of exactly that risk).

Current judge model (trained on synthetic_train_v2.csv, 6 fraud personas
including rat_fraud) on the final honest test set:
  Recall 82.5%, Precision 75.0%, PR-AUC 0.835 (41.8x random baseline).

Retraining: run ../training/train_judge_model.py, which regenerates every
artifact this module loads below (copy the six output .pkl files here,
stripping the _v2 suffix, or update the load paths to point at
../training/ directly).
"""
import pickle
import pandas as pd
import numpy as np
import sys
import os

# Resolve relative to this file's own location, not the caller's working
# directory -- makes this module safely importable from other folders
# (e.g. ../evaluation/evaluate_judge.py), not just runnable standalone.
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

with open(f'{MODEL_DIR}/rf_model.pkl', 'rb') as f:
    model = pickle.load(f)

# The forest was pickled with n_jobs=-1 (fan every prediction out across all
# cores). That is tuned for scoring large datasets offline; for the small
# batches served here it is a net loss, because spawning and joining worker
# threads costs more than walking 300 shallow trees. Measured on one row:
# ~75ms with n_jobs=-1 versus ~32ms with n_jobs=1.
#
# This changes scheduling only -- the trees, the thresholds and therefore the
# scores are untouched. Revisit if batches ever grow large enough that the
# parallel split pays for itself.
model.n_jobs = 1
with open(f'{MODEL_DIR}/scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)
with open(f'{MODEL_DIR}/label_encoders.pkl', 'rb') as f:
    label_encoders = pickle.load(f)
with open(f'{MODEL_DIR}/feature_cols.pkl', 'rb') as f:
    feature_cols = pickle.load(f)
with open(f'{MODEL_DIR}/imputation_values.pkl', 'rb') as f:
    imputation_values = pickle.load(f)
with open(f'{MODEL_DIR}/decision_threshold.pkl', 'rb') as f:
    model_threshold = pickle.load(f)


# --- ML feature engineering (mirrors export_rf_production_model_v2.py exactly;
# obvious_anomaly_flag is never computed here -- see the leak this caused in
# the original model, documented in export_rf_production_model_v2.py) ---
def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['time_on_page_safe'] = df['time_on_page'].replace(0, 1)
    df['clicks_per_sec'] = df['click_events'] / df['time_on_page_safe']
    df['scrolls_per_sec'] = df['scroll_events'] / df['time_on_page_safe']
    df['touches_per_sec'] = df['touch_events'] / df['time_on_page_safe']
    df['keyboard_per_sec'] = df['keyboard_events'] / df['time_on_page_safe']
    df['interaction_score'] = (
        0.3 * df['click_events'] +
        0.2 * df['scroll_events'] +
        0.2 * df['touch_events'] +
        0.2 * df['keyboard_events'] +
        0.1 * df['mouse_movement'] +
        0.1 * df['device_motion']
    )
    df['is_odd_hour'] = pd.to_datetime(df['transaction_date']).dt.hour.isin([1, 2, 3]).astype(int)
    df['is_large_transaction'] = (df['transaction_amount'] > 10000).astype(int)
    df['is_short_session'] = (df['time_on_page'] < 30).astype(int)

    interaction_cols = ['click_events', 'scroll_events', 'touch_events', 'keyboard_events', 'mouse_movement', 'device_motion']
    df['interaction_diversity'] = df[interaction_cols].gt(0).sum(axis=1)
    main_interactions = df[['click_events', 'scroll_events', 'touch_events', 'keyboard_events', 'mouse_movement']]
    df['behavioural_consistency'] = main_interactions.min(axis=1) / (main_interactions.max(axis=1) + 1e-6)
    df['input_to_navigation_ratio'] = (df['keyboard_events'] + df['touch_events']) / (df['click_events'] + df['scroll_events'] + 1)
    df['active_to_passive_ratio'] = (df['click_events'] + df['keyboard_events'] + df['touch_events']) / (df['time_on_page'] + 1)
    df['session_complexity'] = df[interaction_cols].gt(5).sum(axis=1)
    df['transaction_per_min'] = df['transaction_amount'] / (df['time_on_page'] / 60 + 1)
    df['is_high_value_short_session'] = ((df['transaction_amount'] > 10000) & (df['time_on_page'] < 60)).astype(int)

    small_screens = {'360x640', '414x896', '390x844'}
    large_screens = {'1920x1080', '1440x900'}
    df['is_small_screen'] = df['screen_size'].isin(small_screens).astype(int)
    df['is_large_screen'] = df['screen_size'].isin(large_screens).astype(int)

    del df['time_on_page_safe']
    return df


def add_user_baseline_features_live(input_dict: dict, user_history: list[dict] | None) -> dict:
    """Live-serving counterpart to add_user_baseline_features() in the
    training script. Needs the user's OWN prior sessions to detect deviation
    from their personal baseline (this is what catches account-takeover-style
    fraud -- see export_rf_production_model_v2.py for the full rationale).

    INTEGRATION NOTE: `user_history` must be populated by the caller (e.g.
    the Node /api/transactions route) by fetching that user's recent
    modelInput rows from Postgres before invoking this script. As of this
    writing that fetch is NOT wired up in app/api/transactions/route.ts --
    it only sends the current session. Until that's connected, user_history
    will be None/empty here and these features safely degrade to "no
    deviation detected" (0), which is the honest answer when there is no
    history to compare against -- NOT a fabricated guess.
    """
    row = dict(input_dict)
    history = user_history or []

    for c in ['click_events', 'keyboard_events', 'time_on_page']:
        if len(history) >= 2:
            vals = np.array([h.get(c, 0) for h in history], dtype=float)
            mean, std = vals.mean(), max(vals.std(), 1e-6)
            row[f'{c}_user_zscore'] = float(np.clip((row.get(c, 0) - mean) / std, -6, 6))
        else:
            row[f'{c}_user_zscore'] = 0.0  # not enough history yet -- neutral, not a guess

    if history:
        prior_devices = {h.get('device_type') for h in history}
        prior_browsers = {h.get('browser_info') for h in history}
        prior_cities = {h.get('geolocation_city') for h in history}
        row['is_new_device_for_user'] = int(row.get('device_type') not in prior_devices)
        row['is_new_browser_for_user'] = int(row.get('browser_info') not in prior_browsers)
        row['is_new_city_for_user'] = int(row.get('geolocation_city') not in prior_cities)
    else:
        row['is_new_device_for_user'] = 0
        row['is_new_browser_for_user'] = 0
        row['is_new_city_for_user'] = 0

    row['identity_shift_count'] = (
        row['is_new_device_for_user'] + row['is_new_browser_for_user'] + row['is_new_city_for_user']
    )
    return row


def preprocess_input(input_dict: dict, user_history: list[dict] | None = None):
    input_dict = add_user_baseline_features_live(input_dict, user_history)
    df = pd.DataFrame([input_dict])
    for col in ['user_id', 'session_id', 'persona']:
        if col in df.columns:
            df = df.drop(columns=[col])
    for col, val in imputation_values.items():
        if col not in df.columns or pd.isnull(df.at[0, col]):
            df[col] = val
    df = engineer_features(df)
    for col, le in label_encoders.items():
        if col in df.columns:
            df[col] = df[col].astype(str).apply(lambda x: x if x in le.classes_ else 'unknown')
            df[col] = le.transform(df[col])
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0
    X = df[feature_cols]
    X_scaled = scaler.transform(X)
    return X_scaled, df


HIGH_RISK_THRESHOLD = 0.65


def assign_risk_level(score: float, flagged: bool) -> str:
    if not flagged:
        return 'Low'
    return 'High' if score >= HIGH_RISK_THRESHOLD else 'Medium'


def _build_result(model_score: float) -> dict:
    """Turn a raw probability into the response the callers consume.

    Shared by predict() and predict_many() so the two can never disagree about
    banding or wording.
    """
    model_flagged = model_score >= model_threshold
    return {
        'predicted_label': int(model_flagged),
        'anomaly_score': model_score,
        'risk_level': assign_risk_level(model_score, model_flagged),
        'risk_reason': 'Model detected unusual behavioral pattern' if model_flagged else '',
    }


def predict(input_dict: dict, user_history: list[dict] | None = None) -> dict:
    X_scaled, _ = preprocess_input(input_dict, user_history)
    model_score = float(model.predict_proba(X_scaled)[:, 1][0])
    return _build_result(model_score)


def preprocess_many(rows: list[dict], user_history: list[dict] | None = None):
    """Batch counterpart to preprocess_input: one DataFrame for all rows.

    Identical steps in an identical order -- the only difference is that pandas
    applies each one across every row at once instead of being re-entered per
    row. That is the whole speedup; no maths changes.

    The one thing that could not be copied verbatim is the imputation check.
    preprocess_input tests `df.at[0, col]`, which only inspects the single row
    it was given; here the same rule is applied per-cell with fillna, so a row
    with a missing value is filled without disturbing rows that have one.
    """
    prepared = [add_user_baseline_features_live(r, user_history) for r in rows]
    df = pd.DataFrame(prepared)

    for col in ['user_id', 'session_id', 'persona']:
        if col in df.columns:
            df = df.drop(columns=[col])

    for col, val in imputation_values.items():
        if col not in df.columns:
            df[col] = val
        else:
            df[col] = df[col].fillna(val)

    df = engineer_features(df)

    for col, le in label_encoders.items():
        if col in df.columns:
            df[col] = df[col].astype(str).apply(lambda x: x if x in le.classes_ else 'unknown')
            df[col] = le.transform(df[col])

    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0

    return scaler.transform(df[feature_cols]), df


def predict_many(rows: list[dict], user_history: list[dict] | None = None) -> list[dict]:
    """Score a batch in one pass. Results align positionally with `rows`.

    Prefer this over calling predict() in a loop. A RandomForest carries a
    large per-call cost -- dispatching 300 trees across worker threads and
    gathering the results -- that is paid once per *call*, not per row. On this
    model, predict_proba costs ~75ms for one row and ~75ms for a hundred, so a
    ten-row loop spends roughly ten times what a single batched call does.
    """
    if not rows:
        return []
    X_scaled, _ = preprocess_many(rows, user_history)
    scores = model.predict_proba(X_scaled)[:, 1]
    return [_build_result(float(s)) for s in scores]


if __name__ == '__main__':
    import json
    if len(sys.argv) == 2 and sys.argv[1].endswith('.json'):
        with open(sys.argv[1], 'r') as f:
            input_dict = json.load(f)
        result = predict(input_dict)
        print(json.dumps(result, indent=2))
    else:
        print('Usage: python predict_v2.py input.json')
