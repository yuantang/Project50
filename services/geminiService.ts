
import { GoogleGenAI } from "@google/genai";
import { UserProgress } from '../types';

// Initialize Gemini
// ALWAYS use process.env.API_KEY directly in the constructor
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  try {
    const model = 'gemini-2.5-flash';
    const personaInstruction = getPersonaInstruction(persona, customPrompt);
    const prompt = `
      ${personaInstruction}
      The user is on Day ${day} of ${totalDays}.
      Give them a short, punchy motivational quote or advice for this stage.
      Keep it under 2 sentences. No emojis.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Keep pushing. Silence the noise.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Discipline equals freedom. Keep going.";
  }
};

export const getWeeklyAnalysis = async (progress: UserProgress): Promise<string> => {
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Analysis unavailable. Keep tracking to generate insights.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Could not generate weekly analysis at this time.";
  }
};

export const getPatternAnalysis = async (progress: UserProgress): Promise<string> => {
  try {
    // Compile simplified history
    const historyData = Object.entries(progress.history).map(([day, data]) => ({
      day,
      mood: data.mood,
      completedCount: data.completedHabits.length,
      frozen: data.frozen,
      habitsMissed: progress.customHabits.filter(h => !data.completedHabits.includes(h.id)).map(h => h.label)
    })).slice(-14); // Last 14 days

    if (historyData.length < 3) return "Not enough data yet. Track for 3+ days to unlock Pattern Analysis.";

    const prompt = `
      Analyze this user data (last 14 days) to find HIDDEN CORRELATIONS.
      
      Data: ${JSON.stringify(historyData)}
      
      Find 2 specific patterns. 
      Examples:
      - Does Mood drop when they miss a specific habit?
      - Is there a "Domino Habit" that predicts a perfect day?
      
      Return ONLY 2 short bullet points. Start each with "🔍".
      Be extremely concise.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "🔍 Consistent sleep correlates with higher completion rates.";
  } catch (error) {
    return "Pattern recognition requires more data.";
  }
};

export const getEmergencyPepTalk = async (
  persona: UserProgress['aiPersona'] = 'sergeant',
  customPrompt?: string
): Promise<string> => {
  try {
    const personaInstruction = getPersonaInstruction(persona, customPrompt);
    const prompt = `
      ${personaInstruction}
      The user is pressing the "SOS" panic button. They are about to break their streak or quit the challenge.
      Give them a INTENSE, 50-word reality check. 
      Tell them to breathe and get back to work.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Pain is temporary. Quitting lasts forever. Get back to work.";
  } catch (error) {
    return "Breathe. You are stronger than this moment.";
  }
};

export const getAiCoaching = async (progress: UserProgress, userMessage: string): Promise<string> => {
  try {
    const personaInstruction = getPersonaInstruction(progress.aiPersona || 'stoic', progress.customPersonaPrompt);
    const prompt = `
      ${personaInstruction}
      You are an elite performance coach for Project 50.
      User Status: Day ${progress.currentDay}/${progress.totalDays}.
      User Message: "${userMessage}"
      Provide advice. Be concise (max 3 sentences).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Focus on the process. The results will follow.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Stay focused. Keep grinding.";
  }
};

export const refineManifesto = async (text: string): Promise<string> => {
  try {
    const prompt = `
      Rewrite the following personal manifesto to be more powerful, stoic, and disciplined. 
      Make it sound like a warrior's pledge. Keep it under 40 words.
      Input text: "${text}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.replace(/^"|"$/g, '') || text;
  } catch (error) {
    console.error("Gemini Manifesto Error:", error);
    return text;
  }
};

export const getJournalInsight = async (note: string, mood: string): Promise<string> => {
  try {
    const prompt = `
      Mood: ${mood}. Note: "${note}".
      Provide a SINGLE, profound insight or a psychological reflection question. Max 2 sentences.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Reflection is the key to progress.";
  } catch (error) {
    console.error("Gemini Journal Error:", error);
    return "Keep documenting your journey.";
  }
};

export const getHabitGuide = async (habitLabel: string, habitDesc: string): Promise<string> => {
  try {
    const prompt = `
      You are an elite discipline coach. The user needs a micro-plan for the habit: "${habitLabel}".
      Context: "${habitDesc}".
      
      Give a specific, 3-step actionable micro-guide for executing this TODAY. 
      Make it concrete (e.g., "Read Chapter 3 of a non-fiction book", "Do 3 sets of pushups").
      Keep the entire response under 40 words.
      Format: Just the steps, numbered.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "1. Start immediately.\n2. Focus for 10 minutes.\n3. Don't stop until done.";
  } catch (error) {
    return "Execute without hesitation.";
  }
};
