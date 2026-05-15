import { useApp } from '../../context/AppContext.tsx';
import type { Timeframe } from '../../types/index.ts';
import styles from './TimeframePills.module.css';

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'];

export function TimeframePills() {
  const { state, dispatch } = useApp();

  return (
    <div className={styles.group} role="group" aria-label="Timeframe">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          className={`${styles.pill}${state.timeframe === tf ? ` ${styles.active}` : ''}`}
          onClick={() => dispatch({ type: 'SET_TIMEFRAME', timeframe: tf })}
          aria-pressed={state.timeframe === tf}
          aria-label={`${tf} timeframe`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
