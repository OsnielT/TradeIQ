# TradeIQ

AI-powered trading education platform with an interactive chart and real-time AI tutor.

## Features

- **Interactive Chart** — Lightweight Charts with candlestick/line/bar views, powered by Twelve Data
- **AI Tutor** — Streams explanations and draws directly on the chart (support/resistance lines, trendlines, markers)
- **44-Lesson Curriculum** — 6 modules from beginner to advanced, with quizzes at every level
- **Quick Actions** — One-click buttons to ask the AI to draw trends, identify levels, or quiz you
- **Progress Tracking** — XP, streaks, quiz history, all persisted locally

## Quick Start

```bash
npm install
cp .env.example .env
# Fill in your keys (see below)
npm run dev
```

## AI Tutor Setup (HuggingFace Router)

1. Go to https://huggingface.co/settings/tokens
2. Create a fine-grained token
3. Enable permission: "Make calls to Inference Providers"
4. Copy the token (starts with hf_...)
5. Add to .env: `VITE_HF_TOKEN=hf_your_token_here`

The tutor uses GPT-OSS 120B via Cerebras (fastest free backend).
HuggingFace provides monthly free credits. If you hit the limit,
wait for the next month or add billing at huggingface.co/settings/billing.
Model can be changed in `src/config/aiProvider.ts`.

## Chart Data Setup (Twelve Data)

1. Sign up at https://twelvedata.com (free)
2. Copy your API key from the dashboard
3. Add to .env: `VITE_TWELVE_DATA_KEY=your_key_here`

Free tier: 800 requests/day, 8 requests/minute.

## How the AI Draws on the Chart

The tutor can visually annotate the chart during lessons and conversations:

- **Horizontal lines** — Support/resistance levels, entry/exit zones
- **Trendlines** — Diagonal lines connecting swing points to show trend direction
- **Markers** — Arrows pointing to specific bars (entries, exits, patterns)

The AI sees your actual chart data (current price, swing highs/lows with timestamps) and uses real price levels — never made-up numbers.

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run typecheck    # TypeScript check (run before committing)
npm run lint         # ESLint
```

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite + TypeScript |
| AI | OpenAI SDK → HuggingFace Inference Router (GPT-OSS 120B) |
| Chart | lightweight-charts + Twelve Data API |
| Styling | CSS Modules + custom properties |
| State | React Context + useReducer |
| Persistence | localStorage |
