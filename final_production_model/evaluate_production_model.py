import pickle
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

# Load artifacts
with open('rf_model.pkl', 'rb') as f:
    model = pickle.load(f)
with open('scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)
with open('label_encoders.pkl', 'rb') as f:
    label_encoders = pickle.load(f)
with open('feature_cols.pkl', 'rb') as f:
    feature_cols = pickle.load(f)
with open('imputation_values.pkl', 'rb') as f:
    imputation_values = pickle.load(f)

def flag_obvious_anomalies(df):
    flag = np.zeros(len(df), dtype=int)
    for i, row in df.iterrows():
        if (row['transaction_amount'] > 10000) and (pd.to_datetime(row['transaction_date']).hour in [1,2,3]):
            flag[i] = 1
        elif (row['click_events'] >= 30) or (row['mouse_movement'] >= 1500):
            flag[i] = 1
        elif (row['device_type'] == 'Mobile' and row['touch_events'] >= 20):
            flag[i] = 1
        elif (row['device_type'] == 'Mobile' and row['device_motion'] >= 3.0):
            flag[i] = 1
        elif row['time_on_page'] in [10, 600]:
            flag[i] = 1
        elif (row['keyboard_events'] == 0 and row['transaction_amount'] > 5000):
            flag[i] = 1
    df['obvious_anomaly_flag'] = flag
    return df

def preprocess_df(df):
    # Remove user_id and session_id if present
    for col in ['user_id', 'session_id']:
        if col in df.columns:
            df = df.drop(columns=[col])
    df = flag_obvious_anomalies(df)
    # --- SMART FEATURE ENGINEERING ---
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
    df['is_odd_hour'] = pd.to_datetime(df['transaction_date']).dt.hour.isin([1,2,3]).astype(int)
    df['is_large_transaction'] = (df['transaction_amount'] > 10000).astype(int)
    df['is_short_session'] = (df['time_on_page'] < 30).astype(int)
    # --- NEW SMART FEATURES ---
    interaction_cols = ['click_events', 'scroll_events', 'touch_events', 'keyboard_events', 'mouse_movement', 'device_motion']
    df['interaction_diversity'] = df[interaction_cols].gt(0).sum(axis=1)
    main_interactions = df[['click_events', 'scroll_events', 'touch_events', 'keyboard_events', 'mouse_movement']]
    df['behavioural_consistency'] = main_interactions.min(axis=1) / (main_interactions.max(axis=1) + 1e-6)
    df['input_to_navigation_ratio'] = (df['keyboard_events'] + df['touch_events']) / (df['click_events'] + df['scroll_events'] + 1)
    df['active_to_passive_ratio'] = (df['click_events'] + df['keyboard_events'] + df['touch_events']) / (df['time_on_page'] + 1)
    df['session_complexity'] = df[interaction_cols].gt(5).sum(axis=1)
    df['transaction_per_min'] = df['transaction_amount'] / (df['time_on_page'] / 60 + 1)
    df['is_high_value_short_session'] = ((df['transaction_amount'] > 10000) & (df['time_on_page'] < 60)).astype(int)
    small_screens = {'360x640', '414x896'}
    large_screens = {'1920x1080', '1440x900'}
    df['is_small_screen'] = df['screen_size'].isin(small_screens).astype(int)
    df['is_large_screen'] = df['screen_size'].isin(large_screens).astype(int)
    if 'time_on_page_safe' in df.columns:
        del df['time_on_page_safe']
    # Impute missing values (skip derived features and user_id)
    for col, val in imputation_values.items():
        if col == 'obvious_anomaly_flag' or col == 'user_id':
            continue
        if col in feature_cols:
            if col not in df.columns or df[col].isnull().any():
                df[col] = df[col].fillna(val)
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

def evaluate_on_dataset(csv_path, label_col='label'):
    df = pd.read_csv(csv_path, parse_dates=['transaction_date'])
    y_true = df[label_col].values
    X_scaled, _ = preprocess_df(df)
    y_proba = model.predict_proba(X_scaled)[:,1]
    y_pred = (y_proba >= 0.5).astype(int)
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred)
    rec = recall_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred)
    auc = roc_auc_score(y_true, y_proba)
    print(f"Results for {csv_path}:")
    print(f"  Accuracy:  {acc:.4f}")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall:    {rec:.4f}")
    print(f"  F1-Score:  {f1:.4f}")
    print(f"  AUC:       {auc:.4f}\n")

def assign_risk_level(score):
    if score < 0.45:
        return 'Low'
    elif score < 0.75:
        return 'Medium'
    else:
        return 'High'

if __name__ == '__main__':
    print("Evaluating production model on test datasets...\n")
    evaluate_on_dataset('synthetic_behavior_5%_dataset_multifeature_anomalies.csv')
    evaluate_on_dataset('synthetic_behavior_dataset.csv') 