import { useEffect } from 'react';

export default function AuthCallback() {
  useEffect(() => {
    // Get the authorization code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      // Send error to parent window
      window.opener?.postMessage({
        type: 'GOOGLE_OAUTH_ERROR',
        error: error
      }, window.location.origin);
    } else if (code) {
      // Send success with code to parent window
      window.opener?.postMessage({
        type: 'GOOGLE_OAUTH_SUCCESS',
        code: code
      }, window.location.origin);
    } else {
      // No code or error - something went wrong
      window.opener?.postMessage({
        type: 'GOOGLE_OAUTH_ERROR',
        error: 'No authorization code received'
      }, window.location.origin);
    }

    // Close the popup
    window.close();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
