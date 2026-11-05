import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

/**
 * Small, dependency-free safeguards for a single Node.js server instance.
 * For production deployments with multiple instances, enforce a shared rate
 * limit at the proxy/WAF as well. The in-memory counters are not distributed.
 */
type RateBucket = { count: number; resetAt: number };

const buckets = new Map<string, RateBucket>();
const MAX_BUCKETS = 10_000;
const MAX_CONCURRENT_AI_REQUESTS = 4;
let activeAIRequests = 0;

export class RequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Compares an admin Bearer token without leaking content through logging. */
export function verifyBearerToken(request: Request, expected: string): boolean {
  const header = request.headers.get('authorization') ?? '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : '';
  const actualBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer);
}

function clientId(request: NextRequest): string {
  // These headers need to be set or sanitized by a trusted reverse proxy.
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const candidate = request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-real-ip')
    ?? forwarded
    ?? 'unknown';

  return candidate.length <= 64 && /^[a-zA-Z0-9.:_-]+$/.test(candidate)
    ? candidate
    : 'unknown';
}

/** Returns the number of seconds to wait, or null if the request is allowed. */
export function checkRateLimit(request: NextRequest, route: 'game' | 'blog'): number | null {
  const now = Date.now();
  const ip = clientId(request);
  const perMinute = route === 'game' ? 12 : 6;
  const perHour = route === 'game' ? 60 : 30;
  const globalPerMinute = route === 'game' ? 60 : 30;
  const globalPerHour = route === 'game' ? 180 : 90;
  const globalPerDay = route === 'game' ? 1_000 : 300;

  const limits = [
    { key: `${route}:ip:${ip}:minute`, max: perMinute, period: 60_000 },
    { key: `${route}:ip:${ip}:hour`, max: perHour, period: 3_600_000 },
    { key: `${route}:global:minute`, max: globalPerMinute, period: 60_000 },
    { key: `${route}:global:hour`, max: globalPerHour, period: 3_600_000 },
    { key: `${route}:global:day`, max: globalPerDay, period: 86_400_000 },
  ];

  if (buckets.size >= MAX_BUCKETS) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }

  // Fail closed if too many unique client identifiers are being submitted.
  if (buckets.size >= MAX_BUCKETS && !buckets.has(limits[0].key)) return 60;

  for (const limit of limits) {
    const current = buckets.get(limit.key);
    if (current && current.resetAt > now && current.count >= limit.max) {
      return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    }
  }

  for (const limit of limits) {
    const current = buckets.get(limit.key);
    if (!current || current.resetAt <= now) {
      buckets.set(limit.key, { count: 1, resetAt: now + limit.period });
    } else {
      current.count += 1;
    }
  }
  return null;
}

/** Limits concurrent OpenAI requests on this server instance. */
export function reserveAISlot(): (() => void) | null {
  if (activeAIRequests >= MAX_CONCURRENT_AI_REQUESTS) return null;
  activeAIRequests += 1;
  let released = false;
  return () => {
    if (!released) {
      released = true;
      activeAIRequests -= 1;
    }
  };
}

/** Rejects oversized and malformed JSON before passing data to OpenAI. */
export async function readLimitedJson(request: NextRequest, maxBytes: number): Promise<unknown> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType)) {
    throw new RequestError(415, '请求必须使用 JSON 格式');
  }

  const declaredLength = request.headers.get('content-length');
  if (declaredLength && Number(declaredLength) > maxBytes) {
    throw new RequestError(413, '请求内容过长');
  }
  if (!request.body) throw new RequestError(400, '请求内容不能为空');

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let jsonText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new RequestError(413, '请求内容过长');
    }
    jsonText += decoder.decode(value, { stream: true });
  }
  jsonText += decoder.decode();

  try {
    return JSON.parse(jsonText) as unknown;
  } catch {
    throw new RequestError(400, 'JSON 内容格式不正确');
  }
}
