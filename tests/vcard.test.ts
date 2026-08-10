import { describe, expect, it } from "vitest";
import { buildVCard } from "@/lib/vcard/build";

describe("buildVCard", () => {
  it("includes identity and contact fields", () => {
    const vcard = buildVCard({
      firstName: "Jane",
      lastName: "Doe",
      displayName: "Jane Doe",
      organisation: "Acme",
      title: "Partner",
      email: "jane@acme.example",
      mobile: "+15551234567",
      website: "https://acme.example",
      cardUrl: "https://app.example/acme/jane-doe",
      linkedinUrl: "https://linkedin.com/in/jane",
    });

    expect(vcard).toContain("BEGIN:VCARD");
    expect(vcard).toContain("FN:Jane Doe");
    expect(vcard).toContain("ORG:Acme");
    expect(vcard).toContain("TEL;TYPE=CELL:+15551234567");
    expect(vcard).toContain("EMAIL;TYPE=INTERNET:jane@acme.example");
    expect(vcard).toContain("END:VCARD");
  });

  it("escapes commas and semicolons", () => {
    const vcard = buildVCard({
      firstName: "Ann",
      lastName: "Lee",
      displayName: "Lee, Ann",
      organisation: "Acme; Inc",
    });
    expect(vcard).toContain("FN:Lee\\, Ann");
    expect(vcard).toContain("ORG:Acme\\; Inc");
  });
});
