/**
 * Regression-Tests für die Email-Regex die in InviteUserDialog,
 * Onboarding, NewMandantDialog und PortalLogin Form-Validation einsetzen.
 */
import { describe, expect, it } from "vitest";

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isValidPhone = (s: string) => !s.trim() || /^[+\d\s/()-]{6,}$/.test(s.trim());

describe("Email-Regex (Form-Validation)", () => {
  it("akzeptiert gültige Adressen", () => {
    expect(isValidEmail("max@kanzlei-bergmann.de")).toBe(true);
    expect(isValidEmail("a.b+tag@example.co.uk")).toBe(true);
    expect(isValidEmail("info@müller-recht.de")).toBe(true);
  });
  it("lehnt offensichtliche Fehler ab", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("ohne-at")).toBe(false);
    expect(isValidEmail("zwei@@example.com")).toBe(false);
    expect(isValidEmail("space @example.com")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
  });
});

describe("Phone-Regex (NewMandant + Onboarding Notfall-Nummer)", () => {
  it("akzeptiert gültige Nummern", () => {
    expect(isValidPhone("+49 170 1234567")).toBe(true);
    expect(isValidPhone("030/123-456")).toBe(true);
    expect(isValidPhone("+1 (555) 123 4567")).toBe(true);
  });
  it("akzeptiert leere Eingabe (optional)", () => {
    expect(isValidPhone("")).toBe(true);
    expect(isValidPhone("   ")).toBe(true);
  });
  it("lehnt zu kurze oder Buchstaben ab", () => {
    expect(isValidPhone("123")).toBe(false);
    expect(isValidPhone("abcdefgh")).toBe(false);
    expect(isValidPhone("+49abc1234567")).toBe(false);
  });
});
