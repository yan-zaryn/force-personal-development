import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { forceDB } from "./db";
import type { RoleProfile } from "./types";

const openAIKey = secret("OpenAIKey");

export interface GenerateRoleProfileRequest {
  userId: number;
  roleDescription: string;
}

// Generates an AI-powered role profile and skill map.
export const generateRoleProfile = api<GenerateRoleProfileRequest, RoleProfile>(
  { expose: true, method: "POST", path: "/users/:userId/role-profile" },
  async (req) => {
    // Update user with role description
    await forceDB.exec`
      UPDATE users 
      SET role_description = ${req.roleDescription}, updated_at = NOW()
      WHERE id = ${req.userId}
    `;

    // Generate role profile using OpenAI
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
            content: `You are an expert in professional development and skill mapping. Given a role description, create a comprehensive skill map with 4-6 skill areas, each containing 3-5 specific skills. Each skill should have a target proficiency level (1-5 scale). Return only valid JSON in this exact format:
{
  "archetype": "Role Title",
  "skillAreas": [
    {
      "area": "Area Name",
      "skills": [
        {
          "id": "unique_skill_id",
          "name": "Skill Name",
          "description": "Brief description",
          "targetLevel": 3
        }
      ]
    }
  ]
}`
          },
          {
            role: "user",
            content: `Role description: ${req.roleDescription}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', data);
      throw new Error('Invalid response from OpenAI API');
    }

    let roleProfile;
    try {
      roleProfile = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', data.choices[0].message.content);
      throw new Error('Failed to parse AI response');
    }

    // Validate the response structure
    if (!roleProfile.archetype || !roleProfile.skillAreas || !Array.isArray(roleProfile.skillAreas)) {
      console.error('Invalid role profile structure:', roleProfile);
      throw new Error('Invalid role profile generated');
    }

    // Store the target profile
    await forceDB.exec`
      UPDATE users 
      SET target_profile = ${JSON.stringify(roleProfile)}, updated_at = NOW()
      WHERE id = ${req.userId}
    `;

    return roleProfile;
  }
);
