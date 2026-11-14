#!/usr/bin/env bash
# Takes numbered screenshots of every screen into screenshots/ (headless Edge).
# Usage: bash tools/shots.sh [height]
set -e
cd "$(dirname "$0")/.."
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
ROOT="$(pwd -W 2>/dev/null || pwd)"
BASE="file:///$(echo "$ROOT" | sed 's/ /%20/g')/index.html"
H="${1:-1400}"
mkdir -p screenshots
shot () { # name query hash
  "$EDGE" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=3000 \
    --window-size=1366,$H --screenshot="$ROOT/screenshots/$1.png" "$BASE?$2#$3" >/dev/null 2>&1 || true
  echo "screenshots/$1.png"
}
shot 01_start          "demo=f0-empty"   start
shot 02_intro          "demo=f0-empty"   intro
shot 03_phase0_empty   "demo=f0-empty"   f0
shot 04_phase0_full    "demo=f0-full"    f0
shot 05_phase1_partial "demo=f1-partial" f1a
shot 06_phase1_robotic "demo=f1-robotic" f1a
shot 07_phase1_crewed  "demo=f1-crewed"  f1a
shot 08_rocket_crewed  "demo=f1b-crewed" f1b
shot 09_rocket_robotic "demo=f1b-robotic" f1b
shot 10_rocket_over    "demo=f1b-over"   f1b
shot 11_phase1_done    "demo=f1done"     f1done
