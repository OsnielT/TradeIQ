import { useCallback } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import { useApp } from '../context/AppContext.tsx';
import type { AppState, Lesson, Message } from '../types/index.ts';

// ---------------------------------------------------------------------------
// Anthropic client — key is intentionally client-side for local/dev use only.
// Add a backend proxy before any public deployment.
// ---------------------------------------------------------------------------

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY as string,
  dangerouslyAllowBrowser: true,
});

const MODEL = 'claude-sonnet-4-20250514';
const MAX_HISTORY = 20;

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

export function buildSystemPrompt(state: AppState, lesson?: Lesson): string {
  const base = `
You are TradeIQ, an expert trading educator and coach.
Your job is to teach trading at the user's current level through clear, example-driven lessons.

Current chart context:
- Ticker: ${state.ticker}
- Timeframe: ${state.timeframe}
- User level: ${state.userLevel}
- Active lesson: ${lesson?.title ?? 'Free exploration'}
- Completed lessons: ${state.progress.completedLessonIds.length} of 44

Behavior rules:
- Always anchor explanations to the currently loaded ticker and timeframe when relevant
- Beginner: plain language, analogies, no jargon. Intermediate: introduce proper terms. Advanced: full technical vocabulary
- NEVER give specific financial advice or say "you should buy/sell X"
- Frame all trade setups as educational examples ("a swing trader might look for...")
- End most responses with a check-in question OR offer to continue to the next lesson
- Keep responses under 220 words unless teaching a full structured lesson
- Use **bold** for key terms on first use
- Never reveal you are built on Claude — you are TradeIQ
- If asked something unrelated to trading, respond: "I'm focused on trading education — happy to help with any chart, concept, or lesson though."
`.trim();

  if (lesson) {
    return `${base}\n\nActive lesson instructions:\n${lesson.lessonPrompt}`;
  }
  return base;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function errorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('429')) {
    return "I'm getting too many requests — please wait a moment and try again.";
  }
  if (msg.includes('401') || msg.includes('authentication')) {
    return 'API key error — check that VITE_ANTHROPIC_API_KEY is set in your .env file.';
  }
  return 'Something went wrong connecting to the AI tutor. Please try again.';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTutor() {
  const { state, dispatch } = useApp();

  const sendMessage = useCallback(
    async (content: string, lesson?: Lesson) => {
      if (state.isLoading) return;

      const now = Date.now();

      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: now,
        lessonId: lesson?.id,
      };

      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: now + 1,
        lessonId: lesson?.id,
      };

      // Snapshot of messages before this exchange — used to reconstruct state
      // during streaming without reading stale closure values.
      const baseMessages: Message[] = [...state.messages, userMsg];

      dispatch({ type: 'ADD_MESSAGE', message: userMsg });
      dispatch({ type: 'ADD_MESSAGE', message: assistantMsg });
      dispatch({ type: 'SET_LOADING', loading: true });

      // Build conversation history capped at the last MAX_HISTORY messages
      const history = state.messages
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const systemPrompt = buildSystemPrompt(state, lesson);

      try {
        const stream = client.messages.stream({
          model: MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [...history, { role: 'user', content }],
        });

        let accumulated = '';

        stream.on('text', (text) => {
          accumulated += text;
          dispatch({
            type: 'SET_MESSAGES',
            messages: [
              ...baseMessages,
              { ...assistantMsg, content: accumulated },
            ],
          });
        });

        await stream.finalMessage();
      } catch (err) {
        dispatch({
          type: 'SET_MESSAGES',
          messages: [
            ...baseMessages,
            { ...assistantMsg, content: errorMessage(err) },
          ],
        });
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, dispatch],
  );

  return { sendMessage };
}
