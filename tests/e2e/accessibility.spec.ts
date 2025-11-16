import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Example E2E Accessibility Test
 * Tests WCAG 2.1 AA compliance using Axe
 */

test.describe("Accessibility", () => {
  test("should not have any automatically detectable accessibility issues on home page", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/");

    // Test Tab navigation
    await page.keyboard.press("Tab");

    const firstFocusedElement = await page.evaluate(() => document.activeElement?.tagName);

    expect(["INPUT", "BUTTON", "A"]).toContain(firstFocusedElement);
  });
});
