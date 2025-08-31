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
exports.authenticateRequest = authenticateRequest;
exports.withAuth = withAuth;
const server_1 = require("next/server");
const auth_1 = require("./auth");
function authenticateRequest(req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const authHeader = req.headers.get('authorization');
        const token = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.replace('Bearer ', '')) || ((_a = req.cookies.get('auth-token')) === null || _a === void 0 ? void 0 : _a.value);
        if (!token) {
            throw new Error('No authentication token provided');
        }
        // Verify JWT
        const payload = (0, auth_1.verifyJWT)(token);
        if (!payload) {
            throw new Error('Invalid or expired token');
        }
        // Check if session exists in database
        const session = yield (0, auth_1.getSessionByToken)(token);
        if (!session || session.expiresAt < new Date()) {
            throw new Error('Session expired or not found');
        }
        // Add user info to request
        const authenticatedReq = req;
        authenticatedReq.user = {
            id: payload.userId,
            customerId: payload.customerId,
            email: payload.email
        };
        return authenticatedReq;
    });
}
function withAuth(handler) {
    return (req) => __awaiter(this, void 0, void 0, function* () {
        try {
            const authenticatedReq = yield authenticateRequest(req);
            return handler(authenticatedReq);
        }
        catch (error) {
            return server_1.NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
    });
}
