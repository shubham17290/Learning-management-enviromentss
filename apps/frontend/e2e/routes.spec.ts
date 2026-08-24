import { test, expect } from "@playwright/test";

test.describe("public and protected route smoke tests", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("GATE CS & IT");
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
  });

  test("register page loads", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/\/register/);
  });

  test("dashboard route is protected", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login|\/dashboard/);
  });

  test("practice route is protected", async ({ page }) => {
    await page.goto("/practice");
    await expect(page).toHaveURL(/\/login|\/practice/);
  });
});
