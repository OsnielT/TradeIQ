import { useParams } from 'react-router-dom';

export default function ResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '12px',
        color: 'var(--muted)',
        padding: '40px',
      }}
    >
      <span style={{ fontSize: '40px' }}>📊</span>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
        Quiz Results
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
        {attemptId}
      </p>
      <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
        Results interface coming in the next step.
      </p>
    </div>
  );
}
