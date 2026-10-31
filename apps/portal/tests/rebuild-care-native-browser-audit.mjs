import assert from 'node:assert/strict';
import {readFile,readdir,lstat,realpath} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {X509Certificate} from 'node:crypto';
import path from 'node:path';
import {sha} from '../scripts/rebuild-native-boundary.mjs';
import {selectCareFixture} from '../scripts/rebuild-care-native-fixture.mjs';

// Called only inside the separately granted run. No import-time resource work.
export async function inventoryProtected(directory) {
  assert.equal(await realpath(directory),directory);const entries={};
  async function visit(dir,prefix=''){for(const entry of await readdir(dir,{withFileTypes:true})){assert.ok(!entry.isSymbolicLink(),'Protected inventory rejects symlinks');const relative=prefix+entry.name,file=path.join(dir,entry.name);if(entry.isDirectory())await visit(file,relative+'/');else{const stat=await lstat(file);assert.ok(stat.isFile());entries[relative]={bytes:stat.size,mode:stat.mode&0o777,sha256:sha(await readFile(file))};}}}
  await visit(directory);assert.ok(Object.keys(entries).length>=205,'Expected preserved R7 inventory plus later grants');
  return Object.fromEntries(Object.entries(entries).sort(([a],[b])=>a.localeCompare(b)));
}
export async function verifyProtected(directory,before) {
  for(const [relative,item] of Object.entries(before)) {const file=path.resolve(directory,relative);assert.ok(file.startsWith(directory+path.sep));const stat=await lstat(file);assert.ok(stat.isFile()&&!stat.isSymbolicLink());assert.deepEqual({bytes:stat.size,mode:stat.mode&0o777,sha256:sha(await readFile(file))},item,'Pre-existing protected R7 file changed');}
  return {unchanged:Object.keys(before).length,inventorySha256:sha(JSON.stringify(before))};
}
export function ownBrowserProcesses() {
  const rows=execFileSync('/bin/ps',['-axo','pid=,ppid=,comm='],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim().split('\n').map(line=>{const m=line.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/);return m?{pid:Number(m[1]),ppid:Number(m[2]),command:m[3]}:null;}).filter(Boolean);
  const owned=new Set([process.pid]);for(let n=0;n<20;n++){const old=owned.size;for(const r of rows)if(owned.has(r.ppid))owned.add(r.pid);if(owned.size===old)break;}
  return rows.filter(r=>owned.has(r.pid)&&/Chrome|Chromium|workerd/i.test(r.command));
}
export function assertOwnProcessesClosed(before) {
  const rows=execFileSync('/bin/ps',['-axo','pid=,comm='],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim().split('\n').map(line=>{const m=line.trim().match(/^(\d+)\s+(.+)$/);return m?{pid:Number(m[1]),command:m[2]}:null;}).filter(Boolean);
  const remaining=rows.filter(r=>before.some(old=>old.pid===r.pid&&old.command===r.command));assert.deepEqual(remaining,[],'Owned Chrome/workerd process still present');assert.deepEqual(ownBrowserProcesses(),[]);
  return {captured:before,remaining:[],observedAt:new Date().toISOString()};
}
export async function auditCareBrowserResources(fixture) {
  selectCareFixture(fixture.selection);
  const nginx=fixture.docker('exec',fixture.selection.helpers.tls.name,'cat','/etc/nginx/nginx.conf');
  const expected=['concierge_plan_command_v1','concierge_advisor_directory','concierge_payment_view_v2','concierge_payment_write_v2','concierge_care_command_v1'].sort();
  assert.deepEqual([...nginx.matchAll(/location\s*=\s*\/rest\/v1\/rpc\/([a-z0-9_]+)\s*\{/g)].map(m=>m[1]).sort(),expected);
  assert.equal((nginx.match(/location\s+\/\s*\{\s*return 404;\s*\}/g)??[]).length,1);
  const certificate=nginx.match(/ssl_certificate\s+(\/certs\/[a-zA-Z0-9._-]+\.crt)\s*;/)?.[1];assert.ok(certificate,'Read the actual nginx certificate path, never assume server.crt');
  const leafPem=fixture.docker('exec',fixture.selection.helpers.tls.name,'cat',certificate),caPems=[];
  for(const kind of ['plan','operations','payments','care'])caPems.push(fixture.docker('exec',fixture.selection.helpers[kind].name,'cat','/certs/server.crt'));
  assert.ok(caPems.every(pem=>pem===caPems[0]));const ca=new X509Certificate(caPems[0]),leaf=new X509Certificate(leafPem);
  assert.equal(ca.ca,true);assert.equal(leaf.ca,false);assert.notEqual(sha(leaf.raw),sha(ca.raw));assert.equal(leaf.verify(ca.publicKey),true);assert.equal(leaf.checkHost('shelv-native-tls'),'shelv-native-tls');
  const now=Date.now();for(const cert of [ca,leaf])assert.ok(Date.parse(cert.validFrom)<=now&&now<=Date.parse(cert.validTo));
  // Bind live nginx/certificates to actual parent-prepared bytes without printing them.
  const prepared=await inventoryProtected(fixture.directory),files=Object.keys(prepared),match=async(text,suffix)=>{for(const file of files.filter(f=>f.endsWith(suffix)))if((await readFile(path.join(fixture.directory,file),'utf8')).trim()===text.trim())return file;throw Error('Live TLS configuration has no identical prepared source');};
  const nginxSource=await match(nginx,'.conf'),caSource=await match(caPems[0],'.crt'),leafSource=await match(leafPem,'.crt');
  return {observedAt:new Date().toISOString(),lineage:fixture.lineage,helpers:Object.fromEntries(Object.entries(fixture.selection.helpers).map(([kind,value])=>[kind,{id:value.id,environmentSha256:value.environmentSha256}])),copiedSourceFiles:Object.keys(fixture.sourceHashes).length,tls:{nginxSha256:sha(nginx),caSha256:sha(ca.raw),leafSha256:sha(leaf.raw),certificatePath:certificate,nginxSource,caSource,leafSource,finiteRpc:expected,leafCA:false},sessions:Number(fixture.sql('select count(*) from auth.sessions')),refreshTokens:Number(fixture.sql('select count(*) from auth.refresh_tokens'))};
}
