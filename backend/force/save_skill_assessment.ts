import { api } from "encore.dev/api";
import { forceDB } from "./db";
import type { SkillAssessment } from "./types";

export interface SaveSkillAssessmentRequest {
  userId: number;
  skillId: string;
  area: string;
  name: string;
  targetLevel: number;
  currentLevel: number;
  examples?: string;
}

// Saves or updates a skill self-assessment.
export const saveSkillAssessment = api<SaveSkillAssessmentRequest, SkillAssessment>(
  { expose: true, method: "POST", path: "/users/:userId/skills" },
  async (req) => {
    const assessment = await forceDB.queryRow<SkillAssessment>`
      INSERT INTO skill_assessments 
        (user_id, skill_id, area, name, target_level, current_level, examples)
      VALUES 
        (${req.userId}, ${req.skillId}, ${req.area}, ${req.name}, 
         ${req.targetLevel}, ${req.currentLevel}, ${req.examples})
      ON CONFLICT (user_id, skill_id) 
      DO UPDATE SET 
        current_level = EXCLUDED.current_level,
        examples = EXCLUDED.examples,
        updated_at = NOW()
      RETURNING id, user_id as "userId", skill_id as "skillId", area, name,
                target_level as "targetLevel", current_level as "currentLevel",
                examples, recommended_resources as "recommendedResources",
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (!assessment) {
      throw new Error("Failed to save skill assessment");
    }

    return assessment;
  }
);
