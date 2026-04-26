import { useMutation } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface TriageResult {
  kategorie:
    | "mandantenanfrage"
    | "behoerde"
    | "werbung"
    | "spam"
    | "internes";
  intent: string;
  konfidenz: number;
  eskalation_noetig: boolean;
  eskalation_grund?: string;
  antwort_vorschlag: string;
}

const MOCK_RESULT: TriageResult = {
  kategorie: "mandantenanfrage",
  intent: "termin_anfrage",
  konfidenz: 0.91,
  eskalation_noetig: false,
  antwort_vorschlag:
    "Vielen Dank für Ihre Nachricht. Gerne können wir einen Erstgesprächstermin vereinbaren — buchen Sie hier Ihren Wunsch-Slot: <Link>. Mit freundlichen Grüßen, Ihre Kanzlei.",
};

export const useTriageInbox = () =>
  useMutation({
    mutationFn: async (konversation_id: string): Promise<TriageResult> => {
      if (!isSupabaseConfigured || !supabase) {
        await new Promise((r) => setTimeout(r, 800));
        return MOCK_RESULT;
      }
      const { data, error } = await supabase.functions.invoke("triage-inbox", {
        body: { konversation_id },
      });
      if (error) throw error;
      const result = (data as { result?: TriageResult })?.result;
      if (!result) throw new Error("Kein Triage-Ergebnis");
      return result;
    },
  });
