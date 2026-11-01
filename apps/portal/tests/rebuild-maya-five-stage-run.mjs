// Print the true result before retaining immutable command evidence. No services.
import {spawnSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const [label,command,...args]=process.argv.slice(2);
if(!label||!command||!/^[a-z0-9-]+$/.test(label))throw Error('label and command required');
const result=spawnSync(command,args,{encoding:'utf8',maxBuffer:32*1024*1024});
const output=(result.stdout??'')+(result.stderr??'')+(result.error?'\n'+result.error.stack:'');
const exit=result.status??1;
process.stdout.write(output);console.log('TRUE_EXIT='+exit);
const dir=new URL('../../../.local-artifacts/portal-rebuild/maya-five-stage/',import.meta.url);await mkdir(dir,{recursive:true});
const file=new URL(label+'-'+Date.now()+'.log',dir);
const log=JSON.stringify({command,args,status:result.status,signal:result.signal})+'\n'+output+'\nTRUE_EXIT='+exit+'\n';
await writeFile(file,log,{flag:'wx',mode:0o444});
console.log('IMMUTABLE_LOG='+file.pathname+' SHA256='+createHash('sha256').update(log).digest('hex'));
process.exitCode=exit;
