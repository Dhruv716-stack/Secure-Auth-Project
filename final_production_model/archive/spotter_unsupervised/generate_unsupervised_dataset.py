"""
Normal-only, label-free dataset generator for training the UNSUPERVISED
anomaly "spotter" (Isolation Forest).

Why a separate dataset from synthetic_train_v2.csv:
  The spotter's entire job is to learn "what does normal look like." If even
  a few fraud-persona rows sneak into its training data (even unlabeled), it
  quietly widens its own definition of "normal" to include them -- making it
  WORSE at flagging exactly the kind of behavior we want it to catch later.
  This is a well-known requirement for one-class/anomaly-detection models,
  not specific to this project.

  synthetic_train_v2.csv (used for the supervised "judge" model) deliberately
  contains ~1.5% fraud-persona rows, because the judge needs to see both
  classes to learn the difference. The spotter must never see that file for
  TRAINING. This generator reuses the exact same per-user-baseline logic
  (imported directly from generate_dataset.py, not copy-pasted, so both
  generators always agree on what "normal" looks like) but calls
  sample_normal_session() for every single row -- zero fraud personas mixed
  in, and no 'label' column at all, so the spotter never even has the
  *option* to peek at an answer.

Same 15-field schema as everywhere else in this pipeline. No new fields.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

from generate_dataset import make_user_baseline, sample_normal_session


def generate_unsupervised_dataset(n_users=800, sessions_per_user=12, seed=2024, start_date='2025-01-01'):
    rng = np.random.default_rng(seed)
    users = [make_user_baseline(rng, i) for i in range(n_users)]
    base_date = datetime.fromisoformat(start_date)

    rows = []
    session_counter = 0
    for user in users:
        for _ in range(sessions_per_user):
            session_counter += 1
            day_offset = int(rng.integers(0, 180))
            sess_date = base_date + timedelta(days=day_offset)
            row = sample_normal_session(rng, user, session_counter, sess_date)
            rows.append(row)

    df = pd.DataFrame(rows)
    df = df.drop(columns=['label', 'persona'])  # no labels, no ground-truth hints, by design
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)
    return df


if __name__ == '__main__':
    # Training pile for the spotter: normal-only, no labels, different seed
    # and date range than synthetic_train_v2.csv so it isn't just a reshuffle
    # of the same rows.
    unsup_train_df = generate_unsupervised_dataset(n_users=800, sessions_per_user=12, seed=2024,
                                                     start_date='2025-01-01')
    unsup_train_df.to_csv('synthetic_unsupervised_train.csv', index=False)
    print(f"Unsupervised training set: {len(unsup_train_df)} rows, all normal, no label column, "
          f"columns: {list(unsup_train_df.columns)}")
