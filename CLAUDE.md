# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**TradeIQ** is an AI-powered trading education platform: an interactive chart (left panel) with AI-driven annotations paired with an AI tutor sidebar (right panel), a 44-lesson curriculum across 6 modules, and a full quiz system. The full product specification lives in `tradeiq-spec.md`.

## Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite + TypeScript |
| Styling | CSS Modules + CSS custom properties (no Tailwind, no runtime CSS-in-JS) |
| AI | `openai` SDK pointed at HuggingFace Inference Router — streaming responses |
| Chart | `lightweight-charts` (TradingView open-source) with programmatic drawing API |
| Market Data | Twelve Data API (free tier: 800 req/day) |
| State | React Context + `useReducer` (`AppContext.tsx` + `ChartContext.tsx`) |
| Routing | React Router v7 |
| Persistence | `localStorage` only (no backend, no auth in v1) |
| Fonts | Google Fonts: `Syne` (headings/UI) + `Space Mono` (tickers/data) — loaded in `index.html` |

## Commands

```bash
npm install          # install dependencies
npm run dev          # start dev server (http://localhost:5173)
npm run build        # TypeScript compile + Vite production build
npm run preview      # preview production build locally
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit (run before committing)
```

No test framework is set up in v1. TypeScript strict mode is on — `npm run typecheck` is the primary correctness gate.

## Environment

```bash
# .env (copy from .env.example)
VITE_HF_TOKEN=hf_...
VITE_TWELVE_DATA_KEY=your_key_here
```

Both tokens are exposed client-side via Vite's `import.meta.env`. This is intentional for local/dev use. **Do not deploy publicly without adding a backend proxy.**

## AI Tutor Setup (HuggingFace Router)

1. Go to https://huggingface.co/settings/tokens
2. Create a fine-grained token
3. Enable permission: "Make calls to Inference Providers"
4. Copy the token (starts with hf_...)
5. Add to .env: VITE_HF_TOKEN=hf_your_token_here

The tutor uses GPT-OSS 120B via Cerebras (fastest free backend).
HuggingFace provides monthly free credits ($0.10 for free users).
Model can be changed in `src/config/aiProvider.ts`.

## Chart Data Setup (Twelve Data)

1. Sign up at https://twelvedata.com (free)
2. Copy your API key from the dashboard
3. Add to .env: VITE_TWELVE_DATA_KEY=your_key_here

Free tier: 800 requests/day, 8 requests/minute. Data is cached in-memory for 5 minutes to reduce API calls.

## Architecture

### Global State

- **`src/context/AppContext.tsx`** — Single `AppState` managed by `useReducer`. Covers: ticker/timeframe/chartType, current lesson, user level, chat messages, quiz session, and `UserProgress`. All localStorage reads/writes go through `useProgress.ts`.
- **`src/context/ChartContext.tsx`** — Exposes chart drawing API and live price data summary to the tutor. The chart component registers its drawing methods here; the tutor hook reads data summaries and executes draw commands.

### Key Hooks

- **`useChart.ts`** — Manages the `lightweight-charts` instance. Handles chart creation, series type switching (candlestick/line/bar), data fetching via Twelve Data, and exposes drawing methods: `addHorizontalLine`, `addTrendline`, `addMarker`, `clearAnnotations`.
- **`useTutor.ts`** — OpenAI SDK (pointed at HuggingFace Inference Router) streaming. Builds the system prompt with live chart data (current price, swing points, timestamps). After streaming completes, parses drawing commands from the response and executes them on the chart.
- **`useProgress.ts`** — reads/writes `localStorage` for `UserProgress`, messages (capped at 100), and chart state.
- **`useQuiz.ts`** — quiz session state machine. Open-answer questions fire a separate lightweight HF router call for grading.

### AI System Prompt Pattern

`buildSystemPrompt(state, lesson?, chartData?)` in `useTutor.ts` assembles the full prompt each message. It includes:
- Current ticker, timeframe, user level, completed lesson count
- **Live chart data**: current price, period high/low, recent swing highs/lows, swing point timestamps
- Chart drawing command instructions
- Active lesson's `lessonPrompt` (when in lesson mode)

The tutor persona is "TradeIQ" — it must never identify itself as Claude or any other model.

### AI Chart Drawing System

The AI tutor can draw on the chart by embedding commands in its response text:

```
[DRAW_LINE price="550.00" color="#00e5a0" label="Support"]
[DRAW_TRENDLINE time1="1700000" price1="540" time2="1710000" price2="560" color="#3b7fff" label="Uptrend"]
[DRAW_MARKER time="1700000000" position="above" color="#ff6b35" text="Entry"]
[CLEAR_CHART]
```

**Flow:**
1. `useTutor` streams the AI response and displays it in real-time
2. After streaming completes, `parseChartCommands()` extracts drawing commands
3. Commands are stripped from the displayed message text
4. Commands are executed via `ChartContext` → `useChart` drawing methods

**Parser** (`src/utils/parseChartCommands.ts`): Lenient regex matching that handles extra spaces, flexible quoting, and special characters from the AI.

**Colors convention:**
- `#00e5a0` — support, bullish, uptrend
- `#ff3d5a` — resistance, bearish, downtrend
- `#ff6b35` — key levels, warnings
- `#3b7fff` — neutral, channels

### Market Data Service (`src/services/marketData.ts`)

Fetches OHLC data from Twelve Data API. Features:
- Symbol normalization: strips exchange prefixes (`AMEX:SPY` → `SPY`), converts futures shorthand (`/ES` → `ES=F`)
- Timeframe mapping to Twelve Data intervals (1min, 5min, 15min, 1h, 4h, 1day, 1week)
- 5-minute in-memory cache to reduce API calls
- 4H aggregation from 1h bars (Twelve Data supports 4h natively)

### AI Provider Config (`src/config/aiProvider.ts`)

Centralized model configuration. Change the model/provider here:
```typescript
export const AI_PROVIDER = {
  baseURL: "https://router.huggingface.co/v1",
  model: "openai/gpt-oss-120b:cerebras",
  fallbackModel: "openai/gpt-oss-120b:fastest",
  maxTokens: 512,
  temperature: 0.7,
} as const;
```

### Curriculum Data (`src/data/curriculum.ts`)

Static typed array of `Module[]`. Each `Module` contains `Lesson[]` (each with its own `lessonPrompt` and `quizQuestions`) and `moduleQuizQuestions`. The final exam lives separately in `src/data/finalExam.ts`. Every lesson needs a minimum of 3 `quizQuestions`. Do not derive curriculum structure from component state — treat this file as the source of truth.

### Symbol Normalization

Futures shorthand (`/ES`, `/NQ`, `/CL`, `/GC`) is normalized to Yahoo/Twelve Data format (`ES=F`, etc.) in `src/services/marketData.ts`. Exchange prefixes like `AMEX:SPY` are stripped to just the symbol.

### Quiz Routing & Guards

- `/quiz/lesson/:lessonId` — requires lesson marked complete; redirect to `/curriculum` if not
- `/quiz/module/:moduleId` — requires all module lessons complete
- `/quiz/final` — requires all 6 modules complete
- `/results/:attemptId` — reads attempt from `localStorage`

Module quiz unlock requires lesson *completion*, not quiz pass.

## localStorage Keys

```typescript
'tradeiq_progress'   // UserProgress object
'tradeiq_messages'   // Message[] — capped at 100
'tradeiq_chart'      // { ticker, timeframe, chartType }
'tradeiq_onboarded'  // boolean — returning user detection
```

## Design System

Dark terminal aesthetic. Use CSS custom properties defined in `src/styles/tokens.css`:

```css
--bg: #0a0c0f          /* page background */
--surface: #111318      /* panels */
--surface2: #181c22     /* inputs, bubbles, cards */
--border: #1e2530
--accent: #00e5a0       /* green — AI, correct, complete */
--accent2: #3b7fff      /* blue — user messages, active */
--warn: #ff6b35         /* orange — key terms, warnings */
--red: #ff3d5a          /* wrong answers */
--text: #e2e8f0
--muted: #5a6478
--gold: #f5c542         /* XP, streaks */
```

Borders are 1px solid, no box shadows. Border-radius: 4px inputs/chips, 6px cards. Quiz answer options show no color before submission — green/red only after submit.

## XP Awards

Complete lesson: +10 | Pass lesson quiz: +15 | Perfect lesson quiz: +25 | Pass module quiz: +50 | Daily streak: +5 | Pass final exam: +200. Pass threshold is 70% for lesson/module quizzes, 75% for the final exam.

## Open Issues (from spec)

- API keys must be proxied server-side before any public deployment
- Users who skip onboarding via direct URL should default to beginner + show a level prompt in the tutor panel
- Module 6 (Psychology) unlock order relative to Modules 4–5 is undecided
- Streak grace period policy is undecided
