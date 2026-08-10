import { describe, expect, it } from "vitest";
import {
  extractBrandSuggestionFromHtml,
  normalizeColourToHex,
} from "@/lib/branding/extract-from-website";

describe("normalizeColourToHex", () => {
  it("normalises hex and rgb colours", () => {
    expect(normalizeColourToHex("#0f7")).toBe("#00FF77");
    expect(normalizeColourToHex("#0F766E")).toBe("#0F766E");
    expect(normalizeColourToHex("rgb(15, 118, 110)")).toBe("#0F766E");
  });
});

describe("extractBrandSuggestionFromHtml", () => {
  it("reads theme-color, css variables, fonts and logo candidates", () => {
    const html = `
      <html>
        <head>
          <meta name="theme-color" content="#1122AA" />
          <meta property="og:image" content="/og.png" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600&family=Manrope:wght@400&display=swap" rel="stylesheet" />
          <style>
            :root { --brand-primary: #CC3300; --accent: #00AACC; }
            body { background: #F7F7F7; color: #111111; font-family: Manrope, sans-serif; }
          </style>
        </head>
        <body>Hello</body>
      </html>
    `;

    const suggestion = extractBrandSuggestionFromHtml(
      html,
      "https://brand.example",
    );

    expect(suggestion.primary).toMatch(/^#[0-9A-F]{6}$/);
    expect(suggestion.coloursFound.length).toBeGreaterThan(0);
    expect(suggestion.logoUrl).toBe(
      "https://brand.example/apple-touch-icon.png",
    );
    expect(["Sora", "Manrope", "Outfit", "Source Sans 3"]).toContain(
      suggestion.headingFont,
    );
    expect(suggestion.notes.length).toBeGreaterThan(0);
  });

  it("fills sensible defaults when the page has almost no brand signals", () => {
    const suggestion = extractBrandSuggestionFromHtml(
      "<html><body>plain</body></html>",
      "https://empty.example",
    );
    expect(suggestion.primary).toMatch(/^#[0-9A-F]{6}$/);
    expect(suggestion.logoUrl).toBeNull();
    expect(suggestion.notes.some((n) => /Few brand colours/i.test(n))).toBe(
      true,
    );
  });
});
