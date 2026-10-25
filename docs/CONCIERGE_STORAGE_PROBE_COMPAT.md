# Concierge Storage permission-probe compatibility

Migration `20261019171325_concierge_storage_probe_compat.sql` corrects the
Storage 1.80.2 permission-probe contract in the two existing private concierge
buckets. It follows source baseline `9fc7b601f7b6ae4a8e1b7a4c621bfa814f2a85ce`.
The previously applied workflow migration is unchanged.

## Cause and correction

Storage first inserts metadata containing `mimetype` and `contentLength`, with
version `1`, to check INSERT permission. Its permission test rolls back the
transaction or savepoint. The final backend write separately inserts actual
object metadata including `size`. The old fence required `size` during both
phases and rejected the permission test before any upload.

The correction accepts only this bounded missing-size probe shape transiently.
A new deferred constraint trigger rejects COMMIT if that row still exists in
either private concierge bucket without actual size. Version `1` is a shape
marker, never authorization or proof of rollback. Normal transaction rollback,
savepoint rollback and insert-then-delete leave no malformed persisted object.
The deferred check reads the current row by ID with definer visibility; a
deleted row needs no check, and every replacement row is separately fenced.

Both length fields, when required or present, must be JSON numbers, integral,
within 1–5,242,880 bytes, and equal to the immutable reservation. A completed
write still requires actual `size`; a conflicting `contentLength` is rejected.
Size-only completed metadata remains compatible. The probe permits no keys
beyond `mimetype`, `contentLength`, and an optional bounded normalized
`contentEncoding` token list.

The existing owner, deletion, enrollment, reservation, quote, check-in and lock
checks remain unchanged. Private UPDATE and overwrite denial, cleanup DELETE,
RLS, policies, grants, bucket configuration and `object_complete` are unchanged.
The two new helpers have no PUBLIC, anon, authenticated or service-role execute
grant. No new reservation expiry policy or caller-controlled probe flag exists.

## Local evidence

`tests/concierge-storage-probe.sql.py` runs on native PostgreSQL 15, using only
the exact marker-checked disposable database
`derive_disposable_concierge_storage_probe_20261019_01`. Its `--reset` replaces
only that fixture, cloned from the existing marked R2 presentation fixture.
It does not reset another feature's database or alter global roles.

```sh
python3 -B tests/concierge-storage-probe.sql.py --reset --apply
```

The clean replay passes **64 tests**: 44 inherited R1/R2 regressions and 20
Storage transaction-contract cases. The original migration fails the first
probe regression in both buckets. Coverage includes real COMMIT rejection,
rollback/savepoint behavior, final write and completion, malformed and boundary
lengths, wrong owner/path/purpose/MIME, revocation/deletion between phases,
consumed/expired contexts, raw private access, immutable UPDATE/upsert,
cleanup DELETE and deferred-function ACLs. Synthetic object metadata represents
Storage's database transactions; it does not represent decoded image bytes.

A separate read-only catalog comparison confirms unchanged existing function
definitions except `storage_fence`, preserved function ACLs, schema/table
privileges, RLS, storage policies, existing triggers and bucket settings. The
authorization/lock prefix of `storage_fence` is byte-identical to the original.
Independent read-only review found no findings and did not independently run
the native SQL or Storage service.

The full existing `npm test`, application and test TypeScript checks, and Expo
web export also pass. Tests use `/tmp` for temporary files and need localhost
listener permission; initial sandbox-only attempts failed on those environment
restrictions. No application source was changed to run these checks.

## Acceptance boundary

Docker is unavailable in this environment. No genuine Storage HTTP upload,
signed URL fetch, hosted migration, deployment, real account or customer data
was exercised here. Native PostgreSQL success is not Storage HTTP acceptance.

After root review, the separately designated deployment/acceptance owner must
apply this additive migration to the approved staging target and repeat the
actual two-bucket upload/complete/retry/private-read and revocation checks.
This source change does not authorize that deployment or a production rollout.

## Pinned upstream sources

- [Uploader permission check and upload completion](https://github.com/supabase/storage/blob/v1.80.2/src/storage/uploader.ts)
- [PostgreSQL permission-test rollback and object writes](https://github.com/supabase/storage/blob/v1.80.2/src/storage/database/pg.ts)
- [S3 backend metadata](https://github.com/supabase/storage/blob/v1.80.2/src/storage/backend/s3/adapter.ts)
