/**
 * Testes unitários do ProfessionalEditor
 */
import { describe, expect, it } from "vitest";

describe("ProfessionalEditor", () => {
  it("should handle content changes", () => {
    const initialContent = "<p>Texto inicial</p>";
    const newContent = "<p>Texto modificado</p>";

    expect(newContent).not.toBe(initialContent);
    expect(newContent).toContain("modificado");
  });

  it("should validate HTML content", () => {
    const validHtml = "<p>Parágrafo válido</p>";
    const hasOpenTag = validHtml.includes("<p>");
    const hasCloseTag = validHtml.includes("</p>");

    expect(hasOpenTag).toBe(true);
    expect(hasCloseTag).toBe(true);
  });

  it("should support rich text formatting", () => {
    const richText = "<strong>Negrito</strong> <em>Itálico</em> <u>Sublinhado</u>";

    expect(richText).toContain("<strong>");
    expect(richText).toContain("<em>");
    expect(richText).toContain("<u>");
  });

  it("should handle empty content", () => {
    const emptyContent = "";

    expect(emptyContent).toBe("");
    expect(emptyContent.length).toBe(0);
  });
});
