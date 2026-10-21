import { expect, test } from "@playwright/test";

const cartItem = { id: "042", name: "Emerald Ape #042", price: "1.19", edition: "1/50", color: "linear-gradient(135deg,#e9e7c6,#8cac86)", accessory: "⌁", available: 4, version: 1, quantity: 1 };
const session = { name: "colecionador", email: "colecionador@kurio.io" };

test("fecha o carrinho com Escape e anuncia cupom inválido", async ({ page }) => {
  await page.addInitScript((item) => window.localStorage.setItem("kurio-cart", JSON.stringify([item])), cartItem);
  await page.goto("/carrinho");
  const dialog = page.getByRole("dialog", { name: "Carrinho de NFTs" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Fechar carrinho" })).toBeFocused();
  await page.getByLabel("Código promocional").fill("invalido");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByText("Código inválido ou expirado.")).toHaveAttribute("role", "alert");
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/$/);
});

test("mantém o foco no pagamento e permite voltar com Escape", async ({ page }) => {
  await page.addInitScript(({ item, savedSession }) => {
    window.localStorage.setItem("kurio-cart", JSON.stringify([item]));
    window.localStorage.setItem("kurio-session", JSON.stringify(savedSession));
  }, { item: cartItem, savedSession: session });
  await page.goto("/pagamento");
  await expect(page.getByRole("dialog", { name: "Pagamento" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Voltar ao carrinho" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/carrinho$/);
});

test("abre e fecha o formulário de carteira pelo teclado", async ({ page }) => {
  await page.addInitScript((savedSession) => window.localStorage.setItem("kurio-session", JSON.stringify(savedSession)), session);
  await page.goto("/carteiras");
  await page.getByRole("button", { name: "Adicionar carteira" }).click();
  const dialog = page.getByRole("dialog", { name: "Nova carteira" });
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel("Nome da carteira")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("inclui o estado visual raro no nome acessível do NFT", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Ver Ivory Baron #088 raro" })).toBeVisible();
});
