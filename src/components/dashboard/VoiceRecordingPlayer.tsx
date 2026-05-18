import { useEffect, useRef, useState } from "react";
import { PauseCircle, PlayCircle, Volume2, Download } from "lucide-react";

interface Props {
  /** Recording-URL (Vapi signed S3) — wenn null/undefined: Empty-State */
  url?: string | null;
  /** Anruf-Dauer in Sekunden für Fallback-Display falls Audio-Metadaten fehlen */
  durationSec?: number | null;
}

const fmt = (sec: number) => {
  if (!Number.isFinite(sec) || sec < 0) return "—:—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/**
 * Echter Audio-Player für ein Vapi-Recording. Nutzt das native <audio>-
 * Element + die Browser-Audio-API für Playback-State + Progress.
 *
 * Wenn keine URL: zeigt erklärende Empty-State (statt fakem Progress).
 */
const VoiceRecordingPlayer = ({ url, durationSec }: Props) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState<number>(durationSec ?? 0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.currentTime);
    const onMeta = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) setDuration(a.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, [url]);

  if (!url) {
    return (
      <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border/50 text-center">
        <Volume2 className="h-6 w-6 text-muted-foreground/50 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          Keine Aufzeichnung vorhanden.
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          Recording ist standardmäßig aktiviert. Älteren Anrufen fehlt es ggf. noch.
        </p>
      </div>
    );
  }

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      try {
        await a.play();
        setPlaying(true);
      } catch (e) {
        console.warn("[VoiceRecordingPlayer] play failed", e);
      }
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
    setProgress(a.currentTime);
  };

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-navy/[0.04] border border-navy/10">
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        onClick={toggle}
        aria-label={playing ? "Pause" : "Abspielen"}
        className="text-accent hover:text-gold-dark transition-colors"
      >
        {playing ? (
          <PauseCircle className="h-10 w-10" />
        ) : (
          <PlayCircle className="h-10 w-10" />
        )}
      </button>
      <div className="flex-1">
        <div
          role="slider"
          aria-label="Recording-Position"
          aria-valuemin={0}
          aria-valuemax={duration || 0}
          aria-valuenow={progress}
          tabIndex={0}
          onClick={seek}
          className="h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer"
        >
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 font-mono">
          <span>{fmt(progress)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
      <a
        href={url}
        download
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Aufzeichnung herunterladen"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <Download className="h-4 w-4" />
      </a>
    </div>
  );
};

export default VoiceRecordingPlayer;
