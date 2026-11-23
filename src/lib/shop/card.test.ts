import { describe, expect, it } from "vitest";
import { cvcValid, detectBrand, expiryValid, formatCardNumber, formatExpiry, luhnValid } from "./card";

describe("test checkout card checks", () => {
  it("accepts the Stripe test card and rejects a typo", () => {
    expect(luhnValid("4242 4242 4242 4242")).toBe(true);
    expect(luhnValid("4242 4242 4242 4241")).toBe(false);
  });
  it("detects brands, mada first", () => {
    expect(detectBrand("4242")).toBe("visa");
    expect(detectBrand("5555 5555")).toBe("mastercard");
    expect(detectBrand("588845 1234")).toBe("mada");
    expect(detectBrand("3782")).toBe("amex");
  });
  it("formats as the user types", () => {
    expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242");
    expect(formatExpiry("1229")).toBe("12/29");
  });
  it("checks expiry and cvc", () => {
    const now = new Date(2026, 10, 23);
    expect(expiryValid("11/26", now)).toBe(true);
    expect(expiryValid("10/26", now)).toBe(false);
    expect(expiryValid("13/27", now)).toBe(false);
    expect(cvcValid("123", "visa")).toBe(true);
    expect(cvcValid("123", "amex")).toBe(false);
  });
});
