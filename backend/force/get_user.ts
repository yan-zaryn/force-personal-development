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
    const user = await forceDB.queryRow<User>`
      SELECT id, email, name, role_description as "roleDescription", 
             target_profile as "targetProfile", created_at as "createdAt", 
             updated_at as "updatedAt"
      FROM users 
      WHERE id = ${params.id}
    `;
    
    if (!user) {
      throw APIError.notFound("user not found");
    }
    
    return user;
  }
);
