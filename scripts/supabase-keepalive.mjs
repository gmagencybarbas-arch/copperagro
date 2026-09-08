/**
 * Keep-alive diário do Supabase CopperAgro.
 * Chama RPC keepalive_bump(): grava o dia e users_count + 1.
 *
 * Local:  npm run keepalive
 * CI:     GitHub Action (cron) com secrets SUPABASE_URL + SUPABASE_KEY
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

const url = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  ""
).trim().replace(/\/$/, "");

const key = (
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  ""
).trim();

if (!url || !key) {
  console.error(
    "[keepalive] Falta URL ou chave. Define NEXT_PUBLIC_SUPABASE_URL e uma key no .env.local (ou secrets do CI).",
  );
  process.exit(1);
}

const endpoint = `${url}/rest/v1/rpc/keepalive_bump`;

const res = await fetch(endpoint, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: "{}",
});

const bodyText = await res.text();
let data;
try {
  data = bodyText ? JSON.parse(bodyText) : null;
} catch {
  data = bodyText;
}

if (!res.ok) {
  console.error("[keepalive] Falhou:", res.status, data);
  process.exit(1);
}

const row = Array.isArray(data) ? data[0] : data;
console.log(
  `[keepalive] OK · dia=${row?.day ?? "?"} · users_count=${row?.users_count ?? "?"}`,
);
