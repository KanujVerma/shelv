import {createNotificationViewLease} from '../src/app/notification-owner.ts';
import type {ApplicationSession} from '../src/app/session.ts';
import type {NotificationController} from '../src/features/notifications/types.ts';
declare const runtime: ApplicationSession;
const lease=createNotificationViewLease(runtime,{isApplicable:()=>true});
const controller:NotificationController=lease.controller;void controller;
const acquired:boolean=lease.start();void acquired;
// @ts-expect-error no caller owner or capability input
createNotificationViewLease(runtime,{ownerId:'caller',canView:true});
// @ts-expect-error no caller controller implementation
createNotificationViewLease(runtime,{createController(){}});
// @ts-expect-error no exposed private core
lease.core;
// @ts-expect-error handle cannot replace the actual controller
lease.controller=controller;
// @ts-expect-error lifecycle methods are immutable
lease.start=()=>true;
