import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { dokumente as mockDokumente } from "@/data/mockData";
import type { Dokument } from "@/data/types";

const useMockFallback = () => !isSupabaseConfigured || !supabase;

const TENANT_BUCKET = "tenant-files";

export const useDokumenteQuery = () =>
  useQuery({
    queryKey: ["dokumente"],
    queryFn: async (): Promise<Dokument[]> => {
      if (useMockFallback()) return mockDokumente;
      const { data, error } = await supabase!
        .from("dokumente")
        .select("*")
        .order("uploaded_at", { ascending: false });
      if (error) {
        console.warn("[dokumente] fallback:", error.message);
        return mockDokumente;
      }
      return (data ?? []) as unknown as Dokument[];
    },
    staleTime: 30_000,
  });

interface UploadInput {
  tenant_id: string;
  file: File;
  mandant_id?: string;
  akte_id?: string;
}

export const useUploadDokument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tenant_id,
      file,
      mandant_id,
      akte_id,
    }: UploadInput): Promise<Dokument | null> => {
      if (useMockFallback()) {
        console.info("[dokumente] mock upload:", file.name);
        return null;
      }
      const path = `tenants/${tenant_id}/${akte_id ?? "_global"}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase!.storage
        .from(TENANT_BUCKET)
        .upload(path, file);
      if (upErr) throw upErr;

      const { data, error: dbErr } = await supabase!
        .from("dokumente")
        .insert({
          tenant_id,
          mandant_id,
          akte_id,
          dateiname: file.name,
          storage_path: path,
          mime_type: file.type,
          groesse_bytes: file.size,
          status: "neu",
          uploaded_by: "anwalt",
        })
        .select()
        .single();
      if (dbErr) throw dbErr;

      return data as unknown as Dokument;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dokumente"] }),
  });
};

export const useDokumentSignedUrl = async (storage_path: string) => {
  if (!supabase) return null;
  const { data } = await supabase.storage
    .from(TENANT_BUCKET)
    .createSignedUrl(storage_path, 60 * 5);
  return data?.signedUrl ?? null;
};
