import jsPDF from "jspdf";
import type { Rechnung, Tenant, Mandant } from "@/data/types";
import { mandantName } from "@/data/mockData";

interface PdfInput {
  tenant: Tenant;
  mandant: Mandant | null | undefined;
  rechnung: Rechnung;
  mahn_text: string;
  stufe: number;
}

const stufenTitel = ["", "Zahlungserinnerung", "1. Mahnung", "2. Mahnung", "Letzte Mahnung"];

export const generateMahnPdf = ({
  tenant,
  mandant,
  rechnung,
  mahn_text,
  stufe,
}: PdfInput) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const margin = 25;
  let y = margin;

  // Kopfzeile: Kanzlei
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(26, 42, 58); // navy
  doc.text(tenant.kanzlei_name, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Rechtsanwälte · Hosting in Frankfurt · powered by SYSTEMS™", margin, y);
  y += 12;

  // Empfänger-Block
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  if (mandant) {
    const empfaenger = mandant.firmenname
      ? mandant.firmenname
      : `${mandant.vorname ?? ""} ${mandant.nachname ?? ""}`.trim();
    doc.text(empfaenger, margin, y);
    y += 5;
    if (mandant.adresse) {
      const a = mandant.adresse as { strasse?: string; plz?: string; ort?: string };
      if (a.strasse) {
        doc.text(a.strasse, margin, y);
        y += 5;
      }
      if (a.plz || a.ort) {
        doc.text(`${a.plz ?? ""} ${a.ort ?? ""}`.trim(), margin, y);
        y += 5;
      }
    }
  } else {
    doc.text("Mandant", margin, y);
    y += 5;
  }
  y += 8;

  // Datum rechts
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Berlin, ${new Date().toLocaleDateString("de-DE")}`,
    W - margin,
    y - 16,
    { align: "right" },
  );

  // Betreff
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(26, 42, 58);
  const betreff = `${stufenTitel[stufe] ?? "Mahnung"} · Rechnung ${rechnung.rechnungsnummer}`;
  doc.text(betreff, margin, y);
  y += 10;

  // Brieftext (Word-Wrap)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  const lines = doc.splitTextToSize(mahn_text, W - margin * 2);
  doc.text(lines, margin, y);
  y += lines.length * 5 + 10;

  // Rechnungs-Details Tabelle
  if (y > 240) {
    doc.addPage();
    y = margin;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(26, 42, 58);
  doc.text("Rechnungsdetails", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  const details: [string, string][] = [
    ["Rechnungsnummer", rechnung.rechnungsnummer],
    ["Rechnungsdatum", new Date(rechnung.rechnungsdatum).toLocaleDateString("de-DE")],
    ["Fällig", new Date(rechnung.faelligkeit).toLocaleDateString("de-DE")],
    ["Bruttobetrag", `${rechnung.betrag_brutto.toLocaleString("de-DE")} €`],
    ["Mahnstufe", String(stufe)],
  ];
  details.forEach(([k, v]) => {
    doc.text(k, margin, y);
    doc.text(v, margin + 60, y);
    y += 5;
  });
  y += 10;

  // Zahlungsdaten
  doc.setFont("helvetica", "bold");
  doc.text("Zahlungsempfänger", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(tenant.kanzlei_name, margin, y);
  y += 5;
  doc.text("IBAN: DE00 0000 0000 0000 0000 00 (Beispiel)", margin, y);
  y += 5;
  doc.text(`Verwendungszweck: ${rechnung.rechnungsnummer}`, margin, y);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `${tenant.kanzlei_name} · powered by SYSTEMS™ · DSGVO-konform · Hosting in Frankfurt`,
    W / 2,
    285,
    { align: "center" },
  );

  // Filename
  const md = mandant ? mandantName(mandant).replace(/\s+/g, "_") : "Mandant";
  const filename = `Mahnung_Stufe${stufe}_${rechnung.rechnungsnummer}_${md}.pdf`;
  doc.save(filename);
};
