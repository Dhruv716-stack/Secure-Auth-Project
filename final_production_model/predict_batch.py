import sys, json
from predict import predict  # reuse your single prediction logic

if __name__ == '__main__':
    if len(sys.argv) == 2 and sys.argv[1].endswith('.json'):
        with open(sys.argv[1], encoding="utf-8") as f:
            input_list = json.load(f)
        results = []
        for item in input_list:
            result = predict(item)
            results.append(result)
        print(json.dumps(results, indent=2))
    else:
        print('Usage: python predict_batch.py input.json') 