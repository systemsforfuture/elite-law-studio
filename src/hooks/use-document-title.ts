import { useEffect } from "react";

const BASE = "SYSTEMS™";

/**
 * Setzt document.title auf "<title> · SYSTEMS™".
 * Resetet auf BASE beim Unmount.
 */
export const useDocumentTitle = (title: string | undefined | null) => {
  useEffect(() => {
    if (!title) {
      document.title = `${BASE} — KI-Plattform für Anwaltskanzleien`;
      return;
    }
    document.title = `${title} · ${BASE}`;
    return () => {
      document.title = `${BASE} — KI-Plattform für Anwaltskanzleien`;
    };
  }, [title]);
};
