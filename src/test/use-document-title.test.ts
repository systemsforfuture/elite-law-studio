import { describe, expect, it, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDocumentTitle } from "@/hooks/use-document-title";

const DEFAULT = "SYSTEMS™ — KI-Plattform für Anwaltskanzleien";

afterEach(() => {
  document.title = DEFAULT;
});

describe("useDocumentTitle", () => {
  it("sets document.title to '<title> · SYSTEMS™' when title is provided", () => {
    renderHook(() => useDocumentTitle("Mandanten"));
    expect(document.title).toBe("Mandanten · SYSTEMS™");
  });

  it("uses default title when title is null or undefined", () => {
    renderHook(() => useDocumentTitle(null));
    expect(document.title).toBe(DEFAULT);

    renderHook(() => useDocumentTitle(undefined));
    expect(document.title).toBe(DEFAULT);
  });

  it("resets to default on unmount", () => {
    const { unmount } = renderHook(() => useDocumentTitle("Akten"));
    expect(document.title).toBe("Akten · SYSTEMS™");
    unmount();
    expect(document.title).toBe(DEFAULT);
  });

  it("updates when title prop changes", () => {
    const { rerender } = renderHook(
      ({ title }: { title: string }) => useDocumentTitle(title),
      { initialProps: { title: "Voice-Agent" } },
    );
    expect(document.title).toBe("Voice-Agent · SYSTEMS™");

    rerender({ title: "Inbox" });
    expect(document.title).toBe("Inbox · SYSTEMS™");
  });
});
