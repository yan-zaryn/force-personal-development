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
    console.log('Starting role profile generation for user:', req.userId);
    console.log('Role description length:', req.roleDescription.length);

    // Update user with role description first
    await forceDB.exec`
      UPDATE users 
      SET role_description = ${req.roleDescription}, updated_at = NOW()
      WHERE id = ${req.userId}
    `;
    console.log('Updated user role description in database');

    // Detect the language of the input to ensure response is in the same language
    const detectLanguagePrompt = `Detect the language of this text and respond with just the language name in English: "${req.roleDescription.substring(0, 200)}"`;
    
    console.log('Detecting input language...');
    const languageDetectionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: detectLanguagePrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 50
      })
    });

    let detectedLanguage = "English"; // Default fallback
    if (languageDetectionResponse.ok) {
      try {
        const languageData = await languageDetectionResponse.json();
        detectedLanguage = languageData.choices[0].message.content.trim();
        console.log('Detected language:', detectedLanguage);
      } catch (error) {
        console.warn('Failed to detect language, using English as default:', error);
      }
    } else {
      console.warn('Language detection API call failed, using English as default');
    }

    // Generate role profile using OpenAI with language-aware prompt
    const requestBody = {
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert in professional development and skill mapping. Given a role description, create a comprehensive skill map with 4-6 skill areas, each containing 3-5 specific skills. Each skill should have a target proficiency level (1-5 scale).

IMPORTANT: Respond in ${detectedLanguage}. All field names, descriptions, and content should be in ${detectedLanguage}, matching the language of the input role description.

Return only valid JSON in this exact format:
{
  "archetype": "Role Title in ${detectedLanguage}",
  "skillAreas": [
    {
      "area": "Area Name in ${detectedLanguage}",
      "skills": [
        {
          "id": "unique_skill_id_in_english",
          "name": "Skill Name in ${detectedLanguage}",
          "description": "Brief description in ${detectedLanguage}",
          "targetLevel": 3
        }
      ]
    }
  ]
}

Note: Keep the "id" field in English using underscores (for technical compatibility), but all other text should be in ${detectedLanguage}.`
        },
        {
          role: "user",
          content: `Role description: ${req.roleDescription}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    };

    console.log('Making OpenAI API request for role profile generation...');
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} ${response.statusText}`, errorText);
      
      if (response.status === 401) {
        throw new Error('OpenAI API key is invalid or missing');
      } else if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later');
      } else if (response.status === 500) {
        throw new Error('OpenAI service is temporarily unavailable');
      } else {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log('OpenAI API response received, parsing...');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', JSON.stringify(data, null, 2));
      throw new Error('Invalid response from OpenAI API');
    }

    const messageContent = data.choices[0].message.content;
    console.log('OpenAI response content:', messageContent);

    let roleProfile;
    try {
      roleProfile = JSON.parse(messageContent);
      console.log('Successfully parsed role profile:', JSON.stringify(roleProfile, null, 2));
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', messageContent);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse AI response as valid JSON');
    }

    // Validate the response structure
    if (!roleProfile.archetype || !roleProfile.skillAreas || !Array.isArray(roleProfile.skillAreas)) {
      console.error('Invalid role profile structure:', JSON.stringify(roleProfile, null, 2));
      throw new Error('Invalid role profile structure generated by AI');
    }

    // Validate skill areas
    for (const area of roleProfile.skillAreas) {
      if (!area.area || !area.skills || !Array.isArray(area.skills)) {
        console.error('Invalid skill area structure:', JSON.stringify(area, null, 2));
        throw new Error('Invalid skill area structure in role profile');
      }
      
      for (const skill of area.skills) {
        if (!skill.id || !skill.name || !skill.description || typeof skill.targetLevel !== 'number') {
          console.error('Invalid skill structure:', JSON.stringify(skill, null, 2));
          throw new Error('Invalid skill structure in role profile');
        }
      }
    }

    console.log('Role profile validation passed, saving to database...');

    // Store the target profile as JSONB
    const profileJson = JSON.stringify(roleProfile);
    console.log('Saving profile JSON:', profileJson);

    await forceDB.exec`
      UPDATE users 
      SET target_profile = ${profileJson}::jsonb, updated_at = NOW()
      WHERE id = ${req.userId}
    `;

    console.log('Role profile saved successfully to database');

    // Verify the profile was saved by querying it back
    const savedUser = await forceDB.queryRow`
      SELECT target_profile 
      FROM users 
      WHERE id = ${req.userId}
    `;
    
    if (!savedUser || !savedUser.target_profile) {
      console.error('Failed to verify saved profile');
      throw new Error('Failed to save role profile to database');
    }
    
    console.log('Profile save verification successful. Saved profile:', JSON.stringify(savedUser.target_profile, null, 2));
    return roleProfile;
  }
);
