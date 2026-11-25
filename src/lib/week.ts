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