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
const prisma_1 = require("@/lib/prisma");
function POST(req) {
    return __awaiter(this, void 0, void 0, function* () {
        let customerId;
        try {
            const body = yield req.json();
            customerId = body.customerId;
            const { password, typingPattern, retryAttempt = 0 } = body;
            // Validate required fields
            if (!customerId || !password) {
                return server_1.NextResponse.json({ error: 'Customer ID and password are required' }, { status: 400 });
            }
            // Validate customer ID format
            if (!/^\d{10}$/.test(customerId)) {
                return server_1.NextResponse.json({ error: 'Customer ID must be exactly 10 digits' }, { status: 400 });
            }
            // Authenticate user
            const user = yield (0, auth_1.authenticateUser)(customerId, password);
            // Log successful login attempt
            try {
                const ip = req.headers.get('x-forwarded-for') || '';
                let location = 'Unknown';
                if (ip && ip !== '::1' && ip !== '127.0.0.1') {
                    try {
                        const geoRes = yield fetch(`https://ipapi.co/${ip}/json/`);
                        const geo = yield geoRes.json();
                        if (geo && geo.city && geo.country) {
                            location = `${geo.city}, ${geo.country}`;
                        }
                    }
                    catch (_a) { }
                }
                yield prisma_1.prisma.authActivity.create({
                    data: {
                        customerId: user.customerId,
                        userId: user.id,
                        type: 'Login Attempt',
                        status: 'Success',
                        device: req.headers.get('user-agent') || 'Unknown Device',
                        ip,
                        location,
                    }
                });
            }
            catch (e) { /* ignore logging errors */ }
            // Verify typing pattern if provided and user has one
            if (typingPattern && typingPattern.pattern && typingPattern.text) {
                try {
                    // Use the manual verification endpoint
                    const verificationResponse = yield fetch(`${req.nextUrl.origin}/api/auth/typing-pattern/verify-manual`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            customerId,
                            pattern: typingPattern.pattern,
                            text: typingPattern.text
                        })
                    });
                    const verificationResult = yield verificationResponse.json();
                    if (!verificationResult.success || verificationResult.score < 0.5) {
                        console.log('Typing pattern verification failed:', verificationResult);
                        // Check if user has retry attempts left
                        const maxRetries = 3;
                        const attemptsLeft = maxRetries - (retryAttempt + 1);
                        console.log('Typing pattern retry debug:', {
                            retryAttempt,
                            maxRetries,
                            attemptsLeft,
                            willRetry: attemptsLeft >= 0
                        });
                        if (attemptsLeft >= 0) {
                            return server_1.NextResponse.json({
                                error: 'Typing pattern verification failed. Please try typing more consistently.',
                                retryAttempt: retryAttempt + 1,
                                attemptsLeft,
                                canRetry: true,
                                score: verificationResult.score,
                                message: `Score: ${(verificationResult.score * 100).toFixed(1)}%. Try typing more consistently.`
                            }, { status: 401 });
                        }
                        else {
                            return server_1.NextResponse.json({
                                error: 'Typing pattern verification failed after multiple attempts. Please try again later.',
                                canRetry: false,
                                score: verificationResult.score
                            }, { status: 401 });
                        }
                    }
                    console.log('Typing pattern verification successful:', verificationResult);
                }
                catch (verificationError) {
                    console.error('Verification error:', verificationError);
                    // Continue with login even if verification fails
                }
            }
            // Generate JWT token
            const token = (0, auth_1.generateJWT)({
                userId: user.id,
                customerId: user.customerId,
                email: user.email
            });
            // Create session in database
            yield (0, auth_1.createSession)(user.id, token);
            // Set HTTP-only cookie
            const response = server_1.NextResponse.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    customerId: user.customerId,
                    email: user.email,
                    name: user.name
                }
            }, { status: 200 });
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
            console.error('Login error:', error);
            // DEBUG: Log error message and type
            console.log('[DEBUG] Entered catch block in login route. Error:', error, 'Type:', typeof error, 'Message:', error instanceof Error ? error.message : 'N/A');
            if (error instanceof Error) {
                if (error.message.includes('Invalid customer ID or password')) {
                    // Only log if customerId exists
                    try {
                        const user = yield prisma_1.prisma.user.findUnique({ where: { customerId } });
                        console.log('[DEBUG] Looked up user for failed login:', user);
                        if (user) {
                            const ip = req.headers.get('x-forwarded-for') || '';
                            let location = 'Unknown';
                            if (ip && ip !== '::1' && ip !== '127.0.0.1') {
                                try {
                                    const geoRes = yield fetch(`https://ipapi.co/${ip}/json/`);
                                    const geo = yield geoRes.json();
                                    if (geo && geo.city && geo.country) {
                                        location = `${geo.city}, ${geo.country}`;
                                    }
                                }
                                catch (_b) { }
                            }
                            const failedData = {
                                customerId,
                                userId: user.id,
                                type: 'Login Attempt',
                                status: 'Failed',
                                device: req.headers.get('user-agent') || 'Unknown Device',
                                ip,
                                location,
                            };
                            console.log('[AuthActivity] Logging failed login attempt:', failedData);
                            try {
                                yield prisma_1.prisma.authActivity.create({ data: failedData });
                                console.log('[AuthActivity] Failed login attempt written successfully');
                                // Also create a notification for the user
                                yield prisma_1.prisma.notification.create({
                                    data: {
                                        userId: user.id,
                                        type: 'alert',
                                        message: `Failed login attempt detected for your account (Customer ID: ${customerId}). If this wasn't you, please reset your password.`,
                                        read: false,
                                    }
                                });
                            }
                            catch (writeErr) {
                                console.error('[AuthActivity] Error writing failed login attempt:', writeErr);
                            }
                        }
                    }
                    catch (e) { /* ignore logging errors */ }
                    return server_1.NextResponse.json({ error: 'Invalid customer ID or password' }, { status: 401 });
                }
            }
            return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    });
}
