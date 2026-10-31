// Source-only compilation/execution of the unchanged fixed RPC control.
// The retained loader uses a foreign checkout; this uses only own locked deps.
import {build} from 'esbuild';import {createRequire} from 'node:module';
const result=await build({absWorkingDir:new URL('../',import.meta.url).pathname,entryPoints:['tests/rebuild-review-guidance-request-rpc.test.mjs'],platform:'node',bundle:true,format:'cjs',write:false});
const m={exports:{}};new Function('module','exports','require',result.outputFiles[0].text)(m,m.exports,createRequire(import.meta.url));
