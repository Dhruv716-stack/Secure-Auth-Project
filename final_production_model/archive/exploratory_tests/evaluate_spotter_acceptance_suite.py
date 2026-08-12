"""
Runs heuristic, judge, and spotter independently against all 5 novel fraud
patterns in the acceptance suite (see generate_spotter_acceptance_suite.py),
none of which either model was trained/shaped on. Reports each system's
standalone recall/precision/PR-AUC per pattern.

Rewritten as a BATCH evaluation (whole file scored in one vectorized pass)
rather than row-by-row through predict_v2.py/predict_isolation_forest.py's
single-row predict() functions. The row-by-row version technically worked
but was catastrophically slow: both models were saved with n_jobs=-1, so
every single-row .predict_proba()/.predict() call re-spun a fresh joblib
worker pool for a batch of size 1, across 8,000 total rows (5 files x 1,600
rows) -- this is what produced 2GB of repeated joblib warnings and no
finished output. Batching restores normal, fast inference.
"""
import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
from sklearn.metrics import precision_score, recall_score, average_precision_score, confusion_matrix

from predict_v2 import flag_obvious_anomalies, engineer_features as judge_engineer_features
from predict_v2 import label_encoders as judge_label_encoders, feature_cols as judge_feature_cols
from predict_v2 import imputation_values as judge_imputation_values, scaler as judge_scaler
from predict_v2 import model as judge_model, model_threshold

from train_isolation_forest import engineer_features as iso_engineer_features
from predict_isolation_forest import iso_label_encoders, iso_feature_cols, iso_imputation_values
from predict_isolation_forest import iso_scaler, iso_model

PATTERNS = ['mule_relay', 'rapid_fire_relay', 'dormant_reactivation', 'slow_drain', 'new_recipient_burst']


def judge_batch_scores(df: pd.DataFrame) -> np.ndarray:
    """Batched version of predict_v2.preprocess_input + model.predict_proba,
    with user_history=None (no per-user baseline features -- neutral 0s,
    matching how the earlier single-pattern test isolated the model's own
    raw judgment without cross-session history)."""
    work = df.drop(columns=['label', 'persona'], errors='ignore').copy()
    for c in ['click_events_user_zscore', 'keyboard_events_user_zscore', 'time_on_page_user_zscore']:
        work[c] = 0.0
    for c in ['is_new_device_for_user', 'is_new_browser_for_user', 'is_new_city_for_user', 'identity_shift_count']:
        work[c] = 0
    for col in ['user_id', 'session_id']:
        if col in work.columns:
            work = work.drop(columns=[col])
    for col, val in judge_imputation_values.items():
        if col not in work.columns or work[col].isnull().any():
            if col in work.columns:
                work[col] = work[col].fillna(val)
    work = judge_engineer_features(work)
    for col, le in judge_label_encoders.items():
        if col in work.columns:
            work[col] = work[col].astype(str).apply(lambda x: x if x in le.classes_ else 'unknown')
            work[col] = le.transform(work[col])
    for col in judge_feature_cols:
        if col not in work.columns:
            work[col] = 0
    X = work[judge_feature_cols]
    X_scaled = judge_scaler.transform(X)
    return judge_model.predict_proba(X_scaled)[:, 1]


def spotter_batch_scores(df: pd.DataFrame):
    work = df.drop(columns=['label', 'persona'], errors='ignore').copy()
    for col in ['user_id', 'session_id']:
        if col in work.columns:
            work = work.drop(columns=[col])
    for col, val in iso_imputation_values.items():
        if col not in work.columns or work[col].isnull().any():
            if col in work.columns:
                work[col] = work[col].fillna(val)
    work = iso_engineer_features(work)
    for col, le in iso_label_encoders.items():
        if col in work.columns:
            work[col] = work[col].astype(str).apply(lambda x: x if x in le.classes_ else 'unknown')
            work[col] = le.transform(work[col])
    for col in iso_feature_cols:
        if col not in work.columns:
            work[col] = 0
    X = work[iso_feature_cols]
    X_scaled = iso_scaler.transform(X)
    raw = iso_model.decision_function(X_scaled)  # higher = more normal
    scores = 1 / (1 + np.exp(10 * raw))
    preds = iso_model.predict(X_scaled)  # -1 anomaly, 1 normal
    return scores, (preds == -1).astype(int)


def heuristic_batch(df: pd.DataFrame) -> np.ndarray:
    out = np.zeros(len(df), dtype=int)
    for i, row in df.iterrows():
        d = row.drop(labels=['label', 'persona'], errors='ignore').to_dict()
        d['transaction_date'] = pd.Timestamp(d['transaction_date']).isoformat()
        hit, _ = flag_obvious_anomalies(d)
        out[i] = int(hit)
    return out


def evaluate_one(csv_path):
    df = pd.read_csv(csv_path, parse_dates=['transaction_date'])
    y_true = df['label'].values

    heuristic_pred = heuristic_batch(df)

    judge_scores = judge_batch_scores(df)
    judge_pred = (judge_scores >= model_threshold).astype(int)

    spotter_scores, spotter_pred = spotter_batch_scores(df)

    def stats(y_pred, y_score=None):
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
        pr_auc = average_precision_score(y_true, y_score) if y_score is not None else None
        return {'precision': prec, 'recall': rec, 'tp': tp, 'fp': fp, 'fn': fn, 'pr_auc': pr_auc}

    heur_stats = stats(heuristic_pred)
    judge_stats = stats(judge_pred, judge_scores)
    spotter_stats = stats(spotter_pred, spotter_scores)

    caught_only_spotter = ((y_true == 1) & (heuristic_pred == 0) & (judge_pred == 0) & (spotter_pred == 1)).sum()
    caught_by_none = ((y_true == 1) & (heuristic_pred == 0) & (judge_pred == 0) & (spotter_pred == 0)).sum()
    baseline = y_true.mean()

    return {
        'n': len(df), 'n_fraud': int(y_true.sum()), 'baseline': baseline,
        'heuristic': heur_stats, 'judge': judge_stats, 'spotter': spotter_stats,
        'caught_only_spotter': int(caught_only_spotter), 'caught_by_none': int(caught_by_none),
    }


if __name__ == '__main__':
    results = {}
    for p in PATTERNS:
        path = f'synthetic_novel_{p}_test.csv'
        print(f"Evaluating: {p} ...", flush=True)
        results[p] = evaluate_one(path)

    print()
    print("=" * 100)
    print(f"{'Pattern':22s} {'Fraud':>6} {'Heur R':>8} {'Judge R':>9} {'Judge PRAUC':>12} "
          f"{'Spot R':>8} {'Spot PRAUC':>11} {'Spot-only':>10} {'None':>6}")
    print("=" * 100)
    for p, r in results.items():
        print(f"{p:22s} {r['n_fraud']:>6} "
              f"{r['heuristic']['recall']:>8.3f} "
              f"{r['judge']['recall']:>9.3f} {r['judge']['pr_auc']:>12.3f} "
              f"{r['spotter']['recall']:>8.3f} {r['spotter']['pr_auc']:>11.3f} "
              f"{r['caught_only_spotter']:>10} {r['caught_by_none']:>6}")
    print()
    print("Spot-only = fraud cases caught ONLY by the spotter (heuristic AND judge both silent)")
    print("None = fraud cases caught by NONE of the three systems")
    print()

    print("=== Verdict per pattern: is the spotter earning its place here? ===")
    for p, r in results.items():
        spotter_prauc_x = r['spotter']['pr_auc'] / r['baseline'] if r['baseline'] > 0 else 0
        judge_prauc_x = r['judge']['pr_auc'] / r['baseline'] if r['baseline'] > 0 else 0
        if r['caught_only_spotter'] > 0:
            verdict = f"YES -- caught {r['caught_only_spotter']} case(s) the other two missed entirely"
        elif spotter_prauc_x > 3 and spotter_prauc_x >= judge_prauc_x * 0.5:
            verdict = f"PARTIAL -- real signal ({spotter_prauc_x:.1f}x baseline) but judge still stronger or comparable"
        elif spotter_prauc_x > 3:
            verdict = f"WEAK -- some signal above random ({spotter_prauc_x:.1f}x) but judge dominates ({judge_prauc_x:.1f}x)"
        else:
            verdict = f"NO -- barely above random guessing ({spotter_prauc_x:.1f}x baseline)"
        print(f"  {p:22s} {verdict}")
