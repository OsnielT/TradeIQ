import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import styles from './TickerInput.module.css';

export function TickerInput() {
  const { state, dispatch } = useApp();
  const [value, setValue] = useState(state.ticker);

  // Sync when ticker changes externally (e.g. lesson start)
  useEffect(() => {
    setValue(state.ticker);
  }, [state.ticker]);

  function submit() {
    const trimmed = value.trim().toUpperCase();
    if (trimmed && trimmed !== state.ticker) {
      dispatch({ type: 'SET_TICKER', ticker: trimmed });
    } else if (!trimmed) {
      // Reset display to current ticker if cleared
      setValue(state.ticker);
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      role="search"
      aria-label="Ticker symbol"
    >
      <input
        className={styles.input}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={submit}
        placeholder="Symbol"
        aria-label="Enter ticker symbol"
        spellCheck={false}
        autoCapitalize="characters"
        autoComplete="off"
      />
      <button type="submit" className={styles.btn} aria-label="Load ticker">
        Go
      </button>
    </form>
  );
}
