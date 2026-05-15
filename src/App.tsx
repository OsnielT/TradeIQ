import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext.tsx';
import { Layout } from './components/layout/Layout.tsx';
import HomePage from './pages/HomePage.tsx';
import LearnPage from './pages/LearnPage.tsx';
import CurriculumPage from './pages/CurriculumPage.tsx';
import QuizPage from './pages/QuizPage.tsx';
import ResultsPage from './pages/ResultsPage.tsx';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Home / onboarding — no header/footer wrapper */}
          <Route path="/" element={<HomePage />} />

          {/* All app pages share the Header + footer Layout */}
          <Route element={<Layout />}>
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/learn/:moduleId/:lessonId" element={<LearnPage />} />
            <Route path="/curriculum" element={<CurriculumPage />} />
            <Route path="/quiz/lesson/:lessonId" element={<QuizPage />} />
            <Route path="/quiz/module/:moduleId" element={<QuizPage />} />
            <Route path="/quiz/final" element={<QuizPage />} />
            <Route path="/results/:attemptId" element={<ResultsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
