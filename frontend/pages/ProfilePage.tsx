import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Target, 
  TrendingUp, 
  Calendar, 
  Settings, 
  Edit3, 
  Save, 
  RefreshCw,
  Mail,
  MapPin,
  Briefcase,
  Award,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '../contexts/LanguageContext';
import backend from '~backend/client';
import type { User as UserType, SkillAssessment, GrowthItem, RoleProfile } from '~backend/force/types';

export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessment[]>([]);
  const [growthItems, setGrowthItems] = useState<GrowthItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedRoleDescription, setEditedRoleDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const loadProfileData = async () => {
      if (!userId) {
        console.log('No userId found, redirecting to home');
        navigate('/');
        return;
      }

      console.log('Loading profile data for userId:', userId);
      setIsLoading(true);
      setError(null);

      try {
        const [userResponse, skillsResponse, growthResponse] = await Promise.all([
          backend.force.getUser({ id: parseInt(userId) }),
          backend.force.getSkillAssessments({ userId: parseInt(userId) }),
          backend.force.getGrowthItems({ userId: parseInt(userId) })
        ]);

        console.log('Profile data loaded successfully');
        console.log('User response:', userResponse);
        console.log('User targetProfile:', userResponse.targetProfile);
        
        setUser(userResponse);
        setEditedName(userResponse.name);
        setEditedRoleDescription(userResponse.roleDescription || '');
        setSkillAssessments(skillsResponse.assessments);
        setGrowthItems(growthResponse.growthItems);
      } catch (error) {
        console.error('Failed to load profile data:', error);
        setError("Failed to load your profile data. Please try again.");
        toast({
          title: t('common.error'),
          description: "Failed to load your profile data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [userId, toast, navigate, t]);

  const handleSaveProfile = async () => {
    if (!userId || !user) return;

    setIsSaving(true);
    try {
      // Update user name in localStorage
      localStorage.setItem('userName', editedName);
      
      // Update the local state
      setUser(prev => prev ? { ...prev, name: editedName, roleDescription: editedRoleDescription } : null);
      setIsEditing(false);
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: t('common.error'),
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateProfile = () => {
    navigate('/role-profile');
  };

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

  const getSkillGaps = () => {
    return skillAssessments.filter(skill => skill.currentLevel < skill.targetLevel);
  };

  const getTopSkills = () => {
    return skillAssessments
      .filter(skill => skill.currentLevel >= skill.targetLevel)
      .sort((a, b) => b.currentLevel - a.currentLevel)
      .slice(0, 5);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-0">
        <div className="text-center py-12">
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('profile.title')}</h1>
          <p className="text-gray-600">
            {t('profile.subtitle')}
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Profile</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              {t('common.tryAgain')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-0">
        <div className="text-center py-12">
          <p className="text-gray-600">Profile not found.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            {t('common.goHome')}
          </Button>
        </div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();
  const completedItems = getCompletedGrowthItems();
  const skillsByArea = groupSkillsByArea();
  const skillGaps = getSkillGaps();
  const topSkills = getTopSkills();
  const roleProfile = user.targetProfile as RoleProfile | null;

  console.log('Rendering profile page with roleProfile:', roleProfile);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('profile.title')}</h1>
        <p className="text-gray-600">
          {t('profile.subtitle')}
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('profile.overview')}</TabsTrigger>
          <TabsTrigger value="role-profile">{t('profile.roleProfile')}</TabsTrigger>
          <TabsTrigger value="skills">{t('profile.skills')}</TabsTrigger>
          <TabsTrigger value="settings">{t('profile.settings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{user.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Mail className="w-4 h-4 mr-1" />
                      {user.email}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {t('profile.memberSince')} {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Badge>
              </div>
            </CardHeader>
            {user.roleDescription && (
              <CardContent>
                <div className="flex items-start space-x-2">
                  <Briefcase className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">{t('profile.currentRole')}</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{user.roleDescription}</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Progress Summary */}
          <div className="grid md:grid-cols-4 gap-6">
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
                <Target className="h-4 w-4 text-muted-foreground" />
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
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{skillGaps.length}</div>
                <p className="text-xs text-muted-foreground">
                  {t('progress.areasForImprovement')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Skills</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{topSkills.length}</div>
                <p className="text-xs text-muted-foreground">
                  {t('profile.atTargetLevel')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Skills */}
          {topSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.yourStrengths')}</CardTitle>
                <CardDescription>
                  {t('profile.strengthsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {topSkills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <h4 className="font-medium text-gray-900">{skill.name}</h4>
                        <p className="text-sm text-gray-600">{skill.area}</p>
                      </div>
                      <Badge variant="default" className="bg-green-600">
                        {skill.currentLevel}/{skill.targetLevel}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Growth Items */}
          {growthItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.recentGrowthActivities')}</CardTitle>
                <CardDescription>
                  {t('profile.recentActivitiesDescription')}
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
                      {t('profile.moreItems').replace('{count}', (growthItems.length - 5).toString())}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="role-profile" className="space-y-6">
          {roleProfile && roleProfile.archetype && roleProfile.skillAreas ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('profile.roleArchetype')}</CardTitle>
                      <CardDescription>{t('profile.aiGeneratedProfile')}</CardDescription>
                    </div>
                    <Button onClick={handleRegenerateProfile} variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t('profile.regenerate')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{roleProfile.archetype}</h3>
                      <p className="text-sm text-gray-600">Generated based on your role description</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('profile.skillMap')}</CardTitle>
                  <CardDescription>
                    {t('profile.skillMapDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {roleProfile.skillAreas.map((area, areaIndex) => (
                    <div key={areaIndex} className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">{areaIndex + 1}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{area.area}</h3>
                      </div>
                      <div className="grid gap-3 ml-10">
                        {area.skills.map((skill, skillIndex) => {
                          const assessment = skillAssessments.find(a => a.skillId === skill.id);
                          const currentLevel = assessment?.currentLevel || 0;
                          const progress = currentLevel > 0 ? (currentLevel / skill.targetLevel) * 100 : 0;
                          
                          return (
                            <div key={skillIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{skill.name}</h4>
                                <p className="text-sm text-gray-600">{skill.description}</p>
                                {currentLevel > 0 && (
                                  <div className="mt-2">
                                    <Progress value={progress} className="h-2" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4 flex items-center space-x-2">
                                <Badge variant="outline">
                                  {t('roleProfile.target')} {skill.targetLevel}/5
                                </Badge>
                                {currentLevel > 0 && (
                                  <Badge variant={currentLevel >= skill.targetLevel ? "default" : "secondary"}>
                                    {t('progress.current')} {currentLevel}/5
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.noRoleProfile')}</CardTitle>
                <CardDescription>
                  {t('profile.noRoleProfileDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleRegenerateProfile}>
                  <Target className="w-4 h-4 mr-2" />
                  {t('profile.createRoleProfile')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          {Object.keys(skillsByArea).length > 0 ? (
            Object.entries(skillsByArea).map(([area, skills]) => (
              <Card key={area}>
                <CardHeader>
                  <CardTitle>{area}</CardTitle>
                  <CardDescription>
                    Your progress in {area.toLowerCase()} skills
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {skills.map((skill) => {
                    const progress = (skill.currentLevel / skill.targetLevel) * 100;
                    const isComplete = skill.currentLevel >= skill.targetLevel;
                    
                    return (
                      <div key={skill.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{skill.name}</h4>
                            {skill.examples && (
                              <p className="text-sm text-gray-600 mt-1">{skill.examples}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={isComplete ? "default" : "secondary"}>
                              {skill.currentLevel}/{skill.targetLevel}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.noSkillsAssessed')}</CardTitle>
                <CardDescription>
                  {t('profile.noSkillsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/skill-assessment')}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {t('profile.startSkillAssessment')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('profile.profileInformation')}</CardTitle>
                  <CardDescription>
                    {t('profile.updateInformation')}
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                    <Edit3 className="w-4 h-4 mr-2" />
                    {t('profile.edit')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t('profile.name')}</label>
                {isEditing ? (
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Your full name"
                  />
                ) : (
                  <p className="text-gray-900">{user.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t('profile.email')}</label>
                <p className="text-gray-600 text-sm">{user.email}</p>
                <p className="text-xs text-gray-500">{t('profile.emailCannotChange')}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t('profile.roleDescription')}</label>
                {isEditing ? (
                  <Textarea
                    value={editedRoleDescription}
                    onChange={(e) => setEditedRoleDescription(e.target.value)}
                    placeholder="Describe your current role and responsibilities..."
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-900">{user.roleDescription || t('profile.noRoleDescription')}</p>
                )}
              </div>

              {isEditing && (
                <div className="flex space-x-3 pt-4">
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : t('profile.saveChanges')}
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditedName(user.name);
                      setEditedRoleDescription(user.roleDescription || '');
                    }} 
                    variant="outline"
                  >
                    {t('profile.cancel')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('profile.accountInformation')}</CardTitle>
              <CardDescription>
                {t('profile.accountDetails')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('profile.memberSince')}</label>
                  <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('profile.lastUpdated')}</label>
                  <p className="text-gray-900">{new Date(user.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('profile.skillsAssessed')}</label>
                  <p className="text-gray-900">{skillAssessments.length}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('profile.growthItems')}</label>
                  <p className="text-gray-900">{growthItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('profile.dataManagement')}</CardTitle>
              <CardDescription>
                {t('profile.manageData')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-3">
                <Button onClick={handleRegenerateProfile} variant="outline" className="justify-start">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('profile.regenerateRoleProfile')}
                </Button>
                <Button onClick={() => navigate('/skill-assessment')} variant="outline" className="justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {t('profile.updateSkillAssessment')}
                </Button>
                <Button onClick={() => navigate('/growth-plan')} variant="outline" className="justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {t('profile.regenerateGrowthPlan')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
