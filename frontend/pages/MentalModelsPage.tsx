import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, Lightbulb, Target, Save, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '../contexts/LanguageContext';
import backend from '~backend/client';
import type { MentalModelSession } from '~backend/force/types';

export default function MentalModelsPage() {
  const [prompt, setPrompt] = useState('');
  const [currentSession, setCurrentSession] = useState<MentalModelSession | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      console.log('No userId found, redirecting to home');
      navigate('/');
      return;
    }
  }, [userId, navigate]);

  const analyzeWithMentalModels = async () => {
    if (!userId || !prompt.trim()) {
      toast({
        title: "Missing Information",
        description: t('mentalModels.shareDecision'),
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('Analyzing with mental models for user:', userId);
      console.log('Prompt:', prompt);
      
      const session = await backend.force.mentalModelsCoach({
        userId: parseInt(userId),
        prompt: prompt.trim()
      });

      console.log('Mental models session received:', session);
      
      // Validate the session structure
      if (!session || !session.models || !Array.isArray(session.models)) {
        console.error('Invalid session structure:', session);
        throw new Error('Invalid response structure from mental models analysis');
      }

      setCurrentSession(session);
      toast({
        title: t('mentalModels.analysisComplete'),
        description: t('mentalModels.analysisCompleteMessage').replace('{count}', session.models.length.toString()),
      });
    } catch (error) {
      console.error('Failed to analyze with mental models:', error);
      
      let errorMessage = "Failed to generate mental model analysis. Please try again.";
      
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
          errorMessage = "The AI generated an invalid response. Please try rephrasing your situation.";
        }
      }
      
      setError(errorMessage);
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveToJournal = async () => {
    if (!userId || !currentSession) {
      toast({
        title: t('common.error'),
        description: "No session data to save.",
        variant: "destructive",
      });
      return;
    }

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
        title: t('mentalModels.savedToJournal'),
        description: t('mentalModels.savedToJournalMessage'),
      });
    } catch (error) {
      console.error('Failed to save to journal:', error);
      toast({
        title: t('common.error'),
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
    setError(null);
  };

  const handleTryAgain = () => {
    setError(null);
  };

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="text-center py-12">
          <p className="text-gray-600">Please log in to access Mental Models Coach.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('mentalModels.title')}</h1>
        <p className="text-gray-600">
          {t('mentalModels.subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {!currentSession ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                {t('mentalModels.describeSituation')}
              </CardTitle>
              <CardDescription>
                {t('mentalModels.shareDecision')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={t('mentalModels.placeholder')}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="min-h-[150px]"
              />
              <div className="flex space-x-3">
                <Button 
                  onClick={analyzeWithMentalModels}
                  disabled={isAnalyzing || !prompt.trim()}
                  className="flex-1 sm:flex-none"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('mentalModels.analyzing')}
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      {t('mentalModels.analyze')}
                    </>
                  )}
                </Button>
                
                {error && (
                  <Button 
                    onClick={handleTryAgain}
                    variant="outline"
                    disabled={isAnalyzing}
                  >
                    {t('common.tryAgain')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t('mentalModels.yourSituation')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{currentSession.prompt}</p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{t('mentalModels.analysis')}</h2>
                <div className="flex space-x-2">
                  <Button onClick={saveToJournal} variant="outline" disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : t('mentalModels.saveToJournal')}
                  </Button>
                  <Button onClick={startNewAnalysis} variant="outline">
                    {t('mentalModels.newAnalysis')}
                  </Button>
                </div>
              </div>

              {currentSession.models && currentSession.models.length > 0 ? (
                currentSession.models.map((model, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Badge variant="outline" className="mr-3">
                          {index + 1}
                        </Badge>
                        {model.name || 'Mental Model'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {model.explanation && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">{t('mentalModels.explanation')}</h4>
                          <p className="text-gray-700">{model.explanation}</p>
                        </div>
                      )}
                      
                      {model.newPerspective && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            <Lightbulb className="w-4 h-4 mr-1" />
                            {t('mentalModels.newPerspective')}
                          </h4>
                          <p className="text-gray-700">{model.newPerspective}</p>
                        </div>
                      )}
                      
                      {model.keyInsight && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">{t('mentalModels.keyInsight')}</h4>
                          <p className="text-blue-700 font-medium">{model.keyInsight}</p>
                        </div>
                      )}
                      
                      {model.practicalAction && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            <Target className="w-4 h-4 mr-1" />
                            {t('mentalModels.practicalAction')}
                          </h4>
                          <p className="text-green-700 font-medium">{model.practicalAction}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Mental Models Generated</CardTitle>
                    <CardDescription>
                      The analysis didn't generate any mental models. Please try again with a different description.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={startNewAnalysis}>
                      Try New Analysis
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
