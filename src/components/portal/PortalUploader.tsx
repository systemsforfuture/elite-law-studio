import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { useUploadDokument } from "@/lib/queries/use-dokumente";
import { toast } from "sonner";

interface Props {
  tenantId: string;
  mandantId: string;
  akteId?: string;
  variant?: "compact" | "wide";
  /** Bei Klick: optional Tab im Portal wechseln */
  onUploaded?: () => void;
}

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPTED = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const PortalUploader = ({
  tenantId,
  mandantId,
  akteId,
  variant = "wide",
  onUploaded,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [done, setDone] = useState(false);
  const upload = useUploadDokument();

  useEffect(() => {
    return () => {
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    };
  }, []);

  const handleFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error("Datei zu groß", { description: "Max. 25 MB pro Datei." });
      return;
    }
    if (!ACCEPTED.includes(file.type) && file.type) {
      toast.error("Format nicht unterstützt", {
        description: "Nur PDF, JPG, PNG, WebP, DOC oder DOCX.",
      });
      return;
    }
    const t = toast.loading(`Lade »${file.name}« hoch…`);
    try {
      await upload.mutateAsync({
        tenant_id: tenantId,
        mandant_id: mandantId,
        akte_id: akteId,
        file,
        uploaded_by: "mandant",
      });
      toast.success("Hochgeladen", {
        id: t,
        description:
          "SYSTEMS-KI klassifiziert das Dokument und benachrichtigt Ihren Anwalt.",
        icon: <Sparkles className="h-4 w-4 text-accent" />,
      });
      setDone(true);
      onUploaded?.();
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
      doneTimerRef.current = setTimeout(() => setDone(false), 3000);
    } catch (e) {
      toast.error("Upload fehlgeschlagen", {
        id: t,
        description: e instanceof Error ? e.message : "Unbekannter Fehler",
      });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const compact = variant === "compact";
  const isPending = upload.isPending;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => !isPending && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isPending) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
          compact ? "p-5 sm:p-6" : "p-8 sm:p-10"
        } ${
          isPending
            ? "border-accent/40 bg-accent/[0.06] cursor-wait"
            : done
            ? "border-emerald-500/40 bg-emerald-500/[0.04]"
            : dragOver
            ? "border-accent/60 bg-accent/[0.08]"
            : "border-accent/20 bg-accent/[0.02] hover:bg-accent/[0.04]"
        }`}
      >
        {isPending ? (
          <>
            <Loader2 className={`text-accent mx-auto mb-2 animate-spin ${compact ? "h-7 w-7" : "h-10 w-10"}`} />
            <h3 className="text-sm font-display font-bold text-foreground mb-1">
              Hochladen …
            </h3>
            <p className="text-xs text-muted-foreground">
              Verschlüsselte Übertragung
            </p>
          </>
        ) : done ? (
          <>
            <CheckCircle2 className={`text-emerald-600 mx-auto mb-2 ${compact ? "h-7 w-7" : "h-10 w-10"}`} />
            <h3 className="text-sm font-display font-bold text-foreground mb-1">
              Erfolgreich hochgeladen
            </h3>
            <p className="text-xs text-muted-foreground">
              KI klassifiziert & benachrichtigt Ihren Anwalt.
            </p>
          </>
        ) : (
          <>
            <Upload className={`text-accent mx-auto mb-2 ${compact ? "h-7 w-7" : "h-10 w-10"}`} />
            <h3 className="text-sm font-display font-bold text-foreground mb-1">
              {compact ? "Dokument einreichen" : "Dokument hochladen"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Klicken oder Datei hierher ziehen
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              PDF · JPG · PNG · DOC · max 25 MB
            </p>
          </>
        )}
      </div>
      {!compact && (
        <div className="text-[10px] text-muted-foreground/70 mt-3 flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3" />
          Ende-zu-Ende-verschlüsselt · Hosting Frankfurt · DSGVO-konform
        </div>
      )}
    </div>
  );
};

export default PortalUploader;
