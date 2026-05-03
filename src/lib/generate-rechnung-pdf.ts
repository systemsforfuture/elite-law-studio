import jsPDF from "jspdf";
import type { Rechnung, Tenant, Mandant } from "@/data/types";
import { mandantName } from "@/data/mockData";

interface PdfInput {
  tenant: Tenant;
  mandant: Mandant | null | undefined;
  rechnung: Rechnung;
  positionen?: { titel: string; menge?: number; einzelpreis?: number; summe: number }[];
}

const eur = (n: number) =>
  `${n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export const generateRechnungPdf = ({
  tenant,
  mandant,
  rechnung,
  positionen,
}: PdfInput) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const margin = 25;
  let y = margin;

  // Kopfzeile: Kanzlei
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(26, 42, 58);
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
    `Rechnungsdatum: ${new Date(rechnung.rechnungsdatum).toLocaleDateString("de-DE")}`,
    W - margin,
    y - 16,
    { align: "right" },
  );
  doc.text(
    `Fällig: ${new Date(rechnung.faelligkeit).toLocaleDateString("de-DE")}`,
    W - margin,
    y - 11,
    { align: "right" },
  );

  // Rechnungsnummer als Betreff
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(26, 42, 58);
  doc.text(`Rechnung ${rechnung.rechnungsnummer}`, margin, y);
  y += 10;

  // Positions-Tabelle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const colTitel = margin;
  const colMenge = 110;
  const colEinzel = 135;
  const colSumme = W - margin;
  doc.text("Beschreibung", colTitel, y);
  doc.text("Menge", colMenge, y, { align: "right" });
  doc.text("Einzel", colEinzel, y, { align: "right" });
  doc.text("Summe", colSumme, y, { align: "right" });
  y += 2;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, W - margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  const items = positionen?.length
    ? positionen
    : [
        {
          titel: `Anwaltliche Leistung · Rechnung ${rechnung.rechnungsnummer}`,
          menge: 1,
          einzelpreis: rechnung.betrag_netto,
          summe: rechnung.betrag_netto,
        },
      ];
  for (const p of items) {
    if (y > 260) {
      doc.addPage();
      y = margin;
    }
    const lines = doc.splitTextToSize(p.titel, colMenge - colTitel - 5);
    doc.text(lines, colTitel, y);
    if (p.menge !== undefined) {
      doc.text(String(p.menge), colMenge, y, { align: "right" });
    }
    if (p.einzelpreis !== undefined) {
      doc.text(eur(p.einzelpreis), colEinzel, y, { align: "right" });
    }
    doc.text(eur(p.summe), colSumme, y, { align: "right" });
    y += lines.length * 5 + 2;
  }
  y += 4;

  // Summen-Block rechts
  doc.setDrawColor(220, 220, 220);
  doc.line(W - margin - 70, y, W - margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const mwst = rechnung.betrag_brutto - rechnung.betrag_netto;
  doc.text("Netto", W - margin - 30, y, { align: "right" });
  doc.text(eur(rechnung.betrag_netto), W - margin, y, { align: "right" });
  y += 5;
  doc.text("Umsatzsteuer 19%", W - margin - 30, y, { align: "right" });
  doc.text(eur(mwst), W - margin, y, { align: "right" });
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(26, 42, 58);
  doc.text("Gesamtbetrag", W - margin - 30, y, { align: "right" });
  doc.text(eur(rechnung.betrag_brutto), W - margin, y, { align: "right" });
  y += 12;

  // Zahlungsdaten
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(26, 42, 58);
  doc.text("Zahlungsdaten", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(tenant.kanzlei_name, margin, y);
  y += 5;
  doc.text("IBAN: DE00 0000 0000 0000 0000 00 (Beispiel)", margin, y);
  y += 5;
  doc.text(`Verwendungszweck: ${rechnung.rechnungsnummer}`, margin, y);
  y += 5;
  doc.text(
    `Bitte begleichen Sie den Betrag bis ${new Date(rechnung.faelligkeit).toLocaleDateString("de-DE")}.`,
    margin,
    y,
  );

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
  const filename = `Rechnung_${rechnung.rechnungsnummer}_${md}.pdf`;
  doc.save(filename);
};
