import { readPlanContent } from "../../../../../src/contracts/PortalRebuildValidation.ts";
import { sameContent } from "./model.ts";
import type { AdvisorController } from "./types.ts";

/** Whether this dialog may dismiss its text. Comparison is still the existing
 * read operation; this result grants no apply/review/publication authority. */
export async function prepareAgentImportComparison(c: AdvisorController, raw: string): Promise<boolean> {
  const before = c.getSnapshot(), actor = c.permissions.actorId;
  if (before.ended || !c.permissions.view || !c.permissions.edit || !before.view ||
    before.view.draft.state !== "working" || before.pending || before.busy) return false;
  try {
    const proposed = readPlanContent(JSON.parse(raw));
    await c.compare(proposed);
    const after = c.getSnapshot(), comparison = after.comparison;
    return !after.ended && c.permissions.actorId === actor && c.permissions.view && c.permissions.edit &&
      after.view === before.view && after.local === before.local && !after.pending && !after.busy &&
      after.notice === null && comparison !== null && comparison !== before.comparison &&
      comparison.latest.draft.id === before.view.draft.id && after.comparisonLocal === before.local &&
      sameContent(comparison.proposed, proposed);
  } catch { return false; }
}
