export const resources = [
  "departments",
  "communes",
  "districts",
  "arrondissements",
  "urbanCommunities",
  "ruralCommunities",
  "neighborhoods",
  "villages",
] as const;
export function parseSearch(params: URLSearchParams) {
  const raw = params.get("resource") ?? "";
  const p = params.get("parent") ?? "";
  return {
    q: (params.get("q") ?? "").trim().slice(0, 100),
    resource: resources.includes(raw as (typeof resources)[number]) ? raw : "",
    parent: /^[a-f0-9-]{36}$/.test(p) ? p : "",
    offset: Math.max(
      0,
      Math.min(100000, Number.parseInt(params.get("offset") ?? "0", 10) || 0),
    ),
  };
}
export function updateSearch(
  current: URLSearchParams,
  changes: Record<string, string | number>,
) {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(changes))
    value === "" || value === 0
      ? next.delete(key)
      : next.set(key, String(value));
  if (Object.keys(changes).some((key) => key !== "offset"))
    next.delete("offset");
  return next.toString();
}
