import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Target, TrendingUp, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { User as UserType, SkillAssessment, GrowthItem } from '~backend/force/types';

export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessment[]>([]);
  const [growthItems, setGrowthItems] = useState<GrowthItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const loadProfileData = async () => {
      if (!userId) return;

      try {
        const [userResponse, skillsResponse, growthResponse] = await Promise.all([
          backend.force.getUser({ id: parseInt(userId) }),
          backend.force.getSkillAssessments({ userId: parseInt(userId) }),
          backend.force.getGrowthItems({ userId: parseInt(userId) })
        ]);

        setUser(userResponse);
        setSkillAssessments(skillsResponse.assessments);
        setGrowthItems(growthResponse.growthItems);
      } catch (error) {
        console.error('Failed to load profile data:', error);
        toast({
          title: "Error",
          description: "Failed to load your profile data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [userId, toast]);

  const calculateOverallProgress = () => {
    if (skillAssessments.length === 0) return 0;
    
    const totalProgress = skillAssessments.reduce((sum, skill) => {
      return sum + (skill.currentLevel / skill.targetLevel) * 100;
    }, 0);
    
    return Math.round(totalProgress / skillAssessments.length);
  };

  const getCompletedGrowthItems = () => {
    return growthItems.filter(item => item.status === 'done').length;
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
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="text-center py-12">
          <p className="text-gray-600">Profile not found.</p>
        </div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();
  const completedItems = getCompletedGrowthItems();
  const skillsByArea = groupSkillsByArea();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">
          Your professional development journey and achievements.
        </p>
      </div>

      <div className="space-y-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              {user.name}
            </CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            {user.roleDescription && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Role Description</h4>
                <p className="text-gray-700">{user.roleDescription}</p>
              </div>
            )}
            {user.targetProfile && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Role Archetype</h4>
                <Badge variant="secondary">{user.targetProfile.archetype}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Summary */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallProgress}%</div>
              <Progress value={overallProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Actions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedItems}</div>
              <p className="text-xs text-muted-foreground">
                growth plan items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Member Since</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skills Heatmap */}
        {Object.keys(skillsByArea).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Skills Heatmap</CardTitle>
              <CardDescription>
                Your current skill levels across different competency areas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(skillsByArea).map(([area, skills]) => (
                <div key={area} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">{area}</h3>
                  <div className="grid gap-3">
                    {skills.map((skill) => {
                      const progress = (skill.currentLevel / skill.targetLevel) * 100;
                      const isComplete = skill.currentLevel >= skill.targetLevel;
                      
                      return (
                        <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{skill.name}</h4>
                            <div className="mt-1">
                              <Progress value={progress} className="h-2" />
                            </div>
                          </div>
                          <div className="ml-4 flex items-center space-x-2">
                            <Badge variant={isComplete ? "default" : "secondary"}>
                              {skill.currentLevel}/{skill.targetLevel}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Growth Plan Summary */}
        {growthItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Growth Plan Progress</CardTitle>
              <CardDescription>
                Your development activities and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {growthItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600 capitalize">{item.type}</p>
                    </div>
                    <Badge 
                      variant={item.status === 'done' ? 'default' : 'secondary'}
                      className={
                        item.status === 'done' 
                          ? 'bg-green-100 text-green-800' 
                          : item.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
                {growthItems.length > 5 && (
                  <p className="text-sm text-gray-500 text-center pt-2">
                    And {growthItems.length - 5} more items...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
