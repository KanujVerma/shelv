import {test,expect} from '@playwright/test';
import {fixture,config,advisorId} from '../../../regression-tests/browser/support.mjs';
import {createAlexSample} from '../../../site/advisor/alex-sample.js';
const clientId='00000000-0000-4000-8000-000000000001';
async function setup(context,{available=true,callback=false}={}){
 const backend=await fixture(context),calls=[];
 await context.route('**/portal-config.json',route=>route.fulfill({json:{...config,advisorSharedSessions:true}}));
 await context.route('**/api/advisor/**',async route=>{const req=route.request(),path=new URL(req.url()).pathname;calls.push({path,method:req.method(),authorization:!!req.headers().authorization});
  if(!available)return route.fulfill({status:503,json:{code:'configuration_missing'}});
  if(path==='/api/advisor/session'&&callback&&req.headers()['x-shelv-flow']==='1')return route.fulfill({json:{signedIn:false,csrf:'synthetic-csrf',flowExpiresAt:new Date(Date.now()+600000).toISOString()}});
  if(path==='/api/advisor/session'||path==='/api/advisor/auth/complete')return route.fulfill({json:{signedIn:true,ownerId:advisorId,generation:1,capabilities:{view:true,edit:true,publish:true,confirmPayments:true},idleExpiresAt:new Date(Date.now()+3600000).toISOString(),absoluteExpiresAt:new Date(Date.now()+28800000).toISOString(),csrf:'synthetic-csrf'}});
  if(path==='/api/advisor/operations'){
   const command=req.postDataJSON();if(command.action==='advisor_preview_read_v2'){const e=createAlexSample();delete e.sample;e.clientId=clientId;return route.fulfill({json:e});}
   return route.fulfill({json:await backend.portal.core(command)});
  }
  return route.fulfill({status:403,json:{code:'action_forbidden'}});
 });return {backend,calls};
}
test('explicit advisor restores token-free cookie port and separate preview tab reuses it without email',async({page,context})=>{
 const {backend,calls}=await setup(context);await page.goto('/?workspace=advisor#/advisor');await expect(page.locator('#advisor-signout')).toBeVisible();
 const preview=await context.newPage();await preview.goto('/?signin=1&advisorPreview=published&clientId='+clientId+'#/client');await expect(preview.locator('[data-preview-label]')).toHaveText('View as client · Read only');
 await expect(preview.locator('[data-controls],[data-review],[data-expand],#client-cart')).toHaveCount(0);expect(calls.some(x=>x.path==='/api/advisor/operations')).toBe(true);expect(calls.every(x=>!x.authorization)).toBe(true);expect(backend.calls.filter(x=>x.path?.endsWith('/otp'))).toHaveLength(0);
});
test('ordinary client route ignores advisor cookie even when feature is enabled',async({page,context})=>{
 const {calls}=await setup(context);await page.goto('/#/client');await expect(page.locator('#login-email')).toBeVisible();expect(calls).toHaveLength(0);await expect(page.locator('#remember-device')).not.toBeDisabled();
});
test('synthetic preview never bootstraps the session gateway',async({page,context})=>{
 const {calls}=await setup(context);await page.goto('/?preview=1&workspace=advisor#/client');await expect(page.locator('#client-plan')).toBeVisible();expect(calls).toHaveLength(0);
});
test('missing key or gateway configuration fails closed without reverting to legacy Auth',async({page,context})=>{
 const {backend}=await setup(context,{available:false});await page.goto('/?workspace=advisor#/advisor');await expect(page.getByRole('heading',{name:'Reconnect to your private workspace'})).toBeVisible();await expect(page.locator('#login-email,.advisor-portal,.client-portal')).toHaveCount(0);expect(backend.calls).toHaveLength(0);
});

test('successful cookie PKCE callback scrubs code and omits legacy other-tab warning',async({page,context})=>{
 const {backend,calls}=await setup(context,{callback:true});await page.goto('/?workspace=advisor&code=synthetic-once');await expect(page.locator('#advisor-signout')).toBeVisible();await expect(page.locator('#preview-banner')).toBeHidden();expect(new URL(page.url()).searchParams.has('code')).toBe(false);expect(calls.filter(x=>x.path==='/api/advisor/auth/complete')).toHaveLength(1);expect(backend.calls).toHaveLength(0);
});
test('client-enabled ordinary root preserves legacy advisor callback intent in same and new tabs',async({page,context})=>{
 const backend=await fixture(context);
 const redirects=[];context.on('request',req=>{const u=new URL(req.url());if(u.pathname.endsWith('/otp'))redirects.push(u.searchParams.get('redirect_to'));});
 await context.route('**/portal-config.json',route=>route.fulfill({json:{...config,advisorSharedSessions:false,clientSharedSessions:true}}));
 for(const newTab of [false,true]){
  await page.goto('/?workspace=advisor#/advisor');await expect(page.locator('#login-email')).toBeVisible();
  await page.locator('#login-email').fill('synthetic@example.test');await page.getByRole('button',{name:'Send sign-in link'}).click();await expect(page.locator('#login-status')).toContainText('on its way');
  expect(redirects.at(-1)).toBe(new URL('/?workspace=advisor',page.url()).href);
  const target=newTab?await context.newPage():page;await target.goto('/?workspace=advisor&code='+backend.code(advisorId));await expect(target.locator('#advisor-signout')).toBeVisible();
  await target.locator('#advisor-signout').click();await expect(target.locator('#login-email')).toBeVisible();if(newTab)await target.close();
 }
});
