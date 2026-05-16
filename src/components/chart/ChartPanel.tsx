import { useApp } from '../../context/AppContext.tsx';
import { TickerInput } from './TickerInput.tsx';
import { TimeframePills } from './TimeframePills.tsx';
import { TradingViewWidget } from './TradingViewWidget.tsx';
import styles from './ChartPanel.module.css';

const CHART_TYPES = [
  { value: 'candlestick', label: 'Candles' },
  { value: 'line', label: 'Line' },
  { value: 'bar', label: 'Bars' },
] as const;

interface Props {
  lessonTitle?: string;
  moduleName?: string;
}

export function ChartPanel({ lessonTitle, moduleName }: Props) {
  const { state, dispatch } = useApp();

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

      {/* Chart — fills remaining space */}
      <TradingViewWidget />
    </div>
  );
}
