// SYSTEMS™ — Backwards-Compat Shim
//
// Diese Datei war früher der direkte Anthropic-Wrapper. Jetzt delegiert sie
// an `llm.ts` (multi-provider). Edge Functions die `complete({ tier, ... })`
// importieren müssen nicht angepasst werden.

import { completeLegacy, tryParseJson as _tryParseJson, type Tier } from "./llm.ts";

export type { Tier };
export const tryParseJson = _tryParseJson;

interface CompletionInput {
  tier: Tier;
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  max_tokens?: number;
  temperature?: number;
}

export interface CompletionResult {
  text: string;
  input_tokens: number;
  output_tokens: number;
  modell_intern: Tier;
}

export const complete = async (input: CompletionInput): Promise<CompletionResult> => {
  const result = await completeLegacy(input);
  return {
    text: result.text,
    input_tokens: result.input_tokens,
    output_tokens: result.output_tokens,
    modell_intern: input.tier,
  };
};
