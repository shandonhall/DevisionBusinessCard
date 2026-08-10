import Link from "next/link";
import { poweredByPlatformLabel } from "@/lib/branding/platform";

export function CardUnavailablePage({
  organisationName,
  message,
  whiteLabelEnabled,
}: {
  organisationName: string;
  message: string;
  whiteLabelEnabled: boolean;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
        {organisationName}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">Card unavailable</h1>
      <p className="text-[var(--brand-muted-text)]">{message}</p>
      <p className="text-sm text-[var(--brand-muted-text)]">
        This card is paused. Please contact the organisation if you need an
        updated link.
      </p>
      {!whiteLabelEnabled ? (
        <Link
          href="/"
          className="text-sm text-[var(--brand-primary)] underline-offset-4 hover:underline"
        >
          {poweredByPlatformLabel()}
        </Link>
      ) : null}
    </main>
  );
}