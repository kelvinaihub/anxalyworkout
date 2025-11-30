import { GoogleGenAI } from "@google/genai";

const apiKey = 'AIzaSyCEx-ewOOEYgyL2u2mspVEHdOSg95m_K00';
const ai = new GoogleGenAI({ apiKey });

async function testModel() {
    console.log("Testing model: gemini-2.5-flash");
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Hello, are you there?',
        });
        console.log("Success! Response:", response.text);
    } catch (error) {
        console.error("Error with gemini-2.5-flash:", error.message);

        console.log("------------------------------------------------");
        console.log("Testing fallback model: gemini-1.5-flash");
        try {
            const response2 = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: 'Hello, are you there?',
            });
            console.log("Success with gemini-1.5-flash! Response:", response2.text);
        } catch (error2) {
            console.error("Error with gemini-1.5-flash:", error2.message);
        }
    }
}

testModel();
