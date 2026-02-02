import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WorkoutEntry from './pages/WorkoutEntry';
import WorkoutHistory from './pages/WorkoutHistory';
import WorkoutDetail from './pages/WorkoutDetail';
import GannNumbers from './pages/GannNumbers';
import Login from './pages/Login';
import Register from './pages/Register';
import Welcome from './pages/Welcome';
import OnboardingGoals from './pages/OnboardingGoals';
import OnboardingSetup from './pages/OnboardingSetup';
import SeedDebug from './pages/SeedDebug';
import WorkoutSelection from './pages/WorkoutSelection';
import ExerciseCategories from './pages/ExerciseCategories';
import ExerciseList from './pages/ExerciseList';
import { AuthProvider } from './lib/auth';
import RequireAuth from './components/RequireAuth';
import RequireOnboardingComplete from './components/RequireOnboardingComplete';

function App() {
  const ProtectedApp = () => (
    <RequireAuth>
      <RequireOnboardingComplete>
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/entry" element={<WorkoutEntry />} />
            <Route path="/workouts/select" element={<WorkoutSelection />} />
            <Route path="/workouts/push-day" element={<ExerciseCategories />} />
            <Route path="/workouts/chest" element={<ExerciseList />} />
            <Route path="/history" element={<WorkoutHistory />} />
            <Route path="/details/:dateDay" element={<WorkoutDetail />} />
            <Route path="/gann" element={<GannNumbers />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </RequireOnboardingComplete>
    </RequireAuth>
  );

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/onboarding/goals"
            element={
              <RequireAuth>
                <OnboardingGoals />
              </RequireAuth>
            }
          />
          <Route
            path="/onboarding/setup"
            element={
              <RequireAuth>
                <OnboardingSetup />
              </RequireAuth>
            }
          />
          <Route
            path="/debug/seed"
            element={
              <RequireAuth>
                <SeedDebug />
              </RequireAuth>
            }
          />
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
