import assert from 'node:assert/strict';
import {readCareCommand} from '../../../src/contracts/PortalCareValidation.ts';

// Explicit filtered-read lane. It cannot silently replace a failed filter with product:null.
export function filteredHistoryCommand(audience,options) {
  assert.ok(audience==='client'||audience==='advisor','Finite actual history audience required');
  assert.ok(options&&typeof options==='object'&&!Array.isArray(options));
  assert.ok(Object.keys(options).every(key=>['clientId','product','cursor','limit'].includes(key)),'Unknown history selector');
  const {product,cursor=null,limit=2,clientId}=options;
  assert.ok(product&&typeof product==='object','Exact nonnull product filter required');
  if(audience==='client')assert.equal(clientId,undefined,'Client owner selector is forbidden');
  return readCareCommand({schemaVersion:1,action:audience==='client'?'read_use_history_v1':'read_advisor_use_history_v1',product,cursor,limit,...(audience==='advisor'?{clientId}:{})});
}
