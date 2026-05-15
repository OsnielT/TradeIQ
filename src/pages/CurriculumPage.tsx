import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';
import { curriculum } from '../data/curriculum.ts';
import type { LessonStatus, Lesson, Module, QuizAttempt } from '../types/index.ts';
import styles from './CurriculumPage.module.css';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isModuleUnlocked(moduleIndex: number, completedLessonIds: string[]): boolean {
  if (moduleIndex === 0) return true;
  const prev = curriculum[moduleIndex - 1];
  return prev.lessons.every((l) => completedLessonIds.includes(l.id));
}

function getLessonStatus(
  lesson: Lesson,
  lessonIndex: number,
  module: Module,
  moduleIndex: number,
  unlocked: boolean,
  completedLessonIds: string[],
  currentLessonId: string | null,
): LessonStatus {
  if (!unlocked) return 'locked';
  if (completedLessonIds.includes(lesson.id)) return 'complete';
  if (lesson.id === currentLessonId) return 'in_progress';
  if (lessonIndex === 0) return 'available';
  const prev = module.lessons[lessonIndex - 1];
  return completedLessonIds.includes(prev.id) ? 'available' : 'locked';
}

function getBestScore(attempts: QuizAttempt[] | undefined): number | null {
  if (!attempts || attempts.length === 0) return null;
  return Math.max(...attempts.map((a) => a.score));
}

function isAllModulesComplete(completedLessonIds: string[]): boolean {
  return curriculum.every((m) => m.lessons.every((l) => completedLessonIds.includes(l.id)));
}

const TOTAL_LESSONS = curriculum.reduce((n, m) => n + m.lessons.length, 0);

// ---------------------------------------------------------------------------
// Status dot
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: LessonStatus }) {
  const cls = {
    locked: styles.statusLocked,
    available: styles.statusAvailable,
    in_progress: styles.statusInProgress,
    complete: styles.statusComplete,
  }[status];
  return (
    <span
      className={`${styles.statusDot} ${cls}`}
      aria-label={status.replace('_', ' ')}
    />
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CurriculumPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { progress } = state;

  const completedCount = progress.completedLessonIds.length;
  const pct = TOTAL_LESSONS > 0 ? Math.round((completedCount / TOTAL_LESSONS) * 100) : 0;
  const allDone = isAllModulesComplete(progress.completedLessonIds);

  return (
    <div className={styles.page}>
      {/* ── Progress summary ── */}
      <div className={styles.progressSummary} aria-label="Overall progress">
        <div className={styles.progressStat}>
          <span className={styles.progressStatValue}>{pct}%</span>
          <span className={styles.progressStatLabel}>Complete</span>
        </div>

        <div className={styles.progressDivider} aria-hidden="true" />

        <div className={styles.progressStat}>
          <span className={styles.progressStatValue}>
            {completedCount}/{TOTAL_LESSONS}
          </span>
          <span className={styles.progressStatLabel}>Lessons</span>
        </div>

        <div className={styles.progressDivider} aria-hidden="true" />

        <div className={styles.progressStat}>
          <span className={styles.progressStatValue}>{progress.streakDays}</span>
          <span className={styles.progressStatLabel}>Day streak</span>
        </div>

        <div className={styles.progressDivider} aria-hidden="true" />

        <div className={styles.progressStat}>
          <span className={styles.progressStatValue} style={{ color: 'var(--gold)' }}>
            {progress.totalXP}
          </span>
          <span className={styles.progressStatLabel}>XP earned</span>
        </div>

        <div className={styles.progressBarWrapper}>
          <p className={styles.progressBarLabel}>
            {pct}% of course complete
          </p>
          <div className={styles.progressBar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* ── Module grid ── */}
      <div className={styles.moduleGrid}>
        {curriculum.map((mod, modIndex) => {
          const unlocked = isModuleUnlocked(modIndex, progress.completedLessonIds);
          const modCompleted = mod.lessons.filter((l) =>
            progress.completedLessonIds.includes(l.id),
          ).length;
          const modPct =
            mod.lessons.length > 0
              ? Math.round((modCompleted / mod.lessons.length) * 100)
              : 0;
          const moduleQuizAttempts = progress.moduleQuizAttempts[mod.id];
          const bestModScore = getBestScore(moduleQuizAttempts);
          const allModLessonsDone = mod.lessons.every((l) =>
            progress.completedLessonIds.includes(l.id),
          );

          return (
            <div
              key={mod.id}
              className={`${styles.moduleCard}${!unlocked ? ` ${styles.moduleCardLocked}` : ''}`}
            >
              {/* Card header */}
              <div
                className={styles.moduleCardHeader}
                style={{ borderLeftColor: mod.color }}
              >
                <div className={styles.moduleCardTitle}>
                  <span className={styles.moduleIcon} aria-hidden="true">
                    {mod.icon}
                  </span>
                  <div>
                    <div className={styles.moduleName}>{mod.title}</div>
                    <div className={styles.moduleDescription}>{mod.description}</div>
                  </div>
                </div>
                {!unlocked && (
                  <span className={styles.moduleLockBadge} aria-label="Module locked">
                    🔒 Locked
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className={styles.moduleProgress}>
                <div className={styles.moduleProgressLabel}>
                  <span>Lessons</span>
                  <span className={styles.moduleProgressCount}>
                    {modCompleted}/{mod.lessons.length}
                  </span>
                </div>
                <div className={styles.moduleProgressBar}>
                  <div
                    className={styles.moduleProgressFill}
                    style={{
                      width: `${modPct}%`,
                      backgroundColor: mod.color,
                    }}
                  />
                </div>
              </div>

              {/* Lesson list */}
              <ol className={styles.lessonList} aria-label={`${mod.title} lessons`}>
                {mod.lessons.map((lesson, lessonIndex) => {
                  const status = getLessonStatus(
                    lesson,
                    lessonIndex,
                    mod,
                    modIndex,
                    unlocked,
                    progress.completedLessonIds,
                    state.currentLessonId,
                  );
                  const isLocked = status === 'locked';
                  const lessonAttempts = progress.lessonQuizAttempts[lesson.id];
                  const bestLessonScore = getBestScore(lessonAttempts);

                  return (
                    <li key={lesson.id}>
                      <button
                        className={`${styles.lessonRow}${isLocked ? ` ${styles.lessonRowLocked}` : ''}`}
                        onClick={() =>
                          !isLocked &&
                          void navigate(`/learn/${mod.id}/${lesson.id}`)
                        }
                        disabled={isLocked}
                        aria-label={`${lesson.title}${isLocked ? ' (locked)' : ''}`}
                        tabIndex={isLocked ? -1 : 0}
                      >
                        <StatusDot status={status} />
                        <span
                          className={`${styles.lessonTitle}${isLocked ? ` ${styles.lessonTitleLocked}` : ''}`}
                        >
                          {lesson.title}
                        </span>
                        <span className={styles.lessonMeta}>
                          <span className={styles.lessonTime}>
                            {lesson.estimatedMinutes}m
                          </span>
                          {bestLessonScore !== null && (
                            <span
                              className={`${styles.quizBadge} ${bestLessonScore >= 70 ? styles.quizPass : styles.quizFail}`}
                            >
                              {bestLessonScore}%
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              {/* Module quiz footer */}
              <div className={styles.moduleFooter}>
                <span className={styles.moduleQuizLabel}>Module Quiz</span>
                {bestModScore !== null ? (
                  <span
                    className={`${styles.moduleQuizScore} ${bestModScore >= 70 ? styles.moduleQuizScorePass : styles.moduleQuizScoreFail}`}
                  >
                    Best: {bestModScore}%{bestModScore >= 70 ? ' ✓' : ''}
                  </span>
                ) : allModLessonsDone ? (
                  <button
                    className={styles.moduleQuizAction}
                    onClick={() => void navigate(`/quiz/module/${mod.id}`)}
                    aria-label={`Take ${mod.title} module quiz`}
                  >
                    Take Quiz →
                  </button>
                ) : (
                  <span className={styles.moduleQuizLabel} style={{ color: 'var(--border)' }}>
                    Complete all lessons first
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Final exam CTA ── */}
      <div className={`${styles.finalExam}${!allDone ? ` ${styles.finalExamLocked}` : ''}`}>
        <div className={styles.finalExamText}>
          <h2 className={styles.finalExamTitle}>Final Exam</h2>
          <p className={styles.finalExamDesc}>
            30 questions across all 6 modules. Pass threshold: 75%.
            {!allDone && ' Complete all 6 modules to unlock.'}
          </p>
        </div>
        <button
          className={`${styles.finalExamCta} ${allDone ? styles.finalExamCtaUnlocked : styles.finalExamCtaLocked}`}
          onClick={() => allDone && void navigate('/quiz/final')}
          disabled={!allDone}
          aria-label={allDone ? 'Start final exam' : 'Final exam locked'}
        >
          {allDone ? 'Start Final Exam →' : '🔒 Locked'}
        </button>
      </div>
    </div>
  );
}
