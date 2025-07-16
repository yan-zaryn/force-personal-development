import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Target, BarChart3, TrendingUp, Brain, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '../contexts/LanguageContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import backend from '~backend/client';

function HomePageContent() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleGetStarted = async () => {
    if (!email || !name) {
      setError(t('home.missingInfo'));
      toast({
        title: t('home.missingInfo'),
        description: t('home.missingInfo'),
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@')) {
      setError(t('home.invalidEmail'));
      toast({
        title: t('home.invalidEmail'),
        description: t('home.invalidEmail'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Creating user with:', { email, name });
      
      const user = await backend.force.createUser({ 
        email: email.trim(), 
        name: name.trim() 
      });
      
      console.log('User created successfully:', user);
      
      localStorage.setItem('userId', user.id.toString());
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userEmail', user.email);
      
      toast({
        title: t('home.profileCreated'),
        description: t('home.welcomeMessage').replace('{name}', user.name),
      });
      
      navigate('/role-profile');
    } catch (error) {
      console.error('Failed to create user:', error);
      
      let errorMessage = t('home.error');
      
      if (error instanceof Error) {
        if (error.message.includes('invalid argument')) {
          errorMessage = t('home.errorInput');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = t('home.errorNetwork');
        } else if (error.message.includes('internal')) {
          errorMessage = t('home.errorServer');
        }
      }
      
      setError(errorMessage);
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setError(null);
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

      <div className="max-w-md mx-auto mb-16">
        <Card>
          <CardHeader>
            <CardTitle>{t('home.getStarted')}</CardTitle>
            <CardDescription>
              {t('home.createProfile')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder={t('home.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
            <Input
              type="email"
              placeholder={t('home.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleGetStarted} 
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? t('home.creatingProfile') : t('home.startJourney')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              {error && (
                <Button 
                  onClick={handleTryAgain}
                  variant="outline"
                  disabled={isLoading}
                >
                  {t('home.tryAgain')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
