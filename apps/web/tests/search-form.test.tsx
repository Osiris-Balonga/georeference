import assert from "node:assert/strict";
import { test, mock, afterEach } from "node:test";
import { render, screen, cleanup, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const pushed: string[] = [];
mock.module("next/navigation", {
  namedExports: {
    useRouter: () => ({ push: (href: string) => pushed.push(href) }),
  },
});
const { SearchForm } = await import("../src/components/search-form.tsx");
const originalFetch = globalThis.fetch;
afterEach(() => {
  cleanup();
  pushed.length = 0;
  globalThis.fetch = originalFetch;
});
const places = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Rivière",
    resource: "communes",
    ancestors: [{ name: "Nord", resource: "departments" }],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Rivière",
    resource: "neighborhoods",
    ancestors: [{ name: "Sud", resource: "departments" }],
  },
];
function mount(scope?: "departments") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  render(
    <QueryClientProvider client={client}>
      <SearchForm locale="fr" scope={scope} />
    </QueryClientProvider>,
  );
  return userEvent.setup();
}
test("place suggestions distinguish homonyms and choose the stable place with the keyboard", async () => {
  globalThis.fetch = async () =>
    Response.json({ data: places, meta: { total: 2 } });
  const user = mount();
  const input = screen.getByRole("combobox", { name: "Rechercher un lieu" });
  await user.type(input, "Rivi");
  const options = await screen.findAllByRole("option");
  assert.equal(options.length, 2);
  assert.match(options[0].textContent!, /Commune.*Nord/);
  assert.match(options[1].textContent!, /Quartier.*Sud/);
  await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
  assert.deepEqual(pushed, ["/fr/places/" + places[1].id]);
});
test("department search stays scoped without exposing unrelated categories", async () => {
  const requests: string[] = [];
  globalThis.fetch = async (url) => {
    requests.push(String(url));
    return Response.json({ data: [], meta: { total: 0 } });
  };
  const user = mount("departments");
  assert.ok(
    !screen.queryByRole("combobox", { name: "Type de lieu" }),
    "department search must not offer global categories",
  );
  await user.type(
    screen.getByRole("combobox", { name: "Rechercher un lieu" }),
    "Nord",
  );
  await waitFor(() => assert.ok(requests.length));
  assert.equal(
    new URL(requests[0], "http://localhost").searchParams.get("resource"),
    "departments",
  );
  await user.keyboard("{Escape}{Enter}");
  assert.equal(pushed.at(-1), "/fr/explore?q=Nord&resource=departments");
});
test("custom category dropdown scopes suggestions while Escape keeps free-text search available", async () => {
  const requests: string[] = [];
  globalThis.fetch = async (url) => {
    requests.push(String(url));
    return Response.json({ data: places.slice(1), meta: { total: 1 } });
  };
  const user = mount();
  const category = screen.getByRole("combobox", { name: "Type de lieu" });
  assert.equal(category.tagName, "BUTTON");
  await user.click(category);
  await user.click(await screen.findByRole("option", { name: "Quartier" }));
  const input = screen.getByRole("combobox", { name: "Rechercher un lieu" });
  await user.type(input, "Rivi");
  await screen.findByRole("option", { name: /Rivière/ });
  assert.ok(
    requests.some(
      (url) =>
        new URL(url, "http://localhost").searchParams.get("resource") ===
        "neighborhoods",
    ),
  );
  await user.keyboard("{Escape}");
  assert.equal(input.getAttribute("aria-expanded"), "false");
  assert.equal((input as HTMLInputElement).value, "Rivi");
  await user.keyboard("{Enter}");
  assert.equal(pushed.at(-1), "/fr/explore?q=Rivi&resource=neighborhoods");
});
test("failed suggestions preserve free-text submission", async () => {
  let reject: ((reason: Error) => void) | undefined;
  globalThis.fetch = async () =>
    new Promise<Response>((_resolve, fail) => {
      reject = fail;
    });
  const user = mount();
  const input = screen.getByRole("combobox", { name: "Rechercher un lieu" });
  await user.type(input, "Aucun");
  await waitFor(() => assert.ok(reject));
  await act(async () => reject!(new Error("offline")));
  await screen.findByText(/Suggestions indisponibles/);
  await user.keyboard("{ArrowDown}{Enter}");
  assert.equal(pushed.at(-1), "/fr/explore?q=Aucun");
});
