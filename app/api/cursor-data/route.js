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
            // Get authentication token
            const token = (_a = req.cookies.get('auth-token')) === null || _a === void 0 ? void 0 : _a.value;
            if (!token) {
                return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            // Verify JWT to get user ID
            const payload = (0, auth_1.verifyJWT)(token);
            if (!payload) {
                return server_1.NextResponse.json({ error: 'Invalid token' }, { status: 401 });
            }
            // Get cursor data for the current user
            const cursorData = yield prisma_1.prisma.cursorData.findMany({
                where: {
                    userId: payload.userId,
                    action: 'batch' // Only get batch records
                },
                orderBy: {
                    timestamp: 'desc'
                },
                take: 10 // Get last 10 records
            });
            return server_1.NextResponse.json({
                success: true,
                count: cursorData.length,
                data: cursorData.map(record => ({
                    id: record.id,
                    timestamp: record.timestamp,
                    x: record.x,
                    y: record.y,
                    cursorArray: record.cursorArray,
                    cursorCount: Array.isArray(record.cursorArray) ? record.cursorArray.length : 0
                }))
            });
        }
        catch (error) {
            console.error('Error fetching cursor data:', error);
            return server_1.NextResponse.json({ error: 'Failed to fetch cursor data' }, { status: 500 });
        }
    });
}
