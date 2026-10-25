import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

const site=path.resolve(fileURLToPath(new URL('../site/',import.meta.url))),origin='http://localhost';
let browser;
before(async()=>{browser=await chromium.launch({channel:'chrome',headless:false,args:['--no-proxy-server','--disable-background-networking','--disable-quic','--host-resolver-rules=MAP * ~NOTFOUND']});});
after(async()=>browser?.close());
async function fixture(run){
    const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'});await context.setOffline(true);const unexpected=[],errors=[];
    await context.route('**/*',async route=>{
        const url=new URL(route.request().url());if(url.origin!==origin||route.request().method()!=='GET'){unexpected.push(url.origin+url.pathname);return route.abort();}
        if(url.pathname==='/library-test')return route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/advisor/workspace.css"><main id="library"></main>'});
        const file=path.resolve(site,'.'+url.pathname);if(!file.startsWith(site+path.sep)){unexpected.push(url.pathname);return route.abort();}
        try{return route.fulfill({body:await fs.readFile(file),contentType:path.extname(file)==='.js'?'text/javascript':path.extname(file)==='.css'?'text/css':'application/octet-stream'});}catch{return route.fulfill({status:404,body:''});}
    });
    const page=await context.newPage();page.setDefaultTimeout(6000);page.on('pageerror',error=>errors.push(error.message));
    try{
        await page.goto(origin+'/library-test');
        await page.evaluate(async()=>{
            const {mountWalkthroughLibrary}=await import('/advisor/walkthrough-library.js');
            const ids=['40000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002'];
            const entries=ids.map((caseId,index)=>({caseId,title:'Private generic case '+(index+1),status:'ready',versionId:'40000000-0000-4000-8000-00000000000'+(index+3),createdAt:'2026-10-01T00:00:00.000Z',sourceReference:'PRIVATE_SOURCE_'+index,canShare:true}));
            const state={ids,commands:[],grants:[],receipts:new Map(),failure:null,hold:null,release:null};window.__library=state;
            const request=async command=>{
                state.commands.push(structuredClone(command));
                if(state.hold?.action===command.action&&state.hold?.caseId===command.caseId)await new Promise(resolve=>state.release=resolve);
                const failure=state.failure?.action===command.action&&(!state.failure.caseId||state.failure.caseId===command.caseId)?state.failure:null;
                if(failure&&[401,403].includes(failure.status))throw {status:failure.status};
                if(command.action==='library')return {schemaVersion:1,entries:structuredClone(entries)};
                if(command.action==='share_list')return {schemaVersion:1,grants:structuredClone(state.grants.filter(g=>g.caseId===command.caseId)),nextCursor:null};
                let result=state.receipts.get(command.requestId);
                if(!result){
                    if(command.action==='share_create'){
                        const grant={id:crypto.randomUUID(),caseId:command.caseId,versionId:command.versionId,createdBy:'40000000-0000-4000-8000-000000000005',createdAt:'2026-10-01T00:00:00.000Z',expiresAt:'2026-10-31T00:00:00.000Z',revokedAt:null,status:'active'};
                        state.grants.push(grant);result={schemaVersion:1,grant:structuredClone(grant)};
                    }else if(command.action==='share_revoke'){
                        const grant=state.grants.find(g=>g.id===command.grantId);grant.revokedAt='2026-10-02T00:00:00.000Z';grant.status='revoked';result={schemaVersion:1,grant:structuredClone(grant)};
                    }
                    state.receipts.set(command.requestId,result);
                }
                if(failure){if(failure.once)state.failure=null;throw {status:failure.status};}
                return structuredClone(result);
            };
            window.__libraryCleanup=mountWalkthroughLibrary(document.querySelector('#library'),{request});
        });
        await page.locator('[data-walkthrough-case]').nth(1).waitFor();
        for(let index=0;index<2;index++){await page.locator('[data-share-create]').nth(index).click();await page.waitForFunction(count=>document.querySelectorAll('[data-share-link]').length===count,index+1);}
        assert.equal(await page.locator('[data-share-link]').count(),2);
        await run(page);
        assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
    }finally{await context.close();}
}
const createButton=(page,index)=>page.locator('[data-walkthrough-case]').nth(index).locator('[data-share-create]');
async function leaveUncertainCreate(page){
    await page.evaluate(()=>window.__library.failure={action:'share_create',caseId:window.__library.ids[1],status:500,once:true});
    await createButton(page,1).click();await page.getByRole('button',{name:'Retry same link',exact:true}).waitFor();
    return page.evaluate(()=>structuredClone(window.__library.commands.filter(c=>c.action==='share_create'&&c.caseId===window.__library.ids[1]).at(-1)));
}
async function assertCleared(page){
    await page.locator('#library [role="alert"]').waitFor();
    assert.match(await page.locator('#library').innerText(),/Walkthrough access could not be verified/);
    assert.equal(await page.locator('[data-share-link],[data-share-copy],[data-walkthrough-case],[data-share-create],[data-share-revoke]').count(),0);
    const result=await page.evaluate(()=>({html:document.querySelector('#library').innerHTML,commands:window.__library.commands,ids:window.__library.ids}));
    for(const command of result.commands){if(command.token)assert.ok(!result.html.includes(command.token));}
    for(const id of result.ids)assert.ok(!result.html.includes(id));assert.doesNotMatch(result.html,/PRIVATE_SOURCE_|Private generic case|Retry same link/);
}
async function retryFresh(page,uncertain){
    await page.evaluate(()=>window.__library.failure=null);await page.getByRole('button',{name:'Try again',exact:true}).click();await page.locator('[data-walkthrough-case]').nth(1).waitFor();
    assert.equal(await page.locator('[data-share-link]').count(),0);assert.equal(await page.getByRole('button',{name:'Retry same link',exact:true}).count(),0);
    await createButton(page,1).click();await page.locator('[data-share-link]').waitFor();
    const fresh=await page.evaluate(()=>window.__library.commands.filter(c=>c.action==='share_create'&&c.caseId===window.__library.ids[1]).at(-1));
    assert.notEqual(fresh.requestId,uncertain.requestId);assert.notEqual(fresh.token,uncertain.token);
}
for(const action of ['share_create','share_revoke'])for(const status of [401,403])test(`${action} ${status} clears both visible links and every pending case before rendering`,()=>fixture(async page=>{
    const uncertain=await leaveUncertainCreate(page);assert.equal(await page.locator('[data-share-link]').count(),2);
    await page.evaluate(({action,status})=>window.__library.failure={action,status,caseId:window.__library.ids[0]},{action,status});
    if(action==='share_create')await createButton(page,0).click();else await page.locator('[data-walkthrough-case]').first().getByRole('button',{name:'Revoke',exact:true}).click();
    await assertCleared(page);await retryFresh(page,uncertain);
}));
for(const [action,status] of [['library',401],['share_list',403]])test(`${action} load denial clears all cases, links and uncertain retries`,()=>fixture(async page=>{
    const uncertain=await leaveUncertainCreate(page);await page.evaluate(({action,status})=>{window.__library.failure={action,status};window.dispatchEvent(new Event('focus'));},{action,status});
    await assertCleared(page);await retryFresh(page,uncertain);
}));
test('a server 500 retains an uncertain create request ID/token and both previously displayed links',()=>fixture(async page=>{
    const old=await page.locator('[data-share-link]').evaluateAll(inputs=>inputs.map(input=>input.value)),uncertain=await leaveUncertainCreate(page);
    assert.deepEqual(await page.locator('[data-share-link]').evaluateAll(inputs=>inputs.map(input=>input.value)),old);
    await page.getByRole('button',{name:'Retry same link',exact:true}).click();await page.getByText('Link created. Nothing has been sent.',{exact:true}).waitFor();
    const commands=await page.evaluate(()=>window.__library.commands.filter(c=>c.action==='share_create'&&c.caseId===window.__library.ids[1]));assert.deepEqual(commands.at(-1),uncertain);assert.deepEqual(commands.at(-2),uncertain);
}));
test('a server 500 retains an uncertain revoke request and successful retry removes only that link',()=>fixture(async page=>{
    await page.evaluate(()=>window.__library.failure={action:'share_revoke',status:500,once:true});await page.locator('[data-walkthrough-case]').first().getByRole('button',{name:'Revoke',exact:true}).click();
    await page.getByText('Revocation could not be confirmed. Retry Revoke.',{exact:true}).waitFor();assert.equal(await page.locator('[data-share-link]').count(),2);
    await page.locator('[data-walkthrough-case]').first().getByRole('button',{name:'Revoke',exact:true}).click();await page.getByText('Link revoked.',{exact:true}).waitFor();
    assert.equal(await page.locator('[data-share-link]').count(),1);const commands=await page.evaluate(()=>window.__library.commands.filter(c=>c.action==='share_revoke'));assert.deepEqual(commands[0],commands[1]);
}));
test('a late successful create cannot restore private UI after another case loses authority',()=>fixture(async page=>{
    await page.evaluate(()=>window.__library.hold={action:'share_create',caseId:window.__library.ids[0]});await createButton(page,0).click();await page.waitForFunction(()=>typeof window.__library.release==='function');
    await page.evaluate(()=>window.__library.failure={action:'share_revoke',status:403,caseId:window.__library.ids[1]});await page.locator('[data-walkthrough-case]').nth(1).getByRole('button',{name:'Revoke',exact:true}).click();await assertCleared(page);
    await page.evaluate(()=>{window.__library.release();window.__library.hold=null;});await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,25)));await assertCleared(page);
}));
