#!/usr/bin/env bash
# Re-enable PC hardware keyboard on Android phone AVDs (arrow keys → D-pad for remote testing).
set -euo pipefail

AVD_DIR="${HOME}/.android/avd"
ENABLED=0

for config in "${AVD_DIR}"/*.avd/config.ini; do
  [[ -f "${config}" ]] || continue
  if grep -q '^hw\.keyboard[[:space:]]*=[[:space:]]*no' "${config}"; then
    sed -i 's/^hw\.keyboard[[:space:]]*=[[:space:]]*no/hw.keyboard = yes/' "${config}"
    echo "Enabled hardware keyboard: ${config}"
    ENABLED=$((ENABLED + 1))
  fi
done

if [[ "${ENABLED}" -eq 0 ]]; then
  echo "All phone AVD configs already have hw.keyboard=yes (or no matching AVD found)."
else
  echo ""
  echo "Cold-boot the emulator for this to take effect:"
  echo "  adb emu kill"
  echo "  emulator -avd YOUR_AVD_NAME -no-snapshot-load"
fi
