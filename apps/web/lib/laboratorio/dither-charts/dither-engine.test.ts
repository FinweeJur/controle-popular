import { describe, it, expect } from "vitest";
import { smoothstep, hash, getAxisMax, formatCurrency } from "./dither-engine";

describe("dither-engine", () => {
  describe("smoothstep", () => {
    it("returns 0 below edge0", () => {
      expect(smoothstep(0, 1, -0.5)).toBe(0);
    });

    it("returns 1 above edge1", () => {
      expect(smoothstep(0, 1, 1.5)).toBe(1);
    });

    it("interpolates between edge0 and edge1", () => {
      const result = smoothstep(0, 1, 0.5);
      expect(result).toBeGreaterThan(0.3);
      expect(result).toBeLessThan(0.7);
    });
  });

  describe("hash", () => {
    it("returns a number between 0 and 1", () => {
      expect(hash(4, 2)).toBeGreaterThanOrEqual(0);
      expect(hash(4, 2)).toBeLessThanOrEqual(1);
    });

    it("returns consistent values for same input", () => {
      expect(hash(42, 7)).toBe(hash(42, 7));
    });
  });

  describe("getAxisMax", () => {
    it("rounds up to nice number", () => {
      const result = getAxisMax(850);
      expect(result).toBeGreaterThanOrEqual(850);
    });

    it("returns at least the input value", () => {
      expect(getAxisMax(1000)).toBeGreaterThanOrEqual(1000);
    });

    it("handles small numbers", () => {
      const result = getAxisMax(3);
      expect(result).toBeGreaterThanOrEqual(3);
    });
  });

  describe("formatCurrency", () => {
    it("formats small values with R$", () => {
      const result = formatCurrency(1500);
      expect(result).toContain("R$");
    });

    it("formats millions with mi suffix", () => {
      const result = formatCurrency(2500000);
      expect(result).toContain("mi");
    });
  });
});
