// Retounen "509XXXXXXXX" (fòma estokaj la) oswa null si nimewo a pa valid
export function normalizePhone(input: string): string | null {
  let d = input.replace(/\D/g, ""); // retire espas, +, tirè, elatriye
  if (d.length === 11 && d.startsWith("509")) d = d.slice(3);
  if (d.length !== 8) return null;
  return "509" + d;
}

// Pou afichaj: "50941149129" → "4114 9129"
export function displayPhone(stored: string): string {
  const m = stored.match(/^509(\d{4})(\d{4})$/);
  return m ? `${m[1]} ${m[2]}` : stored;
}