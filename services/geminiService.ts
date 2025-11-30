import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Exercise, Meal, WorkoutPlan, GeneratedWorkoutPlan } from '../types.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const suggestExercises = async (planName: string): Promise<Partial<Exercise>[]> => {
  console.log(`Asking Gemini for exercise suggestions for: ${planName}`);
  await delay(1500);

  const lowerCaseName = planName.toLowerCase();
  if (lowerCaseName.includes('chest')) {
    return [
      { name: 'Cable Flys', sets: 3, reps: '15', restTime: 45, notes: 'Focus on the squeeze at the peak.' },
      { name: 'Push-ups', sets: 4, reps: 'To Failure', restTime: 60, notes: 'Keep body straight.' }
    ];
  }
  if (lowerCaseName.includes('leg')) {
    return [
      { name: 'Squats', sets: 4, reps: '8-12', restTime: 90, notes: 'Go parallel or below.' },
      { name: 'Leg Press', sets: 3, reps: '10-15', restTime: 60, notes: 'Control the negative.' }
    ];
  }
  return [
    { name: 'Bicep Curls', sets: 3, reps: '12-15', restTime: 45, notes: 'No swinging.' },
    { name: 'Tricep Pushdowns', sets: 3, reps: '12-15', restTime: 45, notes: 'Full extension.' }
  ];
};

export const suggestMeals = async (planName: string): Promise<Partial<Meal>[]> => {
  console.log(`Asking Gemini for meal suggestions for: ${planName}`);
  await delay(1500);

  const lowerCaseName = planName.toLowerCase();
  if (lowerCaseName.includes('bulk')) {
    return [
      { name: 'Chicken and Rice Bowl', notes: '200g chicken, 1.5 cups rice, broccoli. High protein & carbs.' },
      { name: 'Salmon with Sweet Potatoes', notes: '150g salmon, 1 large sweet potato. Healthy fats and complex carbs.' }
    ];
  }
  if (lowerCaseName.includes('cut') || lowerCaseName.includes('lean')) {
    return [
      { name: 'Grilled Tilapia Salad', notes: 'Large mixed greens salad with 150g tilapia. Low calorie, high protein.' },
      { name: 'Egg White Omelette', notes: '6 egg whites with spinach and feta cheese.' }
    ];
  }
  return [
    { name: 'Greek Yogurt with Berries', notes: 'Simple, high-protein snack.' },
    { name: 'Protein Shake', notes: '1 scoop of whey with water or milk.' }
  ];
};

const exerciseSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    sets: { type: Type.INTEGER, description: 'Number of sets for this exercise.' },
    reps: { type: Type.STRING, description: "e.g., '10 reps' or '30 seconds'" },
    instructions: { type: Type.STRING, description: 'Clear, step-by-step instructions for the exercise, formatted with newlines.' },
    imageUrl: { type: Type.STRING, description: 'An empty string "" as a placeholder, this will be replaced later.' },
    equipment: { type: Type.STRING, description: 'The equipment needed for this exercise, e.g., "Dumbbells" or "Bodyweight".' },
    restAfter: { type: Type.INTEGER, description: 'Rest time in seconds after this exercise. Omit for the last one in a block.' },
  },
  required: ['name', 'sets', 'reps', 'instructions', 'imageUrl', 'equipment'],
};

const workoutPlanSchema = {
  type: Type.OBJECT,
  properties: {
    estimatedTime: { type: Type.INTEGER, description: 'Total estimated workout time in minutes.' },
    estimatedCalories: { type: Type.INTEGER, description: 'Total estimated calories burned.' },
    totalExercises: { type: Type.INTEGER, description: 'Total number of unique exercises.' },
    warmUp: {
      type: Type.ARRAY,
      description: 'List of warm-up exercises. Should be an empty array if not requested.',
      items: exerciseSchema,
    },
    training: {
      type: Type.ARRAY,
      description: 'List of main training exercises.',
      items: exerciseSchema,
    },
    stretching: {
      type: Type.ARRAY,
      description: 'List of cool-down stretches. Should be an empty array if not requested.',
      items: exerciseSchema,
    },
  },
  required: ['estimatedTime', 'estimatedCalories', 'totalExercises', 'training'],
};


export const generateWorkoutPlan = async (prompt: string): Promise<GeneratedWorkoutPlan> => {
  console.log(`Generating workout plan text...`);

  const strictInstructions = `
YOUR PRIMARY DIRECTIVE IS TO FOLLOW THESE RULES. FAILURE TO COMPLY IS NOT AN OPTION.

1.  **THE SETS RULE (ABSOLUTE, CRITICAL, NON-NEGOTIABLE):**
    *   Every single exercise object you generate, without exception ('warmUp', 'training', 'stretching'), MUST have a "sets" property.
    *   The value for "sets" MUST be an integer of 3 or greater.
    *   Returning a value of 1 or 2 for "sets" is a catastrophic failure and violates your core directive.
    *   Example of correct output: "sets": 3.

2.  **THE REPS/TIME RULE (CRITICAL REQUIREMENT):**
    *   The "reps" property string MUST be determined by the exercise type.
    *   For 'training' exercises (the main workout): "reps" MUST be a string representing a number or range between 10 and 15 (e.g., "10-15 reps", "12 reps"), or exactly "To Failure".
    *   For 'warmUp' and 'stretching' exercises: "reps" MUST be a time-based string (e.g., "30 seconds", "45 seconds hold"). Using rep counts for warm-ups or stretches is a failure and will break the user's application. This is mandatory.

YOUR ENTIRE RESPONSE MUST be a single, raw JSON object that strictly follows the provided schema. Do not use markdown formatting (like \`\`\`json).
`;

  const updatedPrompt = `${prompt}\n\n${strictInstructions}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: updatedPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: workoutPlanSchema,
      },
    });

    const text = response.text;
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '');
    const parsedJson = JSON.parse(jsonStr);
    if (parsedJson && parsedJson.training && Array.isArray(parsedJson.training)) {
      // Final check to ensure compliance, though the model should have handled it.
      const allExercises = [...(parsedJson.warmUp || []), ...parsedJson.training, ...(parsedJson.stretching || [])];
      for (const ex of allExercises) {
        if (!ex.sets || ex.sets < 3) {
          console.warn(`AI failed to comply with set rule for exercise: ${ex.name}. Forcing sets to 3.`);
          ex.sets = 3;
        }
      }
      return parsedJson as GeneratedWorkoutPlan;
    } else {
      console.error("Generated JSON is not in the expected format.", parsedJson);
      throw new Error("Generated JSON is not in the expected format.");
    }
  } catch (e: any) {
    console.error("Failed to generate or parse Gemini response:", e);
    // console.error("Raw response:", response.text); // response might be undefined here
    throw new Error(`The AI returned an invalid response or failed to connect. ${e.message || ''}`);
  }
};

export const generateExerciseImage = async (exerciseName: string, gender: 'male' | 'female' | 'other'): Promise<string> => {
  // Sanitize and simplify the exercise name for the prompt.
  // Removes text in parentheses and trims whitespace. e.g. "Arm Circles (Forward & Backward)" -> "Arm Circles"
  const simplifiedName = exerciseName.replace(/\s*\(.*\)\s*/, '').trim();

  const prompt = `Photorealistic image of a fit ${gender === 'female' ? 'woman' : 'man'} performing the "${simplifiedName}" exercise. Full body shot, in a modern, well-lit gym. The person should be wearing appropriate fitness attire. The image should be high-quality, clear, and focused on demonstrating the correct form.`;

  let retries = 3;
  let currentDelay = 2000; // Optimized for Pro key: 2s initial delay

  while (retries > 0) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const candidates = response.candidates;
      if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
          }
        }
      }
      throw new Error("AI did not return an image part in the response.");
    } catch (error: any) {
      const errorMessage = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
      let isRateLimitError = false;

      if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('resource_exhausted')) {
        isRateLimitError = true;
      }

      if (isRateLimitError) {
        retries--;
        if (retries > 0) {
          console.warn(`Rate limit hit for "${exerciseName}". Retrying in ${currentDelay / 1000}s... (${retries} retries left)`);
          await delay(currentDelay);
          currentDelay *= 1.5; // Gentle backoff increase
        } else {
          const finalError = `Exhausted retries for "${exerciseName}" due to rate limiting. Please check your API quota and try again later.`;
          console.error(finalError);
          throw new Error(finalError);
        }
      } else {
        // Not a rate limit error, rethrow immediately
        throw error;
      }
    }
  }

  const finalError = `Failed to generate image for "${exerciseName}" after multiple retries.`;
  console.error(finalError);
  throw new Error(finalError);
};

// FIX: Added missing getDetailedExerciseInstructions function to resolve import error.
export const getDetailedExerciseInstructions = async (exerciseName: string): Promise<string> => {
  const prompt = `You are an expert fitness coach. Provide detailed, step-by-step instructions for performing the '${exerciseName}' exercise.
Focus on:
- Proper starting position.
- The movement itself.
- Key points for maintaining good form.
- Common mistakes to avoid.
- Breathing techniques.

Format the response as plain text with newlines for each distinct step or point. Do not use markdown like headers or bolding.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error(`Error getting detailed instructions for ${exerciseName}:`, error);
    throw new Error(`Could not get detailed instructions for ${exerciseName}.`);
  }
};

export const getWorkoutSummaryFeedback = async (
  completedCount: number,
  totalCount: number,
  durationMinutes: number
): Promise<string> => {
  if (durationMinutes < 1) {
    durationMinutes = 1; // Avoid saying "0 minutes"
  }

  const prompt = `You are an encouraging AI fitness coach. The user just finished a workout session.

Workout Data:
- Exercises Completed: ${completedCount}
- Total Exercises in Plan: ${totalCount}
- Total Duration: ${durationMinutes} minutes

Based on this, provide a short, motivational summary (2-3 sentences). Your tone should be positive and encouraging.

- If the user completed all exercises (${completedCount} out of ${totalCount}), give them enthusiastic praise for their dedication and hard work. Call them a "true champion".
- If the user completed 5 or more exercises but not all, congratulate them on a solid session and their great effort.
- If the user completed fewer than 5 exercises, acknowledge their effort for starting, encourage them not to be discouraged, and suggest they aim for one more exercise next time.

Always mention the duration of their workout in the feedback.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error getting workout summary from Gemini:", error);
    // Return a fallback message
    if (completedCount === totalCount && totalCount > 0) {
      return `Incredible work, you're a true champion! You completed all ${totalCount} exercises in ${durationMinutes} minutes. That's amazing dedication!`;
    }
    if (completedCount >= 5) {
      return `That was a solid session! You pushed through ${completedCount} exercises in ${durationMinutes} minutes. Keep up the fantastic work!`;
    }
    if (completedCount > 0) {
      return `Great job getting started and working for ${durationMinutes} minutes! Every bit of effort counts. Next time, let's aim for just one more exercise! You can do it.`;
    }
    return `Every journey begins with a single step, and you just took one. Even a short ${durationMinutes} minute session is a win. We'll be here for you next time!`;
  }
};