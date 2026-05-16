import styles from './QuickActions.module.css';

const ACTIONS = [
  {
    label: 'Draw the trend',
    prompt:
      'Draw trendlines on this chart showing me the current trend direction. Explain what you see.',
  },
  {
    label: 'Key levels',
    prompt:
      'Identify and draw the key support and resistance levels on this chart.',
  },
  {
    label: 'Trade setup',
    prompt:
      'Show me a hypothetical swing trade setup on this chart with entry/exit levels drawn.',
  },
  {
    label: 'Explain chart',
    prompt:
      'Describe what this chart is telling us — the trend, momentum, and anything that stands out.',
  },
  {
    label: 'Pattern check',
    prompt:
      'Are there any chart patterns forming on this chart? Draw them if you see any.',
  },
  {
    label: 'Quiz me',
    prompt:
      'Give me a quick trading question based on what I can see on this chart right now.',
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
