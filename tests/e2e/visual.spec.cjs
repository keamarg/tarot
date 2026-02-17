const { test, expect } = require("@playwright/test");

test.describe("visual baselines", () => {
  test("home screen", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveScreenshot("home.png", { fullPage: true, animations: "disabled" });
  });

  test("settings screen", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveScreenshot("settings.png", { fullPage: true, animations: "disabled" });
  });

  test("reading setup", async ({ page }) => {
    await page.goto("/reading");
    await expect(page).toHaveScreenshot("reading-setup.png", { fullPage: true, animations: "disabled" });
  });

  test("training setup", async ({ page }) => {
    await page.goto("/training");
    await expect(page).toHaveScreenshot("training-setup.png", { fullPage: true, animations: "disabled" });
  });
});
