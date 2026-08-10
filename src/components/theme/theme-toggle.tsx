"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function ThemeToggle({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "icon";
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size={size === "icon" ? "icon" : "sm"}
      onClick={toggleTheme}
      className={cn(size === "icon" ? "h-9 w-9" : undefined, className)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
      {size === "sm" ? (
        <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
      ) : null}
    </Button>
  );
}
