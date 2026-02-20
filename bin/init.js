#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");

const HOME = os.homedir();
const OPENCLAW_DIR = path.join(HOME, ".openclaw");
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, "workspace");

main().catch((err) => {
  console.error("\n❌ init failed:");
  console.error(err?.message || err);
  process.exit(1);
});

async function main() {
  console.log("oc-deterministic init (Level 3) starting...\n");

  // 0) Refuse to run if OpenClaw already initialized
  if (fs.existsSync(WORKSPACE_DIR)) {
    console.error("❌ OpenClaw workspace already exists:");
    console.error(`   ${WORKSPACE_DIR}`);
    console.error("\nUse:");
    console.error("  oc-deterministic doctor");
    console.error("  oc-deterministic install");
    process.exit(1);
  }

  // 1) Detect OpenClaw CLI
  const hasOpenclaw = commandExists("openclaw");
  if (!hasOpenclaw) {
    console.log("⚠️  OpenClaw CLI not found in PATH.");
    const yes = await confirm("Install OpenClaw now via npm? (y/N): ");
    if (!yes) {
      console.log("Aborted. Install OpenClaw manually, then re-run:");
      console.log("  oc-deterministic init");
      process.exit(1);
    }

    run("npm install -g openclaw");
  } else {
    console.log("✅ OpenClaw CLI detected.");
  }

  // 2) Onboard OpenClaw (creates ~/.openclaw/workspace etc.)
  console.log("\n--- Running OpenClaw onboarding ---");
  run("openclaw onboard");

  // 3) Verify workspace was created
  if (!fs.existsSync(WORKSPACE_DIR)) {
    console.error("\n❌ Expected OpenClaw workspace after onboard, but not found:");
    console.error(`   ${WORKSPACE_DIR}`);
    console.error("Check OpenClaw output above.");
    process.exit(1);
  }

  // 4) Apply deterministic layer (re-use your installer)
  console.log("\n--- Applying deterministic governance layer ---");
  run("oc-deterministic install");

  // 5) Final quick check
  console.log("\n--- Final validation ---");
  run("oc-deterministic doctor");

  console.log("\n✅ init complete.");
}

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function commandExists(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function confirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}
