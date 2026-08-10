import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { Globe, Mail, MessageCircle, Phone } from "lucide-react";
import type { PublicCardViewModel } from "@/types/card";
import { tokensToCssVars } from "@/lib/branding/tokens";

function whatsappHref(value: string) {
  return `https://wa.me/${value.replace(/\D/g, "")}`;
}

export function BrandLogo({ model }: { model: PublicCardViewModel }) {
  const label = model.brand?.name || model.organisation.name;
  if (model.tokens.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={model.tokens.logoUrl}
        alt={label}
        className="max-h-9 max-w-[160px] object-contain"
      />
    );
  }
  return (
    <p
      className="text-sm font-semibold tracking-tight"
      style={{ color: "var(--brand-primary)", fontFamily: "var(--brand-heading-font)" }}
    >
      {label}
    </p>
  );
}

export function ProfileImage({ model }: { model: PublicCardViewModel }) {
  const initials = `${model.employee.firstName[0] ?? ""}${model.employee.lastName[0] ?? ""}`.toUpperCase();
  if (model.employee.profilePhotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={model.employee.profilePhotoUrl}
        alt=""
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white"
      style={{ background: "var(--brand-primary)" }}
      aria-hidden
    >
      {initials || "?"}
    </div>
  );
}

export function IdentityBlock({
  model,
  align = "center",
}: {
  model: PublicCardViewModel;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <h1
        className="text-3xl font-semibold tracking-tight"
        style={{ fontFamily: "var(--brand-heading-font)" }}
      >
        {model.employee.displayName}
      </h1>
      {model.employee.jobTitle ? (
        <p style={{ color: "var(--brand-muted-text)" }}>{model.employee.jobTitle}</p>
      ) : null}
      <p className="text-sm" style={{ color: "var(--brand-muted-text)" }}>
        {[model.brand?.name || model.organisation.name, model.location?.name]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </div>
  );
}

export function ContactActionRow({ model }: { model: PublicCardViewModel }) {
  const actions = [
    model.employee.mobile
      ? {
          key: "call",
          label: "Call",
          href: `tel:${model.employee.mobile}`,
          Icon: Phone,
        }
      : null,
    model.employee.email
      ? {
          key: "email",
          label: "Email",
          href: `mailto:${model.employee.email}`,
          Icon: Mail,
        }
      : null,
    model.employee.whatsapp
      ? {
          key: "whatsapp",
          label: "WhatsApp",
          href: whatsappHref(model.employee.whatsapp),
          Icon: MessageCircle,
        }
      : null,
    model.organisation.website || model.brand?.website
      ? {
          key: "website",
          label: "Website",
          href: model.brand?.website || model.organisation.website!,
          Icon: Globe,
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    label: string;
    href: string;
    Icon: typeof Phone;
  }[];

  if (actions.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-2.5">
      {actions.map((action) => (
        <li key={action.key}>
          <a
            href={action.href}
            className="card-lift flex items-center justify-center gap-2 rounded-[var(--brand-button-radius)] border px-3 py-3.5 text-center text-sm font-medium"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--brand-surface) 96%, var(--brand-primary)), var(--brand-surface))",
              borderColor: "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
              boxShadow:
                "0 1px 2px rgb(10 15 12 / 0.05), inset 0 1px 0 rgb(255 255 255 / 0.5)",
            }}
            target={action.href.startsWith("http") ? "_blank" : undefined}
            rel={action.href.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            <action.Icon
              size={16}
              aria-hidden
              style={{ color: "var(--brand-primary)" }}
            />
            {action.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function AboutSection({ model }: { model: PublicCardViewModel }) {
  if (!model.employee.bio) return null;
  return (
    <section className="space-y-2">
      <h2
        className="text-sm font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--brand-muted-text)" }}
      >
        About
      </h2>
      <p className="leading-relaxed">{model.employee.bio}</p>
    </section>
  );
}

export function SocialLinks({ model }: { model: PublicCardViewModel }) {
  if (!model.employee.linkedinUrl) return null;
  return (
    <section>
      <a
        href={model.employee.linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium underline-offset-4 hover:underline"
        style={{ color: "var(--brand-primary)" }}
      >
        LinkedIn
      </a>
    </section>
  );
}

export function PrimaryCta({ model }: { model: PublicCardViewModel }) {
  if (!model.card.primaryCtaLabel || !model.card.primaryCtaUrl) return null;
  return (
    <a
      href={model.card.primaryCtaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="card-lift flex w-full items-center justify-center rounded-[var(--brand-button-radius)] px-4 py-3 text-sm font-medium text-white"
      style={{
        background:
          "linear-gradient(180deg, var(--brand-accent), color-mix(in srgb, var(--brand-accent) 82%, black))",
        boxShadow:
          "0 8px 20px -10px color-mix(in srgb, var(--brand-accent) 60%, transparent), inset 0 1px 0 rgb(255 255 255 / 0.25)",
      }}
    >
      {model.card.primaryCtaLabel}
    </a>
  );
}

export function CardShell({
  model,
  children,
  className = "",
  style,
  ...rest
}: {
  model: PublicCardViewModel;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`card-shell min-h-screen ${className}`}
      style={{
        ...tokensToCssVars(model.tokens),
        background: "var(--brand-background)",
        color: "var(--brand-text)",
        fontFamily: "var(--brand-body-font)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
