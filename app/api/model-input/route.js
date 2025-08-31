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
const prisma_1 = require("@/lib/prisma");
function POST(req) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield req.json();
            if (!Array.isArray(data)) {
                return server_1.NextResponse.json({ error: 'Expected an array of session data' }, { status: 400 });
            }
            // Batch insert
            yield prisma_1.prisma.modelInput.createMany({ data });
            return server_1.NextResponse.json({ success: true });
        }
        catch (error) {
            console.error('Failed to save session batch:', error);
            return server_1.NextResponse.json({ error: 'Failed to save session batch' }, { status: 500 });
        }
    });
}
