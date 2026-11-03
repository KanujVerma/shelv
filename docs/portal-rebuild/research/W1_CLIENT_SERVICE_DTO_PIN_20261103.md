# W1 ClientService DTO pin, 3 November 2026

Owner: Kanuj. W1 runtime was read from T3: codex / gpt-6.1-sol / xhigh / default. No nested agents.

W6 requested the four existing PortalClientService DTO modules from retained candidate `714d6647b1a92946dbf9c61f2d96f245ffbd845c`. W1 read all four modules and copied their exact Git blobs into frozen baseline `8c5c6b2d72e75f620487f1b2b110655b03551b17`; no prepared ancestry, SQL, producer, consumer or gateway is imported by this pin.

| Path | SHA-256 |
| --- | --- |
| src/contracts/PortalClientService.ts | f8823ef0035cfb0a3912e469c4dc227bf3320ff3a901c9b9ccb7282c025a88a4 |
| src/contracts/PortalClientServiceValues.ts | ed5b2686237260f4596357886baeb6563754a4180fae7af25618288593e592d6 |
| src/contracts/PortalClientServiceValidation.ts | b5c6e52f88fb5b9423b1cc5440899585725af388d9f16366af4b4f017508d4a5 |
| src/contracts/PortalClientServiceMapping.ts | 998794007f12d639f483ee87d53b926258548f6fdcaf3f373cfb6fb2d7d632d3 |

The fixed RPC is `concierge_client_service_command_v1`. It has three closed actions: own service read, deliberate period-end cancellation, and principal-scoped original request status. There is no client selector or new care/payment/source permission. Commands retain the 8 KiB bound; results retain 32 KiB. Cancellation compares service revision and exact basis hash; a retry returns the historical acknowledgement rather than claiming current service state.

The optional V1 `postServiceAccess` field preserves old responses: omission means unknown. A known access projection requires current recorded paid support and no pending first publication, uses the earlier applicable cancellation/paid boundary, and derives the read-only exclusive end by adding 30 calendar days. These fields are a projection, not authority. D38 and its static-export addendum remain unchanged.

Verification: the original candidate `tests/portal-client-service-contract.test.ts` was copied to own ignored evidence with only its four contract import URLs rebound to these exact current modules. Explicit Node22.23.0 with `--experimental-strip-types --test` passes 21/21, exit0. Evidence: `.local-artifacts/w1-plan-platform/client-service/original-contract.test.ts` and `contract.log` in the W1 worktree. There is no new behavior implementation and no invented OLD failure. `git diff --check` passes.

W1 authorizes W0 to admit these exact four postimages into its separately reviewed bounded service composition. Existing ASC1/ASC2 findings, W7 independent review, actual registered gateway/Auth/SQL/browser behavior, migration allocation/execution and hosted CI remain separate gates. This pin is source evidence only; it does not accept C08C, cancellation, service access or the full W1/W6 workstream. Source kernel SK2/SK3/SK4, Guidance/M65/provider-photo and M04 PRINCIPAL-R1-01 holds are unchanged.
