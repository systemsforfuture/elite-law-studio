import { useMutation } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

interface AskInput {
  message: string;
  history: AssistantMessage[];
}

interface AssistantContext {
  kanzlei_name: string;
  mandanten_count: number;
  akten_count: number;
  rechnungen_offen: number;
  rechnungen_offen_eur: number;
  fristen_kritisch_7d: number;
  termine_naechste_7d: number;
}

interface AssistantReply {
  reply: string;
  context?: AssistantContext;
  mock_mode?: boolean;
}

const MOCK_REPLIES = [
  "Im aktuellen Demo-Datensatz haben Sie 12 aktive Mandanten und 8 offene Akten. Drei Rechnungen sind in Mahnstufe 1.",
  "Die Frist nach §233 ZPO läuft 2 Wochen nach Zustellung des Urteils. Konkret heißt das: Eingang +14 Tage, danach beginnt die Berufungsfrist.",
  "Nach RVG: Streitwert 5.000€ ergibt 1,3-Verfahrensgebühr 393,90€, 1,2-Terminsgebühr 363,60€, plus 20€ Auslagenpauschale, MwSt. Gesamt netto ≈ 777,50€.",
  "Demo-Modus aktiv: SYSTEMS-KI antwortet sobald die Plattform vom Betreiber live geschaltet wurde.",
  "Ein Mahnbescheid setzt eine bezifferte Geldforderung voraus. Bei nicht bezifferten Ansprüchen kommt nur Klage in Betracht.",
];

const mockReply = () => MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];

export const useAskAssistant = () => {
  return useMutation<AssistantReply, Error, AskInput>({
    mutationFn: async ({ message, history }) => {
      if (!isSupabaseConfigured || !supabase) {
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
        return { reply: mockReply(), mock_mode: true };
      }
      const { data, error } = await supabase.functions.invoke(
        "assistant-chat",
        { body: { message, history } },
      );
      if (error) throw error;
      if (!data) throw new Error("Keine Antwort");
      return data;
    },
  });
};
