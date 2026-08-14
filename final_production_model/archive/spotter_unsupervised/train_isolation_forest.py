"""
Train the unsupervised "spotter" -- an Isolation Forest that learns what
normal behavior looks like from synthetic_unsupervised_train.csv (normal-only,
no labels), and flags sessions that are easy to "isolate" from the rest as
anomalous.

This is DELIBERATELY a separate, independent pipeline from
export_rf_production_model_v2.py (the supervised "judge"):
  - Different training file (normal-only, no fraud personas, no labels).
  - Its own scaler/label-encoders/feature list, saved with an `_iso` suffix,
    so it never shares artifacts with the judge model.
  - No decision threshold tuned against labels here -- contamination
    (expected anomaly rate) is set as a prior assumption, which is the
    correct way to configure this class of model when no labels exist for
    threshold-tuning. We still evaluate against labels afterward (in
    evaluate_isolation_forest.py) but ONLY for grading, never for training
    or threshold selection here.

Per-user baseline features (is_new_device_for_user, etc.) are NOT included
here -- those were built specifically to help the supervised judge use
labeled examples of account-takeover to learn what matters. The spotter's
job is different: notice ANY session that doesn't resemble the bulk of
observed normal behavior, using only the general behavioral feature set.
Keeping the two feature sets different is intentional, not an oversight --
it's what gives the two models different blind spots, which is the whole
point of layering them.

Fix: this version adds a saved imputation strategy, mirroring the judge
model (export_rf_production_model_v2.py). synthetic_unsupervised_train.csv
happens to have zero missing values, so training itself never exercised
this gap -- but real production sessions can arrive with missing fields (a
browser blocking device-motion tracking, a session ending before some
counters populate). Without this, a missing value at real prediction time
would crash the pipeline. See predict_isolation_forest.py, the first real
live-serving script for the spotter (only training and offline grading
existed before).
"""
import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder

RANDOM_STATE = 42
TRAIN_FILE = 'synthetic_unsupervised_train.csv'

# Prior assumption of how much of real traffic is anomalous -- NOT tuned
# against test labels (that would defeat the purpose of "unsupervised").
# 1.5% mirrors the anomaly rate used when generating the supervised judge's
# training data, kept consistent as a reasonable real-world estimate, not
# fitted to this specific test set.
CONTAMINATION = 0.015


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Same general behavioral feature engineering as the judge model
    (export_rf_production_model_v2.py), MINUS the per-user baseline features
    -- see module docstring for why those are deliberately excluded here."""
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
    df['is_odd_hour'] = df['transaction_date'].dt.hour.isin([1, 2, 3]).astype(int)
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


if __name__ == '__main__':
    df = pd.read_csv(TRAIN_FILE, parse_dates=['transaction_date'])
    for col in ['user_id', 'session_id']:
        if col in df.columns:
            df = df.drop(columns=[col])

    # --- Imputation values, computed on RAW columns BEFORE feature engineering
    # (same order as export_rf_production_model_v2.py) -- so a missing raw
    # field can be filled in before any derived feature (like clicks_per_sec)
    # tries to divide by it. Count-like fields fill with 0 (a sensible neutral
    # guess -- "we don't know how many clicks, assume none" is safer than
    # inventing a number); other numeric fields fill with the training mean;
    # categorical fields fill with the most common value seen in training. ---
    imputation_values = {}
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    count_like = ['click_events', 'scroll_events', 'touch_events', 'keyboard_events', 'mouse_movement']
    for col in numeric_cols:
        imputation_values[col] = 0 if col in count_like else df[col].mean()

    categorical_cols_raw = df.select_dtypes(include=['object']).columns.tolist()
    for col in categorical_cols_raw:
        imputation_values[col] = df[col].mode()[0]
    if 'transaction_date' in df.columns:
        imputation_values['transaction_date'] = df['transaction_date'].mode()[0]

    for col, val in imputation_values.items():
        if col in df.columns:
            df[col] = df[col].fillna(val)

    df = engineer_features(df)

    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    label_encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        values = df[col].astype(str).unique().tolist()
        if 'unknown' not in values:
            values.append('unknown')
        le.fit(values)
        df[col] = le.transform(df[col].astype(str))
        label_encoders[col] = le

    feature_cols = [c for c in df.columns if c != 'transaction_date']
    assert 'obvious_anomaly_flag' not in feature_cols
    assert 'is_new_device_for_user' not in feature_cols  # confirms feature-set separation from the judge

    X = df[feature_cols]
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    print(f"Training rows: {len(X)}  |  features: {len(feature_cols)}  |  contamination prior: {CONTAMINATION}")
    print(f"Feature columns: {feature_cols}\n")

    iso = IsolationForest(
        n_estimators=300,
        contamination=CONTAMINATION,
        max_samples='auto',
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    iso.fit(X_scaled)

    with open('isolation_forest.pkl', 'wb') as f:
        pickle.dump(iso, f)
    with open('iso_scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)
    with open('iso_label_encoders.pkl', 'wb') as f:
        pickle.dump(label_encoders, f)
    with open('iso_imputation_values.pkl', 'wb') as f:
        pickle.dump(imputation_values, f)
    with open('iso_feature_cols.pkl', 'wb') as f:
        pickle.dump(feature_cols, f)

    # Sanity check on its OWN training data (label-free): what fraction does
    # it flag on the data it was trained on, and how are raw scores spread?
    raw_scores = iso.decision_function(X_scaled)   # higher = more normal
    preds = iso.predict(X_scaled)                   # -1 = anomaly, 1 = normal
    flagged_rate = (preds == -1).mean()
    print(f"On its OWN training data (should be ~all normal):")
    print(f"  Flagged as anomalous: {flagged_rate*100:.2f}%  (contamination prior was {CONTAMINATION*100:.2f}%)")
    print(f"  Raw score range: min={raw_scores.min():.3f}  max={raw_scores.max():.3f}  "
          f"mean={raw_scores.mean():.3f}  std={raw_scores.std():.3f}")
    print("\nIsolation Forest spotter trained and saved.")
