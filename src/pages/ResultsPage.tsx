import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';
import { curriculum } from '../data/curriculum.ts';
import { finalExam } from '../data/finalExam.ts';
import { QuizResults } from '../components/quiz/QuizResults.tsx';
import type { QuizAttempt, QuizQuestion } from '../types/index.ts';
import styles from './ResultsPage.module.css';

function findAttempt(progress: ReturnType<typeof useApp>['state']['progress'], id: string): QuizAttempt | null {
  for (const attempts of Object.values(progress.lessonQuizAttempts)) {
    const found = attempts.find((a) => a.id === id);
    if (found) return found;
  }
  for (const attempts of Object.values(progress.moduleQuizAttempts)) {
    const found = attempts.find((a) => a.id === id);
    if (found) return found;
  }
  return progress.finalExamAttempts.find((a) => a.id === id) ?? null;
}

function loadQuestionsForAttempt(attempt: QuizAttempt): QuizQuestion[] {
  if (attempt.quizType === 'lesson') {
    for (const mod of curriculum) {
      const lesson = mod.lessons.find((l) => l.id === attempt.quizRef);
      if (lesson) return lesson.quizQuestions;
    }
    return [];
  }
  if (attempt.quizType === 'module') {
    return curriculum.find((m) => m.id === attempt.quizRef)?.moduleQuizQuestions ?? [];
  }
  return finalExam;
}

export default function ResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { state } = useApp();
  const navigate = useNavigate();

  if (!attemptId) return <Navigate to="/curriculum" />;

  const attempt = findAttempt(state.progress, attemptId);

  if (!attempt) {
    return (
      <div className={styles.notFound}>
        <p>Results not found.</p>
        <button className={styles.backBtn} onClick={() => navigate('/curriculum')}>
          Back to Curriculum
        </button>
      </div>
    );
  }

  const questions = loadQuestionsForAttempt(attempt);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <QuizResults attempt={attempt} questions={questions} />
      </div>
    </div>
  );
}

function Navigate({ to }: { to: string }) {
  const navigate = useNavigate();
  navigate(to, { replace: true });
  return null;
}
