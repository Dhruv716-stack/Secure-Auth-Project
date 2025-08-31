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
const prisma_1 = require("@/lib/prisma");
const auth_1 = require("@/lib/auth");
function GET(req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const token = (_a = req.cookies.get('auth-token')) === null || _a === void 0 ? void 0 : _a.value;
            if (!token) {
                return server_1.NextResponse.json({ error: 'Authentication required' }, { status: 401 });
            }
            const user = (0, auth_1.verifyJWT)(token);
            if (!user) {
                return server_1.NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
            }
            const activities = yield prisma_1.prisma.authActivity.findMany({
                where: { customerId: user.customerId },
                orderBy: { createdAt: 'desc' },
            });
            return server_1.NextResponse.json({ activities });
        }
        catch (error) {
            return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    });
}
