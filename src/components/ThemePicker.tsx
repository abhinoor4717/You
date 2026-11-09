"use client";

import { useEffect, useRef } from "react";

export default function ThemePicker() {
  const select = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const element = select.current;
    if (element) {
      element.value = document.documentElement.dataset.theme ?? "system";
    }
  }, []);

  function changeTheme(theme: string) {
    const root = document.documentElement;
    if (theme === "system") {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = theme;
    }

    try {
      window.localStorage.setItem("you-theme", theme);
    } catch {
      // The theme still applies for this page when storage is unavailable.
    }
  }

  return (
    <label className="flex items-center justify-between gap-3 text-sm font-medium text-muted">
      Appearance
      <select
        ref={select}
        defaultValue="system"
        onChange={(event) => changeTheme(event.currentTarget.value)}
        className="rounded-md border border-control bg-surface px-2 py-1 text-foreground"
      >
        <option value="system">System</option>
        <option value="light">Paper</option>
        <option value="dark">Midnight</option>
      </select>
    </label>
  );
}
