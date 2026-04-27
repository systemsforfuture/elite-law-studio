/**
 * Reine Helper-Funktionen für das Personal-Modul.
 * Ausgelagert aus der UI, damit unit-testbar.
 */

/** Werktage zwischen zwei Daten (inkl.) — Wochenenden werden übersprungen. */
export const countWerktage = (von: string, bis: string): number => {
  const v = new Date(von);
  const b = new Date(bis);
  if (isNaN(v.getTime()) || isNaN(b.getTime())) return 0;
  if (b < v) return 0;
  let count = 0;
  const cur = new Date(v);
  while (cur <= b) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

/** Differenz zweier "HH:mm" Strings in Minuten (ende-start). */
export const diffMinutes = (start: string, ende: string): number => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = ende.split(":").map(Number);
  const parts = [sh, sm, eh, em];
  if (parts.some((n) => n === undefined || Number.isNaN(n))) return 0;
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
};

/** Minuten in "h:mm h" String (z.B. 150 → "2:30 h"). */
export const formatHours = (min: number): string => {
  const safe = Math.max(0, Math.floor(min));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}:${m.toString().padStart(2, "0")} h`;
};
