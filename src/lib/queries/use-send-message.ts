import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface SendMessageInput {
  channel: "email" | "whatsapp";
  to: string;
  subject?: string;
  text: string;
  mandant_id?: string;
  in_reply_to?: string;
}

export interface SendMessageResult {
  ok: boolean;
  konversation_id?: string;
  provider_id?: string;
  provider_error?: string;
  mock_mode?: boolean;
}

export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SendMessageInput): Promise<SendMessageResult> => {
      if (!isSupabaseConfigured || !supabase) {
        await new Promise((r) => setTimeout(r, 600));
        return { ok: true, mock_mode: true };
      }
      const { data, error } = await supabase.functions.invoke(
        "send-message",
        { body: input },
      );
      if (error) throw error;
      return data as SendMessageResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["konversationen"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
};
