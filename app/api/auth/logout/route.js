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
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
function POST(req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const token = (_a = req.cookies.get('auth-token')) === null || _a === void 0 ? void 0 : _a.value;
            if (token) {
                // Delete session from database
                yield (0, auth_1.deleteSession)(token);
            }
            // Clear the cookie
            const response = server_1.NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
            response.cookies.set('auth-token', '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 0 // Expire immediately
            });
            return response;
        }
        catch (error) {
            console.error('Logout error:', error);
            // Even if there's an error, clear the cookie
            const response = server_1.NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
            response.cookies.set('auth-token', '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 0
            });
            return response;
        }
    });
}
