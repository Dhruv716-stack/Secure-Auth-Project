"""
Judge-alone and heuristic+judge-combined performance on ato_zelle and
rat_fraud -- BEFORE either pattern has ever been added to training data.
Batched (not row-by-row) to avoid the earlier n_jobs=-1 slowdown.
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

FILES = {'ato_zelle': 'synthetic_ato_zelle_test.csv', 'rat_fraud': 'synthetic_rat_fraud_test.csv'}


def judge_batch_scores(df: pd.DataFrame) -> np.ndarray:
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


def heuristic_batch(df: pd.DataFrame) -> np.ndarray:
    out = np.zeros(len(df), dtype=int)
    for i, row in df.iterrows():
        d = row.drop(labels=['label', 'persona'], errors='ignore').to_dict()
        d['transaction_date'] = pd.Timestamp(d['transaction_date']).isoformat()
        hit, _ = flag_obvious_anomalies(d)
        out[i] = int(hit)
    return out


def evaluate(name, path):
    df = pd.read_csv(path, parse_dates=['transaction_date'])
    y_true = df['label'].values

    heur_pred = heuristic_batch(df)
    judge_scores = judge_batch_scores(df)
    judge_pred = (judge_scores >= model_threshold).astype(int)
    combined_pred = ((heur_pred == 1) | (judge_pred == 1)).astype(int)

    def stats(y_pred, y_score=None):
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
        pr_auc = average_precision_score(y_true, y_score) if y_score is not None else None
        return prec, rec, tp, fp, fn, pr_auc

    baseline = y_true.mean()
    print(f"=== {name} ({int(y_true.sum())} fraud cases / {len(df)} rows, {baseline*100:.2f}% rate) ===")
    for label, pred, score in [('Heuristic alone', heur_pred, None), ('Judge alone', judge_pred, judge_scores),
                                ('Heuristic+Judge combined', combined_pred, None)]:
        prec, rec, tp, fp, fn, pr_auc = stats(pred, score)
        extra = f"  PR-AUC={pr_auc:.3f} ({pr_auc/baseline:.1f}x baseline)" if pr_auc is not None else ""
        print(f"  {label:26s} Precision={prec:.3f}  Recall={rec:.3f}  TP={tp} FP={fp} FN={fn}{extra}")
    print()
    return judge_scores, judge_pred, heur_pred, y_true


if __name__ == '__main__':
    for name, path in FILES.items():
        evaluate(name, path)
