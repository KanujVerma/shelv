import type { ComponentProps } from 'react';
import type { ApplicationSession } from '../src/app/session.ts';
import type { PortalNavigator } from '../src/navigation/history.ts';
import { createOwnerPolicyApplicationScope, OwnerPolicyApplication, OwnerPolicyApplicationContent } from '../src/app/OwnerPolicyApplication.tsx';
function privateInputs(runtime: ApplicationSession, navigator: PortalNavigator, win: Window) {
  const scope = createOwnerPolicyApplicationScope({ runtime, navigator, win });
  const state = scope.getSnapshot();
  // @ts-expect-error no positive ready/current/actor flag
  createOwnerPolicyApplicationScope({ runtime, navigator, win, isCurrent: () => true });
  // @ts-expect-error no owner selection or source grant
  createOwnerPolicyApplicationScope({ runtime, navigator, win, ownerId: 'owner' });
  // @ts-expect-error no injected operation port or fulfilled read
  createOwnerPolicyApplicationScope({ runtime, navigator, win, port: { execute: async () => ({}) } });
  // @ts-expect-error no override endpoint, clock or policy basis
  createOwnerPolicyApplicationScope({ runtime, navigator, win, now: () => 0 });
  // @ts-expect-error canonical navigation owner is required, not an entry callback
  createOwnerPolicyApplicationScope({ runtime, navigator: () => true, win });
  // @ts-expect-error private snapshot cannot be made current by the caller
  state.controller = null;
  // @ts-expect-error App entry accepts actual runtime/window only
  const unsafe: ComponentProps<typeof OwnerPolicyApplication> = { runtime, win, isOwner: true };
  // @ts-expect-error Content cannot accept a forged successful scope
  const forged: ComponentProps<typeof OwnerPolicyApplicationContent> = { scope: { getSnapshot: scope.getSnapshot, subscribe: scope.subscribe, dispose() {} } };
  void unsafe; void forged;
}
void privateInputs;
