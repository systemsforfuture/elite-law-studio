// SYSTEMS™ Multi-Provider LLM-Abstraktion.
//
// Drei Optimierungs-Achsen:
//  1. Task-orientiertes Modell-Routing (Triage→billig, Strategie→teuer)
//  2. Provider-Fallback (Claude → OpenAI → Mock) wenn rate-limited / down
//  3. Cost-Tracking pro Aufruf (für Tenant-Abrechnung + Limits)
//
// Frontend & Edge Functions nutzen NUR `complete()` und kennen keine
// Provider-Details. Internes Routing kann ohne Code-Änderung an
// den Funktionen wechseln.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// =============================================================
// Task-Types: Workflow-spezifische Modell-Wahl
// =============================================================

export type LlmTask =
  | "voice_triage"
  | "email_triage"
  | "whatsapp_chat"
  | "doc_analysis"
  | "strategy_gen"
  | "mahnung_gen"
  | "assistant_chat"
  | "lead_capture";

interface ModelChoice {
  /** Primary provider + model */
  primary: { provider: "anthropic" | "openai"; model: string };
  /** Fallback wenn primary nicht verfügbar */
  fallback: { provider: "anthropic" | "openai"; model: string };
  /** Default temperature & max-tokens */
  temperature: number;
  max_tokens: number;
}

const TASK_MODELS: Record<LlmTask, ModelChoice> = {
  // High-Volume + Klassifikation → günstiges Modell, OpenAI primary
  voice_triage: {
    primary: { provider: "openai", model: "gpt-4o-mini" },
    fallback: { provider: "anthropic", model: "claude-haiku-4-5-20251001" },
    temperature: 0.2,
    max_tokens: 512,
  },
  email_triage: {
    primary: { provider: "anthropic", model: "claude-haiku-4-5-20251001" },
    fallback: { provider: "openai", model: "gpt-4o-mini" },
    temperature: 0.2,
    max_tokens: 1024,
  },
  whatsapp_chat: {
    primary: { provider: "anthropic", model: "claude-haiku-4-5-20251001" },
    fallback: { provider: "openai", model: "gpt-4o-mini" },
    temperature: 0.3,
    max_tokens: 512,
  },
  lead_capture: {
    primary: { provider: "openai", model: "gpt-4o-mini" },
    fallback: { provider: "anthropic", model: "claude-haiku-4-5-20251001" },
    temperature: 0.1,
    max_tokens: 256,
  },

  // Vision + komplexere Extraction → starkes Modell
  doc_analysis: {
    primary: { provider: "anthropic", model: "claude-sonnet-4-6" },
    fallback: { provider: "openai", model: "gpt-4o" },
    temperature: 0.2,
    max_tokens: 2048,
  },

  // Juristische Formulierung → Anthropic stärker im Deutschen
  mahnung_gen: {
    primary: { provider: "anthropic", model: "claude-sonnet-4-6" },
    fallback: { provider: "anthropic", model: "claude-haiku-4-5-20251001" },
    temperature: 0.3,
    max_tokens: 1024,
  },

  // Tiefes Reasoning für Akten-Strategie
  strategy_gen: {
    primary: { provider: "anthropic", model: "claude-opus-4-6" },
    fallback: { provider: "openai", model: "gpt-4o" },
    temperature: 0.2,
    max_tokens: 4096,
  },

  // Conversational mit Kontext-Memory
  assistant_chat: {
    primary: { provider: "anthropic", model: "claude-sonnet-4-6" },
    fallback: { provider: "openai", model: "gpt-4o" },
    temperature: 0.4,
    max_tokens: 1024,
  },
};

// =============================================================
// Pricing: USD pro 1M tokens (Stand April 2026 — ggf. updaten)
// =============================================================

const PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  "claude-haiku-4-5-20251001": { input: 1.0, output: 5.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-opus-4-6": { input: 15.0, output: 75.0 },
  // OpenAI
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10.0 },
};

const calcCostEur = (model: string, input_tokens: number, output_tokens: number): number => {
  const p = PRICING[model];
  if (!p) return 0;
  // USD → EUR Konversion ~0.92
  const usd = (input_tokens / 1_000_000) * p.input + (output_tokens / 1_000_000) * p.output;
  return usd * 0.92;
};

// =============================================================
// Provider-Adapters
// =============================================================

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CompletionResult {
  text: string;
  input_tokens: number;
  output_tokens: number;
  provider: "anthropic" | "openai";
  model: string;
  cost_eur: number;
}

const callAnthropic = async (
  model: string,
  system: string,
  messages: Message[],
  max_tokens: number,
  temperature: number,
): Promise<CompletionResult> => {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt");

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, max_tokens, temperature, system, messages }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";
  const input_tokens = data.usage?.input_tokens ?? 0;
  const output_tokens = data.usage?.output_tokens ?? 0;
  return {
    text,
    input_tokens,
    output_tokens,
    provider: "anthropic",
    model,
    cost_eur: calcCostEur(model, input_tokens, output_tokens),
  };
};

const callOpenAI = async (
  model: string,
  system: string,
  messages: Message[],
  max_tokens: number,
  temperature: number,
): Promise<CompletionResult> => {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY fehlt");

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens,
      temperature,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const input_tokens = data.usage?.prompt_tokens ?? 0;
  const output_tokens = data.usage?.completion_tokens ?? 0;
  return {
    text,
    input_tokens,
    output_tokens,
    provider: "openai",
    model,
    cost_eur: calcCostEur(model, input_tokens, output_tokens),
  };
};

// =============================================================
// Tier-Limits — Tokens pro Monat
// =============================================================

const TIER_TOKEN_LIMITS: Record<string, number> = {
  foundation: 300_000,
  growth: 2_000_000,
  premium: 999_999_999, // de-facto unlimited
};

const checkTenantLimit = async (tenantId: string): Promise<{ ok: boolean; usage?: number; limit?: number }> => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return { ok: true }; // Limit-Check disabled wenn admin-creds fehlen

  try {
    // Tier holen
    const tenantRes = await fetch(`${url}/rest/v1/tenants?id=eq.${tenantId}&select=subscription_tier`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const tenants = (await tenantRes.json()) as Array<{ subscription_tier?: string }>;
    const tier = tenants[0]?.subscription_tier ?? "growth";
    const limit = TIER_TOKEN_LIMITS[tier] ?? TIER_TOKEN_LIMITS.growth;

    // Usage holen via RPC
    const usageRes = await fetch(`${url}/rest/v1/rpc/llm_usage_total_month`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ p_tenant_id: tenantId }),
    });
    const usage = (await usageRes.json()) as number;
    return { ok: usage < limit, usage, limit };
  } catch (e) {
    console.warn("[llm] limit-check failed:", e instanceof Error ? e.message : e);
    return { ok: true }; // Fail-open damit Service nicht hängt
  }
};

const trackUsage = async (
  tenantId: string,
  task: LlmTask,
  result: CompletionResult,
): Promise<void> => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return;
  try {
    await fetch(`${url}/rest/v1/llm_usage`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "content-type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        task,
        provider: result.provider,
        model: result.model,
        input_tokens: result.input_tokens,
        output_tokens: result.output_tokens,
        cost_eur: result.cost_eur,
      }),
    });
  } catch (e) {
    console.warn("[llm] track-usage failed (non-fatal):", e instanceof Error ? e.message : e);
  }
};

// =============================================================
// Public API
// =============================================================

export interface CompletionInput {
  task: LlmTask;
  system: string;
  messages: Message[];
  /** Optional Override für max_tokens / temperature */
  max_tokens?: number;
  temperature?: number;
  /** Wenn gesetzt: Usage wird gegen Tier-Limit geprüft + getracked */
  tenant_id?: string;
}

/**
 * Ruft das passende Modell für die Task auf, mit automatischem Provider-
 * Fallback + Cost-Tracking + Tier-Limit-Check (wenn tenant_id gesetzt).
 *
 * Wenn beide Provider fehlen ODER Tier-Limit überschritten → Mock-Result.
 */
export const complete = async (input: CompletionInput): Promise<CompletionResult> => {
  const choice = TASK_MODELS[input.task];
  const max_tokens = input.max_tokens ?? choice.max_tokens;
  const temperature = input.temperature ?? choice.temperature;

  // Tier-Limit-Check vor dem Aufruf
  if (input.tenant_id) {
    const limit = await checkTenantLimit(input.tenant_id);
    if (!limit.ok) {
      console.warn(`[llm] tenant ${input.tenant_id} hat Token-Limit erreicht (${limit.usage}/${limit.limit})`);
      return {
        text: "[KI-Limit] Ihr monatliches KI-Kontingent ist aufgebraucht. Tier upgraden oder bis nächsten Monat warten.",
        input_tokens: 0,
        output_tokens: 0,
        provider: "anthropic",
        model: "limit_reached",
        cost_eur: 0,
      };
    }
  }

  let result: CompletionResult | null = null;

  // 1) Versuche primary
  try {
    const fn = choice.primary.provider === "anthropic" ? callAnthropic : callOpenAI;
    result = await fn(choice.primary.model, input.system, input.messages, max_tokens, temperature);
  } catch (e) {
    console.warn(`[llm] ${choice.primary.provider} failed, trying fallback:`, e instanceof Error ? e.message : e);
  }

  // 2) Fallback
  if (!result) {
    try {
      const fn = choice.fallback.provider === "anthropic" ? callAnthropic : callOpenAI;
      result = await fn(choice.fallback.model, input.system, input.messages, max_tokens, temperature);
    } catch (e) {
      console.error("[llm] both providers failed:", e instanceof Error ? e.message : e);
    }
  }

  // 3) Mock — beide Provider down oder unkonfiguriert
  if (!result) {
    result = {
      text: "[Mock] SYSTEMS-KI ist aktuell nicht erreichbar. Bitte später erneut versuchen.",
      input_tokens: 0,
      output_tokens: 0,
      provider: "anthropic",
      model: "mock",
      cost_eur: 0,
    };
  }

  // Usage tracken (nicht-blockierend)
  if (input.tenant_id && result.model !== "mock" && result.model !== "limit_reached") {
    void trackUsage(input.tenant_id, input.task, result);
  }

  return result;
};

/**
 * Versucht einen JSON-Block aus dem LLM-Output zu parsen.
 * Toleriert ```json …``` Codeblöcke und Markdown-Wrapping.
 */
export const tryParseJson = <T>(text: string): T | null => {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
};

/** Backward-compat — alte Funktionen exportieren `Tier` und `complete` mit `tier`. */
export type Tier = "fast" | "balanced" | "deep";

const TIER_TO_TASK: Record<Tier, LlmTask> = {
  fast: "email_triage",
  balanced: "assistant_chat",
  deep: "strategy_gen",
};

/** Legacy-Wrapper für alte Edge Functions die `tier` nutzen. */
export const completeLegacy = async (input: {
  tier: Tier;
  system: string;
  messages: Message[];
  max_tokens?: number;
  temperature?: number;
}) => {
  return complete({
    task: TIER_TO_TASK[input.tier],
    system: input.system,
    messages: input.messages,
    max_tokens: input.max_tokens,
    temperature: input.temperature,
  });
};
