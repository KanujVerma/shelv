import { mapPlanResult } from "../../../../src/contracts/PortalRebuildMapping.ts";
import {mapReviewResult} from "../../../../src/contracts/PortalReviewMapping.ts";
import {mapCareResult} from "../../../../src/contracts/PortalCareMapping.ts";
import {sameCareValue} from "../../../../src/contracts/PortalCareValidation.ts";
import {TransportError} from "../transport/session.ts";
import type {
  ClientPlanPorts,
  ClientPlanReadView,
  PlanSessionBoundary,
} from "../features/plan/types.ts";
export interface ClientPlanState {
  view: ClientPlanReadView | null;
  loading: boolean;
  error: number | null;
  ended: boolean;
}
export function createClientPlanController(
  session: PlanSessionBoundary,
  ports: ClientPlanPorts,
  options: {readVersion?:1|2|3} = {},
) {
  const listeners = new Set<() => void>(),
    controllers = new Set<AbortController>();
  let state: ClientPlanState = {
      view: null,
      loading: true,
      error: null,
      ended: false,
    },
    sequence = 0,
    disposed = false,
    confirmedV3 = options.readVersion===3,
    readable = true;
  const live = () => !disposed && !state.ended && session.isCurrent();
  function emit(patch: Partial<ClientPlanState>) {
    state = { ...state, ...patch };
    listeners.forEach((fn) => fn());
  }
  const stop = session.subscribeInvalidation(() => {
    sequence++;
    controllers.forEach((c) => c.abort());
    emit({ view: null, loading: false, error: 401, ended: true });
  });
  const command = {
    schemaVersion: 1 as const,
    action: "read_client_plan_v1" as const,
    version: null,
  };
  const careCommand={schemaVersion:1 as const,action:"read_client_plan_v2" as const,version:null};
  const reviewCommand={schemaVersion:1 as const,action:"read_client_plan_v3" as const,version:null};
  function accept(view: ClientPlanReadView) {
      if (!live() || !readable) return;
      if(confirmedV3&&view.schemaVersion!==3)throw new Error('invalid_view');
      const decoded = (view.schemaVersion===3?mapReviewResult(view,reviewCommand):view.schemaVersion===2?mapCareResult(view,careCommand):mapPlanResult(view,command)) as ClientPlanReadView;
      if(!sameCareValue(decoded,view))throw new Error("invalid_view");
      if(view.schemaVersion===3)confirmedV3=true;
      sequence++;
      emit({view,error:null,loading:false});
  }
  return {
    getSnapshot: () => state,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    // Validation retains the exact supplied canonical object (F4/F5).
    accept,
    acceptFrom(source: ClientPlanReadView) {
      const owner = sequence;
      return (view: ClientPlanReadView) => {
        if (owner === sequence && state.view === source) accept(view);
      };
    },
    async refresh() {
      if (!live()) return;
      const start = ++sequence,
        controller = new AbortController();
      controllers.add(controller);
      emit({ loading: true, error: null });
      try {
        let view:ClientPlanReadView;
        if(confirmedV3 || state.view?.schemaVersion===3){
          if(!ports.review)throw new TransportError(503);
          const supplied=await ports.review.execute(reviewCommand,{signal:controller.signal});
          const decoded=mapReviewResult(supplied,reviewCommand) as ClientPlanReadView;
          if(!sameCareValue(decoded,supplied))throw new Error('invalid_view');
          view=supplied as ClientPlanReadView;
        }else if(options.readVersion===2 || state.view?.schemaVersion===2){
          if(!ports.care)throw new TransportError(503);
          view=mapCareResult(await ports.care.execute(careCommand,{signal:controller.signal}),careCommand) as ClientPlanReadView;
        }else view=await ports.read.execute(command,{signal:controller.signal});
        if (live() && start === sequence && !controller.signal.aborted){
          if(view.schemaVersion===3)confirmedV3=true;
          readable=true;
          emit({ view, loading: false });
        }
      } catch (error) {
        if (live() && start === sequence && !controller.signal.aborted) {
          const status = (error as { status?: number }).status;
          if(status===403)readable=false;
          emit({
            ...(status===403?{view:null}:{}),
            loading: false,
            error:
              status && [401, 403, 404, 409, 429, 503].includes(status)
                ? status
                : 503,
          });
        }
      } finally {
        controllers.delete(controller);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      sequence++;
      controllers.forEach((c) => c.abort());
      controllers.clear();
      stop();
      listeners.clear();
      state = { view: null, loading: false, error: null, ended: true };
    },
  };
}
