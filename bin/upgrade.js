#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");

const pkg = require(path.join(__dirname, "..", "package.json"));
const CLI_VERSION = pkg.version;

const home = os.homedir();
const openclawRoot = path.join(home, ".openclaw");
const workspace = path.join(openclawRoot, "workspace");

const VERSION_REGEX = /Installed by openclaw-deterministic v([0-9.]+)/;
const HASH_REGEX = /Canonical-Hash:\s*SHA256:([a-f0-9]+)/;

const files = [
  "OPERATING_RULES.md",
  "SOUL.deterministic.md",
  "skills/memory-compactor/SKILL.md",
];

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function write(p, content) {
  if (DRY_RUN) {
    console.log(`[DRY-RUN] Would write: ${p}`);
    return;
  }
  fs.writeFileSync(p, content, "utf8");
}

function getInstalledVersion(content) {
  const match = content.match(VERSION_REGEX);
  return match ? match[1] : null;
}

function extractHash(content) {
  const match = content.match(HASH_REGEX);
  return match ? match[1] : null;
}

function stripHeaders(content) {
  return content.replace(/<!--[\s\S]*?-->/g, "").trim();
}

function verifyIntegrity(installedContent) {
  const storedHash = extractHash(installedContent);
  if (!storedHash) {
    return { valid: false, reason: "missing-canonical-hash" };
  }

  const stripped = stripHeaders(installedContent);
  const crypto = require("crypto");
  const currentHash = crypto
    .createHash("sha256")
    .update(stripped)
    .digest("hex");

  if (storedHash !== currentHash) {
    return { valid: false, reason: "hash-mismatch" };
  }

  return { valid: true };
}

function loadTemplate(relPath) {
  const templatePath = path.join(__dirname, "..", "templates", relPath);
  if (!exists(templatePath)) {
    console.error(`Template missing: ${relPath}`);
    process.exit(1);
  }
  return read(templatePath);
}

function upgradeFile(relPath) {
  const targetPath = path.join(workspace, relPath);

  if (!exists(targetPath)) {
    console.log(`⚠ Skipping ${relPath} (not installed).`);
    return;
  }

  const installed = read(targetPath);
  const integrity = verifyIntegrity(installed);

  if (!integrity.valid && !FORCE) {
    console.error(
      `❌ Refusing to upgrade ${relPath}: ${integrity.reason}.`
    );
    console.error(
      "   File has been modified or is missing canonical header."
    );
    console.error("   Re-run with --force to override.");
    process.exit(2);
  }

  const template = loadTemplate(relPath);

  const stamped = template.replace(
    VERSION_REGEX,
    `Installed by openclaw-deterministic v${CLI_VERSION}`
  );

  write(targetPath, stamped);

  if (!DRY_RUN) {
    console.log(`✅ Upgraded ${relPath} → v${CLI_VERSION}`);
  }
}

if (!exists(openclawRoot)) {
  console.error("OpenClaw not found at ~/.openclaw");
  process.exit(1);
}

if (!exists(workspace)) {
  console.error("OpenClaw workspace missing at ~/.openclaw/workspace");
  process.exit(1);
}

console.log(`\nRunning deterministic upgrade → v${CLI_VERSION}\n`);

for (const rel of files) {
  upgradeFile(rel);
}

if (DRY_RUN) {
  console.log("\nDry-run complete. No changes written.\n");
} else {
  console.log("\nUpgrade complete.\n");
}

process.exit(0);
