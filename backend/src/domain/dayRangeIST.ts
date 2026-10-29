/**
 * Returns the UTC Date range representing midnight to 23:59:59.999 in Asia/Kolkata (IST = UTC+05:30).
 * This ensures that business revenue is strictly computed based on the restaurant's operational day,
 * avoiding UTC drift.
 */
export function getDayRangeIST(referenceDate: Date = new Date()): {
  start: Date;
  end: Date;
  istDateString: string;
} {
  // IST offset is +5.5 hours (+330 minutes)
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

  // Convert current UTC time to IST instant
  const istInstant = new Date(referenceDate.getTime() + IST_OFFSET_MS);

  // Extract year, month, date in IST
  const year = istInstant.getUTCFullYear();
  const month = istInstant.getUTCMonth(); // 0-indexed
  const day = istInstant.getUTCDate();

  // Construct start of day in IST (00:00:00.000)
  // UTC time = IST time - 5.5 hours
  const startUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - IST_OFFSET_MS);

  // Construct end of day in IST (23:59:59.999)
  const endUTC = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - IST_OFFSET_MS);

  const formattedMonth = String(month + 1).padStart(2, '0');
  const formattedDay = String(day).padStart(2, '0');
  const istDateString = `${year}-${formattedMonth}-${formattedDay}`;

  return {
    start: startUTC,
    end: endUTC,
    istDateString,
  };
}
