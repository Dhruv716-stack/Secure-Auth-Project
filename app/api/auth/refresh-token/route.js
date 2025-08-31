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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const USERS_FILE = path_1.default.join(process.cwd(), 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_EXPIRES_IN = '24h';
function readUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield fs_1.promises.readFile(USERS_FILE, 'utf-8');
            return JSON.parse(data);
        }
        catch (_a) {
            return [];
        }
    });
}
function POST(req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const token = (_a = req.cookies.get('token')) === null || _a === void 0 ? void 0 : _a.value;
        if (!token) {
            return server_1.NextResponse.json({ message: 'No token provided.' }, { status: 401 });
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            // Optionally, check if user still exists
            const users = yield readUsers();
            const user = users.find((u) => u.email === decoded.email);
            if (!user) {
                return server_1.NextResponse.json({ message: 'User not found.' }, { status: 401 });
            }
            const newToken = jsonwebtoken_1.default.sign({ email: user.email, customerId: user.customerId, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            const res = server_1.NextResponse.json({ message: 'Token refreshed.' });
            res.cookies.set('token', newToken, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 });
            return res;
        }
        catch (_b) {
            return server_1.NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 });
        }
    });
}
