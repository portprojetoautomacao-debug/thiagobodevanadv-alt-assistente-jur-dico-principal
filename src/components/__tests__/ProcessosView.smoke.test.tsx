import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProcessosView from "../ProcessosView";

// Smoke test: renders, toggles view mode, filters and sort controls present

describe("ProcessosView smoke", () => {
  it("renders and UI controls operate without crash", async () => {
    render(<ProcessosView />);

    // Header
    expect(await screen.findByText(/Arquivo de Processos/i)).toBeDefined();

    // Stats cards labels
    expect(await screen.findByText(/Total/i)).toBeDefined();
    expect(await screen.findByText(/Ativos/i)).toBeDefined();
    expect(await screen.findByText(/Arquivados/i)).toBeDefined();
    expect(await screen.findByText(/Valor Total/i)).toBeDefined();
    expect(await screen.findByText(/Prazos/i)).toBeDefined();

    // Controls
    expect(await screen.findByPlaceholderText(/Buscar processos/i)).toBeDefined();

    // Toggle buttons
    const gridBtn = await screen.findByRole("button", { name: /grid/i });
    const listBtn = await screen.findByRole("button", { name: /lista/i });
    fireEvent.click(listBtn);
    fireEvent.click(gridBtn);

    // Sort select exists
    expect(await screen.findByText(/Ordenar/i)).toBeDefined();
  });
});
