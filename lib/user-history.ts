/**
 * Fetches a user's own past behaviour, so the model can measure how far the
 * current session deviates from their personal baseline.
 *
 * This is what powers the account-takeover signals in predict.py:
 * is_new_device_for_user, is_new_browser_for_user, is_new_city_for_user, and
 * the click/keyboard/time z-scores. Without history those features evaluate to
 * 0 -- "no deviation observed" -- which is honest but blind: a stolen account
 * used from an unfamiliar device in an unfamiliar city looks ordinary.
 */

import { prisma } from '@/lib/prisma';
import type { BehaviorRow } from '@/lib/model-client';

/**
 * How many past rows to consider. Enough for a stable baseline while keeping
 * the query bounded as the table grows -- rows accumulate at roughly one per
 * second per active user and are no longer deleted after scoring.
 */
const HISTORY_LIMIT = 50;

/**
 * Fetch prior behaviour for a user, excluding the session being scored.
 *
 * Excluding the current session is essential, not an optimisation. The
 * "is this device new for this user" features compare the current row against
 * the set of devices seen in history. If the current session's own rows are in
 * that set, its device is trivially already known, every such feature collapses
 * to 0, and account-takeover detection silently stops working -- with no error
 * to notice.
 *
 * Returns [] when there is no history (new users, or the current session is all
 * there is). That is a valid input: the model degrades to baseline-free
 * scoring. Note the z-score features additionally need at least 2 rows, so a
 * user's second-ever session still scores without personal baselines.
 */
/**
 * Fetch the most recent observed behaviour for a session.
 *
 * The browser already reports click, scroll, keyboard, mouse and time-on-page
 * counts once per second (see hooks/useSessionBatch). Endpoints that score a
 * proposed action -- rather than a batch of collected rows -- do not carry
 * those numbers in their request body, and sending zeroes instead is actively
 * misleading: a session with no clicks, no mouse movement and no time on page
 * does not look like a cautious user, it looks like a bot, so the model
 * correctly flags it. Every such request then scores High regardless of what
 * the user actually did.
 *
 * Reading the latest stored row for the session gives the model real
 * behaviour to judge. Returns null when nothing has been recorded yet, which
 * is normal for the first few seconds of a session; callers should fall back
 * to letting predict.py impute rather than substituting zeroes.
 */
export async function getLatestSessionBehavior(
  customerId: string,
  sessionId: string | null,
): Promise<BehaviorRow | null> {
  if (!customerId || !sessionId) return null;

  try {
    const row = await prisma.modelInput.findFirst({
      where: { customer_id: customerId, session_id: sessionId },
      orderBy: { id: 'desc' },
      select: {
        device_type: true,
        click_events: true,
        scroll_events: true,
        touch_events: true,
        keyboard_events: true,
        device_motion: true,
        time_on_page: true,
        screen_size: true,
        browser_info: true,
        language: true,
        timezone_offset: true,
        device_orientation: true,
        geolocation_city: true,
        mouse_movement: true,
      },
    });

    return row;
  } catch (error) {
    console.error('Failed to fetch session behaviour:', error);
    return null;
  }
}

export async function getUserHistory(
  customerId: string,
  currentSessionId: string | null,
): Promise<BehaviorRow[]> {
  if (!customerId) return [];

  try {
    const rows = await prisma.modelInput.findMany({
      where: {
        customer_id: customerId,
        ...(currentSessionId ? { session_id: { not: currentSessionId } } : {}),
      },
      // Most recent first: a baseline should reflect how the user behaves now,
      // not how they behaved when the account was new.
      orderBy: { id: 'desc' },
      take: HISTORY_LIMIT,
      // Only the six fields predict.py actually reads from history. Selecting
      // the whole row would pull far more data than the model looks at.
      select: {
        click_events: true,
        keyboard_events: true,
        time_on_page: true,
        device_type: true,
        browser_info: true,
        geolocation_city: true,
      },
    });

    return rows;
  } catch (error) {
    // History is an enhancement, not a prerequisite. A failed lookup should
    // weaken detection, not block a transaction the user is waiting on.
    console.error('Failed to fetch user history; scoring without baseline:', error);
    return [];
  }
}
