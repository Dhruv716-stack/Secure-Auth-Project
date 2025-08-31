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
exports.GET = GET;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
function GET(req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const token = (_a = req.cookies.get('auth-token')) === null || _a === void 0 ? void 0 : _a.value;
            if (!token) {
                return server_1.NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
            }
            // Verify JWT
            const payload = (0, auth_1.verifyJWT)(token);
            if (!payload) {
                return server_1.NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
            }
            // Check if session exists in database
            const session = yield (0, auth_1.getSessionByToken)(token);
            if (!session || session.expiresAt < new Date()) {
                return server_1.NextResponse.json({ error: 'Session expired or not found' }, { status: 401 });
            }
            // Return user information
            return server_1.NextResponse.json({
                user: {
                    id: session.user.id,
                    customerId: session.user.customerId,
                    email: session.user.email,
                    name: session.user.name,
                    phone: session.user.phone,
                    accountType: session.user.accountType,
                    lastLogin: session.user.lastLogin,
                    profileImage: session.user.profileImage
                }
            });
        }
        catch (error) {
            console.error('Token validation error:', error);
            return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    });
}
