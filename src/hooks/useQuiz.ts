import { useState, useRef, useCallback } from 'react';
import OpenAI from 'openai';
import { useApp } from '../context/AppContext.tsx';
import { AI_PROVIDER } from '../config/aiProvider.ts';
import type {
  QuizQuestion,
  QuizAnswer,
  QuizAttempt,
  QuizType,
  UserProgress,
} from '../types/index.ts';

// ---------------------------------------------------------------------------
// HuggingFace Inference Router client — lightweight grading calls only (open_answer type)
// ---------------------------------------------------------------------------

const hfClient = new OpenAI({
  baseURL: AI_PROVIDER.baseURL,
  apiKey: import.meta.env.VITE_HF_TOKEN as string,
  dangerouslyAllowBrowser: true,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuizPhase = 'answering' | 'reviewing' | 'completed';

interface SessionState {
  phase: QuizPhase;
  currentIndex: number;
  answers: QuizAnswer[];
  isGrading: boolean;
  attemptId: string | null;
}

export interface PartialAnswer {
  questionId: string;
  selectedIndex?: number;
  selectedBoolean?: boolean;
  openText?: string;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function xpForQuiz(quizType: QuizType, score: number, passed: boolean): number {
  if (!passed) return 0;
  if (quizType === 'final') return 200;
  if (quizType === 'module') return 50;
  return score === 100 ? 25 : 15; // lesson quiz: perfect = +25, pass = +15
}

function addAttemptToProgress(
  progress: UserProgress,
  attempt: QuizAttempt,
): UserProgress {
  switch (attempt.quizType) {
    case 'lesson': {
      const prev = progress.lessonQuizAttempts[attempt.quizRef] ?? [];
      return {
        ...progress,
        lessonQuizAttempts: {
          ...progress.lessonQuizAttempts,
          [attempt.quizRef]: [...prev, attempt],
        },
      };
    }
    case 'module': {
      const prev = progress.moduleQuizAttempts[attempt.quizRef] ?? [];
      return {
        ...progress,
        moduleQuizAttempts: {
          ...progress.moduleQuizAttempts,
          [attempt.quizRef]: [...prev, attempt],
        },
      };
    }
    case 'final':
      return {
        ...progress,
        finalExamAttempts: [...progress.finalExamAttempts, attempt],
      };
  }
}

async function gradeOpenAnswer(
  question: QuizQuestion,
  userAnswer: string,
): Promise<{ correct: boolean; feedback: string }> {
  try {
    const resp = await hfClient.chat.completions.create({
      model: AI_PROVIDER.model,
      max_tokens: 150,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `Does this answer demonstrate understanding of the concept?
Key ideas expected: ${question.acceptableKeywords?.join(', ') ?? 'core trading concepts'}
User answered: "${userAnswer}"
Reply with only valid JSON: { "correct": boolean, "feedback": string }`,
        },
      ],
    });
    const text = resp.choices[0]?.message?.content ?? '';
    return JSON.parse(text) as { correct: boolean; feedback: string };
  } catch {
    return {
      correct: true,
      feedback:
        'Answer recorded — review the explanation to double-check your understanding.',
    };
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useQuiz(questions: QuizQuestion[], quizType: QuizType, quizRef: string) {
  const { state, dispatch } = useApp();

  // Keep a ref to the latest progress so finalize always uses a fresh snapshot
  // without requiring state.progress in useCallback deps (which would recreate
  // callbacks on every XP update during the quiz)
  const progressRef = useRef(state.progress);
  progressRef.current = state.progress;

  const startedAtRef = useRef(Date.now());
  // Prevent concurrent open_answer grading calls
  const isGradingRef = useRef(false);

  const [session, setSession] = useState<SessionState>({
    phase: 'answering',
    currentIndex: 0,
    answers: [],
    isGrading: false,
    attemptId: null,
  });

  // ── Derived values ──────────────────────────────────────────────────────

  const currentQuestion = questions[session.currentIndex] ?? null;
  const currentAnswer = session.answers[session.currentIndex] ?? null;
  const isLastQuestion = session.currentIndex >= questions.length - 1;
  const correctCount = session.answers.filter((a) => a.correct).length;

  // Running score based only on answered questions so far
  const scoreNow =
    session.answers.length > 0
      ? Math.round((correctCount / session.answers.length) * 100)
      : 0;

  // ── Finalize ─────────────────────────────────────────────────────────────

  const finalize = useCallback(
    (answers: QuizAnswer[]) => {
      if (questions.length === 0) return;

      const correct = answers.filter((a) => a.correct).length;
      const score = Math.round((correct / questions.length) * 100);
      const passThreshold = quizType === 'final' ? 75 : 70;
      const passed = score >= passThreshold;
      const attemptId = `${quizType}-${quizRef}-${startedAtRef.current}`;

      const attempt: QuizAttempt = {
        id: attemptId,
        quizType,
        quizRef,
        startedAt: startedAtRef.current,
        completedAt: Date.now(),
        answers,
        score,
        passed,
      };

      const xp = xpForQuiz(quizType, score, passed);
      const updatedProgress = addAttemptToProgress(
        { ...progressRef.current, totalXP: progressRef.current.totalXP + xp },
        attempt,
      );

      dispatch({ type: 'SET_PROGRESS', progress: updatedProgress });
      setSession((s) => ({ ...s, phase: 'completed', attemptId }));
    },
    [questions.length, quizType, quizRef, dispatch],
  );

  // ── Submit answer ────────────────────────────────────────────────────────

  const submitAnswer = useCallback(
    async (partial: PartialAnswer) => {
      const question = questions[session.currentIndex];
      if (!question) return;
      if (session.phase !== 'answering') return;
      if (isGradingRef.current) return;

      if (question.type === 'open_answer' && partial.openText !== undefined) {
        isGradingRef.current = true;
        setSession((s) => ({ ...s, isGrading: true }));

        const graded = await gradeOpenAnswer(question, partial.openText);

        const answer: QuizAnswer = {
          questionId: question.id,
          openText: partial.openText,
          correct: graded.correct,
          aiGraded: true,
          aiFeedback: graded.feedback,
        };

        isGradingRef.current = false;
        setSession((s) => ({
          ...s,
          answers: [...s.answers, answer],
          phase: 'reviewing',
          isGrading: false,
        }));
        return;
      }

      let answer: QuizAnswer;

      if (question.type === 'multiple_choice') {
        answer = {
          questionId: question.id,
          selectedIndex: partial.selectedIndex,
          correct: partial.selectedIndex === question.correctIndex,
        };
      } else {
        // true_false
        answer = {
          questionId: question.id,
          selectedBoolean: partial.selectedBoolean,
          correct: partial.selectedBoolean === question.correctAnswer,
        };
      }

      setSession((s) => ({
        ...s,
        answers: [...s.answers, answer],
        phase: 'reviewing',
      }));
    },
    // Capture exact index/phase at the time the callback was created
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions, session.currentIndex, session.phase],
  );

  // ── Advance ──────────────────────────────────────────────────────────────

  const nextQuestion = useCallback(() => {
    if (session.phase !== 'reviewing') return;

    const nextIndex = session.currentIndex + 1;
    if (nextIndex >= questions.length) {
      finalize(session.answers);
    } else {
      setSession((s) => ({ ...s, currentIndex: nextIndex, phase: 'answering' }));
    }
  }, [session.phase, session.currentIndex, session.answers, questions.length, finalize]);

  return {
    phase: session.phase,
    currentQuestion,
    currentAnswer,
    currentIndex: session.currentIndex,
    totalQuestions: questions.length,
    answers: session.answers,
    isGrading: session.isGrading,
    isLastQuestion,
    attemptId: session.attemptId,
    correctCount,
    scoreNow,
    submitAnswer,
    nextQuestion,
  };
}
