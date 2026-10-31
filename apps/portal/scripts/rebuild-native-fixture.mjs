import assert from 'node:assert/strict';
import {readFile, stat, readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {preparePortalAdmissionFixture} from './local-admission.mjs';
import {validateRuntimeLineage, verifyFixtureResources} from './local-admission-lineage.mjs';
import {sha} from './rebuild-native-boundary.mjs';

export const parentRoot = '/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030';
export const fixtureDirectory = path.join(parentRoot, '.local-artifacts/portal-rebuild/canonical-plan-v1-r4');
export const fixtureOwner = '6214c384-1fb3-4aad-b5a8-9dd9042345a3';
export const fixtureProject = 'shelv-portal-admission-6214c3841fb3';

// Read only. The existing guard receives the actual parent root, never the child root.
export async function attestFixture(sourceRoot) {
  assert.equal(process.env.SHELV_REBUILD_NATIVE, '1', 'Explicit native test opt-in required');
  const fixture = await preparePortalAdmissionFixture(parentRoot, fixtureDirectory);
  const {manifest, directory, projectId} = fixture;
  assert.equal(projectId, fixtureProject); assert.equal(manifest.ownerId, fixtureOwner); assert.equal(fixture.migrationCount, 55);
  const names = (await readdir(path.join(sourceRoot, 'supabase/migrations'))).filter(n => n.endsWith('.sql')).sort();
  assert.deepEqual(names, Object.keys(manifest.migrations).sort());
  for (const name of names) assert.equal(sha(await readFile(path.join(sourceRoot, 'supabase/migrations', name))), manifest.migrations[name], 'Child migration differs from prepared parent bytes');
  const env = {...process.env, DOCKER_HOST: 'unix:///Users/kanuj/.colima/shelv-portal-20261024/docker.sock', DOCKER_CONFIG: path.join(directory, 'docker-config')};
  delete env.DOCKER_CONTEXT;
  const docker = (...args) => execFileSync('docker', args, {env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024}).trim();
  const db = 'supabase_db_' + projectId;
  const sql = text => execFileSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-At', '-v', 'ON_ERROR_STOP=1'], {env, input: text, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024}).trim();
  const binding = JSON.parse(await readFile(path.join(directory, 'RUNTIME-BINDING.json'), 'utf8'));
  const volume = JSON.parse(docker('volume', 'inspect', db))[0];
  const containers = docker('ps', '-a', '--format', '{{.Names}}').split('\n').filter(n => n.endsWith('_' + projectId)).map(n => JSON.parse(docker('inspect', n))[0]);
  assert.equal(verifyFixtureResources(manifest, binding, volume, containers, directory).fresh, false);
  assert.deepEqual(JSON.parse(sql('select payload from public.shelv_portal_fixture_attestation where singleton')), binding);
  const ledger = JSON.parse(sql("select coalesce(jsonb_agg(jsonb_build_object('version',version,'name',name,'statements',statements) order by version),'[]'::jsonb) from supabase_migrations.schema_migrations"));
  const lineage = validateRuntimeLineage(manifest, ledger, binding);
  assert.equal(lineage.snapshotSha256, '34714ceb51c0cec880d15d6abd11fd341fd0abd5534c865fc55295dd6ba3f2a4');
  assert.equal(lineage.ledgerSha256, '5d416afa46638874c230d78db574137c315d80268ab6b08c08f3ede982d7e6b1');
  const helpers = JSON.parse(await readFile(path.join(directory, 'edge/HELPERS.json'), 'utf8'));
  assert.equal(helpers.ownerId, fixtureOwner); assert.equal(helpers.projectId, fixtureProject);
  for (const name of ['tls', 'edge']) {
    const current = JSON.parse(docker('inspect', helpers[name]))[0];
    assert.equal(current.Id, helpers[name + 'Id']); assert.equal(current.Config.Labels['shelv.fixture.owner'], fixtureOwner);
    assert.equal(current.State.Running, true);
  }
  const readPrivate = async name => {
    const file = path.join(directory, name); assert.equal((await stat(file)).mode & 0o077, 0, 'Private file permissions required');
    return JSON.parse(await readFile(file, 'utf8'));
  };
  const config = await readPrivate('status.private.json'), owner = await readPrivate('AUTH-PROBE.private.json');
  assert.equal(config.API_URL, 'http://127.0.0.1:57421'); assert.equal(owner.id, '350f9632-b15e-42c3-a3f4-a1f2f66a6f69');
  assert.ok(owner.email.endsWith('.invalid'));
  assert.equal(sql('select owner_actor_id from concierge.plan_policy where singleton'), owner.id);
  assert.equal(sql('select activated from concierge.plan_policy where singleton'), 't');
  return {...fixture, helpers, config, owner, docker, sql, lineage, readPrivate};
}
