import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { scoreRows } from '@/lib/model-client';
import { getUserHistory } from '@/lib/user-history';

/**
 * Pre-flight risk check, called from the send-money form before a transfer is
 * committed. Scores the proposed transaction without recording anything.
 */
export async function POST(req: NextRequest) {
    try {
        // Authenticated so the score can be personalised against this user's
        // own history. Without an identity the account-takeover features have
        // nothing to compare against and silently contribute nothing.
        const token = req.cookies.get('auth-token')?.value;
        const user = token ? verifyJWT(token) : null;
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await req.json();

        // Only fields the caller actually knows are populated. predict.py
        // imputes the rest; inventing values here would fabricate behaviour.
        const row = {
            device_type: body.device ?? null,
            geolocation_city:
                typeof body.location === 'string' ? body.location.split(',')[0] : null,
            transaction_amount: Number(body.amount),
            transaction_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
        };

        const history = await getUserHistory(user.customerId, body.sessionId ?? null);
        const [result] = await scoreRows([row], history);

        return NextResponse.json({
            risk: result.risk_level,
            score: result.anomaly_score,
            reason: result.risk_reason,
        });
    } catch (error) {
        // 503, not a default verdict. This endpoint gates a money transfer, so
        // "we could not assess this" must be distinguishable from "this is
        // safe" -- an earlier version returned 'Low' on failure, which made an
        // outage look like a clean result.
        console.error('Risk predict failed:', error);
        return NextResponse.json({ error: 'Risk model unavailable' }, { status: 503 });
    }
}
