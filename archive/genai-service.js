// genai-service.js
// This file encapsulates the logic for interacting with the Google Generative AI SDK.

// IMPORTANT: Replace 'YOUR_API_KEY' with your actual Google Generative AI API key.
// For production, consider using environment variables or a secure backend to manage API keys.
const API_KEY = YOUR_API_KEY_HERE; 

// Ensure GoogleGenerativeAI is available globally from the CDN import in index.html
const { GoogleGenerativeAI } = window;

if (!GoogleGenerativeAI) {
    console.error("GoogleGenerativeAI not found. Ensure it's loaded via CDN in index.html before this script.");
}

/**
 * Generates a personalized children's story using the Google Generative AI model.
 *
 * @param {object} options - The story generation options.
 * @param {string} options.childName - The name of the child for personalization.
 * @param {string} options.storyTheme - The theme of the story (e.g., adventure, fantasy).
 * @param {string} options.mainCharacter - The main character of the story.
 * @param {string} [options.moral] - An optional moral for the story.
 * @param {string} options.storyLength - The desired length of the story (Short, Medium, Long).
 * @returns {Promise<string>} A promise that resolves with the generated story text.
 */
export async function generateStory({ childName, storyTheme, mainCharacter, moral, storyLength }) {
    if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
        throw new Error("API Key is not configured. Please replace 'YOUR_API_KEY' in genai-service.js with your actual Google Generative AI API key.");
    }

    if (!window.aistudio || !window.aistudio.hasSelectedApiKey()) {
        console.warn("No paid API key selected. Opening key selection dialog.");
        window.aistudio.openSelectKey();
        throw new Error("Paid API key not selected. Please select a key to generate content.");
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Using gemini-pro model

    let prompt = `Generate a personalized children's story.
    Child's Name: ${childName}
    Story Theme: ${storyTheme}
    Main Character: ${mainCharacter}
    `;

    if (moral) {
        prompt += `Moral of the Story: ${moral}\n`;
    }

    prompt += `Story Length: ${storyLength}.
    Ensure the story has a clear beginning, middle, and end, and is magical, playful, and warm.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Strip markdown code blocks if present, as per memory
        text = text.replace(/```json\s*([\s\S]*?)\s*```/g, '$1');
        text = text.replace(/```([\s\S]*?)```/g, '$1');

        return text;
    } catch (error) {
        console.error("Error generating story:", error);
        throw new Error("Failed to generate story. Please check your API key and network connection.");
    }
}

/**
 * Placeholder function to simulate audio generation from text.
 * In a real application, this would call a Text-to-Speech (TTS) API.
 *
 * @param {string} text The text to convert to audio.
 * @returns {Promise<string>} A Promise that resolves with a Base64 encoded raw PCM audio string (placeholder).
 */
export async function generateAudioFromText(text) {
    console.warn("WARNING: generateAudioFromText is a placeholder. You need to integrate a real Text-to-Speech API here.");
    console.warn("The returned Base64 string is a dummy and does not represent actual audio of the story.");

    // This is a very short, silent, dummy 16-bit, 24kHz mono PCM audio snippet (about 0.1 seconds)
    // In a real scenario, you would get this from a TTS API.
    const dummyPcmData = new Int16Array(2400); // 2400 samples for 0.1s at 24kHz
    const byteBuffer = new Uint8Array(dummyPcmData.buffer);
    const base64DummyAudio = btoa(String.fromCharCode.apply(null, byteBuffer));

    return base64DummyAudio;
}

/**
 * Placeholder function to simulate image generation from a prompt.
 * In a real application, this would call an Image Generation API (e.g., DALL-E, Midjourney, Google's Image Generation).
 *
 * @param {string} promptText The text prompt for image generation.
 * @returns {Promise<string>} A Promise that resolves with a URL to a placeholder image.
 */
export async function generateImageFromPrompt(promptText) {
    console.warn("WARNING: generateImageFromPrompt is a placeholder. You need to integrate a real Image Generation API here.");
    console.warn("The returned URL points to a generic placeholder image and does not reflect the prompt.");

    // Return a generic placeholder image URL
    // In a real scenario, you would get an actual image URL from an image generation API.
    return `https://via.placeholder.com/400x300?text=Illustration+for+${encodeURIComponent(promptText.substring(0, 20))}...`;
}