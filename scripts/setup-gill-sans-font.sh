#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/assets/fonts"
SRC="/System/Library/Fonts/Supplemental/GillSans.ttc"

mkdir -p "$DEST"

if [[ ! -f "$SRC" ]]; then
  echo "GillSans.ttc not found at $SRC"
  echo "Place GillSans-Regular.ttf, GillSans-SemiBold.ttf, and GillSans-Bold.ttf in assets/fonts/"
  exit 1
fi

python3 << PY
from fontTools.ttLib import TTCollection
from pathlib import Path

dest = Path("$DEST")
ttc = TTCollection("$SRC")
targets = {
    "Gill Sans": "GillSans-Regular.ttf",
    "Gill Sans SemiBold": "GillSans-SemiBold.ttf",
    "Gill Sans Bold": "GillSans-Bold.ttf",
}
for font in ttc.fonts:
    name = font["name"].getDebugName(4) or font["name"].getDebugName(1)
    if name in targets:
        out = dest / targets[name]
        font.save(str(out))
        print(f"Wrote {out.name}")
PY

echo "Done. Restart Metro with: npx expo start -c"
