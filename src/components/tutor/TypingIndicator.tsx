import styles from './TypingIndicator.module.css';

export function TypingIndicator() {
  return (
    <div className={styles.indicator} aria-label="Tutor is typing" role="status">
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.dot} aria-hidden="true" />
    </div>
  );
}
