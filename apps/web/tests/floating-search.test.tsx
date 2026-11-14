import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloatingSearch } from "../src/components/floating-search.tsx";
afterEach(cleanup);
test("fast scrolling past an initially offscreen search docks the same editable field and restores it on return", async () => {
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: class {
      observe() {}
      disconnect() {}
    },
  });
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: class {
      observe() {}
      disconnect() {}
    },
  });
  const { container } = render(
    <FloatingSearch>
      <input aria-label="Search" defaultValue="Bacongo" />
    </FloatingSearch>,
  );
  const input = screen.getByRole("textbox");
  let bottom = 1000;
  const anchor = container.querySelector(".search-anchor")!;
  Object.defineProperty(anchor, "getBoundingClientRect", {
    value: () => ({ bottom, height: 56 }),
  });
  const scroll = async (next: number) =>
    act(async () => {
      bottom = next;
      window.dispatchEvent(new Event("scroll"));
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    });
  const mode = () =>
    container.querySelector(".search-dock")?.getAttribute("data-floating");
  await scroll(1000);
  assert.equal(mode(), "false");
  await scroll(-2000);
  assert.equal(mode(), "true");
  assert.equal(screen.getAllByRole("textbox").length, 1);
  assert.equal(screen.getByRole("textbox"), input);
  await userEvent.type(input, " test");
  await scroll(100);
  assert.equal(mode(), "false");
  assert.equal((input as HTMLInputElement).value, "Bacongo test");
});
