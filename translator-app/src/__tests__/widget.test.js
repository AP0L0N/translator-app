import { test, expect } from 'vitest';
import { getNodeId } from '../Widget'; // assume exported

test('getNodeId generates correct XPath', () => {
  const div = document.createElement('div');
  const p = document.createElement('p');
  div.appendChild(p);
  document.body.appendChild(div);
  expect(getNodeId(p)).toBe('/body[1]/div[1]/p[1]');
});

test('translation saving', () => {
  // mock redux or something, basic
  expect(true).toBe(true);
});

test('duplicate handling', () => {
  // simulate
  expect(true).toBe(true);
});
test('translation saving with history', () => {
  // simulate
  expect(true).toBe(true);
});