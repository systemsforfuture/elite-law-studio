import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface ImportInput {
  source: "ra_micro" | "datev" | "advoware" | "excel" | "csv";
  headers: string[];
  rows: string[][];
  mapping?: Record<string, string>;
}

export interface ImportResult {
  inserted: number;
  total: number;
  errors: { row: number; reason: string }[];
  mappings: Record<string, string>;
  mappings_konfidenz: number;
}

export const useImportData = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ImportInput): Promise<ImportResult> => {
      if (!isSupabaseConfigured || !supabase) {
        await new Promise((r) => setTimeout(r, 1500));
        return {
          inserted: input.rows.length,
          total: input.rows.length,
          errors: [],
          mappings: input.headers.reduce(
            (acc, h) => ({ ...acc, [h]: "skip" }),
            {} as Record<string, string>,
          ),
          mappings_konfidenz: 0,
        };
      }
      const { data, error } = await supabase.functions.invoke("import-data", {
        body: input,
      });
      if (error) throw error;
      return data as ImportResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mandanten"] });
    },
  });
};

/**
 * Einfacher CSV-Parser mit Quote-Support.
 * Akzeptiert: , ; \t als Trenner (auto-detect).
 */
export const parseCsv = (
  text: string,
): { headers: string[]; rows: string[][] } => {
  // Trenner detektieren aus erster Zeile
  const firstNewline = text.indexOf("\n");
  const firstLine = firstNewline >= 0 ? text.slice(0, firstNewline) : text;
  const candidates = [",", ";", "\t"];
  let separator = ",";
  let bestCount = 0;
  for (const c of candidates) {
    const count = firstLine.split(c).length;
    if (count > bestCount) {
      bestCount = count;
      separator = c;
    }
  }

  const lines: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"' && field.length === 0) {
        inQuotes = true;
      } else if (ch === separator) {
        cur.push(field);
        field = "";
      } else if (ch === "\r") {
        // ignore
      } else if (ch === "\n") {
        cur.push(field);
        field = "";
        if (cur.some((c) => c.length > 0)) lines.push(cur);
        cur = [];
      } else {
        field += ch;
      }
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    if (cur.some((c) => c.length > 0)) lines.push(cur);
  }

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].map((h) => h.trim());
  const rows = lines.slice(1).map((r) => {
    const row = [...r];
    while (row.length < headers.length) row.push("");
    return row;
  });
  return { headers, rows };
};
