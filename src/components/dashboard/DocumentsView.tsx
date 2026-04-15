import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Trash2, Download, CheckCircle, File, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  date: string;
  status: "uploaded" | "uploading";
  progress?: number;
}

const existingDocuments: UploadedFile[] = [
  { id: "1", name: "Heiratsurkunde.pdf", size: "1.2 MB", type: "pdf", date: "05. Mär 2026", status: "uploaded" },
  { id: "2", name: "Vermögensaufstellung.pdf", size: "3.4 MB", type: "pdf", date: "12. Mär 2026", status: "uploaded" },
  { id: "3", name: "Unterhaltsberechnung.xlsx", size: "0.8 MB", type: "xlsx", date: "28. Mär 2026", status: "uploaded" },
  { id: "4", name: "Personalausweis_Scan.jpg", size: "2.1 MB", type: "jpg", date: "01. Mär 2026", status: "uploaded" },
];

const fileIcon = (type: string) => {
  if (["jpg", "png", "jpeg"].includes(type)) return Image;
  return FileText;
};

const DocumentsView = () => {
  const [files, setFiles] = useState<UploadedFile[]>(existingDocuments);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const simulateUpload = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "file";
    const allowed = ["pdf", "jpg", "jpeg", "png"];
    if (!allowed.includes(ext)) {
      toast({ title: "Dateityp nicht erlaubt", description: `Nur PDF, JPG und PNG Dateien sind erlaubt.`, variant: "destructive" });
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast({ title: "Datei zu groß", description: "Maximale Dateigröße ist 25 MB.", variant: "destructive" });
      return;
    }

    const newFile: UploadedFile = {
      id: Date.now().toString() + Math.random(),
      name: file.name,
      size: formatSize(file.size),
      type: ext,
      date: new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" }),
      status: "uploading",
      progress: 0,
    };

    setFiles((prev) => [newFile, ...prev]);

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles((prev) =>
          prev.map((f) => (f.id === newFile.id ? { ...f, status: "uploaded", progress: undefined } : f))
        );
        toast({ title: "Upload erfolgreich", description: `${file.name} wurde hochgeladen.` });
      } else {
        setFiles((prev) =>
          prev.map((f) => (f.id === newFile.id ? { ...f, progress } : f))
        );
      }
    }, 300);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(simulateUpload);
  }, [simulateUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(simulateUpload);
      e.target.value = "";
    }
  };

  const handleDelete = (id: string, name: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    toast({ title: "Datei gelöscht", description: `${name} wurde entfernt.` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground mb-1">Dokumente</h2>
        <p className="text-sm text-muted-foreground">Verwalten und laden Sie Ihre Dokumente hoch</p>
      </div>

      {/* Upload Area */}
      <div
        className={`glass-card border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer ${
          dragOver ? "border-accent bg-accent/5 scale-[1.01]" : "border-border/50 hover:border-accent/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileSelect} />
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
          dragOver ? "bg-accent/20 scale-110" : "bg-accent/[0.08]"
        }`}>
          <Upload className={`h-8 w-8 text-accent transition-transform ${dragOver ? "scale-110 -translate-y-1" : ""}`} />
        </div>
        <p className="text-foreground font-medium mb-1">
          {dragOver ? "Dateien hier ablegen" : "Dateien hierher ziehen"}
        </p>
        <p className="text-sm text-muted-foreground mb-4">oder klicken Sie um Dateien auszuwählen</p>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
          Dateien auswählen
        </Button>
        <p className="text-xs text-muted-foreground/60 mt-4">Max. 25 MB · PDF, JPG, PNG</p>
      </div>

      {/* File List */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">{files.length} Dokumente</h3>
        <div className="space-y-2">
          {files.map((file) => {
            const Icon = fileIcon(file.type);
            return (
              <div
                key={file.id}
                className="glass-card p-4 border-border/50 flex items-center justify-between hover:border-accent/20 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size} · {file.date}</p>
                    {file.status === "uploading" && file.progress !== undefined && (
                      <div className="mt-2 w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {file.status === "uploaded" ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                      <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all opacity-0 group-hover:opacity-100">
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                        onClick={() => handleDelete(file.id, file.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-accent font-medium">{Math.round(file.progress || 0)}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DocumentsView;
