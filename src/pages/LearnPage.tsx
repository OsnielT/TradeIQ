import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';
import { curriculum } from '../data/curriculum.ts';
import { ChartPanel } from '../components/chart/ChartPanel.tsx';
import { TutorPanel } from '../components/tutor/TutorPanel.tsx';
import styles from './LearnPage.module.css';

export default function LearnPage() {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const { dispatch } = useApp();

  useEffect(() => {
    if (!moduleId || !lessonId) return;

    const mod = curriculum.find((m) => m.id === moduleId);
    const lesson = mod?.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    dispatch({ type: 'SET_LESSON', moduleId, lessonId });
    dispatch({ type: 'SET_TICKER', ticker: lesson.suggestedTicker });
    dispatch({ type: 'SET_TIMEFRAME', timeframe: lesson.suggestedTimeframe });
  }, [moduleId, lessonId, dispatch]);

  const activeMod = moduleId ? curriculum.find((m) => m.id === moduleId) : null;
  const activeLesson = activeMod?.lessons.find((l) => l.id === lessonId) ?? null;

  return (
    <div className={styles.page}>
      <ChartPanel
        lessonTitle={activeLesson?.title}
        moduleName={activeMod?.title}
      />
      <TutorPanel activeLesson={activeLesson} activeMod={activeMod ?? null} />
    </div>
  );
}
