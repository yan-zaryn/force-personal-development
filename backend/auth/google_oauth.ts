import { api, Cookie } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { forceDB } from "../force/db";

const googleClientId = secret("GoogleClientId");
const googleClientSecret = secret("GoogleClientSecret");
const jwtSecret = secret("JWTSecret");

export interface GoogleAuthRequest {
  code: string;
  redirectUri: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string;
    picture?: string;
  };
  session: Cookie<"session">;
}

// Exchange Google OAuth code for user session
export const googleAuth = api<GoogleAuthRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/google" },
  async (req) => {
    console.log('Processing Google OAuth callback with code:', req.code.substring(0, 10) + '...');
    
    try {
      // Exchange code for access token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: googleClientId(),
          client_secret: googleClientSecret(),
          code: req.code,
          grant_type: "authorization_code",
          redirect_uri: req.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Google token exchange failed:', errorText);
        throw new Error(`Google token exchange failed: ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('Google token exchange successful');

      // Get user info from Google
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        console.error('Failed to fetch user info from Google');
        throw new Error("Failed to fetch user info from Google");
      }

      const googleUser = await userResponse.json();
      console.log('Google user info retrieved:', { id: googleUser.id, email: googleUser.email, name: googleUser.name });

      // Find or create user in database
      let user = await forceDB.queryRow<{
        id: number;
        email: string;
        name: string;
        google_id: string;
        picture: string;
        created_at: Date;
        updated_at: Date;
      }>`
        SELECT id, email, name, google_id, picture, created_at, updated_at
        FROM users 
        WHERE google_id = ${googleUser.id} OR email = ${googleUser.email}
      `;

      if (!user) {
        console.log('Creating new user for Google ID:', googleUser.id);
        // Create new user
        user = await forceDB.queryRow<{
          id: number;
          email: string;
          name: string;
          google_id: string;
          picture: string;
          created_at: Date;
          updated_at: Date;
        }>`
          INSERT INTO users (email, name, google_id, picture)
          VALUES (${googleUser.email}, ${googleUser.name}, ${googleUser.id}, ${googleUser.picture})
          RETURNING id, email, name, google_id, picture, created_at, updated_at
        `;

        if (!user) {
          throw new Error("Failed to create user");
        }
        console.log('New user created with ID:', user.id);
      } else {
        console.log('Existing user found with ID:', user.id);
        // Update existing user with latest Google info
        user = await forceDB.queryRow<{
          id: number;
          email: string;
          name: string;
          google_id: string;
          picture: string;
          created_at: Date;
          updated_at: Date;
        }>`
          UPDATE users 
          SET name = ${googleUser.name}, 
              picture = ${googleUser.picture}, 
              google_id = ${googleUser.id},
              updated_at = NOW()
          WHERE id = ${user.id}
          RETURNING id, email, name, google_id, picture, created_at, updated_at
        `;

        if (!user) {
          throw new Error("Failed to update user");
        }
      }

      // Create JWT token
      const jwtPayload = {
        sub: user.id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      };

      // Simple JWT creation (in production, use a proper JWT library)
      const token = await createJWT(jwtPayload);

      console.log('Authentication successful for user:', user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
        session: {
          value: token,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          httpOnly: true,
          secure: true,
          sameSite: "Lax",
        },
      };
    } catch (error) {
      console.error('Google OAuth error:', error);
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Simple JWT creation (in production, use a proper JWT library)
async function createJWT(payload: any): Promise<string> {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  // In production, use proper HMAC signing
  const signature = btoa(`${encodedHeader}.${encodedPayload}.${jwtSecret()}`);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export interface LogoutResponse {
  success: boolean;
  session: Cookie<"session">;
}

// Logout endpoint
export const logout = api<void, LogoutResponse>(
  { expose: true, method: "POST", path: "/auth/logout" },
  async () => {
    return {
      success: true,
      session: {
        value: "",
        expires: new Date(0), // Expire immediately
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      },
    };
  }
);
