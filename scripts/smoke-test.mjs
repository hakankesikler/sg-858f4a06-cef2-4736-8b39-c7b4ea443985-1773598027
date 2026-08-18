import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const externalBaseUrl = process.env.SMOKE_BASE_URL?.replace(/\/$/, "");
const port = process.env.SMOKE_PORT || "3210";
const baseUrl = externalBaseUrl || `http://127.0.0.1:${port}`;
let server;
let serverOutput = "";

const routes = [
  { path: "/", contains: ["Müşteri Portalı", "Gönderinizi Takip Edin"] },
  { path: "/login", contains: ["REX Operasyon Portalı", "Yetkili Personel"] },
  { path: "/musteri-giris", contains: ["Kurumsal Müşteri Portalı", "Sevkiyatlarınızı Takip Edin"] },
  { path: "/musteri-kayit", contains: ["Kurumsal Hesabınızı Oluşturun"] },
  { path: "/takip/REX-0000000000000000", contains: ["Gönderinizi Takip Edin"] },
  { path: "/personel/profil", contains: ["Yetkiniz kontrol ediliyor"] },
];

async function waitForServer() {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 350));
  }
  throw new Error(`Application did not start in time.\n${serverOutput}`);
}

async function checkRoute({ path, contains }) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  assert.ok(response.status >= 200 && response.status < 400, `${path} returned HTTP ${response.status}`);
  const html = await response.text();
  for (const expected of contains) {
    assert.ok(html.includes(expected), `${path} is missing critical text: ${expected}`);
  }
  process.stdout.write(`✓ ${path}\n`);
}

try {
  if (!externalBaseUrl) {
    const nextBin = resolve("node_modules/next/dist/bin/next");
    server = spawn(process.execPath, [nextBin, "start", "-p", port], {
      cwd: resolve("."),
      env: { ...process.env, NODE_ENV: "production" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
    server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });
    await waitForServer();
  }

  for (const route of routes) await checkRoute(route);
  process.stdout.write(`\nCritical smoke checks passed against ${baseUrl}.\n`);
} finally {
  if (server && !server.killed) server.kill();
}
