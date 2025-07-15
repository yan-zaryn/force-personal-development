import { api } from "encore.dev/api";
import { forceDB } from "./db";
import type { ReflectionEntry } from "./types";

export interface GetReflectionsParams {
  userId: number;
}

export interface GetReflectionsResponse {
  reflections: ReflectionEntry[];
}

// Retrieves all reflection entries for a user.
export const getReflections = api<GetReflectionsParams, GetReflectionsResponse>(
  { expose: true, method: "GET", path: "/users/:userId/reflections" },
  async (params) => {
    const reflections: ReflectionEntry[] = [];
    
    for await (const row of forceDB.query<ReflectionEntry>`
      SELECT id, user_id as "userId", content, type, created_at as "createdAt"
      FROM reflection_entries 
      WHERE user_id = ${params.userId}
      ORDER BY created_at DESC
    `) {
      reflections.push(row);
    }

    return { reflections };
  }
);
