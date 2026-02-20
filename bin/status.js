#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");

// Reuse doctor in JSON mode
const doctorPath = path.join(__dirname, "doctor");

const result = spawnSync("node", [doctorPath, "--json"], {
  encoding: "utf8",
});

if (result.error) {
  console.error("CRITICAL");
  console.error("Doctor execution failed.");
  process.exit(5);
}

let data;
try {
  data = JSON.parse(result.stdout);
} catch {
  console.error("CRITICAL");
  console.error("Doctor returned invalid JSON.");
  process.exit(6);
}

if (!data.openclawDetected || !data.workspaceDetected) {
  console.log("CRITICAL");
  console.log("OpenClaw not detected.");
  process.exit(2);
}

if (data.semanticStatus === "hard-limit-exceeded") {
  console.log("CRITICAL");
  console.log("Semantic HARD_LIMIT exceeded.");
  process.exit(3);
}

if (
  data.integrity &&
  Object.values(data.integrity).some(
    (x) => x.present && x.valid === false
  )
) {
  console.log("DEGRADED");
  console.log("Canonical integrity failure.");
  process.exit(4);
}

if (data.semanticStatus === "risk-threshold") {
  console.log("DEGRADED");
  console.log("Semantic above risk threshold.");
  process.exit(1);
}

console.log("OK");
process.exit(0);
