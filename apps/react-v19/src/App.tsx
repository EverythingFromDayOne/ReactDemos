import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from './react-router-typed';

const RoadmapPage = lazy(() => import('./pages/roadmap/RoadmapPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-gray-400">Loading…</div>}>
        <Routes>
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="*" element={<Navigate to="/roadmap" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
