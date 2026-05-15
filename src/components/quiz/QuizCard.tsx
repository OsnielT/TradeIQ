import { useState, useEffect } from 'react';
import type { QuizQuestion, QuizAnswer } from '../../types/index.ts';
import type { QuizPhase, PartialAnswer } from '../../hooks/useQuiz.ts';
import { AnswerOption } from './AnswerOption.tsx';
import { ExplanationCard } from './ExplanationCard.tsx';
import styles from './QuizCard.module.css';

const LETTERS = ['A', 'B', 'C', 'D'];

interface Props {
  question: QuizQuestion;
  phase: QuizPhase;
  answer: QuizAnswer | null;
  isGrading: boolean;
  onSubmit: (partial: PartialAnswer) => void;
}

export function QuizCard({ question, phase, answer, isGrading, onSubmit }: Props) {
  const [openText, setOpenText] = useState('');

  // Reset textarea when question changes
  useEffect(() => {
    setOpenText('');
  }, [question.id]);

  const isReviewing = phase === 'reviewing';

  function handleMcClick(index: number) {
    if (phase !== 'answering') return;
    onSubmit({ questionId: question.id, selectedIndex: index });
  }

  function handleTfClick(value: boolean) {
    if (phase !== 'answering') return;
    onSubmit({ questionId: question.id, selectedBoolean: value });
  }

  function handleOpenSubmit() {
    if (phase !== 'answering' || !openText.trim()) return;
    onSubmit({ questionId: question.id, openText: openText.trim() });
  }

  return (
    <div className={styles.card}>
      <p className={styles.questionType}>
        {question.type === 'multiple_choice'
          ? 'Multiple choice'
          : question.type === 'true_false'
            ? 'True / False'
            : 'Open answer'}
      </p>
      <p className={styles.question}>{question.question}</p>

      {question.type === 'multiple_choice' && question.options && (
        <div className={styles.mcGrid}>
          {question.options.map((opt, i) => {
            const isCorrect = isReviewing && i === question.correctIndex;
            const isWrong =
              isReviewing && answer?.selectedIndex === i && i !== question.correctIndex;
            const isDimmed =
              isReviewing && i !== question.correctIndex && answer?.selectedIndex !== i;
            return (
              <AnswerOption
                key={i}
                label={opt}
                letter={LETTERS[i]}
                isCorrect={isCorrect}
                isWrong={isWrong}
                isDimmed={isDimmed}
                onClick={() => handleMcClick(i)}
                disabled={phase !== 'answering'}
              />
            );
          })}
        </div>
      )}

      {question.type === 'true_false' && (
        <div className={styles.tfGrid}>
          {([true, false] as const).map((val) => {
            const label = val ? 'True' : 'False';
            const isCorrect = isReviewing && val === question.correctAnswer;
            const isWrong =
              isReviewing && answer?.selectedBoolean === val && val !== question.correctAnswer;
            const isDimmed =
              isReviewing && val !== question.correctAnswer && answer?.selectedBoolean !== val;
            return (
              <AnswerOption
                key={label}
                label={label}
                isCorrect={isCorrect}
                isWrong={isWrong}
                isDimmed={isDimmed}
                onClick={() => handleTfClick(val)}
                disabled={phase !== 'answering'}
                isTf
              />
            );
          })}
        </div>
      )}

      {question.type === 'open_answer' && (
        <div className={styles.openArea}>
          <textarea
            className={styles.openTextarea}
            placeholder="Type your answer…"
            value={openText}
            onChange={(e) => setOpenText(e.target.value)}
            disabled={phase !== 'answering' || isGrading}
            rows={3}
          />
          {phase === 'answering' && (
            <button
              className={styles.submitBtn}
              onClick={handleOpenSubmit}
              disabled={!openText.trim() || isGrading}
            >
              {isGrading && <span className={styles.gradingSpinner} />}
              {isGrading ? 'Grading…' : 'Submit Answer'}
            </button>
          )}
        </div>
      )}

      {isReviewing && answer && (
        <ExplanationCard
          explanation={question.explanation}
          correct={answer.correct}
          aiFeedback={answer.aiFeedback}
          aiGraded={answer.aiGraded}
        />
      )}
    </div>
  );
}
