import {createAdvisorPublicationNotifications} from '../src/app/advisor-notifications.ts';
import {AdvisorWorkspaceNotifications} from '../src/app/AdvisorWorkspaceNotifications.tsx';
import type {ApplicationSession} from '../src/app/session.ts';
import type {PortalNavigationCore} from '../src/navigation/react.tsx';
import type {AdvisorController} from '../src/features/advisor/types.ts';
declare const runtime:ApplicationSession,nav:PortalNavigationCore,controller:AdvisorController;
const lease=createAdvisorPublicationNotifications(runtime,nav,controller);lease?.start();
// @ts-expect-error no caller permission, owner or positive currentness argument
createAdvisorPublicationNotifications(runtime,nav,controller,{canView:true});
AdvisorWorkspaceNotifications({runtime,controller,navigation:{route:{name:'advisor-plans'},navigate(){}}});
// @ts-expect-error only W0 creates the publication notification handle
AdvisorWorkspaceNotifications({runtime,controller,navigation:{route:{name:'advisor-plans'},navigate(){}},publicationNotifications:{}});
