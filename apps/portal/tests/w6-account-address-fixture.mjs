// SOURCE/finite HTTP/SSR only. All authorization/session/controller behavior is
// actual code; HTTP replies remain explicit synthetic fixture data.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const portal=fileURLToPath(new URL('..',import.meta.url));
const hash=value=>createHash('sha256').update(value).digest('hex');
let built;
export function accountAddressSourceApi() {
  if(built)return built;
  globalThis.fetch=async()=>{throw Error('unexpected global network');};
  built=build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',stdin:{
    contents:"export{createApplicationSession}from'./src/app/session.ts';export{createAccountAddressController}from'./src/features/account/core/controller.ts';export{AccountAddress}from'./src/features/account/core/AccountAddress.tsx';export{OverlayProvider}from'./src/ui/index.ts';export{createElement}from'react';export{renderToStaticMarkup}from'react-dom/server';",loader:'tsx',resolveDir:portal},
    bundle:true,write:false,metafile:true,platform:'node',format:'cjs',loader:{'.css':'empty'},plugins:[{name:'pending-w0-address-source',setup(b){
      b.onResolve({filter:/account-address-request\.ts$/},args=>{
        const path=resolve(args.resolveDir,args.path);return existsSync(path)?undefined:{path,namespace:'pending-address'};
      });
      b.onResolve({filter:/^\./,namespace:'pending-address'},args=>({path:resolve(args.resolveDir,args.path),namespace:'file'}));
      b.onLoad({filter:/.*/,namespace:'pending-address'},args=>{
        const bytes=readFileSync(resolve(portal,'tests/w6-account-address-inputs/account-address-request.c06.ts.txt'));
        assert.equal(hash(bytes),'0a718365fd86adb37501c940011474e3b979b9ff405d1c498f9a95cd1e5ef7d6','exact c06 W0 request input');
        return{contents:bytes.toString(),loader:'ts',resolveDir:dirname(args.path)};
      });
    }}]}).then(output=>{
      const home=fileURLToPath(new URL('../../../.local-artifacts/w6-account-address/',import.meta.url));mkdirSync(home,{recursive:true});
      const inputs=Object.keys(output.metafile.inputs).filter(path=>path!=='<stdin>').map(path=>path.startsWith('pending-address:')?{path,selected:'EXACT c06 missing W0 request; not canonical admission',sha256:'0a718365fd86adb37501c940011474e3b979b9ff405d1c498f9a95cd1e5ef7d6'}:{path,sha256:hash(readFileSync(resolve(portal,path)))});
      writeFileSync(resolve(home,'SOURCE.json'),JSON.stringify({scope:'SOURCE ONLY: current actual SDK/controller with one pinned pending request; no authority/currentness substitution or real Auth/SQL',inputs,outputSha256:hash(output.outputFiles[0].contents)},null,2)+'\n');
      const module={exports:{}};new Function('module','exports','require',output.outputFiles[0].text)(module,module.exports,createRequire(import.meta.url));return module.exports;
    });
  return built;
}
