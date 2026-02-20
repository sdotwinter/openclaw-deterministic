#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const pkg = require("../package.json");

const OPENCLAW_DIR = path.join(os.homedir(), ".openclaw");
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, "workspace");

function checkFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Missing: ${label}`);
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  if (!content.includes("Installed by openclaw-deterministic")) {
    console.log(`⚠️  ${label} exists but is not deterministic-managed.`);
    return;
  }

  if (!content.includes(`v${pkg.version}`)) {
    console.log(`⚠️  ${label} version drift detected.`);
    return;
  }

  console.log(`✅ ${label} OK (v${pkg.version})`);
}

function runDoctor() {
  console.log("Running deterministic doctor...\n");

  if (!fs.existsSync(OPENCLAW_DIR)) {
    console.log("❌ OpenClaw not installed.");
    process.exit(1);
  }

  checkFile(
    path.join(WORKSPACE_DIR, "OPERATING_RULES.md"),
    "OPERATING_RULES.md"
  );

  checkFile(
    path.join(WORKSPACE_DIR, "SOUL.deterministic.md"),
    "SOUL.deterministic.md"
  );

  checkFile(
    path.join(WORKSPACE_DIR, "skills", "memory-compactor", "SKILL.md"),
    "memory-compactor SKILL.md"
  );

  console.log("\nDoctor complete.");
}

runDoctor();
