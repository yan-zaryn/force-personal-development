import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { forceDB } from "./db";
import type { User } from "./types";

export interface CreateUserRequest {
  email: string;
  name: string;
}

// Creates a new user profile (deprecated - use Google OAuth instead)
export const createUser = api<CreateUserRequest, User>(
  { expose: true, method: "POST", path: "/users" },
  async (req) => {
    console.log('Creating user with email:', req.email, 'name:', req.name);
    
    // Validate input
    if (!req.email || !req.name) {
      console.error('Missing required fields:', { email: req.email, name: req.name });
      throw APIError.invalidArgument("Email and name are required");
    }
    
    if (!req.email.includes('@')) {
      console.error('Invalid email format:', req.email);
      throw APIError.invalidArgument("Invalid email format");
    }
    
    try {
      // Check if user already exists
      const existingUser = await forceDB.queryRow<{ id: number }>`
        SELECT id FROM users WHERE email = ${req.email}
      `;
      
      if (existingUser) {
        console.log('User already exists with email:', req.email, 'returning existing user');
        const user = await forceDB.queryRow<User>`
          SELECT id, email, name, role_description as "roleDescription", 
                 target_profile as "targetProfile", created_at as "createdAt", 
                 updated_at as "updatedAt", picture
          FROM users 
          WHERE email = ${req.email}
        `;
        
        if (!user) {
          console.error('Failed to retrieve existing user');
          throw APIError.internal("Failed to retrieve user data");
        }
        
        return user;
      }
      
      // Create new user
      console.log('Creating new user...');
      const user = await forceDB.queryRow<User>`
        INSERT INTO users (email, name)
        VALUES (${req.email}, ${req.name})
        RETURNING id, email, name, role_description as "roleDescription", 
                  target_profile as "targetProfile", created_at as "createdAt", 
                  updated_at as "updatedAt", picture
      `;
      
      if (!user) {
        console.error('Failed to create user - no data returned from insert');
        throw APIError.internal("Failed to create user");
      }
      
      console.log('Successfully created user with ID:', user.id);
      return user;
      
    } catch (error) {
      console.error('Database error during user creation:', error);
      
      // Handle specific database errors
      if (error instanceof Error) {
        if (error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint')) {
          // This shouldn't happen due to our check above, but just in case
          console.log('Duplicate email detected, attempting to return existing user');
          const user = await forceDB.queryRow<User>`
            SELECT id, email, name, role_description as "roleDescription", 
                   target_profile as "targetProfile", created_at as "createdAt", 
                   updated_at as "updatedAt", picture
            FROM users 
            WHERE email = ${req.email}
          `;
          
          if (user) {
            return user;
          }
        }
      }
      
      // Re-throw the error if it's already an APIError
      if (error instanceof APIError) {
        throw error;
      }
      
      // Wrap other errors
      throw APIError.internal("Database error during user creation");
    }
  }
);
