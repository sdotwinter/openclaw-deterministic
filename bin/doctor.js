#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const HOME = process.env.HOME;
const workspace = path.join(HOME, ".openclaw", "workspace");

const files = {
  operating: path.join(workspace, "OPERATING_RULES.md"),
  soul: path.join(workspace, "SOUL.md"),
  deterministicSoul: path.join(workspace, "SOUL.deterministic.md"),
  skill: path.join(workspace, "skills", "memory-compactor", "SKILL.md"),
  semantic: path.join(workspace, "memory", "semantic", "openclaw.md"),
};

const MARKER = "## Deterministic Governance Overlay";
const HARD_LIMIT = 1200;
const RISK_THRESHOLD = 1020;

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function tokenEstimate(text) {
  if (!text) return 0;
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

console.log("\nRunning deterministic doctor...\n");

// File checks
console.log(exists(files.operating)
  ? "✅ OPERATING_RULES.md present."
  : "❌ OPERATING_RULES.md missing.");

console.log(exists(files.deterministicSoul)
  ? "✅ SOUL.deterministic.md present."
  : "❌ SOUL.deterministic.md missing.");

console.log(exists(files.skill)
  ? "✅ memory-compactor SKILL.md present."
  : "❌ memory-compactor SKILL.md missing.");

// Activation check
if (exists(files.soul)) {
  const soulContent = fs.readFileSync(files.soul, "utf8");
  if (soulContent.includes(MARKER)) {
    console.log("✅ Deterministic overlay ENABLED.");
  } else {
    console.log("⚠ Deterministic overlay installed but NOT enabled.");
  }
} else {
  console.log("❌ SOUL.md missing.");
}

// Semantic memory health
if (exists(files.semantic)) {
  const semanticContent = fs.readFileSync(files.semantic, "utf8");
  const tokens = tokenEstimate(semanticContent);

  console.log(`\nSemantic memory tokens (est): ${tokens}`);

  if (tokens > HARD_LIMIT) {
    console.log("🚨 ABOVE HARD LIMIT (Tier C enforced).");
  } else if (tokens > RISK_THRESHOLD) {
    console.log("⚠ Near risk threshold (85%).");
  } else {
    console.log("✅ Semantic memory within safe bounds.");
  }
} else {
  console.log("\nℹ No semantic memory file detected.");
}

console.log("\nDoctor complete.\n");

process.exit(0);
