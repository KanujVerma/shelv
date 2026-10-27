import {portalReturnPath} from '../../../site/auth/navigation-return.js';
import {demand} from './types';
/** Keep the same allowlist at gateway, durable boundary and provider boundary. */
export function validatedReturnPath(value:unknown,audience:'client'|'advisor'){
 try{return portalReturnPath(value,audience);}catch{demand(false,400,'invalid_request');}
}
