import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, chmod, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const preview = fileURLToPath(new URL('../backend/tests/preview.sql.py', import.meta.url));
const load = `import importlib.util,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('portable_preview',sys.argv[1])
module=importlib.util.module_from_spec(spec);sys.modules[spec.name]=module;spec.loader.exec_module(module)
assert module.BIN==Path(sys.argv[2]).resolve(), 'explicit PostgreSQL override ignored'
assert module.m.BIN==module.BIN, 'nested workflow must use the same selected PostgreSQL tools'
assert module.NODE==str(Path(sys.argv[3]).resolve()), 'explicit Node override ignored'
print('portable toolchain selected without starting a database')
`;

test('SQL fixture honors explicit tools throughout its nested workflow without machine paths', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'shelv-pg-tools-'));
  try {
    for (const command of ['initdb', 'pg_ctl', 'psql']) {
      const filename = path.join(directory, command);
      await writeFile(filename, '#!/bin/sh\nexit 0\n');
      await chmod(filename, 0o755);
    }
    const result = spawnSync('python3', ['-c', load, preview, directory, process.execPath], { encoding: 'utf8', env: { ...process.env, PGBIN: directory, NODE_BIN: process.execPath } });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /without starting a database/);
    assert.doesNotMatch(await readFile(preview, 'utf8'), /\/Users\/|\/opt\/homebrew\//);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('invalid explicit PostgreSQL tools fail clearly before creating a fixture', () => {
  const result = spawnSync('python3', [preview], { encoding: 'utf8', env: { ...process.env, PGBIN: '/nonexistent-shelv-pg-tools', NODE_BIN: process.execPath } });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /PGBIN.*(?:initdb|PostgreSQL)/);
});
