import { expect, test } from "@playwright/test";

const session = { name: "colecionador", email: "colecionador@kurio.io" };
const cartItem = { id: "042", name: "Emerald Ape #042", price: "1.19", edition: "1/50", color: "linear-gradient(135deg,#e9e7c6,#8cac86)", accessory: "⌁", available: 4, version: 1, quantity: 1 };

test("mantém paginação no histórico e recupera o catálogo após indisponibilidade", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Ver Emerald Ape #042" })).toBeVisible();
  await page.getByRole("button", { name: "Próxima" }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText("Página 2")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Página 1")).toBeVisible();
  await page.evaluate(() => window.localStorage.setItem("kurio-scenario", "network-unavailable"));
  await page.reload();
  await expect(page.getByText("Não foi possível carregar o catálogo.")).toBeVisible();
  await page.evaluate(() => window.localStorage.removeItem("kurio-scenario"));
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("button", { name: "Ver Emerald Ape #042" })).toBeVisible();
});

test("remove cupom e item do carrinho", async ({ page }) => {
  await page.addInitScript((item) => window.localStorage.setItem("kurio-cart", JSON.stringify([item])), cartItem);
  await page.goto("/carrinho");
  await page.getByLabel("Código promocional").fill("KURIO10");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByRole("button", { name: "Remover cupom" })).toBeVisible();
  await page.getByRole("button", { name: "Remover cupom" }).click();
  await expect(page.getByRole("button", { name: "Remover cupom" })).toBeHidden();
  await page.getByRole("button", { name: "Remover Emerald Ape #042 do carrinho" }).click();
  await expect(page.getByText("Seu carrinho está vazio.")).toBeVisible();
});

test("confirma uma compra única por Socket.IO e remove apenas o item comprado", async ({ page }) => {
  await page.addInitScript(({ item, savedSession }) => {
    if (!window.localStorage.getItem("kurio-cart:colecionador@kurio.io")) window.localStorage.setItem("kurio-cart:colecionador@kurio.io", JSON.stringify([item]));
    if (!window.localStorage.getItem("kurio-session")) window.localStorage.setItem("kurio-session", JSON.stringify(savedSession));
  }, { item: cartItem, savedSession: session });
  await page.goto("/pagamento");
  const confirm = page.getByRole("button", { name: "Confirmar e pagar" });
  await expect(confirm).toBeEnabled();
  await confirm.evaluate((button) => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
  await expect(page).toHaveURL(/\/pedido\/KUR-/);
  await expect(page.getByRole("heading", { name: "Pedido confirmado!" })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText("0x7D2F4C8A91")).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem("kurio-cart:colecionador@kurio.io") ?? "[]"))).toEqual([]);
  await page.goto("/carrinho");
  await expect(page.getByText("Seu carrinho está vazio.")).toBeVisible();
});

test("revalida o checkout com atualização Socket.IO e ignora o evento antigo", async ({ page }) => {
  await page.addInitScript(({ item, savedSession }) => {
    if (!window.localStorage.getItem("kurio-cart:colecionador@kurio.io")) window.localStorage.setItem("kurio-cart:colecionador@kurio.io", JSON.stringify([item]));
    if (!window.localStorage.getItem("kurio-session")) window.localStorage.setItem("kurio-session", JSON.stringify(savedSession));
    window.sessionStorage.setItem("kurio-scenario", "stale-events");
  }, { item: cartItem, savedSession: session });
  await page.goto("/pagamento");
  await expect(page.getByRole("status")).toContainText("A cotação foi atualizada", { timeout: 5_000 });
  await expect(page.getByRole("button", { name: "Confirmar e pagar" })).toBeDisabled();
  await page.getByRole("button", { name: "Usar valores atualizados" }).click();
  await expect(page.getByText("1.326 ETH")).toBeVisible();
  await expect(page.getByText("1.27 ETH")).toHaveCount(0);
});

test("recupera o pedido pendente após uma desconexão", async ({ page }) => {
  await page.addInitScript(({ item, savedSession }) => {
    if (!window.localStorage.getItem("kurio-cart:colecionador@kurio.io")) window.localStorage.setItem("kurio-cart:colecionador@kurio.io", JSON.stringify([item]));
    if (!window.localStorage.getItem("kurio-session")) window.localStorage.setItem("kurio-session", JSON.stringify(savedSession));
    window.localStorage.setItem("kurio-scenario", "connection-interrupted");
  }, { item: cartItem, savedSession: session });
  await page.goto("/pagamento");
  await page.getByRole("button", { name: "Confirmar e pagar" }).click();
  await expect(page.getByRole("heading", { name: "Pedido confirmado!" })).toBeVisible({ timeout: 8_000 });
});

test("persiste perfil, avatar e edição de carteira após recarregar", async ({ page }) => {
  await page.addInitScript((savedSession) => {
    if (!window.localStorage.getItem("kurio-session")) window.localStorage.setItem("kurio-session", JSON.stringify(savedSession));
  }, session);
  await page.goto("/perfil");
  await page.getByLabel("Nome público").fill("Colecionadora Kurio");
  await page.getByLabel("URL do avatar").fill("https://example.com/avatar.png");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("status")).toContainText("Perfil atualizado com sucesso");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Colecionadora Kurio", exact: true })).toBeVisible();
  await expect(page.locator("img")).toHaveAttribute("src", "https://example.com/avatar.png");
  await page.goto("/carteiras");
  await page.getByRole("button", { name: "Editar MetaMask" }).click();
  await page.getByLabel("Nome da carteira").fill("Carteira editada");
  await page.getByLabel("Rede").selectOption("Polygon");
  await page.getByRole("button", { name: "Salvar carteira" }).click();
  await page.reload();
  await expect(page.getByText("Carteira editada")).toBeVisible();
  await expect(page.getByText("Polygon")).toBeVisible();
});
