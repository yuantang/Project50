
// Static data for offline usage to ensure the app never looks "broken"
// This satisfies App Store requirements for offline functionality.

export const FALLBACK_MOTIVATIONS = [
  "Discipline is doing what you hate to do, but doing it like you love it.",
  "We must all suffer from one of two pains: the pain of discipline or the pain of regret.",
  "You cannot dream yourself into a character; you must hammer and forge yourself one.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Don't stop when you're tired. Stop when you're done.",
  "Your future is created by what you do today, not tomorrow.",
  "The only bad workout is the one that didn't happen.",
  "Focus on the process, not the outcome.",
  "Motivation gets you started. Habit keeps you going.",
  "Silence the noise. Do the work."
];

export const FALLBACK_COACHING = [
  "I'm currently offline, but here is a timeless principle: **Consistency beats intensity.** Focus on just checking off today's boxes.",
  "Network unavailable. My advice? **Review your Why.** Open your North Star card and read it aloud.",
  "Offline Mode: Use this time to disconnect and focus deeply. The best work happens in silence.",
  "I can't reach the cloud, but you don't need the cloud to be disciplined. Just execute.",
  "Connection lost. Stay the course. Don't let minor disruptions derail your progress."
];

export const getRandomMotivation = (): string => {
  return FALLBACK_MOTIVATIONS[Math.floor(Math.random() * FALLBACK_MOTIVATIONS.length)];
};

export const getRandomCoaching = (): string => {
  return FALLBACK_COACHING[Math.floor(Math.random() * FALLBACK_COACHING.length)];
};
