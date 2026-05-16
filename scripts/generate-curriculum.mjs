#!/usr/bin/env node
// Generates src/data/curriculum.ts via 6 Gemini API calls (one per module).
// Free API key: aistudio.google.com → Get API key (no payment method needed)
// Add to .env: GEMINI_API_KEY=your_key_here
// Run: node --env-file=.env scripts/generate-curriculum.mjs
// Review output, then: npm run typecheck && git add src/data/curriculum.ts && git commit

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dir, '..', 'src', 'data', 'curriculum.ts');
const MODEL = 'gemini-2.0-flash-lite';

// All IDs, tickers, and timeframes are the source of truth here — Gemini only fills in content.
const MODULES_SPEC = [
  {
    id: 'module-1',
    title: 'Fundamentals',
    description: 'Learn how markets work and how to read a chart from scratch.',
    color: '#00e5a0',
    icon: '📈',
    lessons: [
      { id: 'how-markets-work',     title: 'How Markets Work',             ticker: 'AMEX:SPY',       tf: '1D', mins: 8  },
      { id: 'what-is-a-chart',      title: 'What Is a Candlestick Chart?', ticker: 'NASDAQ:AAPL',    tf: '1D', mins: 8  },
      { id: 'reading-candles',      title: 'Reading Candles',              ticker: 'NASDAQ:AAPL',    tf: '1D', mins: 10 },
      { id: 'support-resistance',   title: 'Support & Resistance',         ticker: 'NASDAQ:AAPL',    tf: '1W', mins: 12 },
      { id: 'trend-identification', title: 'Trend Identification',         ticker: 'AMEX:SPY',       tf: '1D', mins: 10 },
      { id: 'volume-basics',        title: 'Volume Basics',                ticker: 'NASDAQ:AAPL',    tf: '1D', mins: 8  },
    ],
  },
  {
    id: 'module-2',
    title: 'Technical Analysis',
    description: 'Master the indicators and patterns that professional traders use every day.',
    color: '#3b7fff',
    icon: '📊',
    lessons: [
      { id: 'moving-averages',  title: 'Moving Averages (SMA vs EMA)',        ticker: 'AMEX:SPY',    tf: '1D', mins: 12 },
      { id: 'rsi',              title: 'RSI — Overbought & Oversold',          ticker: 'NASDAQ:AAPL', tf: '1D', mins: 10 },
      { id: 'macd',             title: 'MACD — Momentum & Crossovers',         ticker: 'AMEX:SPY',    tf: '1D', mins: 12 },
      { id: 'candle-patterns',  title: 'Candlestick Patterns',                 ticker: 'NASDAQ:AAPL', tf: '1D', mins: 15 },
      { id: 'chart-patterns',   title: 'Chart Patterns',                       ticker: 'AMEX:SPY',    tf: '1W', mins: 15 },
      { id: 'breakouts',        title: 'Breakouts & Retests',                  ticker: 'NASDAQ:NVDA', tf: '1D', mins: 12 },
      { id: 'confluence',       title: 'Confluence — Stacking the Odds',       ticker: 'AMEX:SPY',    tf: '1D', mins: 15 },
    ],
  },
  {
    id: 'module-3',
    title: 'Swing Trading',
    description: 'Learn to capture multi-day price moves with a systematic, rule-based approach.',
    color: '#ff6b35',
    icon: '🎯',
    lessons: [
      { id: 'what-is-swing-trading', title: 'What Is Swing Trading?',           ticker: 'AMEX:SPY',    tf: '1D', mins: 10 },
      { id: 'swing-setups',          title: 'Identifying Swing Setups',         ticker: 'NASDAQ:AAPL', tf: '1D', mins: 15 },
      { id: 'entry-triggers',        title: 'Entry Triggers & Confirmation',    ticker: 'AMEX:SPY',    tf: '4H', mins: 15 },
      { id: 'stop-losses',           title: 'Setting Stop-Losses',              ticker: 'NASDAQ:AAPL', tf: '1D', mins: 12 },
      { id: 'profit-targets',        title: 'Setting Profit Targets',           ticker: 'AMEX:SPY',    tf: '1D', mins: 12 },
      { id: 'trade-management',      title: 'Managing Open Trades',             ticker: 'AMEX:SPY',    tf: '4H', mins: 15 },
      { id: 'position-sizing',       title: 'Position Sizing & Risk Per Trade', ticker: 'AMEX:SPY',    tf: '1D', mins: 15 },
      { id: 'swing-journal',         title: 'Building a Trade Journal',         ticker: 'AMEX:SPY',    tf: '1D', mins: 10 },
    ],
  },
  {
    id: 'module-4',
    title: 'Options',
    description: 'Understand options contracts from the basics to multi-leg strategies.',
    color: '#f5c542',
    icon: '⚡',
    lessons: [
      { id: 'what-is-an-option',    title: 'What Is an Option?',                        ticker: 'NASDAQ:AAPL', tf: '1D', mins: 12 },
      { id: 'calls-and-puts',       title: 'Calls vs Puts',                             ticker: 'NASDAQ:AAPL', tf: '1D', mins: 12 },
      { id: 'strike-and-expiry',    title: 'Strike Price & Expiration',                 ticker: 'AMEX:SPY',    tf: '1D', mins: 12 },
      { id: 'itm-otm-atm',          title: 'ITM / OTM / ATM',                           ticker: 'NASDAQ:AAPL', tf: '1D', mins: 10 },
      { id: 'theta-decay',          title: 'Theta Decay — Time is the Enemy',           ticker: 'AMEX:SPY',    tf: '1D', mins: 12 },
      { id: 'the-greeks',           title: 'The Greeks (Delta, Gamma, Vega, Theta)',     ticker: 'AMEX:SPY',    tf: '1D', mins: 15 },
      { id: 'buying-options',       title: 'Buying Calls & Puts (Directional Plays)',   ticker: 'NASDAQ:AAPL', tf: '1D', mins: 15 },
      { id: 'covered-calls',        title: 'Covered Calls & Cash-Secured Puts',         ticker: 'NASDAQ:AAPL', tf: '1W', mins: 15 },
      { id: 'spreads',              title: 'Debit & Credit Spreads',                    ticker: 'AMEX:SPY',    tf: '1D', mins: 18 },
      { id: 'iv-and-options-chain', title: 'IV & Reading an Options Chain',             ticker: 'AMEX:SPY',    tf: '1D', mins: 15 },
    ],
  },
  {
    id: 'module-5',
    title: 'Futures',
    description: 'Learn futures contracts, leverage, and how professional traders use them.',
    color: '#ff3d5a',
    icon: '🔮',
    lessons: [
      { id: 'what-are-futures',     title: 'What Are Futures Contracts?',              ticker: 'CME_MINI:ES1!', tf: '1D', mins: 12 },
      { id: 'futures-vs-stocks',    title: 'Futures vs Stocks',                        ticker: 'CME_MINI:ES1!', tf: '1D', mins: 10 },
      { id: 'futures-markets',      title: 'Common Futures Markets (/ES /NQ /CL /GC)', ticker: 'CME_MINI:ES1!', tf: '1D', mins: 12 },
      { id: 'futures-margin',       title: 'Margin, Leverage & Risk',                  ticker: 'CME_MINI:ES1!', tf: '1D', mins: 15 },
      { id: 'contract-expiry',      title: 'Contract Expiration & Rollover',           ticker: 'CME_MINI:ES1!', tf: '1D', mins: 12 },
      { id: 'futures-for-hedging',  title: 'Using Futures to Hedge',                   ticker: 'CME_MINI:ES1!', tf: '1W', mins: 15 },
      { id: 'dom-and-ladder',       title: 'Reading the DOM / Futures Ladder',         ticker: 'CME_MINI:ES1!', tf: '5m', mins: 15 },
      { id: 'futures-trading-plan', title: 'Building a Futures Trading Plan',          ticker: 'CME_MINI:ES1!', tf: '1D', mins: 15 },
    ],
  },
  {
    id: 'module-6',
    title: 'Trading Psychology & Risk',
    description: 'Master the mental game and risk principles that separate profitable traders from the rest.',
    color: '#a78bfa',
    icon: '🧠',
    lessons: [
      { id: 'trading-mindset', title: 'The Trading Mindset',                    ticker: 'AMEX:SPY', tf: '1D', mins: 10 },
      { id: 'fear-and-greed',  title: 'Fear, Greed & Emotional Discipline',     ticker: 'AMEX:SPY', tf: '1D', mins: 12 },
      { id: 'risk-management', title: 'Risk Management Principles',             ticker: 'AMEX:SPY', tf: '1D', mins: 15 },
      { id: 'common-mistakes', title: 'The 10 Most Common Beginner Mistakes',   ticker: 'AMEX:SPY', tf: '1D', mins: 12 },
      { id: 'building-a-plan', title: 'Building Your Personal Trading Plan',    ticker: 'AMEX:SPY', tf: '1D', mins: 15 },
    ],
  },
];

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

function buildPrompt(mod) {
  const lessonList = mod.lessons
    .map(l => `    - id="${l.id}" | title="${l.title}" | ticker=${l.ticker} | timeframe=${l.tf}`)
    .join('\n');

  return `You are generating structured data for a trading education app called TradeIQ.

Generate content for this module:
  moduleId: "${mod.id}"
  title: "${mod.title}"
  description: "${mod.description}"

Lessons — IDs, tickers, and timeframes are FIXED. Do NOT change them:
${lessonList}

Per LESSON, generate:
1. "description": 1-sentence summary of what the student learns (15-25 words).
2. "lessonPrompt": 3-5 sentences of AI tutor instructions written as directives to the AI ("Teach the user..."). Reference the specific ticker where helpful. This is injected into the system prompt when the lesson is active.
3. "quizQuestions": exactly 4 questions. Rules:
   - Mix of types: at least 2 multiple_choice, at least 1 true_false; open_answer is optional
   - At least 1 question must be scenario-based ("Given this chart setup, what would you expect?")
   - Wrong answer choices must be plausible, not obviously wrong

Per MODULE, generate:
4. "moduleQuizQuestions": exactly 12 questions covering ALL lessons (~2 per lesson). Same type rules.

STRICT FIELD RULES — any violation will break the TypeScript build:
- Every question MUST have: "id", "type", "question", "explanation", "lessonRef"
- "type" must be exactly one of: "multiple_choice", "true_false", "open_answer"
- multiple_choice: "options" MUST be an array of EXACTLY 4 strings; "correctIndex" MUST be 0, 1, 2, or 3
- true_false: "correctAnswer" MUST be boolean true or false — NOT the string "true" or "false"
- open_answer: "acceptableKeywords" MUST be an array of 3-6 key term strings
- "lessonRef": must be the exact lesson id string from the list above
- Per-lesson question IDs format: "{lessonId}-q1", "{lessonId}-q2", etc.
- Module question IDs format: "${mod.id}-mq1", "${mod.id}-mq2", etc.
- All IDs must be unique across the entire response

Return this exact JSON shape (no extra fields, no markdown):
{
  "lessons": [
    {
      "id": "<lessonId>",
      "description": "<string>",
      "lessonPrompt": "<string>",
      "quizQuestions": []
    }
  ],
  "moduleQuizQuestions": []
}`;
}

function validateQuestion(q, validLessonIds, errors) {
  const label = q.id ?? '(no id)';
  if (!q.id) errors.push('Question missing id');
  if (!q.type) errors.push(`${label}: missing type`);
  if (!q.question) errors.push(`${label}: missing question text`);
  if (!q.explanation) errors.push(`${label}: missing explanation`);
  if (!q.lessonRef) errors.push(`${label}: missing lessonRef`);
  else if (!validLessonIds.has(q.lessonRef)) errors.push(`${label}: lessonRef "${q.lessonRef}" is not a valid lesson id`);

  if (q.type === 'multiple_choice') {
    if (!Array.isArray(q.options) || q.options.length !== 4)
      errors.push(`${label}: options must be array of exactly 4 strings`);
    if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3)
      errors.push(`${label}: correctIndex must be 0-3`);
  }
  if (q.type === 'true_false') {
    if (typeof q.correctAnswer !== 'boolean')
      errors.push(`${label}: correctAnswer must be boolean (got ${typeof q.correctAnswer}: ${q.correctAnswer})`);
  }
  if (q.type === 'open_answer') {
    if (!Array.isArray(q.acceptableKeywords) || q.acceptableKeywords.length < 1)
      errors.push(`${label}: acceptableKeywords must be a non-empty array`);
  }
}

function validate(modSpec, data) {
  const errors = [];
  if (!Array.isArray(data.lessons)) { errors.push('lessons must be an array'); return errors; }
  if (!Array.isArray(data.moduleQuizQuestions)) { errors.push('moduleQuizQuestions must be an array'); return errors; }

  const validIds = new Set(modSpec.lessons.map(l => l.id));

  for (const lMeta of modSpec.lessons) {
    const gen = data.lessons.find(l => l.id === lMeta.id);
    if (!gen) { errors.push(`Missing lesson: ${lMeta.id}`); continue; }
    if (!gen.description) errors.push(`${lMeta.id}: missing description`);
    if (!gen.lessonPrompt) errors.push(`${lMeta.id}: missing lessonPrompt`);
    const qs = gen.quizQuestions;
    if (!Array.isArray(qs) || qs.length < 3)
      errors.push(`${lMeta.id}: need >= 3 quizQuestions, got ${qs?.length ?? 0}`);
    for (const q of qs ?? []) validateQuestion(q, validIds, errors);
  }

  if (data.moduleQuizQuestions.length < 10)
    errors.push(`moduleQuizQuestions: need >= 10, got ${data.moduleQuizQuestions.length}`);
  for (const q of data.moduleQuizQuestions) validateQuestion(q, validIds, errors);

  return errors;
}

async function generateModule(mod) {
  const raw = await callGemini(buildPrompt(mod));

  let data;
  try {
    data = JSON.parse(raw);
  } catch (_) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Response was not parseable JSON.\nFirst 500 chars:\n${raw.slice(0, 500)}`);
    data = JSON.parse(match[0]);
  }

  const errors = validate(mod, data);
  if (errors.length > 0)
    throw new Error(`Validation errors for ${mod.id}:\n${errors.map(e => '  - ' + e).join('\n')}`);

  return data;
}

function assembleCurriculum(pairs) {
  return pairs.map(([modSpec, genData]) => ({
    id: modSpec.id,
    title: modSpec.title,
    description: modSpec.description,
    color: modSpec.color,
    icon: modSpec.icon,
    lessons: modSpec.lessons.map(lMeta => {
      const gen = genData.lessons.find(l => l.id === lMeta.id);
      return {
        id: lMeta.id,
        title: lMeta.title,
        description: gen.description,
        estimatedMinutes: lMeta.mins,
        suggestedTicker: lMeta.ticker,
        suggestedTimeframe: lMeta.tf,
        lessonPrompt: gen.lessonPrompt,
        quizQuestions: gen.quizQuestions,
      };
    }),
    moduleQuizQuestions: genData.moduleQuizQuestions,
  }));
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY is not set.');
    console.error('Get a free key at: aistudio.google.com → Get API key');
    console.error('Add to .env: GEMINI_API_KEY=your_key_here');
    console.error('Then run: node --env-file=.env scripts/generate-curriculum.mjs');
    process.exit(1);
  }

  console.log(`Model: ${MODEL}`);
  console.log(`Output: ${OUT_PATH}`);
  console.log(`Modules: ${MODULES_SPEC.length} (${MODULES_SPEC.reduce((n, m) => n + m.lessons.length, 0)} lessons total)\n`);

  const pairs = [];

  for (let i = 0; i < MODULES_SPEC.length; i++) {
    const mod = MODULES_SPEC[i];
    process.stdout.write(`[${i + 1}/${MODULES_SPEC.length}] ${mod.title} (${mod.lessons.length} lessons)... `);

    const data = await generateModule(mod);
    pairs.push([mod, data]);

    const lessonQCount = data.lessons.reduce((n, l) => n + (l.quizQuestions?.length ?? 0), 0);
    console.log(`✓  (${lessonQCount} lesson Qs, ${data.moduleQuizQuestions.length} module Qs)`);
  }

  const curriculum = assembleCurriculum(pairs);
  const totalLessons = curriculum.reduce((n, m) => n + m.lessons.length, 0);
  const totalLessonQ = curriculum.reduce((n, m) => n + m.lessons.reduce((nn, l) => nn + l.quizQuestions.length, 0), 0);
  const totalModuleQ = curriculum.reduce((n, m) => n + m.moduleQuizQuestions.length, 0);

  const ts = [
    `import type { Module } from '../types/index.ts';`,
    ``,
    `export const curriculum: Module[] = ${JSON.stringify(curriculum, null, 2)};`,
    ``,
  ].join('\n');

  writeFileSync(OUT_PATH, ts, 'utf8');

  console.log(`\nWrote ${OUT_PATH}`);
  console.log(`  ${totalLessons} lessons | ${totalLessonQ} lesson questions | ${totalModuleQ} module questions`);
  console.log(`\nNext steps:`);
  console.log(`  npm run typecheck`);
  console.log(`  git add src/data/curriculum.ts && git commit -m "feat: add curriculum data"`);
}

main().catch(err => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
