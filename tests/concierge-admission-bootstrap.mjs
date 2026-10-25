// Mark only an explicitly selected disposable local Supabase stack after migration replay.
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
assert.equal(process.env.SHELV_ADMISSION_BOOTSTRAP_DISPOSABLE,'1','Explicit disposable-local bootstrap opt-in required');
assert.ok(process.env.SHELV_ADMISSION_LOCAL_CONFIG,'Supply local Supabase status JSON');
const config=JSON.parse(await readFile(process.env.SHELV_ADMISSION_LOCAL_CONFIG,'utf8'));
for(const name of ['API_URL','DB_URL']){const url=new URL(config[name]);assert.ok(['127.0.0.1','localhost','[::1]'].includes(url.hostname),'Hosted targets are forbidden');}
const container=process.env.SHELV_ADMISSION_DB_CONTAINER;assert.ok(/^supabase_db_[a-zA-Z0-9_-]+$/.test(container??''));
const labels=JSON.parse(execFileSync('docker',['inspect',container,'--format','{{json .Config.Labels}}'],{encoding:'utf8'}));
assert.equal(labels['com.supabase.cli.project'],container.slice('supabase_db_'.length),'Container must match the selected local CLI project');
const command=['exec','-i',container,'psql','-U','postgres','-d','postgres','-X','-At','-v','ON_ERROR_STOP=1'];
const sql=text=>execFileSync('docker',command,{input:text,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
assert.equal(sql("select to_regprocedure('public.concierge_admission_begin(uuid,text,text)') is not null"),'t','Replay the admission migration first');
if(sql("select to_regclass('public.shelv_admission_fixture_marker') is not null")==='t')assert.equal(sql('select marker from public.shelv_admission_fixture_marker'),'shelv-admission-20261024');
else{
 assert.equal(sql('select count(*) from auth.users'),'0','Only an empty disposable Auth fixture can be marked initially');
 sql("begin;create table public.shelv_admission_fixture_marker(marker text primary key check(marker='shelv-admission-20261024'));insert into public.shelv_admission_fixture_marker values('shelv-admission-20261024');revoke all on public.shelv_admission_fixture_marker from public,anon,authenticated,service_role;commit;");
}
console.log('Verified marked disposable local admission fixture; no identities or emails created.');
