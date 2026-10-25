# Shelv portal

The portal supports founder preparation after a consultation, immutable published plans, client decisions and routines, manually verified payments, and private check-ins. Alex and Maya are fictional preview examples. The mobile scanner is a separate application.

Use Node.js 22.23.0 or newer and Python 3. From this folder:

```sh
npm ci
npm test
npm run test:session
npm run typecheck:session
npm run verify:session-package
npm run build
```

Browser tests use an installed Google Chrome and intercept requests with local synthetic fixtures. They do not authenticate hosted accounts. The retained SQL fixture checks additionally require PostgreSQL 15. The harness discovers its tools through PATH, `pg_config`, or Homebrew; set `PGBIN` explicitly when needed. Node is discovered on PATH or selected with `NODE_BIN`, with the same version floor. Run `npm run test:backend` for the portable backend TypeScript cases and `npm run test:sql` for the isolated native preview checks. The SQL runner creates and removes its own fresh cluster and uses only its task-owned Unix socket, with TCP listening disabled.

The build writes `site/`, `runtime/`, `portal.zip` and `BUILD-MANIFEST.json` under the repository's ignored `.local-artifacts/portal-build/`. The package always includes both `/api/client/*` and `/api/advisor/*`; the private vault bundle is a separate output. ZIP entries use deterministic metadata. Builds check that input site bytes remain unchanged and record source/output hashes. No build command deploys, changes hosted flags or applies a migration.

`site/` began as the exact 99-file production release from October 24. `provenance/DEPLOYED-20261024.json` permanently pins that release. The generated package has its own identity: local changes and relocated dependency comments may produce different hashes. The build manifest records that distinction. An older archive with disabled public session flags is not an interchangeable rollback.

`session-integration/` contains the current browser adapters, gateway, private worker, context SQL and session tests. The former R2 composition script is retired because this site's session integration already exists. The SQL harness still uses the retained `backend/source/` fixture snapshot. See [source provenance](../../docs/PORTAL_SOURCE_PROVENANCE.md) for the import lineage, exact release and private preservation boundary.
