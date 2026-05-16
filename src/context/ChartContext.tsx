import { createContext, useContext, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types for chart drawing commands
// ---------------------------------------------------------------------------

export interface DrawLineCommand {
  type: 'line';
  price: number;
  color: string;
  label: string;
}

export interface DrawTrendlineCommand {
  type: 'trendline';
  time1: number;
  price1: number;
  time2: number;
  price2: number;
  color: string;
  label: string;
}

export interface DrawMarkerCommand {
  type: 'marker';
  time: number;
  position: 'aboveBar' | 'belowBar';
  color: string;
  text: string;
}

export type DrawCommand = DrawLineCommand | DrawTrendlineCommand | DrawMarkerCommand;

// ---------------------------------------------------------------------------
// Chart API interface (implemented by the chart component)
// ---------------------------------------------------------------------------

export interface ChartDrawingAPI {
  addHorizontalLine: (price: number, color?: string, label?: string) => void;
  addTrendline: (time1: number, price1: number, time2: number, price2: number, color?: string, label?: string) => void;
  addMarker: (time: number, position: 'aboveBar' | 'belowBar', color: string, text: string) => void;
  clearAnnotations: () => void;
}

export interface ChartDataSummary {
  currentPrice: number;
  high: number;
  low: number;
  open: number;
  recentHighs: number[];
  recentLows: number[];
  firstBarTime: number;
  lastBarTime: number;
  recentSwings: Array<{ time: number; price: number; type: 'high' | 'low' }>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ChartContextValue {
  registerAPI: (api: ChartDrawingAPI) => void;
  executeCommands: (commands: DrawCommand[]) => void;
  clearChart: () => void;
  setDataSummary: (summary: ChartDataSummary) => void;
  getDataSummary: () => ChartDataSummary | null;
}

const ChartContext = createContext<ChartContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ChartProvider({ children }: { children: ReactNode }) {
  const apiRef = useRef<ChartDrawingAPI | null>(null);
  const dataSummaryRef = useRef<ChartDataSummary | null>(null);

  const registerAPI = useCallback((api: ChartDrawingAPI) => {
    apiRef.current = api;
  }, []);

  const executeCommands = useCallback((commands: DrawCommand[]) => {
    const api = apiRef.current;
    if (!api) return;

    for (const cmd of commands) {
      if (cmd.type === 'line') {
        api.addHorizontalLine(cmd.price, cmd.color, cmd.label);
      } else if (cmd.type === 'trendline') {
        api.addTrendline(cmd.time1, cmd.price1, cmd.time2, cmd.price2, cmd.color, cmd.label);
      } else if (cmd.type === 'marker') {
        api.addMarker(cmd.time, cmd.position, cmd.color, cmd.text);
      }
    }
  }, []);

  const clearChart = useCallback(() => {
    apiRef.current?.clearAnnotations();
  }, []);

  const setDataSummary = useCallback((summary: ChartDataSummary) => {
    dataSummaryRef.current = summary;
  }, []);

  const getDataSummary = useCallback((): ChartDataSummary | null => {
    return dataSummaryRef.current;
  }, []);

  return (
    <ChartContext.Provider value={{ registerAPI, executeCommands, clearChart, setDataSummary, getDataSummary }}>
      {children}
    </ChartContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChartDrawing(): ChartContextValue {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error('useChartDrawing must be used inside <ChartProvider>');
  return ctx;
}
