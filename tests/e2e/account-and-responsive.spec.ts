import { expect, test } from "@playwright/test";

const session = { name: "colecionador", email: "colecionador@kurio.io" };
const cartItem = { id: "042", name: "Emerald Ape #042", price: "1.19", edition: "1/50", color: "linear-gradient(135deg,#e9e7c6,#8cac86)", accessory: "⌁", available: 4, version: 1, quantity: 1 };

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test("informa conflito ao cadastrar um e-mail existente", async ({ page }) => {
  await page.goto("/cadastro");
  await page.getByLabel("Nome completo").fill("Conta existente");
  await page.getByLabel("E-mail").fill("existente@kurio.io");
  await page.getByLabel("Senha").fill("123456");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByText("Este e-mail já possui uma conta.")).toBeVisible();
});

test("retoma o checkout depois do login e preserva o carrinho visitante", async ({ page }) => {
  await page.evaluate((item) => window.localStorage.setItem("kurio-cart", JSON.stringify([item])), cartItem);
  await page.goto("/carrinho");
  await page.getByRole("button", { name: "Conectar e finalizar" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("E-mail").fill("retorno@kurio.io");
  await page.getByLabel("Senha").fill("123456");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/pagamento$/);
  await expect(page.getByText("Emerald Ape #042")).toBeVisible();
});

test("valida e preserva uma carteira cadastrada", async ({ page }) => {
  await page.addInitScript((savedSession) => window.localStorage.setItem("kurio-session", JSON.stringify(savedSession)), session);
  await page.goto("/carteiras");
  await page.getByRole("button", { name: "Adicionar carteira" }).click();
  await page.getByLabel("Nome da carteira").fill("Carteira teste");
  await page.getByRole("button", { name: "Salvar carteira" }).click();
  await expect(page.getByText("Informe nome e endereço público válidos.")).toBeVisible();
  await page.getByLabel("Endereço público").fill("0x1234ABCD");
  await page.getByRole("button", { name: "Salvar carteira" }).click();
  await expect(page.getByRole("dialog", { name: "Nova carteira" })).toBeHidden();
  await page.reload();
  await expect(page.getByText("Carteira teste")).toBeVisible();
});

test("encerra a sessão e remove o acesso à área privada", async ({ page }) => {
  await page.addInitScript((savedSession) => window.localStorage.setItem("kurio-session", JSON.stringify(savedSession)), session);
  await page.goto("/perfil");
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("mantém as telas principais sem overflow nos tamanhos exigidos", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Os tamanhos são auditados uma vez no Chromium desktop.");
  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Ver Emerald Ape #042" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.goto("/nft/042");
    await expect(page.getByRole("heading", { name: "Emerald Ape #042" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
