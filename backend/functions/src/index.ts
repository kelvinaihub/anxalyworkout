import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenAI, Modality } from '@google/genai';

admin.initializeApp();
const db = admin.firestore();

// Initialize Gemini
// Note: Ensure GEMINI_API_KEY is set in your Firebase Functions environment config
// command: firebase functions:config:set gemini.key="YOUR_API_KEY"
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'AIzaSyCEx-ewOOEYgyL2u2mspVEHdOSg95m_K00' });

interface User {
    id: string;
    age: number;
    gender: string;
    fitnessGoal?: string;
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Helper function to generate image
const generateExerciseImage = async (exerciseName: string, gender: string): Promise<string> => {
    // Sanitize name
    const simplifiedName = exerciseName.replace(/\s*\(.*\)\s*/, '').trim();
    const prompt = `Photorealistic image of a fit ${gender === 'female' ? 'woman' : 'man'} performing the "${simplifiedName}" exercise. Full body shot, in a modern, well-lit gym. The person should be wearing appropriate fitness attire. The image should be high-quality, clear, and focused on demonstrating the correct form.`;

    let retries = 3;
    let currentDelay = 2000; // Optimized for Pro key

    while (retries > 0) {
        try {
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });

            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
            throw new Error("No image data returned.");
        } catch (error: any) {
            const errorMessage = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
            if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
                retries--;
                if (retries > 0) {
                    console.warn(`Rate limit for "${exerciseName}". Retrying in ${currentDelay}ms...`);
                    await delay(currentDelay);
                    currentDelay *= 1.5;
                } else {
                    console.error(`Exhausted retries for "${exerciseName}".`);
                    return ""; // Return empty string on failure
                }
            } else {
                console.error(`Error generating image for "${exerciseName}":`, error);
                return ""; // Return empty string on other errors
            }
        }
    }
    return "";
};

// Helper function to generate workout using Gemini
const generateWorkoutForUser = async (user: User): Promise<any> => {
    const prompt = `
        Create a daily workout plan for a ${user.age} year old ${user.gender}.
        Goal: ${user.fitnessGoal || 'General Fitness'}.
        Requirements:
        1. 2 Warm-up exercises (time-based).
        2. 4-5 Main exercises (sets/reps).
        3. 2 Cool-down stretches (time-based).
        4. Output JSON format matching the schema:
        {
            "estimatedTime": number,
            "estimatedCalories": number,
            "warmUp": [{ "name": string, "sets": number, "reps": string, "instructions": string, "imageUrl": "" }],
            "training": [{ "name": string, "sets": number, "reps": string, "instructions": string, "imageUrl": "" }],
            "stretching": [{ "name": string, "sets": number, "reps": string, "instructions": string, "imageUrl": "" }]
        }
    `;

    try {
        // 1. Generate Text Plan
        const response = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text;
        if (!text) return null;

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '');
        const plan = JSON.parse(jsonStr);

        // 2. Generate Images for all exercises
        const allExercises = [
            ...(plan.warmUp || []),
            ...(plan.training || []),
            ...(plan.stretching || [])
        ];

        console.log(`Generating images for ${allExercises.length} exercises for user ${user.id}...`);

        for (const ex of allExercises) {
            if (ex.name) {
                ex.imageUrl = await generateExerciseImage(ex.name, user.gender);
                // No artificial delay needed for Pro key, but a tiny 500ms safety buffer is good practice
                await delay(500);
            }
        }

        return plan;
    } catch (error) {
        console.error(`Error generating plan for user ${user.id}:`, error);
        return null;
    }
};

// Scheduled Function: Runs every day at 00:00 (Midnight)
// Timezone: Asia/Ho_Chi_Minh (Vietnam Time)
// Timeout: 540 seconds (9 minutes) to handle image generation
export const dailyWorkoutGenerator = functions.runWith({ timeoutSeconds: 540 }).pubsub
    .schedule('0 0 * * *')
    .timeZone('Asia/Ho_Chi_Minh')
    .onRun(async (context) => {
        console.log('Starting Daily Workout Generation Job...');

        try {
            // 1. Fetch all users, ordered by registration time (Admin is usually first)
            // This ensures we process users in the exact order they joined.
            const usersSnapshot = await db.collection('users')
                .orderBy('createdAt', 'asc')
                .get();

            if (usersSnapshot.empty) {
                console.log('No users found.');
                return null;
            }

            const users = usersSnapshot.docs.map(doc => doc.data() as User);
            console.log(`Found ${users.length} users to process.`);

            // 2. Sequential Loop
            // We use a for...of loop with await to ensure strict sequential processing.
            // This prevents race conditions and respects API rate limits.
            for (const user of users) {
                console.log(`Processing User ID: ${user.id}...`);

                // Check if plan already exists for today (idempotency)
                const today = new Date().toISOString().split('T')[0];
                const planRef = db.collection('users').doc(user.id).collection('daily_plans').doc(today);
                const planDoc = await planRef.get();

                if (planDoc.exists) {
                    console.log(`Plan already exists for user ${user.id} on ${today}. Skipping.`);
                    continue;
                }

                // Generate Plan
                const workoutPlan = await generateWorkoutForUser(user);

                if (workoutPlan) {
                    // Save to Firestore
                    await planRef.set({
                        ...workoutPlan,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        date: today,
                        validUntil: admin.firestore.Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000) // Valid for 24h
                    });
                    console.log(`Successfully generated and saved plan for user ${user.id}.`);
                } else {
                    console.error(`Failed to generate plan for user ${user.id}.`);
                }
            }

            console.log('Daily Workout Generation Job Completed.');
            return null;

        } catch (error) {
            console.error('Fatal error in daily job:', error);
            return null;
        }
    });
