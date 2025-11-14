import { test, expect } from "@playwright/test";

/**
 * Example E2E Test - Authentication Flow
 * Tests the complete user authentication journey
 */

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto("/");
  });

  test("should display login page", async ({ page }) => {
    await expect(page).toHaveTitle(/10xCards/);

    // Check if login form is visible
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();

    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toBeVisible();

    const submitButton = page.getByRole("button", { name: /log in/i });
    await expect(submitButton).toBeVisible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    const submitButton = page.getByRole("button", { name: /log in/i });
    await submitButton.click();

    // Check for validation error messages
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test("should navigate to registration page", async ({ page }) => {
    const registerLink = page.getByRole("link", { name: /sign up/i });
    await registerLink.click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText(/create.*account/i)).toBeVisible();
  });

  test.skip("should successfully login with valid credentials", async ({ page }) => {
    // This test requires actual Supabase setup
    // Mark as skip for now - implement when backend is ready

    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");

    await page.getByRole("button", { name: /log in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("Registration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("should display registration form", async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign up/i })).toBeVisible();
  });

  test("should show validation for invalid email", async ({ page }) => {
    await page.getByLabel(/email/i).fill("invalid-email");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign up/i }).click();

    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });
});
