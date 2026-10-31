"""Complete private-source manifest stress in the own synthetic Unix PG lane only."""
from pathlib import Path
import hashlib,importlib.util,json,subprocess,time,uuid
spec=importlib.util.spec_from_file_location('review_native',Path(__file__).with_name('portal-review-native.py'));n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n)
n.guard();n.backup('before-manifest100');case=n.ReviewTests();case.setUp();case.publish();m=n.guard();run=Path(m['run']);start=time.monotonic()
source=str(uuid.uuid4());n.q('insert into concierge.plan_sources(id,client_id,version) values('+n.lit(source)+','+n.lit(n.C)+',1);insert into concierge.plan_source_permissions values('+n.lit(n.S)+','+n.lit(source)+')')
size=lambda x:len(json.dumps(x,separators=(',',':'),ensure_ascii=False).encode())
limits_code="import {reviewReferencesMax,conversationFactsMax,reviewSourcesPerFactMax,guidanceSourceLocationsMax} from './src/contracts/PortalReviewValues.ts';console.log(JSON.stringify([reviewReferencesMax,conversationFactsMax,reviewSourcesPerFactMax,guidanceSourceLocationsMax]));"
r=subprocess.run([n.NODE,'--experimental-strip-types','--input-type=module','-e',limits_code],cwd=n.ROOT,env=n.ENV,capture_output=True,text=True,check=True);refs,facts,per_fact,total=json.loads(r.stdout);assert refs*facts*per_fact==total==100000

def body(i):return dict(publication=dict(version=1,documentSchemaVersion=3),occurredOn=dict(state='unknown'),channel='call',clientReported=[dict(id='fact'+str(f),text='synthetic actual observation',sources=[dict(sourceId=source,sourceVersion=1,locator=dict(kind='text',start=i*facts*per_fact+f*per_fact+j,end=i*facts*per_fact+f*per_fact+j+1)) for j in range(per_fact)]) for f in range(facts)],advisorConclusions=[],agentProposals=[],contradictions=[])
def record(i,b):return n.edge(n.A,'record_conversation_v1',requestId=str(uuid.uuid4()),clientId=n.C,expectedReportRevision=i,body=b)
first=case.ok(record(0,body(0)));ids=[first['event']];path=run/'manifest100-input.sql';max_body=0;max_command=0
with path.open('w') as out:
 for i in range(1,refs-1):
  b=body(i);cmd=dict(schemaVersion=1,action='record_conversation_v1',requestId=str(uuid.uuid4()),clientId=n.C,expectedReportRevision=i,body=b);max_body=max(max_body,size(b));max_command=max(max_command,size(cmd));assert size(b)<=250000 and size(cmd)<=500000
  out.write(n.w.session(n.A)+'select public.concierge_review_command_v1('+n.lit(json.dumps(cmd))+'::jsonb);commit;\n')
  if i%10==0:out.write("select 'PROGRESS_"+str(i)+"';\n")
path.chmod(0o600)
with path.open() as inp,(run/'manifest100-record.log').open('w') as log:
 r=subprocess.run([str(n.PG/'psql'),'-X','-w','-h',m['socket'],'-p',n.PORT,'-U','postgres','-d',n.DB,'-At','-q','-v','ON_ERROR_STOP=1'],stdin=inp,stdout=log,stderr=log,env={**n.ENV,'PGPASSFILE':m['socket']+'/no-password'},text=True,timeout=600)
assert r.returncode==0,'see owned manifest100-record.log'
ids.extend(json.loads(line)['event'] for line in (run/'manifest100-record.log').read_text().splitlines() if line.startswith('{'))
last_body=body(refs-1);last=case.ok(record(refs-1,last_body));ids.append(last['event']);assert len(ids)==refs
review=case.guidance_body();review['reportRefs']=ids;create=lambda b:case.ok(case.g('create_guidance_draft_v1',actor=n.S,requestId=str(uuid.uuid4()),clientId=n.C,body=b))['draft']
draft=create(review);manifest=draft['capturedBasis']['sourceManifest'];assert manifest['count']==total and 'sources' not in draft['capturedBasis'];assert size(draft)<=1800000

def canonical(location):return json.dumps(location,sort_keys=True,separators=(',',':'),ensure_ascii=False)
locations=[canonical(dict(sourceId=source,sourceVersion=1,locator=dict(kind='text',start=i,end=i+1))) for i in range(total)]
def digest(values):
 h=hashlib.sha256()
 for value in sorted(set(values)):h.update(hashlib.sha256(value.encode()).digest())
 return h.hexdigest()
def expected_hash(b,locator_digest):
 inputs=json.loads(n.q("select jsonb_agg(jsonb_build_object('event',ref,'contentHash',concierge.plan_hash(cv.body),'amendmentHeadId',null,'amendmentContentHash',null) order by ref->>'kind',ref->>'id') from jsonb_array_elements("+n.lit(json.dumps(b['reportRefs']))+"::jsonb) ref join concierge.review_conversations cv on cv.id=(ref->>'id')::uuid and cv.client_id="+n.lit(n.C)))
 return n.q("select concierge.plan_hash(jsonb_build_object('schemaVersion',1,'inputs',"+n.lit(json.dumps(inputs))+"::jsonb,'locatorDigest',"+n.lit(locator_digest)+",'count',"+str(total)+'))')
assert expected_hash(review,digest(locations))==manifest['hash'],'complete independently computed tuple-digest relation must match canonical server framing'
# Legal immutable replacement: only the last locator changes in a new conversation.
last_body['clientReported'][-1]['sources'][-1]['locator']=dict(kind='text',start=total+100,end=total+101)
replacement=case.ok(record(refs,last_body));review2={**review,'reportRefs':ids[:-1]+[replacement['event']]};draft2=create(review2);manifest2=draft2['capturedBasis']['sourceManifest'];assert manifest2['count']==total and manifest2['hash']!=manifest['hash']
locations[-1]=canonical(dict(sourceId=source,sourceVersion=1,locator=dict(kind='text',start=total+100,end=total+101)));assert expected_hash(review2,digest(locations))==manifest2['hash']
# Complete actual private evidence, with no hash-only claim of reviewed records.
entries=[];cursor=None;pages=0;max_page=0
while True:
 page=case.ok(n.edge(n.S,'read_advisor_care_history_v1',clientId=n.C,cursor=cursor,limit=100,version=None));max_page=max(max_page,size(page));assert size(page)<=400000;entries.extend(page['entries']);pages+=1;cursor=page['nextCursor']
 if cursor is None:break
conversations=[x['event'] for x in entries if x['kind']=='conversation'];assert len(conversations)==refs+1;assert sum(len(f['sources']) for x in conversations for f in x['body']['clientReported'])==total+facts*per_fact
public=case.ok(n.edge(n.C,'read_client_plan_v3',version=1));assert not any(key in json.dumps(public) for key in ['sourceManifest','locatorDigest',source]);assert size(public)<=1800000
# Source version and deletion are live authority gates, not private manifest mutation.
stored=n.q('select basis from concierge.review_guidance_revisions where draft_id='+n.lit(draft2['target']['draftId']))
n.q('update concierge.plan_sources set version=2 where id='+n.lit(source));assert case.g('read_guidance_draft_v1',actor=n.S,draftId=draft2['target']['draftId'])['status']==409;assert n.q('select basis from concierge.review_guidance_revisions where draft_id='+n.lit(draft2['target']['draftId']))==stored
n.q('delete from concierge.plan_source_permissions where source_id='+n.lit(source)+';delete from concierge.plan_sources where id='+n.lit(source));assert case.g('read_guidance_draft_v1',actor=n.S,draftId=draft2['target']['draftId'])['status']==409;assert n.edge(n.S,'read_advisor_publication_v3',clientId=n.C,version=1)['status']==200
result=dict(scope='owned synthetic SQL/component only',conversationCount=refs,factsPerConversation=facts,locationsPerFact=per_fact,distinctLocations=manifest['count'],maxConversationBytes=max_body,maxCommandBytes=max_command,draftBytes=size(draft),privateHistoryPages=pages,maxHistoryPageBytes=max_page,completeEvidenceLocationCount=total+facts*per_fact,publicResponseBytes=size(public),lastLocatorChangesHash=True,elapsedSeconds=time.monotonic()-start)
(run/'manifest100-result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result));n.backup('manifest100-preserved')
