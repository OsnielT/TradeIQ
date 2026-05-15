import styles from './ExplanationCard.module.css';

interface Props {
  explanation: string;
  correct: boolean;
  aiFeedback?: string;
  aiGraded?: boolean;
}

export function ExplanationCard({ explanation, correct, aiFeedback, aiGraded }: Props) {
  return (
    <div className={`${styles.card} ${correct ? styles.correct : styles.wrong}`}>
      <div className={styles.header}>
        <span className={`${styles.badge} ${correct ? styles.badgeCorrect : styles.badgeWrong}`}>
          {correct ? '✓ Correct' : '✗ Incorrect'}
        </span>
        {aiGraded && <span className={styles.gradingNote}>AI graded</span>}
      </div>
      {aiFeedback && <p className={styles.aiFeedback}>{aiFeedback}</p>}
      <p className={styles.explanation}>{explanation}</p>
    </div>
  );
}
