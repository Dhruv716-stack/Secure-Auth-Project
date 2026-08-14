"""
The real test: does the spotter provide value on a fraud pattern NEITHER
the heuristic nor the judge was ever built to recognize?

Runs heuristic, judge, and spotter independently (not combined) against
synthetic_novel_fraud_test.csv (the mule_relay pattern), and reports each
one's standalone recall/precision -- plus, critically, which SPECIFIC
fraud rows each one catches, to see whether the spotter catches anything
the other two miss entirely.
"""
import pandas as pd
import numpy as np
from sklearn.metrics import precision_score, recall_score, average_precision_score, confusion_matrix

from predict_v2 import flag_obvious_anomalies, preprocess_input as judge_preprocess, model as judge_model, model_threshold
from predict_isolation_forest import preprocess_input as spotter_preprocess, anomaly_score as spotter_score_fn, iso_model

TEST_FILE = 'synthetic_novel_fraud_test.csv'


def main():
    df = pd.read_csv(TEST_FILE, parse_dates=['transaction_date'])
    y_true = df['label'].values
    personas = df['persona'].values

    heuristic_pred = np.zeros(len(df), dtype=int)
    judge_scores = np.zeros(len(df))
    judge_pred = np.zeros(len(df), dtype=int)
    spotter_scores = np.zeros(len(df))
    spotter_pred = np.zeros(len(df), dtype=int)

    for i, row in df.iterrows():
        input_dict = row.drop(labels=['label', 'persona']).to_dict()
        input_dict['transaction_date'] = input_dict['transaction_date'].isoformat()

        hit, _ = flag_obvious_anomalies(input_dict)
        heuristic_pred[i] = int(hit)

        # Judge alone -- no user_history, isolating the model's OWN raw
        # behavioral judgment on this single unseen session (fair comparison:
        # neither the heuristic nor spotter get cross-session history either)
        X_scaled, _ = judge_preprocess(input_dict, user_history=None)
        score = float(judge_model.predict_proba(X_scaled)[:, 1][0])
        judge_scores[i] = score
        judge_pred[i] = int(score >= model_threshold)

        X_iso = spotter_preprocess(input_dict)
        s_score = spotter_score_fn(X_iso)
        spotter_scores[i] = s_score
        spotter_pred[i] = int(iso_model.predict(X_iso)[0] == -1)

    def report(name, y_pred, y_score=None):
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
        print(f"=== {name} ===")
        print(f"  Precision: {prec:.4f}   Recall: {rec:.4f}   TP={tp} FP={fp} FN={fn}")
        if y_score is not None:
            pr_auc = average_precision_score(y_true, y_score)
            baseline = y_true.mean()
            print(f"  PR-AUC: {pr_auc:.4f}  (random baseline: {baseline:.4f}, {pr_auc/baseline:.1f}x)")
        print()

    print(f"Novel-fraud test set: {len(df)} rows, {y_true.sum()} mule_relay fraud cases "
          f"(pattern NEITHER model was trained on)\n")

    report("HEURISTIC alone", heuristic_pred)
    report("JUDGE alone", judge_pred, judge_scores)
    report("SPOTTER alone", spotter_pred, spotter_scores)

    fraud_mask = y_true == 1
    print("=== Per-fraud-case breakdown (all 20 mule_relay cases) ===")
    print(f"{'row':>4} {'heuristic':>10} {'judge_score':>12} {'judge_flag':>11} {'spotter_score':>14} {'spotter_flag':>13}")
    for idx in np.where(fraud_mask)[0]:
        print(f"{idx:>4} {bool(heuristic_pred[idx]):>10} {judge_scores[idx]:>12.4f} {bool(judge_pred[idx]):>11} "
              f"{spotter_scores[idx]:>14.4f} {bool(spotter_pred[idx]):>13}")

    print()
    caught_by_none = fraud_mask & (heuristic_pred == 0) & (judge_pred == 0) & (spotter_pred == 0)
    caught_only_by_spotter = fraud_mask & (heuristic_pred == 0) & (judge_pred == 0) & (spotter_pred == 1)
    print(f"Fraud cases caught by NONE of the three: {caught_by_none.sum()} / {fraud_mask.sum()}")
    print(f"Fraud cases caught ONLY by the spotter (heuristic+judge both silent): {caught_only_by_spotter.sum()} / {fraud_mask.sum()}")


if __name__ == '__main__':
    main()
