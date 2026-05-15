import styles from './QuizProgress.module.css';

interface Props {
  title: string;
  current: number;
  total: number;
  correctCount: number;
  answeredCount: number;
}

export function QuizProgress({ title, current, total, correctCount, answeredCount }: Props) {
  const scoreGood = answeredCount > 0 && correctCount / answeredCount >= 0.7;
  const progressPct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div>
      <div className={styles.bar}>
        <span className={styles.title}>{title}</span>
        <span className={styles.counter}>
          <span className={styles.counterCurrent}>{current}</span>/{total}
        </span>
        {answeredCount > 0 && (
          <span className={`${styles.score} ${scoreGood ? styles.scoreGood : styles.scoreNeutral}`}>
            {correctCount}/{answeredCount}
          </span>
        )}
      </div>
      <div className={styles.progressBarWrap}>
        <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  );
}
