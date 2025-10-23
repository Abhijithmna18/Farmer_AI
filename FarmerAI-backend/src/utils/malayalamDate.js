// Malayalam (Kollavarsham) calendar helper
// Note: This is an approximate mapping based on month ranges and New Year around mid-August.
// Year offset: Kollavarsham year roughly = Gregorian year - 825, adjusting around mid-August.

const MALAYALAM_MONTHS = [
  { name: 'Chingam', range: { start: { m: 8, d: 17 }, end: { m: 9, d: 16 } } },
  { name: 'Kanni', range: { start: { m: 9, d: 17 }, end: { m: 10, d: 17 } } },
  { name: 'Thulam', range: { start: { m: 10, d: 18 }, end: { m: 11, d: 16 } } },
  { name: 'Vrischikam', range: { start: { m: 11, d: 17 }, end: { m: 12, d: 16 } } },
  { name: 'Dhanu', range: { start: { m: 12, d: 17 }, end: { m: 1, d: 14 } } },
  { name: 'Makaram', range: { start: { m: 1, d: 15 }, end: { m: 2, d: 12 } } },
  { name: 'Kumbham', range: { start: { m: 2, d: 13 }, end: { m: 3, d: 14 } } },
  { name: 'Meenam', range: { start: { m: 3, d: 15 }, end: { m: 4, d: 13 } } },
  { name: 'Medam', range: { start: { m: 4, d: 14 }, end: { m: 5, d: 14 } } },
  { name: 'Edavam', range: { start: { m: 5, d: 15 }, end: { m: 6, d: 15 } } },
  { name: 'Mithunam', range: { start: { m: 6, d: 16 }, end: { m: 7, d: 16 } } },
  { name: 'Karkidakam', range: { start: { m: 7, d: 17 }, end: { m: 8, d: 16 } } },
];

function compareMonthDay(a, b) {
  if (a.m !== b.m) return a.m - b.m;
  return a.d - b.d;
}

function toMalayalam(dateInput) {
  const date = new Date(dateInput);
  const y = date.getFullYear();
  const m = date.getMonth() + 1; // 1-12
  const d = date.getDate();

  // Determine Malayalam year: if date >= Aug 17, malYear = y - 825, else y - 826
  const newYear = { m: 8, d: 17 };
  const cmp = compareMonthDay({ m, d }, newYear);
  const malYear = (cmp >= 0) ? (y - 825) : (y - 826);

  // Find Malayalam month by range
  let monthIndex = 0;
  for (let i = 0; i < MALAYALAM_MONTHS.length; i++) {
    const { start, end } = MALAYALAM_MONTHS[i].range;
    const afterStart = compareMonthDay({ m, d }, start) >= 0 || (start.m > end.m && (m >= start.m || m <= end.m));
    const beforeEnd = compareMonthDay({ m, d }, end) <= 0 || (start.m > end.m && (m >= start.m || m <= end.m));
    if (start.m <= end.m) {
      if (compareMonthDay({ m, d }, start) >= 0 && compareMonthDay({ m, d }, end) <= 0) {
        monthIndex = i;
        break;
      }
    } else {
      // wraps year end (e.g., Dhanu)
      const inWrap = (m > start.m || (m === start.m && d >= start.d)) || (m < end.m || (m === end.m && d <= end.d));
      if (inWrap) {
        monthIndex = i;
        break;
      }
    }
  }

  return {
    year: malYear,
    monthIndex,
    month: MALAYALAM_MONTHS[monthIndex].name,
    day: d,
    gregorian: date,
  };
}

function fromMalayalam({ year, monthIndex = 0, day = 1 }) {
  // Approximate mapping: choose the start of the Malayalam month window and add day offset
  const { start } = MALAYALAM_MONTHS[monthIndex].range;
  // Malayalam year + 825 => Gregorian year anchor; if month before Aug, anchor is year+826
  // We approximate with anchor at Aug cycle: If start month < 8 (Aug), use year+826 else year+825
  const anchorYear = (start.m < 8) ? (year + 826) : (year + 825);
  const base = new Date(anchorYear, start.m - 1, start.d);
  base.setDate(base.getDate() + (day - 1));
  return base;
}

module.exports = {
  MALAYALAM_MONTHS,
  toMalayalam,
  fromMalayalam,
};
