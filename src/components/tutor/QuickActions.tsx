import styles from './QuickActions.module.css';

const ACTIONS = [
  {
    label: 'Explain chart',
    prompt:
      'Describe the current chart for me — explain the trend, key levels, and what stands out.',
  },
  {
    label: 'Trade setup',
    prompt:
      'Give me a hypothetical swing trade setup on this chart as an educational example.',
  },
  {
    label: 'Last candle',
    prompt:
      'Explain the most recent candle on this chart and what it tells us about price action.',
  },
  {
    label: 'Quiz me',
    prompt:
      'Give me a quick trading question based on what I have learned so far.',
  },
] as const;

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function QuickActions({ onSend, disabled }: Props) {
  return (
    <div className={styles.bar} aria-label="Quick actions">
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          className={styles.btn}
          onClick={() => onSend(action.prompt)}
          disabled={disabled}
          aria-label={action.label}
          title={action.prompt}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
