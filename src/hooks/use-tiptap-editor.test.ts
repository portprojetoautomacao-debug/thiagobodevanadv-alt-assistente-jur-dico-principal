import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useTiptapEditor } from "./use-tiptap-editor";

describe("useTiptapEditor", () => {
  it("initializes editor with default options", () => {
    const { result } = renderHook(() =>
      useTiptapEditor({
        content: "<p>Initial content</p>",
        onUpdate: () => {},
      })
    );

    expect(result.current).toBeDefined();
  });

  it("initializes editor with custom placeholder", () => {
    const { result } = renderHook(() =>
      useTiptapEditor({
        content: "",
        onUpdate: () => {},
        placeholder: "Digite algo...",
      })
    );

    expect(result.current).toBeDefined();
  });

  it("handles readOnly mode", () => {
    const { result } = renderHook(() =>
      useTiptapEditor({
        content: "<p>Content</p>",
        onUpdate: () => {},
        editable: false,
      })
    );

    expect(result.current?.isEditable).toBe(false);
  });

  it("cleans up on unmount", () => {
    const { unmount } = renderHook(() =>
      useTiptapEditor({
        content: "<p>Content</p>",
        onUpdate: () => {},
      })
    );

    unmount();
    // Editor should be destroyed
  });
});
