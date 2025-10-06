// app/api/fmp/route.js
import { NextResponse } from 'next/server';

const FMP_BASE_V3 = 'https://financialmodelingprep.com/api/v3';
const FMP_BASE_ROOT = 'https://financialmodelingprep.com'; // for /stable endpoints
const API_KEY = process.env.FMP_API_KEY; // Server-only key

// --- Simple in-memory cache (clears on redeploy) ---
const cache = new Map();
const TTL_MS = 1000 * 30; // 30s

function cacheKey(url) { return `fmp:${url}`; }

// --- Token bucket rate limiter (300 calls/min) ---
const BUCKET_CAPACITY = 300;
const REFILL_INTERVAL_MS = 60_000;
let tokens = BUCKET_CAPACITY;
let lastRefill = Date.now();

function refillTokens() {
  const now = Date.now();
  const elapsed = now - lastRefill;
  if (elapsed > 0) {
    const add = (elapsed / REFILL_INTERVAL_MS) * BUCKET_CAPACITY;
    tokens = Math.min(BUCKET_CAPACITY, tokens + add);
    lastRefill = now;
  }
}

async function takeTokenOrWait(signal) {
  while (true) {
    refillTokens();
    if (tokens >= 1) {
      tokens -= 1;
      return;
    }
    await new Promise((res, rej) => {
      const id = setTimeout(res, 150);
      if (signal) {
        const onAbort = () => { clearTimeout(id); rej(new Error('Aborted')); };
        signal.addEventListener('abort', onAbort, { once: true });
      }
    });
  }
}

/**
 * Generic FMP fetcher with:
 * - base override (v3 vs root for /stable)
 * - server-side caching
 * - token-bucket rate-limiting
 * - API key injection
 */
async function fmpFetch(pathAndQuery, {
  signal,
  base = FMP_BASE_V3,
  includeKey = true,
  revalidate = 30
} = {}) {
  if (includeKey && !API_KEY) throw new Error('Missing FMP_API_KEY on server');

  let url = `${base}${pathAndQuery}`;
  if (includeKey) {
    url += `${pathAndQuery.includes('?') ? '&' : '?'}apikey=${API_KEY}`;
  }

  const key = cacheKey(url);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.time < TTL_MS) return hit.data;

  await takeTokenOrWait(signal);

  const res = await fetch(url, { next: { revalidate }, signal });
  if (!res.ok) throw new Error(`FMP error ${res.status}`);
  const data = await res.json();
  cache.set(key, { time: now, data });
  return data;
}

export async function GET(req) {
  try {
    const controller = new AbortController();
    const { signal } = controller;
    const { searchParams } = new URL(req.url);

    const resource = searchParams.get('resource'); // 'screener' | 'history' | 'profile' | 'news' | 'insider'
    const symbol = searchParams.get('symbol') || '';
    const marketCapMoreThan = searchParams.get('marketCapMoreThan') || '1000000';
    const limit = searchParams.get('limit') || '5000';

    let data;

    if (resource === 'screener') {
      const qp = `?marketCapMoreThan=${marketCapMoreThan}&limit=${limit}`;
      data = await fmpFetch(`/stock-screener${qp}`, { signal });

    } else if (resource === 'history' && symbol) {
      data = await fmpFetch(`/historical-price-full/${encodeURIComponent(symbol)}`, { signal });

    } else if (resource === 'profile' && symbol) {
      data = await fmpFetch(`/profile/${encodeURIComponent(symbol)}`, { signal });

    } else if (resource === 'news') {
      // Accept either ?symbols=... or fallback to single ?symbol=...
      const symbols = searchParams.get('symbols') || symbol;
      const newsLimit = searchParams.get('limit') || '20';
      if (!symbols) {
        return NextResponse.json({ error: 'symbols or symbol is required for news' }, { status: 400 });
      }
      const qp = `?symbols=${encodeURIComponent(symbols)}&limit=${encodeURIComponent(newsLimit)}`;
      data = await fmpFetch(`/stable/news/stock${qp}`, {
        signal,
        base: FMP_BASE_ROOT,
        includeKey: true,
        revalidate: 30
      });

    } else if (resource === 'insider') {
      // Insider trading activity (stable endpoint)
      const sym = searchParams.get('symbol') || symbol;
      const iLimit = searchParams.get('limit') || '20';
      if (!sym) {
        return NextResponse.json({ error: 'symbol is required for insider' }, { status: 400 });
      }
      const qp = `?symbol=${encodeURIComponent(sym)}&limit=${encodeURIComponent(iLimit)}`;
      data = await fmpFetch(`/stable/insider-trading/search${qp}`, {
        signal,
        base: FMP_BASE_ROOT,
        includeKey: true,
        revalidate: 60
      });

    } else {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
