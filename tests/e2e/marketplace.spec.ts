import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByRole("button", { name: "Ver Emerald Ape #042" })).toBeVisible();
});

test("mantém busca, filtro e ordenação na URL", async ({ page }) => {
  await page.getByPlaceholder("Buscar").fill("Emerald");
  await expect(page).toHaveURL(/search=Emerald/);
  await page.getByLabel("Preço mínimo").fill("1");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page).toHaveURL(/min=1/);
  await page.getByLabel("Ordenar NFTs").selectOption("price-desc");
  await expect(page).toHaveURL(/sort=price-desc/);
  await page.reload();
  await expect(page.getByPlaceholder("Buscar")).toHaveValue("Emerald");
});

test("reverte favorito quando a API simula falha", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("kurio-session", JSON.stringify({ name: "colecionador", email: "colecionador@kurio.io" })));
  await page.reload();
  await page.getByRole("button", { name: "Adicionar aos favoritos" }).nth(2).click();
  await expect(page.getByRole("status")).toContainText("Não foi possível salvar o favorito");
});

test("isola favoritos entre contas autenticadas", async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.localStorage.getItem("kurio-session")) window.localStorage.setItem("kurio-session", JSON.stringify({ name: "colecionador", email: "colecionador@kurio.io" }));
  });
  await page.evaluate(() => fetch("/api/scenario/reset", { method: "POST" }));
  const sessionRestored = page.waitForResponse((response) => response.url().includes("/api/session") && response.status() === 200);
  await page.reload();
  await sessionRestored;
  const favorite = page.getByRole("button", { name: "Adicionar aos favoritos" }).first();
  await favorite.click();
  await expect(favorite).toHaveText("♥");
  await page.evaluate(() => window.localStorage.setItem("kurio-session", JSON.stringify({ name: "Conta existente", email: "existente@kurio.io" })));
  await page.reload();
  await expect(page.getByRole("button", { name: "Adicionar aos favoritos" }).first()).toHaveText("♡");
});

test("adiciona NFT ao carrinho e preserva após recarregar", async ({ page }) => {
  await page.getByRole("button", { name: "Ver Emerald Ape #042" }).click();
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(page.getByRole("dialog", { name: "Carrinho de NFTs" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("dialog", { name: "Carrinho de NFTs" })).toBeVisible();
  await expect(page.getByText("Emerald Ape #042")).toBeVisible();
});

test("faz login com validação e preserva sessão", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("colecionador@kurio.io");
  await page.getByLabel("Senha").fill("123456");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Tudo certo! Redirecionando para sua conta...")).toBeVisible();
  await page.goto("/perfil");
  await expect(page.getByRole("heading", { name: "colecionador", exact: true })).toBeVisible();
});
