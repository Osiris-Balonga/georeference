import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const port = process.env.PORT ?? "3000",
  apiPort = process.env.API_INTERNAL_PORT ?? "3001";
if (port === apiPort)
  throw new Error("Public and internal API ports must differ");
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (!child.killed) child.kill("SIGTERM");
  const timer = setTimeout(() => {
    for (const child of children)
      if (child.exitCode === null) child.kill("SIGKILL");
    process.exit(code);
  }, 8000);
  timer.unref();
  Promise.all(
    children.map((child) =>
      child.exitCode !== null
        ? Promise.resolve()
        : new Promise((resolve) => child.once("exit", resolve)),
    ),
  ).then(() => {
    clearTimeout(timer);
    process.exit(code);
  });
}
function launch(args, env) {
  const child = spawn(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  children.push(child);
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code || 1);
  });
}
launch(["apps/api/dist/server.js"], { API_HOST: "127.0.0.1", PORT: apiPort });
launch(
  [
    require.resolve("next/dist/bin/next"),
    "start",
    "apps/web",
    "--hostname",
    "0.0.0.0",
    "--port",
    port,
  ],
  { API_INTERNAL_ORIGIN: "http://127.0.0.1:" + apiPort },
);
process.on("SIGTERM", () => stop());
process.on("SIGINT", () => stop());
