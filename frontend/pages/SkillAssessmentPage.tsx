import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { SkillsSkeleton } from '../components/LoadingSkeleton';
import type { User, RoleProfile } from '~backend/force/types';

interface SkillRating {
  skillId: string;
  currentLevel: number;
  examples: string;
}

function SkillAssessmentContent() {
  const [user, setUser] = useState<User | null>(null);
  const [roleProfile, setRoleProfile] = useState<RoleProfile | null>(null);
  const [ratings, setRatings] = useState<Record<string, SkillRating>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { getAuthenticatedBackend } = useAuth();

  useEffect(() => {
    const loadUserData = async () => {
      console.log('Loading user data');
      setIsLoading(true);
      setError(null);

      try {
        const backend = getAuthenticatedBackend();
        const userData = await backend.force.getCurrentUser();
        console.log('User data loaded:', userData);
        setUser(userData);
        
        if (userData.targetProfile) {
          console.log('Target profile found:', userData.targetProfile);
          setRoleProfile(userData.targetProfile);
        } else {
          console.log('No target profile found for user');
          setError(t('skillAssessment.needProfile'));
          toast({
            title: t('skillAssessment.noProfile'),
            description: t('skillAssessment.needProfile'),
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        setError("Failed to load your profile data. Please try again.");
        toast({
          title: t('common.error'),
          description: "Failed to load your profile. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [toast, t, getAuthenticatedBackend]);

  const updateRating = (skillId: string, field: keyof SkillRating, value: number | string) => {
    setRatings(prev => ({
      ...prev,
      [skillId]: {
        ...prev[skillId],
        skillId,
        [field]: value
      }
    }));
  };

  const saveAssessments = async () => {
    if (!roleProfile) return;

    setIsSaving(true);
    try {
      const backend = getAuthenticatedBackend();
      const promises = [];
      
      for (const area of roleProfile.skillAreas) {
        for (const skill of area.skills) {
          const rating = ratings[skill.id];
          if (rating && rating.currentLevel > 0) {
            promises.push(
              backend.force.saveSkillAssessment({
                skillId: skill.id,
                area: area.area,
                name: skill.name,
                targetLevel: skill.targetLevel,
                currentLevel: rating.currentLevel,
                examples: rating.examples
              })
            );
          }
        }
      }

      await Promise.all(promises);
      
      toast({
        title: t('skillAssessment.saved'),
        description: t('skillAssessment.savedMessage'),
      });
    } catch (error) {
      console.error('Failed to save assessments:', error);
      toast({
        title: t('common.error'),
        description: "Failed to save your assessments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = async () => {
    await saveAssessments();
    navigate('/growth-plan');
  };

  const goToRoleProfile = () => {
    navigate('/role-profile');
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>
        <SkillsSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('skillAssessment.title')}</h1>
          <p className="text-gray-600">
            {t('skillAssessment.subtitle')}
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>

        <div className="mt-6">
          <Button onClick={goToRoleProfile}>
            {t('skillAssessment.createProfile')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (!roleProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('skillAssessment.title')}</h1>
          <p className="text-gray-600">
            {t('skillAssessment.subtitle')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('skillAssessment.noProfile')}</CardTitle>
            <CardDescription>
              {t('skillAssessment.needProfile')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={goToRoleProfile}>
              {t('skillAssessment.createProfile')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('skillAssessment.title')}</h1>
        <p className="text-gray-600">
          {t('skillAssessment.subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        {roleProfile.skillAreas && roleProfile.skillAreas.length > 0 ? (
          roleProfile.skillAreas.map((area, areaIndex) => (
            <Card key={areaIndex}>
              <CardHeader>
                <CardTitle>{area.area}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {area.skills && area.skills.length > 0 ? (
                  area.skills.map((skill, skillIndex) => {
                    const rating = ratings[skill.id] || { skillId: skill.id, currentLevel: 0, examples: '' };
                    
                    return (
                      <div key={skillIndex} className="space-y-3 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{skill.name}</h4>
                            <p className="text-sm text-gray-600">{skill.description}</p>
                          </div>
                          <Badge variant="outline">{t('roleProfile.target')} {skill.targetLevel}/5</Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t('skillAssessment.currentLevel')}
                            </label>
                            <div className="flex space-x-2">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <Button
                                  key={level}
                                  variant={rating.currentLevel === level ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => updateRating(skill.id, 'currentLevel', level)}
                                >
                                  {level}
                                </Button>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t('skillAssessment.examples')}
                            </label>
                            <Textarea
                              placeholder={t('skillAssessment.examplesPlaceholder')}
                              value={rating.examples}
                              onChange={(e) => updateRating(skill.id, 'examples', e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500">{t('skillAssessment.noSkillsInArea')}</p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t('skillAssessment.noSkillAreas')}</CardTitle>
              <CardDescription>
                {t('skillAssessment.noSkillAreasMessage')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={goToRoleProfile}>
                {t('skillAssessment.goToRoleProfile')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {roleProfile.skillAreas && roleProfile.skillAreas.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={saveAssessments} variant="outline" disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? t('skillAssessment.saving') : t('skillAssessment.saveProgress')}
            </Button>
            <Button onClick={handleContinue} disabled={isSaving}>
              {t('skillAssessment.continue')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SkillAssessmentPage() {
  return (
    <ErrorBoundary>
      <SkillAssessmentContent />
    </ErrorBoundary>
  );
}
