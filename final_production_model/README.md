# Fraud Detection Model

A behavioral-anomaly judge model (Random Forest) that scores banking sessions
for fraud risk. Trained on realistic synthetic data (~1.7% anomaly rate, six
fraud personas), evaluated on a genuinely separate, leak-checked held-out
test set.

**Current production performance** (see `evaluation/evaluate_judge.py`):

| Metric | Value |
|---|---|
| Recall | 82.5% (33/40 fraud cases caught) |
| Precision | 75.0% |
| PR-AUC | 0.835 (41.8x random baseline) |

## Folder structure

```
production/     The live, deployed model -- what app/api/transactions
                 actually calls. Nothing else in this repo should be
                 imported by the running app.
training/       Scripts to regenerate training data and retrain the model.
evaluation/     Scripts to honestly evaluate the production model against
                 held-out data.
data/
  train/         The current training set.
  test/          The current held-out test set (verified zero overlap
                 with training -- see training/generate_final_honest_test.py).
archive/        Superseded models and exploratory work, kept as evidence,
                 not deleted. See "Archive" section below.
```

## Quick start

**Score a single session:**
```bash
cd production
python predict.py input.json
```
`input.json` must contain the 15 raw fields listed in "Input schema" below.

**Score a batch:**
```bash
cd production
python predict_batch.py batch_input.json   # a JSON array of session objects
```

**Retrain from scratch:**
```bash
cd training
python generate_training_data.py       # regenerates data/train/train.csv
python generate_final_honest_test.py   # regenerates data/test/final_honest_test.csv
python train_judge_model.py            # trains, prints CV + leak-guard results, saves .pkl artifacts here
# copy the six output .pkl files into ../production/, stripping the _v2 suffix
```

**Evaluate the deployed model:**
```bash
cd evaluation
python evaluate_judge.py
```

## Input schema

Matches what the web app's behavioral-tracking hook already collects
(`hooks/useSessionBatch.ts` in the main project) -- no new fields required:

```
device_type, click_events, scroll_events, touch_events, keyboard_events,
device_motion, time_on_page, screen_size, browser_info, language,
timezone_offset, device_orientation, geolocation_city,
transaction_amount, transaction_date, mouse_movement
```

`predict()` also accepts an optional `user_history` argument (a list of the
user's recent past sessions) to compute per-user baseline-deviation features
(is this a new device/city/browser for this user, does the typing/click
rhythm match their own history). **This is not yet wired up in the live app**
-- `app/api/transactions/route.ts` only sends the current session. Until
that integration lands, these features safely degrade to "no deviation
detected" rather than crashing or guessing. See `production/predict.py`'s
docstring for the exact mechanism.

## Output

```json
{
  "predicted_label": 0 or 1,
  "anomaly_score": 0.0-1.0,
  "risk_level": "Low" | "Medium" | "High",
  "risk_reason": "..."
}
```

## Design decisions worth knowing before changing anything

**Why judge-only, not judge + heuristic + spotter.** Earlier iterations
combined this model with a hand-written rule-based heuristic and a second,
unsupervised model (Isolation Forest). Both were tested honestly and
removed:
- The heuristic caught zero fraud cases the judge didn't already catch,
  while adding 11 extra false alarms on the final test set. Purely harmful.
- The spotter had one real, proven strength (unusually short/rushed
  sessions) that the judge's own features now cover after retraining; its
  other four tested fraud patterns showed weak or no independent value,
  not worth the ongoing cost of maintaining a second model/pipeline.

See `archive/spotter_unsupervised/` and `archive/exploratory_tests/` for the
full evaluation evidence behind this call, not just the conclusion.

**Why `obvious_anomaly_flag` doesn't exist anywhere in this pipeline.** The
original model (`archive/v1_original_leaky_model/`) computed a rule-based
"obvious anomaly" flag and used it BOTH to generate training labels AND as a
model input feature -- a direct data leak (the model was largely
re-deriving its own answer key). Caught by re-running the original
evaluation script live and finding the reported metrics didn't reproduce
honestly. Never reintroduce a feature that was also used to generate the
label it predicts.

**Why cross-validation is grouped by `user_id`, not by row.** Per-user
baseline features (is this a new device for this user, etc.) are computed
from a user's OTHER sessions. Random row-level fold splitting can put one
user's sessions on both sides of a fold boundary, letting information leak
across the boundary indirectly. `train_judge_model.py` uses
`StratifiedGroupKFold` / `GroupShuffleSplit` and asserts zero user overlap
between splits every time it runs -- don't switch back to plain
`StratifiedKFold` / `train_test_split` without re-deriving why this matters.

**Why the decision threshold (0.40) is a manual override, not the
auto-tuned value.** The auto-tuner (F2-score, recall-weighted) picks a much
lower threshold that trades significant precision for marginal extra
recall. 0.40 was chosen after reviewing the full precision/recall-vs-
threshold curve as the better cost/benefit point (see git history /
conversation log for the full sweep). This is a product decision (cost of a
missed fraud vs. cost of a false alarm), not something to silently
re-optimize -- see the `MANUAL_THRESHOLD_OVERRIDE` comment in
`training/train_judge_model.py`.

## Known gaps (honest, not hidden)

- **Per-user history isn't wired into the live app yet** (see "Input
  schema" above) -- the model's proven 82.5% recall requires it.
- **Mule account networks are NOT detectable by this model.** That fraud
  pattern requires cross-account, over-time analysis; every feature here is
  scoped to a single session. Would need a different kind of model
  (account-level or graph-based), not more training data.
- **Trained entirely on synthetic data.** No real confirmed-fraud feedback
  loop exists yet. See the retraining note below.

## Retraining as real data arrives

`data/modelInput`-style behavioral data is already collected by the live
app, but nothing currently records whether a flagged session was confirmed
fraud or a false alarm -- that confirmed-label signal is what real
retraining needs, not just more raw sessions. Until that feedback loop
exists, treat this model as a synthetic-data-trained starting point, not a
system that improves itself automatically.

## Archive

- `archive/v1_original_leaky_model/` -- the original model, kept as
  evidence of the label-leak bug and what NOT to do (feeding a rule-derived
  flag back in as both the label source and a training feature).
- `archive/spotter_unsupervised/` -- the unsupervised Isolation Forest
  "spotter" model and its full evaluation trail (label-free sanity checks,
  labeled grading, the 5-pattern acceptance suite). Retired from production
  but its PR-curve and persona-level results are worth reading before
  reconsidering an unsupervised layer in the future.
- `archive/exploratory_tests/` -- one-off synthetic test patterns built to
  probe specific questions (novel/untrained fraud shapes, ATO/Zelle and RAT
  fraud variants, the spotter's 5-pattern acceptance suite). Not part of
  the regular train/eval loop, but each file's docstring explains exactly
  what question it was built to answer.
