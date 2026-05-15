import { useState, useEffect } from 'react';
import type { RefObject } from 'react';
import type { Timeframe } from '../types/index.ts';

// Augment the global window type with the TradingView widget injected by tv.js
declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown;
    };
  }
}

// ---------------------------------------------------------------------------
// Symbol / interval / style mappings
// ---------------------------------------------------------------------------

const FUTURES_MAP: Record<string, string> = {
  '/ES': 'CME_MINI:ES1!',
  '/NQ': 'CME_MINI:NQ1!',
  '/CL': 'NYMEX:CL1!',
  '/GC': 'COMEX:GC1!',
};

export function normalizeSymbol(input: string): string {
  const upper = input.toUpperCase();
  return FUTURES_MAP[upper] ?? upper;
}

const INTERVAL_MAP: Record<Timeframe, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1H': '60',
  '4H': '240',
  '1D': 'D',
  '1W': 'W',
};

const STYLE_MAP: Record<'candlestick' | 'line' | 'bar', string> = {
  candlestick: '1',
  line: '2',
  bar: '0',
};

export const DEFAULT_STUDIES = [
  'MASimple@tv-scriptwiz',
  'RSI@tv-scriptwiz',
  'MACD@tv-scriptwiz',
];

// ---------------------------------------------------------------------------
// Script loader (idempotent — safe to call multiple times)
// ---------------------------------------------------------------------------

const TV_SCRIPT_SRC = 'https://s3.tradingview.com/tv.js';

function loadTradingViewScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.TradingView) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TV_SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('tv.js failed')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = TV_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('tv.js failed to load'));
    document.head.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTradingView(
  containerRef: RefObject<HTMLDivElement | null>,
  ticker: string,
  timeframe: Timeframe,
  chartType: 'candlestick' | 'line' | 'bar',
  studies: string[] = DEFAULT_STUDIES,
): { hasError: boolean } {
  const [hasError, setHasError] = useState(false);

  // Serialize the array so useEffect gets a stable primitive to compare
  const studiesKey = studies.join(',');

  useEffect(() => {
    let cancelled = false;
    setHasError(false);

    async function initWidget() {
      try {
        await loadTradingViewScript();

        if (cancelled) return;

        const container = containerRef.current;
        const TV = window.TradingView;
        if (!container || !TV) return;

        // Destroy previous widget instance by clearing the container
        container.innerHTML = '';

        new TV.widget({
          container,
          symbol: normalizeSymbol(ticker),
          interval: INTERVAL_MAP[timeframe],
          style: STYLE_MAP[chartType],
          theme: 'dark',
          locale: 'en',
          toolbar_bg: '#111318',
          autosize: true,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          save_image: false,
          withdateranges: true,
          studies: studies.length > 0 ? studies : [],
        });
      } catch (err) {
        if (!cancelled) {
          console.error('[useTradingView] Widget initialization failed:', err);
          setHasError(true);
        }
      }
    }

    initWidget();

    return () => {
      cancelled = true;
    };
    // containerRef is a stable ref object — intentionally omitted from deps
    // studiesKey is the serialized form of the studies array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, timeframe, chartType, studiesKey]);

  return { hasError };
}
