import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", ".next", "node_modules", "uploads", "logs", "coverage", "out", "build"]);
const ignoredFiles = new Set([".env.example", "pnpm-lock.yaml"]);
const textExtensions = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".json", ".yml", ".yaml", ".toml", ".sql", ".md", ".txt", ".env"]);
const detectors = [
  { name: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: "GitHub token", pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}\b/g },
  { name: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "Stripe live secret", pattern: /\bsk_live_[A-Za-z0-9]{20,}\b/g },
  { name: "Resend API key", pattern: /\bre_[A-Za-z0-9_-]{24,}\b/g },
  { name: "service-role JWT literal", pattern: /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["']eyJ[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}["']/g },
];
async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(fullPath));
    else if (!ignoredFiles.has(entry.name) && textExtensions.has(extname(entry.name).toLowerCase())) files.push(fullPath);
  }
  return files;
}
const findings = [];
for (const file of await filesUnder(root)) {
  const source = await readFile(file, "utf8");
  for (const detector of detectors) {
    detector.pattern.lastIndex = 0;
    for (const match of source.matchAll(detector.pattern)) {
      const line = source.slice(0, match.index).split(/\r?\n/).length;
      findings.push(`${relative(root, file)}:${line} (${detector.name})`);
    }
  }
}
if (findings.length) {
  console.error("Potential committed secrets found:\n" + findings.map((finding) => `- ${finding}`).join("\n"));
  process.exit(1);
}
console.log("No high-confidence committed secrets found.");
