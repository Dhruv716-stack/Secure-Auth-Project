import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const user = verifyJWT(token);
        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }
        // Fetch latest 5 modelOutput records for this customerId
        const outputs = await prisma.modelOutput.findMany({
            where: { customerId: user.customerId },
            orderBy: { id: 'desc' },
            take: 5,
        });
        return NextResponse.json({ outputs });
    } catch (error) {
        console.error('Fetch modelOutput error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 