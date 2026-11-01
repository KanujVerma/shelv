// Test compiler only. The production source stays byte-exact on disk.
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import ts from 'typescript';
const portal=fileURLToPath(new URL('../',import.meta.url));
export const guidanceSourcePath='apps/portal/src/features/plan/Guidance.tsx';
export const guidanceSourceHash='578b7d98484635f48d3da0a3e211a54f408b23ba7f3cef73d47269147c66dd99';
const hash=value=>createHash('sha256').update(value).digest('hex');
const addedImport="import {ManifestObservationDescendant} from '../../../tests/rebuild-plan-guidance-manifest-observer.tsx';\n",descendant='<ManifestObservationDescendant/>';
export function transformGuidance(source){
 if(hash(source)!==guidanceSourceHash)throw Error('observer Guidance source hash mismatch');
 const ast=ts.createSourceFile('Guidance.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),anchors=[];
 function visit(node){if(ts.isJsxOpeningElement(node)&&node.tagName.getText(ast)==='Context.Provider'){
  let owner=node.parent;while(owner&&!ts.isFunctionDeclaration(owner))owner=owner.parent;
  if(owner?.name?.text==='GuidanceState')anchors.push(node);
 }ts.forEachChild(node,visit);}visit(ast);
 if(anchors.length!==1)throw Error('observer requires one actual GuidanceState Context.Provider anchor');
 const anchor=anchors[0],anchorText=anchor.getText(ast),contents=addedImport+source.slice(0,anchor.end)+descendant+source.slice(anchor.end);
 const transform={path:guidanceSourcePath,beforeSha256:hash(source),beforeBytes:Buffer.byteLength(source),afterSha256:hash(contents),afterBytes:Buffer.byteLength(contents),anchor:{kind:'GuidanceState/Context.Provider',start:anchor.getStart(ast),end:anchor.end,sha256:hash(anchorText)},diff:[{offset:0,addition:addedImport},{offset:anchor.end,addition:descendant}]};
 return{contents,transform};
}
export function manifestObserverBuild(){
 const instrumentation={enabled:true,kind:'same-active-provider-descendant-v1',transforms:[],addedModules:[]};
 const plugin={name:'audited-guidance-manifest-observer',setup(build){
  build.onLoad({filter:/features\/plan\/Guidance\.tsx$/},async args=>{
   if(args.path!==path.join(portal,'src/features/plan/Guidance.tsx'))throw Error('observer source path mismatch');
   const source=await fs.readFile(args.path,'utf8'),result=transformGuidance(source);instrumentation.transforms.push(result.transform);
   for(const name of ['rebuild-plan-guidance-manifest-observation.ts','rebuild-plan-guidance-manifest-observer.tsx']){const bytes=await fs.readFile(path.join(portal,'tests',name));instrumentation.addedModules.push({path:'apps/portal/tests/'+name,bytes:bytes.length,sha256:hash(bytes)});}
   return{contents:result.contents,loader:'tsx'};
  });
 }};
 return{plugin,instrumentation};
}
export const originalBudgetHash='50cac04422659e15bab2fd0820a7e8d072a0fd73cf65d9d850f8e566c4e11490';
/** Reverses only the three authorized precondition edits, then validates the full CI file. */
export function recoverOriginalBudget(source){
 const replacements=[['restore,applyView,waitForAcceptedManifest}','restore,applyView}'],['setupBrowser(t,server,{observeManifest:true})','setupBrowser(t,server)'],['await waitForAcceptedManifest(f);','']];
 let original=source;for(const [from,to] of replacements){if(original.split(from).length!==2)throw Error('budget precondition delta is not unique');original=original.replace(from,to);}
 if(hash(original)!==originalBudgetHash)throw Error('original budget assertions/body changed');return original;
}
/** Prepare only; never imports or executes the original browser test. */
export async function prepareOriginalBudgetCase(){
 const directory=path.join(portal,'../../.local-artifacts/portal-rebuild/w3-v3-manifest-observer-source/original');await fs.mkdir(directory,{recursive:true});
 const source=recoverOriginalBudget(await fs.readFile(path.join(portal,'tests/rebuild-plan-guidance-budget-browser.test.mjs'),'utf8')),filename=path.join(directory,'original-budget.test.mjs');await fs.writeFile(filename,source);
 const {pathToFileURL}=await import('node:url'),testURL=pathToFileURL(filename).href,base=pathToFileURL(path.join(portal,'tests/')).href;
 const loader="import {registerHooks} from 'node:module';\nconst target="+JSON.stringify(testURL)+",base="+JSON.stringify(base)+",allowed=new Set(['./rebuild-plan-guidance-browser.mjs','./rebuild-plan-guidance-browser-tools.mjs','./rebuild-plan-guidance-browser-fixture.mjs']);\nregisterHooks({resolve(specifier,context,nextResolve){if(context.parentURL===target&&allowed.has(specifier))return nextResolve(new URL(specifier,base).href,context);return nextResolve(specifier,context);}});\n";
 const preload=path.join(directory,'original-loader.mjs');await fs.writeFile(preload,loader);return{filename,preload,sha256:hash(source),loaderSha256:hash(loader),resolutionOnly:[...['rebuild-plan-guidance-browser.mjs','rebuild-plan-guidance-browser-tools.mjs','rebuild-plan-guidance-browser-fixture.mjs']]};
}
