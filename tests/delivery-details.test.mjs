import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = (await readFile(new URL('../src/services/deliveryDetailsService.ts', import.meta.url), 'utf8'))
  .replace(/import \{ supabase \}[^\n]+/, 'const supabase = {};');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { deliveryDateInput, deliveryTimestamp } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const previous = { delivered_to: 'Test Recipient', actual_delivery_date: '2026-09-18T21:00:45.123Z', delivery_date: '2026-09-19' };

test('delivery edit uses Turkey time across UTC day boundaries', () => {
  assert.equal(deliveryDateInput(previous), '2026-09-19T00:00');
  assert.equal(deliveryTimestamp('2026-09-20T00:30', previous), '2026-09-19T21:30:00.000Z');
});
test('recipient-only edit preserves timestamp precision', () => {
  assert.equal(deliveryTimestamp(deliveryDateInput(previous), previous), previous.actual_delivery_date);
});
test('legacy date-only deliveries remain editable', () => {
  assert.equal(deliveryDateInput({ ...previous, actual_delivery_date: null }), '2026-09-19T00:00');
  assert.equal(deliveryDateInput({ delivered_to: null, actual_delivery_date: null, delivery_date: null }), '');
});
test('invalid delivery timestamps are rejected rather than normalized', () => {
  for (const input of ['', '2026-02-30T12:00', '2026-09-20T25:00', 'invalid']) {
    assert.throws(() => deliveryTimestamp(input, previous));
  }
});
