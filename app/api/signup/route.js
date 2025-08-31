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
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const USERS_FILE = path_1.default.join(process.cwd(), 'users.json');
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
function writeUsers(users) {
    return __awaiter(this, void 0, void 0, function* () {
        yield fs_1.promises.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    });
}
function POST(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, email, customerId, password } = yield req.json();
        if (!name || !email || !customerId || !password) {
            return server_1.NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
        }
        if (password.length < 6) {
            return server_1.NextResponse.json({ message: 'Password must be at least 6 characters.' }, { status: 400 });
        }
        const users = yield readUsers();
        if (users.find((u) => u.customerId === customerId)) {
            return server_1.NextResponse.json({ message: 'Customer ID already exists.' }, { status: 400 });
        }
        if (users.find((u) => u.email === email)) {
            return server_1.NextResponse.json({ message: 'Email already registered.' }, { status: 400 });
        }
        users.push({ name, email, customerId, password });
        yield writeUsers(users);
        return server_1.NextResponse.json({ message: 'Registration successful.' }, { status: 200 });
    });
}
