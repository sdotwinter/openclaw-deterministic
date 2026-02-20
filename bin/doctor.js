#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const JSON_MODE = process.argv.includes("--json");

const pkg = require(path.join(__dirname, "..", "package.json"));
const CLI_VERSION = pkg.version;

const DEFAULT_HARD_LIMIT = 1200;
const DEFAULT_RISK_PERCENT = 85;

const home = os.homedir();
const openclawRoot = path.join(home, ".openclaw");
const workspace = path.join(openclawRoot, "workspace");

const paths = {
  operating: path.join(workspace, "OPERATING_RULES.md"),
  detSoul: path.join(workspace, "SOUL.deterministic.md"),
  soul: path.join(workspace, "SOUL.md"),
  compactor: path.join(workspace, "skills", "memory-compactor", "SKILL.md"),
  semantic: path.join(workspace, "memory", "semantic", "openclaw.md"),
  config: path.join(openclawRoot, ".deterministic.json"),
};

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function readJsonSafe(p) {
  try {
    if (!exists(p)) return null;
    return JSON.parse(read(p));
  } catch {
    return { __invalid: true };
  }
}

function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

function getLimits(cfg) {
  const hard = cfg?.semantic?.HARD_LIMIT;
  const pct = cfg?.semantic?.RISK_THRESHOLD_PERCENT;

  const HARD_LIMIT = Number.isFinite(hard) ? hard : DEFAULT_HARD_LIMIT;
  const PERCENT = Number.isFinite(pct) ? pct : DEFAULT_RISK_PERCENT;
  const RISK_THRESHOLD = Math.floor((HARD_LIMIT * PERCENT) / 100);

  return { HARD_LIMIT, RISK_THRESHOLD, PERCENT };
}

function appendGovernanceEvent(event) {
  try {
    const episodicDir = path.join(workspace, "memory", "episodic");
    if (!exists(episodicDir)) return;

    const file = path.join(
      episodicDir,
      `governance-${new Date().toISOString().slice(0, 10)}.md`
    );

    const entry = `
## Governance Event — ${new Date().toISOString()}

Type: ${event.type}
Details: ${event.details}

---
`;

    fs.appendFileSync(file, entry);
  } catch {
    // never crash doctor
  }
}

function evaluate() {
  const result = {
    cliVersion: CLI_VERSION,
    openclawDetected: exists(openclawRoot),
    workspaceDetected: exists(workspace),
  };

  if (!result.openclawDetected || !result.workspaceDetected) {
    return result;
  }

  result.files = {
    operating: exists(paths.operating),
    detSoul: exists(paths.detSoul),
    compactor: exists(paths.compactor),
    soul: exists(paths.soul),
  };

  const cfg = readJsonSafe(paths.config);

  result.config = {
    present: exists(paths.config),
    invalid: cfg?.__invalid === true,
  };

  const limits = getLimits(cfg);

  result.limits = limits;

  if (exists(paths.semantic)) {
    const tokens = estimateTokens(read(paths.semantic));
    result.semanticTokens = tokens;

    if (tokens > limits.HARD_LIMIT) {
      result.semanticStatus = "hard-limit-exceeded";

      appendGovernanceEvent({
        type: "semantic-hard-limit",
        details: `Tokens ${tokens} > HARD_LIMIT ${limits.HARD_LIMIT}`,
      });

    } else if (tokens > limits.RISK_THRESHOLD) {
      result.semanticStatus = "risk-threshold";

      appendGovernanceEvent({
        type: "semantic-risk-threshold",
        details: `Tokens ${tokens} > RISK_THRESHOLD ${limits.RISK_THRESHOLD}`,
      });

    } else {
      result.semanticStatus = "safe";
    }
  } else {
    result.semanticTokens = 0;
    result.semanticStatus = "safe";
  }

  return result;
}

function printHuman(r) {
  console.log("\nRunning deterministic doctor...\n");

  if (!r.openclawDetected) {
    console.log("❌ OpenClaw not detected.");
    return;
  }

  if (!r.workspaceDetected) {
    console.log("❌ Workspace missing.");
    return;
  }

  console.log(`CLI version: ${r.cliVersion}\n`);

  for (const [key, present] of Object.entries(r.files)) {
    if (present) {
      console.log(`✅ ${key} present.`);
    } else {
      console.log(`⚠ ${key} missing.`);
    }
  }

  if (!r.config.present) {
    console.log("⚠ Deterministic config missing. Using defaults.");
  } else if (r.config.invalid) {
    console.log("⚠ Deterministic config invalid JSON. Using defaults.");
  } else {
    console.log(
      `✅ Config loaded. HARD_LIMIT=${r.limits.HARD_LIMIT}, ` +
      `RISK_THRESHOLD=${r.limits.RISK_THRESHOLD} (${r.limits.PERCENT}%)`
    );
  }

  console.log(`\nSemantic memory tokens (est): ${r.semanticTokens}`);

  if (r.semanticStatus === "hard-limit-exceeded") {
    console.log(`❌ Semantic memory exceeds HARD_LIMIT (${r.limits.HARD_LIMIT}).`);
  } else if (r.semanticStatus === "risk-threshold") {
    console.log(`⚠ Semantic memory above risk threshold (${r.limits.RISK_THRESHOLD}).`);
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
