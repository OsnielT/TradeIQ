import { useEffect, useRef, useState, useCallback } from 'react';
import type { RefObject } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  LineSeries,
  BarSeries,
  HistogramSeries,
  createSeriesMarkers,
} from 'lightweight-charts';
import type {
  IChartApi,
  ISeriesApi,
  SeriesType,
  CandlestickData,
  LineData,
  BarData,
  Time,
  ISeriesMarkersPluginApi,
  SeriesMarker,
} from 'lightweight-charts';
import type { Timeframe } from '../types/index.ts';
import { fetchOHLC } from '../services/marketData.ts';
import type { OHLCBar } from '../services/marketData.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChartAnnotation {
  type: 'horizontal-line' | 'marker';
  price?: number;
  time?: number;
  color?: string;
  label?: string;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

const CHART_COLORS = {
  background: '#0a0c0f',
  text: '#5a6478',
  grid: '#1e2530',
  upColor: '#00e5a0',
  downColor: '#ff3d5a',
  borderUp: '#00e5a0',
  borderDown: '#ff3d5a',
  wickUp: '#00e5a0',
  wickDown: '#ff3d5a',
  volumeUp: 'rgba(0, 229, 160, 0.2)',
  volumeDown: 'rgba(255, 61, 90, 0.2)',
  lineColor: '#3b7fff',
  crosshair: '#5a6478',
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChart(
  containerRef: RefObject<HTMLDivElement | null>,
  ticker: string,
  timeframe: Timeframe,
  chartType: 'candlestick' | 'line' | 'bar',
) {
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const barsRef = useRef<OHLCBar[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Create chart instance ────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.background },
        textColor: CHART_COLORS.text,
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid },
        horzLines: { color: CHART_COLORS.grid },
      },
      crosshair: {
        vertLine: { color: CHART_COLORS.crosshair, labelBackgroundColor: '#1e2530' },
        horzLine: { color: CHART_COLORS.crosshair, labelBackgroundColor: '#1e2530' },
      },
      timeScale: {
        borderColor: CHART_COLORS.grid,
        timeVisible: ['1m', '5m', '15m', '1H', '4H'].includes(timeframe),
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.grid,
      },
      width: container.clientWidth,
      height: container.clientHeight,
    });

    chartRef.current = chart;

    // Resize observer
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update series type when chartType changes ────────────────────────────

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Remove existing series
    if (mainSeriesRef.current) {
      chart.removeSeries(mainSeriesRef.current);
      mainSeriesRef.current = null;
    }
    if (volumeSeriesRef.current) {
      chart.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }

    // Add main series based on chart type
    if (chartType === 'candlestick') {
      mainSeriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: CHART_COLORS.upColor,
        downColor: CHART_COLORS.downColor,
        borderUpColor: CHART_COLORS.borderUp,
        borderDownColor: CHART_COLORS.borderDown,
        wickUpColor: CHART_COLORS.wickUp,
        wickDownColor: CHART_COLORS.wickDown,
      });
    } else if (chartType === 'line') {
      mainSeriesRef.current = chart.addSeries(LineSeries, {
        color: CHART_COLORS.lineColor,
        lineWidth: 2,
      });
    } else {
      mainSeriesRef.current = chart.addSeries(BarSeries, {
        upColor: CHART_COLORS.upColor,
        downColor: CHART_COLORS.downColor,
      });
    }

    // Create markers plugin for the main series
    markersPluginRef.current = createSeriesMarkers(mainSeriesRef.current, []);

    // Add volume series
    volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // Re-apply data if we have it
    if (barsRef.current.length > 0) {
      applyData(barsRef.current, chartType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType]);

  // ── Fetch data when ticker/timeframe changes ─────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const bars = await fetchOHLC(ticker, timeframe);
        if (cancelled) return;

        barsRef.current = bars;
        applyData(bars, chartType);

        // Update time visibility
        chartRef.current?.timeScale().applyOptions({
          timeVisible: ['1m', '5m', '15m', '1H', '4H'].includes(timeframe),
        });

        chartRef.current?.timeScale().fitContent();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, timeframe]);

  // ── Apply data to series ─────────────────────────────────────────────────

  function applyData(bars: OHLCBar[], type: 'candlestick' | 'line' | 'bar') {
    const mainSeries = mainSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!mainSeries) return;

    if (type === 'line') {
      const lineData: LineData[] = bars.map((b) => ({
        time: b.time as Time,
        value: b.close,
      }));
      mainSeries.setData(lineData);
    } else if (type === 'candlestick') {
      const candleData: CandlestickData[] = bars.map((b) => ({
        time: b.time as Time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }));
      mainSeries.setData(candleData);
    } else {
      const barData: BarData[] = bars.map((b) => ({
        time: b.time as Time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }));
      mainSeries.setData(barData);
    }

    // Volume
    if (volumeSeries) {
      const volData = bars.map((b) => ({
        time: b.time as Time,
        value: b.volume ?? 0,
        color: b.close >= b.open ? CHART_COLORS.volumeUp : CHART_COLORS.volumeDown,
      }));
      volumeSeries.setData(volData);
    }
  }

  // ── Public API: draw annotations (for AI tutor) ──────────────────────────

  // Track trendline series so we can remove them on clear
  const trendlineSeriesRef = useRef<ISeriesApi<SeriesType>[]>([]);

  const addHorizontalLine = useCallback((price: number, color = '#3b7fff', label = '') => {
    const series = mainSeriesRef.current;
    if (!series) return;

    series.createPriceLine({
      price,
      color,
      lineWidth: 1,
      lineStyle: 2, // dashed
      axisLabelVisible: true,
      title: label,
    });
  }, []);

  const addTrendline = useCallback((time1: number, price1: number, time2: number, price2: number, color = '#3b7fff', label = '') => {
    const chart = chartRef.current;
    if (!chart) return;

    const trendSeries = chart.addSeries(LineSeries, {
      color,
      lineWidth: 2,
      lineStyle: 0, // solid
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
      title: label,
    });

    trendSeries.setData([
      { time: time1 as Time, value: price1 },
      { time: time2 as Time, value: price2 },
    ]);

    trendlineSeriesRef.current.push(trendSeries);
  }, []);

  const addMarker = useCallback((time: number, position: 'aboveBar' | 'belowBar', color: string, text: string) => {
    const plugin = markersPluginRef.current;
    if (!plugin) return;

    const existing = plugin.markers() as SeriesMarker<Time>[];
    const newMarker: SeriesMarker<Time> = {
      time: time as Time,
      position,
      color,
      shape: position === 'aboveBar' ? 'arrowDown' : 'arrowUp',
      text,
    };
    plugin.setMarkers([...existing, newMarker]);
  }, []);

  const clearAnnotations = useCallback(() => {
    const chart = chartRef.current;
    const series = mainSeriesRef.current;
    if (!series) return;

    // Remove all price lines
    const priceLines = (series as unknown as { priceLines: () => unknown[] }).priceLines?.() ?? [];
    for (const line of priceLines) {
      series.removePriceLine(line as never);
    }

    // Clear markers via plugin
    markersPluginRef.current?.setMarkers([]);

    // Remove trendline series
    if (chart) {
      for (const ts of trendlineSeriesRef.current) {
        chart.removeSeries(ts);
      }
      trendlineSeriesRef.current = [];
    }
  }, []);

  const getBars = useCallback(() => barsRef.current, []);

  return {
    isLoading,
    error,
    chart: chartRef,
    addHorizontalLine,
    addTrendline,
    addMarker,
    clearAnnotations,
    getBars,
  };
}
