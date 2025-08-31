"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_1 = require("../lib/prisma");
var child_process_1 = require("child_process");
var fs = require("fs");
var path = require("path");
// Fetch transactions that do NOT have a corresponding modelOutput row
function fetchUnscoredTransactions() {
    return __awaiter(this, void 0, void 0, function () {
        var scored, scoredSessionIds;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_1.prisma.modelOutput.findMany({ select: { sessionId: true } })];
                case 1:
                    scored = _a.sent();
                    scoredSessionIds = new Set(scored.map(function (m) { return m.sessionId; }).filter(function (id) { return !!id; }));
                    return [4 /*yield*/, prisma_1.prisma.transaction.findMany({
                            where: {
                                sessionId: { notIn: Array.from(scoredSessionIds) },
                            },
                            orderBy: { createdAt: 'asc' },
                        })];
                case 2: 
                // Fetch transactions whose sessionId is not in modelOutput
                return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function runPythonBatchModel(batchData) {
    return __awaiter(this, void 0, void 0, function () {
        var inputPath;
        return __generator(this, function (_a) {
            inputPath = path.join(process.cwd(), 'final_rf_production', 'batch_input.json');
            fs.writeFileSync(inputPath, JSON.stringify(batchData));
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var py = (0, child_process_1.spawn)('python', ['final_rf_production/predict_batch.py', inputPath]);
                    var output = '';
                    py.stdout.on('data', function (data) { output += data; });
                    py.stderr.on('data', function (err) { console.error(err.toString()); });
                    py.on('close', function (code) {
                        fs.unlinkSync(inputPath);
                        if (code === 0) {
                            try {
                                resolve(JSON.parse(output));
                            }
                            catch (e) {
                                reject('Failed to parse model output');
                            }
                        }
                        else {
                            reject('Python script failed');
                        }
                    });
                })];
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var unscoredTxns, modelInputs, results, i, txn, input, output, err_1;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 7, , 8]);
                    return [4 /*yield*/, fetchUnscoredTransactions()];
                case 1:
                    unscoredTxns = _d.sent();
                    if (unscoredTxns.length === 0) {
                        console.log('No unscored transactions found.');
                        return [2 /*return*/];
                    }
                    modelInputs = unscoredTxns.map(function (txn) {
                        var _a;
                        return ({
                            session_id: (_a = txn.sessionId) !== null && _a !== void 0 ? _a : '',
                            // Add other fields as needed for your model
                        });
                    });
                    return [4 /*yield*/, runPythonBatchModel(modelInputs)];
                case 2:
                    results = _d.sent();
                    i = 0;
                    _d.label = 3;
                case 3:
                    if (!(i < unscoredTxns.length)) return [3 /*break*/, 6];
                    txn = unscoredTxns[i];
                    input = modelInputs[i];
                    output = results[i];
                    // Only insert if customerId is a string
                    if (typeof txn.customerId !== 'string' || !txn.customerId) {
                        console.warn("Skipping transaction with missing customerId: ".concat(txn.id));
                        return [3 /*break*/, 5];
                    }
                    return [4 /*yield*/, prisma_1.prisma.modelOutput.create({
                            data: {
                                customerId: txn.customerId,
                                sessionId: input.session_id,
                                anomalyScore: (_a = output.anomaly_score) !== null && _a !== void 0 ? _a : 0,
                                riskCategory: (_b = output.risk_level) !== null && _b !== void 0 ? _b : '',
                                riskReasons: (_c = output.risk_reason) !== null && _c !== void 0 ? _c : '',
                            }
                        })];
                case 4:
                    _d.sent();
                    _d.label = 5;
                case 5:
                    i++;
                    return [3 /*break*/, 3];
                case 6:
                    console.log('Batch processed and model outputs stored.');
                    return [3 /*break*/, 8];
                case 7:
                    err_1 = _d.sent();
                    console.error('Error in batch worker:', err_1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
main();
