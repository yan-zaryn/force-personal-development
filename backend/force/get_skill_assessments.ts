import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { forceDB } from "./db";
import type { SkillAssessment } from "./types";

export interface GetSkillAssessmentsResponse {
  assessments: SkillAssessment[];
}

// Retrieves all skill assessments for the authenticated user
export const getSkillAssessments = api<void, GetSkillAssessmentsResponse>(
  { expose: true, method: "GET", path: "/skills", auth: true },
  async () => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID);
    
    const assessments: SkillAssessment[] = [];
    
    for await (const row of forceDB.query<SkillAssessment>`
      SELECT id, user_id as "userId", skill_id as "skillId", area, name,
             target_level as "targetLevel", current_level as "currentLevel",
             examples, recommended_resources as "recommendedResources",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM skill_assessments 
      WHERE user_id = ${userId}
      ORDER BY area, name
    `) {
      assessments.push(row);
    }

    return { assessments };
  }
);
