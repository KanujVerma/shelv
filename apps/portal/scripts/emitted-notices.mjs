import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const legalName=/^(licen[cs]e|notice|copying|copyright)([.-]|$)/i;
async function packageFor(input,workingDirectory) {
  let directory=path.dirname(path.resolve(workingDirectory,input));
  while(directory!==path.dirname(directory)) {
    try {
      const pkg=JSON.parse(await readFile(path.join(directory,'package.json'),'utf8'));
      if(pkg.name && pkg.version)return {directory,pkg};
    } catch(error) {if(error.code!=='ENOENT')throw error;}
    directory=path.dirname(directory);
  }
  throw new Error('No package descriptor for emitted dependency: '+input);
}

/** Package metadata is selected by contributed output bytes, never parsed-only
 * metafile inputs or the declared dependency graph. Legal files stay verbatim. */
export async function writeEmittedNotices(metafile,{workingDirectory,outputDirectory}) {
  const inputs=new Map();
  for(const output of Object.values(metafile.outputs))for(const [input,{bytesInOutput}] of Object.entries(output.inputs)) {
    if(bytesInOutput>0 && /(?:^|\/)node_modules\//.test(input))inputs.set(input,(inputs.get(input)??0)+bytesInOutput);
  }
  const packages=new Map();
  for(const [input,bytes] of [...inputs].sort(([a],[b])=>a.localeCompare(b))) {
    const {directory,pkg}=await packageFor(input,workingDirectory);
    if(!packages.has(directory))packages.set(directory,{directory,name:pkg.name,version:pkg.version,license:pkg.license,bytesInOutput:0,inputs:[],legalFiles:[]});
    const record=packages.get(directory);record.bytesInOutput+=bytes;record.inputs.push(input);
  }
  const licenses=path.join(outputDirectory,'licenses');await mkdir(licenses,{recursive:true});
  const inventory=[];
  for(const {directory,...record} of [...packages.values()].sort((a,b)=>a.name.localeCompare(b.name)||a.directory.localeCompare(b.directory))) {
    const files=(await readdir(directory,{withFileTypes:true})).filter(entry=>entry.isFile()&&legalName.test(entry.name)).map(entry=>({source:entry.name,absolute:path.join(directory,entry.name)}));
    // Explicit, version-bound retained originals only; never infer legal text
    // from an SPDX string or silently accept a newly missing package notice.
    if(!files.length) {
      const retained=JSON.parse(await readFile(path.join(workingDirectory,'src/ui/RETAINED_LICENSES.json'),'utf8'))[record.name+'@'+record.version];
      if(retained)files.push({source:'retained-upstream',absolute:path.join(workingDirectory,'src/ui',retained.file),retained});
    }
    if(!files.length)throw new Error('Missing original legal files for emitted '+record.name+'@'+record.version);
    for(const file of files.sort((a,b)=>a.source.localeCompare(b.source))) {
      const bytes=await readFile(file.absolute);
      const sha256=createHash('sha256').update(bytes).digest('hex');
      if(file.retained && file.retained.sha256!==sha256)throw new Error('Retained legal file hash mismatch: '+record.name);
      const output=path.posix.join('packages',record.name,record.version,path.basename(file.absolute));
      await mkdir(path.dirname(path.join(licenses,output)),{recursive:true});await writeFile(path.join(licenses,output),bytes);
      record.legalFiles.push({source:file.source,output,bytes:bytes.length,sha256,...(file.retained?{provenance:file.retained}:{})});
    }
    inventory.push(record);
  }
  await writeFile(path.join(licenses,'emitted-packages.json'),JSON.stringify({version:1,selection:'outputs[*].inputs[*].bytesInOutput > 0',packages:inventory},null,2)+'\n');
}
