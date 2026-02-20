#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const command = process.argv[2];

if (!command) {
  showHelp();
  process.exit(0);
}

if (command === "doctor") {
  runDoctor();
} else if (command === "install") {
  runInstall();
} else if (command === "--version" || command === "-v") {
  console.log("openclaw-deterministic v0.1.0");
  process.exit(0);
} else {
  console.error(`Unknown command: ${command}\n`);
  showHelp();
  process.exit(1);
}

function showHelp() {
  console.log("OpenClaw Deterministic CLI\n");
  console.log("Usage:");
  console.log("  oc-deterministic doctor");
  console.log("  oc-deterministic install");
  console.log("  oc-deterministic --version");
  console.log("");
}

function runDoctor() {
  console.log("Running workspace validation...\n");

  const homeDir = os.homedir();
  const openclawDir = path.join(homeDir, ".openclaw");
  const workspacePath = path.join(openclawDir, "workspace");

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
    process.exit(1);
  }
}

function runInstall() {
  console.log("Install logic not implemented yet.");
  process.exit(0);
}
