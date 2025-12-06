import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTiptapEditor } from "./use-tiptap-editor";

// Mock @tiptap/react
vi.mock("@tiptap/react", () => ({
  useCurrentEditor: () => ({
    editor: {
      state: {},
      can: () => true,
      chain: () => ({ focus: () => ({ run: () => {} }) }),
    },
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEditorState: ({ selector }: any) =>
    selector({
      editor: {
        state: {},
        can: () => true,
      },
    }),
}));

describe("useTiptapEditor", () => {
  it("returns editor from context", () => {
    const { result } = renderHook(() => useTiptapEditor());
    expect(result.current.editor).toBeDefined();
  });

  it("returns provided editor if passed", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockEditor = { state: {}, can: () => true } as any;
    const { result } = renderHook(() => useTiptapEditor(mockEditor));
    expect(result.current.editor).toBe(mockEditor);
  });
});
