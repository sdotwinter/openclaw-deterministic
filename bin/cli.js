#!/usr/bin/env node

const path = require("path");
const pkg = require("../package.json");

const command = process.argv[2];

if (!command) {
  showHelp();
  process.exit(0);
}

switch (command) {
  case "doctor":
    require(path.join(__dirname, "doctor"));
    break;

  case "install":
    require(path.join(__dirname, "install"));
    break;

  case "init":
    require(path.join(__dirname, "init"));
    break;

  case "enable":
    require(path.join(__dirname, "enable"));
    break;

  case "revert":
    require(path.join(__dirname, "revert"));
    break;

  case "--version":
  case "-v":
    console.log(`openclaw-deterministic v${pkg.version}`);
    process.exit(0);
    break;

  case "--help":
  case "-h":
    showHelp();
    process.exit(0);
    break;

  default:
    console.error(`Unknown command: ${command}\n`);
    showHelp();
    process.exit(1);
}

function showHelp() {
  console.log("\nOpenClaw Deterministic CLI\n");
  console.log("Usage:");
  console.log("  oc-deterministic init");
  console.log("  oc-deterministic doctor");
  console.log("  oc-deterministic install");
  console.log("  oc-deterministic enable");
  console.log("  oc-deterministic revert");
  console.log("  oc-deterministic --version");
  console.log("  oc-deterministic --help\n");
}
