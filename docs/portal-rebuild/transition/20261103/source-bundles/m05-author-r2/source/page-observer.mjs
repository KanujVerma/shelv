// This exact callback is used by page.evaluate. Never replace an actual Response
// or native result. Tests extract it with a fetch implementation that always fails.
export async function pageObserver(arg){
  const win=window;
  if(arg.op!=='install'){
    const state=Object.getOwnPropertyDescriptor(win,arg.key)?.value;
    if(!state||state.nonce!==arg.nonce)throw new Error('owned page observer unavailable');
    return state.control(arg);
  }
  if(Object.getOwnPropertyDescriptor(win,arg.key))throw new Error('page observer key occupied');
  const originalDescriptor=Object.getOwnPropertyDescriptor(win,'fetch'),nativeFetch=win.fetch;
  if(typeof nativeFetch!=='function')throw new Error('native fetch unavailable');
  const records=[],errors=[],responses=[],active=new Set();let retired=false,hold=false,gateResolve;
  const gate=new Promise(resolve=>{gateResolve=resolve;});
  const issuedReads=[];let flightOrdinal=0;
  const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,'0')).join('');
  const report=event=>{records.push(event);};
  const track=promise=>{active.add(promise);promise.then(()=>active.delete(promise),()=>active.delete(promise));return promise;};
  const requestInfo=args=>{
    const [url,init]=args;if(typeof url!=='string'||!init||typeof init.body!=='string')return null;
    if(new URL(url,win.location.href).href!==arg.origin+'/api/client/reviews'||init.method!=='POST')return null;
    let command;try{command=JSON.parse(init.body);}catch{return null;}
    if(command.schemaVersion!==1||!['read_client_plan_v3','read_care_history_v1'].includes(command.action))return null;
    const csrf=new Headers(init.headers).get('x-shelv-csrf');if(!csrf){errors.push({phase:'issued-read',message:'original issued CSRF missing'});return null;}
    const captured={body:init.body,csrf,command,method:init.method,path:'/api/client/reviews',localFlightLabel:arg.key+':flight:'+String(++flightOrdinal),nativePromise:null};
    issuedReads.push(captured);return captured;
  };
  function wrappedFetch(...args){
    let info=null;try{info=requestInfo(args);}catch(e){errors.push({phase:'request-observer',name:e.name,message:e.message});}
    let native;
    try{native=Reflect.apply(nativeFetch,this,args);if(info)info.nativePromise=native;}catch(error){report({type:'fetch-threw',localFlightLabel:info?.localFlightLabel??null,name:error.name});throw error;}
    if(!info)return native;
    return track(Promise.resolve(native).then(async response=>{
      // Own the actual raw Response before any observation callback can fail.
      const owned={response,info,descriptor:null,wrappedJson:null,jsonCalls:[]};responses.push(owned);
      let requestSha256;try{requestSha256=await hash(info.body);}catch(e){errors.push({phase:'request-hash',name:e.name,message:e.message});return response;}
      const localFlightLabel=info.localFlightLabel;report({type:'fetch-return',localFlightLabel,requestSha256,status:response.status});
      if(retired)return response;
      let descriptor,originalJson;
      try{descriptor=Object.getOwnPropertyDescriptor(response,'json');if(descriptor){errors.push({phase:'json-install',message:'foreign own json descriptor retained'});return response;}originalJson=response.json;if(typeof originalJson!=='function')throw new Error('native json method unavailable');}
      catch(e){errors.push({phase:'json-observe',name:e.name,message:e.message});return response;}
      const target=info.command.action==='read_client_plan_v3'&&info.command.version===arg.version;
      function wrappedJson(...jsonArgs){
        const localJsonLabel=localFlightLabel+':json:'+String(owned.jsonCalls.length+1),ownReceiver=this===response;
        if(!ownReceiver)errors.push({phase:'json-receiver',message:'foreign native Response receiver; no outcome attribution'});
        report({type:'native-json-call',localFlightLabel,localJsonLabel,requestSha256});
        let read;try{read=Reflect.apply(originalJson,this,jsonArgs);owned.jsonCalls.push({localJsonLabel,receiver:this,nativePromise:read});}catch(error){report({type:'json-threw',localFlightLabel,localJsonLabel,requestSha256,name:error.name});throw error;}
        return track(Promise.resolve(read).then(async value=>{
          report({type:'native-json-fulfilled',localFlightLabel,localJsonLabel,requestSha256,status:response.status});
          if(target&&ownReceiver&&arg.mode==='consumer'&&!retired){hold=true;report({type:'consumer-held',localFlightLabel,localJsonLabel,requestSha256,status:response.status});await gate;}
          report({type:ownReceiver?'json-value-returned':'foreign-json-value-returned',localFlightLabel,localJsonLabel,requestSha256,status:response.status});return value;
        },error=>{report({type:'native-json-rejected',localFlightLabel,localJsonLabel,requestSha256,name:error.name});throw error;}));
      }
      try{Object.defineProperty(response,'json',{configurable:true,writable:true,enumerable:descriptor?.enumerable??false,value:wrappedJson});owned.descriptor=descriptor;owned.wrappedJson=wrappedJson;}
      catch(e){errors.push({phase:'json-install',name:e.name,message:e.message});}
      return response;
    },async error=>{let requestSha256=null;try{requestSha256=await hash(info.body);}catch(e){errors.push({phase:'failed-request-hash',name:e.name,message:e.message});}report({type:'native-fetch-rejected',localFlightLabel:info.localFlightLabel,requestSha256,name:error.name});throw error;}));
  }
  const original=()=>{
    const selected=issuedReads.filter(r=>r.command.action==='read_client_plan_v3'&&r.command.version===arg.version);
    if(selected.length!==1){if(selected.length>1)errors.push({phase:'issued-read',message:'ambiguous identical or repeated selected native fetch occurrences'});return null;}return selected[0];
  };
  const control=async command=>{
    if(command.op==='snapshot'){const r=original();return {records:[...records],errors:[...errors],holding:hold,pendingNative:active.size,original:r?{localFlightLabel:r.localFlightLabel,method:r.method,path:r.path,body:r.body,bodySha256:await hash(r.body),csrfSha256:await hash(r.csrf)}:null};}
    if(command.op==='release'){retired=true;gateResolve();return {records:[...records],errors:[...errors]};}
    if(command.op==='probe'){
      const originalRead=original();
      if(retired||!originalRead)throw new Error('original issued read unavailable');
      const csrf=originalRead.csrf,body=command.body??originalRead.body;
      // CSRF remains here, never an evaluate argument or returned field. Cookies
      // are the browser's CURRENT natural cookies; no Cookie header is supplied.
      return track((async()=>{const response=await Reflect.apply(nativeFetch,win,[arg.origin+'/api/client/reviews',{method:'POST',headers:{'Content-Type':'application/json','X-Shelv-CSRF':csrf},body,credentials:'same-origin',cache:'no-store',redirect:'error'}]);
      const bytes=await response.arrayBuffer();return {status:response.status,bodySha256:await hash(body),csrfSha256:await hash(csrf),responseSha256:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join(''),byteLength:bytes.byteLength};})());
    }
    if(command.op==='restore'){
      retired=true;gateResolve();await Promise.allSettled([...active]);
      for(const x of responses){if(!x.wrappedJson)continue;try{const now=Object.getOwnPropertyDescriptor(x.response,'json');if(now?.value===x.wrappedJson){if(x.descriptor)Object.defineProperty(x.response,'json',x.descriptor);else delete x.response.json;}else errors.push({phase:'json-restore',message:'foreign json replacement retained'});}catch(e){errors.push({phase:'json-restore',name:e.name,message:e.message});}}
      try{if(Object.getOwnPropertyDescriptor(win,'fetch')?.value===wrappedFetch){if(originalDescriptor)Object.defineProperty(win,'fetch',originalDescriptor);else delete win.fetch;}else errors.push({phase:'fetch-restore',message:'foreign fetch replacement retained'});}catch(e){errors.push({phase:'fetch-restore',name:e.name,message:e.message});}
      if(Object.getOwnPropertyDescriptor(win,arg.key)?.value===state)delete win[arg.key];else errors.push({phase:'observer-restore',message:'foreign observer replacement retained'});
      return {records:[...records],errors:[...errors]};
    }
    throw new Error('unknown observer operation');
  };
  const state={nonce:arg.nonce,control};
  Object.defineProperty(win,arg.key,{configurable:true,writable:false,enumerable:false,value:state});
  try{Object.defineProperty(win,'fetch',{configurable:true,writable:true,enumerable:originalDescriptor?.enumerable??true,value:wrappedFetch});}
  catch(error){delete win[arg.key];throw error;}
  return {records:[],errors:[]};
}
