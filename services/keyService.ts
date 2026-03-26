import { GoogleGenAI } from "@google/genai";

export const getValidKey = (providedKeys?: string): string => {
  let key = "";

  // 1. Check if a key was provided directly to the function
  if (providedKeys) {
    key = providedKeys;
  } else {
    // 2. Check if the user has set their own API key in localStorage
    try {
      const userKeys = localStorage.getItem('user_gemini_api_keys');
      if (userKeys) {
        const keys = userKeys.split('\n').map(k => k.trim()).filter(k => k !== '');
        if (keys.length > 0) key = keys[0];
      } else {
        const userKey = localStorage.getItem('user_gemini_api_key');
        if (userKey && userKey.trim()) {
          key = userKey.trim();
        }
      }
    } catch (e) {
      // localStorage might not be available in some contexts
    }
  }

  // 3. Use the platform-selected key if available (for Veo/Imagen models)
  if (!key && process.env.API_KEY) {
    key = process.env.API_KEY;
  }

  // 4. Fallback to the environment variable
  if (!key) {
    key = process.env.GEMINI_API_KEY || "";
  }

  // Clean the key: remove any non-ASCII characters and trim
  return key.replace(/[^\x00-\x7F]/g, "").trim();
};

export const getAllValidKeys = (): string[] => {
  try {
    const userKeys = localStorage.getItem('user_gemini_api_keys');
    if (userKeys) {
      return userKeys.split('\n').map(k => k.trim()).filter(k => k !== '');
    }
    const userKey = localStorage.getItem('user_gemini_api_key');
    if (userKey && userKey.trim()) {
      return [userKey.trim()];
    }
  } catch (e) {}
  return [];
};

export const getAiClient = (apiKey?: string) => {
  const key = getValidKey(apiKey);
  return new GoogleGenAI({ apiKey: key });
};

export const clearFailedKeys = () => {
  // No-op for now as we removed failed keys tracking
};

export const markKeyAsFailed = (key: string) => {
  // No-op for now
};
