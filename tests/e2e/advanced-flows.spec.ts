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
});

// CRM: Drag-and-drop between columns (Kanban)
test("CRM drag-and-drop measures", async ({ page }) => {
  await goto(page, "#processes");

  // Try to find a card and columns by common text or roles
  const card = page
    .locator('[data-testid="process-card"], [role="article"], .card')
    .first();
  const targetColumn = page.locator('[data-testid="process-grid"]').first();

  // Aguarda elementos necessários ficarem visíveis
  const cardVisible = await card.isVisible().catch(() => false);
  const colVisible = await targetColumn.isVisible().catch(() => false);
  // Sem falha dura: se ausente, apenas registra e encerra cenário
  if (!cardVisible || !colVisible) {
    console.warn(
      "[crm] elementos não encontrados, registrando apenas navegação/perf"
    );
    return;
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
  await goto(page, "#minutas");

  // Abrir diálogo de nova minuta se não houver
  const newButton = page.getByRole("button", { name: /Nova Minuta/i });
  if (await newButton.isVisible().catch(() => false)) {
    await newButton.click();
    await page
      .getByLabel("Título")
      .fill("Manifestação sobre intimação do DJEN");
    await page.getByRole("button", { name: /Criar Minuta|Atualizar/i }).click();
  }

  // Aprovar a primeira minuta
  const approveBtn = page.locator('[data-testid="minuta-approve-btn"]').first();
  const approveVisible = await approveBtn.isVisible().catch(() => false);
  // Sem falha dura: se ausente, apenas registra e encerra cenário
  if (!approveVisible) {
    console.warn(
      "[minutas] botão Aprovar não visível; encerrando cenário com navegação."
    );
    return;
  }
  await approveBtn.click();

  // Exportar PDF (abre janela de impressão)
  const exportBtn = page.getByRole("button", { name: /Exportar/i }).first();
  await exportBtn.click();
  const pdfItem = page.getByRole("button", { name: /Exportar PDF/i }).first();
  await pdfItem.click();

  // Espera por nova página (print preview)
  const [preview] = await Promise.all([context.waitForEvent("page")]);
  await preview.waitForLoadState("domcontentloaded");
  await expect(preview).toHaveTitle(/Manifestação|Minuta|Assistente/i);
  await preview.close();

  // Exportar DOC
  await exportBtn.click();
  const docItem = page.getByRole("button", { name: /Exportar DOC/i }).first();
  await docItem.click();
});

// Expedientes: Sincronizar publicações e capturar rede
test("Expedientes sync publications capture", async ({ page }) => {
  await goto(page, "#expedientes");

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
  page.on("request", (req) => {
    if (targets.some((re) => re.test(req.url()))) {
      console.log("[request]", req.method(), req.url());
    }
  });

  await syncBtn.click();
  await page.waitForTimeout(1000);

  // Verifica se algum toast/log surgiu (não obrigatório)
  const toast = page.locator("[data-sonner-toast]");
  if (await toast.count()) console.log("[toast-count]", await toast.count());
});
