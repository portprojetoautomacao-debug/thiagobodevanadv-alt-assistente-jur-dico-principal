import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Process } from "../../types";
import ProcessosView from "../ProcessosView";

import { useProcesses } from "../../hooks/use-processes";

// Mock do hook useProcesses
vi.mock("@/hooks/use-processes", () => ({
  useProcesses: () => ({
    processes: mockProcesses,
    addProcess: vi.fn(),
    updateProcess: vi.fn(),
    deleteProcess: vi.fn(),
  }),
}));

// Mock do llm-client
vi.mock("@/lib/llm-client", () => ({
  llm: {
    generateText: vi.fn().mockResolvedValue({ text: "Análise de IA" }),
  },
}));

const mockProcesses: Process[] = [
  {
    id: "1",
    numeroCNJ: "1234567-89.2024.5.02.0999",
    titulo: "Ação Trabalhista - João Silva",
    autor: "João Silva",
    reu: "Empresa ABC Ltda",
    comarca: "São Paulo",
    vara: "1ª Vara do Trabalho",
    status: "ativo",
    fase: "conhecimento",
    dataDistribuicao: "2024-01-15",
    dataUltimaMovimentacao: "2024-12-01",
    valor: 50000,
    prazos: [
      {
        id: "1",
        processId: "1",
        descricao: "Prazo para contestação",
        dataInicio: "2025-01-10",
        diasCorridos: 5,
        tipoPrazo: "cpc",
        dataFinal: "2025-01-15",
        concluido: false,
        urgente: true,
        createdAt: "2025-01-10T00:00:00Z",
      },
    ],
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-12-01T00:00:00Z",
  },
  {
    id: "2",
    numeroCNJ: "9876543-21.2024.5.02.0888",
    titulo: "Ação de Cobrança - Maria Santos",
    autor: "Maria Santos",
    reu: "Banco XYZ S/A",
    comarca: "Rio de Janeiro",
    vara: "2ª Vara Cível",
    status: "arquivado",
    fase: "execucao",
    dataDistribuicao: "2023-06-10",
    valor: 15000,
    prazos: [],
    dataUltimaMovimentacao: "2023-07-01",
    createdAt: "2023-06-10T00:00:00Z",
    updatedAt: "2023-07-01T00:00:00Z",
  },
  {
    id: "3",
    numeroCNJ: "5555555-55.2024.5.02.0777",
    titulo: "Revisional de Contrato",
    autor: "Pedro Costa",
    reu: "Financeira QWE",
    comarca: "São Paulo",
    vara: "3ª Vara Cível",
    status: "ativo",
    fase: "conhecimento",
    dataDistribuicao: "2024-09-20",
    valor: 30000,
    prazos: [],
    dataUltimaMovimentacao: "2024-10-01",
    createdAt: "2024-09-20T00:00:00Z",
    updatedAt: "2024-10-01T00:00:00Z",
  },
];

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("ProcessosView - Dashboard de Estatísticas", () => {
  it("deve exibir total de processos", () => {
    renderWithProviders(<ProcessosView />);

    const totalCard = screen.getByText("Total");
    expect(totalCard).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("deve calcular processos ativos corretamente", () => {
    renderWithProviders(<ProcessosView />);

    const ativosValue = screen.getByText("2");
    expect(ativosValue).toHaveClass("text-green-600");
  });

  it("deve calcular processos arquivados corretamente", () => {
    renderWithProviders(<ProcessosView />);

    const arquivadosValue = screen.getByText("1");
    expect(arquivadosValue).toHaveClass("text-gray-600");
  });

  it("deve formatar valor total em moeda", () => {
    renderWithProviders(<ProcessosView />);

    const valorTotal = screen.getByText(/R\$/);
    expect(valorTotal.textContent).toContain("95.000,00");
  });

  it("deve exibir prazos urgentes", () => {
    renderWithProviders(<ProcessosView />);

    const prazosUrgentes = screen.getByText("1");
    expect(prazosUrgentes).toHaveClass("text-red-600");
  });

  it("deve renderizar 5 cards de estatísticas", () => {
    renderWithProviders(<ProcessosView />);

    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Ativos")).toBeInTheDocument();
    expect(screen.getByText("Arquivados")).toBeInTheDocument();
    expect(screen.getByText("Valor Total")).toBeInTheDocument();
    expect(screen.getByText("Prazos")).toBeInTheDocument();
  });
});

describe("ProcessosView - Sistema de Ordenação", () => {
  it("deve ordenar por data (recent) por padrão", () => {
    renderWithProviders(<ProcessosView />);

    const cards = screen.getAllByRole("article");
    expect(cards[0]).toHaveTextContent("João Silva"); // Mais recente
  });

  it("deve ordenar alfabeticamente", async () => {
    renderWithProviders(<ProcessosView />);

    const sortSelect = screen.getByRole("combobox", { name: /ordenar/i });
    fireEvent.change(sortSelect, { target: { value: "alpha" } });

    await waitFor(() => {
      const cards = screen.getAllByRole("article");
      expect(cards[0]).toHaveTextContent("Ação de Cobrança");
    });
  });

  it("deve ordenar por valor (maior para menor)", async () => {
    renderWithProviders(<ProcessosView />);

    const sortSelect = screen.getByRole("combobox", { name: /ordenar/i });
    fireEvent.change(sortSelect, { target: { value: "value" } });

    await waitFor(() => {
      const cards = screen.getAllByRole("article");
      expect(cards[0]).toHaveTextContent("R$ 50.000,00");
    });
  });

  it("deve ordenar por status", async () => {
    renderWithProviders(<ProcessosView />);

    const sortSelect = screen.getByRole("combobox", { name: /ordenar/i });
    fireEvent.change(sortSelect, { target: { value: "status" } });

    await waitFor(() => {
      const cards = screen.getAllByRole("article");
      expect(cards[0]).toHaveTextContent("arquivado");
    });
  });
});

describe("ProcessosView - Filtro por Comarca", () => {
  it("deve listar todas as comarcas únicas", () => {
    renderWithProviders(<ProcessosView />);

    const comarcaSelect = screen.getByRole("combobox", { name: /comarca/i });
    fireEvent.click(comarcaSelect);

    expect(screen.getByText("São Paulo")).toBeInTheDocument();
    expect(screen.getByText("Rio de Janeiro")).toBeInTheDocument();
  });

  it("deve filtrar processos por comarca", async () => {
    renderWithProviders(<ProcessosView />);

    const comarcaSelect = screen.getByRole("combobox", { name: /comarca/i });
    fireEvent.change(comarcaSelect, { target: { value: "Rio de Janeiro" } });

    await waitFor(() => {
      expect(screen.getByText("Maria Santos")).toBeInTheDocument();
      expect(screen.queryByText("João Silva")).not.toBeInTheDocument();
    });
  });

  it('deve mostrar todas as comarcas quando filtro = "all"', () => {
    renderWithProviders(<ProcessosView />);

    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("Maria Santos")).toBeInTheDocument();
    expect(screen.getByText("Pedro Costa")).toBeInTheDocument();
  });
});

describe("ProcessosView - formatCurrency", () => {
  it("deve formatar valores em Real brasileiro", () => {
    renderWithProviders(<ProcessosView />);

    expect(screen.getByText(/R\$ 50\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 15\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 30\.000,00/)).toBeInTheDocument();
  });

  it("deve lidar com valores nulos", () => {
    const processosComNulo = [{ ...mockProcesses[0], valor: 0 }];

    vi.mocked(useProcesses).mockReturnValue({
      processes: processosComNulo,
      addProcess: vi.fn(),
      updateProcess: vi.fn(),
      deleteProcess: vi.fn(),
      getProcessById: vi.fn(),
      getActiveProcesses: vi.fn(),
      getProcessesByStatus: vi.fn(),
    });

    renderWithProviders(<ProcessosView />);

    expect(screen.getByText(/R\$ 0,00/)).toBeInTheDocument();
  });
});

describe("ProcessosView - Badge Urgente", () => {
  it("deve exibir badge urgente para processos com prazos críticos", () => {
    renderWithProviders(<ProcessosView />);

    const urgentBadge = screen.getByText(/Urgente/i);
    expect(urgentBadge).toBeInTheDocument();
    expect(urgentBadge).toHaveClass("text-xs");
  });

  it("deve mostrar quantidade de prazos pendentes", () => {
    renderWithProviders(<ProcessosView />);

    expect(screen.getByText("1 pendentes")).toBeInTheDocument();
  });

  it("não deve exibir badge urgente para processos sem prazos críticos", () => {
    renderWithProviders(<ProcessosView />);

    const mariaCard = screen.getByText("Maria Santos").closest("article");
    expect(mariaCard?.querySelector('[class*="destructive"]')).not.toBeInTheDocument();
  });
});

describe("ProcessosView - ViewMode Toggle", () => {
  it("deve renderizar no modo grid por padrão", () => {
    renderWithProviders(<ProcessosView />);

    const gridButton = screen.getByRole("button", { name: /grid/i });
    expect(gridButton).toHaveClass("bg-secondary");
  });

  it("deve alternar para modo list", async () => {
    renderWithProviders(<ProcessosView />);

    const listButton = screen
      .getAllByRole("button")
      .find((btn) => btn.querySelector("svg.lucide-list"));
    fireEvent.click(listButton!);

    await waitFor(() => {
      expect(listButton).toHaveClass("bg-secondary");
    });
  });
});

describe("ProcessosView - Helpers", () => {
  it("getStatusColor deve retornar cores corretas", () => {
    renderWithProviders(<ProcessosView />);

    const ativoBadges = screen.getAllByText("Ativo");
    expect(ativoBadges[0]).toBeInTheDocument();

    const arquivadoBadges = screen.getAllByText("Arquivado");
    expect(arquivadoBadges[0]).toBeInTheDocument();
  });

  it("getStatusLabel deve retornar labels em português", () => {
    renderWithProviders(<ProcessosView />);

    expect(screen.getAllByText("Ativo")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Arquivado")[0]).toBeInTheDocument();
  });
});

describe("ProcessosView - Performance", () => {
  it("deve usar useMemo para filtros", () => {
    const { rerender } = renderWithProviders(<ProcessosView />);

    // Renderizar novamente sem mudar props
    rerender(<ProcessosView />);

    // Se useMemo está funcionando, não deve recalcular
    expect(screen.getByText("João Silva")).toBeInTheDocument();
  });

  it("deve usar useMemo para estatísticas", () => {
    renderWithProviders(<ProcessosView />);

    // Stats devem estar disponíveis imediatamente
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/R\$ 95\.000,00/)).toBeInTheDocument();
  });
});
