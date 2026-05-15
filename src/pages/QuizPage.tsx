import { useMemo, useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';
import { curriculum } from '../data/curriculum.ts';
import { finalExam } from '../data/finalExam.ts';
import { useQuiz } from '../hooks/useQuiz.ts';
import { QuizProgress } from '../components/quiz/QuizProgress.tsx';
import { QuizCard } from '../components/quiz/QuizCard.tsx';
import styles from './QuizPage.module.css';

export default function QuizPage() {
  const { lessonId, moduleId } = useParams<{ lessonId?: string; moduleId?: string }>();
  const { state } = useApp();
  const navigate = useNavigate();
  const { completedLessonIds, userLevel } = state.progress;

  // ── Guards ──────────────────────────────────────────────────────────────

  if (lessonId !== undefined) {
    if (!completedLessonIds.includes(lessonId)) {
      return <Navigate to="/curriculum" replace />;
    }
  }

  if (moduleId !== undefined) {
    const mod = curriculum.find((m) => m.id === moduleId);
    const allDone = mod?.lessons.every((l) => completedLessonIds.includes(l.id)) ?? false;
    if (!allDone) return <Navigate to="/curriculum" replace />;
  }

  if (lessonId === undefined && moduleId === undefined) {
    const allDone = curriculum.every((m) =>
      m.lessons.every((l) => completedLessonIds.includes(l.id)),
    );
    if (!allDone) return <Navigate to="/curriculum" replace />;
  }

  // ── Resolve quiz metadata ────────────────────────────────────────────────

  const quizType = lessonId ? 'lesson' : moduleId ? 'module' : 'final';
  const quizRef = lessonId ?? moduleId ?? 'final';

  const title = lessonId
    ? (() => {
        for (const mod of curriculum) {
          const lesson = mod.lessons.find((l) => l.id === lessonId);
          if (lesson) return `${lesson.title} — Lesson Quiz`;
        }
        return 'Lesson Quiz';
      })()
    : moduleId
      ? `${curriculum.find((m) => m.id === moduleId)?.title ?? moduleId} — Module Quiz`
      : 'Final Exam';

  // ── Questions ────────────────────────────────────────────────────────────

  const allQuestions = useMemo(() => {
    if (lessonId) {
      for (const mod of curriculum) {
        const lesson = mod.lessons.find((l) => l.id === lessonId);
        if (lesson) return lesson.quizQuestions;
      }
      return [];
    }
    if (moduleId) {
      return curriculum.find((m) => m.id === moduleId)?.moduleQuizQuestions ?? [];
    }
    return finalExam;
  }, [lessonId, moduleId]);

  // Beginners skip open_answer questions
  const questions = useMemo(
    () =>
      userLevel === 'beginner'
        ? allQuestions.filter((q) => q.type !== 'open_answer')
        : allQuestions,
    [allQuestions, userLevel],
  );

  // ── Quiz hook ────────────────────────────────────────────────────────────

  const {
    phase,
    currentQuestion,
    currentAnswer,
    currentIndex,
    totalQuestions,
    answers,
    isGrading,
    isLastQuestion,
    attemptId,
    correctCount,
    submitAnswer,
    nextQuestion,
  } = useQuiz(questions, quizType, quizRef);

  // Navigate to results when quiz completes
  useEffect(() => {
    if (phase === 'completed' && attemptId) {
      navigate(`/results/${attemptId}`, { replace: true });
    }
  }, [phase, attemptId, navigate]);

  if (!currentQuestion) {
    return (
      <div className={styles.empty}>
        <p>No questions available for this quiz.</p>
        <button className={styles.backBtn} onClick={() => navigate('/curriculum')}>
          Back to Curriculum
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <QuizProgress
          title={title}
          current={currentIndex + 1}
          total={totalQuestions}
          correctCount={correctCount}
          answeredCount={answers.length}
        />

        <QuizCard
          question={currentQuestion}
          phase={phase}
          answer={currentAnswer}
          isGrading={isGrading}
          onSubmit={submitAnswer}
        />

        {phase === 'reviewing' && (
          <div className={styles.nextRow}>
            <button className={styles.nextBtn} onClick={nextQuestion}>
              {isLastQuestion ? 'See Results' : 'Next Question →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
