import test from 'node:test';
import assert from 'node:assert/strict';
const module=await import('../frontend/advisor-session-bridge.js').catch(()=>({}));
test('only enabled explicit advisor routes use cookies; ordinary clients and synthetic routes stay R2',()=>{
 assert.equal(typeof module.useAdvisorCookies,'function');
 for(const url of ['https://portal.goshelv.com/','https://portal.goshelv.com/#/client','https://portal.goshelv.com/?preview=1#/advisor','https://portal.goshelv.com/?preview=1&workspace=advisor'])assert.equal(module.useAdvisorCookies({advisorSharedSessions:true},new URL(url)),false);
 for(const url of ['https://portal.goshelv.com/?workspace=advisor','https://portal.goshelv.com/#/advisor','https://portal.goshelv.com/?advisorPreview=published']){assert.equal(module.useAdvisorCookies({},new URL(url)),false);assert.equal(module.useAdvisorCookies({advisorSharedSessions:'true'},new URL(url)),false);assert.equal(module.useAdvisorCookies({advisorSharedSessions:true},new URL(url)),true);}
});
test('facade completes only PKCE, never exposes provider token, and disposes only local callbacks',async()=>{
 assert.equal(typeof module.createAdvisorSessionBridge,'function');let complete=0,logout=0;
 class Cookie{constructor({onState}){this.onState=onState;this.status='initial';this.generation=0;}async complete(code){assert.equal(code,'synthetic-once');complete++;this.status='ready';this.identity={ownerId:'synthetic',role:'advisor'};this.onState({status:'ready',generation:1});return {ownerId:'synthetic'};}async restore(){this.status='ready';return {};}async signOut(){logout++;}suspend(){this.status='offline';}}
 const states=[],s=module.createAdvisorSessionBridge({Cookie,onState:v=>states.push(v)});assert.equal(await s.accept({kind:'pkce',code:'synthetic-once'}),true);assert.equal(complete,1);assert.equal('token' in s,false);assert.equal(s.storage.durableAvailable,false);s.dispose();s.cookie.onState({status:'ready'});assert.equal(states.length,1);assert.equal(logout,0);await assert.rejects(s.accept({kind:'implicit',accessToken:'synthetic'}));
});
