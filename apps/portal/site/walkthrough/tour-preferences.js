const seenKey='shelv-service-tour-seen',activeKey='shelv-service-tour-active',historyKey='shelvServiceTourActive';
const record=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
/** Only generic display preferences are stored. Access fragments and portal state stay opaque. */
export function createMayaTourPreferences({window:surface=globalThis.window}={}){
 let seen=null,active=false;
 const read=(kind,key)=>{try{return surface[kind].getItem(key);}catch{return undefined;}};
 const write=(kind,key,value)=>{try{if(value===null)surface[kind].removeItem(key);else surface[kind].setItem(key,value);}catch{/* Storage may be disabled without affecting the sample. */}};
 function historyMarker(value){try{const state={...record(surface.history.state)};if(value)state[historyKey]=true;else delete state[historyKey];surface.history.replaceState(state,'',surface.location.pathname+surface.location.search+surface.location.hash);}catch{/* History may be unavailable in an embedded preview. */}}
 return {
  initialMode(){const storedSeen=read('localStorage',seenKey),storedActive=read('sessionStorage',activeKey);if((active||storedActive==='1')&&record(surface.history.state)[historyKey]===true)return 'resume';if(seen===true||storedSeen==='1')return 'closed';return 'welcome';},
  markSeen(){seen=true;write('localStorage',seenKey,'1');},
  begin(){active=true;seen=true;write('localStorage',seenKey,'1');write('sessionStorage',activeKey,'1');historyMarker(true);},
  end(){active=false;write('sessionStorage',activeKey,null);historyMarker(false);try{const params=new URLSearchParams(surface.location.hash.replace(/^#/,''));for(const key of ['step','explore','tour'])params.delete(key);const hash=params.toString();surface.history.replaceState(surface.history.state,'',surface.location.pathname+surface.location.search+(hash?'#'+hash:''));}catch{/* Closing must still work when the URL cannot be replaced. */}}
 };
}
