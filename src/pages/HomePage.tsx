import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';
import { isOnboarded, setOnboarded } from '../hooks/useProgress.ts';
import type { UserLevel } from '../types/index.ts';
import styles from './HomePage.module.css';

const LEVELS: { value: UserLevel; label: string; description: string }[] = [
  {
    value: 'beginner',
    label: 'Complete Beginner',
    description: "I've never traded or read a chart before",
  },
  {
    value: 'intermediate',
    label: 'Some Experience',
    description: 'I know basic concepts but want structured learning',
  },
  {
    value: 'advanced',
    label: "I've Traded Before",
    description: 'I want to deepen strategy, options, and risk management',
  },
];

export default function HomePage() {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<UserLevel>('beginner');

  if (isOnboarded()) {
    return <Navigate to="/learn" replace />;
  }

  function handleStart() {
    dispatch({ type: 'SET_USER_LEVEL', level: selected });
    setOnboarded(true);
    void navigate('/learn/module-1/how-markets-work');
  }

  function handleBrowse() {
    void navigate('/curriculum');
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <span className={styles.badge}>AI Trading Education</span>

        <h1 className={styles.title}>
          Learn to trade.
          <br />
          <span className={styles.accent}>On real charts.</span>
        </h1>

        <p className={styles.tagline}>
          TradeIQ pairs a live market chart with an AI tutor — 44 lessons across 6
          modules, structured quizzes, and real examples on the tickers you care about.
        </p>

        <div className={styles.levelSection}>
          <p className={styles.levelQuestion}>What&apos;s your experience level?</p>
          <div className={styles.levelGrid} role="radiogroup" aria-label="Experience level">
            {LEVELS.map((level) => (
              <button
                key={level.value}
                role="radio"
                aria-checked={selected === level.value}
                className={`${styles.levelCard}${selected === level.value ? ` ${styles.levelSelected}` : ''}`}
                onClick={() => setSelected(level.value)}
              >
                <span className={styles.levelLabel}>{level.label}</span>
                <span className={styles.levelDescription}>{level.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.ctaPrimary} onClick={handleStart}>
            Start Learning →
          </button>
          <button className={styles.ctaSecondary} onClick={handleBrowse}>
            Browse Curriculum
          </button>
        </div>

        <div className={styles.stats} aria-label="Course overview">
          <div className={styles.stat}>
            <span className={styles.statNum}>44</span>lessons
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.stat}>
            <span className={styles.statNum}>6</span>modules
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.stat}>
            <span className={styles.statNum}>AI</span>tutor included
          </div>
        </div>
      </div>
    </div>
  );
}
