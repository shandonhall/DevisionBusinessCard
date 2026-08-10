"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  claimMyCardAction,
  updateMyCardAction,
  uploadMyPhotoAction,
  type StructureActionResult,
} from "@/lib/structure/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Employee } from "@/types/database";

const initial: StructureActionResult = { ok: false };

export function MyCardEditor({
  employee,
  publicPath,
}: {
  employee: Employee | null;
  publicPath: string | null;
}) {
  const router = useRouter();
  const [updateState, updateAction, updatePending] = useActionState(
    updateMyCardAction,
    initial,
  );
  const [photoState, photoAction, photoPending] = useActionState(
    uploadMyPhotoAction,
    initial,
  );
  const [claimState, claimAction, claimPending] = useActionState(
    claimMyCardAction,
    initial,
  );

  useEffect(() => {
    if (photoState.ok || updateState.ok || claimState.ok) {
      router.refresh();
    }
  }, [photoState.ok, photoState.photoUrl, updateState.ok, claimState.ok, router]);

  if (!employee) {
    return (
      <div className="space-y-4 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
        <h2 className="text-lg font-semibold tracking-tight">
          Link your employee profile
        </h2>
        <p className="text-sm text-[var(--brand-muted-text)]">
          If an admin already added you on Team with this email, claim that
          profile to edit your details and photo.
        </p>
        <form action={claimAction}>
          <Button type="submit" disabled={claimPending}>
            {claimPending ? "Claiming…" : "Claim my profile"}
          </Button>
        </form>
        {claimState.error ? (
          <p className="text-sm text-red-700">{claimState.error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <form
        action={updateAction}
        className="space-y-4 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5"
      >
        <input type="hidden" name="employeeId" value={employee.id} />
        <input type="hidden" name="defaultCountryCallingCode" value="27" />
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Your details</h2>
          <p className="text-sm text-[var(--brand-muted-text)]">
            Updates appear on your public card after you save.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              name="firstName"
              required
              defaultValue={employee.first_name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              name="lastName"
              required
              defaultValue={employee.last_name}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={employee.display_name ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jobTitle">Job title</Label>
          <Input
            id="jobTitle"
            name="jobTitle"
            defaultValue={employee.job_title ?? ""}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={employee.email ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile</Label>
            <Input
              id="mobile"
              name="mobile"
              defaultValue={employee.mobile ?? ""}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              defaultValue={employee.whatsapp ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              defaultValue={employee.linkedin_url ?? ""}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            name="department"
            defaultValue={employee.department ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            defaultValue={employee.bio ?? ""}
            className="w-full rounded-lg border border-[var(--brand-border-strong)] bg-[var(--brand-surface)] px-3 py-2 text-sm"
          />
        </div>
        {updateState.error ? (
          <p className="text-sm text-red-700">{updateState.error}</p>
        ) : null}
        {updateState.ok ? (
          <p className="text-sm text-emerald-700">Profile saved.</p>
        ) : null}
        <Button type="submit" disabled={updatePending}>
          {updatePending ? "Saving…" : "Save profile"}
        </Button>
      </form>

      <div className="space-y-4">
        <form
          action={photoAction}
          className="space-y-3 rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5"
        >
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Profile photo
            </h2>
            <p className="text-sm text-[var(--brand-muted-text)]">
              PNG, JPEG or WebP · max 5MB
            </p>
          </div>
          {employee.profile_photo_url || photoState.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoState.photoUrl ?? employee.profile_photo_url ?? ""}
              alt=""
              className="h-28 w-28 rounded-full object-cover"
            />
          ) : null}
          <Input
            name="photo"
            type="file"
            accept="image/png,image/jpeg,image/webp,.jpg,.jpeg,.png,.webp"
            required
          />
          <p className="text-xs text-[var(--brand-muted-text)]">
            Tip: iPhone HEIC photos need to be saved as JPEG first.
          </p>
          <Button type="submit" variant="secondary" disabled={photoPending}>
            {photoPending ? "Uploading…" : "Upload photo"}
          </Button>
          {photoState.error ? (
            <p className="text-sm text-red-700">{photoState.error}</p>
          ) : null}
          {photoState.ok ? (
            <p className="text-sm text-emerald-700">Photo updated.</p>
          ) : null}
        </form>

        {publicPath ? (
          <div className="rounded-[var(--brand-card-radius)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 text-sm">
            <p className="font-medium">Public card</p>
            <a
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--brand-primary)] underline-offset-4 hover:underline"
            >
              {publicPath}
            </a>
          </div>
        ) : (
          <p className="text-sm text-[var(--brand-muted-text)]">
            Ask an admin to publish your card when you are ready.
          </p>
        )}
      </div>
    </div>
  );
}
