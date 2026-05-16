import { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useTutor } from '../../hooks/useTutor.ts';
import type { Lesson, Module } from '../../types/index.ts';
import { ChatMessages } from './ChatMessages.tsx';
import { ChatInput } from './ChatInput.tsx';
import { QuickActions } from './QuickActions.tsx';
import { LessonProgress } from './LessonProgress.tsx';
import styles from './TutorPanel.module.css';

interface Props {
  activeLesson: Lesson | null;
  activeMod: Module | null;
}

const HAS_API_KEY = Boolean(import.meta.env.VITE_HF_TOKEN);

export function TutorPanel({ activeLesson, activeMod }: Props) {
  const { state } = useApp();
  const { sendMessage } = useTutor();

  // Auto-send lesson intro once per lesson, per session, unless messages exist
  const introSentRef = useRef(new Set<string>());

  useEffect(() => {
    if (!activeLesson || state.isLoading) return;
    if (introSentRef.current.has(activeLesson.id)) return;

    const hasMessages = state.messages.some((m) => m.lessonId === activeLesson.id);
    introSentRef.current.add(activeLesson.id); // mark before async send

    if (!hasMessages) {
      void sendMessage('Begin the lesson.', activeLesson);
    }
    // Only re-run when the lesson itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLesson?.id]);

  function handleSend(text: string) {
    void sendMessage(text, activeLesson ?? undefined);
  }

  const headerTitle = activeLesson?.title ?? 'Free exploration';

  return (
    <div className={styles.panel} aria-label="AI Tutor">
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerMeta}>
          <span className={styles.levelBadge} aria-label={`Level: ${state.userLevel}`}>
            {state.userLevel}
          </span>
          <span className={styles.headerTitle}>{headerTitle}</span>
        </div>
      </div>

      {/* ── API key missing banner ── */}
      {!HAS_API_KEY && (
        <div className={styles.apiKeyBanner} role="alert">
          <p className={styles.apiKeyBannerText}>
            Add your HuggingFace token to{' '}
            <code className={styles.apiKeyBannerCode}>.env</code> as{' '}
            <code className={styles.apiKeyBannerCode}>VITE_HF_TOKEN</code> to enable the
            AI tutor. Get a free token at huggingface.co/settings/tokens — enable
            the &ldquo;Make calls to Inference Providers&rdquo; permission.
          </p>
        </div>
      )}

      {/* ── Lesson progress (only in lesson mode) ── */}
      {activeLesson && activeMod && (
        <LessonProgress lesson={activeLesson} moduleId={activeMod.id} />
      )}

      {/* ── Scrollable chat area ── */}
      <ChatMessages messages={state.messages} isLoading={state.isLoading} />

      {/* ── Quick action buttons ── */}
      <QuickActions onSend={handleSend} disabled={state.isLoading || !HAS_API_KEY} />

      {/* ── Text input ── */}
      <ChatInput onSend={handleSend} disabled={state.isLoading || !HAS_API_KEY} />
    </div>
  );
}
