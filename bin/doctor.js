#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const HOME = os.homedir();
const OPENCLAW_DIR = path.join(HOME, ".openclaw");
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, "workspace");

console.log("Running deterministic doctor...\n");

if (!fs.existsSync(OPENCLAW_DIR)) {
  console.log("❌ ~/.openclaw not found.");
  process.exit(1);
}

if (!fs.existsSync(WORKSPACE_DIR)) {
  console.log("❌ workspace not found.");
  process.exit(1);
}

console.log("✅ OpenClaw directory detected.");
console.log("✅ Workspace detected.");

const hasOperating = fs.existsSync(
  path.join(WORKSPACE_DIR, "OPERATING_RULES.md")
);

const hasSkill = fs.existsSync(
  path.join(WORKSPACE_DIR, "skills", "memory-compactor", "SKILL.md")
);

console.log(
  hasOperating
    ? "✅ OPERATING_RULES.md present."
    : "⚠️ OPERATING_RULES.md missing."
);

console.log(
  hasSkill
    ? "✅ memory-compactor skill present."
    : "⚠️ memory-compactor skill missing."
);

console.log("\nDoctor complete.");
