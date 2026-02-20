#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const HOME = process.env.HOME;
const workspacePath = path.join(HOME, ".openclaw", "workspace");
const soulPath = path.join(workspacePath, "SOUL.md");

const MARKER = "## Deterministic Governance Overlay";
const OVERLAY_BLOCK = `
## Deterministic Governance Overlay

This system loads and adheres to SOUL.deterministic.md as a governing philosophical constraint.
`;

function fileExists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

if (!fileExists(workspacePath)) {
  console.error("OpenClaw workspace not found.");
  process.exit(1);
}

if (!fileExists(soulPath)) {
  console.log("No existing SOUL.md found.");
  console.log("Creating fresh SOUL.md with deterministic overlay...\n");
  fs.writeFileSync(soulPath, OVERLAY_BLOCK.trim() + "\n");
  console.log("SOUL.md created and deterministic overlay activated.");
  process.exit(0);
}

const current = fs.readFileSync(soulPath, "utf8");

if (current.includes(MARKER)) {
  console.log("Deterministic overlay already enabled. No changes made.");
  process.exit(0);
}

const updated = current.trimEnd() + "\n\n" + OVERLAY_BLOCK.trim() + "\n";

console.log("Proposed change to SOUL.md:\n");
console.log("---- BEGIN DIFF PREVIEW ----\n");
console.log("+ " + OVERLAY_BLOCK.trim().split("\n").join("\n+ "));
console.log("\n---- END DIFF PREVIEW ----\n");

console.log("Type APPROVED to apply this change:");

process.stdin.setEncoding("utf8");
process.stdin.once("data", (input) => {
  if (input.trim() !== "APPROVED") {
    console.log("Aborted. No changes made.");
    process.exit(0);
  }

  fs.writeFileSync(soulPath, updated);
  console.log("Deterministic overlay enabled successfully.");
  process.exit(0);
});
