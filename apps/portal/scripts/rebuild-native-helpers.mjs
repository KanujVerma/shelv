import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, cp, readdir, chmod, copyFile} from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import {pathToFileURL} from 'node:url';
import {attestFixture, parentRoot, fixtureOwner, fixtureProject, fixtureDirectory} from './rebuild-native-fixture.mjs';
import {portalOrigin, sha} from './rebuild-native-boundary.mjs';

const image='public.ecr.aws/supabase/edge-runtime@sha256:ad45164b7548bf5820ed7be714789c17ac2865edce79a09cfb4c3756c3d365a8';
async function tree(directory,prefix='') {
  const result={};
  for(const entry of await readdir(directory,{withFileTypes:true})) {
    if(entry.isDirectory()) Object.assign(result,await tree(path.join(directory,entry.name),prefix+entry.name+'/'));
    else {assert.ok(entry.isFile());result[prefix+entry.name]=sha(await readFile(path.join(directory,entry.name)));}
  }
  return result;
}
async function free(port) {
  const server=net.createServer();
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
}

export async function prepareNativeHelpers(sourceRoot) {
  const f=await attestFixture(sourceRoot),{docker,helpers}=f;
  const area=path.join(fixtureDirectory,'edge/w6'),receiptPath=path.join(area,'HELPERS.json');
  try {
    const receipt=JSON.parse(await readFile(receiptPath,'utf8'));
    assert.equal(receipt.ownerId,fixtureOwner);assert.equal(receipt.projectId,fixtureProject);
    for(const item of receipt.containers) {
      const live=JSON.parse(docker('inspect',item.name))[0];assert.equal(live.Id,item.id);assert.equal(live.Config.Labels['shelv.fixture.owner'],fixtureOwner);assert.equal(live.Config.Labels['shelv.fixture.workdir'],fixtureDirectory);assert.equal(live.State.Running,true);assert.equal(live.Config.Image,image);
      assert.deepEqual(live.HostConfig.PortBindings['9000/tcp'],[{HostIp:'127.0.0.1',HostPort:String(item.port)}]);
      const values=Object.fromEntries(live.Config.Env.map(line=>{const split=line.indexOf('=');return[line.slice(0,split),line.slice(split+1)];}));
      assert.equal(values.CONCIERGE_ALLOWED_ORIGINS,'https://portal.goshelv.com,'+portalOrigin);assert.equal(values.DENO_TLS_CA_STORE,'system');assert.equal(values.SSL_CERT_FILE,'/certs/server.crt');
    }
    const storedHashes=JSON.parse(await readFile(path.join(area,'SOURCE-HASHES.json'),'utf8'));
    assert.deepEqual(await tree(path.join(area,'source')),storedHashes);assert.equal(sha(JSON.stringify(storedHashes)),receipt.sourceHashesSha256);
    const old=JSON.parse(docker('inspect',receipt.retainedStoppedPlan.name))[0];
    assert.equal(old.Id,receipt.retainedStoppedPlan.id);assert.equal(old.State.Running,false);assert.equal(old.Config.Image,image);assert.equal(old.Config.Labels['shelv.fixture.owner'],fixtureOwner);
    const beforeEnvironment=old.Config.Env.join('\n')+'\n';
    await writeFile(path.join(area,'plan-before.private.env'),beforeEnvironment,{mode:0o600});
    const before={ownerId:fixtureOwner,name:receipt.retainedStoppedPlan.name,id:old.Id,running:false,image,environmentSha256:sha(beforeEnvironment),originalSourceReceiptSha256:sha(await readFile(path.join(fixtureDirectory,'edge/SOURCE-HASHES.json'))),sourceUnmodified:true};
    await writeFile(path.join(area,'PLAN-BEFORE.json'),JSON.stringify(before,null,2)+'\n');
    return receipt;
  } catch(error) {if(error.code!=='ENOENT')throw error;}
  for(const port of [57441,57442])await free(port);
  await mkdir(area,{recursive:true,mode:0o700});
  const source=path.join(area,'source');
  // Dependency closure only. All copied files must match parent and child source bytes.
  const paths=['src/contracts',...(await readdir(path.join(sourceRoot,'supabase/functions'))).filter(n=>n.startsWith('concierge-')).map(n=>'supabase/functions/'+n),'supabase/functions/_shared/vendor/jpeg-js'];
  for(const relative of paths) {
    assert.deepEqual(await tree(path.join(sourceRoot,relative)),await tree(path.join(parentRoot,relative)),'Parent/child native source differs');
    await mkdir(path.dirname(path.join(source,relative)),{recursive:true});
    await cp(path.join(sourceRoot,relative),path.join(source,relative),{recursive:true,errorOnExist:true,force:false});
  }
  const sourceHashes=await tree(source);
  await writeFile(path.join(area,'SOURCE-HASHES.json'),JSON.stringify(sourceHashes,null,2)+'\n');
  const current=JSON.parse(docker('inspect',helpers.edge))[0];
  assert.equal(current.Id,helpers.edgeId);assert.equal(current.Config.Image,image);
  const environment=Object.fromEntries(current.Config.Env.map(line=>{const split=line.indexOf('=');return[line.slice(0,split),line.slice(split+1)];}));
  assert.equal(environment.DENO_TLS_CA_STORE,'system');
  assert.ok(environment.SSL_CERT_FILE);assert.equal(environment.SUPABASE_URL,'https://shelv-native-tls');
  assert.equal(environment.CONCIERGE_ALLOWED_ORIGINS,'https://portal.goshelv.com');
  environment.CONCIERGE_ALLOWED_ORIGINS='https://portal.goshelv.com,'+portalOrigin;
  environment.CONCIERGE_ZELLE_RECIPIENT_NAME='Synthetic local recipient';
  environment.CONCIERGE_ZELLE_RECIPIENT_EMAIL='native-receipt@example.invalid';
  const envFile=path.join(area,'edge.private.env');
  await writeFile(envFile,Object.entries(environment).map(([key,value])=>key+'='+value).join('\n')+'\n',{mode:0o600});await chmod(envFile,0o600);
  const caFile=environment.SSL_CERT_FILE;
  assert.ok(caFile.startsWith('/certs/'));assert.equal(caFile,'/certs/server.crt');
  const ca=path.join(fixtureDirectory,'edge/certs/ca.crt');
  const copiedCerts=path.join(area,'certs');await mkdir(copiedCerts);await copyFile(ca,path.join(copiedCerts,'server.crt'));
  const containers=[];
  async function create(name,family,port,memory) {
    assert.ok(!docker('ps','-a','--format','{{.Names}}').split('\n').includes(name),'Refusing existing helper');
    const id=docker('create','--name',name,'--label','shelv.fixture.owner='+fixtureOwner,'--label','shelv.fixture.project='+fixtureProject,'--label','shelv.fixture.workdir='+fixtureDirectory,'--network',helpers.network,'--memory',memory,'--cpus','1','-p',`127.0.0.1:${port}:9000`,'--env-file',envFile,image,'start','--main-service','/app/supabase/functions/'+family,'--port','9000');
    const item={name,id,port,memory,entry:'supabase/functions/'+family+'/index.ts'};containers.push(item);
    await writeFile(path.join(area,'CREATED.json'),JSON.stringify({ownerId:fixtureOwner,containers},null,2)+'\n');
    docker('cp',source,name+':/app');
  }
  // docker cp works on a stopped container; exec does not. Start only after CA copy.
  async function copyAndStart(item) {docker('cp',copiedCerts,item.name+':/certs');docker('start',item.name);}
  // Keep explicit copy/start order and receipts rather than bind mounting .t3.
  async function add(name,family,port,memory) {
    // create() records before any copy; no cleanup/delete of retained resources.
    await create(name,family,port,memory);
    const item=containers.at(-1);await copyAndStart(item);return item;
  }
  const suffix='6214c3841fb3';
  await add('portal-w6-operations-'+suffix,'concierge-operations',57441,'128m');
  await add('portal-w6-payments-'+suffix,'concierge-payments',57442,'128m');
  const originalNginx=await readFile(path.join(fixtureDirectory,'edge/nginx.conf'),'utf8');
  assert.equal((originalNginx.match(/location \/ \{ return 404; \}/g)??[]).length,1);
  const extra=['concierge_advisor_directory','concierge_payment_view_v2','concierge_payment_write_v2'].map(rpc=>`location = /rest/v1/rpc/${rpc} { proxy_pass http://supabase_kong_${fixtureProject}:8000; } `).join('');
  const nginx=originalNginx.replace('location / { return 404; }',extra+'location / { return 404; }');
  await writeFile(path.join(area,'nginx.original.conf'),originalNginx);await writeFile(path.join(area,'nginx.conf'),nginx);
  docker('cp',path.join(area,'nginx.conf'),helpers.tls+':/etc/nginx/nginx.conf');docker('exec',helpers.tls,'nginx','-t');docker('exec',helpers.tls,'nginx','-s','reload');
  // Existing plan env cannot change in place. Preserve the exact old container stopped.
  const retained=helpers.edge+'-w6-before';
  assert.ok(!docker('ps','-a','--format','{{.Names}}').split('\n').includes(retained));
  await writeFile(path.join(area,'PLAN-BEFORE.json'),JSON.stringify({ownerId:fixtureOwner,name:helpers.edge,id:helpers.edgeId,retained},null,2)+'\n');
  docker('stop',helpers.edge);docker('rename',helpers.edge,retained);
  try {
    const item=await add(helpers.edge,'concierge-plans',57440,'256m');
    const updated={...helpers,edgeId:item.id,retainedStoppedW6Edge:retained,updatedAt:new Date().toISOString(),w6Origins:environment.CONCIERGE_ALLOWED_ORIGINS};
    await writeFile(path.join(fixtureDirectory,'edge/HELPERS.json'),JSON.stringify(updated,null,2)+'\n');
  } catch(error) {
    // Never delete a partially created helper. Preserve it and recover original if free.
    const names=docker('ps','-a','--format','{{.Names}}').split('\n');
    if(names.includes(helpers.edge)) {
      const partial=JSON.parse(docker('inspect',helpers.edge))[0],owned=containers.find(item=>item.name===helpers.edge);
      assert.equal(partial.Id,owned?.id,'Cannot alter an unrecorded partial helper');assert.equal(partial.Config.Labels['shelv.fixture.owner'],fixtureOwner);
      if(partial.State.Running)docker('stop',helpers.edge);
      docker('rename',helpers.edge,helpers.edge+'-w6-incomplete-'+partial.Id.slice(0,8));
    }
    docker('rename',retained,helpers.edge);docker('start',helpers.edge);
    await writeFile(path.join(area,'PLAN-RECOVERED.json'),JSON.stringify({ownerId:fixtureOwner,id:helpers.edgeId,running:true,partialResourcesRetained:true,at:new Date().toISOString()})+'\n');
    throw error;
  }
  const receipt={ownerId:fixtureOwner,projectId:fixtureProject,containers,retainedStoppedPlan:{name:retained,id:helpers.edgeId},sourceHashesSha256:sha(JSON.stringify(sourceHashes)),origins:environment.CONCIERGE_ALLOWED_ORIGINS,rpcAdditions:['concierge_advisor_directory','concierge_payment_view_v2','concierge_payment_write_v2'],createdAt:new Date().toISOString()};
  await writeFile(receiptPath,JSON.stringify(receipt,null,2)+'\n');
  return receipt;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  const receipt=await prepareNativeHelpers(path.resolve(import.meta.dirname,'../../..'));
  console.log(JSON.stringify(receipt));
}
