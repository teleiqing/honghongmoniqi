import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  checkRateLimit,
  readLimitedJson,
  RequestError,
  reserveAISlot,
  verifyBearerToken,
} from '../src/lib/request-security.ts';

function jsonRequest(value, ip = '203.0.113.11') {
  return new Request('https://example.test/api/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': ip },
    body: JSON.stringify(value),
  });
}

test('valid JSON is accepted', async () => {
  assert.deepEqual(await readLimitedJson(jsonRequest({ hello: 'world' }), 1024), {
    hello: 'world',
  });
});

test('oversized JSON is rejected with 413', async () => {
  await assert.rejects(
    () => readLimitedJson(jsonRequest({ message: 'A'.repeat(1000) }), 100),
    (error) => error instanceof RequestError && error.status === 413,
  );
});

test('incorrect content type is rejected', async () => {
  const plain = new Request('https://example.test', { method: 'POST', body: 'hello' });
  await assert.rejects(
    () => readLimitedJson(plain, 100),
    (error) => error instanceof RequestError && error.status === 415,
  );
});

test('admin Bearer token must match exactly', () => {
  const secret = 'x'.repeat(40); // fixed dummy test value, not a real credential
  const authorized = new Request('https://example.test', {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const unauthorized = new Request('https://example.test', {
    headers: { Authorization: 'Bearer incorrect' },
  });
  assert.equal(verifyBearerToken(authorized, secret), true);
  assert.equal(verifyBearerToken(unauthorized, secret), false);
});

test('a single IP cannot exceed the per-minute request limit', () => {
  const request = jsonRequest({}, '203.0.113.12');
  for (let i = 0; i < 12; i++) assert.equal(checkRateLimit(request, 'game'), null);
  const retry = checkRateLimit(request, 'game');
  assert.ok(typeof retry === 'number' && retry >= 1);
});

test('AI concurrency is bounded and can recover', () => {
  const slots = Array.from({ length: 4 }, () => reserveAISlot());
  assert.ok(slots.every((slot) => typeof slot === 'function'));
  assert.equal(reserveAISlot(), null);
  slots[0]();
  const nextSlot = reserveAISlot();
  assert.equal(typeof nextSlot, 'function');
  slots.slice(1).forEach((slot) => slot());
  nextSlot();
});
