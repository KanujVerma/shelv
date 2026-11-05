# PR239 canonical handoff: exact W2 write allocation

Owner: Kanuj. W0 grants W2 a one-time exception to its shared-document restriction for native finding [4464142063](https://github.com/KanujVerma/shelv/pull/239#discussion_r4464142063). This permits only the six-line insertion in `docs/CONTEXT_SYNC.md` supplied by `CONTEXT_SYNC_239.patch`; no other shared file or document bytes are allocated.

- Frozen source head: `39c4bb8608544a94a80701d92830e213b0c71e15`.
- Patch SHA256: `97bae310b8f8e074de6e9408d255ea651ca49ce71e3f6997ed3f171c58d69f90`.
- Required document preimage SHA256: `a785a8ce4ee8d2e8a62c8778c84376fd29b5608e027f92ad161e52f7932578cb`.
- Required document postimage SHA256: `899b7f47b7b70802d24e1173675439278860802d18db9772cb1c68848935dd70`.

W0 independently read the native finding, compared the prepared entry and patch, and derived the postimage from the frozen PR document. The patch adds only the checkpoint and its scope limits. Root's current canonical document has different bytes and is not overwritten by this allocation.

W2 may create a separate documentation-only successor of the frozen head, retaining all eight source postimages exactly, then request the new exact-head native/CI and complete nine-file W7 source gates. The old review remains a finding, not clean approval. Do not resolve its thread merely because the patch is allocated. No merge into Root or feature acceptance follows from this allocation.

The actual preview port `b039b248b448b9d5c26d558138562532aa42eb91`, route/session lifetime and mount remain separately pending. This allocation adopts no pending Root implementation and grants no live read, Auth, SQL, browser, provider or held-scope operation.
