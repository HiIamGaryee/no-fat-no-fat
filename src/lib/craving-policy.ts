export type CravingIntent =
  | "none"
  | "safety"
  | "night_shift"
  | "genuine_hunger"
  | "recent_meal_craving"
  | "bedtime_craving"
  | "repeated_craving"
  | "unknown_hunger";
export type CoachingApproach =
  | "unrelated"
  | "safety_support"
  | "respect_hunger"
  | "clarify"
  | "interrupt_impulse"
  | "bedtime_shutdown";

export interface CravingPolicyContext {
  schedule?: unknown;
  wakeTime?: unknown;
  sleepTime?: unknown;
  roastLevel?: unknown;
}

export interface CravingPolicyResult {
  intent: CravingIntent;
  certainty: "none" | "low" | "high";
  approach: CoachingApproach;
  allowFoodSuggestion: boolean;
  allowRoast: boolean;
  suggestedTool:
    | "none"
    | "open_midnight_food_rescue"
    | "open_movement_roulette"
    | "open_habit_autopsy";
  repeatedEvidenceCount: number;
}

const matches = (value: string, patterns: RegExp[]) =>
  patterns.some((pattern) => pattern.test(value));
const foodPatterns = [
  /hungr|hunger|snack|supper|crav|fridge|want food|wanna (?:snack|eat|order)|order food|one more order|haven't eat|haven't eaten|have not eaten|missed (?:a )?meal|肚餓|饿|餓|宵夜|零食|口痕|想食|冇食|没吃|جوع|جائع|اشتهي|لم آكل|भूख|नाश्ता|नहीं खाया/,
];
const cravingPatterns = [
  /bored|crav|want (?:(?:more|a|another)\s+)?snacks?|want supper|wanna (?:snack|eat|order)|order food|one more order|one (?:more )?bite|just one|mouth.*bored|口痕|嘴馋|無聊|无聊|想食|外賣|外卖|اشتهي|ملل|طفشان|बोर|मन कर रहा/,
];
const recentMealPatterns = [
  /just (?:ate|had)|already (?:ate|had)|recently ate|had (?:dinner|supper)|finished (?:dinner|eating)|啱啱食|刚吃|已經食|已经吃|اكلت للتو|أكلت قبل قليل|अभी खाया|खा चुका|खा चुकी/,
];
const bedtimePatterns = [
  /3\s*(?:am|a\.m\.)|before (?:bed|sleep)|going to (?:bed|sleep)|want to sleep|bedtime|凌晨|瞓覺|睡觉|睡覺|قبل النوم|أريد النوم|सोने|नींद/,
];
const repeatPatterns = [
  /again|another|one more|last time|stop tomorrow|再|又|最後一次|最后一次|聽日|明天|مرة أخرى|غداً|फिर|कल/,
];

export const isCravingRelated = (message: string) =>
  matches(message.toLocaleLowerCase(), [...foodPatterns, ...cravingPatterns]);

export const evaluateCravingPolicy = (
  message: string,
  context: CravingPolicyContext = {},
  history: string[] = [],
): CravingPolicyResult => {
  const value = message.toLocaleLowerCase();
  const safety = matches(value, [
    /dizz|faint|chest pain|severe|self[- ]?harm|eating disorder|unwell|頭暈|头晕|暈|晕|胸痛|不舒服|دوار|إغماء|ألم الصدر|مريض|चक्कर|बेहोश|सीने में दर्द|तबीयत/,
  ]);
  if (safety)
    return {
      intent: "safety",
      certainty: "high",
      approach: "safety_support",
      allowFoodSuggestion: true,
      allowRoast: false,
      suggestedTool: "none",
      repeatedEvidenceCount: 0,
    };
  if (
    matches(value, [
      /explain this nutrition-label comparison using only/,
      /evidence lab analysis\. use only these aggregated facts/,
    ])
  )
    return {
      intent: "none",
      certainty: "none",
      approach: "unrelated",
      allowFoodSuggestion: true,
      allowRoast: true,
      suggestedTool: "none",
      repeatedEvidenceCount: 0,
    };
  const nightShift =
    matches(value, [
      /night shift|overnight shift|working (?:overnight|nights?)|夜班|夜更|通宵工作|مناوبة ليلية|دوام ليلي|रात की शिफ्ट|नाइट शिफ्ट/,
    ]) || context.schedule === "night";
  if (nightShift)
    return {
      intent: "night_shift",
      certainty: "high",
      approach: "respect_hunger",
      allowFoodSuggestion: true,
      allowRoast: true,
      suggestedTool: "none",
      repeatedEvidenceCount: 0,
    };
  if (!isCravingRelated(value))
    return {
      intent: "none",
      certainty: "none",
      approach: "unrelated",
      allowFoodSuggestion: true,
      allowRoast: true,
      suggestedTool: "none",
      repeatedEvidenceCount: 0,
    };
  const prolonged = matches(value, [
    /(?:haven't|have not|didn't|did not) (?:eat|eaten).*(?:[6-9]|1\d)\s*(?:hours?|hrs?)/,
    /(?:[6-9]|1\d)\s*(?:hours?|hrs?).*(?:haven't|without|no food)/,
    /好幾個鐘冇食|几个小时没吃|幾個鐘冇食|لم آكل منذ|ما أكلت منذ|घंटे से नहीं खाया|घंटों से नहीं खाया/,
  ]);
  if (prolonged)
    return {
      intent: "genuine_hunger",
      certainty: "high",
      approach: "respect_hunger",
      allowFoodSuggestion: true,
      allowRoast: false,
      suggestedTool: "none",
      repeatedEvidenceCount: 0,
    };
  const recentMeal = matches(value, recentMealPatterns);
  const craving = matches(value, cravingPatterns);
  const bedtime = matches(value, bedtimePatterns);
  const priorCravings = history.filter(
    (item) =>
      isCravingRelated(item) &&
      matches(item.toLocaleLowerCase(), [
        ...cravingPatterns,
        ...repeatPatterns,
      ]),
  ).length;
  if (recentMeal && craving && bedtime)
    return {
      intent: "bedtime_craving",
      certainty: "high",
      approach: "bedtime_shutdown",
      allowFoodSuggestion: false,
      allowRoast: true,
      suggestedTool: "none",
      repeatedEvidenceCount: priorCravings,
    };
  if (craving && (priorCravings >= 2 || matches(value, repeatPatterns)))
    return {
      intent: "repeated_craving",
      certainty: "high",
      approach: bedtime ? "bedtime_shutdown" : "interrupt_impulse",
      allowFoodSuggestion: false,
      allowRoast: true,
      suggestedTool: "open_habit_autopsy",
      repeatedEvidenceCount: priorCravings,
    };
  if (recentMeal && craving)
    return {
      intent: "recent_meal_craving",
      certainty: "high",
      approach: "interrupt_impulse",
      allowFoodSuggestion: false,
      allowRoast: true,
      suggestedTool: "open_midnight_food_rescue",
      repeatedEvidenceCount: priorCravings,
    };
  return {
    intent: "unknown_hunger",
    certainty: "low",
    approach: "clarify",
    allowFoodSuggestion: false,
    allowRoast: true,
    suggestedTool: "none",
    repeatedEvidenceCount: priorCravings,
  };
};

export const cravingPolicyDirective = (policy: CravingPolicyResult) =>
  ({
    none: "This is unrelated to cravings. Do not inject food or craving advice.",
    safety:
      "SAFETY MODE: no roast. Address symptoms directly and recommend appropriate immediate care. Do not run a craving test.",
    night_shift:
      "NIGHT SHIFT: treat this as a normal waking period. Never prescribe sleep because of clock time. Clarify hunger and respect normal meals.",
    genuine_hunger:
      "GENUINE HUNGER: do not delay, dismiss, moralise, or reward avoiding food. Offer a sensible satisfying option or ask what is available.",
    recent_meal_craving:
      "RECENT MEAL + CRAVING: challenge the impulse. Suggest closing the fridge or delivery app and one brief non-food activity. No replacement snack, fruit, biscuits, or water default.",
    bedtime_craving:
      "BEDTIME CRAVING: end the snack decision, close the fridge or delivery app, put the phone away, and begin the saved bedtime routine. No replacement food.",
    repeated_craving: `REPEATED CRAVING: verified history contains ${policy.repeatedEvidenceCount} relevant prior user statements. Reference only those statements, challenge the recurring script, and suggest closing the app/fridge or investigating the trigger.`,
    unknown_hunger:
      "UNKNOWN HUNGER: ask exactly one short question separating physical hunger or missed meals from craving/boredom/recent eating. Do not recommend or refuse food yet.",
  })[policy.intent];
