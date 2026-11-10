import { describe, expect, it } from "vitest";
import forge from "node-forge";
import {
  parsePublicCardPayload,
  toPublicCardViewModel,
} from "@/lib/cards/public-card";
import {
  buildApplePassContent,
  resolvePassColours,
  toPassRgb,
} from "@/lib/wallet/apple-pass-content";
import { createApplePass } from "@/lib/wallet/apple-pass";
import { platformDefaultTokens } from "@/lib/branding/tokens";
import { decodePemEnv, getAppleWalletConfig } from "@/lib/validation/env";
import { publicAppleWalletPassPath } from "@/lib/analytics/source";
import type { Json } from "@/types/database";

function sampleModel(overrides: { whiteLabel?: boolean; withLocation?: boolean } = {}) {
  const payload = parsePublicCardPayload({
    card: {
      id: "11111111-1111-4111-8111-111111111111",
      slug: "jane-doe",
      layout_id: "corporate",
      page_title: null,
      meta_description: null,
      primary_cta_label: null,
      primary_cta_url: null,
      public_status: "active",
    },
    organisation: {
      id: "org-1",
      name: "Acme Group",
      slug: "acme",
      website: "acme.example",
      white_label_enabled: overrides.whiteLabel ?? false,
    },
    employee: {
      id: "emp-1",
      first_name: "Jane",
      last_name: "Doe",
      display_name: "Jane Doe",
      job_title: "Sales Executive",
      department: null,
      email: "jane@acme.example",
      mobile: "+27 82 123 4567",
      whatsapp: "+27 82 123 4567",
      linkedin_url: "https://linkedin.com/in/jane",
      profile_photo_url: null,
      bio: "Helping you find the right car.",
    },
    brand: null,
    location: overrides.withLocation
      ? {
          id: "loc-1",
          name: "Acme Ballito",
          slug: "ballito",
          type: "dealership",
          address: "1 Main Road, Ballito",
          phone: "+27 32 000 0000",
          email: null,
          website: null,
        }
      : null,
    organisation_kit: null,
    brand_kit: null,
    card_kit: null,
    sections: [],
  } as unknown as Json);
  return toPublicCardViewModel(payload!);
}

describe("Apple Wallet pass content", () => {
  it("puts identity on the front and every action on the back", () => {
    const content = buildApplePassContent(sampleModel({ withLocation: true }), {
      cardUrl: "https://cards.example/acme/jane-doe?src=wallet",
      hasLogoImage: false,
      platformName: "DeVision Media",
    });

    expect(content.serialNumber).toBe("11111111-1111-4111-8111-111111111111");
    expect(content.primaryFields[0]?.value).toBe("Jane Doe");
    expect(content.secondaryFields.map((f) => f.value)).toEqual([
      "Sales Executive",
      "Acme Group",
    ]);
    expect(content.headerFields[0]?.value).toBe("Acme Ballito");
    expect(content.logoText).toBe("Acme Group");
    expect(content.barcode.message).toBe(
      "https://cards.example/acme/jane-doe?src=wallet",
    );

    const back = Object.fromEntries(content.backFields.map((f) => [f.key, f]));
    expect(back["back-whatsapp"]?.attributedValue).toContain(
      'href="https://wa.me/27821234567"',
    );
    expect(back["back-website"]?.value).toBe("https://acme.example");
    expect(back["back-location"]?.value).toBe("1 Main Road, Ballito");
    expect(back["back-card"]?.attributedValue).toContain("Open the full card");
    expect(back["back-platform"]?.value).toBe("DeVision Media");
  });

  it("drops platform credit for white-label organisations and logoText when a logo exists", () => {
    const content = buildApplePassContent(sampleModel({ whiteLabel: true }), {
      cardUrl: "https://cards.example/acme/jane-doe?src=wallet",
      hasLogoImage: true,
      platformName: "DeVision Media",
    });
    expect(content.backFields.some((f) => f.key === "back-platform")).toBe(false);
    expect(content.logoText).toBeUndefined();
  });

  it("keeps pass text readable on dark and light surfaces", () => {
    const dark = resolvePassColours({
      ...platformDefaultTokens,
      surface: "#0C121A",
      text: "#0D0D0D",
    });
    expect(dark.foreground).toBe("#FFFFFF");
    const light = resolvePassColours(platformDefaultTokens);
    expect(light.background).toBe("#FFFFFF");
    expect(toPassRgb("#0F766E")).toBe("rgb(15, 118, 110)");
  });
});

describe("Apple Wallet config", () => {
  it("is off until every credential is present", () => {
    expect(
      getAppleWalletConfig({
        NODE_ENV: "test",
        NEXT_PUBLIC_PLATFORM_NAME: "DeVision Media",
        NEXT_PUBLIC_PLATFORM_BASE_DOMAIN: "localhost:3000",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        APPLE_WALLET_PASS_TYPE_ID: "pass.media.devision.card",
        APPLE_WALLET_TEAM_ID: "ABCDE12345",
      }),
    ).toBeNull();
  });

  it("accepts escaped or base64 PEM values", () => {
    const pem = "-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----";
    expect(decodePemEnv(pem.replace(/\n/g, "\\n"))).toBe(pem);
    expect(decodePemEnv(Buffer.from(pem).toString("base64"))).toBe(pem);
  });

  it("attaches the analytics session to the pass link", () => {
    expect(publicAppleWalletPassPath("acme", "jane-doe")).toBe(
      "/api/wallet/apple/acme/jane-doe",
    );
    expect(
      publicAppleWalletPassPath("acme", "jane-doe", {
        sessionId: "s",
        source: "qr",
      }),
    ).toBe("/api/wallet/apple/acme/jane-doe?sid=s&src=qr");
  });
});

function selfSignedPem() {
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date(Date.now() + 86_400_000);
  const attrs = [{ name: "commonName", value: "Test Pass Signer" }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  return {
    cert: forge.pki.certificateToPem(cert),
    key: forge.pki.privateKeyToPem(keys.privateKey),
  };
}

describe("Apple Wallet pass file", () => {
  it("builds a signed generic pass with icon, QR and fields", async () => {
    const { cert, key } = selfSignedPem();
    const buffer = await createApplePass(sampleModel({ withLocation: true }), {
      config: {
        passTypeIdentifier: "pass.media.devision.card",
        teamIdentifier: "ABCDE12345",
        signerCert: cert,
        signerKey: key,
        wwdr: cert,
      },
      absoluteCardUrl: "https://cards.example/acme/jane-doe",
      assetOrigin: "https://cards.example",
      platformName: "DeVision Media",
    });

    expect(buffer.subarray(0, 2).toString()).toBe("PK");
    const text = buffer.toString("latin1");
    for (const file of ["pass.json", "manifest.json", "signature", "icon.png", "icon@3x.png"]) {
      expect(text).toContain(file);
    }
    expect(text).toContain('"generic"');
    expect(text).toContain("PKBarcodeFormatQR");
    expect(text).toContain("src=wallet");
  }, 30_000);
});
