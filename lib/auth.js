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
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateJWT = generateJWT;
exports.verifyJWT = verifyJWT;
exports.createUser = createUser;
exports.authenticateUser = authenticateUser;
exports.getUserById = getUserById;
exports.getUserByCustomerId = getUserByCustomerId;
exports.createSession = createSession;
exports.getSessionByToken = getSessionByToken;
exports.deleteSession = deleteSession;
exports.cleanupExpiredSessions = cleanupExpiredSessions;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("./prisma");
// Password hashing
function hashPassword(password) {
    return __awaiter(this, void 0, void 0, function* () {
        const saltRounds = 12;
        return bcryptjs_1.default.hash(password, saltRounds);
    });
}
function verifyPassword(password, hashedPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return bcryptjs_1.default.compare(password, hashedPassword);
    });
}
// JWT functions
function generateJWT(payload) {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn });
}
function verifyJWT(token) {
    try {
        const secret = process.env.JWT_SECRET;
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        return decoded;
    }
    catch (error) {
        return null;
    }
}
// User functions
function createUser(userData) {
    return __awaiter(this, void 0, void 0, function* () {
        const { customerId, email, password, name, phone, profileImage } = userData;
        // Check if user already exists
        const existingUser = yield prisma_1.prisma.user.findFirst({
            where: {
                OR: [
                    { customerId },
                    { email }
                ]
            }
        });
        if (existingUser) {
            throw new Error('User with this customer ID or email already exists');
        }
        // Hash password
        const passwordHash = yield hashPassword(password);
        // Create user
        const user = yield prisma_1.prisma.user.create({
            data: {
                customerId,
                email,
                passwordHash,
                name,
                phone,
                profileImage
            }
        });
        return user;
    });
}
function authenticateUser(customerId, password) {
    return __awaiter(this, void 0, void 0, function* () {
        // Find user by customer ID
        const user = yield prisma_1.prisma.user.findUnique({
            where: { customerId }
        });
        if (!user) {
            throw new Error('Invalid customer ID or password');
        }
        // Verify password
        const isValidPassword = yield verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
            throw new Error('Invalid customer ID or password');
        }
        // Update last login
        yield prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });
        return user;
    });
}
function getUserById(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.prisma.user.findUnique({
            where: { id: userId }
        });
    });
}
function getUserByCustomerId(customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.prisma.user.findUnique({
            where: { customerId }
        });
    });
}
// Session management
function createSession(userId, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
        return prisma_1.prisma.session.create({
            data: {
                userId,
                token,
                expiresAt
            }
        });
    });
}
function getSessionByToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.prisma.session.findUnique({
            where: { token },
            include: { user: true }
        });
    });
}
function deleteSession(token) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.prisma.session.delete({
            where: { token }
        });
    });
}
function cleanupExpiredSessions() {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.prisma.session.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });
    });
}
