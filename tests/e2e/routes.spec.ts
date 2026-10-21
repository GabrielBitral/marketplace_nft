import { expect, test } from "@playwright/test";

const cartItem = { id: "042", name: "Emerald Ape #042", price: "1.19", edition: "1/50", color: "linear-gradient(135deg,#e9e7c6,#8cac86)", accessory: "⌁", available: 4, version: 1, quantity: 1 };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

test("abre detalhe diretamente e informa NFT inexistente", async ({ page }) => {
  await page.goto("/nft/042");
  await expect(page.getByRole("heading", { name: "Emerald Ape #042" })).toBeVisible();
  await page.goto("/nft/inexistente");
  await expect(page.getByRole("heading", { name: "NFT não encontrado" })).toBeVisible();
});

test("seleciona edição disponível, limita a quantidade e bloqueia edição esgotada", async ({ page }) => {
  await page.goto("/nft/042");
  await expect(page.getByRole("button", { name: "1/10, esgotada" })).toBeDisabled();
  await page.getByRole("button", { name: "ABERTA, 12 disponíveis" }).click();
  await page.getByRole("button", { name: "Aumentar quantidade" }).click();
  await expect(page.getByLabel("Quantidade selecionada")).toHaveText("2");
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(page.getByText("Edição: ABERTA")).toBeVisible();
});

test("preserva o carrinho e exige login para pagamento", async ({ page }) => {
  await page.addInitScript((item) => window.localStorage.setItem("kurio-cart", JSON.stringify([item])), cartItem);
  await page.goto("/carrinho");
  await expect(page.getByText("Emerald Ape #042")).toBeVisible();
  await page.getByRole("button", { name: "Conectar e finalizar" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("aplica cupom e altera a quantidade no carrinho", async ({ page }) => {
  await page.addInitScript((item) => window.localStorage.setItem("kurio-cart", JSON.stringify([item])), cartItem);
  await page.goto("/carrinho");
  await page.getByLabel("Código promocional").fill("KURIO10");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByRole("status")).toContainText("Cupom KURIO10 aplicado");
  await page.getByRole("button", { name: "Adicionar uma unidade de Emerald Ape #042" }).click();
  await expect(page.getByText("2", { exact: true })).toBeVisible();
});

test("mantém a finalização bloqueada enquanto a cotação lenta é atualizada", async ({ page }) => {
  await page.addInitScript((item) => {
    window.localStorage.setItem("kurio-cart", JSON.stringify([item]));
    window.sessionStorage.setItem("kurio-scenario", "slow-quote");
  }, cartItem);
  await page.goto("/carrinho");
  await expect(page.getByLabel("Atualizando valores do carrinho")).toBeVisible();
  await expect(page.getByRole("button", { name: "Conectar e finalizar" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Conectar e finalizar" })).toBeEnabled();
});

test("impede o pagamento quando a cotação é alterada", async ({ page }) => {
  await page.addInitScript((item) => {
    window.localStorage.setItem("kurio-cart", JSON.stringify([item]));
    window.localStorage.setItem("kurio-session", JSON.stringify({ name: "colecionador", email: "colecionador@kurio.io" }));
    window.sessionStorage.setItem("kurio-scenario", "quote-changed");
  }, cartItem);
  await page.goto("/pagamento");
  await expect(page.getByRole("alert")).toContainText("Não foi possível atualizar a cotação.");
});

test("exibe pedido pendente após envio idempotente", async ({ page }) => {
  await page.addInitScript((item) => {
    window.localStorage.setItem("kurio-cart", JSON.stringify([item]));
    window.localStorage.setItem("kurio-session", JSON.stringify({ name: "colecionador", email: "colecionador@kurio.io" }));
  }, cartItem);
  await page.goto("/pagamento");
  await page.getByRole("button", { name: "Confirmar e pagar" }).click();
  await expect(page).toHaveURL(/\/pedido\/KUR-/);
  await expect(page.getByRole("heading", { name: "Confirmando seu pedido" })).toBeVisible();
});

test("recupera o recibo pela API quando a memória local foi perdida", async ({ page }) => {
  await page.addInitScript((item) => {
    window.localStorage.setItem("kurio-cart", JSON.stringify([item]));
    window.localStorage.setItem("kurio-session", JSON.stringify({ name: "colecionador", email: "colecionador@kurio.io" }));
  }, cartItem);
  await page.goto("/pagamento");
  await page.getByRole("button", { name: "Confirmar e pagar" }).click();
  await expect(page).toHaveURL(/\/pedido\/KUR-/);
  await page.evaluate(() => window.localStorage.removeItem("kurio-orders:colecionador@kurio.io"));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Confirmando seu pedido" })).toBeVisible();
});

test("mostra uma recusa de pagamento sem emitir confirmação em tempo real", async ({ page }) => {
  await page.addInitScript((item) => {
    window.localStorage.setItem("kurio-cart", JSON.stringify([item]));
    window.localStorage.setItem("kurio-session", JSON.stringify({ name: "colecionador", email: "colecionador@kurio.io" }));
    window.localStorage.setItem("kurio-scenario", "payment-refused");
  }, cartItem);
  await page.goto("/pagamento");
  await page.getByRole("button", { name: "Confirmar e pagar" }).click();
  await expect(page).toHaveURL(/\/pedido\/KUR-/);
  await expect(page.getByRole("heading", { name: "Pagamento recusado" })).toBeVisible();
});

test("recupera um pedido criado antes de um timeout com a mesma tentativa", async ({ page }) => {
  await page.addInitScript((item) => {
    window.localStorage.setItem("kurio-cart", JSON.stringify([item]));
    window.localStorage.setItem("kurio-session", JSON.stringify({ name: "colecionador", email: "colecionador@kurio.io" }));
    window.localStorage.setItem("kurio-scenario", "timeout-after-order");
  }, cartItem);
  await page.goto("/pagamento");
  await page.getByRole("button", { name: "Confirmar e pagar" }).click();
  await expect(page.locator("p[role='alert']")).toContainText("pedido não pôde ser criado");
  await page.evaluate(() => window.localStorage.removeItem("kurio-scenario"));
  await page.getByRole("button", { name: "Confirmar e pagar" }).click();
  await expect(page).toHaveURL(/\/pedido\/KUR-/);
  await expect(page.getByRole("heading", { name: "Confirmando seu pedido" })).toBeVisible();
});

test("altera a senha pela área de perfil", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("kurio-session", JSON.stringify({ name: "colecionador", email: "colecionador@kurio.io" })));
  await page.goto("/perfil");
  await page.getByLabel("Senha atual").fill("123456");
  await page.getByLabel("Nova senha").fill("123456");
  await page.getByRole("button", { name: "Alterar senha" }).click();
  await expect(page.getByRole("status")).toContainText("Senha atualizada com sucesso");
});

test("encerra uma sessão expirada durante a restauração", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("kurio-session", JSON.stringify({ name: "expirada", email: "expirada@kurio.io" })));
  await page.goto("/perfil");
  await expect(page).toHaveURL(/\/login$/);
});
