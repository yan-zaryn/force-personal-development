import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { forceDB } from "./db";
import type { ReflectionEntry } from "./types";

export interface SaveReflectionRequest {
  content: string;
  type?: 'general' | 'weekly_review' | 'mental_model';
}

// Saves a reflection entry to the authenticated user's journal
export const saveReflection = api<SaveReflectionRequest, ReflectionEntry>(
  { expose: true, method: "POST", path: "/reflections", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID);
    
    console.log('Saving reflection for user:', userId, 'type:', req.type || 'general');
    
    const reflection = await forceDB.queryRow<ReflectionEntry>`
      INSERT INTO reflection_entries (user_id, content, type)
      VALUES (${userId}, ${req.content}, ${req.type || 'general'})
      RETURNING id, user_id as "userId", content, type, created_at as "createdAt"
    `;

    if (!reflection) {
      console.error('Failed to save reflection for user:', userId);
      throw new Error("Failed to save reflection");
    }

    console.log('Successfully saved reflection:', reflection.id);
    return reflection;
  }
);
