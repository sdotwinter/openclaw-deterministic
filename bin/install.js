#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const pkg = require("../package.json");

const OPENCLAW_DIR = path.join(os.homedir(), ".openclaw");
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, "workspace");
const BACKUP_ROOT = path.join(OPENCLAW_DIR, "backups", "deterministic");

const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function timestamp() {
  return new Date().toISOString().replace(/:/g, "-");
}

function addHeader(content) {
  return (
    `# Installed by openclaw-deterministic v${pkg.version}\n` +
    `# Installed at: ${new Date().toISOString()}\n\n` +
    content
  );
}

function backupRelative(filePath, backupDir) {
  if (!fs.existsSync(filePath)) return;

  const relativePath = path.relative(WORKSPACE_DIR, filePath);
  const backupTarget = path.join(backupDir, relativePath);

  ensureDir(path.dirname(backupTarget));
  fs.copyFileSync(filePath, backupTarget);
}

function installFile(templateName, relativeTargetPath, backupDir) {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  const targetPath = path.join(WORKSPACE_DIR, relativeTargetPath);

  ensureDir(path.dirname(targetPath));

  backupRelative(targetPath, backupDir);

  const templateContent = fs.readFileSync(templatePath, "utf8");
  const stampedContent = addHeader(templateContent);

  fs.writeFileSync(targetPath, stampedContent, "utf8");

  console.log(`Installed: ${relativeTargetPath}`);
}

function runInstall() {
  if (!fs.existsSync(OPENCLAW_DIR)) {
    console.error("OpenClaw directory not found.");
    process.exit(1);
  }

  ensureDir(WORKSPACE_DIR);
  ensureDir(BACKUP_ROOT);

  const backupDir = path.join(BACKUP_ROOT, timestamp());
  ensureDir(backupDir);

  console.log("Creating deterministic backup snapshot...");
  console.log(`Backup location: ${backupDir}`);

  installFile("OPERATING_RULES.md", "OPERATING_RULES.md", backupDir);
  installFile("SOUL.deterministic.md", "SOUL.deterministic.md", backupDir);
  installFile(
    "memory-compactor.SKILL.md",
    path.join("skills", "memory-compactor", "SKILL.md"),
    backupDir
  );

  console.log("\nDeterministic governance installed successfully.");
  console.log("User SOUL.md was NOT modified.");
}

runInstall();
