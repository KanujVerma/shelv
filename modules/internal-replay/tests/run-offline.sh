#!/bin/bash
set -euo pipefail
replay_repo=$(cd "$(dirname "$0")/../../.." && pwd)
replay_output=${1:-}
if [[ -z "$replay_output" ]]; then
  mkdir -p "$replay_repo/.local-artifacts"
  replay_output=$(mktemp -d "$replay_repo/.local-artifacts/internal-replay-offline-XXXXXX")
fi
mkdir -p "$replay_output"
cd "$replay_repo"
swiftc -module-cache-path "$replay_output/ModuleCache" modules/internal-replay/ios/ReplayAdmission.swift modules/internal-replay/tests/ReplayAdmissionTests.swift -o "$replay_output/admission"
"$replay_output/admission"
swiftc -module-cache-path "$replay_output/ModuleCache" modules/internal-replay/ios/ReplayAdmission.swift modules/internal-replay/tests/ReplayFlagGateTests.swift -o "$replay_output/flags"
"$replay_output/flags"
swiftc -module-cache-path "$replay_output/ModuleCache" modules/internal-replay/ios/ReplayAdmission.swift modules/internal-replay/ios/ReplayTransport.swift modules/internal-replay/tests/ReplayTransportTests.swift -o "$replay_output/transport"
# A new receipt folder avoids conflating runs and preserves earlier dummy evidence.
replay_receipt=$(mktemp -d "$replay_output/transport-XXXXXX")
"$replay_output/transport" "$replay_receipt"

# Actual React Native local adapter; always-intercepting URLProtocol, no forwarding.
swiftc -module-cache-path "$replay_output/ModuleCache" modules/internal-replay/ios/ActualAppReplayAdmission.swift modules/internal-replay/tests/ActualAppReplayAdmissionTests.swift -o "$replay_output/actual-app-admission"
"$replay_output/actual-app-admission"
swiftc -module-cache-path "$replay_output/ModuleCache" modules/internal-replay/ios/ActualAppReplayAdmission.swift modules/internal-replay/ios/ActualAppReplayLocalTransport.swift modules/internal-replay/tests/ActualAppReplayLocalTransportTests.swift -o "$replay_output/actual-app-local-transport"
"$replay_output/actual-app-local-transport"
