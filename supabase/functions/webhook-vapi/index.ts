// SYSTEMS™ Edge Function — webhook-vapi (v2)
//
// Empfängt Server-Events vom Voice-Provider (Vapi.ai):
//   - status-update / call.started  → Live-Call-Activity (Realtime-Indikator)
//   - tool-calls (neu) / function-call (legacy) → Tool-Endpoints
//   - end-of-call-report / call.ended → persistente Konversation
//                                       + Recording + Cost + Structured-Data
//
// Schema-Drift-Handling:
//   Vapi hat sein Webhook-Format zwischen Versionen mehrfach geändert. Wir
//   parsen defensiv: `payload.message ?? payload` als Root, Tool-Calls
//   sowohl als Array (toolCalls[]) als auch als Singular (functionCall).
//
//   Tool-Response-Format folgt der NEUEN Spec:
//   { results: [{ toolCallId, result }] } — falls toolCallId fehlt, fallback
//   auf { result } für Legacy-Assistants.
//
// Setup:
//   1. supabase functions deploy webhook-vapi --no-verify-jwt
//   2. supabase secrets set VAPI_WEBHOOK_SECRET=<...>
//   3. Vapi-Dashboard: serverUrl = https://<project>.supabase.co/functions/v1/webhook-vapi

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { normalizePhone, requireSignature } from "../_shared/webhook-utils.ts";

// ─────────────────────────────────────────────────────────────────
// Typen
// ─────────────────────────────────────────────────────────────────

type VapiEventType =
  | "status-update"
  | "call.started"
  | "call.ended"
  | "call.transcript"
  | "function-call"
  | "tool-calls"
  | "end-of-call-report"
  | "transcript"
  | "hang"
  | "speech-update"
  | string;

interface VapiToolCall {
  id?: string;
  type?: "function";
  function?: { name: string; arguments?: string | Record<string, unknown> };
  // Legacy-Form:
  name?: string;
  parameters?: Record<string, unknown>;
}

interface VapiCall {
  id?: string;
  customer?: { number?: string };
  phoneNumber?: { id?: string; number?: string };
  phoneNumberId?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  /** Vapi-Versions liefern cost als USD oder als objektives Aufschlüsselung */
  cost?: number;
  costBreakdown?: { total?: number };
  transcript?: string;
  summary?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  artifact?: { recordingUrl?: string; transcript?: string };
  analysis?: {
    summary?: string;
    structuredData?: Record<string, unknown>;
    successEvaluation?: string;
  };
  messages?: { role: string; message: string; time?: number }[];
  endedReason?: string;
}

interface VapiRoot {
  type?: VapiEventType;
  call?: VapiCall;
  toolCalls?: VapiToolCall[];
  toolCallList?: VapiToolCall[];
  functionCall?: { name: string; parameters: Record<string, unknown> };
  /** Bei manchen Events liegen die Daten unter "message" eine Ebene tiefer */
  message?: VapiRoot;
}

const USD_TO_EUR = 0.92; // konservativ; nur wenn Vapi nur USD liefert

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });

const parseArgs = (raw: unknown): Record<string, unknown> => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw as Record<string, unknown>;
};

const flatten = (root: VapiRoot): VapiRoot => {
  // Vapi v2 wrappt alles in `message`. v1 nicht. Wir flatten zur Sicherheit.
  if (root.message && (root.message.type || root.message.call || root.message.toolCalls)) {
    return root.message;
  }
  return root;
};

const buildToolResults = (
  toolCalls: VapiToolCall[],
  resolver: (name: string, params: Record<string, unknown>) => Promise<{
    result: unknown;
    sayBeforeContinue?: string;
    destinationNumber?: string;
  }>,
) => {
  return Promise.all(
    toolCalls.map(async (tc) => {
      const name = tc.function?.name ?? tc.name ?? "";
      const params = parseArgs(tc.function?.arguments ?? tc.parameters);
      const out = await resolver(name, params);
      // Vapi erwartet `result` als String oder JSON; wir senden Object.
      return {
        toolCallId: tc.id ?? null,
        result: out.result,
        ...(out.sayBeforeContinue ? { message: out.sayBeforeContinue } : {}),
        ...(out.destinationNumber
          ? { destination: { type: "number", number: out.destinationNumber } }
          : {}),
      };
    }),
  );
};

const resolveTenantId = async (
  admin: ReturnType<typeof supabaseAdmin>,
  call: VapiCall | undefined,
): Promise<{ tenant_id: string | null; webhook_secret: string | null; notfall_nummer: string | null }> => {
  // Priorität: phoneNumber.id (Vapi-internal, schnellster Index)
  //            > voice_phone_number-Match auf die angerufene Nummer
  //
  // notfall_nummer ist die Anwalts-Hotline (Transfer-Ziel) — NIEMALS für
  // Tenant-Resolution missbrauchen, sonst entsteht ein KI-zu-KI-Loop wenn
  // die Hotline auf die eigene KI-Nummer zeigt.
  const phoneNumberId = call?.phoneNumber?.id ?? call?.phoneNumberId;
  const calledNumber = normalizePhone(call?.phoneNumber?.number);

  if (phoneNumberId) {
    const { data } = await admin
      .from("tenants")
      .select("id, provider_config, notfall_nummer")
      .eq("voice_phone_number_id", phoneNumberId)
      .maybeSingle();
    if (data) {
      const cfg = (data.provider_config ?? {}) as { voice?: { webhook_secret?: string } };
      return {
        tenant_id: data.id,
        webhook_secret: cfg.voice?.webhook_secret ?? null,
        notfall_nummer: data.notfall_nummer ?? null,
      };
    }
  }
  if (calledNumber) {
    const { data } = await admin
      .from("tenants")
      .select("id, provider_config, notfall_nummer")
      .eq("voice_phone_number", calledNumber)
      .maybeSingle();
    if (data) {
      const cfg = (data.provider_config ?? {}) as { voice?: { webhook_secret?: string } };
      return {
        tenant_id: data.id,
        webhook_secret: cfg.voice?.webhook_secret ?? null,
        notfall_nummer: data.notfall_nummer ?? null,
      };
    }
  }
  return { tenant_id: null, webhook_secret: null, notfall_nummer: null };
};

// ─────────────────────────────────────────────────────────────────
// Tool-Resolver
// ─────────────────────────────────────────────────────────────────

interface ToolCtx {
  admin: ReturnType<typeof supabaseAdmin>;
  tenant_id: string;
  mandant_id: string | null;
  notfall_nummer: string | null;
  vapi_call_id: string | null;
}

const toolLookupMandant = async (ctx: ToolCtx, params: Record<string, unknown>) => {
  const q = String(params.name_or_phone ?? "").trim();
  if (!q) return { result: { found: false } };
  const phone = normalizePhone(q);
  const filter = phone
    ? `telefon.eq.${phone},whatsapp.eq.${phone}`
    : `nachname.ilike.%${q}%,firmenname.ilike.%${q}%`;
  const { data } = await ctx.admin
    .from("mandanten")
    .select("id, vorname, nachname, firmenname, email, telefon, rechtsgebiet")
    .eq("tenant_id", ctx.tenant_id)
    .or(filter)
    .limit(1)
    .maybeSingle();
  if (!data) return { result: { found: false } };
  return {
    result: {
      found: true,
      mandant_id: data.id,
      name: data.firmenname ?? `${data.vorname ?? ""} ${data.nachname ?? ""}`.trim(),
      rechtsgebiet: data.rechtsgebiet ?? null,
    },
  };
};

const toolCheckAvailability = async (ctx: ToolCtx, params: Record<string, unknown>) => {
  const dateIso = String(params.date_iso ?? "");
  const dauer = Number(params.dauer_min ?? 30);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    return { result: { slots: [], error: "Datum-Format YYYY-MM-DD erwartet" } };
  }
  const dayStart = new Date(`${dateIso}T00:00:00Z`);
  const dayEnd = new Date(`${dateIso}T23:59:59Z`);
  const { data: existing } = await ctx.admin
    .from("termine")
    .select("start_at, ende_at")
    .eq("tenant_id", ctx.tenant_id)
    .gte("start_at", dayStart.toISOString())
    .lte("start_at", dayEnd.toISOString());
  const occupied = (existing ?? []).map((t) => ({
    start: new Date(t.start_at).getTime(),
    end: t.ende_at
      ? new Date(t.ende_at).getTime()
      : new Date(t.start_at).getTime() + 30 * 60_000,
  }));
  const slots: string[] = [];
  for (let h = 9; h < 17 && slots.length < 5; h++) {
    for (const m of [0, 30]) {
      const slotStart = new Date(
        `${dateIso}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`,
      );
      const slotEnd = new Date(slotStart.getTime() + dauer * 60_000);
      const conflict = occupied.some(
        (o) => o.start < slotEnd.getTime() && o.end > slotStart.getTime(),
      );
      if (!conflict) {
        slots.push(slotStart.toISOString());
        if (slots.length >= 5) break;
      }
    }
  }
  return { result: { slots, dauer_min: dauer } };
};

const toolBookAppointment = async (ctx: ToolCtx, params: Record<string, unknown>) => {
  const startIso = String(params.start_at_iso ?? params.start_at ?? "");
  const dauer = Number(params.dauer_min ?? 30);
  const titel = String(params.titel ?? "Erstgespräch");
  const mandantIdParam = params.mandant_id ? String(params.mandant_id) : null;
  const telefon = String(params.telefon ?? "");
  const notiz = String(params.notiz ?? "");
  if (!startIso || !telefon) {
    return { result: { ok: false, error: "start_at_iso und telefon sind Pflicht" } };
  }
  const endeIso = new Date(new Date(startIso).getTime() + dauer * 60_000).toISOString();
  const { data: owner } = await ctx.admin
    .from("users")
    .select("id")
    .eq("tenant_id", ctx.tenant_id)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  const { data: termin, error } = await ctx.admin
    .from("termine")
    .insert({
      tenant_id: ctx.tenant_id,
      titel,
      typ: "erstgespraech",
      start_at: startIso,
      ende_at: endeIso,
      mandant_id: mandantIdParam ?? ctx.mandant_id,
      anwalt_id: owner?.id ?? null,
      notiz: `${notiz}${notiz ? "\n\n" : ""}Telefon: ${telefon}\nGebucht via KI-Telefon.`,
      bestaetigt: false,
    })
    .select()
    .single();
  if (error) throw error;
  await ctx.admin.from("activities").insert({
    tenant_id: ctx.tenant_id,
    mandant_id: mandantIdParam ?? ctx.mandant_id,
    type: "termin_created",
    actor: "ai",
    actor_name: "Voice-Receptionist",
    title: `Termin gebucht: ${titel}`,
    detail: `${new Date(startIso).toLocaleString("de-DE")} · ${dauer} Min · Anrufer: ${telefon}`,
    link_to: { module: "termine", id: termin.id },
  });
  return {
    result: { ok: true, termin_id: termin.id, start_at: startIso },
    sayBeforeContinue: `Termin ${new Date(startIso).toLocaleString("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    })} ist eingetragen.`,
  };
};

const toolCaptureLead = async (ctx: ToolCtx, params: Record<string, unknown>) => {
  const fullName = String(params.name ?? "").trim();
  const telefon = normalizePhone(String(params.telefon ?? ""));
  const anliegen = String(params.anliegen ?? "").trim();
  const rechtsgebiet = String(params.rechtsgebiet ?? "").trim();
  if (!fullName || !telefon) {
    return { result: { ok: false, error: "name und telefon sind Pflicht" } };
  }
  const parts = fullName.split(/\s+/);
  const vorname = parts.length > 1 ? parts.slice(0, -1).join(" ") : null;
  const nachname = parts.length > 1 ? parts[parts.length - 1] : fullName;
  const { data: m, error } = await ctx.admin
    .from("mandanten")
    .insert({
      tenant_id: ctx.tenant_id,
      typ: "privat",
      vorname,
      nachname,
      email: "",
      telefon,
      status: "interessent",
      rechtsgebiet: rechtsgebiet || null,
      herkunft: "voice",
      notes_preview: anliegen.slice(0, 200),
    })
    .select()
    .single();
  if (error) throw error;
  await ctx.admin.from("activities").insert({
    tenant_id: ctx.tenant_id,
    mandant_id: m.id,
    type: "mandant_status_change",
    actor: "ai",
    actor_name: "Voice-Receptionist",
    title: "Neuer Lead aus KI-Anruf",
    detail: `${fullName} · ${telefon} · ${anliegen.slice(0, 200)}`,
    link_to: { module: "mandanten", id: m.id },
  });
  return { result: { ok: true, mandant_id: m.id } };
};

const toolEscalateToLawyer = async (ctx: ToolCtx, params: Record<string, unknown>) => {
  const grund = String(params.grund ?? "Eskalation vom KI-Receptionist").slice(0, 500);
  const dringlichkeit = String(
    params.dringlichkeit ?? "rueckruf_naechster_werktag",
  ) as "sofort_durchstellen" | "rueckruf_heute" | "rueckruf_naechster_werktag";

  // 1) Persistiere als hochpriorisierte Konversation. ungelesen=true triggert
  //    Realtime-Toast bei jedem online-Owner via subscriptions.
  const { data: konv } = await ctx.admin
    .from("konversationen")
    .insert({
      tenant_id: ctx.tenant_id,
      mandant_id: ctx.mandant_id,
      kanal: "voice",
      richtung: "inbound",
      status: "escalated",
      intent: "eskalation",
      preview: grund,
      ai_handled: false,
      ungelesen: true,
      zeitpunkt: new Date().toISOString(),
      vapi_call_id: ctx.vapi_call_id,
      escalation_reason: grund,
      escalation_urgency: dringlichkeit,
    })
    .select()
    .single();

  // 2) Activity-Eintrag = Realtime-Push (kommt durch Postgres-Subscription
  //    sofort als Toast im Dashboard an, sofern Owner online ist).
  await ctx.admin.from("activities").insert({
    tenant_id: ctx.tenant_id,
    mandant_id: ctx.mandant_id,
    type: "voice_call",
    actor: "ai",
    actor_name: "Voice-Receptionist",
    title: `🔴 ESKALATION: ${
      dringlichkeit === "sofort_durchstellen"
        ? "Sofort durchstellen"
        : dringlichkeit === "rueckruf_heute"
          ? "Rückruf heute"
          : "Rückruf nächster Werktag"
    }`,
    detail: grund,
    link_to: konv ? { module: "voice", id: konv.id } : undefined,
  });

  // 3) Out-of-band Notification (Email + SMS) wird in PR2 implementiert.
  //    Hier bereits der TODO-Marker damit klar wird wo der Hook hinkommt.
  // TODO(PR2): await notifyOwnerOfEscalation(ctx, { grund, dringlichkeit, konv })

  const message =
    dringlichkeit === "sofort_durchstellen"
      ? "Ich verbinde Sie jetzt sofort mit unserem Anwalt — bitte einen Moment."
      : dringlichkeit === "rueckruf_heute"
        ? "Ich habe Ihr Anliegen weitergeleitet. Ein Anwalt ruft Sie heute noch zurück."
        : "Ich habe Ihr Anliegen weitergeleitet. Ein Anwalt ruft Sie am nächsten Werktag zurück.";

  // Bei "sofort_durchstellen" UND verfügbarer notfall_nummer → Transfer triggern.
  // (Vapi nimmt destination.number aus der tool-result Response und überträgt.)
  const destinationNumber =
    dringlichkeit === "sofort_durchstellen" && ctx.notfall_nummer
      ? ctx.notfall_nummer
      : undefined;

  return {
    result: { ok: true, message },
    sayBeforeContinue: message,
    destinationNumber,
  };
};

// ─────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const rawBody = await req.text();
    const sig = req.headers.get("x-vapi-signature");
    const root = flatten(JSON.parse(rawBody) as VapiRoot);
    const admin = supabaseAdmin();
    const call = root.call;
    const type = (root.type ?? "") as VapiEventType;

    // Tenant resolven
    const { tenant_id, webhook_secret, notfall_nummer } = await resolveTenantId(admin, call);
    if (!tenant_id) {
      console.warn(
        "[webhook-vapi] tenant_not_resolvable",
        JSON.stringify({
          phoneNumberId: call?.phoneNumber?.id ?? call?.phoneNumberId,
          called: call?.phoneNumber?.number,
          type,
        }),
      );
      return json({ error: "tenant_not_resolvable" }, 422);
    }

    // HMAC verifizieren
    const effectiveSecret = webhook_secret ?? Deno.env.get("VAPI_WEBHOOK_SECRET");
    const sigValid = await requireSignature(rawBody, sig, effectiveSecret, "webhook-vapi");
    if (!sigValid) {
      return json({ error: "Invalid signature" }, 401);
    }

    // Mandant via Anrufer-Nummer auflösen (best-effort)
    const fromNumber = normalizePhone(call?.customer?.number);
    let mandant_id: string | null = null;
    if (fromNumber) {
      const { data: m } = await admin
        .from("mandanten")
        .select("id")
        .eq("tenant_id", tenant_id)
        .or(`telefon.eq.${fromNumber},whatsapp.eq.${fromNumber}`)
        .maybeSingle();
      mandant_id = m?.id ?? null;
    }

    const ctx: ToolCtx = {
      admin,
      tenant_id,
      mandant_id,
      notfall_nummer,
      vapi_call_id: call?.id ?? null,
    };

    // ─────────────────────────────────────────────────────
    // 1. Tool-Calls (sowohl `tool-calls` als auch `function-call`)
    // ─────────────────────────────────────────────────────
    const toolCallsArr: VapiToolCall[] | undefined =
      root.toolCalls ?? root.toolCallList;
    const legacyFc = root.functionCall;

    if (
      (type === "tool-calls" || type === "function-call") &&
      (toolCallsArr?.length || legacyFc)
    ) {
      // Normalisiere auf Array
      const calls: VapiToolCall[] = toolCallsArr?.length
        ? toolCallsArr
        : legacyFc
          ? [{ id: null as unknown as string, function: { name: legacyFc.name, arguments: legacyFc.parameters } }]
          : [];

      try {
        const results = await buildToolResults(calls, async (name, params) => {
          switch (name) {
            case "lookup_mandant":
              return toolLookupMandant(ctx, params);
            case "check_availability":
              return toolCheckAvailability(ctx, params);
            case "book_appointment":
              return toolBookAppointment(ctx, params);
            case "capture_lead":
              return toolCaptureLead(ctx, params);
            case "escalate_to_lawyer":
              return toolEscalateToLawyer(ctx, params);
            default:
              return { result: { error: `Unbekannte Funktion: ${name}` } };
          }
        });

        // Antwort an Vapi: BEIDE Formate parallel —
        // neueres assistants erwarten `results`, ältere erwarten `result` singular.
        const legacyResult = results.length === 1 ? results[0].result : undefined;
        return json({ results, ...(legacyResult ? { result: legacyResult } : {}) });
      } catch (e) {
        console.error("[webhook-vapi] tool execution error:", e);
        // Vapi sieht Fehler im result, retried sonst und KI antwortet ins Leere
        return json(
          {
            results: calls.map((c) => ({
              toolCallId: c.id ?? null,
              result: { error: e instanceof Error ? e.message : String(e) },
            })),
          },
          200,
        );
      }
    }

    // ─────────────────────────────────────────────────────
    // 2. Live-Indikatoren — Activity-Toast wenn Anruf gestartet
    // ─────────────────────────────────────────────────────
    if (
      type === "call.started" ||
      (type === "status-update" && (call as unknown as { status?: string })?.status === "in-progress")
    ) {
      // Idempotent: doppelte status-updates sollen nicht doppelt loggen
      const { data: existing } = await admin
        .from("konversationen")
        .select("id")
        .eq("tenant_id", tenant_id)
        .eq("vapi_call_id", call?.id ?? "")
        .maybeSingle();

      if (!existing && call?.id) {
        await admin.from("konversationen").insert({
          tenant_id,
          mandant_id,
          kanal: "voice",
          richtung: "inbound",
          status: "pending",
          preview: "🔴 Anruf läuft gerade",
          ai_handled: true,
          ungelesen: false,
          zeitpunkt: call.startedAt ?? new Date().toISOString(),
          started_at: call.startedAt ?? new Date().toISOString(),
          vapi_call_id: call.id,
        });
      }
      return json({ ok: true });
    }

    // ─────────────────────────────────────────────────────
    // 3. End-of-Call → finale Persistenz (Recording, Cost, Transcript, Analysis)
    // ─────────────────────────────────────────────────────
    if (type === "end-of-call-report" || type === "call.ended" || type === "hang") {
      const transcript =
        call?.messages?.map((m) => ({
          speaker: m.role === "assistant" ? "ai" : "mandant",
          text: m.message,
          ts: m.time ? new Date(m.time * 1000).toISOString().slice(11, 19) : "",
        })) ?? null;

      const recordingUrl =
        call?.recordingUrl ?? call?.stereoRecordingUrl ?? call?.artifact?.recordingUrl ?? null;
      const summary =
        call?.summary ?? call?.analysis?.summary ?? "Anruf protokolliert";
      const structured = call?.analysis?.structuredData ?? null;

      // Cost: Vapi liefert USD. Wenn breakdown.total da ist, nutze das, sonst .cost
      const costUsd = call?.costBreakdown?.total ?? call?.cost ?? null;
      const costEur =
        typeof costUsd === "number" ? Math.round(costUsd * USD_TO_EUR * 10000) / 10000 : null;

      // Eskalations-Flags aus structured_data ableiten falls KI sie nicht via Tool meldete
      const escalationFromAnalysis =
        structured && typeof structured.urgency === "string" && structured.urgency !== "low";

      // Upsert über vapi_call_id (call.started hatte evtl. schon eine Zeile angelegt)
      // → idempotent gegen Webhook-Retries
      const upsertPayload: Record<string, unknown> = {
        tenant_id,
        mandant_id,
        kanal: "voice",
        richtung: "inbound",
        status: escalationFromAnalysis ? "escalated" : "automated",
        intent:
          (structured?.area as string) ??
          (call?.analysis?.summary ? "qualified_call" : "call"),
        preview: summary,
        inhalt: call?.transcript ?? call?.artifact?.transcript ?? null,
        ai_handled: true,
        dauer_sek: call?.duration,
        transcript,
        recording_url: recordingUrl,
        cost_eur: costEur,
        structured_data: structured,
        ungelesen: true,
        zeitpunkt: call?.endedAt ?? new Date().toISOString(),
        started_at: call?.startedAt ?? null,
        ended_at: call?.endedAt ?? new Date().toISOString(),
        vapi_call_id: call?.id ?? null,
      };

      let konvId: string | null = null;
      if (call?.id) {
        const { data } = await admin
          .from("konversationen")
          .upsert(upsertPayload, { onConflict: "vapi_call_id" })
          .select("id")
          .single();
        konvId = data?.id ?? null;
      } else {
        const { data } = await admin
          .from("konversationen")
          .insert(upsertPayload)
          .select("id")
          .single();
        konvId = data?.id ?? null;
      }

      // Activity für Dashboard-Timeline
      await admin.from("activities").insert({
        tenant_id,
        mandant_id,
        type: "voice_call",
        actor: "ai",
        actor_name: "Voice-Receptionist",
        title: escalationFromAnalysis
          ? "🔴 Anruf eskaliert"
          : "Eingehender Anruf protokolliert",
        detail: summary.slice(0, 500),
        link_to: konvId ? { module: "voice", id: konvId } : undefined,
      });
    }

    return json({ ok: true });
  } catch (e) {
    console.error("[webhook-vapi]", e);
    // Webhook IMMER 200 zurück — sonst retried Vapi und doppelte Persistenz droht
    return json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      200,
    );
  }
});
