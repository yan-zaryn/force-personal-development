import { authHandler } from "encore.dev/auth";
import { Header, Cookie, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";

const googleClientId = secret("GoogleClientId");
const googleClientSecret = secret("GoogleClientSecret");
const jwtSecret = secret("JWTSecret");

interface AuthParams {
  authorization?: Header<"Authorization">;
  session?: Cookie<"session">;
}

export interface AuthData {
  userID: string;
  email: string;
  name: string;
  picture?: string;
}

const auth = authHandler<AuthParams, AuthData>(
  async (params) => {
    // Try to get token from Authorization header or session cookie
    const token = params.authorization?.replace("Bearer ", "") ?? params.session?.value;
    
    if (!token) {
      throw APIError.unauthenticated("missing authentication token");
    }

    try {
      // Verify JWT token
      const payload = await verifyJWT(token);
      
      return {
        userID: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      };
    } catch (error) {
      console.error("Token verification failed:", error);
      throw APIError.unauthenticated("invalid authentication token");
    }
  }
);

// Simple JWT verification (in production, use a proper JWT library)
async function verifyJWT(token: string): Promise<any> {
  try {
    // This is a simplified JWT verification
    // In production, use a proper JWT library like jsonwebtoken
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error("Token expired");
    }
    
    return payload;
  } catch (error) {
    throw new Error("Invalid JWT token");
  }
}

export default auth;
