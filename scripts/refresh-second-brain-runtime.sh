#!/bin/zsh
set -euo pipefail
project_root="$(cd "$(dirname "$0")/.." && pwd)"
plugin_root="$project_root/local-marketplace/plugins/second-brain"
store_path="${MCP_STORE_PATH:?Set MCP_STORE_PATH to a local store before running this script}"
test -f "$plugin_root/plugin.json"
test -f "$plugin_root/.codex-plugin/plugin.json"
test -f "$store_path"
node --experimental-strip-types "$project_root/src/validate-runtime.ts"
print "Protocol validation passed. Fully quit and reopen ChatGPT Desktop, then begin a new chat and call get_runtime_diagnostics."
