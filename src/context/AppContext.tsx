import { createContext, useContext, useReducer, useEffect } from 'react';
import type { Dispatch, ReactNode } from 'react';
import type {
  AppState,
  AppMode,
  Timeframe,
  UserLevel,
  Message,
  QuizAnswer,
  UserProgress,
  QuizQuestion,
  QuizType,
} from '../types/index.ts';
import {
  loadProgress,
  saveProgress,
  loadMessages,
  saveMessages,
  loadChartState,
  saveChartState,
} from '../hooks/useProgress.ts';

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type Action =
  | { type: 'SET_TICKER'; ticker: string }
  | { type: 'SET_TIMEFRAME'; timeframe: Timeframe }
  | { type: 'SET_CHART_TYPE'; chartType: 'candlestick' | 'line' | 'bar' }
  | { type: 'SET_MODE'; mode: AppMode }
  | { type: 'SET_LESSON'; moduleId: string | null; lessonId: string | null }
  | { type: 'SET_USER_LEVEL'; level: UserLevel }
  | { type: 'SET_PROGRESS'; progress: UserProgress }
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'SET_MESSAGES'; messages: Message[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | {
      type: 'SET_ACTIVE_QUIZ';
      quiz: {
        quizType: QuizType;
        quizRef: string;
        questions: QuizQuestion[];
        currentIndex: number;
        answers: QuizAnswer[];
        completed: boolean;
      } | null;
    }
  | { type: 'ADVANCE_QUIZ_INDEX' }
  | { type: 'ADD_QUIZ_ANSWER'; answer: QuizAnswer }
  | { type: 'COMPLETE_QUIZ' };

// ---------------------------------------------------------------------------
// Default / initial state
// ---------------------------------------------------------------------------

const DEFAULT_PROGRESS: UserProgress = {
  userLevel: 'beginner',
  completedLessonIds: [],
  lessonQuizAttempts: {},
  moduleQuizAttempts: {},
  finalExamAttempts: [],
  streakDays: 0,
  lastActiveDate: '',
  totalXP: 0,
};

function buildInitialState(): AppState {
  const savedProgress = loadProgress();
  const savedMessages = loadMessages();
  const savedChart = loadChartState();

  return {
    ticker: savedChart?.ticker ?? 'AMEX:SPY',
    timeframe: savedChart?.timeframe ?? '1D',
    chartType: savedChart?.chartType ?? 'candlestick',
    activeMode: 'learn',
    currentModuleId: null,
    currentLessonId: null,
    userLevel: savedProgress?.userLevel ?? 'beginner',
    progress: savedProgress ?? DEFAULT_PROGRESS,
    messages: savedMessages,
    isLoading: false,
    activeQuiz: null,
  };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TICKER':
      return { ...state, ticker: action.ticker };

    case 'SET_TIMEFRAME':
      return { ...state, timeframe: action.timeframe };

    case 'SET_CHART_TYPE':
      return { ...state, chartType: action.chartType };

    case 'SET_MODE':
      return { ...state, activeMode: action.mode };

    case 'SET_LESSON':
      return {
        ...state,
        currentModuleId: action.moduleId,
        currentLessonId: action.lessonId,
        activeMode: action.lessonId ? 'learn' : state.activeMode,
      };

    case 'SET_USER_LEVEL':
      return {
        ...state,
        userLevel: action.level,
        progress: { ...state.progress, userLevel: action.level },
      };

    case 'SET_PROGRESS':
      return {
        ...state,
        progress: action.progress,
        userLevel: action.progress.userLevel,
      };

    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };

    case 'SET_MESSAGES':
      return { ...state, messages: action.messages };

    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };

    case 'SET_ACTIVE_QUIZ':
      return { ...state, activeQuiz: action.quiz };

    case 'ADVANCE_QUIZ_INDEX':
      if (!state.activeQuiz) return state;
      return {
        ...state,
        activeQuiz: {
          ...state.activeQuiz,
          currentIndex: state.activeQuiz.currentIndex + 1,
        },
      };

    case 'ADD_QUIZ_ANSWER':
      if (!state.activeQuiz) return state;
      return {
        ...state,
        activeQuiz: {
          ...state.activeQuiz,
          answers: [...state.activeQuiz.answers, action.answer],
        },
      };

    case 'COMPLETE_QUIZ':
      if (!state.activeQuiz) return state;
      return {
        ...state,
        activeQuiz: { ...state.activeQuiz, completed: true },
      };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, buildInitialState);

  useEffect(() => {
    saveProgress(state.progress);
  }, [state.progress]);

  useEffect(() => {
    saveMessages(state.messages);
  }, [state.messages]);

  useEffect(() => {
    saveChartState({
      ticker: state.ticker,
      timeframe: state.timeframe,
      chartType: state.chartType,
    });
  }, [state.ticker, state.timeframe, state.chartType]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
