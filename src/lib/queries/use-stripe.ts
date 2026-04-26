import { useMutation } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface CheckoutResult {
  url: string;
  session_id?: string;
  mock_mode?: boolean;
  message?: string;
}

export const useStripeCheckout = () =>
  useMutation({
    mutationFn: async (rechnung_id: string): Promise<CheckoutResult> => {
      if (!isSupabaseConfigured || !supabase) {
        return {
          url: "https://checkout.stripe.com/demo/" + rechnung_id,
          mock_mode: true,
          message: "Demo-Mode — kein echter Checkout",
        };
      }
      const { data, error } = await supabase.functions.invoke(
        "stripe-checkout",
        { body: { rechnung_id } },
      );
      if (error) throw error;
      return data as CheckoutResult;
    },
  });
