// ICS-Generator für SYSTEMS™ Termine.
// RFC 5545 minimal-konform. Funktioniert mit Apple Calendar,
// Google Calendar, Outlook.

import type { Termin, User, Mandant } from "@/data/types";
import { mandantName } from "@/data/mockData";

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  // Format: YYYYMMDDTHHMMSSZ (UTC)
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
};

const escape = (s: string): string =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");

interface IcsInput {
  termin: Termin;
  anwalt?: User | null;
  mandant?: Mandant | null;
  kanzlei_name: string;
}

export const buildIcs = ({
  termin,
  anwalt,
  mandant,
  kanzlei_name,
}: IcsInput): string => {
  const uid = `${termin.id}@systems-future`;
  const dtstamp = formatDate(new Date().toISOString());
  const dtstart = formatDate(termin.start_at);
  const dtend = termin.ende_at
    ? formatDate(termin.ende_at)
    : formatDate(new Date(new Date(termin.start_at).getTime() + 60 * 60 * 1000).toISOString());

  const summary = escape(termin.titel);
  const location = termin.ort ? escape(termin.ort) : "";
  const description = escape(
    [
      termin.notiz ?? "",
      mandant ? `Mandant: ${mandantName(mandant)}` : "",
      anwalt ? `Anwalt: ${anwalt.name}` : "",
      `Termin gepflegt durch SYSTEMS™ Termin-Koordinator`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//SYSTEMS™ Plattform//${escape(kanzlei_name)}//DE`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : "",
    location ? `LOCATION:${location}` : "",
    `STATUS:${termin.bestaetigt ? "CONFIRMED" : "TENTATIVE"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
};

export const downloadIcs = (input: IcsInput) => {
  const ics = buildIcs(input);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${input.termin.titel.replace(/\s+/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
