import { api } from "encore.dev/api";
import { forceDB } from "./db";
import type { SkillAssessment } from "./types";

export interface GetSkillAssessmentsParams {
  userId: number;
}

export interface GetSkillAssessmentsResponse {
  assessments: SkillAssessment[];
}

// Retrieves all skill assessments for a user.
export const getSkillAssessments = api<GetSkillAssessmentsParams, GetSkillAssessmentsResponse>(
  { expose: true, method: "GET", path: "/users/:userId/skills" },
  async (params) => {
    const assessments: SkillAssessment[] = [];
    
    for await (const row of forceDB.query<SkillAssessment>`
      SELECT id, user_id as "userId", skill_id as "skillId", area, name,
             target_level as "targetLevel", current_level as "currentLevel",
             examples, recommended_resources as "recommendedResources",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM skill_assessments 
      WHERE user_id = ${params.userId}
      ORDER BY area, name
    `) {
      assessments.push(row);
    }

    return { assessments };
  }
);
