import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, BookOpen, GraduationCap, Target, Zap, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { GrowthItemsSkeleton } from '../components/LoadingSkeleton';
import type { GrowthItem } from '~backend/force/types';

const typeIcons = {
  book: BookOpen,
  course: GraduationCap,
  habit: Target,
  mission: Zap,
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
};

function GrowthPlanContent() {
  const [growthItems, setGrowthItems] = useState<GrowthItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { getAuthenticatedBackend } = useAuth();

  useEffect(() => {
    const loadGrowthItems = async () => {
      try {
        const backend = getAuthenticatedBackend();
        const response = await backend.force.getGrowthItems();
        setGrowthItems(response.growthItems);
      } catch (error) {
        console.error('Failed to load growth items:', error);
        toast({
          title: t('common.error'),
          description: "Failed to load your growth plan. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadGrowthItems();
  }, [toast, t, getAuthenticatedBackend]);

  const generateGrowthPlan = async () => {
    setIsGenerating(true);
    try {
      const backend = getAuthenticatedBackend();
      const response = await backend.force.generateGrowthPlan();
      setGrowthItems(response.growthItems);
      
      if (response.growthItems.length > 0) {
        toast({
          title: t('growthPlan.generated'),
          description: t('growthPlan.generatedMessage').replace('{count}', response.growthItems.length.toString()),
        });
      } else {
        toast({
          title: t('growthPlan.noGaps'),
          description: t('growthPlan.noGapsMessage'),
        });
      }
    } catch (error) {
      console.error('Failed to generate growth plan:', error);
      toast({
        title: t('common.error'),
        description: "Failed to generate your growth plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateItemStatus = async (itemId: number, status: GrowthItem['status']) => {
    try {
      const backend = getAuthenticatedBackend();
      const updatedItem = await backend.force.updateGrowthItemStatus({
        itemId,
        status
      });

      setGrowthItems(prev => 
        prev.map(item => item.id === itemId ? updatedItem : item)
      );

      toast({
        title: t('growthPlan.statusUpdated'),
        description: t('growthPlan.statusUpdatedMessage').replace('{status}', status.replace('_', ' ')),
      });
    } catch (error) {
      console.error('Failed to update item status:', error);
      toast({
        title: t('common.error'),
        description: "Failed to update item status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const groupedItems = growthItems.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, GrowthItem[]>);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>
        <GrowthItemsSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('growthPlan.title')}</h1>
        <p className="text-gray-600">
          {t('growthPlan.subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        {growthItems.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('growthPlan.generate')}</CardTitle>
              <CardDescription>
                {t('growthPlan.generateDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={generateGrowthPlan} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('growthPlan.generating')}
                  </>
                ) : (
                  t('growthPlan.generateButton')
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">{t('growthPlan.recommendations')}</h2>
              <Button onClick={generateGrowthPlan} variant="outline" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('growthPlan.regenerating')}
                  </>
                ) : (
                  t('growthPlan.regenerate')
                )}
              </Button>
            </div>

            {Object.entries(groupedItems).map(([type, items]) => {
              const Icon = typeIcons[type as keyof typeof typeIcons];
              const typeLabel = t(`growthPlan.${type}s`);
              
              return (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Icon className="w-5 h-5 mr-2" />
                      {typeLabel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <Badge className={statusColors[item.status]}>
                            {t(`growthPlan.${item.status.replace('_', '')}`)}
                          </Badge>
                        </div>
                        <Select
                          value={item.status}
                          onValueChange={(value) => updateItemStatus(item.id, value as GrowthItem['status'])}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">{t('growthPlan.pending')}</SelectItem>
                            <SelectItem value="in_progress">{t('growthPlan.inProgress')}</SelectItem>
                            <SelectItem value="done">{t('growthPlan.done')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}

            <div className="pt-4">
              <Button onClick={() => navigate('/progress')}>
                {t('growthPlan.continue')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function GrowthPlanPage() {
  return (
    <ErrorBoundary>
      <GrowthPlanContent />
    </ErrorBoundary>
  );
}
