import { describe, it, expect } from 'vitest';
import { getDayRangeIST } from '../src/domain/dayRangeIST.js';

describe('Asia/Kolkata IST Day Range Calculation', () => {
  it('13. computes exact 00:00:00 to 23:59:59.999 IST bounds aligned with UTC offset (+5:30)', () => {
    // Reference instant: 2026-10-29 at 12:00:00 UTC (which is 17:30:00 IST)
    const refDate = new Date('2026-10-29T12:00:00.000Z');
    const { start, end, istDateString } = getDayRangeIST(refDate);

    expect(istDateString).toBe('2026-10-29');

    // Midnight IST on 2026-10-29 is 2026-10-28 18:30:00.000 UTC
    expect(start.toISOString()).toBe('2026-10-28T18:30:00.000Z');

    // 23:59:59.999 IST on 2026-10-29 is 2026-10-29 18:29:59.999 UTC
    expect(end.toISOString()).toBe('2026-10-29T18:29:59.999Z');

    // Verify exactly 24 hours (86,400,000 milliseconds minus 1 ms)
    const spanMs = end.getTime() - start.getTime();
    expect(spanMs).toBe(24 * 60 * 60 * 1000 - 1);
  });

  it('correctly categorizes timestamps across the IST midnight boundary', () => {
    const range = getDayRangeIST(new Date('2026-10-29T12:00:00.000Z'));

    // 1 second before midnight IST (18:29:59 UTC on Oct 28) -> should NOT be included
    const justBeforeMidnight = new Date('2026-10-28T18:29:59.000Z');
    expect(justBeforeMidnight.getTime() < range.start.getTime()).toBe(true);

    // 1 second after midnight IST (18:30:01 UTC on Oct 28) -> MUST be included
    const justAfterMidnight = new Date('2026-10-28T18:30:01.000Z');
    expect(
      justAfterMidnight.getTime() >= range.start.getTime() &&
        justAfterMidnight.getTime() <= range.end.getTime()
    ).toBe(true);

    // 1 second after end of day IST (18:30:01 UTC on Oct 29) -> should NOT be included
    const nextDay = new Date('2026-10-29T18:30:01.000Z');
    expect(nextDay.getTime() > range.end.getTime()).toBe(true);
  });
});
