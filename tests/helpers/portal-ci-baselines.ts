/** Immutable test inputs, independent of checkout depth and local author refs. */
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const fixtureSha256='90ade94d3dabda72595390afca5a0fb46f4ae7732c714526b2109698ce5e0d07';
const defaultFixture=new URL('../fixtures/portal-ci-baselines.json',import.meta.url);
type Content={encoding:'base64';bytes:number;sha256:string;data:string};
type Entry={path:string;mode:string;type:string;blob:string;content?:Content};
type Commit={commit:string;tree:string;completeInventory:boolean;entries:Entry[]};
type Fixture={schemaVersion:1;commits:Commit[]};

function requireValue(value:unknown,code:string):asserts value {
  if(!value)throw new Error(code);
}
function validPath(name:string):boolean {
  return typeof name==='string'&&name.length>0&&!name.includes('\0')&&!name.includes('\\')&&name.split('/').every(p=>p!==''&&p!=='.'&&p!=='..');
}

export function loadPortalCiBaselines(file:string|URL=defaultFixture){
  const raw=readFileSync(file);
  requireValue(createHash('sha256').update(raw).digest('hex')===fixtureSha256,'historical_fixture_integrity');
  const fixture=JSON.parse(raw.toString('utf8')) as Fixture;
  requireValue(fixture.schemaVersion===1&&Array.isArray(fixture.commits),'historical_fixture_shape');
  const commits=new Map<string,{complete:boolean;entries:Map<string,Entry>;bytes:Map<string,Buffer>}>();
  for(const item of fixture.commits){
    requireValue(/^[a-f0-9]{40}$/.test(item.commit)&&/^[a-f0-9]{40}$/.test(item.tree)&&!commits.has(item.commit),'ambiguous_historical_commit');
    requireValue(typeof item.completeInventory==='boolean'&&Array.isArray(item.entries),'historical_inventory_shape');
    const entries=new Map<string,Entry>(),bytes=new Map<string,Buffer>();
    for(const entry of item.entries){
      requireValue(validPath(entry.path)&&!entries.has(entry.path),'ambiguous_historical_path');
      requireValue(/^[a-f0-9]{40}$/.test(entry.blob)&&['100644','100755','120000','160000'].includes(entry.mode),'historical_blob_identity');
      requireValue(entry.type===(entry.mode==='160000'?'commit':'blob'),'historical_blob_type');
      entries.set(entry.path,entry);
      if(entry.content){
        const c=entry.content;
        requireValue(c.encoding==='base64'&&typeof c.data==='string'&&Number.isSafeInteger(c.bytes)&&c.bytes>=0,'historical_content_shape');
        const data=Buffer.from(c.data,'base64');
        requireValue(data.toString('base64')===c.data&&data.length===c.bytes,'historical_content_length');
        requireValue(createHash('sha256').update(data).digest('hex')===c.sha256,'historical_content_sha256');
        requireValue(createHash('sha1').update(Buffer.from('blob '+data.length+'\0')).update(data).digest('hex')===entry.blob,'historical_content_blob');
        bytes.set(entry.path,data);
      }
    }
    commits.set(item.commit,{complete:item.completeInventory,entries,bytes});
  }
  function commit(ref:string){
    requireValue(/^[a-f0-9]{40}$/.test(ref),'invalid_historical_commit');
    const item=commits.get(ref);requireValue(item,'unknown_historical_commit');return item;
  }
  return Object.freeze({
    paths(ref:string):readonly string[]{
      const item=commit(ref);requireValue(item.complete,'incomplete_historical_inventory');
      return Object.freeze([...item.entries.keys()]);
    },
    readBytes(ref:string,name:string):Buffer{
      const item=commit(ref);requireValue(validPath(name),'invalid_historical_path');
      requireValue(item.entries.has(name),item.complete?'historical_path_absent':'missing_historical_snapshot');
      const bytes=item.bytes.get(name);requireValue(bytes,'missing_historical_snapshot');
      return Buffer.from(bytes);
    },
  });
}

export const portalCiBaselines=loadPortalCiBaselines();
