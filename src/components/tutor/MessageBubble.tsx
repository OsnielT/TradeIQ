import { Fragment } from 'react';
import type { Message } from '../../types/index.ts';
import styles from './MessageBubble.module.css';

// ---------------------------------------------------------------------------
// Inline markdown: **bold** only — matches the spec's tutor behavior rules
// ---------------------------------------------------------------------------

function parseInline(text: string): (string | JSX.Element)[] {
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderContent(content: string): JSX.Element {
  const lines = content.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {parseInline(line)}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`${styles.bubble} ${isUser ? styles.user : styles.assistant}`}>
      {isUser ? (
        <div className={styles.userContent}>{message.content}</div>
      ) : (
        <div className={styles.assistantContent}>
          {renderContent(message.content)}
          {isStreaming && <span className={styles.cursor} aria-hidden="true" />}
        </div>
      )}
    </div>
  );
}
