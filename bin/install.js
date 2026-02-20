#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const HOME = process.env.HOME;
const openclawRoot = path.join(HOME, ".openclaw");
const workspace = path.join(openclawRoot, "workspace");
const backupsRoot = path.join(openclawRoot, "backups", "deterministic");

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
  try { fs.accessSync(p); return true; } catch { return false; }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function write(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content);
}

function copyFile(src, dst) {
  ensureDir(path.dirname(dst));
  fs.copyFileSync(src, dst);
}

function stamp() {
  return new Date().toISOString().replaceAll(":", "-");
}

function backupSnapshot(pathsToBackup) {
  ensureDir(backupsRoot);
  const snap = path.join(backupsRoot, stamp());
  ensureDir(snap);

  for (const p of pathsToBackup) {
    if (!exists(p)) continue;
    const rel = path.relative(openclawRoot, p); // keep structure
    const dst = path.join(snap, rel);
    ensureDir(path.dirname(dst));
    fs.copyFileSync(p, dst);
  }

  return snap;
}

function installTemplates() {
  copyFile(tpl("OPERATING_RULES.md"), target.operating);
  console.log("Installed: OPERATING_RULES.md");

  copyFile(tpl("SOUL.deterministic.md"), target.detSoul);
  console.log("Installed: SOUL.deterministic.md");

  copyFile(tpl("memory-compactor.SKILL.md"), target.compactor);
  console.log("Installed: skills/memory-compactor/SKILL.md");
}

function bootstrapSoulIfMissing() {
  if (exists(target.soul)) {
    console.log("User SOUL.md exists — NOT modified.");
    return;
  }

  console.log("No SOUL.md detected — bootstrapping fresh SOUL.md with deterministic overlay.");
  write(target.soul, OVERLAY_BLOCK.trim() + "\n");
  console.log("Created: SOUL.md (deterministic overlay enabled by default)");
}

if (!exists(openclawRoot)) {
  console.error("OpenClaw not found at ~/.openclaw");
  console.error("Install OpenClaw first, then rerun oc-deterministic install.");
  process.exit(1);
}

if (!exists(workspace)) {
  console.error("OpenClaw workspace missing at ~/.openclaw/workspace");
  console.error("OpenClaw may not be fully initialized. Run `openclaw onboard` then retry.");
  process.exit(1);
}

console.log("Creating deterministic backup snapshot...");
const snap = backupSnapshot([target.operating, target.detSoul, target.soul, target.compactor]);
console.log(`Backup location: ${snap}`);

installTemplates();
bootstrapSoulIfMissing();

console.log("\nDeterministic governance installed successfully.");
process.exit(0);
