import type { LessonStatus } from '../../types/index.ts';
import styles from './LessonRow.module.css';

interface Props {
  title: string;
  estimatedMinutes: number;
  status: LessonStatus;
  bestQuizScore: number | null;
  onNavigate: () => void;
}

const STATUS_ICON: Record<LessonStatus, string> = {
  locked: '○',
  available: '○',
  in_progress: '◑',
  complete: '✓',
};

export function LessonRow({ title, estimatedMinutes, status, bestQuizScore, onNavigate }: Props) {
  const isLocked = status === 'locked';

  const actionLabel =
    status === 'complete'
      ? 'Review'
      : status === 'in_progress'
        ? 'Continue →'
        : 'Start →';

  return (
    <li className={`${styles.row} ${isLocked ? styles.rowLocked : ''}`}>
      <span
        className={`${styles.icon} ${styles[`icon_${status}`]}`}
        aria-hidden="true"
      >
        {STATUS_ICON[status]}
      </span>

      <span className={`${styles.title} ${isLocked ? styles.titleLocked : ''}`}>
        {title}
      </span>

      <span className={styles.meta}>
        <span className={styles.time}>{estimatedMinutes}m</span>
        {bestQuizScore !== null && (
          <span
            className={`${styles.quizBadge} ${bestQuizScore >= 70 ? styles.quizPass : styles.quizWarn}`}
          >
            {bestQuizScore}%
          </span>
        )}
      </span>

      {!isLocked && (
        <button
          className={`${styles.action} ${status === 'complete' ? styles.actionReview : styles.actionGo}`}
          onClick={onNavigate}
          aria-label={`${actionLabel} ${title}`}
        >
          {actionLabel}
        </button>
      )}
    </li>
  );
}
