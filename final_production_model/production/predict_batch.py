import sys, json
from predict import predict

if __name__ == '__main__':
    if len(sys.argv) == 2 and sys.argv[1].endswith('.json'):
        with open(sys.argv[1], encoding="utf-8") as f:
            input_list = json.load(f)
        results = [predict(item) for item in input_list]
        print(json.dumps(results, indent=2))
    else:
        print('Usage: python predict_batch.py input.json')
