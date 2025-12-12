import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HumanAgentCollaboration from "./HumanAgentCollaboration";

describe("HumanAgentCollaboration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const defaultProps = {
    agentName: "Test Agent",
    taskDescription: "Test task description",
  };

  describe("Memory Leak Prevention", () => {
    it("deve limpar todos os timeouts ao desmontar", async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
      const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

      const { unmount } = render(<HumanAgentCollaboration {...defaultProps} />);

      // Aguardar montagem
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Desmontar componente
      unmount();

      // Verificar que clearTimeout foi chamado
      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it("deve limpar timeout de inatividade ao desmontar durante edição humana", async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

      const { unmount, getByText } = render(<HumanAgentCollaboration {...defaultProps} />);

      // Entrar em modo de edição humana
      const editButton = getByText(/Intervir/i);
      await userEvent.click(editButton);

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      unmount();

      // Verificar limpeza
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("deve limpar resumeTimeout ao desmontar durante agent_resuming", async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

      const { unmount, getByText } = render(<HumanAgentCollaboration {...defaultProps} />);

      // Entrar em edição e depois finalizar (trigger resuming)
      const editButton = getByText(/Intervir/i);
      await userEvent.click(editButton);

      const finishButton = getByText(/Concluir Edição/i);
      await userEvent.click(finishButton);

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe("Race Condition Prevention", () => {
    it("não deve sobrescrever resumeTimeoutRef quando humanActivityTimeout dispara", async () => {
      const { getByText } = render(<HumanAgentCollaboration {...defaultProps} />);

      // Trigger edição humana
      const editButton = getByText(/Intervir/i);
      await userEvent.click(editButton);

      // Aguardar timeout de atividade humana (3s)
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      // Aguardar timeout de inatividade (5s)
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Verificar que fase mudou para agent_resuming
      await waitFor(() => {
        expect(screen.getByText(/Retomando/i)).toBeInTheDocument();
      });

      // Aguardar resume timeout (1s)
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Verificar que voltou para agent_working
      await waitFor(() => {
        expect(screen.getByText(/Trabalhando/i)).toBeInTheDocument();
      });
    });

    it("deve permitir múltiplas pausas/retomadas sem conflitos de ref", async () => {
      const { getByText } = render(<HumanAgentCollaboration {...defaultProps} />);

      for (let i = 0; i < 3; i++) {
        // Pausar
        const editButton = getByText(/Intervir/i);
        await userEvent.click(editButton);

        await act(async () => {
          vi.advanceTimersByTime(100);
        });

        // Retomar
        const finishButton = getByText(/Concluir Edição/i);
        await userEvent.click(finishButton);

        await act(async () => {
          vi.advanceTimersByTime(1100);
        });
      }

      // Verificar que voltou ao estado normal
      await waitFor(() => {
        expect(screen.getByText(/Trabalhando/i)).toBeInTheDocument();
      });
    });
  });

  describe("Stale Closure Prevention", () => {
    it("deve chamar onComplete atualizado mesmo após re-render", async () => {
      const onComplete1 = vi.fn();
      const onComplete2 = vi.fn();

      const { rerender } = render(
        <HumanAgentCollaboration {...defaultProps} onComplete={onComplete1} />
      );

      // Aguardar progresso parcial
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Atualizar onComplete
      rerender(<HumanAgentCollaboration {...defaultProps} onComplete={onComplete2} />);

      // Completar progresso
      await act(async () => {
        vi.advanceTimersByTime(20000);
      });

      // Verificar que APENAS onComplete2 foi chamado (não onComplete1)
      expect(onComplete1).not.toHaveBeenCalled();
      expect(onComplete2).toHaveBeenCalledTimes(1);
    });
  });

  describe("Double-call Prevention", () => {
    it("não deve chamar onComplete múltiplas vezes", async () => {
      const onComplete = vi.fn();

      render(<HumanAgentCollaboration {...defaultProps} onComplete={onComplete} />);

      // Avançar até completar progresso
      await act(async () => {
        vi.advanceTimersByTime(25000);
      });

      // Verificar que onComplete foi chamado exatamente 1 vez
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("não deve chamar onComplete se componente desmontar antes de completar", async () => {
      const onComplete = vi.fn();

      const { unmount } = render(
        <HumanAgentCollaboration {...defaultProps} onComplete={onComplete} />
      );

      // Avançar progresso parcialmente
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      // Desmontar antes de completar
      unmount();

      // Verificar que onComplete NÃO foi chamado
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe("Timeout Cleanup Scenarios", () => {
    it("deve limpar humanActivityTimeout ao clicar novamente durante edição", async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

      const { getByText } = render(<HumanAgentCollaboration {...defaultProps} />);

      // Primeira pausa
      const editButton = getByText(/Intervir/i);
      await userEvent.click(editButton);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Segunda pausa (deve limpar timeout anterior)
      await userEvent.click(editButton);

      // Verificar que clearTimeout foi chamado para o timeout anterior
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("deve limpar resumeTimeout ao clicar em finalizar múltiplas vezes", async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

      const { getByText } = render(<HumanAgentCollaboration {...defaultProps} />);

      // Entrar em edição
      const editButton = getByText(/Intervir/i);
      await userEvent.click(editButton);

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Primeira finalização
      const finishButton = getByText(/Concluir Edição/i);
      await userEvent.click(finishButton);

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Pausar novamente
      await userEvent.click(editButton);

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Segunda finalização (deve limpar timeout anterior)
      await userEvent.click(finishButton);

      // Verificar que clearTimeout foi chamado
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe("Inactivity Detection", () => {
    it("deve retomar automaticamente após inatividade", async () => {
      const { getByText } = render(<HumanAgentCollaboration {...defaultProps} />);

      // Pausar
      const editButton = getByText(/Pausar e Editar/i);
      await userEvent.click(editButton);

      // Aguardar atividade humana expirar (3s)
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      // Aguardar inatividade (5s)
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Verificar que está retomando
      await waitFor(() => {
        expect(screen.getByText(/Retomando/i)).toBeInTheDocument();
      });
    });

    it("deve resetar timer de inatividade ao retomar atividade", async () => {
      const { getByText } = render(<HumanAgentCollaboration {...defaultProps} />);

      // Pausar
      const editButton = getByText(/Pausar e Editar/i);
      await userEvent.click(editButton);

      // Aguardar 2s de inatividade
      await act(async () => {
        vi.advanceTimersByTime(5000); // 3s atividade + 2s inatividade
      });

      // Pausar novamente (resetar timer)
      await userEvent.click(editButton);

      // Aguardar mais 2s (não deve retomar ainda)
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Ainda deve estar em edição (não retomou)
      expect(screen.getByText(/Editando/i)).toBeInTheDocument();
    });
  });
});
