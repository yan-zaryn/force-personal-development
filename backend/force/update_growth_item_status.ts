import { api, APIError } from "encore.dev/api";
import { forceDB } from "./db";
import type { GrowthItem } from "./types";

export interface UpdateGrowthItemStatusRequest {
  userId: number;
  itemId: number;
  status: 'pending' | 'in_progress' | 'done';
}

// Updates the status of a growth plan item.
export const updateGrowthItemStatus = api<UpdateGrowthItemStatusRequest, GrowthItem>(
  { expose: true, method: "PUT", path: "/users/:userId/growth-items/:itemId/status" },
  async (req) => {
    const item = await forceDB.queryRow<GrowthItem>`
      UPDATE growth_items 
      SET status = ${req.status}, updated_at = NOW()
      WHERE id = ${req.itemId} AND user_id = ${req.userId}
      RETURNING id, user_id as "userId", type, title, description, link, status,
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (!item) {
      throw APIError.notFound("growth item not found");
    }

    return item;
  }
);
