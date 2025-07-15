import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, Lightbulb, Target, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { MentalModelSession } from '~backend/force/types';

export default function MentalModelsPage() {
  const [prompt, setPrompt] = useState('');
  const [currentSession, setCurrentSession] = useState<MentalModelSession | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const userId = localStorage.getItem('userId');

  const analyzeWithMentalModels = async () => {
    if (!userId || !prompt.trim()) return;

    setIsAnalyzing(true);
    try {
      const session = await backend.force.mentalModelsCoach({
        userId: parseInt(userId),
        prompt: prompt.trim()
      });

      setCurrentSession(session);
      toast({
        title: "Analysis Complete",
        description: "Generated 5 mental model perspectives on your situation.",
      });
    } catch (error) {
      console.error('Failed to analyze with mental models:', error);
      toast({
        title: "Error",
        description: "Failed to generate mental model analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveToJournal = async () => {
    if (!userId || !currentSession) return;

    setIsSaving(true);
    try {
      const reflectionContent = `Mental Models Analysis for: "${currentSession.prompt}"\n\n${
        currentSession.models.map((model, index) => 
          `${index + 1}. ${model.name}\n` +
          `Insight: ${model.keyInsight}\n` +
          `Action: ${model.practicalAction}\n`
        ).join('\n')
      }`;

      await backend.force.saveReflection({
        userId: parseInt(userId),
        content: reflectionContent,
        type: 'mental_model'
      });

      toast({
        title: "Saved to Journal",
        description: "Mental model analysis has been saved to your reflection journal.",
      });
    } catch (error) {
      console.error('Failed to save to journal:', error);
      toast({
        title: "Error",
        description: "Failed to save analysis to journal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const startNewAnalysis = () => {
    setCurrentSession(null);
    setPrompt('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mental Models Coach</h1>
        <p className="text-gray-600">
          Get AI-powered insights using proven mental frameworks to help with complex decisions and dilemmas.
        </p>
      </div>

      <div className="space-y-6">
        {!currentSession ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                Describe Your Situation
              </CardTitle>
              <CardDescription>
                Share a decision you're facing, a challenge you're working through, or a situation you'd like to analyze from multiple perspectives.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Example: I'm trying to decide whether to take on a new project that would stretch my team thin but could lead to significant growth opportunities. The timeline is aggressive and there's risk of burnout, but the potential impact is high..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="min-h-[150px]"
              />
              <Button 
                onClick={analyzeWithMentalModels}
                disabled={isAnalyzing || !prompt.trim()}
                className="w-full sm:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Analyze with Mental Models
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Your Situation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{currentSession.prompt}</p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Mental Model Analysis</h2>
                <div className="flex space-x-2">
                  <Button onClick={saveToJournal} variant="outline" disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save to Journal'}
                  </Button>
                  <Button onClick={startNewAnalysis} variant="outline">
                    New Analysis
                  </Button>
                </div>
              </div>

              {currentSession.models.map((model, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Badge variant="outline" className="mr-3">
                        {index + 1}
                      </Badge>
                      {model.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Explanation</h4>
                      <p className="text-gray-700">{model.explanation}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-1" />
                        New Perspective
                      </h4>
                      <p className="text-gray-700">{model.newPerspective}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Key Insight</h4>
                      <p className="text-blue-700 font-medium">{model.keyInsight}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        Practical Action
                      </h4>
                      <p className="text-green-700 font-medium">{model.practicalAction}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
