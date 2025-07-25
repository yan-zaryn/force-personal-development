import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { secret } from "encore.dev/config";
import { forceDB } from "./db";
import type { MentalModelSession, MentalModel } from "./types";

const openAIKey = secret("OpenAIKey");

export interface MentalModelsCoachRequest {
  prompt: string;
}

// Provides mental model analysis for complex decisions and dilemmas for the authenticated user
export const mentalModelsCoach = api<MentalModelsCoachRequest, MentalModelSession>(
  { expose: true, method: "POST", path: "/mental-models", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID);
    
    console.log('Generating mental models analysis for user:', userId);
    console.log('User prompt:', req.prompt);
    
    // Generate mental models analysis using OpenAI with the specific prompt pattern
    const requestBody = {
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a strategic thinking coach specializing in mental models. For user requests, follow this exact pattern:

Choose exactly 5 mental models

For Each Mental Model:
1. Name & Brief Explanation – Name the model and explain it in one sentence
2. New Perspective – Show how this model reframes the user's situation
3. Key Insight – Reveal the non-obvious truth this model exposes
4. Practical Action – Suggest one specific action they can take

Mental Models to Choose From (Select the 5 MOST RELEVANT):
• First Principles Thinking
• Inversion (thinking backwards)
• Opportunity Cost
• Second-Order Thinking
• Margin of Diminishing Returns
• Occam's Razor
• Hanlon's Razor
• Confirmation Bias
• Availability Heuristic
• Parkinson's Law
• Loss Aversion
• Switching Costs
• Circle of Competence
• Regret Minimization
• Leverage Points
• Pareto Principle (80/20 Rule)
• Lindy Effect
• Game Theory
• System 1 vs System 2 Thinking
• Antifragility

Guidelines:
• Prioritize models that generate the most surprising insights
• Make each perspective genuinely different and thought-provoking
• Be concise but profound
• Focus on practical wisdom they can apply immediately

Return your response as valid JSON in this exact format:
{
  "models": [
    {
      "name": "Mental Model Name",
      "explanation": "Brief one-sentence explanation of the model",
      "newPerspective": "How this model reframes their situation",
      "keyInsight": "The non-obvious truth this model exposes",
      "practicalAction": "One specific action they can take based on this model"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. Do not include any text before or after the JSON.`
        },
        {
          role: "user",
          content: req.prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };

    console.log('Making OpenAI API request with updated prompt...');
    
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
    console.log('OpenAI API response received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', JSON.stringify(data, null, 2));
      throw new Error('Invalid response from OpenAI API');
    }

    const messageContent = data.choices[0].message.content;
    console.log('OpenAI response content:', messageContent);

    let analysis;
    try {
      analysis = JSON.parse(messageContent);
      console.log('Successfully parsed mental models analysis:', JSON.stringify(analysis, null, 2));
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', messageContent);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse AI response as valid JSON. Please try rephrasing your situation.');
    }

    // Validate the response structure
    if (!analysis.models || !Array.isArray(analysis.models)) {
      console.error('Invalid analysis structure - missing or invalid models array:', JSON.stringify(analysis, null, 2));
      throw new Error('Invalid mental models structure generated by AI');
    }

    if (analysis.models.length !== 5) {
      console.error(`Expected exactly 5 mental models, got ${analysis.models.length}`);
      throw new Error('AI did not generate exactly 5 mental models as requested');
    }

    // Validate each mental model
    for (let i = 0; i < analysis.models.length; i++) {
      const model = analysis.models[i];
      if (!model.name || !model.explanation || !model.newPerspective || !model.keyInsight || !model.practicalAction) {
        console.error(`Invalid mental model structure at index ${i}:`, JSON.stringify(model, null, 2));
        throw new Error(`Mental model ${i + 1} is missing required fields`);
      }
    }

    console.log('Mental models analysis validation passed');

    // Save the session to database
    const modelsJson = JSON.stringify(analysis.models);
    console.log('Saving mental models session to database...');

    const session = await forceDB.queryRow<MentalModelSession>`
      INSERT INTO mental_model_sessions (user_id, prompt, models)
      VALUES (${userId}, ${req.prompt}, ${modelsJson}::jsonb)
      RETURNING id, user_id as "userId", prompt, models, created_at as "createdAt"
    `;

    if (!session) {
      console.error('Failed to save mental model session for user:', userId);
      throw new Error("Failed to save mental model session");
    }

    console.log('Successfully saved mental model session:', session.id);
    
    // Return the session with parsed models
    return {
      ...session,
      models: analysis.models
    };
  }
);
