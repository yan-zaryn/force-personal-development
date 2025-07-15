import { api } from "encore.dev/api";
import { forceDB } from "./db";
import type { User } from "./types";

export interface CreateUserRequest {
  email: string;
  name: string;
}

// Creates a new user profile.
export const createUser = api<CreateUserRequest, User>(
  { expose: true, method: "POST", path: "/users" },
  async (req) => {
    const user = await forceDB.queryRow<User>`
      INSERT INTO users (email, name)
      VALUES (${req.email}, ${req.name})
      RETURNING id, email, name, role_description as "roleDescription", 
                target_profile as "targetProfile", created_at as "createdAt", 
                updated_at as "updatedAt"
    `;
    
    if (!user) {
      throw new Error("Failed to create user");
    }
    
    return user;
  }
);
