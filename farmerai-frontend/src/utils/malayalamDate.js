// Frontend Malayalam (Kollavarsham) date helpers (approximate)
export const MALAYALAM_MONTHS = [
  'Chingam','Kanni','Thulam','Vrischikam','Dhanu','Makaram','Kumbham','Meenam','Medam','Edavam','Mithunam','Karkidakam'
];

function compareMonthDay(a, b) {
  if (a.m !== b.m) return a.m - b.m;
  return a.d - b.d;
}

export function toMalayalam(dateInput) {
  const date = new Date(dateInput);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const newYear = { m: 8, d: 17 };
  const cmp = compareMonthDay({ m, d }, newYear);
  const malYear = (cmp >= 0) ? (y - 825) : (y - 826);

  const ranges = [
    { name: 'Chingam', s:{m:8,d:17}, e:{m:9,d:16} },
    { name: 'Kanni', s:{m:9,d:17}, e:{m:10,d:17} },
    { name: 'Thulam', s:{m:10,d:18}, e:{m:11,d:16} },
    { name: 'Vrischikam', s:{m:11,d:17}, e:{m:12,d:16} },
    { name: 'Dhanu', s:{m:12,d:17}, e:{m:1,d:14} },
    { name: 'Makaram', s:{m:1,d:15}, e:{m:2,d:12} },
    { name: 'Kumbham', s:{m:2,d:13}, e:{m:3,d:14} },
    { name: 'Meenam', s:{m:3,d:15}, e:{m:4,d:13} },
    { name: 'Medam', s:{m:4,d:14}, e:{m:5,d:14} },
    { name: 'Edavam', s:{m:5,d:15}, e:{m:6,d:15} },
    { name: 'Mithunam', s:{m:6,d:16}, e:{m:7,d:16} },
    { name: 'Karkidakam', s:{m:7,d:17}, e:{m:8,d:16} },
  ];
  let monthIndex = 0;
  for (let i=0;i<ranges.length;i++){
    const { s, e } = ranges[i];
    if (s.m <= e.m) {
      if (compareMonthDay({m,d}, s) >= 0 && compareMonthDay({m,d}, e) <= 0) { monthIndex = i; break; }
    } else {
      const inWrap = (m > s.m || (m===s.m && d>=s.d)) || (m < e.m || (m===e.m && d<=e.d));
      if (inWrap) { monthIndex = i; break; }
    }
  }
  return { year: malYear, monthIndex, month: MALAYALAM_MONTHS[monthIndex], day: d, gregorian: date };
}
