import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.tsx';
import type { Lesson } from '../../types/index.ts';
import styles from './LessonProgress.module.css';

interface Props {
  lesson: Lesson;
  moduleId: string;
}

export function LessonProgress({ lesson, moduleId }: Props) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const { completedLessonIds } = state.progress;
  const isComplete = completedLessonIds.includes(lesson.id);

  // Count substantive assistant replies for this lesson
  const lessonMessages = state.messages.filter((m) => m.lessonId === lesson.id);
  const assistantReplies = lessonMessages.filter(
    (m) => m.role === 'assistant' && m.content.length > 40,
  ).length;

  const progressPct = Math.min((assistantReplies / 4) * 100, 100);
  const showMarkComplete = !isComplete && assistantReplies >= 2;

  function handleMarkComplete() {
    const updated = {
      ...state.progress,
      completedLessonIds: [...state.progress.completedLessonIds, lesson.id],
      totalXP: state.progress.totalXP + 10,
    };
    dispatch({ type: 'SET_PROGRESS', progress: updated });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.lessonName}>{lesson.title}</span>
        {isComplete && (
          <span className={styles.completeBadge} aria-label="Lesson complete">
            ✓ Complete
          </span>
        )}
      </div>

      <div
        className={styles.progressBar}
        role="progressbar"
        aria-valuenow={isComplete ? 100 : progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Lesson progress"
      >
        <div
          className={styles.progressFill}
          style={{ width: `${isComplete ? 100 : progressPct}%` }}
        />
      </div>

      <div className={styles.footer}>
        <span className={styles.exchangeCount}>
          {assistantReplies === 0
            ? 'Just getting started'
            : `${assistantReplies} exchange${assistantReplies === 1 ? '' : 's'}`}
        </span>

        {isComplete ? (
          <button
            className={styles.quizLink}
            onClick={() => void navigate(`/quiz/lesson/${lesson.id}`)}
            aria-label={`Take quiz for ${lesson.title}`}
          >
            Take Quiz →
          </button>
        ) : showMarkComplete ? (
          <button
            className={styles.markCompleteBtn}
            onClick={handleMarkComplete}
            aria-label={`Mark ${lesson.title} as complete`}
          >
            Mark Complete ✓
          </button>
        ) : null}
      </div>
    </div>
  );
}
