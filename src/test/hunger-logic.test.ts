import { describe, expect, it } from "vitest";
import { evaluateCravingPolicy } from "@/lib/craving-policy";
import { decideMidnightFood } from "@/pages/tools/MidnightFoodPage";
import type { Locale, RoastLevel } from "@/types/profile";

const locales: Locale[] = ["en", "zh-CN", "yue-Hant", "ar-AE", "hi-IN"];
const roastLevels: RoastLevel[] = ["sarcastic", "savage", "unhinged"];
const profile = (
  locale: Locale = "en",
  roastLevel: RoastLevel = "savage",
  schedule = "daytime",
) => ({
  username: "QA",
  locale,
  goals: ["habits"],
  schedule,
  wakeTime: "07:00",
  sleepTime: "23:00",
  activityPreference: "light",
  preferredMissionMinutes: 2,
  roastLevel,
  recentActivity: [],
});

describe("midnight hunger decisions", () => {
  it("classifies the required safety and hunger scenarios", () => {
    const cases = [
      ["It's 3 AM, I just ate dinner and I'm bored.", "bedtime_craving"],
      ["I'm hungry at 3 AM.", "unknown_hunger"],
      ["I haven't eaten for 10 hours.", "genuine_hunger"],
      ["其實我上餐係十個鐘前。", "genuine_hunger"],
      ["I'm on night shift.", "night_shift"],
      ["I already had supper but want more snacks.", "recent_meal_craving"],
      ["I'm dizzy and haven't eaten.", "safety"],
    ] as const;
    cases.forEach(([message, intent]) =>
      expect(evaluateCravingPolicy(message, profile()).intent).toBe(intent),
    );
  });

  it("covers global craving, repetition, and unrelated questions", () => {
    const cases = [
      ["I just ate but wanna snack again.", "repeated_craving"],
      ["I'm bored and want to order food.", "unknown_hunger"],
      ["I already ate and want supper before sleep.", "bedtime_craving"],
      ["Just one bite again.", "repeated_craving"],
      ["I want food at 3 AM.", "unknown_hunger"],
      ["I want help controlling my recurring snack habit.", "unknown_hunger"],
      ["How should I structure a beginner strength workout?", "none"],
    ] as const;
    cases.forEach(([message, intent]) =>
      expect(evaluateCravingPolicy(message, profile()).intent).toBe(intent),
    );
    const repeated = evaluateCravingPolicy(
      "Wanna order food again?",
      profile(),
      ["Just one snack.", "I'll stop tomorrow. One more order."],
    );
    expect(repeated).toMatchObject({
      intent: "repeated_craving",
      approach: "interrupt_impulse",
      allowFoodSuggestion: false,
      repeatedEvidenceCount: 2,
    });
    expect(
      evaluateCravingPolicy(
        "Explain this nutrition-label comparison using only supplied facts. Craving context noted.",
        profile(),
      ).intent,
    ).toBe("none");
    expect(
      evaluateCravingPolicy(
        "Evidence Lab analysis. Use only these aggregated facts: cravingEpisodes=2.",
        profile(),
      ).intent,
    ).toBe("none");
  });

  it("keeps the same decision architecture across every locale and roast level", () => {
    locales
      .flatMap((locale) =>
        roastLevels.map((roastLevel) => profile(locale, roastLevel)),
      )
      .forEach((context) => {
        expect(
          evaluateCravingPolicy("I'm hungry at 3 AM.", context).intent,
        ).toBe("unknown_hunger");
        expect(
          evaluateCravingPolicy("I'm dizzy and haven't eaten.", context).intent,
        ).toBe("safety");
        expect(
          evaluateCravingPolicy("I'm on night shift.", context).intent,
        ).toBe("night_shift");
      });
  });

  it("recognises equivalent hunger context in all supported scripts", () => {
    const messages = [
      "I'm hungry at 3 AM.",
      "凌晨3点，我饿了。",
      "凌晨3點，我真係肚餓。",
      "أنا جائع الساعة 3 صباحاً.",
      "रात 3 बजे भूख लगी है।",
    ];
    messages.forEach((message, index) =>
      expect(
        evaluateCravingPolicy(message, profile(locales[index])).intent,
      ).toBe("unknown_hunger"),
    );
  });

  it("sends recent bedtime cravings to sleep but respects night shifts", () => {
    const now = new Date(2026, 10, 18, 23, 30);
    const bedtime = decideMidnightFood(
      "Craving something",
      "22:30",
      profile() as never,
      now,
    );
    const nightShift = decideMidnightFood(
      "Craving something",
      "22:30",
      profile("en", "savage", "night") as never,
      now,
    );
    expect(bedtime.action).toContain("go to sleep");
    expect(nightShift.action).toContain("working day");
  });
});
