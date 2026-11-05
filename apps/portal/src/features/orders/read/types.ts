import type {ClientOrdersReadView} from '../../../../../../src/contracts/PortalClientOrders.ts';
export type {ClientOrdersReadCommand,ClientOrdersReadView} from '../../../../../../src/contracts/PortalClientOrders.ts';
export type ClientOrdersRoute={name:'orders'}|{name:'order';orderId:string};
export type ClientOrdersReadSnapshot=Readonly<{
  phase:'idle'|'loading'|'ready'|'denied'|'unavailable'|'ended';
  view:ClientOrdersReadView|null;
  error:400|401|403|404|409|413|415|429|503|null;
}>;
export interface ClientOrdersReadController {
  getSnapshot():ClientOrdersReadSnapshot;
  subscribe(listener:()=>void):()=>void;
  load():Promise<void>;
  dispose():void;
}
