import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, BookOpen, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { StatsSkeleton, SkillsSkeleton, CardSkeleton } from '../components/LoadingSkeleton';
import type { SkillAssessment, GrowthItem, ReflectionEntry } from '~backend/force/types';

function ProgressTrackerContent() {
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessment[]>([]);
  const [growthItems, setGrowthItems] = useState<GrowthItem[]>([]);
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [newReflection, setNewReflection] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { getAuthenticatedBackend } = useAuth();

  useEffect(() => {
    const loadProgressData = async () => {
      try {
        const backend = getAuthenticatedBackend();
        const [skillsResponse, growthResponse, reflectionsResponse] = await Promise.all([
          backend.force.getSkillAssessments(),
          backend.force.getGrowthItems(),
          backend.force.getReflections()
        ]);

        console.log('Loaded skill assessments:', skillsResponse.assessments);
        
        // Normalize skill assessments to ensure all target levels are within 1-5 range
        const normalizedSkills = skillsResponse.assessments.map(skill => ({
          ...skill,
          targetLevel: Math.min(5, Math.max(1, skill.targetLevel)),
          currentLevel: Math.min(5, Math.max(1, skill.currentLevel))
        }));

        setSkillAssessments(normalizedSkills);
        setGrowthItems(growthResponse.growthItems);
        setReflections(reflectionsResponse.reflections);
      } catch (error) {
        console.error('Failed to load progress data:', error);
        toast({
          title: t('common.error'),
          description: "Failed to load your progress data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProgressData();
  }, [toast, t, getAuthenticatedBackend]);

  const saveReflection = async () => {
    if (!newReflection.trim()) return;

    setIsSaving(true);
    try {
      const backend = getAuthenticatedBackend();
      const reflection = await backend.force.saveReflection({
        content: newReflection,
        type: 'general'
      });

      setReflections(prev => [reflection, ...prev]);
      setNewReflection('');
      
      toast({
        title: t('progress.reflectionSaved'),
        description: t('progress.reflectionSavedMessage'),
      });
    } catch (error) {
      console.error('Failed to save reflection:', error);
      toast({
        title: t('common.error'),
        description: "Failed to save your reflection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateOverallProgress = () => {
    if (skillAssessments.length === 0) return 0;
    
    const totalProgress = skillAssessments.reduce((sum, skill) => {
      // Ensure we're using normalized values (1-5 scale)
      const normalizedTarget = Math.min(5, Math.max(1, skill.targetLevel));
      const normalizedCurrent = Math.min(5, Math.max(1, skill.currentLevel));
      return sum + (normalizedCurrent / normalizedTarget) * 100;
    }, 0);
    
    return Math.round(totalProgress / skillAssessments.length);
  };

  const getCompletedGrowthItems = () => {
    return growthItems.filter(item => item.status === 'done').length;
  };

  const getSkillGaps = () => {
    return skillAssessments.filter(skill => {
      const normalizedTarget = Math.min(5, Math.max(1, skill.targetLevel));
      const normalizedCurrent = Math.min(5, Math.max(1, skill.currentLevel));
      return normalizedCurrent < normalizedTarget;
    });
  };

  const groupSkillsByArea = () => {
    return skillAssessments.reduce((acc, skill) => {
      if (!acc[skill.area]) acc[skill.area] = [];
      acc[skill.area].push(skill);
      return acc;
    }, {} as Record<string, SkillAssessment[]>);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>
        <div className="space-y-6">
          <StatsSkeleton />
          <SkillsSkeleton count={2} />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();
  const completedItems = getCompletedGrowthItems();
  const skillGaps = getSkillGaps();
  const skillsByArea = groupSkillsByArea();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('progress.title')}</h1>
        <p className="text-gray-600">
          {t('progress.subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Progress Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('progress.overallProgress')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallProgress}%</div>
              <Progress value={overallProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {t('progress.averageProgress')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('progress.completedItems')}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedItems}</div>
              <p className="text-xs text-muted-foreground">
                {t('progress.outOfTotal').replace('{total}', growthItems.length.toString())}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('progress.skillGaps')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{skillGaps.length}</div>
              <p className="text-xs text-muted-foreground">
                {t('progress.areasForImprovement')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Skill Progress by Area */}
        {Object.keys(skillsByArea).length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">{t('progress.skillsByArea')}</h2>
            {Object.entries(skillsByArea).map(([area, skills]) => (
              <Card key={area}>
                <CardHeader>
                  <CardTitle>{area}</CardTitle>
                  <CardDescription>
                    {t('progress.yourProgressIn').replace('{area}', area.toLowerCase())} ({t('progress.skillsRated')})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {skills.map((skill) => {
                    // Ensure we're displaying normalized values (1-5 scale)
                    const normalizedTarget = Math.min(5, Math.max(1, skill.targetLevel));
                    const normalizedCurrent = Math.min(5, Math.max(1, skill.currentLevel));
                    const progress = (normalizedCurrent / normalizedTarget) * 100;
                    const isComplete = normalizedCurrent >= normalizedTarget;
                    
                    return (
                      <div key={skill.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{skill.name}</h4>
                            {skill.examples && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{skill.examples}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge variant={isComplete ? "default" : "secondary"}>
                              {normalizedCurrent}/5
                            </Badge>
                            <span className="text-sm text-gray-500">
                              ({t('progress.target')} {normalizedTarget}/5)
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Progress value={progress} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{t('progress.current')} {normalizedCurrent}</span>
                            <span>{t('progress.target')} {normalizedTarget}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Skills that need improvement */}
        {skillGaps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('progress.skillsNeedingImprovement')}</CardTitle>
              <CardDescription>
                {t('progress.focusAreas')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {skillGaps.map((skill) => {
                const normalizedTarget = Math.min(5, Math.max(1, skill.targetLevel));
                const normalizedCurrent = Math.min(5, Math.max(1, skill.currentLevel));
                const gap = normalizedTarget - normalizedCurrent;
                
                return (
                  <div key={skill.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <h4 className="font-medium text-gray-900">{skill.name}</h4>
                      <p className="text-sm text-gray-600">{skill.area}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        {t('progress.gap')} {gap} {gap !== 1 ? t('progress.levels') : t('progress.level')}
                      </Badge>
                      <Badge variant="secondary">
                        {normalizedCurrent}/{normalizedTarget}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Reflection Journal */}
        <Card>
          <CardHeader>
            <CardTitle>{t('progress.reflectionJournal')}</CardTitle>
            <CardDescription>
              {t('progress.documentLearnings')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Textarea
                placeholder={t('progress.reflectionPlaceholder')}
                value={newReflection}
                onChange={(e) => setNewReflection(e.target.value)}
                rows={4}
              />
              <Button 
                onClick={saveReflection} 
                disabled={isSaving || !newReflection.trim()}
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? t('progress.saving') : t('progress.saveReflection')}
              </Button>
            </div>

            {reflections.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium text-gray-900">{t('progress.recentReflections')}</h4>
                {reflections.slice(0, 5).map((reflection) => (
                  <div key={reflection.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900">{reflection.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        {new Date(reflection.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {reflection.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
                {reflections.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    {t('progress.moreReflections').replace('{count}', (reflections.length - 5).toString())}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProgressTrackerPage() {
  return (
    <ErrorBoundary>
      <ProgressTrackerContent />
    </ErrorBoundary>
  );
}
