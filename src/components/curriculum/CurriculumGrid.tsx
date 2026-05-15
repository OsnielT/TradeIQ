import { useNavigate } from 'react-router-dom';
import type { UserProgress } from '../../types/index.ts';
import { curriculum } from '../../data/curriculum.ts';
import { ModuleCard } from './ModuleCard.tsx';
import styles from './CurriculumGrid.module.css';

// Module 6 (Psychology & Risk) unlocks after Module 3 (Swing Trading) is complete,
// not after Module 5 — per product spec open issue.
const MODULE_6_PREREQUISITE = 'module-3';

function isModuleUnlocked(moduleId: string, moduleIndex: number, completedLessonIds: string[]): boolean {
  if (moduleIndex === 0) return true;

  // Special unlock rule for module-6
  if (moduleId === 'module-6') {
    const prereq = curriculum.find((m) => m.id === MODULE_6_PREREQUISITE);
    return prereq?.lessons.every((l) => completedLessonIds.includes(l.id)) ?? false;
  }

  // All others require the previous module to be fully complete
  const prev = curriculum[moduleIndex - 1];
  return prev.lessons.every((l) => completedLessonIds.includes(l.id));
}

function getFinalExamAttemptsBestScore(progress: UserProgress): number | null {
  const attempts = progress.finalExamAttempts;
  if (!attempts || attempts.length === 0) return null;
  return Math.max(...attempts.map((a) => a.score));
}

interface Props {
  progress: UserProgress;
  currentLessonId: string | null;
}

export function CurriculumGrid({ progress, currentLessonId }: Props) {
  const navigate = useNavigate();
  const { completedLessonIds } = progress;

  const allModulesComplete = curriculum.every((m) =>
    m.lessons.every((l) => completedLessonIds.includes(l.id)),
  );

  const bestFinalScore = getFinalExamAttemptsBestScore(progress);
  const finalPassed = bestFinalScore !== null && bestFinalScore >= 75;

  return (
    <div className={styles.root}>
      <div className={styles.grid}>
        {curriculum.map((mod, i) => (
          <ModuleCard
            key={mod.id}
            mod={mod}
            unlocked={isModuleUnlocked(mod.id, i, completedLessonIds)}
            currentLessonId={currentLessonId}
            completedLessonIds={completedLessonIds}
            lessonQuizAttempts={progress.lessonQuizAttempts}
            moduleQuizAttempts={progress.moduleQuizAttempts[mod.id]}
          />
        ))}
      </div>

      {/* Final Exam CTA */}
      <div className={`${styles.finalExam} ${!allModulesComplete ? styles.finalExamLocked : ''}`}>
        <div className={styles.finalLeft}>
          <span className={styles.finalIcon}>🎓</span>
          <div>
            <div className={styles.finalTitle}>Final Exam</div>
            <div className={styles.finalDesc}>
              {allModulesComplete
                ? 'All 6 modules complete — you\'re ready. Pass threshold: 75%.'
                : 'Complete all 6 modules to unlock. Pass threshold: 75%.'}
            </div>
          </div>
        </div>

        <div className={styles.finalRight}>
          {bestFinalScore !== null && (
            <span className={`${styles.finalScore} ${finalPassed ? styles.finalScorePass : styles.finalScoreWarn}`}>
              Best: {bestFinalScore}%{finalPassed ? ' ✓' : ''}
            </span>
          )}
          <button
            className={`${styles.finalBtn} ${allModulesComplete ? styles.finalBtnActive : styles.finalBtnDisabled}`}
            onClick={() => allModulesComplete && void navigate('/quiz/final')}
            disabled={!allModulesComplete}
            aria-label={allModulesComplete ? 'Start final exam' : 'Final exam locked — complete all modules first'}
          >
            {allModulesComplete
              ? bestFinalScore !== null
                ? 'Retake Final →'
                : 'Start Final Exam →'
              : 'Locked'}
          </button>
        </div>
      </div>
    </div>
  );
}
