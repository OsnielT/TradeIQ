import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';
import { curriculum } from '../data/curriculum.ts';
import { ChartPanel } from '../components/chart/ChartPanel.tsx';
import styles from './LearnPage.module.css';

export default function LearnPage() {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const { state, dispatch } = useApp();

  useEffect(() => {
    if (!moduleId || !lessonId) return;

    const mod = curriculum.find((m) => m.id === moduleId);
    const lesson = mod?.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    dispatch({ type: 'SET_LESSON', moduleId, lessonId });
    dispatch({ type: 'SET_TICKER', ticker: lesson.suggestedTicker });
    dispatch({ type: 'SET_TIMEFRAME', timeframe: lesson.suggestedTimeframe });
  }, [moduleId, lessonId, dispatch]);

  const activeMod = moduleId ? curriculum.find((m) => m.id === moduleId) : null;
  const activeLesson = activeMod?.lessons.find((l) => l.id === lessonId) ?? null;

  return (
    <div className={styles.page}>
      {/* ── Chart panel (left) ── */}
      <ChartPanel
        lessonTitle={activeLesson?.title}
        moduleName={activeMod?.title}
      />

      {/* ── Tutor panel (right) ── */}
      <div className={styles.tutorPanel} aria-label="AI Tutor">
        <div className={styles.tutorHeader}>
          <div className={styles.tutorMeta}>
            <span className={styles.levelBadge}>{state.userLevel}</span>
          </div>
          <p className={styles.lessonTitle}>
            {activeLesson?.title ?? 'Free exploration'}
          </p>
        </div>

        <div
          className={styles.chatArea}
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          <div className={styles.tutorPlaceholder}>
            <span className={styles.tutorPlaceholderIcon} aria-hidden="true">🤖</span>
            <p className={styles.tutorPlaceholderText}>AI Tutor — coming next</p>
            <p className={styles.tutorPlaceholderHint}>
              Chat interface and streaming responses will be wired up in the next step.
            </p>
          </div>
        </div>

        <div className={styles.inputArea}>
          <textarea
            className={styles.inputPlaceholder}
            rows={2}
            placeholder="Ask the tutor anything about trading…"
            disabled
            aria-label="Message input (coming soon)"
          />
        </div>
      </div>
    </div>
  );
}
