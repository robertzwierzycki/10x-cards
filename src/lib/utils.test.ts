/**
 * Unit tests for utility functions
 *
 * Tests cover:
 * - cn() function - className merging with Tailwind CSS
 * - Conditional class names
 * - Array class names
 * - Tailwind class conflicts resolution
 */

import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  describe("Basic functionality", () => {
    it("should merge single class name", () => {
      const result = cn("text-red-500");
      expect(result).toBe("text-red-500");
    });

    it("should merge multiple class names", () => {
      const result = cn("text-red-500", "bg-blue-500");
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("should handle empty inputs", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("should handle undefined and null values", () => {
      const result = cn("text-red-500", undefined, null, "bg-blue-500");
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("should handle false and empty string values", () => {
      const result = cn("text-red-500", false, "", "bg-blue-500");
      expect(result).toBe("text-red-500 bg-blue-500");
    });
  });

  describe("Conditional class names", () => {
    it("should handle conditional class with truthy condition", () => {
      const isActive = true;
      const result = cn("base-class", isActive && "active-class");
      expect(result).toBe("base-class active-class");
    });

    it("should handle conditional class with falsy condition", () => {
      const isActive = false;
      const result = cn("base-class", isActive && "active-class");
      expect(result).toBe("base-class");
    });

    it("should handle multiple conditional classes", () => {
      const isActive = true;
      const isDisabled = false;
      const result = cn("base-class", isActive && "active-class", isDisabled && "disabled-class");
      expect(result).toBe("base-class active-class");
    });

    it("should handle ternary expressions", () => {
      const variant = "primary";
      const result = cn("btn", variant === "primary" ? "btn-primary" : "btn-secondary");
      expect(result).toBe("btn btn-primary");
    });
  });

  describe("Array class names", () => {
    it("should handle array of class names", () => {
      const result = cn(["text-red-500", "bg-blue-500"]);
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("should handle nested arrays", () => {
      const result = cn(["text-red-500", ["bg-blue-500", "p-4"]]);
      expect(result).toBe("text-red-500 bg-blue-500 p-4");
    });

    it("should handle arrays with conditional values", () => {
      const isActive = true;
      const result = cn(["text-red-500", isActive && "font-bold"]);
      expect(result).toBe("text-red-500 font-bold");
    });
  });

  describe("Object class names", () => {
    it("should handle object with boolean values", () => {
      const result = cn({
        "text-red-500": true,
        "bg-blue-500": false,
        "p-4": true,
      });
      expect(result).toBe("text-red-500 p-4");
    });

    it("should handle object mixed with strings", () => {
      const result = cn("base-class", {
        "text-red-500": true,
        "bg-blue-500": false,
      });
      expect(result).toBe("base-class text-red-500");
    });
  });

  describe("Tailwind CSS class merging", () => {
    it("should resolve conflicting Tailwind classes (last wins)", () => {
      const result = cn("text-red-500", "text-blue-500");
      expect(result).toBe("text-blue-500");
    });

    it("should resolve conflicting padding classes", () => {
      const result = cn("p-4", "p-6");
      expect(result).toBe("p-6");
    });

    it("should keep non-conflicting classes", () => {
      // text-red-500 (color) and text-lg (size) don't conflict
      const result = cn("text-red-500", "bg-blue-500", "text-lg");
      expect(result).toBe("text-red-500 bg-blue-500 text-lg");
    });

    it("should handle responsive variants", () => {
      const result = cn("text-sm", "md:text-lg", "lg:text-xl");
      expect(result).toBe("text-sm md:text-lg lg:text-xl");
    });

    it("should resolve conflicts in responsive variants", () => {
      const result = cn("md:text-sm", "md:text-lg");
      expect(result).toBe("md:text-lg");
    });

    it("should handle state variants", () => {
      const result = cn("hover:bg-blue-500", "focus:bg-green-500");
      expect(result).toBe("hover:bg-blue-500 focus:bg-green-500");
    });

    it("should resolve conflicts in state variants", () => {
      const result = cn("hover:text-red-500", "hover:text-blue-500");
      expect(result).toBe("hover:text-blue-500");
    });
  });

  describe("Real-world component scenarios", () => {
    it("should handle button variant classes", () => {
      const variant = "primary";
      const size = "lg";
      const result = cn(
        "btn",
        variant === "primary" && "bg-blue-500 text-white",
        variant === "secondary" && "bg-gray-500 text-white",
        size === "sm" && "px-2 py-1",
        size === "lg" && "px-6 py-3"
      );
      expect(result).toBe("btn bg-blue-500 text-white px-6 py-3");
    });

    it("should handle card component classes", () => {
      const isHoverable = true;
      const isSelected = false;
      const result = cn(
        "rounded-lg border shadow-sm",
        isHoverable && "hover:shadow-md transition-shadow",
        isSelected && "border-blue-500 bg-blue-50"
      );
      expect(result).toBe("rounded-lg border shadow-sm hover:shadow-md transition-shadow");
    });

    it("should handle input field states", () => {
      const hasError = true;
      const isDisabled = false;
      const result = cn(
        "border rounded px-3 py-2",
        hasError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500",
        isDisabled && "bg-gray-100 cursor-not-allowed"
      );
      expect(result).toBe("border rounded px-3 py-2 border-red-500 focus:ring-red-500");
    });

    it("should override base classes with props", () => {
      const baseClasses = "text-sm text-gray-700";
      const propClasses = "text-lg text-blue-500";
      const result = cn(baseClasses, propClasses);
      expect(result).toBe("text-lg text-blue-500");
    });

    it("should handle complex shadcn/ui pattern", () => {
      const result = cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium",
        "ring-offset-background transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50"
      );
      expect(result).toContain("inline-flex");
      expect(result).toContain("items-center");
      expect(result).toContain("justify-center");
      expect(result).toContain("rounded-md");
    });
  });

  describe("Edge cases", () => {
    it("should handle whitespace in class names", () => {
      const result = cn("  text-red-500  ", "  bg-blue-500  ");
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("should handle duplicate class names", () => {
      const result = cn("text-red-500", "bg-blue-500", "text-red-500");
      expect(result).toBe("bg-blue-500 text-red-500");
    });

    it("should handle very long class lists", () => {
      const classes = Array(20)
        .fill("class")
        .map((c, i) => `${c}-${i}`);
      const result = cn(...classes);
      expect(result).toContain("class-0");
      expect(result).toContain("class-19");
    });
  });
});
