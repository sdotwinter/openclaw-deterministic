#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const HOME = process.env.HOME;
const workspace = path.join(HOME, ".openclaw", "workspace");

const files = [
  {
    name: "OPERATING_RULES.md",
    installed: path.join(workspace, "OPERATING_RULES.md"),
    template: path.join(__dirname, "..", "templates", "OPERATING_RULES.md"),
  },
  {
    name: "SOUL.deterministic.md",
    installed: path.join(workspace, "SOUL.deterministic.md"),
    template: path.join(__dirname, "..", "templates", "SOUL.deterministic.md"),
  },
  {
    name: "memory-compactor SKILL.md",
    installed: path.join(workspace, "skills", "memory-compactor", "SKILL.md"),
    template: path.join(__dirname, "..", "templates", "memory-compactor.SKILL.md"),
  },
];

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

console.log("\nRunning deterministic audit...\n");

let driftFound = false;

for (const file of files) {
  if (!exists(file.installed)) {
    console.log(`❌ ${file.name} missing in workspace.`);
    driftFound = true;
    continue;
  }

  if (!exists(file.template)) {
    console.log(`❌ Template missing for ${file.name}.`);
    driftFound = true;
    continue;
  }

  try {
    const diff = execSync(
      `diff -u "${file.template}" "${file.installed}"`,
      { stdio: "pipe" }
    ).toString();

    if (diff.trim().length === 0) {
      console.log(`✅ ${file.name} matches template.`);
    } else {
      console.log(`⚠ Drift detected in ${file.name}:\n`);
      console.log(diff);
      driftFound = true;
    }
  } catch (err) {
    if (err.status === 1) {
      console.log(`⚠ Drift detected in ${file.name}:\n`);
      console.log(err.stdout.toString());
      driftFound = true;
    } else {
      console.log(`❌ Error auditing ${file.name}`);
      driftFound = true;
    }
  }
}

if (!driftFound) {
  console.log("\nNo drift detected. Files match canonical templates.");
} else {
  console.log("\nAudit complete. Drift detected.");
}

console.log("");
process.exit(0);
