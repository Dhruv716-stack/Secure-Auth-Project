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
function GET(req) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { searchParams } = new URL(req.url);
            const customerId = searchParams.get('customerId');
            if (!customerId) {
                return server_1.NextResponse.json({
                    error: 'Customer ID is required'
                }, { status: 400 });
            }
            // Find user
            const user = yield prisma_1.prisma.user.findUnique({
                where: { customerId }
            });
            if (!user) {
                return server_1.NextResponse.json({
                    error: 'User not found'
                }, { status: 404 });
            }
            // Get typing patterns using raw query
            const patterns = yield prisma_1.prisma.$queryRaw `
      SELECT * FROM typing_patterns 
      WHERE user_id = ${user.id} 
      ORDER BY created_at DESC
    `;
            return server_1.NextResponse.json({
                user: {
                    id: user.id,
                    customerId: user.customerId,
                    email: user.email
                },
                patterns: patterns,
                patternsCount: patterns.length
            });
        }
        catch (error) {
            console.error('Debug patterns error:', error);
            return server_1.NextResponse.json({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 500 });
        }
    });
}
