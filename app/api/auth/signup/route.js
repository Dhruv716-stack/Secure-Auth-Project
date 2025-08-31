"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
        try {
            const body = yield req.json();
            const { customerId, email, password, name, phone, profileImage, typingPattern } = body;
            // Validate required fields
            if (!customerId || !email || !password) {
                return server_1.NextResponse.json({ error: 'Customer ID, email, and password are required' }, { status: 400 });
            }
            // Validate customer ID format (you can customize this)
            if (!/^\d{10}$/.test(customerId)) {
                return server_1.NextResponse.json({ error: 'Customer ID must be exactly 10 digits' }, { status: 400 });
            }
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return server_1.NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
            }
            // Validate password strength
            if (password.length < 8) {
                return server_1.NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
            }
            // Create user
            const user = yield (0, auth_1.createUser)({
                customerId,
                email,
                password,
                name,
                phone,
                profileImage
            });
            // Generate JWT token
            const token = (0, auth_1.generateJWT)({
                userId: user.id,
                customerId: user.customerId,
                email: user.email
            });
            // Save typing pattern if provided
            if (typingPattern && typingPattern.pattern && typingPattern.text) {
                const { prisma } = yield Promise.resolve().then(() => __importStar(require('@/lib/prisma')));
                // Save pattern to database
                yield prisma.typingPattern.create({
                    data: {
                        userId: user.id,
                        pattern: typingPattern.pattern, // Already JSON string from frontend
                        quality: typingPattern.quality || 0.5,
                        type: 'manual'
                    }
                });
                // Update user to indicate they have a typing pattern
                yield prisma.user.update({
                    where: { id: user.id },
                    data: { hasTypingPattern: true }
                });
            }
            // Create session in database
            yield (0, auth_1.createSession)(user.id, token);
            // Set HTTP-only cookie
            const response = server_1.NextResponse.json({
                message: 'User created successfully',
                user: {
                    id: user.id,
                    customerId: user.customerId,
                    email: user.email,
                    name: user.name,
                    profileImage: user.profileImage,
                    hasTypingPattern: typingPattern ? true : false
                }
            }, { status: 201 });
            // Set secure cookie
            response.cookies.set('auth-token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 // 24 hours
            });
            return response;
        }
        catch (error) {
            console.error('Signup error:', error);
            if (error instanceof Error) {
                if (error.message.includes('already exists')) {
                    return server_1.NextResponse.json({ error: error.message }, { status: 409 });
                }
            }
            return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    });
}
