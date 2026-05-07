import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from './react-router-typed';
import { AppNav } from './components/AppNav';

const RoadmapPage = lazy(() => import('./pages/roadmap/RoadmapPage'));
const FeatureComparePage = lazy(() => import('./pages/feature-compare/FeatureComparePage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-gray-400">Loading…</div>}>
        <AppNav />
        <Routes>
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/feature-compare" element={<FeatureComparePage />} />
          <Route path="*" element={<Navigate to="/roadmap" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
