#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

console.log("OpenClaw Deterministic validator starting...\n");

const homeDir = os.homedir();
const openclawDir = path.join(homeDir, ".openclaw");
const workspacePath = path.join(openclawDir, "workspace");

// --- Detection Phase ---

if (!fs.existsSync(openclawDir)) {
  console.error("❌ OpenClaw not detected.");
  console.error(`Expected directory: ${openclawDir}`);
  process.exit(1);
}

if (!fs.existsSync(workspacePath)) {
  console.error("⚠️ OpenClaw detected but workspace missing.");
  console.error(`Expected workspace at: ${workspacePath}`);
  process.exit(1);
}

console.log("✅ OpenClaw workspace detected.\n");

// --- Validation Phase ---

const checks = [
  { label: "memory/", path: path.join(workspacePath, "memory") },
  { label: "memory/working/", path: path.join(workspacePath, "memory", "working") },
  { label: "memory/episodic/", path: path.join(workspacePath, "memory", "episodic") },
  { label: "memory/semantic/", path: path.join(workspacePath, "memory", "semantic") },
  { label: "skills/", path: path.join(workspacePath, "skills") },
  { label: "skills/memory-compactor/", path: path.join(workspacePath, "skills", "memory-compactor") },
  { label: "OPERATING_RULES.md", path: path.join(workspacePath, "OPERATING_RULES.md") }
];

let allGood = true;

console.log("Workspace validation report:\n");

checks.forEach(item => {
  if (fs.existsSync(item.path)) {
    console.log(`✔ ${item.label}`);
  } else {
    console.log(`✖ ${item.label} (missing)`);
    allGood = false;
  }
});

console.log("");

if (allGood) {
  console.log("✅ Workspace structure is valid.");
  process.exit(0);
} else {
  console.log("⚠️ Workspace structure incomplete.");
  console.log("Run installer to repair structure (future phase).");
  process.exit(1);
}
