import { useEffect, useRef } from 'react';
import type { Message } from '../../types/index.ts';
import { MessageBubble } from './MessageBubble.tsx';
import { TypingIndicator } from './TypingIndicator.tsx';
import styles from './ChatMessages.module.css';

interface Props {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: Props) {
  const anchorRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on every new token or message
  useEffect(() => {
    anchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const lastMsg = messages[messages.length - 1];
  // Show the blinking cursor on the last assistant message while it streams in
  const isLastStreaming =
    isLoading && lastMsg?.role === 'assistant' && lastMsg.content.length > 0;
  // Show the dots indicator while waiting for the first token
  const showDots =
    isLoading && (!lastMsg || lastMsg.role === 'user' || lastMsg.content.length === 0);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className={styles.list} role="log" aria-live="polite" aria-label="Chat messages">
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">💬</span>
          <p className={styles.emptyTitle}>Ask me anything about trading</p>
          <p className={styles.emptyHint}>
            I can explain charts, concepts, and trade setups — all anchored to what
            you&apos;re looking at right now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.list}
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
      aria-relevant="additions"
    >
      {messages.map((msg, i) => {
        const streaming = isLastStreaming && i === messages.length - 1;
        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            isStreaming={streaming}
          />
        );
      })}

      {showDots && <TypingIndicator />}

      <div ref={anchorRef} className={styles.anchor} aria-hidden="true" />
    </div>
  );
}
