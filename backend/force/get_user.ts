import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { forceDB } from "./db";
import type { User } from "./types";

export interface GetUserParams {
  id: number;
}

// Retrieves a user by ID
export const getUser = api<GetUserParams, User>(
  { expose: true, method: "GET", path: "/users/:id", auth: true },
  async (params) => {
    const auth = getAuthData()!;
    const userId = params.id;
    
    console.log('Getting user with ID:', userId);
    
    const user = await forceDB.queryRow<{
      id: number;
      email: string;
      name: string;
      role_description: string | null;
      target_profile: any;
      created_at: Date;
      updated_at: Date;
      picture: string | null;
    }>`
      SELECT id, email, name, role_description, target_profile, created_at, updated_at, picture
      FROM users 
      WHERE id = ${userId}
    `;
    
    if (!user) {
      console.error('User not found with ID:', userId);
      throw APIError.notFound("user not found");
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      hasRoleDescription: !!user.role_description,
      hasTargetProfile: !!user.target_profile
    });

    // Parse the target_profile if it exists
    let targetProfile = null;
    if (user.target_profile) {
      try {
        // If it's already an object (JSONB), use it directly
        targetProfile = typeof user.target_profile === 'string' 
          ? JSON.parse(user.target_profile) 
          : user.target_profile;
        console.log('Parsed target profile:', JSON.stringify(targetProfile, null, 2));
      } catch (error) {
        console.error('Failed to parse target_profile:', error);
        targetProfile = null;
      }
    }
    
    const result: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      roleDescription: user.role_description || undefined,
      targetProfile: targetProfile,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      picture: user.picture || undefined
    };
    
    console.log('Returning user data with targetProfile:', !!result.targetProfile);
    return result;
  }
);

// Get current authenticated user
export const getCurrentUser = api<void, User>(
  { expose: true, method: "GET", path: "/auth/me", auth: true },
  async () => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID);
    
    console.log('Getting current user with ID:', userId);
    
    const user = await forceDB.queryRow<{
      id: number;
      email: string;
      name: string;
      role_description: string | null;
      target_profile: any;
      created_at: Date;
      updated_at: Date;
      picture: string | null;
    }>`
      SELECT id, email, name, role_description, target_profile, created_at, updated_at, picture
      FROM users 
      WHERE id = ${userId}
    `;
    
    if (!user) {
      console.error('Current user not found with ID:', userId);
      throw APIError.notFound("user not found");
    }

    // Parse the target_profile if it exists
    let targetProfile = null;
    if (user.target_profile) {
      try {
        targetProfile = typeof user.target_profile === 'string' 
          ? JSON.parse(user.target_profile) 
          : user.target_profile;
      } catch (error) {
        console.error('Failed to parse target_profile:', error);
        targetProfile = null;
      }
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roleDescription: user.role_description || undefined,
      targetProfile: targetProfile,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      picture: user.picture || undefined
    };
  }
);
