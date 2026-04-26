import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/queries/use-import";

describe("parseCsv", () => {
  it("parses comma-separated CSV with header", () => {
    const text = "vorname,nachname,email\nMax,Mustermann,max@example.de";
    const { headers, rows } = parseCsv(text);
    expect(headers).toEqual(["vorname", "nachname", "email"]);
    expect(rows).toEqual([["Max", "Mustermann", "max@example.de"]]);
  });

  it("auto-detects semicolon separator (RA-MICRO/DATEV-Style)", () => {
    const text = "Vorname;Nachname;Email\nAnna;Weber;anna@gmx.de";
    const { headers, rows } = parseCsv(text);
    expect(headers).toEqual(["Vorname", "Nachname", "Email"]);
    expect(rows[0]).toEqual(["Anna", "Weber", "anna@gmx.de"]);
  });

  it("handles quoted fields with commas", () => {
    const text =
      'name,note\n"Müller, GmbH","Vertrag zur Prüfung, dringlich"';
    const { rows } = parseCsv(text);
    expect(rows[0]).toEqual(["Müller, GmbH", "Vertrag zur Prüfung, dringlich"]);
  });

  it("handles escaped quotes (RFC 4180)", () => {
    const text = 'note\n"Er sagte ""Hallo"""';
    const { rows } = parseCsv(text);
    expect(rows[0][0]).toBe('Er sagte "Hallo"');
  });

  it("pads short rows to header length", () => {
    const text = "a,b,c\nx,y";
    const { rows } = parseCsv(text);
    expect(rows[0]).toEqual(["x", "y", ""]);
  });

  it("returns empty for empty input", () => {
    expect(parseCsv("")).toEqual({ headers: [], rows: [] });
  });

  it("ignores empty rows", () => {
    const text = "a,b\nx,y\n\n\nz,w";
    const { rows } = parseCsv(text);
    expect(rows.length).toBe(2);
  });
});
