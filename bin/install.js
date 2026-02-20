#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

// -----------------------------
// Args
// -----------------------------
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

// -----------------------------
// Version + markers
// -----------------------------
const pkg = require(path.join(__dirname, "..", "package.json"));
const CLI_VERSION = pkg.version;

const VERSION_STAMP = `<!-- Installed by openclaw-deterministic v${CLI_VERSION} -->`;

// NOTE: This block is intentionally minimal and deterministic.
// It only declares the overlay and does not replace user SOUL content.
const OVERLAY_BLOCK = `
## Deterministic Governance Overlay

This system loads and adheres to SOUL.deterministic.md as a governing philosophical constraint.
`.trim();

// -----------------------------
// Paths
// -----------------------------
const home = os.homedir();
const openclawRoot = path.join(home, ".openclaw");
const workspace = path.join(openclawRoot, "workspace");

const backupsRoot = path.join(openclawRoot, "backups", "deterministic");

const target = {
  operating: path.join(workspace, "OPERATING_RULES.md"),
  detSoul: path.join(workspace, "SOUL.deterministic.md"),
  soul: path.join(workspace, "SOUL.md"),
  compactor: path.join(workspace, "skills", "memory-compactor", "SKILL.md"),
  config: path.join(openclawRoot, ".deterministic.json"),
};

function tpl(rel) {
  return path.join(__dirname, "..", "templates", rel);
}

const configTemplatePath = path.join(
  __dirname,
  "..",
  "templates",
  "config",
  ".deterministic.json"
);

// -----------------------------
// Helpers
// -----------------------------
function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function ensureDir(dirPath) {
  if (exists(dirPath)) return;
  if (DRY_RUN) return;
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(p, content) {
  ensureDir(path.dirname(p));
  if (DRY_RUN) {
    console.log(`[DRY-RUN] Would write: ${p}`);
    return;
  }
  fs.writeFileSync(p, content, "utf8");
}

function readFile(p) {
  return fs.readFileSync(p, "utf8");
}

function timestamp() {
  // keep filesystem-safe
  return new Date().toISOString().replace(/:/g, "-");
}

function backupSnapshot(pathsToBackup) {
  if (DRY_RUN) {
    console.log("[DRY-RUN] Would create backup snapshot.");
    return null;
  }

  ensureDir(backupsRoot);
  const snap = path.join(backupsRoot, timestamp());
  ensureDir(snap);

  for (const p of pathsToBackup) {
    if (!exists(p)) continue;

    const relative = path.relative(openclawRoot, p);
    const destination = path.join(snap, relative);

    ensureDir(path.dirname(destination));
    fs.copyFileSync(p, destination);
  }

  return snap;
}

function copyWithVersionStamp(src, dest) {
  const raw = readFile(src);
  const stamped = `${VERSION_STAMP}\n${raw.replace(/^\uFEFF/, "")}`;
  writeFile(dest, stamped);

  if (!DRY_RUN) {
    // keep output consistent with your CLI style
    const pretty = dest.startsWith(workspace)
      ? dest.replace(workspace + path.sep, "")
      : dest;
    console.log(`Installed: ${pretty}`);
  } else {
    console.log(`[DRY-RUN] Would install: ${dest}`);
  }
}

// -----------------------------
// Install steps
// -----------------------------
function installTemplates() {
  // Ensure skill directory exists
  ensureDir(path.dirname(target.compactor));

  copyWithVersionStamp(tpl("OPERATING_RULES.md"), target.operating);
  copyWithVersionStamp(tpl("SOUL.deterministic.md"), target.detSoul);
  copyWithVersionStamp(tpl("memory-compactor.SKILL.md"), target.compactor);
}

function installConfigIfMissing() {
  if (exists(target.config)) {
    console.log("Config exists — NOT modified.");
    return;
  }

  if (!exists(configTemplatePath)) {
    console.error(
      `Config template missing in package: ${configTemplatePath}\n` +
        "Refusing to create an empty config."
    );
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log(`[DRY-RUN] Would write: ${target.config}`);
    return;
  }

  fs.copyFileSync(configTemplatePath, target.config);
  console.log(`Installed: ${target.config}`);
}

function bootstrapSoulIfMissing() {
  if (exists(target.soul)) {
    console.log("User SOUL.md exists — NOT modified.");
    return;
  }

  console.log(
    "No SOUL.md detected — bootstrapping fresh SOUL.md with deterministic overlay."
  );

  if (DRY_RUN) {
    console.log("[DRY-RUN] Would create SOUL.md with deterministic overlay.");
    return;
  }

  writeFile(target.soul, OVERLAY_BLOCK + "\n");
  console.log("Created: SOUL.md (deterministic overlay enabled by default)");
}

// -----------------------------
// Main
// -----------------------------
if (!exists(openclawRoot)) {
  console.error("OpenClaw not found at ~/.openclaw");
  process.exit(1);
}

if (!exists(workspace)) {
  console.error("OpenClaw workspace missing at ~/.openclaw/workspace");
  process.exit(1);
}

if (DRY_RUN) {
  console.log("\nRunning deterministic install (dry-run mode)...\n");
}

const pathsToBackup = [
  target.operating,
  target.detSoul,
  target.compactor,
  // NOTE: we do NOT back up SOUL.md here because install never modifies it.
  // If you later add an "enable" flow that edits SOUL.md, that command should back it up there.
  target.config,
];

const snap = backupSnapshot(pathsToBackup);

if (!DRY_RUN) {
  console.log("Creating deterministic backup snapshot...");
  console.log(`Backup location: ${snap}`);
}

installTemplates();
installConfigIfMissing();
bootstrapSoulIfMissing();

if (DRY_RUN) {
  console.log("\nDry-run complete. No changes were written.\n");
} else {
  console.log("\nDeterministic governance installed successfully.");
}

process.exit(0);
