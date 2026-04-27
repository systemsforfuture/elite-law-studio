/**
 * Warnt den User wenn ein Hook auf Mock-Daten zurückfällt obwohl Supabase
 * konfiguriert ist. DSGVO-relevant: User soll nicht denken er sehe echte
 * Mandanten-Daten obwohl gerade Bergmann-Demo angezeigt wird.
 *
 * De-dupliziert: pro key + pro Session nur 1× Toast (sonst Spam bei Polling).
 */
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/lib/supabase";

const warnedKeys = new Set<string>();

export const warnMockFallback = (key: string, errorMessage?: string) => {
  if (!isSupabaseConfigured) return; // Demo-Mode: erwartet, kein Warning
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);
  console.error(`[${key}] fallback to mock-data:`, errorMessage);
  toast.error("Daten aktuell nicht erreichbar", {
    description: `Modul »${key}« zeigt Demo-Daten. Backend prüfen.`,
    duration: 8000,
  });
};

/** Test-Helper, entfernt eingetragene Keys. Für Vitest. */
export const __resetWarnedKeys = () => warnedKeys.clear();
