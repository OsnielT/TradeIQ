import { useCallback } from 'react';
import OpenAI from 'openai';
import { useApp } from '../context/AppContext.tsx';
import { useChartDrawing } from '../context/ChartContext.tsx';
import type { ChartDataSummary } from '../context/ChartContext.tsx';
import { AI_PROVIDER } from '../config/aiProvider.ts';
import { parseChartCommands } from '../utils/parseChartCommands.ts';
import type { AppState, Lesson, Message } from '../types/index.ts';

// ---------------------------------------------------------------------------
// HuggingFace Inference Router client (OpenAI-compatible)
// ---------------------------------------------------------------------------

const hfClient = new OpenAI({
  baseURL: AI_PROVIDER.baseURL,
  apiKey: import.meta.env.VITE_HF_TOKEN as string,
  dangerouslyAllowBrowser: true,
});

const MAX_HISTORY = 20;

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

export function buildSystemPrompt(state: AppState, lesson?: Lesson, chartData?: ChartDataSummary | null): string {
  const base = `
You are TradeIQ, an expert trading educator and coach.
Your job is to teach trading at the user's current level through clear, example-driven lessons.

Current chart context:
- Ticker: ${state.ticker}
- Timeframe: ${state.timeframe}
- User level: ${state.userLevel}
- Active lesson: ${lesson?.title ?? 'Free exploration'}
- Completed lessons: ${state.progress.completedLessonIds.length} of 44
${chartData ? `
Live chart data (use these REAL prices when drawing or referencing levels):
- Current price: ${chartData.currentPrice.toFixed(2)}
- Period high: ${chartData.high.toFixed(2)}
- Period low: ${chartData.low.toFixed(2)}
- Period open: ${chartData.open.toFixed(2)}
- Recent swing highs: ${chartData.recentHighs.map((p) => p.toFixed(2)).join(', ')}
- Recent swing lows: ${chartData.recentLows.map((p) => p.toFixed(2)).join(', ')}
- Chart time range: ${chartData.firstBarTime} to ${chartData.lastBarTime} (unix seconds)
${chartData.recentSwings.length > 0 ? `- Swing points (for trendlines): ${chartData.recentSwings.map((s) => `${s.type}@${s.time}=$${s.price.toFixed(2)}`).join(', ')}` : ''}

IMPORTANT: When you draw lines or reference price levels, use the REAL prices above. Never make up prices. The user is looking at this exact data on their chart. For trendlines, use the swing point timestamps provided.
` : ''}
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

Chart drawing commands:
You can draw on the user's chart to visually illustrate concepts. Embed these commands anywhere in your response — they will be executed and hidden from the displayed text.

Available commands:
- [DRAW_LINE price="<number>" color="<hex>" label="<text>"] — draws a horizontal line (support, resistance, entry/exit levels)
- [DRAW_TRENDLINE time1="<unix>" price1="<number>" time2="<unix>" price2="<number>" color="<hex>" label="<text>"] — draws a diagonal trendline between two points
- [CLEAR_CHART] — removes all previous annotations before drawing new ones

Colors to use:
- "#00e5a0" for support levels, bullish signals, uptrend lines
- "#ff3d5a" for resistance levels, bearish signals, downtrend lines
- "#ff6b35" for key price levels, warnings
- "#3b7fff" for neutral reference lines, channels

Use chart drawings when:
- Pointing out support/resistance levels
- Showing entry/exit zones in educational examples
- Drawing trendlines to visualize the direction of a trend
- Highlighting chart patterns (channels, wedges, triangles)
- The user asks you to mark something on the chart

Always use [CLEAR_CHART] before drawing new annotations to avoid clutter. Only draw when it adds educational value — not every response needs drawings.
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
  console.error('[TradeIQ Tutor] API error:', msg);
  if (msg.includes('402') || msg.includes('Payment Required')) {
    return 'HuggingFace free credits exhausted. Add billing or wait until next month\'s quota resets.';
  }
  if (msg.includes('429')) {
    return 'Rate limit hit — please wait a moment and try again.';
  }
  return 'Connection error — check your HF token and try again.';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTutor() {
  const { state, dispatch } = useApp();
  const { executeCommands, clearChart, getDataSummary } = useChartDrawing();

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

      const systemPrompt = buildSystemPrompt(state, lesson, getDataSummary());

      try {
        const stream = await hfClient.chat.completions.create({
          model: AI_PROVIDER.model,
          max_tokens: AI_PROVIDER.maxTokens,
          temperature: AI_PROVIDER.temperature,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content },
          ],
        });

        let accumulated = '';

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? '';
          accumulated += delta;
          dispatch({
            type: 'SET_MESSAGES',
            messages: [
              ...baseMessages,
              { ...assistantMsg, content: accumulated },
            ],
          });
        }

        // After streaming completes, parse and execute chart commands
        const { cleanText, commands, shouldClear } = parseChartCommands(accumulated);

        // Update the message with cleaned text (commands stripped)
        if (cleanText !== accumulated) {
          dispatch({
            type: 'SET_MESSAGES',
            messages: [
              ...baseMessages,
              { ...assistantMsg, content: cleanText },
            ],
          });
        }

        // Execute chart drawing commands
        if (shouldClear) clearChart();
        if (commands.length > 0) executeCommands(commands);
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
    [state, dispatch, executeCommands, clearChart, getDataSummary],
  );

  return { sendMessage };
}
