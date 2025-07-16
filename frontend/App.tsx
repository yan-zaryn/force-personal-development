import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from './contexts/LanguageContext';
import HomePage from './pages/HomePage';
import RoleProfilePage from './pages/RoleProfilePage';
import SkillAssessmentPage from './pages/SkillAssessmentPage';
import GrowthPlanPage from './pages/GrowthPlanPage';
import ProgressTrackerPage from './pages/ProgressTrackerPage';
import MentalModelsPage from './pages/MentalModelsPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';

const queryClient = new QueryClient();

function AppInner() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/role-profile" element={<RoleProfilePage />} />
          <Route path="/skill-assessment" element={<SkillAssessmentPage />} />
          <Route path="/growth-plan" element={<GrowthPlanPage />} />
          <Route path="/progress" element={<ProgressTrackerPage />} />
          <Route path="/mental-models" element={<MentalModelsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Layout>
      <Toaster />
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AppInner />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
