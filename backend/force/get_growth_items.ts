import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { forceDB } from "./db";
import type { GrowthItem } from "./types";

export interface GetGrowthItemsResponse {
  growthItems: GrowthItem[];
}

// Retrieves all growth plan items for the authenticated user
export const getGrowthItems = api<void, GetGrowthItemsResponse>(
  { expose: true, method: "GET", path: "/growth-items", auth: true },
  async () => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID);
    
    const growthItems: GrowthItem[] = [];
    
    for await (const row of forceDB.query<GrowthItem>`
      SELECT id, user_id as "userId", type, title, description, link, status,
             created_at as "createdAt", updated_at as "updatedAt"
      FROM growth_items 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `) {
      growthItems.push(row);
    }

    return { growthItems };
  }
);
