import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
  