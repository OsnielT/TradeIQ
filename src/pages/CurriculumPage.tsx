import { useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { curriculum } from '../data/curriculum.ts';
import { ProgressSummary } from '../components/curriculum/ProgressSummary.tsx';
import { CurriculumGrid } from '../components/curriculum/CurriculumGrid.tsx';
import styles from './CurriculumPage.module.css';

const TOTAL_LESSONS = curriculum.reduce((n, m) => n + m.lessons.length, 0);

export default function CurriculumPage() {
  const { state } = useApp();
  const { progress } = state;

  // Compute overall quiz pass rate across all lesson quiz attempts
  const quizPassRate = useMemo(() => {
    const allAttempts = Object.values(progress.lessonQuizAttempts).flat();
    if (allAttempts.length === 0) return null;
    // Best score per lesson to avoid penalising retries
    const bestPerLesson = Object.values(progress.lessonQuizAttempts).map((attempts) =>
      Math.max(...attempts.map((a) => a.score)),
    );
    return Math.round(bestPerLesson.reduce((s, v) => s + v, 0) / bestPerLesson.length);
  }, [progress.lessonQuizAttempts]);

  return (
    <div className={styles.page}>
      <ProgressSummary
        completedLessons={progress.completedLessonIds.length}
        totalLessons={TOTAL_LESSONS}
        streakDays={progress.streakDays}
        totalXP={progress.totalXP}
        quizPassRate={quizPassRate}
      />
      <CurriculumGrid
        progress={progress}
        currentLessonId={state.currentLessonId}
      />
    </div>
  );
}
