import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '../hooks/useAuth';
import { googleClientId, googleRedirectUri } from '../config';
import backend from '~backend/client';

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export default function GoogleAuthButton({ onSuccess, className }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    if (!googleClientId) {
      toast({
        title: "Configuration Error",
        description: "Google OAuth is not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create Google OAuth URL
      const params = new URLSearchParams({
        client_id: googleClientId,
        redirect_uri: googleRedirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent'
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      // Open popup window for OAuth
      const popup = window.open(
        authUrl,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Failed to open authentication popup. Please allow popups for this site.');
      }

      // Listen for the OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
          popup.close();
          window.removeEventListener('message', handleMessage);

          try {
            // Exchange code for session
            const response = await backend.auth.googleAuth({
              code: event.data.code,
              redirectUri: googleRedirectUri
            });

            // The session cookie is set automatically by the backend
            // Now we need to get the session token from the cookie
            const sessionToken = getCookie('session');
            if (sessionToken) {
              await login(sessionToken);
              onSuccess?.();
              
              toast({
                title: "Welcome!",
                description: `Successfully signed in as ${response.user.name}`,
              });
            } else {
              throw new Error('Session not established');
            }
          } catch (error) {
            console.error('Authentication failed:', error);
            toast({
              title: "Authentication Failed",
              description: error instanceof Error ? error.message : "Failed to authenticate with Google",
              variant: "destructive",
            });
          }
        } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
          popup.close();
          window.removeEventListener('message', handleMessage);
          
          toast({
            title: "Authentication Failed",
            description: event.data.error || "Failed to authenticate with Google",
            variant: "destructive",
          });
        }

        setIsLoading(false);
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
        }
      }, 1000);

    } catch (error) {
      console.error('Google login error:', error);
      toast({
        title: "Authentication Error",
        description: error instanceof Error ? error.message : "Failed to start authentication",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className={className}
      variant="outline"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      {isLoading ? 'Signing in...' : 'Continue with Google'}
    </Button>
  );
}

// Helper function to get cookie value
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}
