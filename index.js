// OpenClaw Deterministic - Entry point
// Re-exports CLI for programmatic use

module.exports = {
  doctor: require("./bin/doctor"),
  status: require("./bin/status"),
  install: require("./bin/install"),
  init: require("./bin/init"),
  enable: require("./bin/enable"),
  revert: require("./bin/revert"),
  audit: require("./bin/audit"),
  upgrade: require("./bin/upgrade"),
};
