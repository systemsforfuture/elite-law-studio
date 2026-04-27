// Shared Datums-Helfer für UI-Pages (Berlin-lokale Tag-Vergleiche).

export const isSameDay = (iso: string, ref: Date = new Date()): boolean => {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
};

export const isWithinLastHours = (iso: string, hours: number): boolean => {
  const d = new Date(iso).getTime();
  return Date.now() - d <= hours * 3600_000;
};

export const isWithinLastDays = (iso: string, days: number): boolean =>
  isWithinLastHours(iso, days * 24);
