import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { QuizAttempt, QuizQuestion } from '../../types/index.ts';
import { curriculum } from '../../data/curriculum.ts';
import styles from './QuizResults.module.css';

interface Props {
  attempt: QuizAttempt;
  questions: QuizQuestion[];
}

function getNextLesson(quizType: string, quizRef: string): { moduleId: string; lessonId: string } | null {
  if (quizType !== 'lesson') return null;

  for (let mi = 0; mi < curriculum.length; mi++) {
    const mod = curriculum[mi];
    const li = mod.lessons.findIndex((l) => l.id === quizRef);
    if (li === -1) continue;

    if (li + 1 < mod.lessons.length) {
      return { moduleId: mod.id, lessonId: mod.lessons[li + 1].id };
    }
    // Next module's first lesson
    if (mi + 1 < curriculum.length) {
      const nextMod = curriculum[mi + 1];
      return { moduleId: nextMod.id, lessonId: nextMod.lessons[0].id };
    }
    return null;
  }
  return null;
}

function getBestScore(attempt: QuizAttempt): number | null {
  // Pull all past attempts from localStorage to find the best score
  try {
    const raw = localStorage.getItem('tradeiq_progress');
    if (!raw) return null;
    const progress = JSON.parse(raw) as {
      lessonQuizAttempts?: Record<string, QuizAttempt[]>;
      moduleQuizAttempts?: Record<string, QuizAttempt[]>;
      finalExamAttempts?: QuizAttempt[];
    };

    let attempts: QuizAttempt[] = [];
    if (attempt.quizType === 'lesson') {
      attempts = progress.lessonQuizAttempts?.[attempt.quizRef] ?? [];
    } else if (attempt.quizType === 'module') {
      attempts = progress.moduleQuizAttempts?.[attempt.quizRef] ?? [];
    } else {
      attempts = progress.finalExamAttempts ?? [];
    }

    const scores = attempts.filter((a) => a.id !== attempt.id).map((a) => a.score);
    return scores.length > 0 ? Math.max(...scores) : null;
  } catch {
    return null;
  }
}

export function QuizResults({ attempt, questions }: Props) {
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const passed = attempt.passed;
  const scoreLabel = `${attempt.score}%`;
  const passThreshold = attempt.quizType === 'final' ? 75 : 70;
  const nextLesson = getNextLesson(attempt.quizType, attempt.quizRef);
  const bestScore = getBestScore(attempt);

  const xpEarned =
    !passed
      ? 0
      : attempt.quizType === 'final'
        ? 200
        : attempt.quizType === 'module'
          ? 50
          : attempt.score === 100
            ? 25
            : 15;

  function retryPath() {
    if (attempt.quizType === 'lesson') return `/quiz/lesson/${attempt.quizRef}`;
    if (attempt.quizType === 'module') return `/quiz/module/${attempt.quizRef}`;
    return '/quiz/final';
  }

  return (
    <div className={styles.results}>
      {/* Score hero */}
      <div className={styles.scoreHero}>
        <div className={`${styles.scoreDisplay} ${passed ? styles.scorePassed : styles.scoreFailed}`}>
          {scoreLabel}
        </div>
        <div className={styles.scoreFraction}>
          {attempt.answers.filter((a) => a.correct).length} / {questions.length} correct
          {' · '}pass ≥ {passThreshold}%
        </div>
        <span className={`${styles.badge} ${passed ? styles.badgePassed : styles.badgeFailed}`}>
          {passed ? 'Passed' : 'Failed'}
        </span>
        {xpEarned > 0 && (
          <span className={styles.xpNote}>+{xpEarned} XP earned</span>
        )}
        {bestScore !== null && (
          <span className={styles.bestScore}>Best previous: {bestScore}%</span>
        )}
      </div>

      {/* CTA buttons */}
      <div className={styles.actions}>
        {nextLesson && passed && (
          <button
            className={styles.btnPrimary}
            onClick={() => navigate(`/learn/${nextLesson.moduleId}/${nextLesson.lessonId}`)}
          >
            Next Lesson
          </button>
        )}
        {!passed && (
          <button
            className={styles.btnPrimary}
            onClick={() => navigate(retryPath())}
          >
            Retry Quiz
          </button>
        )}
        <button
          className={styles.btnSecondary}
          onClick={() => navigate('/curriculum')}
        >
          Curriculum
        </button>
        <button
          className={styles.btnSecondary}
          onClick={() => navigate('/learn')}
        >
          Back to Learn
        </button>
      </div>

      {/* Per-question breakdown */}
      <div className={styles.breakdown}>
        <p className={styles.breakdownTitle}>Question breakdown</p>
        {questions.map((q, i) => {
          const ans = attempt.answers.find((a) => a.questionId === q.id);
          const isOpen = expandedIndex === i;

          return (
            <div key={q.id} className={styles.questionRow}>
              <div
                className={styles.questionRowHeader}
                onClick={() => setExpandedIndex(isOpen ? null : i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setExpandedIndex(isOpen ? null : i)}
              >
                <span className={styles.qNumber}>Q{i + 1}</span>
                <span className={styles.qText}>{q.question}</span>
                <span className={ans?.correct ? styles.qCorrect : styles.qWrong}>
                  {ans?.correct ? '✓' : '✗'}
                </span>
              </div>

              {isOpen && (
                <div className={styles.questionDetail}>
                  {q.type === 'multiple_choice' && q.options && (
                    <>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Your answer</span>
                        <span className={styles.detailValue}>
                          {ans?.selectedIndex !== undefined
                            ? q.options[ans.selectedIndex]
                            : '—'}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Correct</span>
                        <span className={styles.detailValue}>
                          {q.correctIndex !== undefined ? q.options[q.correctIndex] : '—'}
                        </span>
                      </div>
                    </>
                  )}
                  {q.type === 'true_false' && (
                    <>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Your answer</span>
                        <span className={styles.detailValue}>
                          {ans?.selectedBoolean !== undefined
                            ? ans.selectedBoolean
                              ? 'True'
                              : 'False'
                            : '—'}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Correct</span>
                        <span className={styles.detailValue}>
                          {q.correctAnswer ? 'True' : 'False'}
                        </span>
                      </div>
                    </>
                  )}
                  {q.type === 'open_answer' && ans?.openText && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Your answer</span>
                      <span className={styles.detailValue}>{ans.openText}</span>
                    </div>
                  )}
                  {ans?.aiFeedback && (
                    <p className={styles.detailExplanation}>{ans.aiFeedback}</p>
                  )}
                  <p className={styles.detailExplanation}>{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
