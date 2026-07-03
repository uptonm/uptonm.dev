import dayjs from "dayjs";

/**
 * Format a start/end date range as "MMM YYYY - MMM YYYY", or
 * "MMM YYYY - Present" when there is no end date. Accepts ISO/parsable
 * date strings (as stored in copy.ts) or Date objects.
 */
export function renderDateRange(start: string | Date, end?: string | Date) {
  const startLabel = dayjs(start).format("MMM YYYY");
  const endLabel = end ? dayjs(end).format("MMM YYYY") : "Present";
  return `${startLabel} - ${endLabel}`;
}
