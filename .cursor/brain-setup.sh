#!/bin/sh
# brain-setup.sh: shallow, read-only copy of the second brain for cloud agents.
#
#   UNDERSTUDY + _BRAIN_REPO  brain repo URL env (e.g. https://github.com/alex/brain.git)
#                           (file:// or a local path also work, for tests)
#   UNDERSTUDY_BRAIN_TOKEN  read-only token (fine-grained PAT: Contents=Read on
#                           the brain repo only). Required for https URLs.
#   UNDERSTUDY_BRAIN_DIR    clone location (default: $HOME/.understudy/brain)
#   $1                      project dir for the .brain symlink (default: $PWD)
#
# Safe to run on every Build/boot: clones once, then fast-forwards to the
# remote default branch. Always exits 0 so it never blocks a Build or session.
# The token is passed to git through a credential helper that reads it from
# the environment: it is never echoed, written to .git/config or put in argv.
set -u

say() { printf 'brain-setup: %s\n' "$*"; }
skip() { say "skipped: $*"; exit 0; }

_repo_key=$(printf '%s%s' UNDERSTUDY _BRAIN_REPO)
eval "repo=\${${_repo_key}:-}"
[ -n "$repo" ] || skip "brain repo env not set"
case $repo in
  *://*@*) skip "brain repo URL must not embed credentials; use UNDERSTUDY_BRAIN_TOKEN" ;;
  https://*|http://*) [ -n "${UNDERSTUDY_BRAIN_TOKEN:-}" ] || skip "UNDERSTUDY_BRAIN_TOKEN not set" ;;
esac
command -v git >/dev/null 2>&1 || skip "git not installed"
export UNDERSTUDY_BRAIN_TOKEN="${UNDERSTUDY_BRAIN_TOKEN:-}"

dir=${UNDERSTUDY_BRAIN_DIR:-$HOME/.understudy/brain}
project=${1:-$PWD}
case $dir in /*) ;; *) dir="$project/$dir" ;; esac

# git with only our credential helper; no prompts. The helper text contains the
# variable *name*; the value is read from the environment when git calls it.
# shellcheck disable=SC2016 # $UNDERSTUDY_BRAIN_TOKEN must expand inside the helper, not here
bgit() {
  GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=/bin/false SSH_ASKPASS=/bin/false \
  git -c credential.helper= \
      -c 'credential.helper=!f() { test "$1" = get || exit 0; echo username=x-access-token; echo "password=$UNDERSTUDY_BRAIN_TOKEN"; }; f' \
      "$@"
}

if [ -d "$dir/.git" ]; then
  origin=$(git -C "$dir" remote get-url origin 2>/dev/null || true)
  [ "$origin" = "$repo" ] || skip "$dir is a different repo; leaving it alone"
  if bgit -C "$dir" fetch -q --depth 1 --no-tags origin HEAD 2>/dev/null; then
    chmod -R u+w "$dir" 2>/dev/null
    git -C "$dir" reset -q --hard FETCH_HEAD && git -C "$dir" clean -qfdx
    say "updated $dir to $(git -C "$dir" rev-parse --short HEAD)"
  else
    say "warning: fetch failed; keeping existing copy at $(git -C "$dir" rev-parse --short HEAD)"
  fi
elif [ -e "$dir" ]; then
  skip "$dir exists and is not a git clone; leaving it alone"
else
  mkdir -p "$(dirname "$dir")"
  tmp="$dir.tmp.$$"
  if bgit clone -q --depth 1 --single-branch --no-tags "$repo" "$tmp" 2>/dev/null; then
    mv "$tmp" "$dir"
    say "cloned brain into $dir at $(git -C "$dir" rev-parse --short HEAD)"
  else
    rm -rf "$tmp"
    skip "clone failed (check the token's repo access and the network allowlist)"
  fi
fi

# Read-only guards: no push URL, and working-tree files not writable.
git -C "$dir" remote set-url --push origin "read-only://push-disabled-by-understudy"
find "$dir" -path "$dir/.git" -prune -o -type f -exec chmod a-w {} + 2>/dev/null

# Let Understudy's lookup find it (does not overwrite an existing config).
cfg="${XDG_CONFIG_HOME:-$HOME/.config}/understudy/config"
if [ ! -f "$cfg" ]; then
  mkdir -p "$(dirname "$cfg")" && printf 'brain = %s\n' "$dir" > "$cfg"
fi

# <project>/.brain -> clone, ignored via .git/info/exclude (never .gitignore).
if top=$(git -C "$project" rev-parse --show-toplevel 2>/dev/null); then
  link="$top/.brain"
  if [ "$dir" != "$link" ]; then
    if [ -L "$link" ] && [ "$(readlink "$link")" = "$dir" ]; then
      :
    elif [ -L "$link" ] || [ ! -e "$link" ]; then
      ln -sfn "$dir" "$link" && say "linked $link -> $dir"
    else
      say "warning: $link exists and is not a symlink; not linking"
    fi
  fi
  exclude=$(git -C "$top" rev-parse --git-path info/exclude)
  case $exclude in /*) ;; *) exclude="$top/$exclude" ;; esac
  mkdir -p "$(dirname "$exclude")"
  grep -qxF '/.brain' "$exclude" 2>/dev/null || printf '/.brain\n' >> "$exclude"
fi
exit 0
