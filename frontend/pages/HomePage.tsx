import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, BarChart3, TrendingUp, Brain } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { ErrorBoundary } from '../components/ErrorBoundary';
import GoogleAuthButton from '../components/GoogleAuthButton';

function HomePageContent() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();

  const handleAuthSuccess = () => {
    navigate('/role-profile');
  };

  const features = [
    {
      icon: Target,
      title: t('feature.roleProfiler.title'),
      description: t('feature.roleProfiler.description')
    },
    {
      icon: BarChart3,
      title: t('feature.skillAssessment.title'),
      description: t('feature.skillAssessment.description')
    },
    {
      icon: TrendingUp,
      title: t('feature.growthPlan.title'),
      description: t('feature.growthPlan.description')
    },
    {
      icon: Brain,
      title: t('feature.mentalModels.title'),
      description: t('feature.mentalModels.description')
    }
  ];

  return (
    <div className="px-4 sm:px-0">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('home.title')}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {t('home.subtitle')}
        </p>
      </div>

      {!isAuthenticated ? (
        <div className="max-w-md mx-auto mb-16">
          <Card>
            <CardHeader>
              <CardTitle>{t('home.getStarted')}</CardTitle>
              <CardDescription>
                Sign in with Google to begin your professional development journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleAuthButton 
                onSuccess={handleAuthSuccess}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-md mx-auto mb-16">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {user?.name}!</CardTitle>
              <CardDescription>
                Continue your professional development journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleAuthButton 
                onSuccess={() => navigate('/role-profile')}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index} className="text-center">
              <CardHeader>
                <Icon className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <ErrorBoundary>
      <HomePageContent />
    </ErrorBoundary>
  );
}
