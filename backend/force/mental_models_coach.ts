import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { forceDB } from "./db";
import type { MentalModelSession, MentalModel } from "./types";

const openAIKey = secret("OpenAIKey");

export interface MentalModelsCoachRequest {
  userId: number;
  prompt: string;
}

// Provides mental model analysis for complex decisions and dilemmas.
export const mentalModelsCoach = api<MentalModelsCoachRequest, MentalModelSession>(
  { expose: true, method: "POST", path: "/users/:userId/mental-models" },
  async (req) => {
    console.log('Generating mental models analysis for user:', req.userId);
    
    // Generate mental models analysis using OpenAI
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
            content: `You are a strategic thinking coach specializing in mental models. Given a user's dilemma or decision, provide exactly 5 relevant mental models that offer different perspectives. Return only valid JSON in this exact format:

{
  "models": [
    {
      "name": "Mental Model Name",
      "explanation": "Brief explanation of the model",
      "newPerspective": "How this model reframes the situation",
      "keyInsight": "The key insight this model reveals",
      "practicalAction": "One specific action the user can take based on this model"
    }
  ]
}

Choose diverse mental models that complement each other and provide genuinely different angles on the problem. Focus on actionable insights.`
          },
          {
            role: "user",
            content: req.prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    console.log('Generated', analysis.models.length, 'mental models');

    // Save the session to database
    const session = await forceDB.queryRow<MentalModelSession>`
      INSERT INTO mental_model_sessions (user_id, prompt, models)
      VALUES (${req.userId}, ${req.prompt}, ${JSON.stringify(analysis.models)})
      RETURNING id, user_id as "userId", prompt, models, created_at as "createdAt"
    `;

    if (!session) {
      console.error('Failed to save mental model session for user:', req.userId);
      throw new Error("Failed to save mental model session");
    }

    console.log('Successfully saved mental model session:', session.id);
    return session;
  }
);
