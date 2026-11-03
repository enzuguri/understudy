#!/bin/sh
set -eu

log() {
  echo "[understudy-brain-mcp] $*" >&2
}

resolve_brain_dir() {
  if [ -n "${UNDERSTUDY_BRAIN:-}" ]; then
    log "Using UNDERSTUDY_BRAIN=${UNDERSTUDY_BRAIN}"
    printf '%s\n' "$UNDERSTUDY_BRAIN"
    return
  fi

  config="${HOME}/.config/understudy/config"
  if [ -f "$config" ]; then
    brain_line=$(grep -E '^brain=' "$config" 2>/dev/null | head -1 || true)
    if [ -n "$brain_line" ]; then
      dir=${brain_line#brain=}
      log "Using brain= from ${config}: ${dir}"
      printf '%s\n' "$dir"
      return
    fi
  fi

  default_brain="${HOME}/.understudy/brain"
  if [ -d "$default_brain" ]; then
    log "Using ${default_brain}"
    printf '%s\n' "$default_brain"
    return
  fi

  if [ -d "./.brain" ]; then
    log "Using ./.brain (cwd=$(pwd))"
    printf '%s\n' "./.brain"
    return
  fi

  log "No brain configured; creating ${default_brain}"
  mkdir -p "$default_brain"
  if [ ! -f "${default_brain}/README.md" ]; then
    cat >"${default_brain}/README.md" <<'EOF'
# Understudy brain

No brain is configured yet. Run Understudy's brain setup to connect your knowledge base.
EOF
  fi
  printf '%s\n' "$default_brain"
}

brain_dir=$(resolve_brain_dir)
log "Starting mcpvault read-only on: ${brain_dir}"
exec npx -y @bitbonsai/mcpvault@latest "$brain_dir" --read-only
