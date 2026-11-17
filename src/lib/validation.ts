import type { LocalProfile } from "@/types/profile";

export type ValidationKey = "usernameRequired" | "usernameLength" | "usernameUnsafe" | "ageRequired" | "adultOnly" | "heightInvalid" | "weightInvalid" | "goalRequired" | "scheduleRequired";
const unsafeName = /[<>]/;

export const validateStep = (step: number, profile: LocalProfile): ValidationKey[] => {
  const errors: ValidationKey[] = [];
  if (step === 1) {
    const name = profile.username.trim();
    if (!name) errors.push("usernameRequired");
    else if ([...name].length < 2 || [...name].length > 24) errors.push("usernameLength");
    if (unsafeName.test(name)) errors.push("usernameUnsafe");
    if (profile.age === null || !Number.isFinite(profile.age) || !profile.adultConfirmed) errors.push("ageRequired");
    else if (profile.age < 18 || profile.age > 120) errors.push("adultOnly");
  }
  if (step === 2) {
    if (profile.heightCm !== null && (profile.heightCm < 100 || profile.heightCm > 250)) errors.push("heightInvalid");
    if (profile.weightKg !== null && (profile.weightKg < 25 || profile.weightKg > 400)) errors.push("weightInvalid");
    if ((profile.heightCm === null) !== (profile.weightKg === null)) errors.push(profile.heightCm === null ? "heightInvalid" : "weightInvalid");
  }
  if (step === 3 && profile.goals.length === 0) errors.push("goalRequired");
  if (step === 4 && (!profile.schedule || !profile.activityPreference || !profile.wakeTime || !profile.sleepTime)) errors.push("scheduleRequired");
  return errors;
};
