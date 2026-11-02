import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildAccountProfileRpc,mapAccountProfileResult} from '../src/contracts/PortalAccountProfileMapping.ts';

const read={schemaVersion:1,action:'read_account_profile_v1'} as const;
const write={schemaVersion:1,action:'set_account_display_name_v1',requestId:'10000000-0000-4000-8000-000000000001',expectedRevision:3,displayName:'  Synthetic Élodie  '} as const;
const view={schemaVersion:1,profileRevision:3,displayName:'  Synthetic Élodie  ',currentEmail:{state:'known',address:'synthetic@example.invalid',verified:false}};
test('fixed RPC preserves the exact canonical proper identity and original payload',()=>{
 assert.deepEqual(buildAccountProfileRpc(write),{name:'concierge_account_profile_command_v1',args:{p_command:write}});
 assert.deepEqual(buildAccountProfileRpc(read),{name:'concierge_account_profile_command_v1',args:{p_command:read}});
 assert.equal(mapAccountProfileResult(view,read).displayName,write.displayName);
});
test('legacy 200 Unicode code points remain valid, 201 and empty trimmed names fail',()=>{
 for(const displayName of ['𐐀'.repeat(200),' x '.repeat(66),'\u0085','\u200b'])assert.doesNotThrow(()=>buildAccountProfileRpc({...write,displayName}));
 for(const displayName of ['𐐀'.repeat(201),' \t\n','\u0000','\ud800'])assert.throws(()=>buildAccountProfileRpc({...write,displayName}));
});
test('no actor, selector, caller authority, email write, or unsafe revision accepted',()=>{
 for(const extra of [{clientId:write.requestId},{actorId:write.requestId},{rpc:'other'},{verified:true},{email:'synthetic@example.invalid'},{now:0}])assert.throws(()=>buildAccountProfileRpc({...write,...extra}));
 for(const expectedRevision of [-1,0.5,Number.MAX_SAFE_INTEGER+1,'3'])assert.throws(()=>buildAccountProfileRpc({...write,expectedRevision}));
 assert.throws(()=>buildAccountProfileRpc({...read,schemaVersion:2}));
 assert.throws(()=>buildAccountProfileRpc({...write,action:'change_email'}));
});
test('readonly email is known only with the exact stored fact, unknown stays unknown',()=>{
 assert.deepEqual(mapAccountProfileResult(view,read),view);
 const unknown=mapAccountProfileResult({...view,currentEmail:{state:'unknown'}},read);assert.ok('currentEmail' in unknown);assert.deepEqual(unknown.currentEmail,{state:'unknown'});
 for(const currentEmail of [{state:'known',address:'synthetic@example.invalid'}, {state:'unknown',verified:true},{state:'known',address:'',verified:true}])assert.throws(()=>mapAccountProfileResult({...view,currentEmail},read));
 assert.throws(()=>mapAccountProfileResult({...view,email:'other@example.invalid'},read));
});
test('write acknowledgement binds original command and cannot masquerade as current view',()=>{
 const receipt={schemaVersion:1,requestId:write.requestId,action:write.action,previousRevision:3,revision:4,displayName:write.displayName,recordedAt:'2026-11-02T11:00:00.000000Z'};
 assert.deepEqual(mapAccountProfileResult(receipt,write),receipt);
 assert.doesNotThrow(()=>mapAccountProfileResult({...receipt,revision:3},write)); // exact no-change accepted
 for(const patch of [{requestId:'10000000-0000-4000-8000-000000000002'},{previousRevision:2},{revision:5},{displayName:'other'},{recordedAt:'2026-02-30T00:00:00Z'},{currentEmail:view.currentEmail}])assert.throws(()=>mapAccountProfileResult({...receipt,...patch},write));
 assert.throws(()=>mapAccountProfileResult(receipt,read));
 assert.throws(()=>mapAccountProfileResult(view,write));
});
test('commands are copied and frozen before any wait; response projection is detached',()=>{
 const original={...write,displayName:String(write.displayName)};const call=buildAccountProfileRpc(original);original.displayName='Changed';
 assert.ok('displayName' in call.args.p_command);assert.equal(call.args.p_command.displayName,write.displayName);assert.ok(Object.isFrozen(call.args.p_command));
 const mapped=mapAccountProfileResult(view,read);assert.notEqual(mapped,view);assert.ok(Object.isFrozen(mapped));
});
