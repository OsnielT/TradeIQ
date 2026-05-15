import { Link, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext.tsx';
import type { UserLevel } from '../../types/index.ts';
import styles from './Header.module.css';

const LEVELS: { value: UserLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export function Header() {
  const { state, dispatch } = useApp();

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
