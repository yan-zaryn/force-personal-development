import { api, APIError } from "encore.dev/api";
import { forceDB } from "./db";
import type { User } from "./types";

export interface GetUserParams {
  id: number;
}

// Retrieves a user by ID.
export const getUser = api<GetUserParams, User>(
  { expose: true, method: "GET", path: "/users/:id" },
  async (params) => {
    console.log('Getting user with ID:', params.id);
    
    const user = await forceDB.queryRow<{
      id: number;
      email: string;
      name: string;
      role_description: string | null;
      target_profile: any;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, email, name, role_description, target_profile, created_at, updated_at
      FROM users 
      WHERE id = ${params.id}
    `;
    
    if (!user) {
      console.error('User not found with ID:', params.id);
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
      updatedAt: user.updated_at
    };
    
    console.log('Returning user data with targetProfile:', !!result.targetProfile);
    return result;
  }
);
