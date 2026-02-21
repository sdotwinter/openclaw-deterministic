#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const OPENCLAW_DIR = path.join(os.homedir(), ".openclaw");
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, "workspace");
const BACKUP_ROOT = path.join(OPENCLAW_DIR, "backups", "deterministic");

const args = process.argv.slice(3);

function listBackups() {
  if (!fs.existsSync(BACKUP_ROOT)) {
    console.log("No backups found.");
    return;
  }

  const dirs = fs.readdirSync(BACKUP_ROOT);
  if (!dirs.length) {
    console.log("No backups found.");
    return;
  }

  console.log("Available backups:");
  dirs.forEach(d => console.log(`- ${d}`));
}

function restoreDirectoryRecursive(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  entries.forEach(entry => {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      restoreDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Restored: ${path.relative(WORKSPACE_DIR, destPath)}`);
    }
  });
}

function restoreBackup(timestamp) {
  // Validate timestamp format (ISO-like: YYYY-MM-DDTHH-MM-SS.mmmZ)
  const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z$/;
  if (!timestampRegex.test(timestamp)) {
    console.error(`Invalid timestamp format: ${timestamp}`);
    console.error("Expected format: 2026-02-21T04-43-51.094Z");
    console.error("Use 'oc-deterministic revert --list' to see available backups.");
    process.exit(1);
  }

  const backupDir = path.join(BACKUP_ROOT, timestamp);

  if (!fs.existsSync(backupDir)) {
    console.error(`Backup not found: ${timestamp}`);
    console.error("Use 'oc-deterministic revert --list' to see available backups.");
    process.exit(1);
  }

  restoreDirectoryRecursive(backupDir, WORKSPACE_DIR);

  console.log("Revert complete.");
}

if (args[0] === "--list") {
  listBackups();
} else if (args[0] === "--to" && args[1]) {
  restoreBackup(args[1]);
} else {
  console.log("Usage:");
  console.log("  oc-deterministic revert --list");
  console.log("  oc-deterministic revert --to <timestamp>");
}
