# Historical Shelv local validation summary

This is a redacted summary of local development reports from October 2026. It records past results and limits; it is not a release certification or a test of the current GitHub `main` branch.

## Reported outcomes

- The local application suite reported 3,043 passes, six existing acceptance skips, and zero failures or cancellations. The reports also recorded 39 focused replay tests and 51 native admission/transport assertions.
- Local iOS Debug simulator replay tests used generated content and explicit Start/Stop controls. Their image checker reported no configured synthetic canary pixels in the analyzed frames.
- Customer replay remained disabled. A bounded generated-data hosted attempt received HTTP 200 but did not produce a playable recording, so hosted replay was not accepted; recording controls were returned to off.
- Physical-device acceptance remained open.

## Source and evidence limits

The reports describe a local working tree based on commit `5d43559` with uncommitted changes. That exact source snapshot is not present in this branch, so these results cannot be reproduced from this document alone or attributed to the current GitHub source. Internal project, flag, session, and local machine identifiers are intentionally omitted.

The raw local Xcode result bundles, DerivedData, debug symbols, prototypes, and archived run outputs were removed during the user-directed storage cleanup. This note preserves the summarized outcomes and explicit limits, not the raw test evidence.

## Local-artifact retention

Before removal, the ignored root artifact folder measured 8.33 GiB and contained 70 Xcode result bundles, 84 debug-symbol bundles, and 14 report files, along with prototype and legacy test outputs. Those raw outputs are not needed to run the Shelv app and are not stored in this repository. The storage cleanup removes that raw local folder after preserving this redacted summary. This note is not a substitute for the original screenshots, logs, or debug symbols.
