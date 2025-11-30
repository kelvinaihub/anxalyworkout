import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

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
        const response = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text;
        if (!text) return null;

        // Simple cleanup to ensure JSON
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '');
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error(`Error generating plan for user ${user.id}:`, error);
        return null;
    }
};

// Scheduled Function: Runs every day at 00:00 (Midnight)
// Timezone: Asia/Ho_Chi_Minh (Vietnam Time)
export const dailyWorkoutGenerator = functions.pubsub
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

                // Optional: Add a small delay between users to be safe with API limits
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log('Daily Workout Generation Job Completed.');
            return null;

        } catch (error) {
            console.error('Fatal error in daily job:', error);
            return null;
        }
    });
