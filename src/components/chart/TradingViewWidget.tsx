import { useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useTradingView } from '../../hooks/useTradingView.ts';
import styles from './TradingViewWidget.module.css';

interface Props {
  studies: string[];
}

export function TradingViewWidget({ studies }: Props) {
  const { state } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);

  const { hasError } = useTradingView(
    containerRef,
    state.ticker,
    state.timeframe,
    state.chartType,
    studies,
  );

  if (hasError) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.error}>
          <span className={styles.errorIcon} aria-hidden="true">📡</span>
          <p className={styles.errorText}>Chart unavailable</p>
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
      <div ref={containerRef} className={styles.container} />
    </div>
  );
}
