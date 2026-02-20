# Memory Compactor Skill

## Hybrid Trigger Model

### Priority Order (evaluated in this order)
1. Semantic hard limit (>1200 tokens)
2. Semantic risk threshold (>1020 tokens = 85% of HARD_LIMIT)
3. Volume overload triggers
4. Weekly trigger

### Time-Based Trigger (Baseline)
- Cron: Every Sunday at 03:00 UTC (unchanged)
- **Dry-run first**: Weekly run must evaluate thresholds before executing
- **Execute only if thresholds met**
- If no thresholds met → exit cleanly with report

### Volume-Based Triggers
**Working tier triggers:**
- If ANY:
  - working/ file count > 10
  - OR working total tokens > 4000
  - OR oldest working file > 10 days
- Then: Classify as Tier B (governed by OPERATING_RULES.md)
- Classification must occur BEFORE extraction begins

**Episodic tier triggers:**
- If ANY:
  - episodic/ file count > 20
  - OR episodic total tokens > 8000
  - OR oldest episodic file > 45 days
- Then: Classify as Tier B (governed by OPERATING_RULES.md)
- Classification must occur BEFORE extraction begins

### Semantic Risk Trigger
- **RISK_THRESHOLD**: 85% of HARD_LIMIT = 1020 tokens
- If semantic/openclaw.md token count > RISK_THRESHOLD (1020):
  - Emit warning
  - Classify as Tier C (governed by OPERATING_RULES.md)
  - Require explicit APPROVED before semantic append
  - Do NOT auto-trim, do NOT auto-merge
  - Suggest semantic sharding in report
- If semantic > HARD_LIMIT (1200):
  - Block append
  - Classify as Tier C (governed by OPERATING_RULES.md)
  - Require explicit APPROVED before any semantic operation
  - Do not proceed automatically

### Drift Prevention
- ⛔ No automatic semantic trimming
- ⛔ No destructive edits
- ⛔ No duplicate auto-merge
- ⛔ No execution-tier logic (delegated to OPERATING_RULES.md)
- ⛔ No bypass of unified diff requirement
- ⛔ No bypass of cooldown
- ⛔ No change to archive behavior
- ⛔ No change to append-only discipline

### Classification Rules
- Working → episodic: Classify as Tier B before extraction
- Episodic → semantic (below risk): Classify as Tier B before extraction
- Episodic → semantic (above risk): Classify as Tier C, require APPROVED
- Semantic > hard limit: Classify as Tier C, block automatic execution
- Gateway exec approvals remain external per OPERATING_RULES.md

### Reporting Requirements
All compaction runs must report:
- Working file count | Working total tokens | Oldest working file age
- Episodic file count | Episodic total tokens | Oldest episodic file age
- Semantic token count
- Thresholds evaluated (with actual values)
- Which trigger fired
- Tier classification applied
- Cooldown status
- If no action taken: Report reason explicitly

## Trigger
- Cron: Every Sunday at 03:00 UTC

## Purpose
Maintain tiered memory system by:
1. Compacting old working memory into episodic summaries
2. Extracting durable insights into semantic memory
3. Archiving raw files (never deleting)

## Enterprise Semantic Governance

### Soft + Hard Semantic Limits
- **Soft limit**: 900 tokens
- **Hard limit**: 1200 tokens
- If `semantic/openclaw.md` > 900 tokens: Emit warning
- If `semantic/openclaw.md` > 1200 tokens:
  - Block further semantic appends
  - Emit blocking warning
  - Require explicit confirmation before semantic compaction
  - Do NOT auto-trim

### Semantic Entry Schema (Required)
Before writing to semantic memory, enforce this structure:
```
Title: [Short descriptive heading]
Context: Brief situation description
Durable Insight: What permanently changed or was learned
Operational Impact: (Optional) What behavior or rule changed
```
- Reject raw summaries, conversational fragments, debug logs
- If schema not met: Abort semantic write, emit structured error

### Recursive Pollution Prevention
NEVER write to semantic memory:
- Governance rules, execution tier definitions, debug notes
- Approval logs, cron logs, diff previews, tool output
Semantic memory = durable system knowledge only.

### Duplicate Detection
Before appending: Check for similar Title (substring/fuzzy match)
- If duplicate: Emit warning, require confirmation
- Do NOT auto-merge

### Semantic Compaction Cooldown
- Store last compaction timestamp in `.memory-compactor-meta.json`
- If within 24 hours: Emit warning, require confirmation

### Append-Only Discipline Preserved
- Semantic append-only; no destructive edits without Tier C

## Tiers

| Tier | Location | Age | Purpose |
|------|----------|-----|---------|
| Working | `memory/working/` | 0-7 days | Active session context |
| Episodic | `memory/episodic/` | 7-30 days | Structured event summaries |
| Semantic | `memory/semantic/` | Permanent | Distilled knowledge |
| Archive | `memory/archive/` | 30+ years | Preserved raw files |

## Workflow

### 1. Identify Files to Compact
- Scan `memory/working/` for files older than 7 days
- Scan `memory/episodic/` for files older than 30 days
- Never touch files in `memory/semantic/` or `memory/archive/`

### 2. Summarize Working → Episodic
For each working file >7 days old:
- Read content
- Extract: key events, decisions, outcomes
- Write summary to `memory/episodic/[original-name]` with format:
  ```
  # Compiled: [original filename]
  ## Summary
  [3-5 bullet points of key events]
  ## Decisions
  [Any decisions made]
  ## Extracted Insights
  [Principles worth retaining]
  ```
- Move original to `memory/archive/[original-name]`

### 3. Extract to Semantic
For each episodic file >30 days:
- Review for durable principles
- Validate against schema
- Check for duplicates
- Check cooldown
- Check size limits
- Append notable insights to `memory/semantic/openclaw.md`
- Keep full episodic file in archive

### 3b. Validate Semantic Schema
- Must contain: Title, Context, Durable Insight
- If invalid: Abort write, report error

### 3c. Check for Duplicates
- Compare Title with existing Titles (substring/fuzzy)
- If duplicate: Emit warning, require confirmation

### 3d. Check Cooldown
- Read `.memory-compactor-meta.json` for lastCompactionAt
- If within 24 hours: Emit warning, require confirmation

### 3e. Check Size Limits
- Estimate tokens in semantic file
- If >900: Soft warning
- If >1200: Block append, hard warning, require confirmation

### 4. Maintain Semantic Memory
- `memory/semantic/openclaw.md` — OpenClaw operational learnings
- `memory/semantic/whatsapp-bot.md` — WhatsApp bot knowledge
- Append-only: never edit existing content
- Target: ≤900 tokens (soft), hard limit 1200 tokens

### 5. Archive (Never Delete)
- All compacted files go to `memory/archive/`
- Format: `[original-name]-[archived-YYYY-MM-DD].md`
- Never permanently delete

### 6. Update Cooldown Metadata
- After successful compaction, write timestamp to `.memory-compactor-meta.json`

## Safety Constraints
- ⛔ Never delete files without moving to archive/
- ⛔ Never compact files less than 7 days old
- ⛔ Never alter semantic memory (append-only)
- ⛔ Never compact files already in episodic/ to working/
- ⛔ Never write governance/debug/logs to semantic
- ⛔ Never bypass schema validation
- ⛔ Never ignore cooldown
- ✅ Always preserve full history in archive/
- ✅ Always enforce semantic entry schema
- ✅ Always check duplicate before append
- ✅ Always check size limits before append

## Output Format
After run, report:
```
🗑️ Memory Compaction Complete
📦 Working→Episodic: X files compacted
📚 Episodic→Semantic: Y insights extracted
📁 Archived: Z files moved

📊 Semantic Status:
   • Current size: ~X tokens
   • Soft limit (900): [OK/WARNING]
   • Hard limit (1200): [OK/WARNING]
   • Duplicate check: [PASS/WARNING]
   • Cooldown: [OK/WARNING]
```

## First Run
On first invocation, ask for confirmation before executing.
