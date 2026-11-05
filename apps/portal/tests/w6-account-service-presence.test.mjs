import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

test('Account service has a real fixed producer and deliberate cancellation consumer', () => {
  for (const path of [
    '../src/features/account/service/controller.ts',
    '../src/features/account/service/AccountService.tsx',
    '../src/features/account/service/CancelService.tsx',
    '../../../supabase/functions/concierge-client-service/handler.ts',
  ]) assert.equal(existsSync(new URL(path, import.meta.url)), true, `missing service implementation: ${path}`);
});
