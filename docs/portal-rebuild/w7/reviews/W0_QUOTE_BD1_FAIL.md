# W0 quote adapter: selected-target alias finding

Owner: Kanuj. **FAIL / SOURCE gate withheld. W7-W0-Q1, P2.** Head `bd1dd9e0765f83a096a8caea78babb18b01b363d`; authoritative parent `c83cd7714bc877a3557c654babb3f3e832be1661`. Exact two-file delta: app ports and quote adapter tests. [Source/results](W0_QUOTE_BD1_FAIL_RESULT.json); [byte-exact original regression](../source-controls/W0_Q1/README.md).

The new bridge relies on `selected` for exact-client binding, but existing `select()` stores `selected = view.target` and returns that same mutable DTO to its caller. After the actual plan read and gate for clientA resolve, a caller can change the returned `target.clientId` to clientB and invoke the new quote port with clientB. `ready()` captures/computes its key from the already-mutated alias, so it accepts this new selected client without a corresponding context read. The typed mapper and transport do not freeze this returned target.

Reproduction from the frozen owner test's exact setup prefix, through actual ApplicationSession/cookie/factory/ports/V2 mapper and closed HTTP:

```js
const selectedView = await f.select(); // actual draft/context for A
selectedView.target.clientId = ids.other;
await assert.rejects(f.adapter.ports.issueQuote.execute({ ...command(), clientId: ids.other }));
```

Independent explicit Node22.23.0 original adapter suite remains **11/11 pass**. The added intent-binding control is **0/1**, failing with `Missing expected rejection`; the call resolves. No successful tested port/currentness/authority facade replaces the adapter. This demonstrates frontend selected-customer/intent redirection, not an actual SQL authorization bypass, funds movement or persisted foreign quote. No genuine resource was used. The author's broader45/45 and type outcomes remain separately attributed; W7 stopped this candidate's review at this material finding.

W0 owns the correction. Capture an independent immutable target/binding at the trusted selection boundary so caller-owned returned objects cannot change it; preserve existing context and role/session fences. Submit a new exact successor and retain this failed regression unchanged for independent verification. W7 has made no production correction and grants no adapter publication/merge/source acceptance at bd1. Existing provider-refused holds remain unchanged.
