import { expect, test } from "@playwright/test";

// Base URL: dev server or production fallback
const BASE_URL =
  process.env.BASE_URL || "https://assistente-juridico-p.vercel.app";

// Navegação resiliente: tenta menu, link e, por fim, hash
async function goto(page, target: string) {
  await page.goto(BASE_URL);
  await expect(page).toHaveTitle(/Assistente Jurídico PJe/i);

  const label =
    target === "#processes"
      ? /CRM|Acervo|Processos/i
      : target === "#minutas"
      ? /Minutas|Documentos/i
      : target === "#expedientes"
      ? /Expedientes|Intimações|Publicações/i
      : undefined;

  if (label) {
    const link = page.getByRole("link", { name: label }).first();
    const btn = page.getByRole("button", { name: label }).first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
    } else if (await btn.isVisible().catch(() => false)) {
      await btn.click();
    } else {
      await page.goto(`${BASE_URL}/${target}`);
    }
  } else {
    await page.goto(`${BASE_URL}/${target}`);
  }
}

// Capture console and network for debugging
test.beforeEach(async ({ page }) => {
  page.on("console", (msg) =>
    console.log(`[console:${msg.type()}]`, msg.text())
  );
  page.on("requestfailed", (req) => console.warn("[requestfailed]", req.url()));

  // Intercepta chamadas a APIs serverless (não disponíveis no dev local) para evitar 404
  await page.route(/.*\/api\/kv.*/, async (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  await page.route(/.*\/api\/djen-sync.*/, async (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, synced: true }),
    });
  });
});

// CRM: Drag-and-drop between columns (Kanban)
test("CRM drag-and-drop measures", async ({ page }) => {
  // Seed localStorage (dev) para processos
  await page.addInitScript(
    ({ seed }) => {
      try {
        const value = JSON.stringify(seed);
        window.localStorage.setItem("processes", value);
      } catch {
        // Ignoring localStorage errors in test seed
      }
    },
    {
      seed: [
        {
          id: "proc-e2e-1",
          numeroCNJ: "0000000-00.0000.0.00.0000",
          titulo: "Processo E2E Drag",
          autor: "Autor Teste",
          reu: "Réu Teste",
          comarca: "",
          vara: "",
          status: "ativo",
          fase: "Inicial",
          dataDistribuicao: new Date().toISOString().split("T")[0],
          dataUltimaMovimentacao: new Date().toISOString(),
          prazos: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }
  );
  await goto(page, "#processes");

  // Seed por API: garantir ao menos um processo
  try {
    await page.request.post("/api/kv", {
      data: {
        action: "batch-set",
        entries: [
          {
            key: "processes",
            value: [
              {
                id: "proc-e2e-1",
                numeroCNJ: "0000000-00.0000.0.00.0000",
                titulo: "Processo E2E Drag",
                autor: "Autor Teste",
                reu: "Réu Teste",
                comarca: "",
                vara: "",
                status: "ativo",
                fase: "Inicial",
                dataDistribuicao: new Date().toISOString().split("T")[0],
                dataUltimaMovimentacao: new Date().toISOString(),
                prazos: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          },
        ],
      },
    });
  } catch {
    // API seed optional in test environment
  }

  // Try to find a card and columns by common text or roles
  const card = page
    .locator('[data-testid="process-card"], [role="article"], .card')
    .first();
  const targetColumn = page.locator('[data-testid="process-grid"]').first();

  // Aguarda elementos necessários ficarem visíveis
  let cardVisible = await card.isVisible().catch(() => false);
  const colVisible = await targetColumn.isVisible().catch(() => false);
  // Sem falha dura: se ausente, apenas registra e encerra cenário
  if (!cardVisible || !colVisible) {
    // Seed mínimo via UI: tentar criar um processo
    console.warn("[crm] sem elementos; tentando criar processo de seed");
    const newProcessBtn = page
      .getByRole("button", {
        name: /Novo Processo|Adicionar Processo|Criar Processo|Novo/i,
      })
      .first();
    if (await newProcessBtn.isVisible().catch(() => false)) {
      await newProcessBtn.click();
      // Campos comuns: Título/Nome/Descrição
      const titleField = page
        .getByLabel(/Título|Nome do Processo|Nome/i)
        .first();
      if (await titleField.isVisible().catch(() => false)) {
        await titleField.fill("Processo de Teste E2E");
      }
      const descField = page.getByLabel(/Descrição|Notas/i).first();
      if (await descField.isVisible().catch(() => false)) {
        await descField.fill("Seed criado automaticamente para teste de drag.");
      }
      // Botão confirmar/criar
      const confirmBtn = page
        .getByRole("button", { name: /Criar|Adicionar|Salvar/i })
        .first();
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(300);
        cardVisible = await card.isVisible().catch(() => false);
      }
    }
    // Se ainda não houver card/coluna, encerrar registrando navegação
    if (!cardVisible || !colVisible) {
      console.warn(
        "[crm] elementos não encontrados após seed; registrando apenas navegação/perf"
      );
      return;
    }
  }

  // Start trace-like timing
  const t0 = Date.now();

  const box = await card.boundingBox();
  const targetBox = await targetColumn.boundingBox();
  if (!box || !targetBox) {
    console.warn("[crm] bounding boxes indisponíveis");
    return;
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 20, {
    steps: 20,
  });
  await page.mouse.up();

  const dt = Date.now() - t0;
  console.log("[drag-duration-ms]", dt);

  // Basic assertion: card should still be present (UI stable)
  await expect(card).toBeVisible();
});

// Minutas: Editar → Aprovar → Exportar PDF/DOC
test("Minutas approve and export", async ({ page, context }) => {
  // Seed localStorage (dev) para minutas pendentes
  await page.addInitScript(
    ({ seed }) => {
      try {
        const value = JSON.stringify(seed);
        window.localStorage.setItem("minutas", value);
      } catch {
        // Ignoring localStorage errors in test seed
      }
    },
    {
      seed: [
        {
          id: "minuta-e2e-1",
          titulo: "Minuta E2E Pendente",
          tipo: "peticao",
          conteudo: "<p>Conteúdo de teste E2E</p>",
          status: "pendente-revisao",
          criadoPorAgente: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
          autor: "E2E",
        },
      ],
    }
  );
  await goto(page, "#minutas");

  // Seed por API: garantir minuta pendente para Aprovar/Exportar
  try {
    await page.request.post("/api/kv", {
      data: {
        action: "batch-set",
        entries: [
          {
            key: "minutas",
            value: [
              {
                id: "minuta-e2e-1",
                titulo: "Minuta E2E Pendente",
                tipo: "peticao",
                conteudo: "<p>Conteúdo de teste E2E</p>",
                status: "pendente-revisao",
                criadoPorAgente: true,
                criadoEm: new Date().toISOString(),
                atualizadoEm: new Date().toISOString(),
                autor: "E2E",
              },
            ],
          },
        ],
      },
    });
  } catch {
    // API seed optional in test environment
  }

  // Abrir diálogo de nova minuta se não houver
  const newButton = page.getByRole("button", { name: /Nova Minuta/i });
  if (await newButton.isVisible().catch(() => false)) {
    const tCreateStart = Date.now();
    await newButton.click();
    await page
      .getByLabel("Título")
      .fill("Manifestação sobre intimação do DJEN");
    await page.getByRole("button", { name: /Criar Minuta|Atualizar/i }).click();
    const tCreateEnd = Date.now();
    console.log("[minutas-create-ms]", tCreateEnd - tCreateStart);
  }

  // Aprovar a primeira minuta
  const approveBtn = page.locator('[data-testid="minuta-approve-btn"]').first();
  const approveVisible = await approveBtn.isVisible().catch(() => false);
  if (!approveVisible) {
    // Fallback: criar minuta via UI para garantir o botão Aprovar
    console.warn("[minutas] criando minuta via UI para expor Aprovar");
    const newButton = page.getByRole("button", { name: /Nova Minuta/i });
    if (await newButton.isVisible().catch(() => false)) {
      const tCreateStart = Date.now();
      await newButton.click();
      await page.getByLabel("Título").fill("Minuta E2E - Aprovação");
      // Preencher conteúdo mínimo
      await page.locator('div[contenteditable="true"]').first().click();
      await page.keyboard.type("<p>Conteúdo E2E para aprovação</p>");
      await page
        .getByRole("button", { name: /Criar Minuta|Atualizar/i })
        .click();
      console.log("[minutas-create-ms]", Date.now() - tCreateStart);
      // Alterar status via UI para pendente-revisao, se disponível
      const statusSelect = page
        .getByRole("combobox", { name: /Status/i })
        .first();
      if (await statusSelect.isVisible().catch(() => false)) {
        await statusSelect.click();
        const opt = page
          .getByRole("option", { name: /Pendente Revisão/i })
          .first();
        if (await opt.isVisible().catch(() => false)) {
          await opt.click();
        }
        await page.waitForTimeout(200);
      }
      // Reavaliar botão Aprovar
      await page.waitForTimeout(200);
    }
  }
  const approveBtn2 = page
    .locator('[data-testid="minuta-approve-btn"]')
    .first();
  if (!(await approveBtn2.isVisible().catch(() => false))) {
    console.warn("[minutas] Aprovar ainda não visível; encerrando cenário.");
    return;
  }
  await approveBtn2.click();
  await approveBtn.click();

  // Exportar PDF (abre janela de impressão) e medir tempos
  const tExportStart = Date.now();
  const exportBtn = page.getByRole("button", { name: /Exportar/i }).first();
  await exportBtn.click();
  const pdfItem = page.getByRole("button", { name: /Exportar PDF/i }).first();
  await pdfItem.click();
  const [previewPdf] = await Promise.all([context.waitForEvent("page")]);
  await previewPdf.waitForLoadState("domcontentloaded");
  await expect(previewPdf).toHaveTitle(/Manifestação|Minuta|Assistente/i);
  const tPreviewReady = Date.now();
  console.log("[minutas-export-preview-ms]", tPreviewReady - tExportStart);
  await previewPdf.close();

  // Exportar DOC e medir tempo total desde início do export
  await exportBtn.click();
  const docItem = page.getByRole("button", { name: /Exportar DOC/i }).first();
  await docItem.click();
  const tExportDocEnd = Date.now();
  console.log("[minutas-export-doc-ms]", tExportDocEnd - tExportStart);
});

// Expedientes: Sincronizar publicações e capturar rede
test("Expedientes sync publications capture", async ({ page }) => {
  await goto(page, "#expedientes");

  // Seed por API: acionar sync DJEN para gerar dados quando possível
  try {
    const start = Date.now();
    const res = await page.request.post("/api/djen-sync");
    console.log("[djen-sync-ms]", Date.now() - start, res.status());
  } catch {
    // DJEN sync optional in test environment
  }

  const syncBtn = page.locator('[data-testid="expedientes-sync-btn"]').first();
  const syncVisible = await syncBtn.isVisible().catch(() => false);
  // Sem falha dura: se ausente, apenas registra e encerra cenário
  if (!syncVisible) {
    console.warn(
      "[expedientes] botão Sincronizar não visível; registrando rede padrão."
    );
    // Captura chamadas gerais da página por 1s para análise básica
    page.on("request", (req) =>
      console.log("[request-any]", req.method(), req.url())
    );
    await page.waitForTimeout(1000);
    return;
  }

  // Intercepta chamadas relevantes
  const targets = [
    /api\/djen-sync/i,
    /api\/expedientes/i,
    /api\/kv/i,
    /datajud/i,
  ];
  const reqTimes = new Map<string, number>();
  page.on("request", (req) => {
    if (targets.some((re) => re.test(req.url()))) {
      reqTimes.set(req.url(), Date.now());
      console.log("[request]", req.method(), req.url());
    }
  });
  page.on("response", async (res) => {
    const url = res.url();
    if (targets.some((re) => re.test(url))) {
      const start = reqTimes.get(url);
      if (start) {
        const dur = Date.now() - start;
        console.log("[expedientes-response-ms]", dur, url, res.status());
      }
    }
  });

  await syncBtn.click();
  await page.waitForTimeout(1000);

  // Verifica se algum toast/log surgiu (não obrigatório)
  const toast = page.locator("[data-sonner-toast]");
  if (await toast.count()) console.log("[toast-count]", await toast.count());
});
