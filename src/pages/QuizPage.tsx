import { Navigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';
import { curriculum } from '../data/curriculum.ts';

// Guard: redirect to /curriculum if the quiz is not yet unlocked.

export default function QuizPage() {
  const { lessonId, moduleId } = useParams<{ lessonId?: string; moduleId?: string }>();
  const { state } = useApp();
  const { completedLessonIds } = state.progress;

  // Lesson quiz guard
  if (lessonId !== undefined) {
    if (!completedLessonIds.includes(lessonId)) {
      return <Navigate to="/curriculum" replace />;
    }
  }

  // Module quiz guard
  if (moduleId !== undefined) {
    const mod = curriculum.find((m) => m.id === moduleId);
    const allDone = mod?.lessons.every((l) => completedLessonIds.includes(l.id)) ?? false;
    if (!allDone) {
      return <Navigate to="/curriculum" replace />;
    }
  }

  // Final exam guard (no route param — path is /quiz/final)
  if (lessonId === undefined && moduleId === undefined) {
    const allDone = curriculum.every((m) =>
      m.lessons.every((l) => completedLessonIds.includes(l.id)),
    );
    if (!allDone) {
      return <Navigate to="/curriculum" replace />;
    }
  }

  const quizLabel = lessonId
    ? 'Lesson Quiz'
    : moduleId
      ? `Module Quiz — ${curriculum.find((m) => m.id === moduleId)?.title ?? moduleId}`
      : 'Final Exam';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '12px',
        color: 'var(--muted)',
        padding: '40px',
      }}
    >
      <span style={{ fontSize: '40px' }}>📝</span>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
        {quizLabel}
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
        Quiz interface coming in the next step.
      </p>
    </div>
  );
}
