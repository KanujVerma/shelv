import assert from 'node:assert/strict';
import {test} from 'node:test';
import {clientOrdersReadErrorStatuses} from '../../../src/contracts/PortalClientOrdersValues.ts';
import {buildClientOrdersReadRpc,mapClientOrdersReadResult} from '../../../src/contracts/PortalClientOrdersMapping.ts';
let boundary={};try{boundary=await import('../../../src/contracts/PortalClientOrdersBoundary.ts');}catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;}
const api=(name,...args)=>{assert.equal(typeof boundary[name],'function','guarded boundary export '+name+' must exist');return boundary[name](...args);};
const command={schemaVersion:1,action:'read_client_orders_v1'};
test('new boundary declares explicit content-version409 without changing old error meanings',()=>{
 assert.equal(boundary.clientOrdersBoundaryErrorStatuses?.content_version_required,409);
 assert.equal(Object.hasOwn(clientOrdersReadErrorStatuses,'content_version_required'),false);
 for(const [code,status] of Object.entries(clientOrdersReadErrorStatuses))assert.equal(boundary.clientOrdersBoundaryErrorStatuses[code],status);
 assert.deepEqual(Object.keys(boundary.clientOrdersBoundaryErrorStatuses).sort(),[...Object.keys(clientOrdersReadErrorStatuses),'content_version_required'].sort());
});
test('old builder remains old; new builder selects only the prospective guarded RPC',()=>{
 const old=buildClientOrdersReadRpc(command),current=api('buildGuardedClientOrdersReadRpc',command);
 assert.equal(old.name,'concierge_client_orders_read_v1');assert.equal(current.name,'concierge_client_orders_read_guarded_v1');
 assert.deepEqual(current.args,old.args);assert.equal(Object.isFrozen(current),true);assert.equal(Object.isFrozen(current.args.p_command),true);
});
for(const extra of [{clientId:'10000000-0000-4000-8000-000000000001'},{rpc:'other'},{role:'owner'},{formatVersion:3}])test('new builder preserves closed no-selector validation '+Object.keys(extra)[0],()=>assert.throws(()=>api('buildGuardedClientOrdersReadRpc',{...command,...extra}),/invalid_input/));
test('fully represented positive legacy view uses the identical old strict mapper',()=>{
 const view={schemaVersion:1,revision:0,purchases:[],returns:[]};
 assert.deepEqual(api('mapGuardedClientOrdersReadResult',view,command),mapClientOrdersReadResult(view,command));
});
test('malformed or typed 200 data is never silently classified as a version-required refusal',()=>{
 const view={schemaVersion:1,revision:1,purchases:[{formatVersion:3,line:null}],returns:[]};
 assert.throws(()=>api('mapGuardedClientOrdersReadResult',view,command),error=>error.message==='invalid_input');
 assert.throws(()=>mapClientOrdersReadResult(view,command),error=>error.message==='invalid_input');
});
