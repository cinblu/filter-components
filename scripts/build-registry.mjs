// Builds the shadcn registry into public/r, then fills in {{SITE_URL}}.
//
// The adapter item depends on the filter-bar item by URL, and the install notes link to the
// docs, so the built JSON needs the site's real address:
//   NEXT_PUBLIC_SITE_URL, else Vercel's production URL, else this dev server.

import { execSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : `http://localhost:${process.env.PORT ?? 5000}`)
).replace(/\/$/, "");

execSync("shadcn build", { stdio: "inherit" });

const dir = "public/r";
for (const file of readdirSync(dir).filter((name) => name.endsWith(".json"))) {
  const path = join(dir, file);
  const json = readFileSync(path, "utf8");
  if (json.includes("{{SITE_URL}}")) writeFileSync(path, json.replaceAll("{{SITE_URL}}", siteUrl));
}
console.log(`Registry built for ${siteUrl}`);
