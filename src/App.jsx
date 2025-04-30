import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WorkoutEntry from './pages/WorkoutEntry';
import WorkoutHistory from './pages/WorkoutHistory';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/entry" element={<WorkoutEntry />} />
          <Route path="/history" element={<WorkoutHistory />} />

          {/* 🔥 Catch-all route: redirects unknown paths to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
