import {createAdvisorAdmissionPorts} from '../src/app/advisor-admission-request.ts';
import type {ApplicationSession} from '../src/app/session.ts';
import type {AdvisorAdmissionPorts} from '../src/features/advisor/admission/types.ts';
declare const runtime:ApplicationSession;
const ports:AdvisorAdmissionPorts=createAdvisorAdmissionPorts(runtime);void ports;
// @ts-expect-error no caller capability/owner factory argument
createAdvisorAdmissionPorts(runtime,{canAddClient:true,ownerId:'caller'});
