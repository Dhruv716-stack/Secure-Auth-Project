import pickle
import pandas as pd
import numpy as np
import sys
from sklearn.preprocessing import LabelEncoder

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
        # Slightly less sensitive: higher threshold and fewer hours
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

def assign_risk_level(score):
    if score < 0.45:
        return 'Low'
    elif score < 0.75:
        return 'Medium'
    else:
        return 'High'

def get_risk_reasons(row, risk_level):
    reasons = []
    # Slightly less sensitive: higher threshold and fewer hours
    if row.get('transaction_amount', 0) > 10000 and pd.to_datetime(row.get('transaction_date', '2000-01-01')).hour in [1,2,3]:
        reasons.append('Large transaction at odd hour')
    if row.get('click_events', 0) >= 30:
        reasons.append('Very high click events')
    if row.get('mouse_movement', 0) >= 1500:
        reasons.append('Extreme mouse movement')
    if row.get('device_type', -1) == 1 and row.get('touch_events', 0) >= 20:
        reasons.append('High touch events on Mobile')
    if row.get('device_type', -1) == 1 and row.get('device_motion', 0) >= 3.0:
        reasons.append('Device motion spike on Mobile')
    if row.get('time_on_page', 0) in [10, 600]:
        reasons.append('Unusual time on page')
    if row.get('keyboard_events', 1) == 0 and row.get('transaction_amount', 0) > 5000:
        reasons.append('Zero keyboard events with high transaction')
    if row.get('transaction_amount', 0) > 10000:
        reasons.append('Extremely large transaction')
    if row.get('click_events', 0) == 0:
        reasons.append('No click events')
    if row.get('touch_events', 0) == 0 and row.get('device_type', -1) == 1:
        reasons.append('No touch events on Mobile')
    if risk_level == 'High':
        return '; '.join(reasons[:3]) if reasons else 'Multiple strong anomaly signals'
    elif risk_level == 'Medium':
        return reasons[0] if reasons else 'Some features are moderately unusual'
    else:
        return ''

def preprocess_input(input_dict):
    df = pd.DataFrame([input_dict])
    # Remove user_id and session_id if present
    for col in ['user_id', 'session_id']:
        if col in df.columns:
            df = df.drop(columns=[col])
    # Impute missing values using imputation_values
    for col, val in imputation_values.items():
        if col not in df.columns or pd.isnull(df.at[0, col]):
            df[col] = val
    df = flag_obvious_anomalies(df)
    # --- SMART FEATURE ENGINEERING ---
    df['time_on_page_safe'] = df['time_on_page'].replace(0, 1)
    df['clicks_per_sec'] = df['click_events'] / df['time_on_page_safe']
    df['scrolls_per_sec'] = df['scroll_events'] / df['time_on_page_safe']
    df['touches_per_sec'] = df['touch_events'] / df['time_on_page_safe']
    df['keyboard_per_sec'] = df['keyboard_events'] / df['time_on_page_safe']
    # Give more priority to rates than raw counts in interaction_score
    df['interaction_score'] = (
        0.5 * df['clicks_per_sec'] +
        0.2 * df['scrolls_per_sec'] +
        0.2 * df['touches_per_sec'] +
        0.2 * df['keyboard_per_sec'] +
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

def predict(input_dict):
    X_scaled, df_proc = preprocess_input(input_dict)
    proba = model.predict_proba(X_scaled)[:,1][0]
    pred = int(proba >= 0.5)
    risk = assign_risk_level(proba)
    reason = get_risk_reasons(df_proc.iloc[0], risk)
    return {
        'predicted_label': pred,
        'anomaly_score': proba,
        'risk_level': risk,
        'risk_reason': reason
    }

if __name__ == '__main__':
    import json
    if len(sys.argv) == 2 and sys.argv[1].endswith('.json'):
        with open(sys.argv[1], 'r') as f:
            input_dict = json.load(f)
        result = predict(input_dict)
        print(json.dumps(result, indent=2))
    else:
        print('Usage: python predict.py input.json') 