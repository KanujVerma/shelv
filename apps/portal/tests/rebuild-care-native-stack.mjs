import assert from 'node:assert/strict';
import {connectedStack} from './rebuild-native-stack.mjs';
import {requireCareCustody} from '../scripts/rebuild-care-native-fixture.mjs';

// Resource acquisition is deliberately a separate call after actual parent selection/grant/attestation.
export async function connectedCareStack(fixture,grant,workspace) {
  requireCareCustody(fixture.selection,grant,workspace,grant?.purpose);
  assert.equal(fixture.lineage.migrationCount,56);
  return connectedStack(fixture,{care:true,careCustody:grant});
}
