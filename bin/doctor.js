#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const HOME = process.env.HOME;
const workspace = path.join(HOME, ".openclaw", "workspace");

const paths = {
  operating: path.join(workspace, "OPERATING_RULES.md"),
  soul: path.join(workspace, "SOUL.md"),
  detSoul: path.join(workspace, "SOUL.deterministic.md"),
  compactor: path.join(workspace, "skills", "memory-compactor", "SKILL.md"),
  semantic: path.join(workspace, "memory", "semantic", "openclaw.md"),
};

const MARKER_OVERLAY = "## Deterministic Governance Overlay";
const MARKER_OPERATING_CANON = "Deterministic Execution Contract — Hardened Overlay";
const MARKER_DETSOUL_CANON = "Deterministic Governance Overlay — Canonical";
const MARKER_COMPACTOR_CANON = "## Hybrid Trigger Model";

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

function read(p) {
  return fs.readFileSync(p, "utf8");
}

// cheap, consistent estimate (good enough for thresholds)
function tokenEstimate(text) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(words * 1.3);
}

function ok(msg) { console.log(`✅ ${msg}`); }
function warn(msg) { console.log(`⚠ ${msg}`); }
function fail(msg) { console.log(`❌ ${msg}`); }

console.log("\nRunning deterministic doctor...\n");

// --- Presence checks
exists(paths.operating) ? ok("OPERATING_RULES.md present.") : fail("OPERATING_RULES.md missing.");
exists(paths.detSoul) ? ok("SOUL.deterministic.md present.") : fail("SOUL.deterministic.md missing.");
exists(paths.compactor) ? ok("memory-compactor SKILL.md present.") : fail("memory-compactor SKILL.md missing.");
exists(paths.soul) ? ok("SOUL.md present.") : fail("SOUL.md missing.");

// If core files are missing, stop early (still exit cleanly)
if (!exists(paths.operating) || !exists(paths.detSoul) || !exists(paths.compactor) || !exists(paths.soul)) {
  console.log("\nDoctor complete (incomplete install).\n");
  process.exit(0);
}

// --- Activation checks
const soul = read(paths.soul);
if (soul.includes(MARKER_OVERLAY)) ok("Deterministic overlay ENABLED in SOUL.md.");
else warn("Deterministic overlay installed but NOT enabled (run: oc-deterministic enable).");

// --- Integrity checks (cross-file coherence)
const operating = read(paths.operating);
if (operating.includes(MARKER_OPERATING_CANON)) ok("OPERATING_RULES.md matches canonical marker.");
else warn("OPERATING_RULES.md marker missing (file may be customized or outdated).");

if (operating.includes("SOUL.deterministic.md")) ok("OPERATING_RULES.md references SOUL.deterministic.md.");
else warn("OPERATING_RULES.md does not reference SOUL.deterministic.md (recommended).");

const detSoul = read(paths.detSoul);
if (detSoul.includes(MARKER_DETSOUL_CANON)) ok("SOUL.deterministic.md matches canonical marker.");
else warn("SOUL.deterministic.md marker missing (file may be customized or outdated).");

const compactor = read(paths.compactor);
if (compactor.includes(MARKER_COMPACTOR_CANON)) ok("memory-compactor includes Hybrid Trigger Model.");
else warn("memory-compactor missing Hybrid Trigger Model marker (skill may be outdated).");

// --- Semantic health
if (exists(paths.semantic)) {
  const semantic = read(paths.semantic);
  const tokens = tokenEstimate(semantic);

  console.log(`\nSemantic memory tokens (est): ${tokens}`);

  if (tokens > HARD_LIMIT) {
    warn("ABOVE HARD LIMIT (Tier C enforced for semantic operations).");
  } else if (tokens > RISK_THRESHOLD) {
    warn("Near risk threshold (85%). Semantic appends should behave as Tier C per compactor rules.");
  } else {
    ok("Semantic memory within safe bounds.");
  }
} else {
  console.log("\nℹ No semantic memory file detected (ok).");
}

console.log("\nDoctor complete.\n");
process.exit(0);
