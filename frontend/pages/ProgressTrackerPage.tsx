import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, BookOpen, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { SkillAssessment, GrowthItem, ReflectionEntry } from '~backend/force/types';

export default function ProgressTrackerPage() {
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessment[]>([]);
  const [growthItems, setGrowthItems] = useState<GrowthItem[]>([]);
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [newReflection, setNewReflection] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const loadProgressData = async () => {
      if (!userId) return;

      try {
        const [skillsResponse, growthResponse, reflectionsResponse] = await Promise.all([
          backend.force.getSkillAssessments({ userId: parseInt(userId) }),
          backend.force.getGrowthItems({ userId: parseInt(userId) }),
          backend.force.getReflections({ userId: parseInt(userId) })
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
          title: "Error",
          description: "Failed to load your progress data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProgressData();
  }, [userId, toast]);

  const saveReflection = async () => {
    if (!userId || !newReflection.trim()) return;

    setIsSaving(true);
    try {
      const reflection = await backend.force.saveReflection({
        userId: parseInt(userId),
        content: newReflection,
        type: 'general'
      });

      setReflections(prev => [reflection, ...prev]);
      setNewReflection('');
      
      toast({
        title: "Reflection Saved",
        description: "Your reflection has been added to your journal.",
      });
    } catch (error) {
      console.error('Failed to save reflection:', error);
      toast({
        title: "Error",
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
        <div className="text-center py-12">
          <p className="text-gray-600">Loading your progress...</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Progress Tracker</h1>
        <p className="text-gray-600">
          Track your development journey and reflect on your learnings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Progress Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallProgress}%</div>
              <Progress value={overallProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Average skill development progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Items</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedItems}</div>
              <p className="text-xs text-muted-foreground">
                out of {growthItems.length} total items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Skill Gaps</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{skillGaps.length}</div>
              <p className="text-xs text-muted-foreground">
                areas for improvement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Skill Progress by Area */}
        {Object.keys(skillsByArea).length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Skill Progress by Area</h2>
            {Object.entries(skillsByArea).map(([area, skills]) => (
              <Card key={area}>
                <CardHeader>
                  <CardTitle>{area}</CardTitle>
                  <CardDescription>
                    Your progress in {area.toLowerCase()} skills (all skills rated 1-5)
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
                              (Target: {normalizedTarget}/5)
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Progress value={progress} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Current: {normalizedCurrent}</span>
                            <span>Target: {normalizedTarget}</span>
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
              <CardTitle>Skills Needing Improvement</CardTitle>
              <CardDescription>
                Focus areas where you haven't reached your target level yet
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
                        Gap: {gap} level{gap !== 1 ? 's' : ''}
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
            <CardTitle>Reflection Journal</CardTitle>
            <CardDescription>
              Document your learnings, insights, and progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Textarea
                placeholder="What have you learned recently? What challenges are you facing? What insights have you gained?"
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
                {isSaving ? 'Saving...' : 'Save Reflection'}
              </Button>
            </div>

            {reflections.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium text-gray-900">Recent Reflections</h4>
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
                    And {reflections.length - 5} more reflections...
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
