import { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useChart } from '../../hooks/useChart.ts';
import { useChartDrawing } from '../../context/ChartContext.tsx';
import type { ChartDataSummary } from '../../context/ChartContext.tsx';
import styles from './TradingViewWidget.module.css';

export function TradingViewWidget() {
  const { state } = useApp();
  const { registerAPI, setDataSummary } = useChartDrawing();
  const containerRef = useRef<HTMLDivElement>(null);

  const { isLoading, error, addHorizontalLine, addTrendline, addMarker, clearAnnotations, getBars } = useChart(
    containerRef,
    state.ticker,
    state.timeframe,
    state.chartType,
  );

  // Register drawing API so the tutor can call it
  useEffect(() => {
    registerAPI({ addHorizontalLine, addTrendline, addMarker, clearAnnotations });
  }, [registerAPI, addHorizontalLine, addTrendline, addMarker, clearAnnotations]);

  // Push data summary whenever chart data loads
  useEffect(() => {
    if (isLoading) return;
    const bars = getBars();
    if (bars.length === 0) return;

    const last = bars[bars.length - 1];
    const allHighs = bars.map((b) => b.high);
    const allLows = bars.map((b) => b.low);

    // Find recent swing highs/lows from last 50 bars with timestamps
    const recent = bars.slice(-50);
    const recentHighs = [...new Set(recent.map((b) => b.high))]
      .sort((a, b) => b - a)
      .slice(0, 3);
    const recentLows = [...new Set(recent.map((b) => b.low))]
      .sort((a, b) => a - b)
      .slice(0, 3);

    // Identify swing points (local maxima/minima in last 50 bars)
    const swings: Array<{ time: number; price: number; type: 'high' | 'low' }> = [];
    for (let i = 2; i < recent.length - 2; i++) {
      const bar = recent[i];
      // Swing high: higher high than 2 bars on each side
      if (bar.high > recent[i - 1].high && bar.high > recent[i - 2].high &&
          bar.high > recent[i + 1].high && bar.high > recent[i + 2].high) {
        swings.push({ time: bar.time, price: bar.high, type: 'high' });
      }
      // Swing low: lower low than 2 bars on each side
      if (bar.low < recent[i - 1].low && bar.low < recent[i - 2].low &&
          bar.low < recent[i + 1].low && bar.low < recent[i + 2].low) {
        swings.push({ time: bar.time, price: bar.low, type: 'low' });
      }
    }

    const summary: ChartDataSummary = {
      currentPrice: last.close,
      high: Math.max(...allHighs),
      low: Math.min(...allLows),
      open: bars[0].open,
      recentHighs,
      recentLows,
      firstBarTime: bars[0].time,
      lastBarTime: last.time,
      recentSwings: swings.slice(-8), // Last 8 swing points
    };

    setDataSummary(summary);
  }, [isLoading, getBars, setDataSummary]);

  if (error) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.error}>
          <span className={styles.errorIcon} aria-hidden="true">📡</span>
          <p className={styles.errorText}>{error}</p>
          <button
            className={styles.reloadBtn}
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <span className={styles.loadingText}>Loading chart data…</span>
        </div>
      )}
      <div ref={containerRef} className={styles.container} />
    </div>
  );
}
