#!/usr/bin/env node

const path = require("path");

const command = process.argv[2];

if (!command) {
  showHelp();
  process.exit(0);
}

if (command === "doctor") {
  require(path.join(__dirname, "doctor"));
} else if (command === "install") {
  require(path.join(__dirname, "install"));
} else if (command === "init") {
  require(path.join(__dirname, "init"));
} else if (command === "--version" || command === "-v") {
  // Keep this in sync with package.json version (manual for now)
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
  console.log("  oc-deterministic init");
  console.log("  oc-deterministic doctor");
  console.log("  oc-deterministic install");
  console.log("  oc-deterministic --version\n");
}
