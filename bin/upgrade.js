#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

const pkg = require(path.join(__dirname, "..", "package.json"));
const CLI_VERSION = pkg.version;

const home = os.homedir();
const openclawRoot = path.join(home, ".openclaw");
const workspace = path.join(openclawRoot, "workspace");

const VERSION_REGEX = /Installed by openclaw-deterministic v([0-9.]+)/;

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

function upgradeFile(relPath) {
  const targetPath = path.join(workspace, relPath);
  const templatePath = path.join(__dirname, "..", "templates", relPath);

  if (!exists(targetPath)) return;

  const installed = read(targetPath);
  const template = read(templatePath);

  const installedVersion = getInstalledVersion(installed);

  if (installedVersion === CLI_VERSION) {
    console.log(`✓ ${relPath} already up to date.`);
    return;
  }

  console.log(`Upgrading ${relPath} from v${installedVersion} → v${CLI_VERSION}`);

  const stamped = `<!-- Installed by openclaw-deterministic v${CLI_VERSION} -->\n${template}`;

  write(targetPath, stamped);
}

if (!exists(openclawRoot) || !exists(workspace)) {
  console.error("OpenClaw workspace not found.");
  process.exit(1);
}

console.log(`Running deterministic upgrade → CLI v${CLI_VERSION}\n`);

files.forEach(upgradeFile);

console.log("\nUpgrade complete.\n");
process.exit(0);
