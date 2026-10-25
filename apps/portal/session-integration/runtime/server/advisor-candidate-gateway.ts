import clientGateway, {advisorGateway, type GatewayEnv} from './gateway';
import {walkthroughFetch} from './walkthrough-combined';
export default {fetch(request: Request, env: GatewayEnv & {ADVISOR_SHARED_SESSIONS?: string}) {
    const path = new URL(request.url).pathname;
    if(path === '/api/walkthroughs' || path.startsWith('/api/walkthroughs/'))return walkthroughFetch(request,env);
    if (path === '/api/advisor' || path.startsWith('/api/advisor/')) {
        if (env.ADVISOR_SHARED_SESSIONS !== 'true') return clientGateway.fetch(request, env);
        return advisorGateway.fetch(request, env);
    }
    return clientGateway.fetch(request, env);
}};
