import type { UserProgress, Message, Timeframe } from '../types/index.ts';

const KEYS = {
  PROGRESS: 'tradeiq_progress',
  MESSAGES: 'tradeiq_messages',
  CHART: 'tradeiq_chart',
  ONBOARDED: 'tradeiq_onboarded',
} as const;

export type ChartState = {
  ticker: string;
  timeframe: Timeframe;
  chartType: 'candlestick' | 'line' | 'bar';
};

export function loadProgress(): UserProgress | null {
  try {
    const raw = localStorage.getItem(KEYS.PROGRESS);
    return raw ? (JSON.parse(raw) as UserProgress) : null;
  } catch {
    return null;
  }
}

export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
  } catch {
    // localStorage quota exceeded — ignore
  }
}

export function loadMessages(): Message[] {
  try {
    const raw = localStorage.getItem(KEYS.MESSAGES);
    return raw ? (JSON.parse(raw) as Message[]) : [];
  } catch {
    return [];
  }
}

export function saveMessages(messages: Message[]): void {
  const capped = messages.slice(-100);
  try {
    localStorage.setItem(KEYS.MESSAGES, JSON.stringify(capped));
  } catch {
    // Quota exceeded — trim aggressively and retry
    try {
      localStorage.setItem(KEYS.MESSAGES, JSON.stringify(capped.slice(-80)));
    } catch {
      // Give up rather than crash
    }
  }
}

export function loadChartState(): ChartState | null {
  try {
    const raw = localStorage.getItem(KEYS.CHART);
    return raw ? (JSON.parse(raw) as ChartState) : null;
  } catch {
    return null;
  }
}

export function saveChartState(state: ChartState): void {
  try {
    localStorage.setItem(KEYS.CHART, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(KEYS.ONBOARDED) === 'true';
  } catch {
    return false;
  }
}

export function setOnboarded(value: boolean): void {
  try {
    localStorage.setItem(KEYS.ONBOARDED, String(value));
  } catch {
    // ignore
  }
}
