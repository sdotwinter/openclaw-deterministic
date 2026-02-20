#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const pkg = require("../package.json");

const args = process.argv.slice(2);
const JSON_MODE = args.includes("--json");

const HOME = process.env.HOME;
const openclawRoot = path.join(HOME, ".openclaw");
const workspace = path.join(openclawRoot, "workspace");

const DEFAULT_HARD_LIMIT = 1200;
const DEFAULT_RISK_THRESHOLD = 1020;

const episodicLogPath = path.join(
  openclawRoot,
  "workspace",
  "memory",
  "episodic",
  "governance-log.md"
);

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

function appendGovernanceEvent(event) {
  try {
    const timestamp = new Date().toISOString();
    const entry = `\n---\nTime: ${timestamp}\nType: ${event.type}\nDetails: ${event.details}\n---\n`;

    fs.mkdirSync(path.dirname(episodicLogPath), { recursive: true });
    fs.appendFileSync(episodicLogPath, entry);
  } catch {
    // Logging must never crash doctor
  }
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

function parseHardLimit() {
  if (!exists(files.compactor)) return null;
  const content = read(files.compactor);
  const match = content.match(/HARD_LIMIT[^0-9]*([0-9]+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseRiskThreshold() {
  if (!exists(files.compactor)) return null;
  const content = read(files.compactor);
  const match = content.match(/RISK_THRESHOLD[^0-9]*([0-9]+)/);
  return match ? parseInt(match[1], 10) : null;
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
    limits: {
      hardLimitConfigured: null,
      riskThresholdConfigured: null,
      hardLimitDefault: DEFAULT_HARD_LIMIT,
      riskThresholdDefault: DEFAULT_RISK_THRESHOLD,
      coherent: true,
    },
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

  const hardLimit = parseHardLimit();
  const riskThreshold = parseRiskThreshold();

  result.limits.hardLimitConfigured = hardLimit;
  result.limits.riskThresholdConfigured = riskThreshold;

  if (hardLimit && hardLimit !== DEFAULT_HARD_LIMIT) {
    result.limits.coherent = false;
  }

  if (riskThreshold && riskThreshold !== DEFAULT_RISK_THRESHOLD) {
    result.limits.coherent = false;
  }

  const effectiveHardLimit = hardLimit || DEFAULT_HARD_LIMIT;
  const effectiveRiskThreshold = riskThreshold || DEFAULT_RISK_THRESHOLD;

  if (tokens > effectiveHardLimit) {
    result.semanticStatus = "hard-limit-exceeded";
  } else if (tokens > effectiveRiskThreshold) {
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
      appendGovernanceEvent({ type: "file-missing", details: label });
    } else if (info.status === "no-stamp") {
      console.log(`⚠ ${label} version stamp missing.`);
      appendGovernanceEvent({ type: "no-version-stamp", details: label });
    } else if (info.status === "mismatch") {
      console.log(
        `⚠ ${label} version mismatch (installed ${info.version}, CLI ${pkg.version})`
      );
      appendGovernanceEvent({
        type: "version-mismatch",
        details: `${label} installed ${info.version}, CLI ${pkg.version}`,
      });
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

  if (!result.limits.coherent) {
    console.log("⚠ Threshold configuration drift detected in SKILL.md.");
    appendGovernanceEvent({
      type: "threshold-drift",
      details: `HARD_LIMIT=${result.limits.hardLimitConfigured}, RISK_THRESHOLD=${result.limits.riskThresholdConfigured}`,
    });
  }

  console.log(`\nSemantic memory tokens (est): ${result.semanticTokens}`);

  if (result.semanticStatus === "hard-limit-exceeded") {
    console.log("❌ Semantic memory exceeds HARD_LIMIT.");
    appendGovernanceEvent({
      type: "semantic-hard-limit-exceeded",
      details: `Tokens=${result.semanticTokens}`,
    });
  } else if (result.semanticStatus === "risk-threshold") {
    console.log("⚠ Semantic memory above risk threshold.");
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
