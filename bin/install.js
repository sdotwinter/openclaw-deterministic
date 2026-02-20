#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const pkg = require("../package.json");

const HOME = process.env.HOME;
const openclawRoot = path.join(HOME, ".openclaw");
const workspace = path.join(openclawRoot, "workspace");
const backupsRoot = path.join(openclawRoot, "backups", "deterministic");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

const tpl = (name) => path.join(__dirname, "..", "templates", name);

const target = {
  operating: path.join(workspace, "OPERATING_RULES.md"),
  detSoul: path.join(workspace, "SOUL.deterministic.md"),
  soul: path.join(workspace, "SOUL.md"),
  compactor: path.join(workspace, "skills", "memory-compactor", "SKILL.md"),
};

const OVERLAY_BLOCK = `
## Deterministic Governance Overlay

This system loads and adheres to SOUL.deterministic.md as a governing philosophical constraint.
`;

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function ensureDir(p) {
  if (!DRY_RUN) {
    fs.mkdirSync(p, { recursive: true });
  }
}

function writeFile(p, content) {
  if (DRY_RUN) {
    console.log(`[DRY-RUN] Would write: ${p}`);
    return;
  }
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content);
}

function copyWithVersionStamp(templatePath, targetPath) {
  const versionStamp = `<!-- Installed by openclaw-deterministic v${pkg.version} -->\n`;
  const content = fs.readFileSync(templatePath, "utf8");
  const stamped = versionStamp + content;

  if (DRY_RUN) {
    console.log(`[DRY-RUN] Would install: ${targetPath}`);
  }

  writeFile(targetPath, stamped);
}

function timestamp() {
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

function installTemplates() {
  copyWithVersionStamp(tpl("OPERATING_RULES.md"), target.operating);
  copyWithVersionStamp(tpl("SOUL.deterministic.md"), target.detSoul);
  copyWithVersionStamp(tpl("memory-compactor.SKILL.md"), target.compactor);
}

function bootstrapSoulIfMissing() {
  if (exists(target.soul)) {
    console.log("User SOUL.md exists — NOT modified.");
    return;
  }

  console.log("No SOUL.md detected — bootstrapping fresh SOUL.md with deterministic overlay.");

  if (DRY_RUN) {
    console.log("[DRY-RUN] Would create SOUL.md with deterministic overlay.");
    return;
  }

  writeFile(target.soul, OVERLAY_BLOCK.trim() + "\n");
  console.log("Created: SOUL.md (deterministic overlay enabled by default)");
}

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
} else {
  console.log("Creating deterministic backup snapshot...");
}

const snap = backupSnapshot([
  target.operating,
  target.detSoul,
  target.soul,
  target.compactor,
]);

if (snap) {
  console.log(`Backup location: ${snap}`);
}

installTemplates();
bootstrapSoulIfMissing();

if (DRY_RUN) {
  console.log("\nDry-run complete. No changes were written.\n");
} else {
  console.log("\nDeterministic governance installed successfully.\n");
}

process.exit(0);
