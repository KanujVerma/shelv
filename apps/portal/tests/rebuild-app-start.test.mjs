import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';

const bundle=await build({
  absWorkingDir:new URL('../',import.meta.url).pathname,
  tsconfig:'tsconfig.frontend.json',
  stdin:{contents:"export {startPortalApplication} from './src/app/start.tsx'; export {renderToStaticMarkup} from 'react-dom/server';",resolveDir:new URL('../',import.meta.url).pathname,loader:'tsx'},
  platform:'node',format:'cjs',bundle:true,write:false,loader:{'.css':'empty'},
});
const keys=['token_hash','type','error','error_code','error_description','code','access_token','refresh_token','expires_at','expires_in','token_type','provider_token','provider_refresh_token'];
test('actual startup scrubs invalid callbacks before mount with no auth coordination, fetch or unhandled rejection',async()=>{
  const unhandled=[]; const listener=e=>unhandled.push(e);
  process.on('unhandledRejection',listener);
  try {
    for(const path of ['/plan','/advisor/clients','/maya','/unknown']) for(const key of keys) for(const value of ['','SYNTHETIC-private']) {
      let requests=0,coordinates=0,mounted=false;
      const module={exports:{}};
      runInNewContext(bundle.outputFiles[0].text,{
        module,exports:module.exports,require:createRequire(import.meta.url),
        URL,URLSearchParams,AbortController,crypto,Response,FormData,Blob,
        setTimeout,clearTimeout,queueMicrotask,process,TextEncoder,TextDecoder,ReadableStream,MessageChannel,
        navigator:{locks:{request:async(_,o,run)=>{coordinates++;return run(o.signal);}}},
        fetch:async()=>{requests++;throw Error('unexpected auth');},
      });
      const location={href:'https://portal.invalid'+path+'#'+key+'='+value};
      let content;
      const win={location,history:{replaceState(_,__,next){assert.equal(mounted,false);location.href='https://portal.invalid'+next;}},
        document:{visibilityState:'visible',addEventListener(){},removeEventListener(){}},addEventListener(){},removeEventListener(){}};
      const stop=module.exports.startPortalApplication({},win,(_,node)=>{
        mounted=true;content=node;
        assert.equal(location.href,'https://portal.invalid'+path);
        const html=module.exports.renderToStaticMarkup(node);
        assert.equal(html.includes('SYNTHETIC-private'),false);
        return ()=>{};
      });
      try {
        if(content.props.startup) await assert.rejects(content.props.startup,e=>e.status===401);
        await new Promise(resolve=>setImmediate(resolve));
        assert.equal(requests,0,path+' '+key);assert.equal(coordinates,0);
      } finally {stop();}
    }
    assert.deepEqual(unhandled,[]);
  } finally {process.off('unhandledRejection',listener);}
});
