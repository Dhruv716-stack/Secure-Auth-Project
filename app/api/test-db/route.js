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
exports.POST = POST;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
function GET(req) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Test database connection and schema
            const users = yield prisma_1.prisma.user.findMany({
                take: 5,
                include: {
                    typingPatterns: true
                }
            });
            return server_1.NextResponse.json({
                message: 'Database connection successful',
                users: users.map(user => ({
                    id: user.id,
                    customerId: user.customerId,
                    email: user.email,
                    hasTypingPattern: user.hasTypingPattern,
                    typingPatternsCount: user.typingPatterns.length
                }))
            });
        }
        catch (error) {
            console.error('Database test error:', error);
            return server_1.NextResponse.json({
                error: 'Database test failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 500 });
        }
    });
}
function POST(req) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = yield req.json();
            const { userId, pattern, quality } = body;
            // Test creating a typing pattern
            const typingPattern = yield prisma_1.prisma.typingPattern.create({
                data: {
                    userId,
                    pattern: JSON.stringify(pattern),
                    quality: quality || 0.5,
                    type: 'manual'
                }
            });
            return server_1.NextResponse.json({
                message: 'Typing pattern created successfully',
                pattern: typingPattern
            });
        }
        catch (error) {
            console.error('Create pattern error:', error);
            return server_1.NextResponse.json({
                error: 'Failed to create typing pattern',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 500 });
        }
    });
}
