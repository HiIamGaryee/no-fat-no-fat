export const locales = ["en", "zh-CN", "yue-Hant", "ar-AE", "hi-IN"] as const;
export type Locale = (typeof locales)[number];
export type RoastLevel = "sarcastic" | "savage" | "unhinged";
export type ScheduleType = "daytime" | "night" | "rotating" | "irregular";
export type ActivityPreference = "seated" | "light" | "regular" | "prefer-not";

export interface LocalProfile {
  version: 1;
  id: string;
  username: string;
  age: number | null;
  adultConfirmed: boolean;
  locale: Locale;
  heightCm: number | null;
  weightKg: number | null;
  goals: string[];
  schedule: ScheduleType | "";
  wakeTime: string;
  sleepTime: string;
  activityPreference: ActivityPreference | "";
  preferredMissionMinutes: 2 | 5 | 10 | 15;
  roastLevel: RoastLevel;
  createdAt: string;
  updatedAt: string;
  onboardingCompletedAt: string | null;
}

export interface OnboardingDraft { version: 1; step: number; profile: LocalProfile; }
