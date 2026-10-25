#!/usr/bin/env node
import { build } from 'esbuild';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i+=2){if(!['--store','--input'].includes(args[i])||!args[i+1]||Object.hasOwn(options,args[i]))throw new Error('Use --store <private directory> --input <file or ->');options[args[i]]=args[i+1];}
if(!options['--store']||!options['--input'])throw new Error('Use --store <private directory> --input <file or ->');
const store=resolve(options['--store']),within=relative(root,store);
if(!within.startsWith('..')&&!isAbsolute(within)){
    const ignored=spawnSync('git',['check-ignore','--quiet','--no-index',store],{cwd:root});
    if(ignored.status!==0||!within.startsWith('.local-artifacts/'))throw new Error('A repository store must be inside ignored .local-artifacts.');
}
let bytes=0,raw='';
if(options['--input']==='-')for await(const chunk of process.stdin){bytes+=chunk.byteLength;if(bytes>8_000_000)throw new Error('Private import exceeds limit');raw+=chunk.toString('utf8');}
else{const buffer=await readFile(resolve(options['--input']));if(buffer.byteLength>8_000_000)throw new Error('Private import exceeds limit');raw=buffer.toString('utf8');}
const temp=resolve(root,'.local-artifacts/walkthroughs/import-runtime');await mkdir(temp,{recursive:true,mode:0o700});
const runtime=resolve(temp,`import-${randomUUID()}.mjs`);
try{
    await build({entryPoints:[resolve(root,'apps/portal/backend/walkthroughs/local-store.ts')],outfile:runtime,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
    const {LocalWalkthroughStore}=await import(pathToFileURL(runtime).href),database=new LocalWalkthroughStore(store),value=JSON.parse(raw),inputs=Array.isArray(value)?value:[value];
    if(inputs.length<1||inputs.length>100)throw new Error('Expected one to one hundred private inputs');
    const results=[];for(const input of inputs)results.push(await database.import(input));
    // Output opaque identifiers and counts only. Never echo source content, titles or provenance.
    process.stdout.write(JSON.stringify({schemaVersion:1,imported:results.length,results})+'\n');
}catch(error){process.stderr.write(`Private walkthrough import failed: ${['invalid_request','payload_too_large','immutable_version'].includes(error?.code)?error.code:'validation_or_store_error'}\n`);process.exitCode=1;}
finally{await rm(runtime,{force:true});}
