# Local scratch-container backup retirement (2026-10-27)

This inventory records two old local Colima scratch-container archives reviewed for removal during the Shelv storage cleanup. Their checksum entries preserve identification and integrity metadata; they do not preserve restorable container contents.

The archived Colima profile was stopped during the audit. Current Shelv source, migrations, database-volume backups, release/rollback archives, and all test-result bundles were retained. These scratch containers are not required to run the Shelv app.

| Archive path relative to the Colima backup | Bytes | SHA-256 |
| --- | ---: | --- |
| `scratch-containers/derive-p4-recovery15-scratch.tar.gz` | 364785655 | `b5a0e9e2835a2492417d160023e679ba8ad18bb405815620ba23ce9c9c38c9d3` |
| `scratch-containers/derive-p4-recovery17-scratch.tar.gz` | 366245047 | `b71fb6bf87df566499b1885cd6975c12a805d312cefb29fb89fdd2124081519e` |
