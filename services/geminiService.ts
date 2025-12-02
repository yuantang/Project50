import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserProgress } from '../types';
import { getRandomMotivation, getRandomCoaching } from './fallbackService';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const isOnline = () => navigator.onLine;

// --- RETRY UTILITY ---
// Fixes transient network/XHR errors by retrying up to 2 times with varying delays
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.warn(`Gemini API request failed, retrying... (${retries} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2); // Exponential backoff
  }
}

const PERSONA_PROMPTS: Record<string, string> = {
  sergeant: "You are an aggressive, ex-military drill sergeant like David Goggins. Be harsh, direct, and demanding. Use tough love. No pity. Focus on suffering and hardness.",
  stoic: "You are a stoic philosopher like Marcus Aurelius or Seneca. Be calm, rational, and focus on duty, virtue, and controlling the mind. Use ancient wisdom.",
  empathetic: "You are a kind, supportive, and warm life coach. Be encouraging, understanding, and focus on self-care and gentle progress."
};

const getPersonaInstruction = (persona: UserProgress['aiPersona'], customPrompt?: string): string => {
  if (persona === 'custom' && customPrompt) {
    return `You are a personalized coach. Your persona instructions are: "${customPrompt}". Be consistent with this role.`;
  }
  return PERSONA_PROMPTS[persona] || PERSONA_PROMPTS['stoic'];
};

export const getDailyMotivation = async (
  day: number, 
  totalDays: number, 
  persona: UserProgress['aiPersona'] = 'stoic',
  customPrompt?: string
): Promise<string> => {
  if (!isOnline()) return getRandomMotivation();

  try {
    const model = 'gemini-2.5-flash';
    const personaInstruction = getPersonaInstruction(persona, customPrompt);
    const prompt = `
      ${personaInstruction}
      The user is on Day ${day} of ${totalDays}.
      Give them a short, punchy motivational quote or advice for this stage.
      Keep it under 2 sentences. No emojis.
    `;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents: prompt,
    }));

    return response.text || getRandomMotivation();
  } catch (error) {
    console.warn("Gemini API unavailable (Motivation), using fallback.");
    return getRandomMotivation();
  }
};

export const getWeeklyAnalysis = async (progress: UserProgress): Promise<string> => {
  if (!isOnline()) return "### Offline Mode\n\nCannot generate deep analysis without internet connection. Please review your stats manually in the charts tab.";

  try {
    const currentDay = progress.currentDay;
    const startDay = Math.max(1, currentDay - 6);
    let historySummary = "";

    for (let i = startDay; i <= currentDay; i++) {
      const dayData = progress.history[i];
      if (dayData) {
        historySummary += `Day ${i}: Mood: ${dayData.mood || 'N/A'}, Completed: ${dayData.completedHabits.length}/${progress.customHabits.length}, Frozen: ${dayData.frozen ? 'Yes' : 'No'}\n`;
      } else {
        historySummary += `Day ${i}: No data.\n`;
      }
    }

    const prompt = `
      Analyze the user's performance over the last 7 days (Day ${startDay} to ${currentDay}).
      
      Data:
      ${historySummary}

      Provide a "Weekly Review" in a structured format:
      1. **Consistency Score**: (Give a rating out of 10)
      2. **Key Observation**: Identify a pattern.
      3. **Actionable Fix**: One specific thing to improve next week.
      
      Keep it professional, analytical, and concise.
    `;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));

    return response.text || "Analysis unavailable. Keep tracking to generate insights.";
  } catch (error) {
    console.warn("Gemini API unavailable (Analysis).");
    return "Could not generate weekly analysis at this time due to network issues.";
  }
};

export const getPatternAnalysis = async (progress: UserProgress): Promise<string> => {
  if (!isOnline()) return "🔍 Connect to the internet to unlock AI pattern recognition.";

  try {
    // Compile simplified history
    const historyData = Object.entries(progress.history).map(([day, data]) => ({
      day,
      mood: data.mood,
      completedHabits: data.completedHabits,
      frozen: data.frozen,
    })).slice(-21); // Last 21 days for better sampling

    const habitNames = progress.customHabits.map(h => ({ id: h.id, label: h.label }));

    if (historyData.length < 3) return "Not enough data yet. Track for 3+ days to unlock Pattern Analysis.";

    const prompt = `
      Act as a Lead Data Scientist analyzing user habit data.
      
      Habit Definitions: ${JSON.stringify(habitNames)}
      User Data (Last 21 Days): ${JSON.stringify(historyData)}
      
      Find the "Domino Habit" (the one that, when done, leads to the best days) and the "Kryptonite" (the one that causes failure).
      
      Return EXACTLY 2 bullet points. Start with "🔍".
      1. Identify the strongest correlation (e.g., "When you read, your mood is 80% likely to be Great").
      2. Identify the biggest risk factor or opportunity.
      
      Keep it short, punchy, and insight-driven.
    `;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));

    return response.text || "🔍 Consistent sleep correlates with higher completion rates.";
  } catch (error) {
    return "Pattern recognition requires more data.";
  }
};

export const getEmergencyPepTalk = async (
  persona: UserProgress['aiPersona'] = 'sergeant',
  customPrompt?: string
): Promise<string> => {
  if (!isOnline()) return "Breathe. You are stronger than your excuses. Do the work.";

  try {
    const personaInstruction = getPersonaInstruction(persona, customPrompt);
    const prompt = `
      ${personaInstruction}
      The user is pressing the "SOS" panic button. They are about to break their streak or quit the challenge.
      Give them a INTENSE, 50-word reality check. 
      Tell them to breathe and get back to work.
    `;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));

    return response.text || "Pain is temporary. Quitting lasts forever. Get back to work.";
  } catch (error) {
    return "Breathe. You are stronger than this moment.";
  }
};

export const getAiCoaching = async (progress: UserProgress, userMessage: string): Promise<string> => {
  if (!isOnline()) return getRandomCoaching();

  try {
    const personaInstruction = getPersonaInstruction(progress.aiPersona || 'stoic', progress.customPersonaPrompt);
    const prompt = `
      ${personaInstruction}
      You are an elite performance coach for Project 50.
      User Status: Day ${progress.currentDay}/${progress.totalDays}.
      User Message: "${userMessage}"
      Provide advice. Be concise (max 3 sentences).
    `;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));

    return response.text || "Focus on the process. The results will follow.";
  } catch (error) {
    console.warn("Gemini API unavailable (Coach).");
    return "Stay focused. Keep grinding.";
  }
};

export const refineManifesto = async (text: string): Promise<string> => {
  if (!isOnline()) return text;
  
  try {
    const prompt = `
      Rewrite the following personal manifesto to be more powerful, stoic, and disciplined. 
      Make it sound like a warrior's pledge. Keep it under 40 words.
      Input text: "${text}"
    `;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));

    return response.text?.replace(/^"|"$/g, '') || text;
  } catch (error) {
    return text;
  }
};

export const getJournalInsight = async (note: string, mood: string): Promise<string> => {
  if (!isOnline()) return "Reflection is the key to progress.";

  try {
    const prompt = `
      Mood: ${mood}. Note: "${note}".
      Provide a SINGLE, profound insight or a psychological reflection question. Max 2 sentences.
    `;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));

    return response.text || "Reflection is the key to progress.";
  } catch (error) {
    return "Keep documenting your journey.";
  }
};

export const getHabitGuide = async (habitLabel: string, habitDesc: string): Promise<string> => {
  if (!isOnline()) return "1. Just start.\n2. Do it for 5 minutes.\n3. Don't stop.";

  try {
    const prompt = `
      You are an elite discipline coach. The user needs a micro-plan for the habit: "${habitLabel}".
      Context: "${habitDesc}".
      
      Give a specific, 3-step actionable micro-guide for executing this TODAY. 
      Make it concrete (e.g., "Read Chapter 3 of a non-fiction book", "Do 3 sets of pushups").
      Keep the entire response under 40 words.
      Format: Just the steps, numbered.
    `;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));

    return response.text || "1. Start immediately.\n2. Focus for 10 minutes.\n3. Don't stop until done.";
  } catch (error) {
    return "Execute without hesitation.";
  }
};