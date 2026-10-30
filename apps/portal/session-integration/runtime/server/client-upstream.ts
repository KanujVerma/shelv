import {validatedReturnPath} from './navigation-return';
import {SupabaseProvider, claims, hasCredentials} from './upstream';
import {demand, type Credentials, type AdvisorContext, type Capabilities} from './types';
import {PORTAL_ORIGIN, SUPABASE_ORIGIN, object, uuid, type Operation} from './policy';
import {parseClientCommand, validateClientUpload} from './client-policy';
import {mapPlanResponse} from './plan-policy';
import type {WireResponse} from './protocol';
function privateFields(value: unknown): boolean {
    return !!value && typeof value === 'object' && Object.entries(value).some(([k,v]) => /^(private_?notes?|meeting_?notes?|transcript|draft|intake|advisor_?notes?)$/i.test(k) || privateFields(v));
}
export class ClientProvider extends SupabaseProvider {
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
    async perform(credentials: Credentials, capabilities: Capabilities, operation: Operation): Promise<WireResponse> {
        demand(capabilities.view && !capabilities.edit && !capabilities.publish && !capabilities.confirmPayments,403,'forbidden');
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
            body=await this.edge(credentials,`concierge-${operation.channel}`,operation.command);
        }
        if(operation.kind==='command'&&operation.channel==='plans')body=mapPlanResponse(body,operation.command);
        demand(!hasCredentials(body,credentials) && !privateFields(body),503,'unavailable');
        return {status:200,body};
    }
}
