import type { ClientPlanView } from "../../../../src/contracts/PortalRebuild.ts";
import { mapPlanResult } from "../../../../src/contracts/PortalRebuildMapping.ts";
import type {
  ClientPlanPorts,
  PlanSessionBoundary,
} from "../features/plan/types.ts";
export interface ClientPlanState {
  view: ClientPlanView | null;
  loading: boolean;
  error: number | null;
  ended: boolean;
}
export function createClientPlanController(
  session: PlanSessionBoundary,
  ports: ClientPlanPorts,
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
    disposed = false;
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
  return {
    getSnapshot: () => state,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    accept(view: ClientPlanView) {
      if (!live()) return;
      sequence++;
      emit({
        view: mapPlanResult(view, command) as ClientPlanView,
        error: null,
        loading: false,
      });
    },
    async refresh() {
      if (!live()) return;
      const start = ++sequence,
        controller = new AbortController();
      controllers.add(controller);
      emit({ loading: true, error: null });
      try {
        const view = await ports.read.execute(command, {
          signal: controller.signal,
        });
        if (live() && start === sequence && !controller.signal.aborted)
          emit({ view, loading: false });
      } catch (error) {
        if (live() && start === sequence && !controller.signal.aborted) {
          const status = (error as { status?: number }).status;
          emit({
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
