import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {writeEmittedNotices} from '../scripts/emitted-notices.mjs';

const portal=fileURLToPath(new URL('../',import.meta.url));
const output=path.resolve(portal,'../../.local-artifacts/portal-rebuild/foundation');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('built notices retain original legal files for every actually emitted package, including fonts',async()=>{
  execFileSync(process.execPath,['scripts/build-rebuild.mjs'],{cwd:portal});
  const meta=JSON.parse(await readFile(path.join(output,'build-metadata.json'),'utf8'));
  const emitted=new Set();
  for(const out of Object.values(meta.outputs))for(const [input,contribution] of Object.entries(out.inputs)) {
    if(contribution.bytesInOutput<=0)continue;
    const match=input.match(/(?:^|\/)node_modules\/((?:@[^/]+\/)?[^/]+)/);
    if(match)emitted.add(match[1]);
  }
  assert.ok(emitted.has('@floating-ui/core'));assert.ok(emitted.has('react-remove-scroll'));
  assert.ok(emitted.has('@fontsource/inter'));assert.ok(emitted.has('@fontsource/instrument-serif'));
  const inventory=JSON.parse(await readFile(path.join(output,'licenses/emitted-packages.json'),'utf8'));
  assert.deepEqual(inventory.packages.map(p=>p.name).sort(),[...emitted].sort());
  for(const pkg of inventory.packages) {
    const installed=path.join(portal,'node_modules',pkg.name),descriptor=JSON.parse(await readFile(path.join(installed,'package.json'),'utf8'));
    assert.equal(pkg.version,descriptor.version);assert.ok(pkg.bytesInOutput>0);
    const originals=(await readdir(installed)).filter(name=>/^(licen[cs]e|notice|copying|copyright)([.-]|$)/i.test(name));
    assert.deepEqual(pkg.legalFiles.filter(f=>f.source!=='retained-upstream').map(f=>f.source).sort(),originals.sort(),pkg.name);
    assert.ok(pkg.legalFiles.length>0,pkg.name);
    for(const file of pkg.legalFiles) {
      if(file.source==='retained-upstream')assert.equal(pkg.name+'@'+pkg.version,'react-remove-scroll-bar@2.3.8');
      const source=file.source==='retained-upstream'?path.join(portal,'src/ui/react-remove-scroll-bar.LICENSE'):path.join(installed,file.source);
      const original=await readFile(source),distributed=await readFile(path.join(output,'licenses',file.output));
      assert.deepEqual(distributed,original,pkg.name);assert.equal(file.sha256,hash(original));assert.equal(file.bytes,original.length);
    }
  }
  for(const filename of ['THIRD_PARTY_NOTICES.md','clsx.LICENSE'])assert.deepEqual(await readFile(path.join(output,'licenses',filename)),await readFile(path.join(portal,'src/ui',filename)));
  const fontInputs=Object.keys(meta.inputs).filter(p=>/\.(woff2?|ttf)$/.test(p));assert.ok(fontInputs.length>0);
  for(const input of fontInputs) {
    const bundled=Object.keys(meta.outputs).find(p=>/\.woff2?$/.test(p)&&Object.hasOwn(meta.outputs[p].inputs,input));
    assert.ok(bundled,input);assert.deepEqual(await readFile(path.resolve(portal,bundled)),await readFile(path.resolve(portal,input)));
  }
  for(const [filename,out] of Object.entries(meta.outputs))if(filename.endsWith('.js')) {
    const js=await readFile(path.resolve(portal,filename),'utf8');
    for(const match of js.matchAll(/\/\*! For license information please see (.*?) \*\//g))assert.ok((await readFile(path.resolve(portal,path.dirname(filename),match[1]))).length>0);
  }
});

test('notice closure excludes parsed/tree-shaken inputs and refuses newly missing original notices',async()=>{
  const artifacts=path.resolve(portal,'../../.local-artifacts/portal-rebuild/w0-fixes');await mkdir(artifacts,{recursive:true});
  const workingDirectory=await mkdtemp(path.join(artifacts,'notice-fixture-')),outputDirectory=path.join(workingDirectory,'output');
  await mkdir(path.join(workingDirectory,'src/ui'),{recursive:true});await writeFile(path.join(workingDirectory,'src/ui/RETAINED_LICENSES.json'),'{}');
  for(const name of ['emitted','tree-shaken','parsed-only','missing']) {
    const dir=path.join(workingDirectory,'node_modules',name);await mkdir(dir,{recursive:true});
    await writeFile(path.join(dir,'package.json'),JSON.stringify({name,version:'1.0.0',license:'MIT'}));
    if(name==='emitted')await writeFile(path.join(dir,'LICENSE'),'original synthetic copyright and permission');
  }
  const metafile={inputs:{'node_modules/parsed-only/index.js':{}},outputs:{'out.js':{inputs:{'node_modules/emitted/index.js':{bytesInOutput:10},'node_modules/tree-shaken/index.js':{bytesInOutput:0}}}}};
  await writeEmittedNotices(metafile,{workingDirectory,outputDirectory});
  const inventory=JSON.parse(await readFile(path.join(outputDirectory,'licenses/emitted-packages.json'),'utf8'));
  assert.deepEqual(inventory.packages.map(p=>p.name),['emitted']);
  assert.equal(await readFile(path.join(outputDirectory,'licenses/packages/emitted/1.0.0/LICENSE'),'utf8'),'original synthetic copyright and permission');
  metafile.outputs['out.js'].inputs['node_modules/missing/index.js']={bytesInOutput:1};
  await assert.rejects(writeEmittedNotices(metafile,{workingDirectory,outputDirectory}),/Missing original legal files for emitted missing@1.0.0/);
});
