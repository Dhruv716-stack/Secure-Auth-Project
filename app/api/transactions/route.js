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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.GET = GET;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const auth_1 = require("@/lib/auth");
const child_process_1 = require("child_process");
function isValidUpiId(upiId) {
    // Simple UPI ID validation: username@bank
    return /^[\w.-]+@[\w.-]+$/.test(upiId);
}
function POST(req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        var _d, _e, _f, _g;
        try {
            // Authenticate user
            const token = (_d = req.cookies.get('auth-token')) === null || _d === void 0 ? void 0 : _d.value;
            if (!token) {
                return server_1.NextResponse.json({ error: 'Authentication required' }, { status: 401 });
            }
            const user = (0, auth_1.verifyJWT)(token);
            if (!user) {
                return server_1.NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
            }
            // Parse request body
            const { amount, upiId, device, lat, lng, category } = yield req.json();
            if (!amount || !upiId || !category) {
                return server_1.NextResponse.json({ error: 'Amount, UPI ID, and category are required' }, { status: 400 });
            }
            if (!isValidUpiId(upiId)) {
                return server_1.NextResponse.json({ error: 'Invalid UPI ID format' }, { status: 400 });
            }
            if (isNaN(Number(amount)) || Number(amount) <= 0) {
                return server_1.NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
            }
            // Validate category
            const validCategories = [
                'Food & Dining',
                'Shopping',
                'Transportation',
                'Entertainment',
                'Bills',
            ];
            if (!validCategories.includes(category)) {
                return server_1.NextResponse.json({ error: 'Invalid category' }, { status: 400 });
            }
            // Get IP address
            let ip = req.headers.get('x-forwarded-for') || '';
            if (ip === '::1' || ip === '127.0.0.1')
                ip = '';
            // Lookup location if lat/lng are provided
            let location = 'Unknown';
            if (lat != null && lng != null) {
                try {
                    const nominatimRes = yield fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`, {
                        headers: { 'User-Agent': 'CanaraSuraksha/1.0' }
                    });
                    const nominatim = yield nominatimRes.json();
                    if (nominatim && nominatim.address) {
                        const city = nominatim.address.city || nominatim.address.town || nominatim.address.village || nominatim.address.hamlet || nominatim.address.county || '';
                        const country = nominatim.address.country || '';
                        location = city && country ? `${city}, ${country}` : country || city || 'Unknown';
                    }
                }
                catch (e) {
                    // fallback to IP-based below
                }
            }
            // If still unknown, fallback to IP-based lookup
            if (location === 'Unknown' && ip) {
                try {
                    const geoRes = yield fetch(`https://ipapi.co/${ip}/json/`);
                    const geo = yield geoRes.json();
                    if (geo && geo.city && geo.country) {
                        location = `${geo.city}, ${geo.country}`;
                    }
                }
                catch (e) {
                    // fallback to 'Unknown'
                }
            }
            // Simulate transaction status
            const status = 'completed';
            // Store transaction in DB
            const transaction = yield prisma_1.prisma.transaction.create({
                data: {
                    userId: user.userId,
                    customerId: user.customerId,
                    type: 'transfer',
                    amount: Number(amount),
                    description: `Sent to ${upiId}`,
                    recipientId: upiId,
                    status,
                    ip,
                    location,
                    device: device || 'Unknown Device',
                    lat: lat !== null && lat !== void 0 ? lat : null,
                    lng: lng !== null && lng !== void 0 ? lng : null,
                    category, // <-- add category
                },
            });
            // Data validation and type conversion function
            function validateAndConvertInput(input) {
                const requiredColumns = {
                    device_type: 'string',
                    click_events: 'number',
                    scroll_events: 'number',
                    touch_events: 'number',
                    keyboard_events: 'number',
                    device_motion: 'number',
                    time_on_page: 'number',
                    screen_size: 'string',
                    browser_info: 'string',
                    language: 'string',
                    timezone_offset: 'number',
                    device_orientation: 'string',
                    geolocation_city: 'string',
                    transaction_amount: 'number',
                    transaction_date: 'string',
                    mouse_movement: 'number'
                };
                const validated = {};
                for (const [column, expectedType] of Object.entries(requiredColumns)) {
                    let value = input[column];
                    // Handle missing values
                    if (value === undefined || value === null) {
                        if (expectedType === 'number') {
                            value = 0;
                        }
                        else if (expectedType === 'string') {
                            value = '';
                        }
                    }
                    else {
                        // Type conversion
                        try {
                            switch (expectedType) {
                                case 'number':
                                    value = Number(value);
                                    if (isNaN(value)) {
                                        console.warn(`Invalid number for ${column}: ${input[column]}, setting to 0`);
                                        value = 0;
                                    }
                                    break;
                                case 'string':
                                    value = String(value);
                                    break;
                            }
                        }
                        catch (error) {
                            console.warn(`Error converting ${column} to ${expectedType}: ${error}`);
                            if (expectedType === 'number') {
                                value = 0;
                            }
                            else if (expectedType === 'string') {
                                value = '';
                            }
                        }
                    }
                    validated[column] = value;
                }
                return validated;
            }
            // Prepare input for the model with validation and type conversion
            const rawInput = [{
                    device_type: device || null,
                    click_events: 0,
                    scroll_events: 0,
                    touch_events: 0,
                    keyboard_events: 0,
                    device_motion: 0,
                    time_on_page: 0,
                    screen_size: null,
                    browser_info: null,
                    language: null,
                    timezone_offset: 0,
                    device_orientation: null,
                    geolocation_city: location && typeof location === 'string' ? location.split(',')[0] : null,
                    transaction_amount: Number(amount),
                    transaction_date: (transaction.createdAt instanceof Date ? transaction.createdAt : new Date(transaction.createdAt)).toISOString().replace('T', ' ').slice(0, 19),
                    mouse_movement: 0
                }];
            const input = rawInput.map(validateAndConvertInput);
            const fs = require('fs');
            const path = require('path');
            const inputPath = path.join(process.cwd(), 'final_production_model', 'single_input.json');
            fs.writeFileSync(inputPath, JSON.stringify(input));
            const py = (0, child_process_1.spawn)('python', ['final_production_model/predict_batch.py', inputPath]);
            let output = '';
            try {
                for (var _h = true, _j = __asyncValues(py.stdout), _k; _k = yield _j.next(), _a = _k.done, !_a; _h = true) {
                    _c = _k.value;
                    _h = false;
                    const chunk = _c;
                    output += chunk;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_h && !_a && (_b = _j.return)) yield _b.call(_j);
                }
                finally { if (e_1) throw e_1.error; }
            }
            yield new Promise((resolve) => py.on('close', resolve));
            fs.unlinkSync(inputPath);
            let result = [];
            try {
                result = JSON.parse(output);
            }
            catch (e) {
                result = [{}];
            }
            // Update transaction with model output
            yield prisma_1.prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    riskLevel: (_e = result[0]) === null || _e === void 0 ? void 0 : _e.risk_level,
                    riskReason: (_f = result[0]) === null || _f === void 0 ? void 0 : _f.risk_reason,
                    anomalyScore: (_g = result[0]) === null || _g === void 0 ? void 0 : _g.anomaly_score,
                },
            });
            // Create a notification for the user
            yield prisma_1.prisma.notification.create({
                data: {
                    userId: user.userId,
                    type: 'success',
                    message: `Transaction of ₹${amount} to ${upiId} completed successfully.`,
                    read: false,
                }
            });
            return server_1.NextResponse.json({ success: true, transaction });
        }
        catch (error) {
            console.error('Transaction error:', error);
            return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    });
}
function GET(req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Authenticate user
            const token = (_a = req.cookies.get('auth-token')) === null || _a === void 0 ? void 0 : _a.value;
            if (!token) {
                return server_1.NextResponse.json({ error: 'Authentication required' }, { status: 401 });
            }
            const user = (0, auth_1.verifyJWT)(token);
            if (!user) {
                return server_1.NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
            }
            // Fetch transactions for this customerId, include category
            const transactions = yield prisma_1.prisma.transaction.findMany({
                where: { customerId: user.customerId },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    userId: true,
                    customerId: true,
                    type: true,
                    amount: true,
                    description: true,
                    recipientId: true,
                    status: true,
                    ip: true,
                    location: true,
                    device: true,
                    lat: true,
                    lng: true,
                    category: true,
                    createdAt: true,
                },
            });
            return server_1.NextResponse.json({ transactions });
        }
        catch (error) {
            console.error('Fetch transactions error:', error);
            return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    });
}
