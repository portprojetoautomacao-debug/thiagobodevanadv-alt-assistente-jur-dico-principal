import { expect, test } from "@playwright/test";

// Base URL: dev server or production fallback
const BASE_URL =
  process.env.BASE_URL || "https://assistente-juridico-p.vercel.app";

// Helper to navigate using hash-based routing
async function goto(page, hash: string) {
  await page.goto(`${BASE_URL}/${hash}`);
  await expect(page).toHaveTitle(/Assistente Jurídico PJe/i);
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
  const targetColumn = page
    .locator(
      '[data-testid="kanban-column"][data-status="em-andamento"], [aria-label="Em andamento"], text=Em andamento'
    )
    .first();

  // If UI not loaded, skip gracefully
  if (!(await card.isVisible().catch(() => false)))
    test.skip(true, "CRM card not visible");
  if (!(await targetColumn.isVisible().catch(() => false)))
    test.skip(true, "Target column not visible");

  // Start trace-like timing
  const t0 = Date.now();

  const box = await card.boundingBox();
  const targetBox = await targetColumn.boundingBox();
  if (!box || !targetBox) test.skip(true, "Bounding boxes not available");

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
  const approveBtn = page.getByRole("button", { name: /Aprovar/i }).first();
  if (!(await approveBtn.isVisible().catch(() => false)))
    test.skip(true, "Aprovar não disponível");
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

  const syncBtn = page.getByRole("button", {
    name: /Sincronizar publicações|Sincronizar/i,
  });
  if (!(await syncBtn.isVisible().catch(() => false)))
    test.skip(true, "Botão de sincronização indisponível");

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
