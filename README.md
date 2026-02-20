# OpenClaw Deterministic

A deterministic execution, memory governance, and integrity enforcement framework for OpenClaw.

OpenClaw Deterministic enforces canonical template integrity, semantic memory limits, and execution discipline to transform OpenClaw into a predictable, auditable system suitable for long-running agent deployments.

This is not an assistant plugin.

It is a governance layer.

---

## Installation

Install globally:

npm install -g @sdotwinter/openclaw-deterministic

Then initialize governance inside your OpenClaw workspace:

oc-deterministic install

Verify installation:

oc-deterministic doctor

Concise health summary:

oc-deterministic status

---

## What This Solves

AI systems drift.

They drift in:
- Memory usage
- Execution classification
- File modification behavior
- Configuration alignment
- Contract integrity

OpenClaw Deterministic enforces:

- Explicit execution tiers
- Canonical template integrity verification
- Semantic memory limits
- Config-driven thresholds
- Governance event logging
- Structured machine-readable health reporting

The goal:

Predictable execution under defined constraints.

---

## Core Concepts

### Deterministic Execution Tiers

Execution is classified into three tiers:

Tier A — Safe  
Tier B — Governed Modification  
Tier C — Destructive / Structural  

Each tier defines:
- Whether diffs are required
- Whether confirmation is required
- Whether auto-execution is allowed

This prevents silent behavioral drift.

---

### Canonical Template Integrity

Deterministic templates embed canonical SHA256 hashes.

`doctor` verifies:

- Template presence
- Version alignment
- Canonical integrity

If a file is manually edited outside deterministic flow, the system detects it.

This enables tamper visibility.

---

### Semantic Memory Governance

Semantic memory is:

- Token-estimated
- Compared against configurable HARD_LIMIT
- Evaluated against risk thresholds
- Logged on violation

Configuration:

~/.openclaw/.deterministic.json

Example:

{
  "semantic": {
    "HARD_LIMIT": 1200,
    "RISK_THRESHOLD_PERCENT": 85
  },
  "governance": {
    "strict_mode": false,
    "violation_logging": true
  }
}

This prevents uncontrolled memory expansion.

---

### Observability

Available commands:

init  
install  
upgrade  
doctor  
doctor --json  
status  
enable  
revert  
audit  

Supports:

- Machine-readable JSON output
- Deterministic backup snapshots
- Governance event logging
- CI integration

---

## Upgrade Model

Templates are version-stamped.

Upgrade flow preserves:

- Backups
- Deterministic config
- User SOUL.md

Future releases include safe merge flows for template upgrades.

---

## Architecture

Governance operates at three layers:

1. Execution classification  
2. Memory pressure management  
3. Canonical integrity verification  

OpenClaw Deterministic does not replace OpenClaw.

It constrains it.

---

## Intended Use

Designed for:

- Production OpenClaw deployments
- Long-running agent systems
- CI-integrated governance
- Environments requiring auditability

If you need experimentation, use OpenClaw alone.

If you need discipline, use Deterministic.

---

## Philosophy

Determinism over autonomy.

No silent behavior changes.

Explicit classification before execution.

Auditable state at all times.

---

## License

MIT
