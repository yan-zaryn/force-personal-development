import { api } from "encore.dev/api";
import { forceDB } from "./db";
import type { ReflectionEntry } from "./types";

export interface SaveReflectionRequest {
  userId: number;
  content: string;
  type?: 'general' | 'weekly_review' | 'mental_model';
}

// Saves a reflection entry to the user's journal.
export const saveReflection = api<SaveReflectionRequest, ReflectionEntry>(
  { expose: true, method: "POST", path: "/users/:userId/reflections" },
  async (req) => {
    const reflection = await forceDB.queryRow<ReflectionEntry>`
      INSERT INTO reflection_entries (user_id, content, type)
      VALUES (${req.userId}, ${req.content}, ${req.type || 'general'})
      RETURNING id, user_id as "userId", content, type, created_at as "createdAt"
    `;

    if (!reflection) {
      throw new Error("Failed to save reflection");
    }

    return reflection;
  }
);
