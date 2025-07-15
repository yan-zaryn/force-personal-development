import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { User, RoleProfile } from '~backend/force/types';

interface SkillRating {
  skillId: string;
  currentLevel: number;
  examples: string;
}

export default function SkillAssessmentPage() {
  const [user, setUser] = useState<User | null>(null);
  const [roleProfile, setRoleProfile] = useState<RoleProfile | null>(null);
  const [ratings, setRatings] = useState<Record<string, SkillRating>>({});
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        navigate('/');
        return;
      }

      try {
        const userData = await backend.force.getUser({ id: parseInt(userId) });
        setUser(userData);
        
        if (userData.targetProfile) {
          setRoleProfile(userData.targetProfile);
        } else {
          toast({
            title: "No Role Profile",
            description: "Please complete your role profile first.",
            variant: "destructive",
          });
          navigate('/role-profile');
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        toast({
          title: "Error",
          description: "Failed to load your profile. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadUserData();
  }, [userId, navigate, toast]);

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
    if (!userId || !roleProfile) return;

    setIsSaving(true);
    try {
      const promises = [];
      
      for (const area of roleProfile.skillAreas) {
        for (const skill of area.skills) {
          const rating = ratings[skill.id];
          if (rating && rating.currentLevel > 0) {
            promises.push(
              backend.force.saveSkillAssessment({
                userId: parseInt(userId),
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
        title: "Assessment Saved",
        description: "Your skill assessments have been saved successfully.",
      });
    } catch (error) {
      console.error('Failed to save assessments:', error);
      toast({
        title: "Error",
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

  if (!roleProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading your role profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Skill Assessment</h1>
        <p className="text-gray-600">
          Rate your current skill level (1-5) and provide examples of how you've applied each skill.
        </p>
      </div>

      <div className="space-y-6">
        {roleProfile.skillAreas.map((area, areaIndex) => (
          <Card key={areaIndex}>
            <CardHeader>
              <CardTitle>{area.area}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {area.skills.map((skill, skillIndex) => {
                const rating = ratings[skill.id] || { skillId: skill.id, currentLevel: 0, examples: '' };
                
                return (
                  <div key={skillIndex} className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{skill.name}</h4>
                        <p className="text-sm text-gray-600">{skill.description}</p>
                      </div>
                      <Badge variant="outline">Target: {skill.targetLevel}/5</Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Level (1-5)
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
                          Examples of Application (Optional)
                        </label>
                        <Textarea
                          placeholder="Describe specific examples of how you've used this skill..."
                          value={rating.examples}
                          onChange={(e) => updateRating(skill.id, 'examples', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={saveAssessments} variant="outline" disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Progress'}
          </Button>
          <Button onClick={handleContinue} disabled={isSaving}>
            Continue to Growth Plan
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
