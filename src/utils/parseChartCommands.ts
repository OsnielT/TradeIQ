import type { DrawCommand } from '../context/ChartContext.tsx';

// ---------------------------------------------------------------------------
// Parse chart annotation commands from AI tutor responses
//
// The AI can embed these commands in its response text:
//   [DRAW_LINE price="450.00" color="#00e5a0" label="Support"]
//   [DRAW_TRENDLINE time1="1700000" price1="440" time2="1710000" price2="460" color="#3b7fff" label="Uptrend"]
//   [DRAW_MARKER time="1700000000" position="above" color="#ff6b35" text="Entry"]
//   [CLEAR_CHART]
//
// The parser is lenient — handles extra spaces, flexible quoting, etc.
// Commands are stripped from the displayed message text.
// ---------------------------------------------------------------------------

const LINE_REGEX = /\[\s*DRAW[_\-\s]LINE\s+price\s*=\s*"?([^"\]\s]+)"?\s*(?:color\s*=\s*"?([^"\]\s]*)"?)?\s*(?:label\s*=\s*"([^"]*)")?\s*\]/gi;
const TRENDLINE_REGEX = /\[\s*DRAW[_\-\s]TRENDLINE\s+time1\s*=\s*"?([^"\]\s]+)"?\s+price1\s*=\s*"?([^"\]\s]+)"?\s+time2\s*=\s*"?([^"\]\s]+)"?\s+price2\s*=\s*"?([^"\]\s]+)"?\s*(?:color\s*=\s*"?([^"\]\s]*)"?)?\s*(?:label\s*=\s*"([^"]*)")?\s*\]/gi;
const MARKER_REGEX = /\[\s*DRAW[_\-\s]MARKER\s+time\s*=\s*"?([^"\]\s]+)"?\s+position\s*=\s*"?([^"\]\s]*)"?\s*(?:color\s*=\s*"?([^"\]\s]*)"?)?\s*(?:text\s*=\s*"([^"]*)")?\s*\]/gi;
const CLEAR_REGEX = /\[\s*CLEAR[_\-\s]CHART\s*\]/gi;

// Catch-all to strip any command brackets from display
const ALL_COMMANDS_REGEX = /\[\s*(?:DRAW[_\-\s]LINE|DRAW[_\-\s]TRENDLINE|DRAW[_\-\s]MARKER|CLEAR[_\-\s]CHART)\s*[^\]]*\]/gi;

export interface ParseResult {
  cleanText: string;
  commands: DrawCommand[];
  shouldClear: boolean;
}

export function parseChartCommands(text: string): ParseResult {
  const commands: DrawCommand[] = [];
  let shouldClear = false;

  // Check for CLEAR_CHART
  if (CLEAR_REGEX.test(text)) {
    shouldClear = true;
  }
  CLEAR_REGEX.lastIndex = 0;

  // Parse DRAW_LINE commands
  let match: RegExpExecArray | null;
  while ((match = LINE_REGEX.exec(text)) !== null) {
    const price = parseFloat(match[1]);
    if (!isNaN(price)) {
      commands.push({
        type: 'line',
        price,
        color: match[2] || '#3b7fff',
        label: match[3] || '',
      });
    }
  }

  // Parse DRAW_TRENDLINE commands
  while ((match = TRENDLINE_REGEX.exec(text)) !== null) {
    const time1 = parseInt(match[1], 10);
    const price1 = parseFloat(match[2]);
    const time2 = parseInt(match[3], 10);
    const price2 = parseFloat(match[4]);
    if (!isNaN(time1) && !isNaN(price1) && !isNaN(time2) && !isNaN(price2)) {
      commands.push({
        type: 'trendline',
        time1,
        price1,
        time2,
        price2,
        color: match[5] || '#3b7fff',
        label: match[6] || '',
      });
    }
  }

  // Parse DRAW_MARKER commands
  while ((match = MARKER_REGEX.exec(text)) !== null) {
    const time = parseInt(match[1], 10);
    const posRaw = match[2]?.toLowerCase();
    const position: 'aboveBar' | 'belowBar' = posRaw === 'below' ? 'belowBar' : 'aboveBar';
    if (!isNaN(time)) {
      commands.push({
        type: 'marker',
        time,
        position,
        color: match[3] || '#ff6b35',
        text: match[4] || '',
      });
    }
  }

  // Strip all commands from the displayed text
  const cleanText = text
    .replace(ALL_COMMANDS_REGEX, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { cleanText, commands, shouldClear };
}
