import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
import os

# Load training data
train_data = pd.read_csv('synthetic_behavior_dataset_multifeature_anomalies.csv', parse_dates=['transaction_date'])

# Remove user_id and session_id from training data before any processing
for col in ['user_id', 'session_id']:
    if col in train_data.columns:
        train_data = train_data.drop(columns=[col])

# --- Preprocessing ---
# Add obvious anomaly flag (same logic as before)
def flag_obvious_anomalies(df):
    flag = np.zeros(len(df), dtype=int)
    for i, row in df.iterrows():
        # Slightly less sensitive: higher threshold and fewer hours
        if (row['transaction_amount'] > 10000) and (row['transaction_date'].hour in [1,2,3]):
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

train_data = flag_obvious_anomalies(train_data)

# --- SMART FEATURE ENGINEERING ---
train_data['time_on_page_safe'] = train_data['time_on_page'].replace(0, 1)
train_data['clicks_per_sec'] = train_data['click_events'] / train_data['time_on_page_safe']
train_data['scrolls_per_sec'] = train_data['scroll_events'] / train_data['time_on_page_safe']
train_data['touches_per_sec'] = train_data['touch_events'] / train_data['time_on_page_safe']
train_data['keyboard_per_sec'] = train_data['keyboard_events'] / train_data['time_on_page_safe']
train_data['interaction_score'] = (
    0.3 * train_data['click_events'] +
    0.2 * train_data['scroll_events'] +
    0.2 * train_data['touch_events'] +
    0.2 * train_data['keyboard_events'] +
    0.1 * train_data['mouse_movement'] +
    0.1 * train_data['device_motion']
)
train_data['is_odd_hour'] = train_data['transaction_date'].dt.hour.isin([1,2,3]).astype(int)
train_data['is_large_transaction'] = (train_data['transaction_amount'] > 10000).astype(int)
train_data['is_short_session'] = (train_data['time_on_page'] < 30).astype(int)
# --- NEW SMART FEATURES ---
# 1. Interaction Diversity
interaction_cols = ['click_events', 'scroll_events', 'touch_events', 'keyboard_events', 'mouse_movement', 'device_motion']
train_data['interaction_diversity'] = train_data[interaction_cols].gt(0).sum(axis=1)
# 2. Behavioural Consistency
main_interactions = train_data[['click_events', 'scroll_events', 'touch_events', 'keyboard_events', 'mouse_movement']]
train_data['behavioural_consistency'] = main_interactions.min(axis=1) / (main_interactions.max(axis=1) + 1e-6)
# 3. Input to Navigation Ratio
train_data['input_to_navigation_ratio'] = (train_data['keyboard_events'] + train_data['touch_events']) / (train_data['click_events'] + train_data['scroll_events'] + 1)
# 4. Active to Passive Ratio
train_data['active_to_passive_ratio'] = (train_data['click_events'] + train_data['keyboard_events'] + train_data['touch_events']) / (train_data['time_on_page'] + 1)
# 5. Session Complexity
train_data['session_complexity'] = train_data[interaction_cols].gt(5).sum(axis=1)
# 6. Transaction Features
train_data['transaction_per_min'] = train_data['transaction_amount'] / (train_data['time_on_page'] / 60 + 1)
train_data['is_high_value_short_session'] = ((train_data['transaction_amount'] > 10000) & (train_data['time_on_page'] < 60)).astype(int)
# 7. Screen Size Features
small_screens = {'360x640', '414x896'}
large_screens = {'1920x1080', '1440x900'}
train_data['is_small_screen'] = train_data['screen_size'].isin(small_screens).astype(int)
train_data['is_large_screen'] = train_data['screen_size'].isin(large_screens).astype(int)
del train_data['time_on_page_safe']

# Imputation values
imputation_values = {}
numeric_cols = train_data.select_dtypes(include=[np.number]).columns.tolist()
# For count-like features, 0 is logical; for others, use mean
count_like = ['click_events', 'scroll_events', 'touch_events', 'keyboard_events', 'mouse_movement']
for col in numeric_cols:
    if col in count_like:
        imputation_values[col] = 0
    else:
        imputation_values[col] = train_data[col].mean()
# For categorical features, use mode
categorical_cols = train_data.select_dtypes(include=['object']).columns
for col in categorical_cols:
    imputation_values[col] = train_data[col].mode()[0]
# For 'transaction_date', use mode (most common date)
if 'transaction_date' in train_data.columns:
    imputation_values['transaction_date'] = train_data['transaction_date'].mode()[0]

# Add new features to imputation
for col in [
    'clicks_per_sec', 'scrolls_per_sec', 'touches_per_sec', 'keyboard_per_sec', 'interaction_score',
    'is_odd_hour', 'is_large_transaction', 'is_short_session', 'interaction_diversity', 'behavioural_consistency',
    'input_to_navigation_ratio', 'active_to_passive_ratio', 'session_complexity', 'transaction_per_min',
    'is_high_value_short_session', 'is_small_screen', 'is_large_screen']:
    if col not in imputation_values:
        imputation_values[col] = train_data[col].mean() if train_data[col].dtype != 'int' else train_data[col].mode()[0]

# Impute missing values
for col, val in imputation_values.items():
    train_data[col] = train_data[col].fillna(val)

# Encode categoricals
label_encoders = {}
for col in categorical_cols:
    le = LabelEncoder()
    # Add 'unknown' to the set of classes if not present
    all_values = train_data[col].astype(str).unique().tolist()
    if 'unknown' not in all_values:
        all_values.append('unknown')
    le.fit(all_values)
    # Map any value not in classes_ to 'unknown'
    train_data[col] = train_data[col].astype(str).apply(lambda x: x if x in le.classes_ else 'unknown')
    train_data[col] = le.transform(train_data[col])
    label_encoders[col] = le

# Prepare features/labels
# When building feature_cols, exclude 'user_id' and 'session_id' if present
feature_cols = [col for col in train_data.columns if col not in ['label', 'transaction_date', 'user_id', 'session_id']]
X = train_data[feature_cols]
y = train_data['label']

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train Random Forest
rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    class_weight='balanced',
    random_state=42
)
rf.fit(X_scaled, y)

# Save artifacts
os.makedirs('.', exist_ok=True)
with open('rf_model.pkl', 'wb') as f:
    pickle.dump(rf, f)
with open('scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
with open('label_encoders.pkl', 'wb') as f:
    pickle.dump(label_encoders, f)
with open('feature_cols.pkl', 'wb') as f:
    pickle.dump(feature_cols, f)
with open('imputation_values.pkl', 'wb') as f:
    pickle.dump(imputation_values, f)

print('✅ Production Random Forest model, pipeline, and imputation values saved.') 