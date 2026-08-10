import Link from "next/link";
import { Suspense } from "react";
import { signOutAction } from "@/lib/auth/actions";
import { PlatformOrgSwitcher } from "@/components/admin/platform-org-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { PLATFORM_NAME } from "@/lib/branding/platform";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/my-card", label: "My card" },
  { href: "/dashboard/team", label: "Team" },
  { href: "/dashboard/cards", label: "Cards" },
  { href: "/dashboard/brands", label: "Brands" },
  { href: "/dashboard/locations", label: "Locations" },
  { href: "/dashboard/brand", label: "Brand kit" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

const PLATFORM_SHORT_NAME = PLATFORM_NAME.split(/\s+/)[0] || PLATFORM_NAME;

export function AppHeader({
  title,
  email,
  showAdminLink,
}: {
  title: string;
  email?: string;
  showAdminLink?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--brand-border)] bg-[var(--brand-surface)]/95 backdrop-blur">
      <div className="mx-auto w-full max-w-5xl px-4 py-2.5 sm:px-6">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <Link
              href="/"
              className="shrink-0 text-[14px] font-semibold leading-none tracking-tight text-[var(--brand-text)] sm:text-[15px]"
            >
              <span className="sm:hidden">{PLATFORM_SHORT_NAME}</span>
              <span className="hidden sm:inline">{PLATFORM_NAME}</span>
            </Link>
            <span
              className="hidden h-3.5 w-px shrink-0 bg-[var(--brand-border-strong)] sm:block"
              aria-hidden
            />
            <span className="truncate text-sm leading-none text-[var(--brand-muted-text)]">
              {title}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {showAdminLink ? (
              <Suspense fallback={null}>
                <PlatformOrgSwitcher />
              </Suspense>
            ) : null}
            {email ? (
              <span className="hidden max-w-[14rem] truncate text-sm leading-none text-[var(--brand-text)] lg:inline">
                {email}
              </span>
            ) : null}
            <span className="sm:hidden">
              <ThemeToggle size="icon" />
            </span>
            <span className="hidden sm:inline-flex">
              <ThemeToggle />
            </span>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                <span className="sm:hidden">Out</span>
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>

        <nav
          className="dim-admin-nav mt-2 -mx-4 flex items-center gap-x-0.5 overflow-x-auto border-t border-[var(--brand-border)] px-4 pt-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
          aria-label="Dashboard"
        >
          {NAV_LINKS.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
          {showAdminLink ? (
            <NavLink href="/admin" label="Platform" />
          ) : null}
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-md px-2.5 py-2 text-sm font-medium leading-none text-[var(--brand-text)] sm:py-1.5",
        "hover:bg-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-background)]",
      )}
    >
      {label}
    </Link>
  );
}
