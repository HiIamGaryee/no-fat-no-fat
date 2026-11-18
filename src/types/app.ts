export type MissionCategory = "movement" | "routine" | "hydration" | "reflection" | "sleep" | "food";
export type MissionStatus = "available" | "in-progress" | "completed" | "skipped";

export interface Mission {
  id: string;
  day: string;
  category: MissionCategory;
  title: string;
  description: string;
  minutes: number;
  xp: number;
  status: MissionStatus;
  completedAt: string | null;
}

export interface MissionStore { version: 1; day: string; missions: Mission[]; }
export interface XPTransaction { id: string; sourceId: string; amount: number; reason: string; createdAt: string; }
export interface AchievementUnlock { id: string; unlockedAt: string; }
export interface ProgressStore { version: 1; transactions: XPTransaction[]; achievements: AchievementUnlock[]; }
export interface AppSettings {
  version: 1;
  reducedMotion: boolean;
  highReadability: boolean;
  memoryEnabled: boolean;
  voiceAutoplay: boolean;
}
