import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import AuthCallback from './components/AuthCallback';
import HomePage from './pages/HomePage';
import RoleProfilePage from './pages/RoleProfilePage';
import SkillAssessmentPage from './pages/SkillAssessmentPage';
import GrowthPlanPage from './pages/GrowthPlanPage';
import ProgressTrackerPage from './pages/ProgressTrackerPage';
import MentalModelsPage from './pages/MentalModelsPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppInner() {
  return (
    <Router>
      <ErrorBoundary>
        <Layout>
          <Routes>
            <Route path="/" element={
              <ErrorBoundary>
                <HomePage />
              </ErrorBoundary>
            } />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/role-profile" element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <RoleProfilePage />
                </ProtectedRoute>
              </ErrorBoundary>
            } />
            <Route path="/skill-assessment" element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <SkillAssessmentPage />
                </ProtectedRoute>
              </ErrorBoundary>
            } />
            <Route path="/growth-plan" element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <GrowthPlanPage />
                </ProtectedRoute>
              </ErrorBoundary>
            } />
            <Route path="/progress" element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <ProgressTrackerPage />
                </ProtectedRoute>
              </ErrorBoundary>
            } />
            <Route path="/mental-models" element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <MentalModelsPage />
                </ProtectedRoute>
              </ErrorBoundary>
            } />
            <Route path="/profile" element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              </ErrorBoundary>
            } />
          </Routes>
        </Layout>
      </ErrorBoundary>
      <Toaster />
    </Router>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <AppInner />
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
