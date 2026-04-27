import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { warnMockFallback } from "@/lib/queries/warn-fallback";

const shouldMock = () => !isSupabaseConfigured || !supabase;

export interface LlmUsageRow {
  task: string;
  provider: "anthropic" | "openai" | "mock";
  call_count: number;
  input_tokens_sum: number;
  output_tokens_sum: number;
  cost_eur_sum: number;
}

const mockRows: LlmUsageRow[] = [
  { task: "voice_triage", provider: "openai", call_count: 1840, input_tokens_sum: 3680000, output_tokens_sum: 920000, cost_eur_sum: 1.06 },
  { task: "email_triage", provider: "anthropic", call_count: 3210, input_tokens_sum: 3210000, output_tokens_sum: 642000, cost_eur_sum: 5.91 },
  { task: "assistant_chat", provider: "anthropic", call_count: 280, input_tokens_sum: 560000, output_tokens_sum: 140000, cost_eur_sum: 3.48 },
  { task: "doc_analysis", provider: "anthropic", call_count: 47, input_tokens_sum: 141000, output_tokens_sum: 23500, cost_eur_sum: 0.71 },
  { task: "strategy_gen", provider: "anthropic", call_count: 12, input_tokens_sum: 60000, output_tokens_sum: 24000, cost_eur_sum: 2.49 },
  { task: "mahnung_gen", provider: "anthropic", call_count: 31, input_tokens_sum: 31000, output_tokens_sum: 31000, cost_eur_sum: 0.51 },
];

export const useLlmUsage = () =>
  useQuery({
    queryKey: ["llm-usage-month"],
    queryFn: async (): Promise<LlmUsageRow[]> => {
      if (shouldMock()) return mockRows;
      const { data, error } = await supabase!.rpc("llm_usage_current_month");
      if (error) {
        warnMockFallback("llm-usage", error.message);
        return mockRows;
      }
      return (data ?? []) as unknown as LlmUsageRow[];
    },
    staleTime: 60_000,
  });
