import styles from './ProgressSummary.module.css';

interface Props {
  completedLessons: number;
  totalLessons: number;
  streakDays: number;
  totalXP: number;
  quizPassRate: number | null; // null if no quizzes taken yet
}

export function ProgressSummary({
  completedLessons,
  totalLessons,
  streakDays,
  totalXP,
  quizPassRate,
}: Props) {
  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className={styles.summary} aria-label="Overall progress">
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{pct}%</span>
          <span className={styles.statLabel}>Complete</span>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.stat}>
          <span className={styles.statValue}>
            {completedLessons}
            <span className={styles.statDenom}>/{totalLessons}</span>
          </span>
          <span className={styles.statLabel}>Lessons</span>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.stat}>
          <span className={styles.statValue}>
            {streakDays}
            {streakDays > 0 && <span className={styles.streak}> 🔥</span>}
          </span>
          <span className={styles.statLabel}>Day streak</span>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.stat}>
          <span className={`${styles.statValue} ${styles.xp}`}>{totalXP}</span>
          <span className={styles.statLabel}>XP earned</span>
        </div>

        {quizPassRate !== null && (
          <>
            <div className={styles.divider} aria-hidden="true" />
            <div className={styles.stat}>
              <span
                className={`${styles.statValue} ${quizPassRate >= 70 ? styles.passGood : styles.passLow}`}
              >
                {quizPassRate}%
              </span>
              <span className={styles.statLabel}>Quiz avg</span>
            </div>
          </>
        )}
      </div>

      <div className={styles.barSection}>
        <span className={styles.barLabel}>{pct}% of course complete</span>
        <div
          className={styles.bar}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={styles.barFill} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
