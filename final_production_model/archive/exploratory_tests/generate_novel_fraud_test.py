"""
A held-out test set containing a fraud pattern NEITHER model has ever seen --
not one of the 5 personas the judge (Random Forest) was trained on
(bot_script, account_takeover, odd_hour_drain, copy_paste_drain, device_spoof),
and not anything the spotter (Isolation Forest) was implicitly shaped around
either, since it never saw labeled fraud of any kind.

Purpose: directly test the claim discussed -- can the unsupervised spotter
raise a meaningful "something's off" signal on a genuinely novel fraud type,
specifically in cases where the heuristic and judge both stay silent because
they were never built to recognize it? This is the fair test the earlier
evaluation couldn't provide, since all 19 fraud cases there belonged to
personas the judge was explicitly trained on.

The new pattern -- "mule_relay" -- is modeled on real money-mule behavior
(discussed and agreed as one of the two fraud types where a behavioral
anomaly signal has a genuine chance to exist, unlike social-engineering or
synthetic-identity fraud, which leave no behavioral trace at all):
  - Transaction amount is unusually large RELATIVE TO THAT SPECIFIC USER'S
    OWN normal spend (e.g. 6-12x their usual amount) -- not an absolute
    "amount > 10000" rule like odd_hour_drain uses, so it doesn't overlap
    with that persona's signature.
  - All interaction behavior (clicks, scrolls, typing, device, timing)
    stays completely ORDINARY and consistent with that user's own baseline
    -- deliberately, since the whole point is that nothing about HOW they
    behaved looks wrong, only the transaction pattern itself.
  - Session happens at a normal hour for that user (unlike odd_hour_drain).
  - Device, browser, city all match the user's own history (unlike
    account_takeover / device_spoof).

This is intentionally NOT extreme or "easy mode" -- if anything it's a hard
test, since only ONE field (transaction_amount, relative to personal
baseline) carries the entire signal.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

from generate_dataset import make_user_baseline, sample_normal_session


def sample_mule_relay_session(rng: np.random.Generator, user, session_idx: int, base_date: datetime):
    """Behaviorally ordinary session; only the transaction amount is
    anomalous, and only relative to this user's own typical spend."""
    sess = sample_normal_session(rng, user, session_idx, base_date)
    multiplier = rng.uniform(6.0, 12.0)
    sess['transaction_amount'] = round(user['avg_txn_amount'] * multiplier, 2)
    sess['persona'] = 'mule_relay'
    return sess


def generate_novel_test_set(n_users=200, sessions_per_user=8, anomaly_rate=0.015, seed=9001, start_date='2025-11-01'):
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
            is_anomaly = rng.random() < anomaly_rate
            if is_anomaly:
                row = sample_mule_relay_session(rng, user, session_counter, sess_date)
                row['label'] = 1
            else:
                row = sample_normal_session(rng, user, session_counter, sess_date)
            rows.append(row)

    df = pd.DataFrame(rows)
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)
    return df


if __name__ == '__main__':
    df = generate_novel_test_set(n_users=200, sessions_per_user=8, anomaly_rate=0.015, seed=9001,
                                  start_date='2025-11-01')
    df.to_csv('synthetic_novel_fraud_test.csv', index=False)
    print(f"Novel-fraud test set: {len(df)} rows, {df['label'].sum()} anomalies "
          f"({df['label'].mean()*100:.2f}%)")
    print(df['persona'].value_counts())
