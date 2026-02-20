#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const OPENCLAW_DIR = path.join(os.homedir(), ".openclaw");
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, "workspace");
const BACKUP_ROOT = path.join(OPENCLAW_DIR, "backups", "deterministic");

// Remove the first argument ("revert")
const args = process.argv.slice(3);

function listBackups() {
  if (!fs.existsSync(BACKUP_ROOT)) {
    console.log("No backups found.");
    return;
  }

  const dirs = fs.readdirSync(BACKUP_ROOT);
  if (dirs.length === 0) {
    console.log("No backups found.");
    return;
  }

  console.log("Available backups:");
  dirs.forEach(d => console.log(`- ${d}`));
}

function restoreBackup(timestamp) {
  const backupDir = path.join(BACKUP_ROOT, timestamp);

  if (!fs.existsSync(backupDir)) {
    console.log("Backup not found.");
    process.exit(1);
  }

  const files = fs.readdirSync(backupDir);

  files.forEach(file => {
    const src = path.join(backupDir, file);
    const dest = path.join(WORKSPACE_DIR, file);

    fs.copyFileSync(src, dest);
    console.log(`Restored: ${file}`);
  });

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
