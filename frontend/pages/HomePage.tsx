import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Target, BarChart3, TrendingUp, Brain } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGetStarted = async () => {
    if (!email || !name) {
      toast({
        title: "Missing Information",
        description: "Please enter both your name and email to get started.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const user = await backend.force.createUser({ email, name });
      localStorage.setItem('userId', user.id.toString());
      localStorage.setItem('userName', user.name);
      navigate('/role-profile');
    } catch (error) {
      console.error('Failed to create user:', error);
      toast({
        title: "Error",
        description: "Failed to create your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Target,
      title: "Role Profiler",
      description: "AI-generated skill map based on your role and responsibilities"
    },
    {
      icon: BarChart3,
      title: "Skill Assessment",
      description: "Self-assess your current abilities and identify growth areas"
    },
    {
      icon: TrendingUp,
      title: "Growth Plan",
      description: "Personalized recommendations for books, courses, and practices"
    },
    {
      icon: Brain,
      title: "Mental Models Coach",
      description: "AI-powered decision support using proven mental frameworks"
    }
  ];

  return (
    <div className="px-4 sm:px-0">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Master Your Professional Growth
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A personal development system that helps professionals articulate their role, 
          assess growth areas, and follow a data-informed path toward mastery.
        </p>
      </div>

      <div className="max-w-md mx-auto mb-16">
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Create your profile to begin your growth journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button 
              onClick={handleGetStarted} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Profile...' : 'Start Your Journey'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
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
