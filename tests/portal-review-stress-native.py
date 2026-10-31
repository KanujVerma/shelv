"""Explicit owned-PG stress:2550 real typed publications/manifest scopes, bounded reads.
Synthetic identity/SQL component evidence only. No browser/Auth/provider claim.
"""
from pathlib import Path
import importlib.util,json,subprocess,time,uuid
spec=importlib.util.spec_from_file_location('review_native',Path(__file__).with_name('portal-review-native.py'));n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n)
n.guard();n.backup('before-stress2550');case=n.ReviewTests();case.setUp()
template=json.loads((n.ROOT/'tests/fixtures/concierge-presentation.json').read_text())['presentation']['categoryCards'][0]['currentProduct']
b=n.content();b['products']=[]
schedule=dict(periods=['morning','evening'],days=dict(kind='daily'),condition=None,asNeeded=False,stages=[],anchor='actual_start',automaticAdvance=False)
for i in range(50):
 p=dict(template);p.update(id='p'+str(i),name='🧴'*200,brand='🧴'*100,variant='🧴'*200,sizeLabel='🧴'*120,strength=dict(state='known',value='🧴'*200),category=dict(state='known',value='🧴'*200),identity='client_confirmed',formula='unknown',factIds=[],guides=[],evidence=[]);b['products'].append(p)
pids=[p['id'] for p in b['products']];b['context']['products']=dict(state='recorded',productIds=pids);b['context']['facts'][0]['text']='synthetic current products';b['routine']=[];b['decisions']=[]
for i in range(50):
 b['routine'].append(dict(id='r'+str(i),slotId='r'+str(i),kind='product',productId=pids[i],title='routine',directions=['original directions'],cautions=[],schedule=schedule))
 d=n.content()['decisions'][0];d.update(id='d'+str(i),slotId='d'+str(i),kind='keep',currentProductIds=pids,primaryProductId=pids[i],schedule=schedule);b['decisions'].append(d)
size=lambda obj:len(json.dumps(obj,separators=(',',':'),ensure_ascii=False).encode())
while len(b['consultationSections'])<49 and size(b)+16500<495000:b['consultationSections'].append(dict(title='synthetic original',body='🧴'*4000))
assert 470000<size(b)<500000,size(b)
# Preserve the source-valid large specimen. The unchanged original Plan RPC also
# bounds JSONB storage size, which can exceed compact wire bytes near 500k.
(n.E/'stress2550-source-max.json').write_text(json.dumps(b,ensure_ascii=False))
source_max_bytes=size(b)
storage=lambda: int(n.q('select pg_column_size('+n.lit(json.dumps(dict(schemaVersion=1,action='save_draft_v1',requestId=str(uuid.uuid4()),draftId=str(uuid.uuid4()),expectedContentRevision=0,expectedAssignmentRevision=0,kind='care_plan',content=b)))+'::jsonb)'))
source_max_storage=storage()
while storage()>499000 and b['consultationSections']:b['consultationSections'].pop()
assert storage()<=499000
prior=n.w.content;n.w.content=lambda:b
try:case.publish()
finally:n.w.content=prior
scopes=[(x['slotId'],x['productId']) for x in b['routine']]
for d in b['decisions']:
 for p in dict.fromkeys(d['currentProductIds']+d['alternativeProductIds']+[d['primaryProductId']]):scopes.append((d['slotId'],p))
assert len(set(scopes))==2550
day=n.q("select to_char((clock_timestamp() at time zone 'America/Chicago')::date,'YYYY-MM-DD')")
m=n.guard();path=Path(m['run'])/'stress2550-input.sql';start=time.monotonic()
with path.open('w') as out:
 for i,(slot,product) in enumerate(scopes):
  body=case.instruction_body(product,dict(useRevision=0,latestEventId=None,amendmentHeadId=None),day=day);body['slotId']=slot
  if i==0:
   body['directions']=['🧴'*4000 for _ in range(7)];gap=120000-size(body)-3;body['directions'].append('🧴'*(gap//4)+'x'*(gap%4));assert size(body)==120000
  base=dict(schemaVersion=1);create=dict(**base,action='create_guidance_draft_v1',requestId=str(uuid.uuid4()),clientId=n.C,body=body)
  # Every stage calls the actual public finite SQL RPC under authenticated synthetic A.
  sql=n.w.session(n.A)+"do $stress$ declare v jsonb;t jsonb;a jsonb;begin v:=public.concierge_guidance_command_v1("+n.lit(json.dumps(create))+"::jsonb);t:=v->'draft'->'target';perform public.concierge_guidance_command_v1(jsonb_build_object('schemaVersion',1,'action','review_guidance_v1','requestId',gen_random_uuid(),'target',t));a:=public.concierge_guidance_command_v1(jsonb_build_object('schemaVersion',1,'action','approve_guidance_v1','requestId',gen_random_uuid(),'target',t,'publisher',jsonb_build_object('kind','human','actorId',"+n.lit(n.A)+"),'scope','instruction.publish'));perform public.concierge_guidance_command_v1(jsonb_build_object('schemaVersion',1,'action','publish_guidance_v1','requestId',gen_random_uuid(),'target',t,'publisher',jsonb_build_object('kind','human','actorId',"+n.lit(n.A)+"),'approvalId',a->'approval'->'id'));end $stress$;commit;\n"
  out.write(sql)
  if i%100==99:out.write("select 'PROGRESS_"+str(i+1)+"';\n")
path.chmod(0o600)
with path.open() as source,(Path(m['run'])/'stress2550-publish.log').open('w') as log:
 r=subprocess.run([str(n.PG/'psql'),'-X','-w','-h',m['socket'],'-p',n.PORT,'-U','postgres','-d',n.DB,'-At','-q','-v','ON_ERROR_STOP=1'],stdin=source,stdout=log,stderr=log,env={**n.ENV,'PGPASSFILE':m['socket']+'/no-password'},text=True,timeout=1800)
assert r.returncode==0,'see owned stress2550-publish.log'
assert n.q('select count(*) from concierge.instruction_publications')=='2550'
v=case.ok(n.edge(n.C,'read_client_plan_v3',version=1));assert v['currentGuidance']['instructionCount']==2550;assert len(v['use']['planProducts'])==50;assert size(v)<=1800000
snapshot=v['currentGuidance']['snapshot'];cursor=None;ids=[];pages=0;maxpage=0
while True:
 page=case.ok(n.edge(n.C,'read_client_instruction_manifest_v1',snapshot=snapshot,cursor=cursor,limit=100));assert page['total']==2550;assert size(page)<=400000;maxpage=max(maxpage,size(page));ids.extend(x['instructionId'] for x in page['items']);pages+=1;cursor=page['nextCursor']
 if cursor is None:break
assert len(ids)==2550 and len(set(ids))==2550 and pages==26
first=json.loads(n.q("select value from concierge.review_instruction_entries("+n.lit(n.C)+",'{\"version\":1,\"documentSchemaVersion\":3}',"+n.lit(day)+"::date) value where value->'scope'->>'slotId'='r0' limit 1"))
detail=case.ok(n.edge(n.C,'read_client_instruction_v1',snapshot=snapshot,instructionId=first['instructionId'],version=first['version'],contentHash=first['contentHash']));assert size(detail['content']['body'])==120000;assert size(detail)<=400000
result=dict(scope='owned PG SQL component, synthetic identity',sourceMaxDocumentBytes=source_max_bytes,sourceMaxCommandJsonbBytes=source_max_storage,documentBytes=size(b),commandJsonbBytes=storage(),responseBytes=size(v),manifestCount=len(ids),pages=pages,maxPageBytes=maxpage,maxBodyBytes=size(detail['content']['body']),elapsedSeconds=time.monotonic()-start)
(Path(m['run'])/'stress2550-result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result));n.backup('stress2550-preserved')
