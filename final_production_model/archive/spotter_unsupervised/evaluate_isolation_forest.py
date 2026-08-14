"""
Evaluation of the unsupervised spotter (Isolation Forest), ALONE -- the judge
model is not involved anywhere in this file.

Two genuinely different kinds of evaluation, kept clearly separate:

  PART A -- Label-free checks (what you can ask WITHOUT ever knowing what's
  really fraud): does the score distribution look sane? Is the model stable
  if trained on a different random slice of the same normal population? This
  is the only kind of check a true production deployment could rely on if it
  had zero confirmed fraud history yet.

  PART B -- Labeled grading (uses synthetic_test_v2.csv's 'label' column,
  which the spotter has NEVER seen during training). This is purely to grade
  the spotter's homework after the fact -- like an answer key a teacher uses,
  that the student never had access to while studying. Same metric family as
  the judge model (recall, precision, PR-AUC, confusion matrix) so the two
  are directly comparable later.
"""
import pickle
import numpy as np
import pandas as pd
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    average_precision_score, confusion_matrix,
)

from train_isolation_forest import engineer_features

with open('isolation_forest.pkl', 'rb') as f:
    iso = pickle.load(f)
with open('iso_scaler.pkl', 'rb') as f:
    iso_scaler = pickle.load(f)
with open('iso_label_encoders.pkl', 'rb') as f:
    iso_label_encoders = pickle.load(f)
with open('iso_feature_cols.pkl', 'rb') as f:
    iso_feature_cols = pickle.load(f)


def prep(df: pd.DataFrame):
    df = df.copy()
    for col in ['user_id', 'session_id', 'persona', 'label']:
        if col in df.columns:
            df = df.drop(columns=[col])
    df = engineer_features(df)
    for col, le in iso_label_encoders.items():
        if col in df.columns:
            df[col] = df[col].astype(str).apply(lambda x: x if x in le.classes_ else 'unknown')
            df[col] = le.transform(df[col])
    for col in iso_feature_cols:
        if col not in df.columns:
            df[col] = 0
    X = df[iso_feature_cols]
    return iso_scaler.transform(X)


def anomaly_score(X_scaled):
    """Convert Isolation Forest's raw decision_function (higher = more
    normal) into a 0-1 'unusualness' score (higher = more anomalous), same
    direction/convention as the judge model's anomaly_score, so the two are
    directly comparable later when combined."""
    raw = iso.decision_function(X_scaled)  # roughly in [-0.5, 0.5], higher = more normal
    return 1 / (1 + np.exp(10 * raw))       # squashed + flipped to 0-1, higher = more anomalous


print("=" * 78)
print("PART A -- Label-free checks (what the spotter's OWN training data says)")
print("=" * 78 + "\n")

train_df = pd.read_csv('synthetic_unsupervised_train.csv', parse_dates=['transaction_date'])
X_train = prep(train_df)
train_scores = anomaly_score(X_train)
train_preds = iso.predict(X_train)  # -1 anomaly, 1 normal

print(f"Training set size: {len(train_df)} (100% normal by construction, no labels)")
print(f"Score distribution: min={train_scores.min():.4f}  p50={np.percentile(train_scores,50):.4f}  "
      f"p95={np.percentile(train_scores,95):.4f}  p99={np.percentile(train_scores,99):.4f}  max={train_scores.max():.4f}")
print(f"Fraction flagged anomalous on its own training data: {(train_preds == -1).mean()*100:.2f}%  "
      f"(should sit close to the {1.5:.1f}% contamination prior -- large deviation would mean the model")
print(f"  isn't behaving as configured)")
print()

# Stability check: retrain on two different random halves of the SAME normal
# population, see if the two models roughly agree on WHICH sessions look
# unusual (not just how many).
from sklearn.ensemble import IsolationForest
rng = np.random.default_rng(7)
idx = rng.permutation(len(train_df))
half_a, half_b = idx[: len(idx)//2], idx[len(idx)//2:]

iso_a = IsolationForest(n_estimators=300, contamination=0.015, random_state=1).fit(X_train[half_a])
iso_b = IsolationForest(n_estimators=300, contamination=0.015, random_state=2).fit(X_train[half_b])

# Score a common third slice (the ORIGINAL full test set's normal rows would
# also work; using training data here since this check is purely about
# internal consistency, not fraud-catching ability) with both, compare rank
# correlation of their anomaly scores.
common_eval_idx = idx[: min(2000, len(idx))]
scores_a = 1 / (1 + np.exp(10 * iso_a.decision_function(X_train[common_eval_idx])))
scores_b = 1 / (1 + np.exp(10 * iso_b.decision_function(X_train[common_eval_idx])))
from scipy.stats import spearmanr
rho, _ = spearmanr(scores_a, scores_b)
print(f"Stability check: two Isolation Forests trained on different random halves of the same")
print(f"  normal population, scored on a shared slice -- rank correlation (Spearman) = {rho:.3f}")
print(f"  (close to 1.0 = model consistently agrees with itself on what looks unusual;")
print(f"   close to 0 = its notion of 'normal' is unstable/noisy)\n")


print("=" * 78)
print("PART B -- Labeled grading (test labels used ONLY to grade, never trained on)")
print("=" * 78 + "\n")

test_df = pd.read_csv('synthetic_test_v2.csv', parse_dates=['transaction_date'])
y_true = test_df['label'].values
X_test = prep(test_df)
test_scores = anomaly_score(X_test)

pr_auc = average_precision_score(y_true, test_scores)
roc_auc = roc_auc_score(y_true, test_scores)
baseline_pr_auc = y_true.mean()

print(f"Test set: {len(test_df)} rows, {y_true.sum()} real fraud rows ({y_true.mean()*100:.2f}%)\n")
print(f"ROC-AUC:  {roc_auc:.4f}")
print(f"PR-AUC:   {pr_auc:.4f}   (random baseline at this imbalance: {baseline_pr_auc:.4f}, "
      f"{pr_auc/baseline_pr_auc:.1f}x)\n")

# Use the model's own -1/+1 anomaly prediction (contamination-based cutoff,
# NOT a threshold tuned on these test labels -- staying honest to the
# "unsupervised" premise) for a concrete precision/recall/confusion matrix.
preds = iso.predict(X_test)
y_pred = (preds == -1).astype(int)

prec = precision_score(y_true, y_pred, zero_division=0)
rec = recall_score(y_true, y_pred, zero_division=0)
f1 = f1_score(y_true, y_pred, zero_division=0)
tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()

print(f"At the model's own contamination-based cutoff (1.5%, NOT tuned on test labels):")
print(f"  Precision: {prec:.4f}   (of everything flagged, how much was real fraud)")
print(f"  Recall:    {rec:.4f}   (of all real fraud, how much was flagged)")
print(f"  F1:        {f1:.4f}")
print()
print(f"  Confusion matrix:")
print(f"                    Predicted Normal   Predicted Anomaly")
print(f"    Actual Normal   {tn:>16d}   {fp:>17d}")
print(f"    Actual Fraud    {fn:>16d}   {tp:>17d}")
print()

# Break down performance by fraud persona, to see which TYPES of fraud the
# label-free spotter naturally catches vs misses -- useful diagnostic that
# has no equivalent in Part A, only possible because we have labels here.
if 'persona' in test_df.columns:
    print("Recall by fraud persona (grading-only breakdown):")
    fraud_mask = y_true == 1
    personas = test_df.loc[fraud_mask, 'persona'].values
    caught = y_pred[fraud_mask]
    for p in sorted(set(personas)):
        p_mask = personas == p
        p_total = p_mask.sum()
        p_caught = caught[p_mask].sum()
        print(f"  {p:20s}  {p_caught}/{p_total} caught  ({p_caught/p_total*100:.0f}%)")

print("\nDone.")
