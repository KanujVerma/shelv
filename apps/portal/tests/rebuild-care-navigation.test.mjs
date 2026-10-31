import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRoute,parseRoute,parentRoute,safeReturnPath} from '../src/navigation/routes.ts';
test('new-product use reporting has an owner-free semantic route and routine-specific parent',()=>{
 const route={name:'report-use',routine:'evening'};
 assert.equal(buildRoute(route),'/plan/use?routine=evening');assert.deepEqual(parseRoute(buildRoute(route)),route);
 assert.deepEqual(parentRoute(route),{name:'plan',routine:'evening'});
 assert.equal(safeReturnPath('/plan/use?routine=evening','client'),'/plan/use?routine=evening');assert.equal(safeReturnPath('/plan/use','advisor'),null);
 for(const path of ['/plan/use?clientId=other','/plan/use?routine=evening&routine=morning','/plan/use#access_token=secret','/plan/use/other'])assert.equal(parseRoute(path),null);
});
