export function todayHT(): Date {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Port-au-Prince",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(s + "T00:00:00Z");
}

export function mondayOf(d: Date): Date {
  const base = new Date(d.toISOString().slice(0, 10) + "T00:00:00Z");
  const diff = (base.getUTCDay() + 6) % 7;
  base.setUTCDate(base.getUTCDate() - diff);
  return base;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

export const iso = (d: Date) => d.toISOString().slice(0, 10);

const MONTHS = ["Jan", "Fev", "Mas", "Avr", "Me", "Jen", "Jiy", "Out", "Sep", "Okt", "Nov", "Des"];

function ordinal(n: number) {
  return n === 1 ? "1e" : `${n}yèm`;
}

// Memo aksyon lendi: "Aksyon 2yèm lendi - 8 Jen 26"
export function shareNote(monday: Date): string {
  const day = monday.getUTCDate();
  const nth = Math.floor((day - 1) / 7) + 1;
  const yy = String(monday.getUTCFullYear()).slice(-2);
  return `Aksyon ${ordinal(nth)} lendi - ${day} ${MONTHS[monday.getUTCMonth()]} ${yy}`;
}