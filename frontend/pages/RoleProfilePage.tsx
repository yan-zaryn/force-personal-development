import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import backend from '~backend/client';
import type { RoleProfile } from '~backend/force/types';

export default function RoleProfilePage() {
  const [roleDescription, setRoleDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [roleProfile, setRoleProfile] = useState<RoleProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const userId = localStorage.getItem('userId');

  const handleGenerateProfile = async () => {
    if (!roleDescription.trim()) {
      toast({
        title: "Missing Description",
        description: "Please describe your current role and responsibilities.",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "User session not found. Please start over.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      console.log('Generating role profile for user:', userId);
      console.log('Role description:', roleDescription);
      
      const profile = await backend.force.generateRoleProfile({
        userId: parseInt(userId),
        roleDescription: roleDescription.trim()
      });
      
      console.log('Generated profile:', profile);
      setRoleProfile(profile);
      
      toast({
        title: "Profile Generated",
        description: "Your role profile has been successfully created!",
      });
    } catch (error) {
      console.error('Failed to generate role profile:', error);
      
      let errorMessage = "Failed to generate your role profile. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('API key is invalid')) {
          errorMessage = "OpenAI API configuration issue. Please contact support.";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "Too many requests. Please wait a moment and try again.";
        } else if (error.message.includes('temporarily unavailable')) {
          errorMessage = "AI service is temporarily unavailable. Please try again in a few minutes.";
        } else if (error.message.includes('JSON')) {
          errorMessage = "There was an issue processing the AI response. Please try again.";
        } else if (error.message.includes('Invalid')) {
          errorMessage = "The AI generated an invalid response. Please try rephrasing your role description.";
        }
      }
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinue = () => {
    console.log('Navigating to skill assessment with profile:', roleProfile);
    navigate('/skill-assessment');
  };

  const handleTryAgain = () => {
    setError(null);
    setRoleProfile(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Role Profiler</h1>
        <p className="text-gray-600">
          Describe your current job and responsibilities to generate a personalized skill map.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Describe Your Role</CardTitle>
            <CardDescription>
              Be specific about your responsibilities, the decisions you make, and the impact you have.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Example: I'm a Product Manager at a SaaS company. I work with engineering teams to define product roadmaps, analyze user feedback, prioritize features, and coordinate launches. I also work closely with sales and marketing to understand market needs and communicate product value..."
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              rows={6}
              className="min-h-[150px]"
            />
            <div className="flex space-x-3">
              <Button 
                onClick={handleGenerateProfile}
                disabled={isGenerating || !roleDescription.trim()}
                className="flex-1 sm:flex-none"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Profile...
                  </>
                ) : (
                  'Generate Role Profile'
                )}
              </Button>
              
              {error && (
                <Button 
                  onClick={handleTryAgain}
                  variant="outline"
                  disabled={isGenerating}
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {roleProfile && (
          <Card>
            <CardHeader>
              <CardTitle>Your Role Profile</CardTitle>
              <CardDescription>
                AI-generated archetype: <strong>{roleProfile.archetype}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {roleProfile.skillAreas && roleProfile.skillAreas.length > 0 ? (
                roleProfile.skillAreas.map((area, areaIndex) => (
                  <div key={areaIndex} className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">{area.area}</h3>
                    <div className="grid gap-3">
                      {area.skills && area.skills.length > 0 ? (
                        area.skills.map((skill, skillIndex) => (
                          <div key={skillIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{skill.name}</h4>
                              <p className="text-sm text-gray-600">{skill.description}</p>
                            </div>
                            <Badge variant="secondary">
                              Target: {skill.targetLevel}/5
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No skills found for this area.</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No skill areas found in the generated profile.</p>
              )}
              
              <div className="pt-4 border-t">
                <Button onClick={handleContinue} className="w-full sm:w-auto">
                  Continue to Skill Assessment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
