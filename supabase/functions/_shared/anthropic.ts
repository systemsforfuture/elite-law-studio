// Anthropic-API-Wrapper für SYSTEMS Edge Functions.
//
// Das ist die EINZIGE Stelle wo wir den Anthropic-Provider direkt anfassen.
// Frontend & andere Backend-Code sehen ihn nie — nur "SYSTEMS-KI".
//
// Modell-Routing:
//   - "fast"      → Haiku 4.5      (Klassifikation, Spam-Erkennung)
//   - "balanced"  → Sonnet 4.6     (Standard-Tasks)
//   - "deep"      → Opus 4.6       (Strategie, komplexes Reasoning)

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const MODEL_MAP = {
  fast: "claude-haiku-4-5-20251001",
  balanced: "claude-sonnet-4-6",
  deep: "claude-opus-4-6",
} as const;

export type Tier = keyof typeof MODEL_MAP;

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CompletionInput {
  tier: Tier;
  system: string;
  messages: AnthropicMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface CompletionResult {
  text: string;
  input_tokens: number;
  output_tokens: number;
  modell_intern: Tier;
}

/**
 * Ruft die Anthropic-API auf. Wenn ANTHROPIC_API_KEY nicht gesetzt ist
 * (z.B. lokale Dev-Umgebung), wird ein Mock-Result zurückgegeben.
 */
export const complete = async (
  input: CompletionInput,
): Promise<CompletionResult> => {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.warn("[anthropic] ANTHROPIC_API_KEY fehlt — Mock-Result");
    return {
      text: "[Mock] SYSTEMS-KI ist nicht konfiguriert. Setze ANTHROPIC_API_KEY in den Supabase Function Secrets.",
      input_tokens: 0,
      output_tokens: 0,
      modell_intern: input.tier,
    };
  }

  const model = MODEL_MAP[input.tier];

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: input.max_tokens ?? 2048,
      temperature: input.temperature ?? 0.3,
      system: input.system,
      messages: input.messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text =
    data.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";

  return {
    text,
    input_tokens: data.usage?.input_tokens ?? 0,
    output_tokens: data.usage?.output_tokens ?? 0,
    modell_intern: input.tier,
  };
};

/**
 * Versucht einen JSON-Block aus dem LLM-Output zu parsen.
 * Toleriert ```json …``` Codeblöcke und Markdown-Wrapping.
 */
export const tryParseJson = <T>(text: string): T | null => {
  // Codeblock entfernen
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fallback: ersten { ... }-Block finden
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
};
