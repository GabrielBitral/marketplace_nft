import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

test("regressão visual das telas essenciais", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Ver Emerald Ape #042" })).toBeVisible();
  await expect(page).toHaveScreenshot("marketplace.png", { fullPage: true, animations: "disabled", maxDiffPixelRatio: .002 });
  await page.goto("/nft/042");
  await expect(page).toHaveScreenshot("detalhe-nft.png", { fullPage: true, animations: "disabled", maxDiffPixelRatio: .002 });
  await page.goto("/carrinho");
  await expect(page).toHaveScreenshot("carrinho-vazio.png", { fullPage: true, animations: "disabled", maxDiffPixelRatio: .002 });
  await page.addInitScript(() => {
    window.localStorage.setItem("kurio-cart", JSON.stringify([{ id: "042", name: "Emerald Ape #042", price: "1.19", edition: "1/50", color: "linear-gradient(135deg,#e9e7c6,#8cac86)", accessory: "⌁", available: 4, version: 1, quantity: 1 }]));
    window.localStorage.setItem("kurio-session", JSON.stringify({ name: "colecionador", email: "colecionador@kurio.io" }));
  });
  await page.goto("/pagamento");
  await expect(page.getByRole("dialog", { name: "Pagamento" })).toBeVisible();
  await expect(page).toHaveScreenshot("pagamento.png", { fullPage: true, animations: "disabled", maxDiffPixelRatio: .002 });
});
