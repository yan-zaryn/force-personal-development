import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { forceDB } from "./db";
import type { ReflectionEntry } from "./types";

export interface GetReflectionsResponse {
  reflections: ReflectionEntry[];
}

// Retrieves all reflection entries for the authenticated user
export const getReflections = api<void, GetReflectionsResponse>(
  { expose: true, method: "GET", path: "/reflections", auth: true },
  async () => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID);
    
    const reflections: ReflectionEntry[] = [];
    
    for await (const row of forceDB.query<ReflectionEntry>`
      SELECT id, user_id as "userId", content, type, created_at as "createdAt"
      FROM reflection_entries 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `) {
      reflections.push(row);
    }

    return { reflections };
  }
);
