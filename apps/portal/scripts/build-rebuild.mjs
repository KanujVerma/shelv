import {build} from 'esbuild';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkStyles} from './check-ui-system.mjs';
import {createServer} from 'node:http';
import {parseRoute} from '../src/navigation/routes.ts';

const portal=fileURLToPath(new URL('../',import.meta.url));
const output=path.resolve(portal,'../../.local-artifacts/portal-rebuild/foundation');
const [major,minor]=process.versions.node.split('.').map(Number);
if(major<22 || major===22&&minor<23) throw new Error('Portal builds require Node.js 22.23.0 or newer.');
async function styles(dir,prefix='') {
  const files={};
  for(const entry of await readdir(dir,{withFileTypes:true})) {
    const relative=path.posix.join(prefix,entry.name),absolute=path.join(dir,entry.name);
    if(entry.isDirectory()) Object.assign(files,await styles(absolute,relative));
    else if(entry.name.endsWith('.css')) files[relative]=await readFile(absolute,'utf8');
  }
  return files;
}
const css=await styles(path.join(portal,'src'));
// Reuse the existing guard, allowing literals only in the reviewed semantic root.
css['ui/system.css']=css['ui/tokens.css'];delete css['ui/tokens.css'];
const findings=checkStyles(css);
if(findings.length) throw new Error('Rebuild colors must use semantic tokens: '+JSON.stringify(findings));
await mkdir(output,{recursive:true});
await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',entryPoints:['src/main.tsx'],outdir:output,bundle:true,format:'esm',splitting:true,target:['es2022'],minify:false,metafile:true,entryNames:'foundation',chunkNames:'chunks/[name]',assetNames:'assets/[name]-[hash]',loader:{'.woff2':'file','.woff':'file'},legalComments:'linked'}).then(async result=>{
  await writeFile(path.join(output,'build-metadata.json'),JSON.stringify(result.metafile,null,2)+'\n');
});
await writeFile(path.join(output,'index.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; connect-src \'none\'; img-src \'self\' data:; style-src \'self\' \'unsafe-inline\'; font-src \'self\'; script-src \'self\'; base-uri \'none\'; form-action \'none\'"><title>shelv · internal foundation preview</title><link rel="stylesheet" href="/foundation.css"></head><body><div data-foundation-preview></div><script type="module" src="/foundation.js"></script></body></html>');
await mkdir(path.join(output,'licenses'),{recursive:true});
for(const filename of ['THIRD_PARTY_NOTICES.md','clsx.LICENSE']) await writeFile(path.join(output,'licenses',filename),await readFile(path.join(portal,'src/ui',filename)));
console.log('Isolated foundation preview built at '+output+'; retained release build/gateway unchanged.');
if(process.argv.includes('--serve')) {
  const port=Number(process.argv.find(arg=>arg.startsWith('--port='))?.slice(7)??4178);
  if(!Number.isInteger(port)||port<1024||port>65535) throw new Error('invalid preview port');
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff','.json':'application/json'};
  createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    try {
      const url=new URL(req.url,'http://localhost');
      if(!['GET','HEAD'].includes(req.method)||url.pathname.startsWith('/api/')) {res.writeHead(405);res.end();return;}
      const relative=url.pathname==='/'||url.pathname==='/__foundation'||parseRoute(url.pathname+url.search)?'index.html':decodeURIComponent(url.pathname.slice(1));
      const target=path.resolve(output,relative);
      if(!target.startsWith(output+path.sep)) {res.writeHead(404);res.end();return;}
      const bytes=await readFile(target);res.setHeader('Content-Type',types[path.extname(target)]??'application/octet-stream');res.writeHead(200);res.end(req.method==='HEAD'?undefined:bytes);
    } catch {res.writeHead(404);res.end();}
  }).listen(port,'127.0.0.1',()=>console.log(`Synthetic foundation preview: http://127.0.0.1:${port}/__foundation`));
}
