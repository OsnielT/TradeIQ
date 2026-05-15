import styles from './AnswerOption.module.css';

interface Props {
  label: string;
  letter?: string;
  isCorrect: boolean;
  isWrong: boolean;
  isDimmed: boolean;
  onClick: () => void;
  disabled: boolean;
  isTf?: boolean;
}

export function AnswerOption({
  label,
  letter,
  isCorrect,
  isWrong,
  isDimmed,
  onClick,
  disabled,
  isTf = false,
}: Props) {
  const cls = [
    styles.option,
    isTf ? styles.tf : '',
    isCorrect ? styles.correct : '',
    isWrong ? styles.wrong : '',
    isDimmed ? styles.dimmed : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} onClick={onClick} disabled={disabled}>
      {letter && !isTf && <span className={styles.letter}>{letter}</span>}
      <span>{label}</span>
    </button>
  );
}
