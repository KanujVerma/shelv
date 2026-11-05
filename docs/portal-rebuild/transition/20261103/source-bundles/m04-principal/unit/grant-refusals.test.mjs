import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateExecutionGrant,executePrincipalSetup} from '../executor/principal-setup.mjs';
const pins=JSON.parse(readFileSync(new URL('../source/EXECUTOR-PINS.json',import.meta.url)));
const sha=b=>createHash('sha256').update(b).digest('hex'),id='30000000-0000-4000-8000-000000000001',digest='a'.repeat(64);
function input(){
 const fixtureDirectory=pins.root+'/.local-artifacts/principal-negative-only',privateDirectory=fixtureDirectory+'/private';
 const ref=file=>({file,sha256:digest});
 const g={schemaVersion:1,kind:'M04_TRUSTED_PRINCIPAL_SETUP',parentThreadId:'9b085ada-435f-48d6-8886-957c1ce3e82d',executionTaskId:'node:delegated-task:synthetic-control-not-an-actual-execution',ownerId:id,projectId:'sa-'+id.replaceAll('-',''),source:{root:pins.root,commit:pins.source,targetFile:new URL('../source/ROOT_359C_SOURCE_TARGET.json',import.meta.url).pathname,targetSha256:pins.targetSha256,gitMetadata:{headFile:'/synthetic/git/HEAD',headSha256:digest,indexFile:'/synthetic/git/index',indexSha256:digest,logicalIndexSha256:digest,statusSha256:digest}},executor:{path:new URL('../executor/principal-setup.mjs',import.meta.url).pathname,sha256:digest},helper:{path:new URL('../source/native-read-joined.mjs',import.meta.url).pathname,sha256:pins.helperSha256},sql:{path:new URL('../source/principal-setup.sql',import.meta.url).pathname,sha256:pins.sqlSha256},context:{fixtureDirectory,descriptor:ref(fixtureDirectory+'/DESCRIPTOR.json'),sourceRecord:ref(fixtureDirectory+'/SOURCE.json'),resources:ref(privateDirectory+'/RESOURCES.json'),runtimeLedger:ref(privateDirectory+'/LEDGER.json'),status:ref(privateDirectory+'/status.private.json'),ca:ref(privateDirectory+'/fixture-ca.crt'),docker:{path:'/opt/homebrew/bin/docker',sha256:digest,host:'unix:///Users/kanuj/.colima/shelv-portal-20261024/docker.sock'},database:{id:'b'.repeat(64),name:'/supabase_db_sa-'+id.replaceAll('-',''),imageId:'sha256:'+'c'.repeat(64),created:'2026-11-03T10:00:00Z',startedAt:'2026-11-03T10:00:01Z',labels:{'com.supabase.cli.project':'sa-'+id.replaceAll('-',''),'com.supabase.cli.workdir':fixtureDirectory},ports:{},networks:{owned:{NetworkID:'d'.repeat(64)}}}},attempt:{claimFile:privateDirectory+'/M04-PRINCIPAL-SETUP-ATTEMPT.json'},expiresAt:'2080-01-01T00:00:00Z',authorization:'SYNTHETIC NEGATIVE DATA, NEVER AN EXECUTION GRANT',actions:['create-two-permanent-synthetic-principals','activate-initial-plan-policy']};
 return {g,wrap(g){const grantBytes=Buffer.from(JSON.stringify(g));return {grantBytes,expectedGrantSha256:sha(grantBytes),executionTaskId:g.executionTaskId,executorSha256:digest,sqlSha256:pins.sqlSha256};}};
}
const cases=[
 ['unknown authority flag',g=>{g.authorized=true;}],
 ['wrong parent',g=>{g.parentThreadId=id;}],
 ['source task cannot authorize execution',g=>{g.executionTaskId=pins.sourceTaskId;}],
 ['wrong source commit',g=>{g.source.commit='0'.repeat(40);} ],
 ['wrong full target',g=>{g.source.targetSha256='0'.repeat(64);} ],
 ['foreign Root',g=>{g.source.root='/foreign/root';}],
 ['changed executor',g=>{g.executor.sha256='0'.repeat(64);} ],
 ['changed joined helper',g=>{g.helper.sha256='0'.repeat(64);} ],
 ['changed SQL',g=>{g.sql.sha256='0'.repeat(64);} ],
 ['expired grant',g=>{g.expiresAt='2000-01-01T00:00:00Z';}],
 ['invalid mode/version',g=>{g.schemaVersion=2;}],
 ['added retry action',g=>{g.actions.push('retry');}],
 ['arbitrary claim path',g=>{g.attempt.claimFile=g.context.fixtureDirectory+'/claim.json';}],
 ['non-UUID evidence directory',g=>{g.attempt.directory=g.context.fixtureDirectory+'/private/m04-principal-arbitrary';}],
 ['foreign descriptor path',g=>{g.context.descriptor.file='/outside/DESCRIPTOR.json';}],
 ['foreign SOURCE path',g=>{g.context.sourceRecord.file='/outside/SOURCE.json';}],
 ['foreign resource path',g=>{g.context.resources.file='/outside/RESOURCES.json';}],
 ['multiple database IDs',g=>{g.context.database.ids=[g.context.database.id];}],
 ['malformed DB id',g=>{g.context.database.id='; docker ps';}],
 ['wrong DB name',g=>{g.context.database.name='/supabase_db_other';}],
 ['missing DB image',g=>{delete g.context.database.imageId;}],
 ['wrong owner label',g=>{g.context.database.labels['com.supabase.cli.project']='foreign';}],
 ['dynamic Docker command path',g=>{g.context.docker.path='/bin/sh';}],
 ['arbitrary Docker host',g=>{g.context.docker.host='tcp://foreign:2375';}],
 ['capturing Config.Env is not allowed',g=>{g.context.database.env={SECRET:'synthetic'};}],
 ['authority/currentness in context',g=>{g.context.current=true;}],
 ['caller function source grant',g=>{g.authorization={callback:'not permitted'};}],
];
for(const [name,corrupt] of cases)test('grant refuses '+name,()=>{const x=input();
 // Pure shape reachability only, never execute or claim authority from this data.
 validateExecutionGrant(x.wrap(x.g));corrupt(x.g);assert.throws(()=>validateExecutionGrant(x.wrap(x.g)),/E_PRINCIPAL_/);});
test('external raw hash is checked before parsing grant data',()=>{const x=input().wrap(input().g);x.expectedGrantSha256='0'.repeat(64);assert.throws(()=>validateExecutionGrant(x),/E_PRINCIPAL_RAW_HASH/);});
test('unknown validation input cannot supply a callback port',()=>{const x=input();assert.throws(()=>validateExecutionGrant({...x.wrap(x.g),ports:{}}),/E_PRINCIPAL_FIELDS/);});
test('malformed JSON remains a setup refusal',()=>assert.throws(()=>validateExecutionGrant({grantBytes:Buffer.from('{'),expectedGrantSha256:sha(Buffer.from('{')),executionTaskId:'node:delegated-task:synthetic',executorSha256:digest,sqlSha256:pins.sqlSha256}),/E_PRINCIPAL_JSON/));
for(const mode of ['sourcecheck','observe','retry','stop','start'])test('closed mode refuses '+mode+' before any private read',async()=>{
 await assert.rejects(executePrincipalSetup({mode,grantFile:'/MUST-NOT-BE-READ',expectedGrantSha256:digest,executionTaskId:'node:delegated-task:synthetic',signal:undefined}),/E_PRINCIPAL_MODE/);
});
test('missing external hash refuses before any private read',async()=>{
 await assert.rejects(executePrincipalSetup({mode:'execute',grantFile:'/MUST-NOT-BE-READ',expectedGrantSha256:undefined,executionTaskId:'node:delegated-task:synthetic',signal:undefined}),/E_PRINCIPAL_RAW_HASH/);
});
test('callback-capable fake signal refuses before any private read',async()=>{
 await assert.rejects(executePrincipalSetup({mode:'execute',grantFile:'/MUST-NOT-BE-READ',expectedGrantSha256:digest,executionTaskId:'node:delegated-task:synthetic',signal:{aborted:false}}),/E_PRINCIPAL_SIGNAL/);
});
test('already aborted real signal refuses before any private read',async()=>{
 const c=new AbortController();c.abort();await assert.rejects(executePrincipalSetup({mode:'execute',grantFile:'/MUST-NOT-BE-READ',expectedGrantSha256:digest,executionTaskId:'node:delegated-task:synthetic',signal:c.signal}),/E_PRINCIPAL_ABORTED/);
});
