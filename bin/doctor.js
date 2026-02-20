#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const pkg = require("../package.json");

const args = process.argv.slice(2);
const JSON_MODE = args.includes("--json");

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

function evaluateVersion(filePath) {
  if (!exists(filePath)) {
    return { status: "missing", version: null };
  }

  const content = read(filePath);
  const version = versionFromFile(content);

  if (!version) {
    return { status: "no-stamp", version: null };
  }

  if (version === pkg.version) {
    return { status: "match", version };
  }

  return { status: "mismatch", version };
}

function evaluate() {
  const result = {
    cliVersion: pkg.version,
    openclawDetected: exists(openclawRoot),
    workspaceDetected: exists(workspace),
    files: {},
    overlayEnabled: false,
    semanticTokens: 0,
    semanticStatus: "safe",
  };

  if (!result.openclawDetected || !result.workspaceDetected) {
    return result;
  }

  result.files.operating = evaluateVersion(files.operating);
  result.files.detSoul = evaluateVersion(files.detSoul);
  result.files.compactor = evaluateVersion(files.compactor);

  result.overlayEnabled = overlayEnabled();

  const tokens = estimateSemanticTokens();
  result.semanticTokens = tokens;

  if (tokens > 1200) {
    result.semanticStatus = "hard-limit-exceeded";
  } else if (tokens > 1020) {
    result.semanticStatus = "risk-threshold";
  } else {
    result.semanticStatus = "safe";
  }

  return result;
}

function printHuman(result) {
  console.log("\nRunning deterministic doctor...\n");

  if (!result.openclawDetected) {
    console.log("❌ OpenClaw directory not found.");
    process.exit(1);
  }

  if (!result.workspaceDetected) {
    console.log("❌ Workspace missing.");
    process.exit(1);
  }

  for (const [name, info] of Object.entries(result.files)) {
    const label =
      name === "operating"
        ? "OPERATING_RULES.md"
        : name === "detSoul"
        ? "SOUL.deterministic.md"
        : "memory-compactor SKILL.md";

    if (info.status === "missing") {
      console.log(`❌ ${label} missing.`);
    } else if (info.status === "no-stamp") {
      console.log(`⚠ ${label} version stamp missing.`);
    } else if (info.status === "mismatch") {
      console.log(
        `⚠ ${label} version mismatch (installed ${info.version}, CLI ${pkg.version})`
      );
    } else {
      console.log(`✅ ${label} version matches CLI (${info.version})`);
    }
  }

  console.log("✅ SOUL.md present.");
  console.log(
    result.overlayEnabled
      ? "✅ Deterministic overlay ENABLED in SOUL.md."
      : "⚠ Deterministic overlay NOT enabled in SOUL.md."
  );

  console.log(`\nSemantic memory tokens (est): ${result.semanticTokens}`);

  if (result.semanticStatus === "hard-limit-exceeded") {
    console.log("❌ Semantic memory exceeds HARD_LIMIT (1200).");
  } else if (result.semanticStatus === "risk-threshold") {
    console.log("⚠ Semantic memory above risk threshold (1020).");
  } else {
    console.log("✅ Semantic memory within safe bounds.");
  }

  console.log("\nDoctor complete.\n");
}

const result = evaluate();

if (JSON_MODE) {
  console.log(JSON.stringify(result, null, 2));

  if (!result.openclawDetected || !result.workspaceDetected) {
    process.exit(2);
  }

  if (result.semanticStatus === "hard-limit-exceeded") {
    process.exit(3);
  }

  process.exit(0);
}

printHuman(result);
process.exit(0);
