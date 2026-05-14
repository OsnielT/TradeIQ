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
  explanation: string;
  lessonRef: string;
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
  color: string;
  icon: string;
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
