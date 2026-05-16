import type { Timeframe } from '../types/index.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OHLCBar {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// ---------------------------------------------------------------------------
// Twelve Data interval mapping
// ---------------------------------------------------------------------------

const INTERVAL_MAP: Record<Timeframe, string> = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '1H': '1h',
  '4H': '4h',
  '1D': '1day',
  '1W': '1week',
};

// How many bars to request per timeframe
const OUTPUT_SIZE: Record<Timeframe, number> = {
  '1m': 390,   // ~1 trading day
  '5m': 500,   // ~1 week
  '15m': 400,  // ~2 weeks
  '1H': 500,   // ~3 months
  '4H': 500,   // ~6 months
  '1D': 365,   // ~1 year
  '1W': 260,   // ~5 years
};

// ---------------------------------------------------------------------------
// Symbol normalization
// ---------------------------------------------------------------------------

const FUTURES_TO_SYMBOL: Record<string, string> = {
  '/ES': 'ES=F',
  '/NQ': 'NQ=F',
  '/CL': 'CL=F',
  '/GC': 'GC=F',
};

export function normalizeSymbol(ticker: string): string {
  const upper = ticker.toUpperCase();

  // Futures shorthand
  if (FUTURES_TO_SYMBOL[upper]) return FUTURES_TO_SYMBOL[upper];

  // Strip exchange prefix (e.g. "AMEX:SPY" → "SPY", "NASDAQ:AAPL" → "AAPL")
  const colonIdx = upper.indexOf(':');
  if (colonIdx !== -1) return upper.slice(colonIdx + 1);

  return upper;
}

// ---------------------------------------------------------------------------
// In-memory cache to avoid redundant API calls
// ---------------------------------------------------------------------------

const cache = new Map<string, { data: OHLCBar[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(ticker: string, timeframe: Timeframe): string {
  return `${normalizeSymbol(ticker)}:${timeframe}`;
}

// ---------------------------------------------------------------------------
// Fetch OHLC data from Twelve Data
// ---------------------------------------------------------------------------

const TWELVE_DATA_BASE = 'https://api.twelvedata.com';

export async function fetchOHLC(
  ticker: string,
  timeframe: Timeframe,
): Promise<OHLCBar[]> {
  const apiKey = import.meta.env.VITE_TWELVE_DATA_KEY as string;
  if (!apiKey) {
    throw new Error('Add VITE_TWELVE_DATA_KEY to .env — get a free key at twelvedata.com');
  }

  const cacheKey = getCacheKey(ticker, timeframe);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const symbol = normalizeSymbol(ticker);
  const interval = INTERVAL_MAP[timeframe];
  const outputSize = OUTPUT_SIZE[timeframe];

  const url = `${TWELVE_DATA_BASE}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputSize}&apikey=${apiKey}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    if (resp.status === 429) {
      throw new Error('API rate limit reached — wait a moment and try again');
    }
    throw new Error(`Market data error: ${resp.status}`);
  }

  const json = await resp.json();

  if (json.status === 'error') {
    throw new Error(json.message ?? 'Unknown API error');
  }

  const values: Array<{
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }> = json.values ?? [];

  if (values.length === 0) {
    throw new Error(`No data found for "${symbol}"`);
  }

  // Twelve Data returns newest first — reverse to chronological order
  const bars: OHLCBar[] = values
    .map((v) => ({
      time: Math.floor(new Date(v.datetime).getTime() / 1000),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseInt(v.volume, 10) || 0,
    }))
    .reverse();

  cache.set(cacheKey, { data: bars, timestamp: Date.now() });
  return bars;
}
