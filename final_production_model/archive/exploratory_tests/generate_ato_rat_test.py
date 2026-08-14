"""
Two honest test patterns, DISTINCT from the existing account_takeover
persona already in the judge's training data (generate_dataset.py), built
to check: (1) does a Zelle/fast-payment-style ATO variant still get caught,
and (2) does a genuine RAT-fraud pattern (real device/identity, abnormal
interaction rhythm) get caught -- the case flagged as structurally uncertain
for the judge's identity-shift features.

--- ato_zelle ---
Distinct from the existing account_takeover persona in shape, not just
relabeled:
  - Existing persona: moderate 2.5x amount multiplier, tempo drawn from a
    fixed distribution unrelated to the user's own baseline.
  - This pattern: emphasizes SPEED (very short time_on_page -- fast-payment
    fraud moves before the victim notices) and a here-and-now large-value
    transfer characteristic of instant-payment rails, with the same
    identity-shift signature (new device/city/browser) as real ATO. If the
    judge's identity-shift features generalize (not just memorize the exact
    numeric ranges of the training persona), this SHOULD still be caught
    well -- that's the actual thing being tested here.

--- rat_fraud ---
The genuinely hard case: device_type, screen_size, browser_info,
geolocation_city ALL stay identical to the user's own baseline (a RAT
controls the victim's REAL device) -- every identity-shift feature
(is_new_device_for_user, is_new_browser_for_user, is_new_city_for_user)
will read 0, exactly as flagged as a structural blind spot. The only
possible signal is INTERACTION RHYTHM not matching this user's own
established baseline: mechanically smooth/uniform mouse movement, unnatural
click timing, and a keyboard/click ratio unlike the user's own history.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

from generate_dataset import make_user_baseline, sample_normal_session

CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad']
DEVICE_TYPES = ['Desktop', 'Mobile', 'Tablet']
BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge']
SCREEN_SIZES = {
    'Desktop': ['1920x1080', '1440x900', '1366x768'],
    'Mobile': ['360x640', '414x896', '390x844'],
    'Tablet': ['768x1024', '810x1080'],
}


def sample_ato_zelle(rng, user, session_idx, base_date):
    """Fast-payment ATO: identity shift (like real ATO) + emphasis on SPEED
    and a large, immediate transfer -- distinct shape from the existing
    account_takeover persona's moderate multiplier and unrelated tempo."""
    sess = sample_normal_session(rng, user, session_idx, base_date)
    other_city = rng.choice([c for c in CITIES if c != user['home_city']])
    other_device = rng.choice([d for d in DEVICE_TYPES if d != user['device_type']])
    sess['geolocation_city'] = other_city
    sess['device_type'] = other_device
    sess['screen_size'] = rng.choice(SCREEN_SIZES[other_device])
    sess['browser_info'] = rng.choice([b for b in BROWSERS if b != user['browser_info']])
    # Speed: attacker moves fast on instant-payment rails, before the victim notices
    sess['time_on_page'] = int(rng.uniform(10, 35))
    sess['click_events'] = int(rng.uniform(2, 8))
    sess['keyboard_events'] = int(rng.uniform(1, 6))
    # Large, immediate transfer -- multiplier drawn from a DIFFERENT range
    # than the existing persona (4-9x vs. the existing 2.5x-centered draw)
    sess['transaction_amount'] = round(user['avg_txn_amount'] * rng.uniform(4.0, 9.0), 2)
    sess['persona'] = 'ato_zelle'
    return sess


def sample_rat_fraud(rng, user, session_idx, base_date):
    """Real device/identity (RAT controls the victim's actual machine) --
    device_type, screen_size, browser_info, geolocation_city all match the
    user's OWN baseline exactly, unlike every other persona in this project.
    Only the interaction RHYTHM is off: unnaturally smooth/uniform mouse
    movement (bots/remote tools tend to move in straighter, more uniform
    paths than human hand tremor), and a keyboard/click ratio that doesn't
    match this user's own typing_speed_mult baseline."""
    sess = sample_normal_session(rng, user, session_idx, base_date)
    # Identity fields deliberately left untouched -- this IS the point.
    # Rhythm mismatch: much lower natural variance in mouse movement
    # (mechanically smoother than the human baseline), and click/keyboard
    # counts that ignore this user's own typing_speed_mult multiplier
    # (a RAT operator doesn't know or reproduce the victim's personal tempo)
    sess['mouse_movement'] = max(0, int(rng.normal(150, 15)))  # low variance = mechanical
    sess['click_events'] = int(rng.uniform(8, 14))              # ignores user's own tempo
    sess['keyboard_events'] = int(rng.uniform(0, 3))             # RAT tools often paste/inject rather than type
    sess['transaction_amount'] = round(user['avg_txn_amount'] * rng.uniform(3.0, 6.0), 2)
    sess['persona'] = 'rat_fraud'
    return sess


def generate_test(pattern_fn, name, n_users=200, sessions_per_user=8, anomaly_rate=0.02, seed=None, start_date='2025-12-01'):
    rng = np.random.default_rng(seed)
    users = [make_user_baseline(rng, i) for i in range(n_users)]
    base_date = datetime.fromisoformat(start_date)
    rows = []
    session_counter = 0
    for user in users:
        for _ in range(sessions_per_user):
            session_counter += 1
            day_offset = int(rng.integers(0, 60))
            sess_date = base_date + timedelta(days=day_offset)
            if rng.random() < anomaly_rate:
                row = pattern_fn(rng, user, session_counter, sess_date)
                row['label'] = 1
            else:
                row = sample_normal_session(rng, user, session_counter, sess_date)
            rows.append(row)
    df = pd.DataFrame(rows).sample(frac=1, random_state=seed).reset_index(drop=True)
    out_path = f'synthetic_{name}_test.csv'
    df.to_csv(out_path, index=False)
    print(f"{name:12s} -> {out_path}  ({len(df)} rows, {df['label'].sum()} anomalies, "
          f"{df['label'].mean()*100:.2f}%)")
    return out_path


if __name__ == '__main__':
    generate_test(sample_ato_zelle, 'ato_zelle', seed=7001)
    generate_test(sample_rat_fraud, 'rat_fraud', seed=7002)
