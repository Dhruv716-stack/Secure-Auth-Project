"""
Evaluates the production judge model (../production/predict.py) against the
final honest test set (../data/test/final_honest_test.csv) -- a genuinely
separate file (disjoint user_id namespace, disjoint date range, zero exact-
row overlap with training, all verified in
../training/generate_final_honest_test.py's own leak checks).

Run from THIS directory: `python evaluate_judge.py`.

This is judge-ONLY, reflecting the current production pipeline after the
heuristic and unsupervised spotter were both removed -- see
../production/predict.py's docstring for why.
"""
import sys
import warnings
warnings.filterwarnings('ignore')

sys.path.insert(0, '../production')

import pandas as pd
import numpy as np
from sklearn.metrics import precision_score, recall_score, average_precision_score, confusion_matrix

from predict import engineer_features, label_encoders, feature_cols, imputation_values, scaler, model, model_threshold

TEST_FILE = '../data/test/final_honest_test.csv'


def judge_batch_scores(df: pd.DataFrame) -> np.ndarray:
    work = df.drop(columns=['label', 'persona'], errors='ignore').copy()
    for c in ['click_events_user_zscore', 'keyboard_events_user_zscore', 'time_on_page_user_zscore']:
        work[c] = 0.0
    for c in ['is_new_device_for_user', 'is_new_browser_for_user', 'is_new_city_for_user', 'identity_shift_count']:
        work[c] = 0
    for col in ['user_id', 'session_id']:
        if col in work.columns:
            work = work.drop(columns=[col])
    for col, val in imputation_values.items():
        if col not in work.columns or work[col].isnull().any():
            if col in work.columns:
                work[col] = work[col].fillna(val)
    work = engineer_features(work)
    for col, le in label_encoders.items():
        if col in work.columns:
            work[col] = work[col].astype(str).apply(lambda x: x if x in le.classes_ else 'unknown')
            work[col] = le.transform(work[col])
    for col in feature_cols:
        if col not in work.columns:
            work[col] = 0
    X = work[feature_cols]
    X_scaled = scaler.transform(X)
    return model.predict_proba(X_scaled)[:, 1]


def stats(y_true, y_pred, y_score=None):
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    pr_auc = average_precision_score(y_true, y_score) if y_score is not None else None
    return {'precision': prec, 'recall': rec, 'tp': tp, 'fp': fp, 'fn': fn, 'tn': tn, 'pr_auc': pr_auc}


if __name__ == '__main__':
    df = pd.read_csv(TEST_FILE, parse_dates=['transaction_date'])
    y_true = df['label'].values
    personas = df['persona'].values
    baseline = y_true.mean()

    judge_scores = judge_batch_scores(df)
    judge_pred = (judge_scores >= model_threshold).astype(int)

    print(f"=== Judge model on final honest test set: {len(df)} rows, {int(y_true.sum())} fraud cases "
          f"({baseline*100:.2f}%) ===\n")

    s = stats(y_true, judge_pred, judge_scores)
    print(f"Precision={s['precision']:.3f}  Recall={s['recall']:.3f}  "
          f"TP={s['tp']} FP={s['fp']} FN={s['fn']}  "
          f"PR-AUC={s['pr_auc']:.3f} ({s['pr_auc']/baseline:.1f}x random baseline)\n")

    print("--- Recall by fraud persona ---")
    fraud_mask = y_true == 1
    fraud_personas = personas[fraud_mask]
    caught = judge_pred[fraud_mask]
    for p in sorted(set(fraud_personas)):
        pm = fraud_personas == p
        n = pm.sum()
        print(f"  {p:20s} {caught[pm].sum()}/{n} caught")
