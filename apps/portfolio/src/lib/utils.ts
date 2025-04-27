import dayjs from "dayjs";

/**
 * StringToHslColor accepts a string, saturation, and lightness and calculates a hsl color based on the string.
 *
 * @param {string} str - string value
 * @param {number} s - saturation
 * @param {number} l - lightness
 * @returns {string} hslColor
 */
export function StringToHslColor(str: string, s: number = 50, l: number = 50) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return "hsl(" + (hash % 360) + ", " + s + "%, " + l + "%)";
}

export function renderDateRange(start: Date, end?: Date) {
  const [startDate, endDate] = [dayjs(start), dayjs(end)];
  return `${startDate.format("MMM YYYY")} - ${end ? endDate.format("MMM YYYY") : "Present"}`;
}
