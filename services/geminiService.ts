import { GoogleGenAI } from "@google/genai";

// Ensure API key is present. 
// Note: process.env.API_KEY is replaced by Vite at build time.
const API_KEY = process.env.API_KEY || '';

if (!API_KEY) {
  console.warn("Warning: API_KEY is missing. AI generation will fail.");
}

// Helper to fetch image from URL and convert to Base64
export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting URL to base64:", error);
    throw error;
  }
};

export const stripBase64Prefix = (base64: string): string => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

// --- Retry Logic Helper ---
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Check for Rate Limit (429) or Service Unavailable (503) or generic "Quota" messages
    const isRateLimit = 
      error?.status === 429 || 
      error?.code === 429 || 
      error?.message?.includes('429') || 
      error?.message?.includes('Quota') ||
      error?.message?.includes('RESOURCE_EXHAUSTED');

    if (retries > 0 && isRateLimit) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
      await wait(delay);
      return retryOperation(operation, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
}

/**
 * Generates a garment image based on a text prompt using Nano Banana (gemini-2.5-flash-image).
 */
export const generateGarment = async (prompt: string): Promise<string> => {
  if (!API_KEY) throw new Error("API Key is missing. Please configure your API_KEY environment variable.");

  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A professional fashion photography shot of full-body clothing: ${prompt}. Isolated on a plain white background. Ghost mannequin or flat lay style showing the ENTIRE outfit. High quality, detailed texture.` }],
        },
        config: {
          imageConfig: {
            aspectRatio: '3:4', // Vertical aspect ratio for full clothing items
          }
        }
      });

      // Extract image from response
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image generated.");
    } catch (error) {
      console.error("Gemini Garment Generation Error:", error);
      throw error;
    }
  });
};

/**
 * Generates the Try-On result.
 * Uses the Person image and Garment image as inputs to the multimodal model.
 */
export const generateTryOn = async (personBase64: string, garmentBase64: string): Promise<string> => {
  if (!API_KEY) throw new Error("API Key is missing. Please configure your API_KEY environment variable.");

  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
      const cleanPerson = stripBase64Prefix(personBase64);
      const cleanGarment = stripBase64Prefix(garmentBase64);

      const prompt = `
        ROLE: Expert Virtual Try-On AI.
        
        INPUTS:
        1. First Image: THE MODEL (Person). Focus on their face, hair, pose, body shape, and skin tone.
        2. Second Image: THE OUTFIT (Clothing). Focus on the texture, fabric, style, and color.

        TASK:
        Generate a new photo (Image 3) of the MODEL from Image 1 wearing the OUTFIT from Image 2.

        STRICT GUIDELINES:
        - **IDENTITY PRESERVATION**: You MUST keep the face and identity of the person in Image 1 exactly as is. Do not change their face.
        - **CLOTHING REPLACEMENT**: Replace the original clothes of the model with the new outfit from Image 2. The new clothes must fit the body naturally.
        - **FULL BODY**: The output MUST be a full-body shot (Head to Toe). NEVER crop the head. NEVER crop the feet.
        - **COMPOSITION**: Vertical 9:16 aspect ratio. The model should be standing in the original pose (or very similar).
        - **NO HALLUCINATIONS**: Do not add extra people. Do not create a headless body.

        Execute this virtual try-on now. High fidelity, photorealistic fashion photography.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanPerson
              }
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanGarment
              }
            },
            { text: prompt }
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: '9:16', // Enforce vertical aspect ratio to prevent cropping head/feet
          }
        }
      });

      // Extract image from response
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No try-on image generated.");

    } catch (error) {
      console.error("Gemini Try-On Error:", error);
      throw error;
    }
  });
};