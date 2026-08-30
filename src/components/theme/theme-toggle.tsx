"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

type ThemePreference = "system" | "light" | "dark";

const themes = ["system", "light", "dark"] as const;

const themeDetails = {
  system: { icon: Monitor, label: "System theme" },
  light: { icon: Sun, label: "Light theme" },
  dark: { icon: Moon, label: "Dark theme" },
} as const;

function applyTheme(preference: ThemePreference) {
  const systemIsDark =
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  const resolved =
    preference === "system" ? (systemIsDark ? "dark" : "light") : preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

function getThemePreference(): ThemePreference {
  const saved = window.localStorage.getItem("theme");
  return themes.includes(saved as ThemePreference)
    ? (saved as ThemePreference)
    : "system";
}

function subscribeToThemeChange(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("themechange", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("themechange", onStoreChange);
  };
}

export function ThemeToggle() {
  const preference = useSyncExternalStore<ThemePreference>(
    subscribeToThemeChange,
    getThemePreference,
    (): ThemePreference => "system",
  );
  const { icon: Icon, label } = themeDetails[preference];

  useEffect(() => {
    applyTheme(preference);

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (getThemePreference() === "system") {
        applyTheme("system");
      }
    };
    media?.addEventListener("change", handleSystemChange);
    return () => media?.removeEventListener("change", handleSystemChange);
  }, [preference]);

  const cycleTheme = () => {
    const next =
      themes[(themes.indexOf(preference) + 1) % themes.length] ?? "system";
    window.localStorage.setItem("theme", next);
    applyTheme(next);
    window.dispatchEvent(new Event("themechange"));
  };

  return (
    <Button
      aria-label={`${label}. Change color theme`}
      className="size-10 px-0"
      onClick={cycleTheme}
      title={`${label} · select next theme`}
      variant="ghost"
    >
      <Icon aria-hidden="true" className="size-4" />
      <span className="sr-only">{label}</span>
    </Button>
  );
}
