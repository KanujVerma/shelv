export interface InternalReplayInput {
 developmentRuntime:boolean; buildFlavor:string; remoteEnabled:boolean; platform:string;
 enabled?:string;host?:string;projectToken?:string;
}
export function resolveInternalReplayConfig(input:InternalReplayInput){
 const available=input.developmentRuntime&&input.buildFlavor==='development'&&!input.remoteEnabled
  &&input.platform==='ios'&&input.enabled==='true';
 const host=input.host,projectToken=input.projectToken;
 const live=available&&(host==='https://us.i.posthog.com'||host==='https://eu.i.posthog.com')
  &&typeof projectToken==='string'&&/^phc_[A-Za-z0-9_-]+$/.test(projectToken)?{host,projectToken}:null;
 return {available,live};
}
