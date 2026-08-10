import type { CSSProperties } from "react";
import { PLATFORM_NAME, poweredByPlatformLabel } from "@/lib/branding/platform";

export function PlatformPoweredBy({
  className = "pt-2 text-center text-xs",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <p className={className} style={style}>
      {poweredByPlatformLabel(PLATFORM_NAME)}
    </p>
  );
}
