// SYSTEMS™ Edge Function — webhook-vapi
//
// Empfängt Webhook-Events vom externen Voice-Provider (Vapi.ai).
// Persistiert eingehende Anrufe als Konversationen, erzeugt Activity-
// Einträge und löst optional Triage aus.
//
// Setup:
//   1. supabase functions deploy webhook-vapi --no-verify-jwt
//   2. supabase secrets set VAPI_WEBHOOK_SECRET=<...>
//   3. In Vapi-Dashboard: Webhook-URL eintragen
//      https://dsgenkjlkdzkoplnxebg.supabase.co/functions/v1/webhook-vapi

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { normalizePhone, requireSignature, verifyHmac } from "../_shared/webhook-utils.ts";

interface VapiWebhookPayload {
  type:
    | "call.started"
    | "call.ended"
    | "call.transcript"
    | "function-call"
    | "end-of-call-report";
  call?: {
    id: string;
    customer?: { number?: string };
    phoneNumber?: { id?: string; number?: string };
    startedAt?: string;
    endedAt?: string;
    duration?: number;
    transcript?: string;
    summary?: string;
    analysis?: {
      summary?: string;
      structuredData?: Record<string, unknown>;
    };
    messages?: { role: string; message: string; time?: number }[];
  };
  functionCall?: {
    name: string;
    parameters: Record<string, unknown>;
  };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    // Body als String lesen für HMAC-Check
    const rawBody = await req.text();
    const sig = req.headers.get("x-vapi-signature");

    const payload: VapiWebhookPayload = JSON.parse(rawBody);
    const admin = supabaseAdmin();

    // Tenant resolven: Vapi-phoneNumber.id (Indexed) bevorzugt, fallback auf
    // notfall_nummer-Match. Beide-Pfade decken auch Legacy-Tenants ab.
    const phoneNumberId = payload.call?.phoneNumber?.id;
    const calledNumber = normalizePhone(payload.call?.phoneNumber?.number);
    let tenant_id: string | null = null;
    let tenantWebhookSecret: string | null = null;
    if (phoneNumberId) {
      const { data: t } = await admin
        .from("tenants")
        .select("id, provider_config")
        .eq("voice_phone_number_id", phoneNumberId)
        .maybeSingle();
      tenant_id = t?.id ?? null;
      const cfg = (t?.provider_config ?? {}) as { voice?: { webhook_secret?: string } };
      tenantWebhookSecret = cfg.voice?.webhook_secret ?? null;
    }
    if (!tenant_id && calledNumber) {
      const { data: t } = await admin
        .from("tenants")
        .select("id, provider_config")
        .eq("notfall_nummer", calledNumber)
        .maybeSingle();
      tenant_id = t?.id ?? null;
      const cfg = (t?.provider_config ?? {}) as { voice?: { webhook_secret?: string } };
      tenantWebhookSecret = cfg.voice?.webhook_secret ?? null;
    }
    // Kein Fallback auf Demo-Tenant — sonst landen unbekannte Anrufe in fremdem Tenant.
    if (!tenant_id) {
      console.warn("[webhook-vapi] Tenant nicht resolvable für called=", calledNumber);
      return new Response(
        JSON.stringify({ error: "tenant_not_resolvable", called: calledNumber }),
        { status: 422, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    // Signature-Verifikation: bevorzugt per-tenant Secret, Fallback Env.
    // requireSignature() blockt in WEBHOOK_STRICT-Mode wenn Secret fehlt.
    const effectiveSecret = tenantWebhookSecret ?? Deno.env.get("VAPI_WEBHOOK_SECRET");
    const sigValid = await requireSignature(rawBody, sig, effectiveSecret, "webhook-vapi");
    if (!sigValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
    // unused-import suppress: verifyHmac wird via requireSignature genutzt
    void verifyHmac;

    // Mandant via Anrufer-Nummer
    const fromNumber = normalizePhone(payload.call?.customer?.number);
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

    // ─────────────────────────────────────────────────────
    // Function-Tool-Calls vom Voice-Assistant
    // ─────────────────────────────────────────────────────
    if (payload.type === "function-call" && payload.functionCall) {
      const { name, parameters } = payload.functionCall;
      const respond = (result: unknown, status = 200) =>
        new Response(JSON.stringify({ result }), {
          status,
          headers: { ...corsHeaders, "content-type": "application/json" },
        });

      try {
        if (name === "lookup_mandant") {
          const q = String(parameters.name_or_phone ?? "").trim();
          if (!q) return respond({ found: false });
          const phone = normalizePhone(q);
          const { data } = await admin
            .from("mandanten")
            .select("id, vorname, nachname, firmenname, email, telefon, rechtsgebiet")
            .eq("tenant_id", tenant_id)
            .or(
              phone
                ? `telefon.eq.${phone},whatsapp.eq.${phone}`
                : `nachname.ilike.%${q}%,firmenname.ilike.%${q}%`,
            )
            .limit(1)
            .maybeSingle();
          return respond(
            data
              ? {
                  found: true,
                  mandant_id: data.id,
                  name: data.firmenname ?? `${data.vorname ?? ""} ${data.nachname ?? ""}`.trim(),
                  rechtsgebiet: data.rechtsgebiet ?? null,
                }
              : { found: false },
          );
        }

        if (name === "check_availability") {
          const dateIso = String(parameters.date_iso ?? "");
          const dauer = Number(parameters.dauer_min ?? 30);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
            return respond({ slots: [], error: "Datum-Format YYYY-MM-DD erwartet" }, 200);
          }
          // Hole alle Termine an diesem Tag, finde freie 30-Min-Slots zwischen 9-17 Uhr.
          const dayStart = new Date(`${dateIso}T00:00:00Z`);
          const dayEnd = new Date(`${dateIso}T23:59:59Z`);
          const { data: existing = [] } = await admin
            .from("termine")
            .select("start_at, ende_at")
            .eq("tenant_id", tenant_id)
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
              const slotStart = new Date(`${dateIso}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
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
          return respond({ slots, dauer_min: dauer });
        }

        if (name === "book_appointment") {
          const startIso = String(parameters.start_at_iso ?? "");
          const dauer = Number(parameters.dauer_min ?? 30);
          const titel = String(parameters.titel ?? "Erstgespräch");
          const mandantIdParam = parameters.mandant_id ? String(parameters.mandant_id) : null;
          const telefon = String(parameters.telefon ?? "");
          const notiz = String(parameters.notiz ?? "");
          if (!startIso || !telefon) {
            return respond({ ok: false, error: "start_at_iso und telefon sind Pflicht" });
          }
          const endeIso = new Date(new Date(startIso).getTime() + dauer * 60_000).toISOString();
          // Default-Anwalt: Owner des Tenants
          const { data: owner } = await admin
            .from("users")
            .select("id")
            .eq("tenant_id", tenant_id)
            .eq("role", "owner")
            .limit(1)
            .maybeSingle();
          const { data: termin, error: tErr } = await admin
            .from("termine")
            .insert({
              tenant_id,
              titel,
              typ: "erstgespraech",
              start_at: startIso,
              ende_at: endeIso,
              mandant_id: mandantIdParam ?? mandant_id,
              anwalt_id: owner?.id ?? null,
              notiz: `${notiz}${notiz ? "\n\n" : ""}Telefon: ${telefon}\nGebucht via KI-Telefon.`,
              bestaetigt: false,
            })
            .select()
            .single();
          if (tErr) throw tErr;
          await admin.from("activities").insert({
            tenant_id,
            mandant_id: mandantIdParam ?? mandant_id,
            type: "termin_created",
            actor: "ai",
            actor_name: "Voice-Receptionist",
            title: `Termin gebucht: ${titel}`,
            detail: `${new Date(startIso).toLocaleString("de-DE")} · ${dauer} Min · Anrufer: ${telefon}`,
            link_to: { module: "termine", id: termin.id },
          });
          return respond({ ok: true, termin_id: termin.id, start_at: startIso });
        }

        if (name === "capture_lead") {
          const fullName = String(parameters.name ?? "").trim();
          const telefon = normalizePhone(String(parameters.telefon ?? ""));
          const anliegen = String(parameters.anliegen ?? "").trim();
          const rechtsgebiet = String(parameters.rechtsgebiet ?? "").trim();
          if (!fullName || !telefon) {
            return respond({ ok: false, error: "name und telefon sind Pflicht" });
          }
          const parts = fullName.split(/\s+/);
          const vorname = parts.length > 1 ? parts.slice(0, -1).join(" ") : null;
          const nachname = parts.length > 1 ? parts[parts.length - 1] : fullName;
          const { data: m, error: mErr } = await admin
            .from("mandanten")
            .insert({
              tenant_id,
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
          if (mErr) throw mErr;
          await admin.from("activities").insert({
            tenant_id,
            mandant_id: m.id,
            type: "mandant_status_change",
            actor: "ai",
            actor_name: "Voice-Receptionist",
            title: "Neuer Lead aus KI-Anruf",
            detail: `${fullName} · ${telefon} · ${anliegen.slice(0, 200)}`,
            link_to: { module: "mandanten", id: m.id },
          });
          return respond({ ok: true, mandant_id: m.id });
        }

        if (name === "escalate_to_lawyer") {
          const grund = String(parameters.grund ?? "Eskalation vom KI-Receptionist");
          const dringlichkeit = String(parameters.dringlichkeit ?? "rueckruf_naechster_werktag");
          // Persistiere als hochpriorisierte Konversation, Realtime-Toast greift sofort
          const { data: konv } = await admin
            .from("konversationen")
            .insert({
              tenant_id,
              mandant_id,
              kanal: "voice",
              richtung: "inbound",
              status: "escalated",
              intent: "eskalation",
              preview: grund,
              ai_handled: false,
              ungelesen: true,
              zeitpunkt: new Date().toISOString(),
            })
            .select()
            .single();
          await admin.from("activities").insert({
            tenant_id,
            mandant_id,
            type: "voice_call",
            actor: "ai",
            actor_name: "Voice-Receptionist",
            title: `Eskalation: ${dringlichkeit}`,
            detail: grund,
            link_to: konv ? { module: "voice", id: konv.id } : undefined,
          });
          // Action-Hinweis für die KI: was sie dem Anrufer sagen soll
          const message =
            dringlichkeit === "sofort_durchstellen"
              ? "Ich verbinde Sie sofort mit dem Anwalt — bitte einen Moment."
              : dringlichkeit === "rueckruf_heute"
                ? "Ein Anwalt ruft Sie heute noch zurück."
                : "Ein Anwalt ruft Sie am nächsten Werktag zurück.";
          return respond({ ok: true, message });
        }

        return respond({ error: `Unbekannte Funktion: ${name}` }, 400);
      } catch (e) {
        console.error("[webhook-vapi] function-call error:", e);
        return respond(
          { error: e instanceof Error ? e.message : String(e) },
          200, // Vapi sieht Fehler im result, retried sonst
        );
      }
    }

    // Event-Type-spezifische Verarbeitung
    if (
      payload.type === "end-of-call-report" ||
      payload.type === "call.ended"
    ) {
      const transcript =
        payload.call?.messages?.map((m) => ({
          speaker: m.role === "assistant" ? "ai" : "mandant",
          text: m.message,
          ts: m.time
            ? new Date(m.time * 1000).toISOString().slice(11, 19)
            : "",
        })) ?? null;

      const { data: konv, error } = await admin
        .from("konversationen")
        .insert({
          tenant_id,
          mandant_id,
          kanal: "voice",
          richtung: "inbound",
          status: "automated",
          intent: payload.call?.analysis?.summary ? "qualified_call" : "call",
          preview: payload.call?.summary ?? payload.call?.analysis?.summary ?? "Anruf protokolliert",
          inhalt: payload.call?.transcript,
          ai_handled: true,
          dauer_sek: payload.call?.duration,
          transcript,
          ungelesen: true,
          zeitpunkt: payload.call?.endedAt ?? new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Activity-Eintrag
      await admin.from("activities").insert({
        tenant_id,
        mandant_id,
        type: "voice_call",
        actor: "ai",
        actor_name: "Voice-Receptionist",
        title: "Eingehender Anruf protokolliert",
        detail: payload.call?.summary?.slice(0, 500),
        link_to: { module: "voice", id: konv.id },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    console.error("[webhook-vapi]", e);
    // Webhook IMMER 200 zurück — sonst retried Vapi
    return new Response(
      JSON.stringify({
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
