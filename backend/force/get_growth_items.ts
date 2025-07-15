import { api } from "encore.dev/api";
import { forceDB } from "./db";
import type { GrowthItem } from "./types";

export interface GetGrowthItemsParams {
  userId: number;
}

export interface GetGrowthItemsResponse {
  growthItems: GrowthItem[];
}

// Retrieves all growth plan items for a user.
export const getGrowthItems = api<GetGrowthItemsParams, GetGrowthItemsResponse>(
  { expose: true, method: "GET", path: "/users/:userId/growth-items" },
  async (params) => {
    const growthItems: GrowthItem[] = [];
    
    for await (const row of forceDB.query<GrowthItem>`
      SELECT id, user_id as "userId", type, title, description, link, status,
             created_at as "createdAt", updated_at as "updatedAt"
      FROM growth_items 
      WHERE user_id = ${params.userId}
      ORDER BY created_at DESC
    `) {
      growthItems.push(row);
    }

    return { growthItems };
  }
);
