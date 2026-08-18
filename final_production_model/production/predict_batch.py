"""Score a batch of behavioural rows from a JSON file.

Used as the fallback transport when the model API is not running (see
lib/model-client.ts). Kept behaviourally identical to the API so switching
between them cannot change verdicts.

Input is either:

    [ {row}, {row}, ... ]                        # rows only
    { "rows": [...], "user_history": [...] }     # rows plus that user's history

The second form exists because user_history drives the account-takeover
features; without it those degrade to 0 and the API and this script would
disagree on the same input.

    python predict_batch.py input.json
"""

import json
import sys

from predict import predict_many

if __name__ == '__main__':
    if len(sys.argv) == 2 and sys.argv[1].endswith('.json'):
        with open(sys.argv[1], encoding='utf-8') as f:
            payload = json.load(f)

        if isinstance(payload, dict):
            rows = payload.get('rows', [])
            user_history = payload.get('user_history') or None
        else:
            rows = payload
            user_history = None

        # predict_many, not a loop over predict: the forest's per-call cost is
        # paid once per call rather than once per row.
        results = predict_many(rows, user_history)
        print(json.dumps(results, indent=2))
    else:
        print('Usage: python predict_batch.py input.json')
