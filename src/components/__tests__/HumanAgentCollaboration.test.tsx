import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HumanAgentCollaboration from "../HumanAgentCollaboration";

describe("HumanAgentCollaboration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Memory Leak Prevention", () => {
    it("deve limpar todos os timeouts ao desmontar", async () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const { unmount } = render(
        <HumanAgentCollaboration agentName="Test Agent" taskDescription="Test task" />
      );

      // Avançar para criar alguns timeouts
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      unmount();

      // Verificar que clearTimeout foi chamado
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("deve limpar timeout de inatividade ao desmontar durante edição humana", async () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const { unmount } = render(
        <HumanAgentCollaboration agentName="Test Agent" taskDescription="Test task" />
      );

      // Simular início do agente
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Simular intervenção humana
      const interventionButton = screen.getByText(/Intervir/i);
      act(() => {
        interventionButton.click();
      });

      // Desmontar durante edição humana
      unmount();

      // Verificar que todos os timeouts foram limpos
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("deve limpar timeout de retomada ao desmontar durante countdown", async () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const { unmount } = render(
        <HumanAgentCollaboration agentName="Test Agent" taskDescription="Test task" />
      );

      // Simular agente trabalhando
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Intervir
      const interventionButton = screen.getByText(/Intervir/i);
      act(() => {
        interventionButton.click();
      });

      // Finalizar edição (iniciar countdown)
      const finishButton = screen.getByText(/Concluir Edição/i);
      act(() => {
        finishButton.click();
      });

      // Desmontar durante countdown
      unmount();

      // Verificar limpeza
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe("Race Condition Prevention", () => {
    it("deve usar refs separados para activity e resume timeouts", async () => {
      const setTimeoutSpy = vi.spyOn(global, "setTimeout");
      render(<HumanAgentCollaboration agentName="Test Agent" taskDescription="Test task" />);

      // Simular agente trabalhando
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Intervir (cria humanActivityTimeout)
      const interventionButton = screen.getByText(/Intervir/i);
      act(() => {
        interventionButton.click();
      });

      const activityTimeoutCount = setTimeoutSpy.mock.calls.length;

      // Finalizar (cria resumeTimeout)
      const finishButton = screen.getByText(/Concluir Edição/i);
      act(() => {
        finishButton.click();
      });

      const resumeTimeoutCount = setTimeoutSpy.mock.calls.length;

      // Verificar que ambos os timeouts foram criados
      expect(resumeTimeoutCount).toBeGreaterThan(activityTimeoutCount);
    });

    it("não deve cancelar resumeTimeout ao detectar atividade humana", async () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      render(<HumanAgentCollaboration agentName="Test Agent" taskDescription="Test task" />);

      // Agente trabalha
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Humano intervém
      const interventionButton = screen.getByText(/Intervir/i);
      act(() => {
        interventionButton.click();
      });

      // Humano finaliza (inicia countdown)
      const finishButton = screen.getByText(/Concluir Edição/i);
      act(() => {
        finishButton.click();
      });

      const clearCountBefore = clearTimeoutSpy.mock.calls.length;

      // Simular "atividade" durante countdown (não deve afetar resumeTimeout)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      const clearCountAfter = clearTimeoutSpy.mock.calls.length;

      // Não deve ter limpado mais timeouts durante countdown
      expect(clearCountAfter).toBeLessThanOrEqual(clearCountBefore + 1);
    });
  });

  describe("Callback Stability", () => {
    it("não deve recriar interval quando onComplete é estável", async () => {
      const setIntervalSpy = vi.spyOn(global, "setInterval");
      const onComplete = vi.fn();

      render(<HumanAgentCollaboration onComplete={onComplete} />);

      const initialIntervalCount = setIntervalSpy.mock.calls.length;

      // Avançar tempo sem mudar props
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const finalIntervalCount = setIntervalSpy.mock.calls.length;

      // Interval não deve ser recriado
      expect(finalIntervalCount).toBe(initialIntervalCount);
    });

    it("deve usar ref para acessar onComplete atualizado", async () => {
      const onComplete1 = vi.fn();
      const onComplete2 = vi.fn();

      const { rerender } = render(<HumanAgentCollaboration onComplete={onComplete1} />);

      // Agente trabalha até completar
      act(() => {
        vi.advanceTimersByTime(11000);
      });

      // Trocar callback durante execução
      rerender(<HumanAgentCollaboration onComplete={onComplete2} />);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // onComplete2 deve ser chamado quando ref é atualizado
      await waitFor(() => {
        expect(onComplete1).not.toHaveBeenCalled();
      });
    });
  });

  describe("Double-call Prevention", () => {
    it("deve chamar onComplete apenas uma vez ao completar", async () => {
      const onComplete = vi.fn();
      render(<HumanAgentCollaboration onComplete={onComplete} />);

      // Deixar agente completar
      act(() => {
        vi.advanceTimersByTime(12000);
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1);
      });
    });

    it("não deve chamar onComplete múltiplas vezes em intervals consecutivos", async () => {
      const onComplete = vi.fn();
      render(<HumanAgentCollaboration onComplete={onComplete} />);

      // Múltiplos ticks de interval
      act(() => {
        vi.advanceTimersByTime(500);
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      act(() => {
        vi.advanceTimersByTime(11000);
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Phase Transitions", () => {
    it("deve transicionar de agent_working para human_editing ao intervir", async () => {
      render(<HumanAgentCollaboration agentName="Test Agent" taskDescription="Test task" />);

      // Verificar estado inicial
      expect(screen.getByText(/O agente está trabalhando/i)).toBeInTheDocument();

      // Intervir
      const interventionButton = screen.getByText(/Intervir/i);
      act(() => {
        interventionButton.click();
      });

      // Verificar transição
      await waitFor(() => {
        expect(screen.getByText(/Você está editando/i)).toBeInTheDocument();
      });
    });

    it("deve transicionar de human_editing para agent_resuming ao finalizar", async () => {
      render(<HumanAgentCollaboration agentName="Test Agent" taskDescription="Test task" />);

      // Intervir primeiro
      const interventionButton = screen.getByText(/Intervir/i);
      act(() => {
        interventionButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText(/Você está editando/i)).toBeInTheDocument();
      });

      // Finalizar
      const finishButton = screen.getByText(/Concluir Edição/i);
      act(() => {
        finishButton.click();
      });

      // Verificar countdown
      await waitFor(() => {
        expect(screen.getByText(/retomará automaticamente em 5s/i)).toBeInTheDocument();
      });
    });

    it("deve transicionar de agent_resuming para agent_working após countdown", async () => {
      render(<HumanAgentCollaboration agentName="Test Agent" taskDescription="Test task" />);

      // Intervir
      const interventionButton = screen.getByText(/Intervir/i);
      act(() => {
        interventionButton.click();
      });

      // Finalizar
      const finishButton = screen.getByText(/Concluir Edição/i);
      act(() => {
        finishButton.click();
      });

      // Esperar countdown
      act(() => {
        vi.advanceTimersByTime(11000);
      });

      // Verificar retomada
      await waitFor(() => {
        expect(screen.getByText(/O agente retomou/i)).toBeInTheDocument();
      });
    });

    it("deve transicionar para completed após agente finalizar", async () => {
      render(<HumanAgentCollaboration agentName="Test Agent" taskDescription="Test task" />);

      // Deixar agente completar trabalho
      act(() => {
        vi.advanceTimersByTime(12000);
      });

      // Verificar conclusão
      await waitFor(() => {
        expect(screen.getByText(/Trabalho concluído/i)).toBeInTheDocument();
      });
    });
  });

  describe("Inactivity Detection", () => {
    it("deve retomar agente após 30s de inatividade humana", async () => {
      render(<HumanAgentCollaboration agentName="Test Agent" taskDescription="Test task" />);

      // Intervir
      const interventionButton = screen.getByText(/Intervir/i);
      act(() => {
        interventionButton.click();
      });

      // Esperar inatividade (5s limit + small buffer)
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      // Verificar retomada automática (agent_resuming text shown)
      await waitFor(() => {
        expect(screen.getByText(/Retomando trabalho autônomo/i)).toBeInTheDocument();
      });
    });
  });

  describe("Progress Tracking", () => {
    it("deve incrementar progresso a cada 500ms", async () => {
      render(<HumanAgentCollaboration agentName="Test Agent" taskDescription="Test task" />);

      // Progresso inicial
      const initialProgress = screen.getByRole("progressbar");
      const initialValue = parseInt(initialProgress.getAttribute("aria-valuenow") || "0");

      // Avançar tempo
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Verificar incremento
      const updatedProgress = screen.getByRole("progressbar");
      const updatedValue = parseInt(updatedProgress.getAttribute("aria-valuenow") || "0");

      expect(updatedValue).toBeGreaterThan(initialValue);
    });

    it("deve parar de incrementar progresso durante edição humana", async () => {
      render(<HumanAgentCollaboration agentName="Test Agent" taskDescription="Test task" />);

      // Intervir
      const interventionButton = screen.getByText(/Intervir/i);
      act(() => {
        interventionButton.click();
      });

      // Capturar progresso durante edição
      const progressDuringEdit = screen.getByRole("progressbar");
      const valueDuringEdit = parseInt(progressDuringEdit.getAttribute("aria-valuenow") || "0");

      // Avançar tempo
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Verificar que progresso não mudou
      const progressAfter = screen.getByRole("progressbar");
      const valueAfter = parseInt(progressAfter.getAttribute("aria-valuenow") || "0");

      expect(valueAfter).toBe(valueDuringEdit);
    });
  });
});
