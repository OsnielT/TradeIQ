import { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { DEFAULT_STUDIES } from '../../hooks/useTradingView.ts';
import { TickerInput } from './TickerInput.tsx';
import { TimeframePills } from './TimeframePills.tsx';
import { TradingViewWidget } from './TradingViewWidget.tsx';
import styles from './ChartPanel.module.css';

const CHART_TYPES = [
  { value: 'candlestick', label: 'Candles' },
  { value: 'line', label: 'Line' },
  { value: 'bar', label: 'Bars' },
] as const;

const INDICATORS = [
  { id: 'MASimple@tv-scriptwiz', label: 'MA' },
  { id: 'RSI@tv-scriptwiz', label: 'RSI' },
  { id: 'MACD@tv-scriptwiz', label: 'MACD' },
  { id: 'Volume@tv-scriptwiz', label: 'Vol' },
];

interface Props {
  lessonTitle?: string;
  moduleName?: string;
}

export function ChartPanel({ lessonTitle, moduleName }: Props) {
  const { state, dispatch } = useApp();
  const [activeStudies, setActiveStudies] = useState<string[]>(DEFAULT_STUDIES);

  function toggleIndicator(id: string) {
    setActiveStudies((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  return (
    <div className={styles.panel}>
      {/* Lesson banner — only shown when inside a lesson */}
      {lessonTitle && (
        <div className={styles.lessonBanner}>
          <span className={styles.lessonBannerTitle}>{lessonTitle}</span>
          {moduleName && (
            <span className={styles.lessonBannerModule}>{moduleName}</span>
          )}
        </div>
      )}

      {/* Control bar: ticker + timeframe + chart type */}
      <div className={styles.controlBar}>
        <TickerInput />
        <div className={styles.controlSep} aria-hidden="true" />
        <TimeframePills />
        <div className={styles.controlSep} aria-hidden="true" />
        <div
          className={styles.chartTypeGroup}
          role="group"
          aria-label="Chart type"
        >
          {CHART_TYPES.map((ct) => (
            <button
              key={ct.value}
              className={`${styles.chartTypeBtn}${state.chartType === ct.value ? ` ${styles.chartTypeBtnActive}` : ''}`}
              onClick={() =>
                dispatch({ type: 'SET_CHART_TYPE', chartType: ct.value })
              }
              aria-pressed={state.chartType === ct.value}
              aria-label={`${ct.label} chart type`}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* Indicator chip bar */}
      <div className={styles.indicatorBar} aria-label="Active indicators">
        <span className={styles.indLabel} aria-hidden="true">
          Indicators
        </span>
        {INDICATORS.map((ind) => (
          <button
            key={ind.id}
            className={`${styles.indChip}${activeStudies.includes(ind.id) ? ` ${styles.indChipActive}` : ''}`}
            onClick={() => toggleIndicator(ind.id)}
            aria-pressed={activeStudies.includes(ind.id)}
            aria-label={`Toggle ${ind.label} indicator`}
          >
            {ind.label}
          </button>
        ))}
      </div>

      {/* TradingView widget — fills remaining space */}
      <TradingViewWidget studies={activeStudies} />
    </div>
  );
}
