import {validatedReturnPath} from './navigation-return';
import {SupabaseProvider, claims, hasCredentials} from './upstream';
import {demand, SessionError, type Credentials, type AdvisorContext, type Capabilities} from './types';
import {PORTAL_ORIGIN, SUPABASE_ORIGIN, object, uuid, safeCodes, type Operation} from './policy';
import {parseClientCommand, validateClientUpload, mapClientPhotoHeadResponse, mapClientPhotoInventoryResponse} from './client-policy';
import {mapPlanResponse} from './plan-policy';
import {mapCareResponse} from './care-policy';
import {mapReviewResponse,reviewTransportError} from './review-policy';
import type {WireResponse} from './protocol';
function privateFields(value: unknown): boolean {
    return !!value && typeof value === 'object' && Object.entries(value).some(([k,v]) => /^(private_?notes?|meeting_?notes?|transcript|draft|intake|advisor_?notes?)$/i.test(k) || privateFields(v));
}
export class ClientProvider extends SupabaseProvider {
    private readonly inventoryFetcher:typeof fetch;
    private readonly inventoryTimeoutMs:number;
    constructor(publicKey:string,fetcher:typeof fetch=(input,init)=>globalThis.fetch(input,init),timeoutMs=12000,durableContext=false){
        super(publicKey,fetcher,timeoutMs,durableContext);this.inventoryFetcher=fetcher;this.inventoryTimeoutMs=timeoutMs;
    }
    private async photoInventory(credentials:Credentials,capabilities:Capabilities,input:unknown):Promise<WireResponse>{
        const operation=parseClientCommand('checkins',input);demand(operation.kind==='command');
        const command=operation.command;demand(command.action==='read_photo_inventory_v1'&&capabilities.view,403,'forbidden');
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),this.inventoryTimeoutMs);
        let status=503,body:unknown={code:'unavailable'};
        try{
            const response=await this.inventoryFetcher(`${SUPABASE_ORIGIN}/functions/v1/concierge-checkins`,{method:'POST',headers:this.headers(credentials.access_token),body:JSON.stringify(command),signal:controller.signal,redirect:'error',cache:'no-store'});
            const headersBeforeAbort=!controller.signal.aborted;
            if(response.status===401||response.status===403){
                if(headersBeforeAbort)status=response.status;
                try{void response.body?.cancel().catch(()=>{});}catch{}
            }else{
                const reader=response.body?.getReader(),chunks:Uint8Array[]=[];let length=0;
                const cancel=()=>{try{void reader?.cancel().catch(()=>{});}catch{}};
                controller.signal.addEventListener('abort',cancel,{once:true});
                try{
                    if(controller.signal.aborted){cancel();throw new SessionError(503,'unavailable');}
                    if(reader)for(;;){
                        const {done,value}=await reader.read();if(controller.signal.aborted)throw new SessionError(503,'unavailable');if(done)break;
                        length+=value.byteLength;if(length>8192){cancel();throw new SessionError(503,'unavailable');}chunks.push(value);
                    }
                }finally{controller.signal.removeEventListener('abort',cancel);reader?.releaseLock();}
                if(controller.signal.aborted)throw new SessionError(503,'unavailable');
                const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
                body=JSON.parse(new TextDecoder('utf-8',{fatal:true,ignoreBOM:false}).decode(bytes));
                if(!controller.signal.aborted)status=response.status;
            }
        }catch{/* A missing, oversized, malformed or cancelled page is unavailable. */}
        finally{clearTimeout(timer);}
        try{
            const current=await this.context(credentials);
            demand(current.ownerId===credentials.user.id&&current.providerSessionId===credentials.providerSessionId,401,'session_ended');
            demand(current.capabilities.view,403,'forbidden');
        }catch(error){
            if([401,403].includes((error as {status?:number})?.status??0))throw error;
            if(status!==401&&status!==403)throw new SessionError(503,'unavailable');
        }
        if(status!==200){
            const raw=body&&typeof body==='object'?body as {code?:unknown}:{};
            const code=status===401?'session_ended':status===403?'forbidden':typeof raw.code==='string'&&safeCodes.has(raw.code)?raw.code:'unavailable';
            throw new SessionError([400,401,403,404,409,413,415,429].includes(status)?status:503,code);
        }
        const value=mapClientPhotoInventoryResponse(body,command);demand(!hasCredentials(value,credentials),503,'unavailable');
        return {status:200,body:value};
    }
    async requestOtp(email: string, returnTo?:string) {
        const path=validatedReturnPath(returnTo,'client'); const {client, check, values} = this.sdk();
        const {error} = await client.signInWithOtp({email, options:{shouldCreateUser:false,emailRedirectTo:`${PORTAL_ORIGIN}${path}`}});
        check(error); return values();
    }
    async context(credentials: Credentials): Promise<AdvisorContext> {
        const jwt = claims(credentials.access_token);
        demand(jwt.sub === credentials.user.id && jwt.session_id === credentials.providerSessionId && typeof jwt.exp === 'number' && jwt.exp > Date.now()/1000, 401, 'session_ended');
        const context = object(await this.json(`${SUPABASE_ORIGIN}/rest/v1/rpc/concierge_client_session_context`, credentials.access_token, {}));
        demand(context.ownerId === credentials.user.id, 403, 'forbidden');
        const c = object(context.capabilities);
        demand(c.view === true && c.edit === false && c.publish === false && c.confirmPayments === false, 403, 'forbidden');
        demand(context.providerSessionId === credentials.providerSessionId && context.role === 'client',403,'forbidden');
        const deadline = context.sessionNotAfter === null ? null : typeof context.sessionNotAfter === 'string' ? Date.parse(context.sessionNotAfter) : NaN;
        demand(deadline === null || (Number.isFinite(deadline) && deadline > Date.now()),401,'session_ended');
        return {ownerId:credentials.user.id,providerSessionId:credentials.providerSessionId,sessionNotAfter:deadline,capabilities:{view:true,edit:false,publish:false,confirmPayments:false}};
    }
    private async media(credentials: Credentials, media: 'photo'|'evidence', id: string,v2=false): Promise<WireResponse> {
        const channel = media === 'photo' ? 'checkins' : 'payments';
        const descriptor = object(await this.edge(credentials,`concierge-${channel}`,media === 'photo' ? {action:'photo_view',photoId:uuid(id)} : {action:'evidence_url',evidenceId:uuid(id),...(v2?{schemaVersion:2}:{})}));
        demand((media === 'photo' ? descriptor.photoId : descriptor.evidenceId) === id, 503, 'unavailable');
        const lifetime = media === 'photo' ? descriptor.expiresIn : descriptor.expiresInSeconds;
        demand(typeof lifetime === 'number' && lifetime > 0 && lifetime <= 60 && typeof descriptor.signedUrl === 'string', 503, 'unavailable');
        const signed = new URL(descriptor.signedUrl);
        const bucket = media === 'photo' ? 'concierge-checkin-photos' : 'concierge-payment-evidence';
        demand(signed.origin === SUPABASE_ORIGIN && !signed.username && !signed.password && !signed.hash && signed.searchParams.size === 1 && signed.searchParams.getAll('token').length === 1 && !!signed.searchParams.get('token'), 503, 'unavailable');
        const prefix = `/storage/v1/object/sign/${bucket}/${credentials.user.id}/`;
        const rest = signed.pathname.startsWith(prefix) ? signed.pathname.slice(prefix.length) : '';
        const parts = rest.split('/');
        if (media === 'evidence') { demand(parts.length === 2,503,'unavailable'); uuid(parts[0]); }
        else demand(parts.length === 1,503,'unavailable');
        demand(['jpg','png',...(media==='photo'?['webp']:[])].some(ext=>parts.at(-1) === `${id}.${ext}`),503,'unavailable');
        const response = await this.response(signed.href,{method:'GET'},5242880), contentType=response.headers.get('content-type')?.split(';')[0];
        demand(response.status === 200 && ['image/jpeg','image/png','image/webp'].includes(contentType ?? ''),503,'unavailable');
        return {status:200,bytes:response.bytes,contentType:contentType!};
    }
    async perform(credentials: Credentials, capabilities: Capabilities, inputOperation: Operation): Promise<WireResponse> {
        demand(capabilities.view && !capabilities.edit && !capabilities.publish && !capabilities.confirmPayments,403,'forbidden');
        if(inputOperation.kind==='command'&&inputOperation.channel==='notifications')return this.notification(credentials,capabilities,inputOperation.command,'client');
        if(inputOperation.kind==='command'&&inputOperation.channel==='checkins'&&inputOperation.command.action==='read_photo_inventory_v1')return this.photoInventory(credentials,capabilities,inputOperation.command);
        const operation=inputOperation.kind==='command'&&inputOperation.channel==='reviews'
            ? parseClientCommand(inputOperation.channel,inputOperation.command) : inputOperation;
        if(operation.kind === 'client-media') return this.media(credentials,operation.media,operation.id,operation.schemaVersion===2);
        let body: unknown;
        if(operation.kind === 'client-upload'){
            validateClientUpload(operation.channel,operation.metadata,operation.bytes,operation.contentType);
            let payload: BodyInit; let headers: Record<string,string>; let suffix='';
            if(operation.channel==='payments'){
                const form = new FormData();form.set('metadata',JSON.stringify(operation.metadata));form.set('file',new Blob([operation.bytes],{type:operation.contentType}),'evidence');
                payload=form;headers=this.headers(credentials.access_token);delete headers['Content-Type'];
            }else{
                payload=operation.bytes;suffix='/upload';headers={...this.headers(credentials.access_token),'Content-Type':operation.contentType,'x-request-id':String(operation.metadata.requestId),'x-completion-request-id':String(operation.metadata.completionRequestId),'x-expected-revision':String(operation.metadata.expectedRevision),'x-photo-angle':String(operation.metadata.angle)};
            }
            const response=await this.response(`${SUPABASE_ORIGIN}/functions/v1/concierge-${operation.channel}${suffix}`,{method:'POST',body:payload,headers});
            demand(response.status>=200&&response.status<300,[400,401,403,409,413,415,429].includes(response.status)?response.status:503,'unavailable');
            try{body=JSON.parse(new TextDecoder().decode(response.bytes));}catch{demand(false,503,'unavailable');}
        }else{
            demand(operation.kind === 'command',403,'action_forbidden');
            parseClientCommand(operation.channel,operation.command);
            const action=operation.command.action;
            if(action==='photo_view'||action==='evidence_url'){
                const media=action==='photo_view'?'photo':'evidence',key=media==='photo'?'photoId':'evidenceId';
                const id=uuid(operation.command[key]);
                // Verify current ownership now; binary endpoint reauthorizes again on image fetch.
                const descriptor=object(await this.edge(credentials,`concierge-${operation.channel}`,operation.command));
                demand(descriptor[key]===id,503,'unavailable');
                if(descriptor.schemaVersion===2)demand(media==='evidence'&&(descriptor.paymentOptionId===null||typeof descriptor.paymentOptionId==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(descriptor.paymentOptionId)),503,'unavailable');
                return {status:200,body:{[key]:id,signedUrl:`${PORTAL_ORIGIN}/api/client/media/${media}?id=${id}${media==='evidence'&&descriptor.schemaVersion===2?'&v=2':''}`,...(media==='photo'?{expiresIn:60}:{expiresInSeconds:60,...(descriptor.schemaVersion===2?{schemaVersion:2,paymentOptionId:descriptor.paymentOptionId}:{})})}};
            }
            if(operation.channel==='reviews'){
                try{body=await this.edge(credentials,'concierge-reviews',operation.command);}
                catch(error){return reviewTransportError(error,operation.command);}
            }else body=await this.edge(credentials,`concierge-${operation.channel}`,operation.command);
        }
        if(operation.kind==='command'&&operation.channel==='plans')body=mapPlanResponse(body,operation.command);
        if(operation.kind==='command'&&operation.channel==='care')body=mapCareResponse(body,operation.command);
        if(operation.kind==='command'&&operation.channel==='reviews')body=mapReviewResponse(body,operation.command);
        if(operation.kind==='command'&&operation.channel==='checkins'&&operation.command.action==='read_photo_head_v1')body=mapClientPhotoHeadResponse(body);
        demand(!hasCredentials(body,credentials) && !privateFields(body),503,'unavailable');
        return {status:200,body};
    }
}
