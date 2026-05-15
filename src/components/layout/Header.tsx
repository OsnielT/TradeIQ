import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext.tsx';
import type { Timeframe, UserLevel } from '../../types/index.ts';
import styles from './Header.module.css';

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'];

const LEVELS: { value: UserLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export function Header() {
  const { state, dispatch } = useApp();
  const [tickerInput, setTickerInput] = useState(state.ticker);

  useEffect(() => {
    setTickerInput(state.ticker);
  }, [state.ticker]);

  function submitTicker() {
    const val = tickerInput.trim().toUpperCase();
    if (val && val !== state.ticker) {
      dispatch({ type: 'SET_TICKER', ticker: val });
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/" className={styles.logo}>
          TradeIQ
        </Link>
        <nav className={styles.nav} aria-label="Main navigation">
          <NavLink
            to="/learn"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            Learn
          </NavLink>
          <NavLink
            to="/curriculum"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            Curriculum
          </NavLink>
        </nav>
      </div>

      <div className={styles.controls}>
        <input
          className={styles.tickerInput}
          type="text"
          value={tickerInput}
          onChange={(e) => setTickerInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitTicker()}
          onBlur={submitTicker}
          aria-label="Ticker symbol"
          spellCheck={false}
          autoCapitalize="characters"
        />

        <div className={styles.timeframes} role="group" aria-label="Timeframe">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              className={`${styles.tfPill}${state.timeframe === tf ? ` ${styles.tfActive}` : ''}`}
              onClick={() => dispatch({ type: 'SET_TIMEFRAME', timeframe: tf })}
              aria-pressed={state.timeframe === tf}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.right}>
        <select
          className={styles.levelSelect}
          value={state.userLevel}
          onChange={(e) =>
            dispatch({ type: 'SET_USER_LEVEL', level: e.target.value as UserLevel })
          }
          aria-label="User level"
        >
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>

        <div className={styles.xp} title={`${state.progress.totalXP} XP earned`}>
          <span className={styles.xpValue}>{state.progress.totalXP}</span>
          <span className={styles.xpLabel}>XP</span>
        </div>
      </div>
    </header>
  );
}
