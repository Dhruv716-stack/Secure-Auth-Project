import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { scoreRows } from '@/lib/model-client';
import { getLatestSessionBehavior, getUserHistory } from '@/lib/user-history';

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
        const sessionId = body.sessionId ?? null;

        // The request body carries the proposed transaction, not the user's
        // behaviour. Take the behaviour from what the browser has already
        // reported for this session; sending zeroes for clicks, mouse movement
        // and time on page would describe a bot, and the model would rightly
        // flag every request as High.
        const observed = await getLatestSessionBehavior(user.customerId, sessionId);

        // When nothing has been observed yet -- a new user, or the first
        // seconds of a session -- those fields are simply omitted. predict.py
        // imputes missing columns from its own training distribution, which is
        // what it does for absent data everywhere else. Substituting zeroes
        // here would not be "no information", it would be a positive claim
        // that the user did nothing.
        const row = {
            ...(observed ?? {}),
            // The transaction being proposed always comes from the request.
            device_type: body.device ?? observed?.device_type ?? null,
            geolocation_city:
                typeof body.location === 'string'
                    ? body.location.split(',')[0]
                    : observed?.geolocation_city ?? null,
            transaction_amount: Number(body.amount),
            transaction_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
        };

        const history = await getUserHistory(user.customerId, sessionId);
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
