#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const pkg = require("../package.json");

const HOME = process.env.HOME;
const openclawRoot = path.join(HOME, ".openclaw");
const workspace = path.join(openclawRoot, "workspace");

const files = {
  operating: path.join(workspace, "OPERATING_RULES.md"),
  detSoul: path.join(workspace, "SOUL.deterministic.md"),
  soul: path.join(workspace, "SOUL.md"),
  compactor: path.join(workspace, "skills", "memory-compactor", "SKILL.md"),
};

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function versionFromFile(content) {
  const match = content.match(/Installed by openclaw-deterministic v([0-9.]+)/);
  return match ? match[1] : null;
}

function checkVersion(filePath, label) {
  if (!exists(filePath)) {
    console.log(`❌ ${label} missing.`);
    return;
  }

  const content = read(filePath);
  const version = versionFromFile(content);

  if (!version) {
    console.log(`⚠ ${label} version stamp missing.`);
    return;
  }

  if (version === pkg.version) {
    console.log(`✅ ${label} version matches CLI (${version})`);
  } else {
    console.log(`⚠ ${label} version mismatch (installed ${version}, CLI ${pkg.version})`);
  }
}

function overlayEnabled() {
  if (!exists(files.soul)) return false;
  const content = read(files.soul);
  return content.includes("SOUL.deterministic.md");
}

function estimateSemanticTokens() {
  const semanticPath = path.join(
    openclawRoot,
    "workspace",
    "memory",
    "semantic",
    "openclaw.md"
  );

  if (!exists(semanticPath)) return 0;

  const content = read(semanticPath);
  return Math.ceil(content.length / 4);
}

console.log("\nRunning deterministic doctor...\n");

if (!exists(openclawRoot)) {
  console.log("❌ OpenClaw directory not found.");
  process.exit(1);
}

if (!exists(workspace)) {
  console.log("❌ Workspace missing.");
  process.exit(1);
}

checkVersion(files.operating, "OPERATING_RULES.md");
checkVersion(files.detSoul, "SOUL.deterministic.md");
checkVersion(files.compactor, "memory-compactor SKILL.md");

if (exists(files.soul)) {
  console.log("✅ SOUL.md present.");
  if (overlayEnabled()) {
    console.log("✅ Deterministic overlay ENABLED in SOUL.md.");
  } else {
    console.log("⚠ Deterministic overlay NOT enabled in SOUL.md.");
  }
} else {
  console.log("⚠ SOUL.md not found.");
}

const semanticTokens = estimateSemanticTokens();
console.log(`\nSemantic memory tokens (est): ${semanticTokens}`);

if (semanticTokens > 1200) {
  console.log("❌ Semantic memory exceeds HARD_LIMIT (1200).");
} else if (semanticTokens > 1020) {
  console.log("⚠ Semantic memory above risk threshold (1020).");
} else {
  console.log("✅ Semantic memory within safe bounds.");
}

console.log("\nDoctor complete.\n");
process.exit(0);
