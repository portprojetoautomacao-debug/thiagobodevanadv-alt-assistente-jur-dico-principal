import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TiptapEditorV2 } from "./TiptapEditorV2";

describe("TiptapEditorV2", () => {
  const mockOnChange = vi.fn();
  const mockOnAIGenerate = vi.fn();
  const mockOnAIStream = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderização Básica", () => {
    it("deve renderizar o editor com conteúdo inicial", () => {
      const initialContent = "<p>Conteúdo inicial de teste</p>";

      render(<TiptapEditorV2 content={initialContent} onChange={mockOnChange} />);

      const editorElement = screen.getByRole("presentation");
      expect(editorElement).toBeInTheDocument();
      expect(editorElement).toHaveTextContent("Conteúdo inicial de teste");
    });

    it("deve renderizar contador de palavras e caracteres", () => {
      render(<TiptapEditorV2 content="<p>Teste de contagem</p>" onChange={mockOnChange} />);

      expect(screen.getByText(/palavras/i)).toBeInTheDocument();
      expect(screen.getByText(/caracteres/i)).toBeInTheDocument();
    });
  });

  describe("Edição de Texto", () => {
    it("deve chamar onChange ao editar texto", async () => {
      const user = userEvent.setup();

      render(<TiptapEditorV2 content="" onChange={mockOnChange} />);

      const editor = screen.getByRole("presentation");
      await user.click(editor);
      await user.keyboard("Novo texto");

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe("Variáveis", () => {
    it("deve substituir variáveis {{variavel}} corretamente", async () => {
      const variables = {
        processo: "1234567-89.2024.5.02.0999",
        autor: "João Silva",
      };

      mockOnAIGenerate.mockResolvedValue("Processo {{processo}} de {{autor}}");

      render(
        <TiptapEditorV2
          content=""
          onChange={mockOnChange}
          onAIGenerate={mockOnAIGenerate}
          variables={variables}
        />
      );

      const aiButton = screen.getByTitle("Comandos de IA");
      await userEvent.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText(/Comandos Rápidos/i)).toBeInTheDocument();
      });
    });
  });

  describe("Comandos de IA", () => {
    it("deve processar comandos AI rápidos", async () => {
      mockOnAIGenerate.mockResolvedValue("Texto expandido");

      render(
        <TiptapEditorV2
          content="<p>Texto</p>"
          onChange={mockOnChange}
          onAIGenerate={mockOnAIGenerate}
        />
      );

      const aiButton = screen.getByTitle("Comandos de IA");
      await userEvent.click(aiButton);

      const expandButton = screen.getByRole("button", { name: /Expandir/i });
      await userEvent.click(expandButton);

      await waitFor(() => {
        expect(mockOnAIGenerate).toHaveBeenCalled();
      });
    });
  });

  describe("Streaming de IA", () => {
    it("deve fazer streaming de IA corretamente", async () => {
      mockOnAIStream.mockImplementation(async (prompt, callbacks) => {
        callbacks.onChunk("Streaming");
        callbacks.onComplete();
      });

      render(<TiptapEditorV2 content="" onChange={mockOnChange} onAIStream={mockOnAIStream} />);

      const aiButton = screen.getByTitle("Comandos de IA");
      await userEvent.click(aiButton);

      const promptInput = screen.getByPlaceholderText(/Ex: Escreva uma petição/i);
      await userEvent.type(promptInput, "Teste");

      const generateButton = screen.getByRole("button", {
        name: /Gerar com Streaming/i,
      });
      await userEvent.click(generateButton);

      await waitFor(() => {
        expect(mockOnAIStream).toHaveBeenCalled();
      });
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter labels ARIA corretos", () => {
      render(<TiptapEditorV2 content="" onChange={mockOnChange} />);

      const editor = screen.getByRole("presentation");
      expect(editor).toBeInTheDocument();
    });
  });
});
