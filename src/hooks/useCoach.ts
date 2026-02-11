import { useState, useCallback, useSyncExternalStore } from "react";

const COACH_STORAGE_KEY = "rugby-tracker-coach";

interface CoachProfile {
  id: string;
  name: string;
}

function getCoachSnapshot(): CoachProfile | null {
  const stored = localStorage.getItem(COACH_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useCoach() {
  const coach = useSyncExternalStore(subscribe, getCoachSnapshot);
  const [, setTick] = useState(0);

  const registerCoach = useCallback((name: string) => {
    const profile: CoachProfile = {
      id: crypto.randomUUID(),
      name,
    };
    localStorage.setItem(COACH_STORAGE_KEY, JSON.stringify(profile));
    setTick((t) => t + 1);
  }, []);

  const clearCoach = useCallback(() => {
    localStorage.removeItem(COACH_STORAGE_KEY);
    setTick((t) => t + 1);
  }, []);

  return { coach, registerCoach, clearCoach };
}
