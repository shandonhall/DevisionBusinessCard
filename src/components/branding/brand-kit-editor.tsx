"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import {
  FONT_OPTIONS,
  LAYOUT_OPTIONS,
  brandKitToTokenPartial,
  getContrastWarnings,
  resolveDesignTokens,
  type DesignTokens,
} from "@/lib/branding/tokens";
import {
  importBrandFromWebsiteAction,
  updateBrandKitAction,
  uploadLogoAction,
  type ActionResult,
  type ImportBrandActionResult,
} from "@/lib/branding/actions";
import { BrandPreviewCard } from "@/components/branding/brand-preview-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BrandKit } from "@/types/database";

const initialAction: ActionResult = { ok: false };
const initialImport: ImportBrandActionResult = { ok: false };

function kitToFormState(kit: BrandKit): DesignTokens {
  return resolveDesignTokens({
    organisationKit: brandKitToTokenPartial(kit),
  });
}

export function BrandKitEditor({
  organisationId,
  organisationName,
  organisationWebsite,
  brandKit,
}: {
  organisationId: string;
  organisationName: string;
  organisationWebsite?: string | null;
  brandKit: BrandKit;
}) {
  const [draft, setDraft] = useState(() => kitToFormState(brandKit));
  const [logoUrl, setLogoUrl] = useState(brandKit.logo_url);
  const [websiteUrl, setWebsiteUrl] = useState(organisationWebsite ?? "");
  const [importNotes, setImportNotes] = useState<string[]>([]);
  const [importState, setImportState] =
    useState<ImportBrandActionResult>(initialImport);
  const [importPending, setImportPending] = useState(false);
  const [saveState, saveAction, savePending] = useActionState(
    updateBrandKitAction,
    initialAction,
  );
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadLogoAction,
    initialAction,
  );
  const [, startTransition] = useTransition();

  const previewTokens = useMemo(
    () => ({
      ...draft,
      logoUrl: uploadState.logoUrl ?? logoUrl ?? draft.logoUrl,
    }),
    [draft, logoUrl, uploadState.logoUrl],
  );

  const warnings = useMemo(
    () => getContrastWarnings(previewTokens),
    [previewTokens],
  );

  function setColour<K extends keyof DesignTokens>(key: K, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImport(formData: FormData) {
    setImportPending(true);
    setImportState(initialImport);
    setImportNotes([]);
    try {
      const result = await importBrandFromWebsiteAction(
        initialImport,
        formData,
      );
      setImportState(result);
      if (result.ok && result.suggestion) {
        const s = result.suggestion;
        setDraft((prev) => ({
          ...prev,
          primary: s.primary,
          secondary: s.secondary,
          accent: s.accent,
          background: s.background,
          surface: s.surface,
          text: s.text,
          mutedText: s.mutedText,
          headingFont: s.headingFont,
          bodyFont: s.bodyFont,
          layoutId: s.layoutId,
          logoUrl: s.logoUrl ?? prev.logoUrl,
        }));
        if (s.logoUrl) setLogoUrl(s.logoUrl);
        setImportNotes(s.notes);
      }
    } finally {
      setImportPending(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-8">
        <form
          action={handleImport}
          className="space-y-4 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5"
        >
          <input type="hidden" name="organisationId" value={organisationId} />
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Import from website
            </h2>
            <p className="text-sm text-[var(--brand-muted-text)]">
              Analyse a brand site for colours, fonts and a logo candidate.
              Review the live preview, then save the brand kit.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                required
                placeholder="https://example.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary" disabled={importPending}>
              {importPending ? "Analysing..." : "Import brand"}
            </Button>
          </div>
          {importState.error ? (
            <p className="text-sm text-red-700">{importState.error}</p>
          ) : null}
          {importState.ok && importNotes.length > 0 ? (
            <ul className="space-y-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {importNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
              {importState.suggestion?.coloursFound?.length ? (
                <li className="flex flex-wrap items-center gap-2 pt-1">
                  <span>Sampled colours:</span>
                  {importState.suggestion.coloursFound.slice(0, 8).map((c) => (
                    <span
                      key={c}
                      title={c}
                      className="inline-block h-4 w-4 rounded-sm border border-[var(--brand-border)]"
                      style={{ background: c }}
                    />
                  ))}
                </li>
              ) : null}
            </ul>
          ) : null}
        </form>

        <form
          action={uploadAction}
          className="space-y-3 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5"
        >
          <input type="hidden" name="organisationId" value={organisationId} />
          <input type="hidden" name="brandKitId" value={brandKit.id} />
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Logo</h2>
            <p className="text-sm text-[var(--brand-muted-text)]">
              PNG, JPEG, WebP or SVG � max 5MB. Website import may set an
              external logo URL; upload here to host it in your assets.
            </p>
          </div>
          <Input
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
          />
          <Button type="submit" variant="secondary" disabled={uploadPending}>
            {uploadPending ? "Uploading..." : "Upload logo"}
          </Button>
          {uploadState.error ? (
            <p className="text-sm text-red-700">{uploadState.error}</p>
          ) : null}
          {uploadState.ok && uploadState.logoUrl ? (
            <p className="text-sm text-emerald-700">Logo updated.</p>
          ) : null}
        </form>

        <form
          action={(formData) => {
            startTransition(() => {
              setLogoUrl(previewTokens.logoUrl);
              saveAction(formData);
            });
          }}
          className="space-y-5 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5"
        >
          <input type="hidden" name="organisationId" value={organisationId} />
          <input type="hidden" name="brandKitId" value={brandKit.id} />
          <input
            type="hidden"
            name="logoUrl"
            value={previewTokens.logoUrl ?? ""}
          />

          <div>
            <h2 className="text-lg font-semibold tracking-tight">Brand kit</h2>
            <p className="text-sm text-[var(--brand-muted-text)]">
              Changes apply to all inherited card previews for this organisation.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Kit name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={brandKit.name}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["primary", "primaryColour", "Primary"],
                ["secondary", "secondaryColour", "Secondary"],
                ["accent", "accentColour", "Accent"],
                ["background", "backgroundColour", "Background"],
                ["surface", "surfaceColour", "Surface"],
                ["text", "textColour", "Text"],
                ["mutedText", "mutedTextColour", "Muted text"],
              ] as const
            ).map(([tokenKey, name, label]) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    id={name}
                    name={name}
                    type="color"
                    value={draft[tokenKey] as string}
                    onChange={(e) => setColour(tokenKey, e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-[var(--brand-border)] bg-transparent"
                  />
                  <Input
                    value={draft[tokenKey] as string}
                    onChange={(e) => setColour(tokenKey, e.target.value)}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="headingFont">Heading font</Label>
              <select
                id="headingFont"
                name="headingFont"
                className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
                value={draft.headingFont}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, headingFont: e.target.value }))
                }
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyFont">Body font</Label>
              <select
                id="bodyFont"
                name="bodyFont"
                className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
                value={draft.bodyFont}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, bodyFont: e.target.value }))
                }
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="buttonRadius">Button radius</Label>
              <Input
                id="buttonRadius"
                name="buttonRadius"
                value={draft.buttonRadius}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    buttonRadius: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardRadius">Card radius</Label>
              <Input
                id="cardRadius"
                name="cardRadius"
                value={draft.cardRadius}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, cardRadius: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultLayoutId">Default layout</Label>
              <select
                id="defaultLayoutId"
                name="defaultLayoutId"
                className="flex h-10 w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 text-sm"
                value={draft.layoutId}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    layoutId: e.target.value as DesignTokens["layoutId"],
                  }))
                }
              >
                {LAYOUT_OPTIONS.map((layout) => (
                  <option key={layout.id} value={layout.id}>
                    {layout.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {warnings.length > 0 ? (
            <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          {saveState.error ? (
            <p className="text-sm text-red-700">{saveState.error}</p>
          ) : null}
          {saveState.ok ? (
            <p className="text-sm text-emerald-700">Brand kit saved.</p>
          ) : null}

          <Button type="submit" disabled={savePending}>
            {savePending ? "Saving..." : "Save brand kit"}
          </Button>
        </form>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-3">
          <h2 className="text-lg font-semibold tracking-tight">Live preview</h2>
          <p className="text-sm text-[var(--brand-muted-text)]">
            Uses the same CSS variables public cards inherit.
          </p>
        </div>
        <BrandPreviewCard
          organisationName={organisationName}
          tokens={previewTokens}
        />
      </aside>
    </div>
  );
}
