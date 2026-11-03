# W0 public Maya aliases: independent source/build review

Owner: Kanuj. **PASS for the exact two-file source/public-asset build delta**, base `3b02a8403c9470da46de8eb2259cd5e291485227`, head `9ba5241db746233c3f57c97eaed54acc3901bd23`. No material scoped finding.

Read the full build script and new test. The existing fixed public Maya image loop now writes a second assets/maya-basename alias from the same original bytes. Legacy maya/assets destinations remain unchanged. The source directory and file extension filter remain fixed; private walkthrough/source/client-page packaging, validators, routes, runtime/auth and feature code do not change.

The identical test on immutable Git exports gives OLD0/1, exit1, then CURRENT13/13, exit0, Node22.23.0, no skips/cancellations. All12 aliases and legacy destinations equal the exact source bytes; each asset provenance entry matches source path, length and SHA256. [Raw pins and exact qualification](W0_MAYA_ASSETS_9BA_RESULT.json) preserve evidence. No browser or provider/resource executed.

The exported build naturally inherited enclosing W7 Git metadata and emitted sourceHead b2703c75, not candidate9ba. This is explicitly not accepted as whole-package/release provenance. The separate exact Git source and direct asset-byte checks support only this bounded packaging verdict; normal current-head packaging/CI still needs its actual source identity. W3 image/slot5e and real demo composition, desktop Figma/browser/a11y and full D01/J10 remain separate. No product numerator changes.
