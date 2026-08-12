"""
Honest evaluation of the COMBINED system (heuristic + judge + spotter) vs.
the judge alone, on the untouched held-out test set (synthetic_test_v2.csv).

Runs the full predict_v2.py pipeline (which now calls the spotter internally)
row by row on all 1,600 test sessions -- this is deliberately the exact same
code path production would use, not a shortcut reimplementation, so this
evaluation reflects what actually ships.

Per the design agreed earlier: does adding the spotter's independent
signal meaningfully improve on judge-alone, or does it mostly just add
false-alarm noise? Report real numbers either way -- if it doesn't help,
that's the honest result to know, not something to force.

"With user_history" is used throughout (same convention as
evaluate_production_model_v2.py's Scenario A) since the goal here is
comparing model/ensemble architectures on equal footing, not re-litigating
the history-integration gap already documented elsewhere.
"""
import pandas as pd
import numpy as np
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix

from predict_v2 import predict as predict_combined
from export_rf_production_model_v2 import add_user_baseline_features

TEST_FILE = 'synthetic_test_v2.csv'

RISK_TO_FLAG = {'Low': 0, 'Medium': 1, 'High': 1}  # Medium+High counts as "flagged" for recall/precision


def build_user_histories(df: pd.DataFrame) -> dict:
    """For each row, the list of that same user's STRICTLY earlier sessions
    (by transaction_date) -- mirrors the causal, no-future-peeking rule
    already enforced in add_user_baseline_features(). Built once here for
    evaluation speed; predict_v2.py's own add_user_baseline_features_live()
    applies the identical no-future-peeking contract at real serving time.
    """
    df_sorted = df.sort_values(['user_id', 'transaction_date'], kind='mergesort').reset_index(drop=True)
    histories = {}
    running = {}
    for i, row in df_sorted.iterrows():
        uid = row['user_id']
        histories[i] = list(running.get(uid, []))
        running.setdefault(uid, []).append(row.to_dict())
    return df_sorted, histories


def main():
    raw = pd.read_csv(TEST_FILE, parse_dates=['transaction_date'])
    y_true = None

    df_sorted, histories = build_user_histories(raw)
    y_true = df_sorted['label'].values
    personas = df_sorted['persona'].values

    judge_only_pred, judge_only_score = [], []
    combined_pred, combined_risk = [], []
    spotter_scores = []

    for i, row in df_sorted.iterrows():
        input_dict = row.drop(labels=['label', 'persona']).to_dict()
        input_dict['transaction_date'] = input_dict['transaction_date'].isoformat()
        history = [
            {k: (v.isoformat() if hasattr(v, 'isoformat') else v) for k, v in h.items() if k not in ('label', 'persona')}
            for h in histories[i]
        ]

        result = predict_combined(input_dict, user_history=history)

        judge_only_score.append(result['anomaly_score'])
        judge_only_pred.append(int(result['model_flagged']))

        combined_pred.append(RISK_TO_FLAG[result['risk_level']])
        combined_risk.append(result['risk_level'])
        spotter_scores.append(result['spotter_anomaly_score'])

    judge_only_pred = np.array(judge_only_pred)
    combined_pred = np.array(combined_pred)

    def report(name, y_pred):
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
        print(f"=== {name} ===")
        print(f"  Precision: {prec:.4f}   Recall: {rec:.4f}   F1: {f1:.4f}")
        print(f"  TP={tp}  FP={fp}  FN={fn}  TN={tn}")
        print()
        return {'precision': prec, 'recall': rec, 'f1': f1, 'tp': tp, 'fp': fp, 'fn': fn}

    print(f"Test set: {len(y_true)} rows, {y_true.sum()} real fraud cases\n")

    judge_stats = report("JUDGE ALONE (model_flagged, threshold=0.40)", judge_only_pred)
    combined_stats = report("COMBINED (heuristic + judge + spotter -> risk_level != Low)", combined_pred)

    # Which fraud cases did the combined system catch that judge-alone missed,
    # and vice versa -- the concrete, row-level evidence of whether the
    # spotter is pulling its weight or just adding noise.
    judge_missed_combined_caught = (judge_only_pred == 0) & (combined_pred == 1) & (y_true == 1)
    combined_missed_judge_caught = (combined_pred == 0) & (judge_only_pred == 1) & (y_true == 1)
    both_missed = (judge_only_pred == 0) & (combined_pred == 0) & (y_true == 1)

    print(f"Fraud caught by COMBINED but missed by judge alone: {judge_missed_combined_caught.sum()}")
    if judge_missed_combined_caught.sum() > 0:
        print(f"  personas: {list(personas[judge_missed_combined_caught])}")
    print(f"Fraud caught by judge alone but missed by COMBINED: {combined_missed_judge_caught.sum()} (should be 0 -- combined is a superset)")
    print(f"Fraud missed by BOTH: {both_missed.sum()}")
    if both_missed.sum() > 0:
        print(f"  personas: {list(personas[both_missed])}")
    print()

    extra_fp = (judge_only_pred == 0) & (combined_pred == 1) & (y_true == 0)
    print(f"Extra false alarms introduced by adding the spotter: {extra_fp.sum()}")
    print()

    print("=== Net verdict ===")
    d_recall = combined_stats['recall'] - judge_stats['recall']
    d_precision = combined_stats['precision'] - judge_stats['precision']
    print(f"Recall change:    {d_recall:+.4f}  ({judge_stats['tp']} -> {combined_stats['tp']} caught)")
    print(f"Precision change: {d_precision:+.4f}  ({judge_stats['fp']} -> {combined_stats['fp']} false alarms)")


if __name__ == '__main__':
    main()
