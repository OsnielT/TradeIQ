# TradeIQ — Trading Learning Platform
## Product Specification & Build Plan

---

## 1. Overview

**TradeIQ** is an AI-powered trading education platform that combines a live TradingView chart with a real-time AI tutor sidebar. The goal is to teach users — from zero — how to read charts, understand market mechanics, and apply strategies like swing trading, options, and futures through contextual, example-driven learning.

The platform is a **React application** (Vite + React 18 + TypeScript) powered by the Anthropic SDK for the AI tutor, with TradingView's free embeddable widget for live chart data. Progress, quiz scores, and user preferences are persisted to `localStorage` so users can resume where they left off.

---

## 2. Problem Statement

Most trading education is either:
- Too abstract (books, videos with no live context)
- Too advanced (assumes prior knowledge)
- Too disconnected (you learn theory but never apply it to a real chart)
- Not testable (no way to verify you actually understood it)

TradeIQ solves this by pairing a **live, real market chart** with an **AI tutor that explains exactly what you're looking at**, a **structured 44-lesson curriculum**, and a **quiz system** that tests and reinforces knowledge after each lesson and module.

---

## 3. Target User

- Complete beginners who want to learn trading from scratch
- Self-learners who understand basic concepts but can't connect theory to real charts
- Anyone curious about options, futures, or swing trading who needs guided, testable examples

---

## 4. Core Features

### 4.1 TradingView Chart Panel (Left)
- Embedded TradingView Advanced Chart widget (free, no API key required)
- User can change ticker symbol (e.g. AAPL, SPY, BTC/USD, /ES)
- Timeframe selector: 1m, 5m, 15m, 1H, 4H, 1D, 1W
- Chart type toggle: Candlestick, Line, Bar
- Indicator presets configurable via widget `studies` config: MA (20/50/200), RSI, MACD, Volume
- When a lesson is started, the chart auto-navigates to the lesson's `suggestedTicker` and `suggestedTimeframe`

### 4.2 AI Tutor Panel (Right)
- Chat interface powered by Anthropic SDK (`claude-sonnet-4-20250514`), streaming responses
- Persistent conversation history within the session
- User can ask free-form questions at any time
- Tutor is always aware of the currently loaded ticker, timeframe, active lesson, and user level
- Tutor maintains a **learning level** (Beginner → Intermediate → Advanced) that adjusts explanation depth
- System prompt is rebuilt on every message to reflect current state

### 4.3 Curriculum & Lesson Mode
- 44 structured lessons across 6 modules stored in `src/data/curriculum.ts`
- Lessons unlock sequentially within a module by default
- Starting a lesson triggers: chart switch to suggested ticker/TF, lesson-specific system prompt injection, welcome message from tutor
- Lesson completion is triggered manually ("Mark Complete") or auto-suggested by tutor after 3+ exchanges
- Completed lessons are persisted in localStorage

### 4.4 Quiz System (Full — see Section 10)
- Per-lesson quiz (3–5 questions) unlocked after lesson completion
- Per-module quiz (10–15 questions) unlocked after all lessons in a module are complete
- Final exam (30 questions) unlocked after all 6 modules are complete
- Multiple-choice (A/B/C/D), true/false, and open-answer question types
- AI-graded open-answer questions for advanced users
- Score tracking with pass threshold (70%)
- Unlimited retakes — best score saved
- Detailed answer review after each attempt

### 4.5 Quick Action Buttons
- "Explain this chart" — AI describes the current ticker, trend, and key levels
- "Swing trade idea" — AI gives a hypothetical setup framed as an educational example
- "Last candle" — AI explains the most recent candle pattern
- "Quiz me" — AI generates an ad-hoc question based on completed lessons

### 4.6 Progress Dashboard (Curriculum Page)
- Visual overview of all 6 modules with per-module completion %
- Lesson status indicators: Locked / Available / In Progress / Complete / Quiz Passed
- Overall course completion percentage
- Quiz scores per lesson and module
- Streak counter (days in a row with activity)
- XP total
- Estimated time remaining to complete the course

---

## 5. Learning Curriculum

The curriculum is stored as a typed static data file (`src/data/curriculum.ts`). Each lesson defines its own `lessonPrompt` which is injected into the AI tutor system prompt when that lesson is active.

---

### Module 1 — Fundamentals (6 lessons)
| # | ID | Title | Suggested Chart |
|---|---|---|---|
| 1 | `how-markets-work` | How Markets Work | SPY / 1D |
| 2 | `what-is-a-chart` | What Is a Candlestick Chart? | AAPL / 1D |
| 3 | `reading-candles` | Reading Candles | AAPL / 1D |
| 4 | `support-resistance` | Support & Resistance | AAPL / 1W |
| 5 | `trend-identification` | Trend Identification | SPY / 1D |
| 6 | `volume-basics` | Volume Basics | AAPL / 1D |

### Module 2 — Technical Analysis (7 lessons)
| # | ID | Title | Suggested Chart |
|---|---|---|---|
| 1 | `moving-averages` | Moving Averages (SMA vs EMA) | SPY / 1D |
| 2 | `rsi` | RSI — Overbought & Oversold | AAPL / 1D |
| 3 | `macd` | MACD — Momentum & Crossovers | SPY / 1D |
| 4 | `candle-patterns` | Candlestick Patterns | AAPL / 1D |
| 5 | `chart-patterns` | Chart Patterns | SPY / 1W |
| 6 | `breakouts` | Breakouts & Retests | NVDA / 1D |
| 7 | `confluence` | Confluence — Stacking the Odds | SPY / 1D |

### Module 3 — Swing Trading (8 lessons)
| # | ID | Title | Suggested Chart |
|---|---|---|---|
| 1 | `what-is-swing-trading` | What Is Swing Trading? | SPY / 1D |
| 2 | `swing-setups` | Identifying Swing Setups | AAPL / 1D |
| 3 | `entry-triggers` | Entry Triggers & Confirmation | SPY / 4H |
| 4 | `stop-losses` | Setting Stop-Losses | AAPL / 1D |
| 5 | `profit-targets` | Setting Profit Targets | SPY / 1D |
| 6 | `trade-management` | Managing Open Trades | SPY / 4H |
| 7 | `position-sizing` | Position Sizing & Risk Per Trade | SPY / 1D |
| 8 | `swing-journal` | Building a Trade Journal | SPY / 1D |

### Module 4 — Options (10 lessons)
| # | ID | Title | Suggested Chart |
|---|---|---|---|
| 1 | `what-is-an-option` | What Is an Option? | AAPL / 1D |
| 2 | `calls-and-puts` | Calls vs Puts | AAPL / 1D |
| 3 | `strike-and-expiry` | Strike Price & Expiration | SPY / 1D |
| 4 | `itm-otm-atm` | ITM / OTM / ATM | AAPL / 1D |
| 5 | `theta-decay` | Theta Decay — Time is the Enemy | SPY / 1D |
| 6 | `the-greeks` | The Greeks (Delta, Gamma, Vega, Theta) | SPY / 1D |
| 7 | `buying-options` | Buying Calls & Puts (Directional Plays) | AAPL / 1D |
| 8 | `covered-calls` | Covered Calls & Cash-Secured Puts | AAPL / 1W |
| 9 | `spreads` | Debit & Credit Spreads | SPY / 1D |
| 10 | `iv-and-options-chain` | IV & Reading an Options Chain | SPY / 1D |

### Module 5 — Futures (8 lessons)
| # | ID | Title | Suggested Chart |
|---|---|---|---|
| 1 | `what-are-futures` | What Are Futures Contracts? | CME_MINI:ES1! / 1D |
| 2 | `futures-vs-stocks` | Futures vs Stocks | CME_MINI:ES1! / 1D |
| 3 | `futures-markets` | Common Futures Markets (/ES /NQ /CL /GC) | CME_MINI:ES1! / 1D |
| 4 | `futures-margin` | Margin, Leverage & Risk | CME_MINI:ES1! / 1D |
| 5 | `contract-expiry` | Contract Expiration & Rollover | CME_MINI:ES1! / 1D |
| 6 | `futures-for-hedging` | Using Futures to Hedge | CME_MINI:ES1! / 1W |
| 7 | `dom-and-ladder` | Reading the DOM / Futures Ladder | CME_MINI:ES1! / 5m |
| 8 | `futures-trading-plan` | Building a Futures Trading Plan | CME_MINI:ES1! / 1D |

### Module 6 — Trading Psychology & Risk (5 lessons)
| # | ID | Title | Suggested Chart |
|---|---|---|---|
| 1 | `trading-mindset` | The Trading Mindset | SPY / 1D |
| 2 | `fear-and-greed` | Fear, Greed & Emotional Discipline | SPY / 1D |
| 3 | `risk-management` | Risk Management Principles | SPY / 1D |
| 4 | `common-mistakes` | The 10 Most Common Beginner Mistakes | SPY / 1D |
| 5 | `building-a-plan` | Building Your Personal Trading Plan | SPY / 1D |

**Total: 44 lessons across 6 modules**

---

## 6. UI Layout & Pages

### 6.1 Pages & Routes
| Route | Page | Description |
|---|---|---|
| `/` | Home / Onboarding | Welcome screen, level selector, start CTA |
| `/learn` | Learn Page | Chart + Tutor side by side (default free explore) |
| `/learn/:moduleId/:lessonId` | Lesson View | Chart + Tutor in lesson mode |
| `/curriculum` | Curriculum Page | Full course overview with progress |
| `/quiz/lesson/:lessonId` | Lesson Quiz | Post-lesson quiz (3–5 questions) |
| `/quiz/module/:moduleId` | Module Quiz | Post-module quiz (10–15 questions) |
| `/quiz/final` | Final Exam | 30-question comprehensive exam |
| `/results/:attemptId` | Quiz Results | Score, answer review, next step CTA |

### 6.2 Main Learn Page Layout
```
┌──────────────────────────────────────────────────────────────────────┐
│  HEADER: Logo | Ticker Input | Timeframe Pills | Level Selector | XP  │
├────────────────────────────────────┬─────────────────────────────────┤
│                                    │  TUTOR PANEL                    │
│  CHART PANEL                       │  ── Level badge + Lesson title  │
│                                    │  ── Lesson progress bar         │
│  TradingView Widget                │  ─────────────────────────────  │
│  (flex-grow, full height)          │  Chat messages (scrollable)     │
│                                    │                                 │
│                                    │                                 │
│                                    │  ─────────────────────────────  │
│                                    │  Quick action buttons (4)       │
│                                    │  ─────────────────────────────  │
│                                    │  Text input + Send              │
│                                    │  ── "Mark lesson complete" CTA  │
└────────────────────────────────────┴─────────────────────────────────┘
```

### 6.3 Curriculum Page Layout
```
┌──────────────────────────────────────────────────────────────────────┐
│  HEADER                                                               │
├──────────────────────────────────────────────────────────────────────┤
│  PROGRESS SUMMARY: X% complete | Y/44 lessons | Z-day streak | XP    │
├──────────────────────────────────────────────────────────────────────┤
│  MODULE CARDS (2-column grid)                                         │
│  ┌─────────────────────────┐  ┌─────────────────────────┐           │
│  │ Module 1 — Fundamentals │  │ Module 2 — Tech Analysis │           │
│  │ ████████░░ 4/6 done     │  │ ░░░░░░░░░░ Locked        │           │
│  │ [Lesson list with icons]│  │ Complete Module 1 first  │           │
│  │ Module Quiz: 85% ✓      │  │                          │           │
│  └─────────────────────────┘  └─────────────────────────┘           │
│  ... (all 6 modules)                                                  │
├──────────────────────────────────────────────────────────────────────┤
│  FINAL EXAM CTA (locked until all 6 modules complete)                 │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.4 Quiz Page Layout
```
┌──────────────────────────────────────────────────────────────────────┐
│  HEADER: Quiz title | Question X of Y | Score so far                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  QUESTION CARD (centered, max-width 680px)                            │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  [Question text]                                                │  │
│  │                                                                 │  │
│  │  A) ─────────────────     B) ─────────────────                 │  │
│  │  C) ─────────────────     D) ─────────────────                 │  │
│  │                                                                 │  │
│  │  [Submit Answer]                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ── After answer submitted: Explanation card + correct/wrong badge ─ │
│  [Next Question →]                                                    │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.5 Onboarding / Home Page
- App name + tagline
- "What's your experience level?" selector (Beginner / Some Experience / I've Traded Before)
- Maps to `userLevel`: beginner / intermediate / advanced
- "Start Learning" CTA → navigates to `/learn/module-1/how-markets-work`
- "Browse Curriculum" secondary CTA → `/curriculum`
- Returning users (detected via `tradeiq_onboarded` localStorage key) are redirected directly to `/learn` at their last position

---

## 7. Technical Architecture

### 7.1 Stack
| Layer | Choice | Reason |
|---|---|---|
| Framework | React 18 + Vite | Fast dev server, modern React, easy build |
| Language | TypeScript | Type safety across curriculum, quiz, and state |
| Styling | CSS Modules + CSS variables | Scoped styles, zero runtime overhead |
| Chart | TradingView Advanced Chart Widget | Free, live data, no API key required |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) | Streaming support, typed responses |
| State | React Context + useReducer | Clean global state, no Redux overhead |
| Persistence | localStorage | Progress, scores, level, last 100 messages |
| Routing | React Router v6 | Page-level routing |
| Fonts | Google Fonts (Space Mono + Syne) | Loaded in `index.html` |

### 7.2 Project File Structure
```
tradeiq/
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig.json
├── .env.example                    # VITE_ANTHROPIC_API_KEY=
├── src/
│   ├── main.tsx
│   ├── App.tsx                     # Router + AppProvider wrapper
│   ├── data/
│   │   ├── curriculum.ts           # All 44 lessons with quizQuestions
│   │   └── finalExam.ts            # 30-question final exam bank
│   ├── types/
│   │   └── index.ts                # All shared TypeScript types
│   ├── context/
│   │   └── AppContext.tsx          # Global state + dispatch
│   ├── hooks/
│   │   ├── useTutor.ts             # Anthropic API + streaming
│   │   ├── useProgress.ts          # localStorage read/write
│   │   ├── useQuiz.ts              # Quiz session state machine
│   │   └── useTradingView.ts       # Widget lifecycle management
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   ├── chart/
│   │   │   ├── ChartPanel.tsx
│   │   │   ├── TradingViewWidget.tsx
│   │   │   ├── TickerInput.tsx
│   │   │   └── TimeframePills.tsx
│   │   ├── tutor/
│   │   │   ├── TutorPanel.tsx
│   │   │   ├── ChatMessages.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── LessonProgress.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── curriculum/
│   │   │   ├── CurriculumGrid.tsx
│   │   │   ├── ModuleCard.tsx
│   │   │   ├── LessonRow.tsx
│   │   │   └── ProgressSummary.tsx
│   │   └── quiz/
│   │       ├── QuizCard.tsx
│   │       ├── AnswerOption.tsx
│   │       ├── ExplanationCard.tsx
│   │       ├── QuizProgress.tsx
│   │       └── QuizResults.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── LearnPage.tsx
│   │   ├── CurriculumPage.tsx
│   │   ├── QuizPage.tsx
│   │   └── ResultsPage.tsx
│   └── styles/
│       ├── globals.css             # Reset, base typography, CSS vars
│       └── tokens.css              # Design tokens
```

### 7.3 TypeScript Types

```typescript
// src/types/index.ts

export type UserLevel = 'beginner' | 'intermediate' | 'advanced';
export type Timeframe = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';
export type AppMode = 'learn' | 'quiz' | 'analyze';
export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'complete';
export type QuizType = 'lesson' | 'module' | 'final';
export type QuestionType = 'multiple_choice' | 'true_false' | 'open_answer';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: [string, string, string, string]; // multiple_choice only
  correctIndex?: number;                       // multiple_choice only
  correctAnswer?: boolean;                     // true_false only
  acceptableKeywords?: string[];               // open_answer: AI grades against these
  explanation: string;                         // shown after answer submitted
  lessonRef: string;                           // which lesson this tests
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  suggestedTicker: string;
  suggestedTimeframe: Timeframe;
  lessonPrompt: string;                        // injected into system prompt
  quizQuestions: QuizQuestion[];               // min 3, max 5
}

export interface Module {
  id: string;
  title: string;
  description: string;
  color: string;                               // accent color for this module
  icon: string;                                // emoji
  lessons: Lesson[];
  moduleQuizQuestions: QuizQuestion[];         // 10–15 items
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  lessonId?: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedIndex?: number;
  selectedBoolean?: boolean;
  openText?: string;
  correct: boolean;
  aiGraded?: boolean;
  aiFeedback?: string;
}

export interface QuizAttempt {
  id: string;
  quizType: QuizType;
  quizRef: string;              // lessonId | moduleId | 'final'
  startedAt: number;
  completedAt?: number;
  answers: QuizAnswer[];
  score: number;                // 0–100
  passed: boolean;
}

export interface UserProgress {
  userLevel: UserLevel;
  completedLessonIds: string[];
  lessonQuizAttempts: Record<string, QuizAttempt[]>;  // keyed by lessonId
  moduleQuizAttempts: Record<string, QuizAttempt[]>;  // keyed by moduleId
  finalExamAttempts: QuizAttempt[];
  streakDays: number;
  lastActiveDate: string;       // ISO date string YYYY-MM-DD
  totalXP: number;
}

export interface AppState {
  ticker: string;
  timeframe: Timeframe;
  chartType: 'candlestick' | 'line' | 'bar';
  activeMode: AppMode;
  currentModuleId: string | null;
  currentLessonId: string | null;
  userLevel: UserLevel;
  progress: UserProgress;
  messages: Message[];
  isLoading: boolean;
  activeQuiz: {
    quizType: QuizType;
    quizRef: string;
    questions: QuizQuestion[];
    currentIndex: number;
    answers: QuizAnswer[];
    completed: boolean;
  } | null;
}
```

### 7.4 Curriculum Data Shape (abbreviated)

```typescript
// src/data/curriculum.ts
export const curriculum: Module[] = [
  {
    id: 'module-1',
    title: 'Fundamentals',
    description: 'Learn how markets work and how to read a chart from scratch.',
    color: '#00e5a0',
    icon: '📈',
    lessons: [
      {
        id: 'how-markets-work',
        title: 'How Markets Work',
        description: 'Buyers, sellers, price discovery, and what moves prices.',
        estimatedMinutes: 8,
        suggestedTicker: 'NASDAQ:SPY',
        suggestedTimeframe: '1D',
        lessonPrompt: `Teach the user how financial markets work. Cover: what a market is,
how buyers and sellers set prices, what "price discovery" means, and what causes prices
to move. Use the current SPY chart as a concrete example. Assume no prior knowledge.
After explaining, ask one check-in question before offering to continue.`,
        quizQuestions: [
          {
            id: 'hmw-q1',
            type: 'multiple_choice',
            question: 'What primarily determines the price of a stock in the market?',
            options: [
              'The government sets it each morning',
              'The balance of buyers and sellers at any moment',
              "The company's profit from last year",
              'The stock exchange decides the price'
            ],
            correctIndex: 1,
            explanation: 'Prices are set by supply and demand — when more people want to buy than sell, prices rise, and vice versa.',
            lessonRef: 'how-markets-work'
          },
          {
            id: 'hmw-q2',
            type: 'true_false',
            question: 'A stock\'s price can only change during official market hours (9:30am–4pm ET).',
            correctAnswer: false,
            explanation: 'Stocks also trade pre-market (4am–9:30am ET) and after-hours (4pm–8pm ET), though with lower volume and wider spreads.',
            lessonRef: 'how-markets-work'
          }
        ]
      }
      // ... remaining 43 lessons
    ],
    moduleQuizQuestions: [
      // 10–15 questions covering all Module 1 lessons
    ]
  }
  // ... modules 2–6
];
```

### 7.5 Anthropic API Integration

```typescript
// src/hooks/useTutor.ts

const buildSystemPrompt = (state: AppState, lesson?: Lesson): string => {
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
};
```

Conversation history sent to API is capped at the **last 20 messages** to stay within context limits while preserving recent session flow.

### 7.6 Quiz Hook State Machine

```
IDLE → STARTED → ANSWERING → REVIEWING_ANSWER → (next Q or) COMPLETED → RESULTS
```

Open-answer questions are graded by a separate lightweight Anthropic API call:
```typescript
// Grading prompt
`Does this answer demonstrate understanding of the concept?
Key ideas expected: ${keywords.join(', ')}
User answered: "${userAnswer}"
Reply with only valid JSON: { "correct": boolean, "feedback": string }`
```

### 7.7 XP & Gamification

Simple XP system to encourage completion:

| Action | XP |
|---|---|
| Complete a lesson | +10 |
| Pass a lesson quiz (≥70%) | +15 |
| Perfect lesson quiz (100%) | +25 |
| Pass a module quiz | +50 |
| Daily streak (per day) | +5 |
| Pass the final exam | +200 |

XP is stored in `UserProgress.totalXP` and displayed in the header. No levels or badges in v1 — just a running total.

### 7.8 localStorage Schema

```typescript
const STORAGE_KEYS = {
  PROGRESS:    'tradeiq_progress',   // UserProgress object
  MESSAGES:    'tradeiq_messages',   // Message[] (last 100 only)
  CHART_STATE: 'tradeiq_chart',      // { ticker, timeframe, chartType }
  ONBOARDED:   'tradeiq_onboarded',  // boolean
};
```

Messages are capped at 100 to prevent unbounded storage growth.

### 7.9 TradingView Widget Integration

Widget is initialized in a `useEffect` inside `TradingViewWidget.tsx`. On ticker or timeframe change, the container innerHTML is cleared and a new widget instance is created.

```typescript
// Futures symbol normalization
const FUTURES_SYMBOLS: Record<string, string> = {
  '/ES': 'CME_MINI:ES1!',
  '/NQ': 'CME_MINI:NQ1!',
  '/CL': 'NYMEX:CL1!',
  '/GC': 'COMEX:GC1!',
};

const normalizeSymbol = (input: string): string =>
  FUTURES_SYMBOLS[input.toUpperCase()] ?? input.toUpperCase();
```

### 7.10 Environment Variables
```bash
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

> ⚠️ **Security note:** The Anthropic API key is exposed client-side via Vite's `import.meta.env`. This is acceptable for local/dev use. For any public deployment, all AI calls must be proxied through a backend API route (e.g. a Vercel Edge Function or Express endpoint) so the key never ships to the browser.

---

## 8. Acceptance Criteria

### AC-01 — Onboarding
- [ ] Home page loads with level selector (3 options) and two CTAs
- [ ] Selecting a level sets `userLevel` in state and localStorage
- [ ] "Start Learning" navigates to `/learn/module-1/how-markets-work`
- [ ] Returning users (`tradeiq_onboarded = true`) are redirected to their last lesson

### AC-02 — Chart Loads
- [ ] TradingView chart renders on page load with default ticker (AAPL) and timeframe (1D)
- [ ] Chart displays in dark theme matching app color scheme
- [ ] Chart is responsive to panel width
- [ ] Starting a lesson auto-switches chart to that lesson's `suggestedTicker` and `suggestedTimeframe`

### AC-03 — Ticker Change
- [ ] User can type a new ticker in the header input
- [ ] Enter key or "Go" button reloads chart with new symbol
- [ ] Shorthand futures symbols (e.g. `/ES`) are normalized to TradingView format
- [ ] Tutor system prompt updates to reflect new ticker on next message

### AC-04 — Timeframe Switch
- [ ] Clicking a timeframe pill updates the chart immediately
- [ ] Active pill is visually highlighted
- [ ] Tutor context reflects the new timeframe

### AC-05 — Lesson Flow
- [ ] Clicking a lesson navigates to `/learn/:moduleId/:lessonId`
- [ ] Chart switches to lesson's suggested ticker/timeframe
- [ ] Tutor sends an opening message driven by the lesson's `lessonPrompt`
- [ ] "Mark lesson complete" CTA appears after 2+ tutor exchanges
- [ ] Completing a lesson persists to localStorage, awards XP, and reveals quiz CTA

### AC-06 — AI Tutor Responds
- [ ] Messages stream token-by-token via Anthropic SDK streaming
- [ ] System prompt includes current ticker, timeframe, user level, and active lesson
- [ ] Last 20 messages are sent as conversation history with each call
- [ ] Typing indicator shows while awaiting first token
- [ ] API errors display a graceful in-chat error message with a retry button

### AC-07 — Quick Actions
- [ ] All 4 quick action buttons auto-send their respective prompts
- [ ] Buttons are disabled while a response is loading
- [ ] "Quiz me" only generates questions based on completed lessons

### AC-08 — Quiz: Lesson Quiz
- [ ] Lesson quiz is locked until lesson is marked complete
- [ ] Quiz CTA appears on lesson completion and navigates to `/quiz/lesson/:lessonId`
- [ ] 3–5 questions render correctly for all question types (MC, T/F, open answer)
- [ ] Correct answer is revealed with explanation after submission
- [ ] Score ≥70% = PASS; below = FAIL
- [ ] Attempt is saved to localStorage with score and all answers
- [ ] XP is awarded on pass
- [ ] Retakes are allowed; best score is displayed

### AC-09 — Quiz: Module Quiz
- [ ] Module quiz is locked until all lessons in the module are complete
- [ ] 10–15 questions from across all lessons in the module
- [ ] Same pass/fail/retry mechanics as lesson quiz
- [ ] Results page shows per-question breakdown

### AC-10 — Quiz: Final Exam
- [ ] Final exam is locked until all 6 modules are complete
- [ ] 30 questions drawn from `finalExam.ts` spanning all modules
- [ ] Pass threshold is 75% (higher than lesson/module quizzes)
- [ ] Completion shows a congratulations screen

### AC-11 — Quiz: Results Page
- [ ] Displays score as fraction and percentage (e.g. "8 / 10 — 80%")
- [ ] Shows PASSED (green) or FAILED (red) badge
- [ ] Per-question breakdown with user's answer, correct answer, and explanation
- [ ] On pass: "Continue →" CTA to next lesson or module
- [ ] On fail: "Review Lesson →" and "Retake Quiz →" CTAs
- [ ] Best score shown prominently on retake results

### AC-12 — Progress Tracking
- [ ] Curriculum page shows accurate completion % per module
- [ ] Lesson status icons update: locked / available / complete / quiz-passed
- [ ] XP total in header updates after each rewarded action
- [ ] Streak counter increments once per calendar day on any activity
- [ ] All progress survives full page refresh via localStorage

### AC-13 — User Level
- [ ] Default level set at onboarding
- [ ] Level dropdown in header allows change at any time
- [ ] System prompt updates immediately; tutor acknowledges the change
- [ ] Open-answer quiz questions only appear for intermediate/advanced users

### AC-14 — Responsive Layout
- [ ] Two-panel layout holds from 1024px and up
- [ ] Below 768px: chart is full-width, tutor panel becomes a bottom sheet toggled by a FAB
- [ ] Quiz and curriculum pages are fully usable on mobile

### AC-15 — Safety & Guardrails
- [ ] Tutor never gives specific buy/sell advice
- [ ] Off-topic messages receive a polite redirect response
- [ ] Legal disclaimer is visible in the footer on all pages

---

## 9. AI Tutor Behavior Spec

### Tone & Voice
- Calm, clear, encouraging — like a patient mentor, never a hype trader
- Uses analogies for beginners ("a candlestick is like a summary of a battle between buyers and sellers")
- Adjusts vocabulary by level: beginners get plain English, advanced users get proper terminology
- Celebrates understanding ("That's exactly the right instinct")
- Never condescending, never dumps more than one new concept at a time

### Response Format Rules
- Max ~220 words for explanations, unless delivering a structured full lesson
- **Bold** for key terms on first use
- Line breaks between distinct concepts
- Ends most responses with either a check-in question or an offer to continue
- Lesson format: Concept → Chart example (referencing current ticker) → Check-in question

### Lesson Flow
```
1. Tutor sends opening message using lesson-specific prompt
2. Introduces the concept in 2–3 sentences
3. Connects it to the current chart ("On {TICKER} right now, you can see...")
4. Asks a check-in question
5. User responds
6. Tutor confirms or clarifies, then continues
7. After 3–4 exchanges, offers to mark the lesson complete
```

### Out-of-Scope Handling
> "I'm focused on trading education — happy to help with any chart, concept, or lesson though. What would you like to learn?"

### Financial Advice Guardrail
All trade setups must use distancing language:
- "A swing trader might look for..."
- "In a textbook example of this pattern..."
- "This setup would typically be described as..."

---

## 10. Quiz System — Full Specification

### 10.1 Quiz Types Summary

| Type | Trigger | Questions | Pass Threshold | Retakes |
|---|---|---|---|---|
| Lesson Quiz | Lesson marked complete | 3–5 | 70% | Unlimited |
| Module Quiz | All module lessons complete | 10–15 | 70% | Unlimited |
| Final Exam | All 6 modules complete | 30 | 75% | Unlimited |

### 10.2 Question Types

**Multiple Choice (A/B/C/D)**
- 4 options, exactly one correct
- Rendered as a 2×2 button grid
- On submit: correct button turns green, incorrect selection turns red
- Explanation shown in a card below

**True / False**
- Two large buttons: TRUE / FALSE
- Same feedback behavior as multiple choice

**Open Answer** *(intermediate/advanced only)*
- Free-text input with a "Submit" button
- Graded by a lightweight Anthropic API call using `acceptableKeywords`
- Returns `{ correct: boolean, feedback: string }` — both shown to user
- If grading API fails, defaults to "marked as correct" with a note

### 10.3 Quiz Session Flow
```
User clicks "Take Quiz"
  → Navigate to /quiz/lesson/:lessonId (or /quiz/module/:moduleId or /quiz/final)
  → Load questions from curriculum data
  → For each question:
      → Render QuizCard
      → User selects or types answer → Submit
      → Show correct/wrong indicator + explanation
      → "Next →" button advances
  → After final question:
      → Calculate score
      → Save QuizAttempt to localStorage
      → Award XP if passed
      → Navigate to /results/:attemptId
```

### 10.4 Results Page Content
- Score display: "8 / 10 — 80%"
- PASSED / FAILED badge
- Per-question breakdown: question, user's answer, correct answer, explanation
- If passed: "Continue to next lesson →" or "Back to curriculum"
- If failed: "Review lesson →" and "Retake quiz →"
- Best score shown on retakes

### 10.5 Quiz Data Requirements
- Every lesson must have a minimum of **3 `quizQuestions`**
- Module quiz questions are defined in each `Module` object as `moduleQuizQuestions` (10–15 items)
- Final exam is in `src/data/finalExam.ts` (30 items spanning all 6 modules)

### 10.6 Question Quality Rules
- Questions must test understanding, not word-for-word memorization
- Distractors (wrong answers) must be plausible — not obviously wrong
- At least one question per lesson should be scenario-based ("given this setup, what would you expect?")
- No two consecutive questions from the same narrow sub-topic
- True/False questions must avoid double negatives

---

## 11. Error Handling & Edge Cases

| Scenario | Behavior |
|---|---|
| API key missing or empty | Banner at top of tutor panel: "Add your Anthropic API key to `.env` to enable the AI tutor" |
| API 429 rate limit | In-chat: "I'm getting too many requests — please wait a moment and try again." |
| API network error | In-chat error message with a Retry button |
| TradingView widget fails to load | "Chart unavailable" placeholder with a Reload button |
| Invalid ticker entered | TradingView shows its own error; tutor notes "That ticker didn't load — try a valid symbol like AAPL or SPY" |
| localStorage quota exceeded | Catch error, trim oldest 20 messages, show a toast: "Storage nearly full — oldest chat messages trimmed" |
| User navigates to locked quiz URL directly | Redirect to `/curriculum` with a toast: "Complete the lesson first to unlock this quiz" |
| Open-answer grading API fails | Default to correct + show: "Answer recorded — review the explanation to double-check your understanding" |
| Returning user with corrupted localStorage | Catch JSON parse errors, reset to defaults, show: "Progress data was reset due to a storage error" |

---

## 12. Accessibility

All interactive elements must meet **WCAG 2.1 AA** as a baseline:

- Full keyboard navigation (Tab, Enter, Space, Arrow keys in option groups)
- Visible focus rings on all focusable elements (no `outline: none` without replacement)
- Color is never the sole indicator of state — icons and labels always accompany color changes
- ARIA labels on all icon-only buttons (`aria-label="Send message"`, etc.)
- Chat messages announced via `aria-live="polite"` region
- Quiz answer options use `role="radio"` within a `role="radiogroup"`
- Correct/incorrect feedback communicated via both color and text/icon
- All images and icons have `alt` text or `aria-hidden="true"` if decorative

---

## 13. Design Direction

**Aesthetic:** Dark terminal / trading floor — industrial precision with neon accents. Not a generic SaaS dashboard.

### Color Palette
```css
--bg:        #0a0c0f   /* near-black background */
--surface:   #111318   /* panel surfaces */
--surface2:  #181c22   /* inputs, bubbles, cards */
--border:    #1e2530   /* all dividers */
--accent:    #00e5a0   /* green — AI, correct, complete */
--accent2:   #3b7fff   /* blue — user messages, active state */
--warn:      #ff6b35   /* orange — warnings, key terms */
--red:       #ff3d5a   /* red — wrong answers, risk references */
--text:      #e2e8f0   /* primary text */
--muted:     #5a6478   /* secondary text */
--gold:      #f5c542   /* XP, streaks */
```

### Typography
- Headings & UI labels: `Syne` (700–800 weight)
- Tickers, prices, monospace data: `Space Mono`
- Chat body copy: `Syne` 400, 14px, 1.6 line-height

### Component Visual Rules
- 1px solid borders, no box shadows
- Border-radius: 4px inputs/chips, 6px cards, 2px pills
- Quiz answer options: neutral border at rest, no hover color before submission, green/red only after submit
- Progress bars: `--accent` fill on `--surface2` track
- Module cards: colored left border using each module's `color` value
- Animated typing indicator: 3 pulsing dots via CSS `@keyframes`
- XP displayed in header in `--gold`

---

## 14. Legal

### Disclaimer (footer on all pages)
> **Educational purposes only.** TradeIQ is not a financial advisor. Nothing on this platform constitutes financial, investment, or trading advice. All examples are for educational purposes only. Trading involves significant risk of loss and may not be suitable for all investors.

---

## 15. Out of Scope (v1)

- User accounts or cloud-synced progress (localStorage only)
- Paper trading simulator or real portfolio tracking
- Broker integration or trade execution of any kind
- Mobile-native app (responsive web only)
- AI annotation drawn directly on the TradingView chart
- Backtesting engine
- Stock screeners or watchlists
- Social features, community, or leaderboards
- Push notifications or email reminders
- Timed quizzes

---

## 16. Future Enhancements (v2+)

- **Chart annotation** — AI draws support/resistance lines via TradingView's drawing API
- **Paper trade simulator** — user enters a hypothetical trade, AI tracks P&L and coaches the exit
- **Scenario replay** — load a historical chart moment, AI walks through what happened and why
- **User accounts** — cloud-sync progress via Supabase or Firebase Auth
- **Spaced repetition** — re-surface weak quiz topics automatically based on low scores
- **Multi-asset tracks** — dedicated learning paths for Crypto, Forex, Commodities
- **Leaderboard** — opt-in XP rankings
- **Mobile app** — React Native port
- **Backend proxy** — move API calls server-side so the key is never exposed client-side

---

## 17. Open Questions

| # | Question | Status | Decision / Notes |
|---|---|---|---|
| 1 | TradingView futures symbols (e.g. /ES) | ✅ Resolved | Use `CME_MINI:ES1!` format; normalize shorthand on input |
| 2 | Quick actions: auto-send or pre-fill chat input? | ✅ Resolved | Auto-send for faster UX |
| 3 | "Quiz Me" — separate tab or inline in tutor? | ✅ Resolved | Ad-hoc in tutor panel; structured quizzes have their own page |
| 4 | Off-topic tutor questions | ✅ Resolved | Polite redirect in system prompt |
| 5 | Lesson progress reset on ticker/TF change? | ✅ Resolved | Progress persists independently of chart state |
| 6 | API key security in production | ⚠️ Open | Must proxy through backend before any public deployment |
| 7 | Module quiz requires passing lesson quizzes first? | ✅ Resolved | No — module quiz only requires lesson *completion*, not quiz pass |
| 8 | Max conversation history sent to API | ✅ Resolved | Last 20 messages |
| 9 | Should the final exam be timed? | ✅ Resolved | No — reduces anxiety for learners in v1 |
| 10 | How to handle users who skip onboarding via direct URL? | ⚠️ Open | Default to beginner level; show a level prompt in tutor panel |
| 11 | Should module 6 (Psychology) be available before modules 4–5? | ⚠️ Open | Leaning yes — psychology applies at any stage |
| 12 | Streak: reset to 0 after 1 missed day or grace period? | ⚠️ Open | Recommend 1-day grace period to reduce frustration |

---

*Document version: 3.0 — full gap analysis, quiz system, onboarding, error handling, accessibility, XP, and legal added*
