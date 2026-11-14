import assert from "node:assert/strict";
import { test, mock, afterEach } from "node:test";
import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
mock.module("next/navigation", {
  namedExports: {
    usePathname: () => "/fr",
    useSearchParams: () => new URLSearchParams(),
  },
});
const { ThemeProvider } = await import("../src/components/theme-provider.tsx");
const { Preferences } = await import("../src/components/preferences.tsx");
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: window.localStorage,
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});
function media(light: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches: light,
    addEventListener: (_: string, f: () => void) => listeners.add(f),
    removeEventListener: (_: string, f: () => void) => listeners.delete(f),
  };
  Object.defineProperty(globalThis, "matchMedia", {
    configurable: true,
    value: () => query,
  });
  return (next: boolean) => {
    query.matches = next;
    listeners.forEach((f) => f());
  };
}
test("system dark displays a moon and toggles directly light/dark without a third system state", async () => {
  media(false);
  const { container } = render(
    <ThemeProvider>
      <Preferences locale="fr" />
    </ThemeProvider>,
  );
  const button = await screen.findByRole("button", {
    name: "Activer le thème clair",
  });
  assert.ok(container.querySelector(".lucide-moon"));
  assert.equal(container.querySelector(".lucide-monitor"), null);
  await userEvent.click(button);
  assert.equal(document.documentElement.dataset.theme, "light");
  assert.equal(localStorage.getItem("242places-theme"), "light");
  await userEvent.click(
    screen.getByRole("button", { name: "Activer le thème sombre" }),
  );
  assert.equal(document.documentElement.dataset.theme, "dark");
  assert.equal(localStorage.getItem("242places-theme"), "dark");
});
test("system light is resolved visibly and follows changes until an explicit override", async () => {
  const change = media(true);
  const { container } = render(
    <ThemeProvider>
      <Preferences locale="en" />
    </ThemeProvider>,
  );
  await screen.findByRole("button", { name: "Switch to dark mode" });
  assert.ok(container.querySelector(".lucide-sun"));
  await act(async () => change(false));
  await screen.findByRole("button", { name: "Switch to light mode" });
  await userEvent.click(
    screen.getByRole("button", { name: "Switch to light mode" }),
  );
  await act(async () => change(true));
  await act(async () => change(false));
  assert.equal(document.documentElement.dataset.theme, "light");
});
