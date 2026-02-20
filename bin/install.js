#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const HOME = os.homedir();
const OPENCLAW_DIR = path.join(HOME, ".openclaw");
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, "workspace");
const TEMPLATE_DIR = path.join(__dirname, "..", "templates");

function log(msg) {
  console.log(msg);
}

function exitWith(msg) {
  console.error(msg);
  process.exit(1);
}

function exists(p) {
  return fs.existsSync(p);
}

function ensureDir(p) {
  if (!exists(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

function copyFileSafe(src, dest) {
  if (!exists(dest)) {
    fs.copyFileSync(src, dest);
    log(`✅ Installed: ${path.basename(dest)}`);
  } else {
    log(`⚠️  Skipped (already exists): ${path.basename(dest)}`);
  }
}

function backupFile(filePath, backupDir) {
  if (!exists(filePath)) return;

  const filename = path.basename(filePath);
  const dest = path.join(backupDir, filename);
  fs.copyFileSync(filePath, dest);
  log(`🗂️  Backed up: ${filename}`);
}

function timestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, "-");
}

function validateWorkspace() {
  if (!exists(OPENCLAW_DIR)) {
    exitWith("❌ OpenClaw not detected.\nExpected directory: " + OPENCLAW_DIR);
  }

  if (!exists(WORKSPACE_DIR)) {
    exitWith("❌ OpenClaw workspace not detected.\nExpected directory: " + WORKSPACE_DIR);
  }
}

function runInstall() {
  log("Running deterministic install phase...\n");

  validateWorkspace();

  const backupDir = path.join(WORKSPACE_DIR, "_backup", timestamp());
  ensureDir(backupDir);

  // Backup important files if they exist
  backupFile(path.join(WORKSPACE_DIR, "OPERATING_RULES.md"), backupDir);
  backupFile(path.join(WORKSPACE_DIR, "SOUL.md"), backupDir);

  log("\n--- Installing Governance Files ---");

  // Install OPERATING_RULES.md (only if missing)
  const operatingSrc = path.join(TEMPLATE_DIR, "OPERATING_RULES.md");
  const operatingDest = path.join(WORKSPACE_DIR, "OPERATING_RULES.md");
  copyFileSafe(operatingSrc, operatingDest);

  log("\n--- Installing Memory Compactor Skill ---");

  const skillDir = path.join(WORKSPACE_DIR, "skills", "memory-compactor");
  ensureDir(skillDir);

  const skillSrc = path.join(TEMPLATE_DIR, "memory-compactor.SKILL.md");
  const skillDest = path.join(skillDir, "SKILL.md");
  copyFileSafe(skillSrc, skillDest);

  log("\n--- SOUL Installation Deferred ---");
  log("⚠️  SOUL.md not modified (manual merge required)");

  log("\n✅ Deterministic install complete.");
}

runInstall();
