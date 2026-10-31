// Read-only transpilation of actual retained gateway source for this bounded error test.
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const parent='/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030';
const require=createRequire(parent+'/package.json'),ts=require(parent+'/node_modules/typescript/lib/typescript.js');
export async function resolve(specifier,context,next){
 if(specifier==='@supabase/auth-js')return {url:new URL('file://'+require.resolve(specifier)).href,shortCircuit:true};
 if(specifier.startsWith('.')&&context.parentURL?.startsWith('file:')){const url=new URL(specifier,context.parentURL);if(!existsSync(fileURLToPath(url))&&existsSync(fileURLToPath(url)+'.ts'))return {url:url.href+'.ts',shortCircuit:true};}
 return next(specifier,context);
}
export async function load(url,context,next){
 if(url.startsWith('file:')&&url.endsWith('.ts'))return {format:'module',source:ts.transpileModule(readFileSync(fileURLToPath(url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText,shortCircuit:true};
 return next(url,context);
}
