# OpenClaw Deterministic (OCD)

Deterministic governance, memory discipline, and integrity enforcement framework for OpenClaw.

OpenClaw Deterministic transforms OpenClaw into a predictable, auditable execution system suitable for long-running agent deployments and CI environments.

This is not an assistant plugin.

It is a governance layer.

---

## Installation

Install globally:

```bash
npm install -g @sdotwinter/openclaw-deterministic
```

Add to your PATH (optional but recommended):

```bash
export PATH="$PATH:$(npm root -g)/@sdotwinter/openclaw-deterministic/bin"
```

Or create a symlink:

```bash
sudo ln -s $(npm root -g)/@sdotwinter/openclaw-deterministic/bin/oc-deterministic /usr/local/bin/
```

Apply deterministic governance to an existing OpenClaw workspace:

```bash
oc-deterministic install
```

Verify installation:

```bash
oc-deterministic doctor
```

Concise health summary (CI-friendly):

```bash
oc-deterministic status
```

---

## Safety Guarantees

OpenClaw Deterministic enforces execution discipline with explicit safety guarantees:

- Does not overwrite an existing SOUL.md
- Verifies canonical integrity before upgrade
- Refuses to upgrade drifted files (unless --force)
- Creates deterministic backup snapshots before mutation
- Supports structured revert to previous snapshot
- Exposes machine-readable health status
- Blocks silent structural mutation

This system assumes drift is inevitable.

It makes drift visible.

---

## What This Solves

AI systems drift over time:

- Memory growth
- File mutation
- Execution misclassification
- Configuration divergence
- Contract ambiguity

OpenClaw Deterministic enforces:

- Explicit execution tiers
- Canonical template integrity verification
- Semantic memory limits
- Config-driven thresholds
- Governance event logging
- Structured health reporting

The objective:

Predictable execution under defined constraints.

---

## Core Concepts

### Deterministic Execution Tiers

Execution is classified into:

Tier A — Safe  
Tier B — Governed Modification  
Tier C — Destructive / Structural  

Each tier defines:

- Whether a diff preview is required
- Whether confirmation is required
- Whether auto-execution is allowed

This prevents silent behavioral drift.

---

### Canonical Template Integrity

Deterministic templates embed canonical SHA256 hashes.

doctor verifies:

- Template presence
- Version alignment
- Canonical integrity

If a file is manually edited outside deterministic flow, the system detects it.

Tamper visibility is enforced.

---

### Upgrade Integrity Gate

oc-deterministic upgrade:

- Verifies canonical integrity before applying changes
- Refuses overwrite if drift is detected
- Supports --force override
- Supports --dry-run

Upgrade is governed mutation — not blind overwrite.

---

### Deterministic Backup + Revert

Before template mutation:

Snapshots are stored at:

~/.openclaw/backups/deterministic/<timestamp>/

Revert commands:

oc-deterministic revert --list  
oc-deterministic revert --to <timestamp>

Revert restores deterministic files from snapshot.

This enables safe experimentation without state loss.

---

### Semantic Memory Governance

Semantic memory is:

- Token-estimated
- Compared against configurable HARD_LIMIT
- Evaluated against risk thresholds
- Logged on violation

Configuration file:

~/.openclaw/.deterministic.json

Example:

```json
{
  "semantic": {
    "HARD_LIMIT": 1200,
    "RISK_THRESHOLD_PERCENT": 85
  },
  "governance": {
    "violation_logging": true
  }
}
```

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
- CI integration via exit codes

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

If you want experimentation, use OpenClaw alone.

If you want discipline, use OpenClaw Deterministic.

---

## Philosophy

Determinism over autonomy.

No silent behavior changes.

Explicit classification before execution.

Auditable state at all times.

---

## License

MIT
