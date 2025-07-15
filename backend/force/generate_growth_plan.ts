import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { forceDB } from "./db";
import type { GrowthItem, SkillAssessment } from "./types";

const openAIKey = secret("OpenAIKey");

export interface GenerateGrowthPlanRequest {
  userId: number;
}

export interface GenerateGrowthPlanResponse {
  growthItems: GrowthItem[];
}

// Generates a personalized growth plan based on skill gaps.
export const generateGrowthPlan = api<GenerateGrowthPlanRequest, GenerateGrowthPlanResponse>(
  { expose: true, method: "POST", path: "/users/:userId/growth-plan" },
  async (req) => {
    console.log('Generating growth plan for user:', req.userId);
    
    // Get user's skill assessments
    const assessments: SkillAssessment[] = [];
    for await (const row of forceDB.query<SkillAssessment>`
      SELECT id, user_id as "userId", skill_id as "skillId", area, name,
             target_level as "targetLevel", current_level as "currentLevel",
             examples, recommended_resources as "recommendedResources",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM skill_assessments 
      WHERE user_id = ${req.userId}
    `) {
      assessments.push(row);
    }

    console.log('Found', assessments.length, 'skill assessments');

    // Calculate skill gaps
    const skillGaps = assessments
      .filter(a => a.currentLevel < a.targetLevel)
      .map(a => ({
        skill: a.name,
        area: a.area,
        gap: a.targetLevel - a.currentLevel,
        currentLevel: a.currentLevel,
        targetLevel: a.targetLevel
      }));

    console.log('Found', skillGaps.length, 'skill gaps');

    if (skillGaps.length === 0) {
      console.log('No skill gaps found, returning empty growth plan');
      return { growthItems: [] };
    }

    // Generate growth plan using OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a professional development coach. Given skill gaps, create a personalized growth plan with specific, actionable items. Return only valid JSON in this exact format:
{
  "growthItems": [
    {
      "type": "book|course|habit|mission",
      "title": "Specific Title",
      "description": "Detailed description",
      "link": "URL if applicable or null"
    }
  ]
}

Types:
- book: Specific book recommendations
- course: Online courses or training programs
- habit: Daily/weekly practices to develop
- mission: Specific projects or challenges to undertake

Provide 3-8 items total, prioritizing the biggest skill gaps.`
          },
          {
            role: "user",
            content: `Skill gaps to address: ${JSON.stringify(skillGaps)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const plan = JSON.parse(data.choices[0].message.content);

    console.log('Generated', plan.growthItems.length, 'growth items');

    // Save growth items to database
    const growthItems: GrowthItem[] = [];
    for (const item of plan.growthItems) {
      const savedItem = await forceDB.queryRow<GrowthItem>`
        INSERT INTO growth_items (user_id, type, title, description, link)
        VALUES (${req.userId}, ${item.type}, ${item.title}, ${item.description}, ${item.link})
        RETURNING id, user_id as "userId", type, title, description, link, status,
                  created_at as "createdAt", updated_at as "updatedAt"
      `;
      if (savedItem) {
        growthItems.push(savedItem);
        console.log('Saved growth item:', savedItem.id, savedItem.title);
      }
    }

    console.log('Successfully saved', growthItems.length, 'growth items');
    return { growthItems };
  }
);
