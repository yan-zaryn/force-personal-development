// Google OAuth configuration
// Set this to your Google OAuth client ID from the Google Cloud Console
// You can find this in: Google Cloud Console > APIs & Credentials > OAuth 2.0 Client IDs
export const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

// The redirect URI for Google OAuth (should match what's configured in Google Cloud Console)
export const googleRedirectUri = window.location.origin + "/auth/callback";

// API base URL
export const apiBaseUrl = "";
