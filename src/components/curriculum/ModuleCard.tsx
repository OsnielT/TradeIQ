import { useNavigate } from 'react-router-dom';
import type { Module, LessonStatus, QuizAttempt } from '../../types/index.ts';
import { LessonRow } from './LessonRow.tsx';
import styles from './ModuleCard.module.css';

interface LessonMeta {
  status: LessonStatus;
  bestQuizScore: number | null;
}

interface Props {
  mod: Module;
  unlocked: boolean;
  currentLessonId: string | null;
  completedLessonIds: string[];
  lessonQuizAttempts: Record<string, QuizAttempt[]>;
  moduleQuizAttempts: QuizAttempt[] | undefined;
}

function getBestScore(attempts: QuizAttempt[] | undefined): number | null {
  if (!attempts || attempts.length === 0) return null;
  return Math.max(...attempts.map((a) => a.score));
}

function getLessonMeta(
  lessonId: string,
  lessonIndex: number,
  mod: Module,
  unlocked: boolean,
  completedLessonIds: string[],
  currentLessonId: string | null,
  lessonQuizAttempts: Record<string, QuizAttempt[]>,
): LessonMeta {
  let status: LessonStatus;
  if (!unlocked) {
    status = 'locked';
  } else if (completedLessonIds.includes(lessonId)) {
    status = 'complete';
  } else if (lessonId === currentLessonId) {
    status = 'in_progress';
  } else if (lessonIndex === 0) {
    status = 'available';
  } else {
    const prevId = mod.lessons[lessonIndex - 1].id;
    status = completedLessonIds.includes(prevId) ? 'available' : 'locked';
  }

  return {
    status,
    bestQuizScore: getBestScore(lessonQuizAttempts[lessonId]),
  };
}

export function ModuleCard({
  mod,
  unlocked,
  currentLessonId,
  completedLessonIds,
  lessonQuizAttempts,
  moduleQuizAttempts,
}: Props) {
  const navigate = useNavigate();

  const completedCount = mod.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const pct = mod.lessons.length > 0 ? Math.round((completedCount / mod.lessons.length) * 100) : 0;
  const allLessonsDone = completedCount === mod.lessons.length;
  const bestModScore = getBestScore(moduleQuizAttempts);
  const modPassed = bestModScore !== null && bestModScore >= 70;

  return (
    <div className={`${styles.card} ${!unlocked ? styles.cardLocked : ''}`}>
      {/* Header */}
      <div className={styles.header} style={{ borderLeftColor: mod.color }}>
        <div className={styles.headerLeft}>
          <span className={styles.icon} aria-hidden="true">{mod.icon}</span>
          <div>
            <div className={styles.title}>{mod.title}</div>
            <div className={styles.description}>{mod.description}</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          {!unlocked ? (
            <span className={styles.lockBadge}>Locked</span>
          ) : allLessonsDone && modPassed ? (
            <span className={styles.completeBadge}>✓ Passed</span>
          ) : allLessonsDone ? (
            <span className={styles.doneBadge}>All done</span>
          ) : null}
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressMeta}>
          <span className={styles.progressMetaLabel}>Lessons</span>
          <span className={styles.progressMetaCount}>
            {completedCount}/{mod.lessons.length}
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${pct}%`, backgroundColor: mod.color }}
          />
        </div>
      </div>

      {/* Lesson list */}
      <ol className={styles.lessonList} aria-label={`${mod.title} lessons`}>
        {mod.lessons.map((lesson, i) => {
          const { status, bestQuizScore } = getLessonMeta(
            lesson.id,
            i,
            mod,
            unlocked,
            completedLessonIds,
            currentLessonId,
            lessonQuizAttempts,
          );
          return (
            <LessonRow
              key={lesson.id}
              title={lesson.title}
              estimatedMinutes={lesson.estimatedMinutes}
              status={status}
              bestQuizScore={bestQuizScore}
              onNavigate={() => void navigate(`/learn/${mod.id}/${lesson.id}`)}
            />
          );
        })}
      </ol>

      {/* Module quiz footer */}
      <div className={styles.footer}>
        <span className={styles.footerLabel}>Module Quiz</span>
        {bestModScore !== null ? (
          <div className={styles.footerScore}>
            <span className={modPassed ? styles.scorePass : styles.scoreWarn}>
              Best: {bestModScore}%{modPassed ? ' ✓' : ''}
            </span>
            <button
              className={styles.retakeBtn}
              onClick={() => void navigate(`/quiz/module/${mod.id}`)}
            >
              Retake
            </button>
          </div>
        ) : allLessonsDone ? (
          <button
            className={styles.quizBtn}
            onClick={() => void navigate(`/quiz/module/${mod.id}`)}
          >
            Take Quiz →
          </button>
        ) : (
          <span className={styles.footerHint}>Complete all lessons to unlock</span>
        )}
      </div>
    </div>
  );
}
