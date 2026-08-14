"""
A "does the spotter actually do its job" acceptance suite: several DIFFERENT,
realistic fraud patterns, NONE of which match any of the judge's 5 trained
personas (bot_script, account_takeover, odd_hour_drain, copy_paste_drain,
device_spoof) and none of which the heuristic rule (flag_obvious_anomalies)
was written to catch either.

The point isn't "does the spotter nail every one of these" -- some are
deliberately harder than others, on purpose, to map out where its real
boundary is. A genuinely useful spotter should:
  (a) catch the patterns that produce a real numeric/statistical departure
      from the general population, even faintly,
  (b) legitimately struggle on patterns that don't produce such a
      departure (this is an honest limit, not a bug -- see the
      social-engineering / synthetic-identity discussion),
  (c) NOT drown normal traffic in false alarms while doing (a).

Five distinct novel patterns, each testing a different KIND of deviation:

  1. mule_relay        -- transaction amount far above the user's own
                           typical spend, everything else ordinary.
                           (unusual MAGNITUDE, relative to self)
  2. rapid_fire_relay   -- several transactions in a short window, each
                           individually unremarkable in amount.
                           (unusual FREQUENCY/velocity)
  3. dormant_reactivation -- a user who has been completely inactive for a
                           long stretch suddenly transacts with a large
                           amount. (unusual TIMING GAP + magnitude)
  4. slow_drain         -- many small transactions instead of one large one
                           (structuring / "smurfing"-style pattern), still
                           behaviorally ordinary otherwise.
                           (unusual COUNT of small amounts, not size)
  5. new_recipient_burst-- a session with unusually LONG time_on_page and
                           high interaction_score, as if researching/
                           hesitating -- modeling a nervous first-time
                           social-engineering victim's OWN session
                           behavior (not their intent, which is invisible,
                           but a plausible behavioral side-effect: hesitation,
                           re-reading, unusually careful navigation).
                           (unusual INTERACTION PATTERN, still self-directed)

Each is generated as its own small labeled test file so results can be
compared side by side, persona by persona -- exactly like the persona
breakdown already used for the judge model.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

from generate_dataset import make_user_baseline, sample_normal_session


def sample_mule_relay(rng, user, session_idx, base_date):
    sess = sample_normal_session(rng, user, session_idx, base_date)
    sess['transaction_amount'] = round(user['avg_txn_amount'] * rng.uniform(6.0, 12.0), 2)
    sess['persona'] = 'mule_relay'
    return sess


def sample_rapid_fire_relay(rng, user, session_idx, base_date):
    """Ordinary-sized transaction, but time_on_page is unusually SHORT
    relative to this user's own norm (rapid, back-to-back-feeling session)
    combined with a higher-than-usual transaction_per_min implied by the
    short session -- without touching click/keyboard counts at all, so it
    doesn't resemble bot_script (which is defined by EXTREME click counts)."""
    sess = sample_normal_session(rng, user, session_idx, base_date)
    sess['time_on_page'] = max(5, int(user['avg_session_len'] * rng.uniform(0.05, 0.15)))
    sess['transaction_amount'] = round(user['avg_txn_amount'] * rng.uniform(0.8, 1.5), 2)  # ordinary amount
    sess['persona'] = 'rapid_fire_relay'
    return sess


def sample_dormant_reactivation(rng, user, session_idx, base_date):
    """A session placed far outside this user's usual activity window,
    combined with a large amount -- distinct from odd_hour_drain (which is
    a fixed global 1-4am rule); this uses a random unusual hour PER USER
    plus a moderate (not extreme) amount multiplier, and normal interaction
    counts, so it doesn't trip the heuristic's odd-hour+large-amount rule
    (which requires amount > 10000 specifically)."""
    sess = sample_normal_session(rng, user, session_idx, base_date)
    # pick an hour far from this user's usual center, but not necessarily 1-4am
    far_hour = int((user['usual_hour_center'] + rng.integers(9, 15)) % 24)
    sess['transaction_date'] = sess['transaction_date'].replace(hour=far_hour)
    sess['transaction_amount'] = round(user['avg_txn_amount'] * rng.uniform(2.5, 4.5), 2)  # moderate, not extreme
    sess['persona'] = 'dormant_reactivation'
    return sess


def sample_slow_drain(rng, user, session_idx, base_date):
    """A single session representing one of several small transactions --
    amount is unusually SMALL and round-ish (structuring-style), with
    slightly elevated click/scroll counts (multiple small actions) but
    nowhere near bot_script's extreme thresholds."""
    sess = sample_normal_session(rng, user, session_idx, base_date)
    sess['transaction_amount'] = round(rng.choice([499, 999, 1499, 1999]), 2)  # suspiciously round, small
    sess['click_events'] = int(sess['click_events'] * rng.uniform(1.8, 2.5))  # elevated but not extreme
    sess['persona'] = 'slow_drain'
    return sess


def sample_new_recipient_burst(rng, user, session_idx, base_date):
    """Unusually long time_on_page and higher interaction (scrolling back
    and forth, hesitation) relative to this user's norm -- amount stays
    ordinary. Models the OWN behavioral signature of an unusually hesitant
    or careful session, without claiming to detect the invisible social-
    engineering intent behind it."""
    sess = sample_normal_session(rng, user, session_idx, base_date)
    sess['time_on_page'] = int(user['avg_session_len'] * rng.uniform(3.0, 5.0))
    sess['scroll_events'] = int(sess['scroll_events'] * rng.uniform(2.5, 4.0))
    sess['persona'] = 'new_recipient_burst'
    return sess


PATTERNS = {
    'mule_relay': sample_mule_relay,
    'rapid_fire_relay': sample_rapid_fire_relay,
    'dormant_reactivation': sample_dormant_reactivation,
    'slow_drain': sample_slow_drain,
    'new_recipient_burst': sample_new_recipient_burst,
}


def generate_suite(n_users=200, sessions_per_user=8, anomaly_rate=0.02, seed_base=9000, start_date='2025-11-01'):
    files = {}
    for i, (name, fn) in enumerate(PATTERNS.items()):
        rng = np.random.default_rng(seed_base + i)
        users = [make_user_baseline(rng, u) for u in range(n_users)]
        base_date = datetime.fromisoformat(start_date)
        rows = []
        session_counter = 0
        for user in users:
            for _ in range(sessions_per_user):
                session_counter += 1
                day_offset = int(rng.integers(0, 60))
                sess_date = base_date + timedelta(days=day_offset)
                if rng.random() < anomaly_rate:
                    row = fn(rng, user, session_counter, sess_date)
                    row['label'] = 1
                else:
                    row = sample_normal_session(rng, user, session_counter, sess_date)
                rows.append(row)
        df = pd.DataFrame(rows).sample(frac=1, random_state=seed_base + i).reset_index(drop=True)
        out_path = f'synthetic_novel_{name}_test.csv'
        df.to_csv(out_path, index=False)
        files[name] = out_path
        print(f"{name:22s} -> {out_path}  ({len(df)} rows, {df['label'].sum()} anomalies, "
              f"{df['label'].mean()*100:.2f}%)")
    return files


if __name__ == '__main__':
    generate_suite()
