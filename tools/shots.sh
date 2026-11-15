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
shot 12_phase2_crewed  "demo=f2-crewed"  f2
shot 13_phase2_robotic "demo=f2-robotic" f2
shot 14_phase2_done    "demo=f2done"     f2done
shot 18_phase3a_crewed   "demo=f3a"          f3a
shot 19_phase3a_played   "demo=f3a-played"   f3a
shot 20_phase3a_robotic  "demo=f3a-robotic"  f3a
shot 21_phase4_choose    "demo=f4"           f4
shot 22_phase4_played    "demo=f4-played"    f4
shot 23_phase4_bottleneck "demo=f4-bottleneck" f4
shot 24_launch_go        "demo=f3b-go"       f3b
shot 25_launch_crewed    "demo=f3b-crewed"   f3b
shot 26_launch_nogo      "demo=f3b-nogo"     f3b
shot 27_launch_launched  "demo=f3b-launched" f3b
shot 28_phase5a_robotic  "demo=f5a"          f5a
shot 29_phase5a_crewed   "demo=f5a-crewed"   f5a
shot 30_phase5b_start    "demo=f5b"          f5b
shot 31_phase5b_decision "demo=f5b-decision" f5b
shot 32_phase5b_landed   "demo=f5b-landed"   f5b
shot 33_phase5b_abort    "demo=f5b-abort"    f5b
shot 34_landed_card      "demo=f5done"       f5done
shot 35_phase2_played    "demo=f2-played"    f2
shot 36_phase2_failed    "demo=f2-failed"    f2
