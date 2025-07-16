import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'profile' | 'form' | 'stats' | 'skills' | 'growth-items';
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ variant = 'card', count = 1, className = '' }: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <Card className={className}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        );

      case 'list':
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        );

      case 'profile':
        return (
          <div className={`space-y-6 ${className}`}>
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
              </CardContent>
            </Card>
            <div className="grid md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-2 w-full mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'form':
        return (
          <Card className={className}>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        );

      case 'stats':
        return (
          <div className={`grid md:grid-cols-4 gap-6 ${className}`}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-2 w-full mt-2" />
                  <Skeleton className="h-3 w-3/4 mt-1" />
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'skills':
        return (
          <div className={`space-y-6 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-3 w-3/4 mt-1" />
                        </div>
                        <Skeleton className="h-6 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'growth-items':
        return (
          <div className={`space-y-6 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center">
                    <Skeleton className="h-5 w-5 mr-2" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-4" />
                        </div>
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-8 w-32" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        );

      default:
        return <Skeleton className={`h-4 w-full ${className}`} />;
    }
  };

  if (count === 1) {
    return renderSkeleton();
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  );
}

// Specific skeleton components for common use cases
export function CardSkeleton({ className = '' }: { className?: string }) {
  return <LoadingSkeleton variant="card" className={className} />;
}

export function ListSkeleton({ count = 3, className = '' }: { count?: number; className?: string }) {
  return <LoadingSkeleton variant="list" count={count} className={className} />;
}

export function ProfileSkeleton({ className = '' }: { className?: string }) {
  return <LoadingSkeleton variant="profile" className={className} />;
}

export function FormSkeleton({ className = '' }: { className?: string }) {
  return <LoadingSkeleton variant="form" className={className} />;
}

export function StatsSkeleton({ className = '' }: { className?: string }) {
  return <LoadingSkeleton variant="stats" className={className} />;
}

export function SkillsSkeleton({ count = 2, className = '' }: { count?: number; className?: string }) {
  return <LoadingSkeleton variant="skills" count={count} className={className} />;
}

export function GrowthItemsSkeleton({ count = 2, className = '' }: { count?: number; className?: string }) {
  return <LoadingSkeleton variant="growth-items" count={count} className={className} />;
}
