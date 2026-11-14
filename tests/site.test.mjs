import assert from "node:assert/strict";
import { test } from "node:test";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
const base = process.env.SITE_URL;
test("production gateway serves the public site, native docs and actual Congo data", async (t) => {
  let child;
  let origin = base;
  if (!origin) {
    const probe = createServer();
    await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
    const port = probe.address().port;
    await new Promise((resolve) => probe.close(resolve));
    origin = "http://127.0.0.1:" + port;
    child = spawn(process.execPath, ["scripts/serve-site.mjs"], {
      env: { ...process.env, PORT: String(port) },
      stdio: "ignore",
    });
    t.after(async () => {
      if (child.exitCode === null) {
        const exit = new Promise((resolve) => child.once("exit", resolve));
        child.kill("SIGTERM");
        await exit;
      }
    });
  }
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(origin + "/health/ready")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  assert.ok(ready, "combined server is ready");
  const french = await fetch(origin + "/", {
    redirect: "manual",
    headers: { "accept-language": "fr-CG, en;q=0.8" },
  });
  assert.equal(french.status, 307);
  assert.equal(french.headers.get("location"), "/fr");
  const saved = await fetch(origin + "/", {
    redirect: "manual",
    headers: { "accept-language": "fr", cookie: "242places-locale=en" },
  });
  assert.equal(saved.headers.get("location"), "/en");
  for (const locale of ["fr", "en"])
    for (const path of [
      "",
      "/congo",
      "/project",
      "/explore?q=Bacongo&resource=arrondissements",
      "/places/05d80510-ca0a-4fee-ae4f-44f17e3a8173",
    ]) {
      const response = await fetch(origin + "/" + locale + path);
      assert.equal(response.status, 200, path);
      const html = await response.text();
      assert.match(html, new RegExp('<html[^>]+lang="' + locale + '"'));
      assert.match(html, /242Places/);
      assert.match(html, /skyline.webp/);
      if (path.startsWith("/places")) assert.match(html, /Bacongo/);
    }
  const json = await (
    await fetch(
      origin +
        "/v1/search?parent=05d80510-ca0a-4fee-ae4f-44f17e3a8173&resource=neighborhoods",
    )
  ).json();
  assert.equal(json.meta.total, 9);
  assert.equal(
    (await (await fetch(origin + "/v1/congo")).json()).data.iso2,
    "CG",
  );
  const docs = await fetch(origin + "/docs/fr/congo/list");
  assert.equal(docs.status, 200);
  assert.match(await docs.text(), /data-brand-pin/);
  assert.match(docs.headers.get("content-security-policy"), /nonce-/);
  assert.equal((await fetch(origin + "/docs/assets/logo.svg")).status, 200);
  for (const asset of ["skyline", "skyline-desktop", "skyline-mobile", "riverfront", "map"]) {
    const response = await fetch(origin + "/images/" + asset + ".webp");
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /image\/webp/);
  }
});
