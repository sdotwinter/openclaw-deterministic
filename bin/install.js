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
  const header =
`# Installed by openclaw-deterministic v${pkg.version}
# Installed at: ${new Date().toISOString()}

`;
  return header + content;
}

function backupFile(filePath, backupDir) {
  if (fs.existsSync(filePath)) {
    const fileName = path.basename(filePath);
    fs.copyFileSync(filePath, path.join(backupDir, fileName));
  }
}

function installFile(templateName, targetPath, backupDir) {
  const templatePath = path.join(TEMPLATES_DIR, templateName);

  if (!fs.existsSync(templatePath)) {
    console.error(`Template not found: ${templateName}`);
    process.exit(1);
  }

  backupFile(targetPath, backupDir);

  const templateContent = fs.readFileSync(templatePath, "utf8");
  const stampedContent = addHeader(templateContent);

  fs.writeFileSync(targetPath, stampedContent, "utf8");

  console.log(`Installed: ${targetPath}`);
}

function runInstall() {
  if (!fs.existsSync(OPENCLAW_DIR)) {
    console.error("OpenClaw directory not found.");
    console.error("Install OpenClaw first: npm i -g openclaw && openclaw onboard");
    process.exit(1);
  }

  ensureDir(WORKSPACE_DIR);
  ensureDir(BACKUP_ROOT);

  const backupDir = path.join(BACKUP_ROOT, timestamp());
  ensureDir(backupDir);

  console.log("Creating deterministic backup snapshot...");
  console.log(`Backup location: ${backupDir}`);

  // Install OPERATING_RULES.md
  installFile(
    "OPERATING_RULES.md",
    path.join(WORKSPACE_DIR, "OPERATING_RULES.md"),
    backupDir
  );

  // Install deterministic SOUL overlay
  installFile(
    "SOUL.deterministic.md",
    path.join(WORKSPACE_DIR, "SOUL.deterministic.md"),
    backupDir
  );

  // Install memory-compactor skill
  const skillsDir = path.join(WORKSPACE_DIR, "skills", "memory-compactor");
  ensureDir(skillsDir);

  installFile(
    "memory-compactor.SKILL.md",
    path.join(skillsDir, "SKILL.md"),
    backupDir
  );

  console.log("\nDeterministic governance installed successfully.");
  console.log("User SOUL.md was NOT modified.");
}

runInstall();
