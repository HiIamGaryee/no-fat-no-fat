import {
  evaluateCravingPolicy,
  isCravingRelated,
  type CravingPolicyContext,
  type CravingPolicyResult,
} from "./craving-policy.js";

export const COACH_TTL_MS = 8 * 60 * 60 * 1000;
export const LINE_LIMIT = 12;

export const concerns = [
  "none",
  "habitual_craving",
  "unknown_hunger",
  "genuine_hunger",
  "night_shift_meal",
  "safety",
] as const;
export const recommendations = [
  "none",
  "close_app_and_sleep",
  "interrupt_impulse",
  "clarify_hunger",
  "respect_hunger",
  "safety_support",
] as const;
export const userKinds = [
  "new_info",
  "insistence",
  "pushback",
  "postpone",
  "decision",
  "exit",
  "other",
  "unrelated",
] as const;
export const adviceTags = [
  "close_app",
  "sleep",
  "water",
  "brush_teeth",
  "walk",
  "fruit",
  "eat_meal",
  "question",
  "tool",
] as const;
export const evidenceTags = [
  "recent_meal",
  "bedtime",
  "goal_resist",
  "craving_stated",
  "not_hungry",
  "night_shift",
  "missed_meals",
  "symptoms",
] as const;
export const quickReplyRoles = [
  "commit",
  "distract",
  "bedtime",
  "hungry",
  "clarify",
  "eat_meal",
  "give_in",
  "hygiene",
  "other",
] as const;

export type Concern = (typeof concerns)[number];
export type Recommendation = (typeof recommendations)[number];
export type UserKind = (typeof userKinds)[number];
export type AdviceTag = (typeof adviceTags)[number];
export type EvidenceTag = (typeof evidenceTags)[number];
export type QuickReplyRole = (typeof quickReplyRoles)[number];

export interface CoachState {
  version: 1;
  concern: Concern;
  goal: "none" | "resist_snacking";
  goalExplicit: boolean;
  recentMeal: boolean;
  bedtime: boolean;
  recommendation: Recommendation;
  evidence: EvidenceTag[];
  turns: number;
  insistence: number;
  idle: number;
  lastUserKind: UserKind;
  newInfo: boolean;
  safety: boolean;
  safetyTurns: number;
  advice: Partial<Record<AdviceTag, number>>;
  lines: string[];
  seed: number;
  locale: string;
  roast: string;
  updatedAt: string;
}

const uniq = <T>(list: T[]) =>
  list.filter((item, index) => list.indexOf(item) === index);
const matches = (value: string, patterns: RegExp[]) =>
  patterns.some((pattern) => pattern.test(value));
const oneOf = <T extends string>(
  list: readonly T[],
  value: unknown,
): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);
const clamp = (value: unknown, max: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(max, Math.trunc(value)))
    : 0;

export const blankCoachState = (
  profile: CravingPolicyContext & { locale?: unknown } = {},
  now = Date.now(),
): CoachState => ({
  version: 1,
  concern: "none",
  goal: "none",
  goalExplicit: false,
  recentMeal: false,
  bedtime: false,
  recommendation: "none",
  evidence: [],
  turns: 0,
  insistence: 0,
  idle: 0,
  lastUserKind: "other",
  newInfo: false,
  safety: false,
  safetyTurns: 0,
  advice: {},
  lines: [],
  seed: 0,
  locale: String(profile.locale ?? "en"),
  roast: String(profile.roastLevel ?? "savage"),
  updatedAt: new Date(now).toISOString(),
});

/** Validates untrusted client state. Anything malformed, forged-looking or stale is dropped. */
export const sanitizeCoachState = (
  value: unknown,
  now = Date.now(),
): CoachState | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const raw = value as Record<string, unknown>;
  if (
    raw.version !== 1 ||
    !oneOf(concerns, raw.concern) ||
    !oneOf(recommendations, raw.recommendation) ||
    !oneOf(userKinds, raw.lastUserKind)
  )
    return undefined;
  const updated =
    typeof raw.updatedAt === "string" ? Date.parse(raw.updatedAt) : NaN;
  if (
    !Number.isFinite(updated) ||
    now - updated > COACH_TTL_MS ||
    updated - now > 60_000
  )
    return undefined;
  const advice: Partial<Record<AdviceTag, number>> = {};
  if (typeof raw.advice === "object" && raw.advice !== null)
    for (const tag of adviceTags) {
      const count = clamp((raw.advice as Record<string, unknown>)[tag], 20);
      if (count) advice[tag] = count;
    }
  return {
    version: 1,
    concern: raw.concern,
    goal: raw.goal === "resist_snacking" ? "resist_snacking" : "none",
    goalExplicit: raw.goalExplicit === true,
    recentMeal: raw.recentMeal === true,
    bedtime: raw.bedtime === true,
    recommendation: raw.recommendation,
    evidence: Array.isArray(raw.evidence)
      ? uniq(
          raw.evidence.filter((tag): tag is EvidenceTag =>
            oneOf(evidenceTags, tag),
          ),
        ).slice(0, 8)
      : [],
    turns: clamp(raw.turns, 500),
    insistence: clamp(raw.insistence, 100),
    idle: clamp(raw.idle, 10),
    lastUserKind: raw.lastUserKind,
    newInfo: raw.newInfo === true,
    safety: raw.safety === true,
    safetyTurns: clamp(raw.safetyTurns, 10),
    advice,
    lines: Array.isArray(raw.lines)
      ? raw.lines
          .filter((line): line is string => typeof line === "string")
          .map((line) => line.slice(0, 120))
          .slice(-LINE_LIMIT)
      : [],
    seed: clamp(raw.seed, 9999),
    locale: typeof raw.locale === "string" ? raw.locale.slice(0, 12) : "en",
    roast: typeof raw.roast === "string" ? raw.roast.slice(0, 12) : "savage",
    updatedAt: new Date(updated).toISOString(),
  };
};

const P = {
  recentMeal: [
    /just (?:ate|had)|already (?:ate|had|eaten)|recently (?:ate|had)|(?:ate|had|finished) (?:dinner|supper|lunch|eating)|啱啱食|剛剛食|刚吃|刚刚吃|已經食|已经吃|食完|吃完|اكلت للتو|أكلت للتو|أكلت قبل قليل|اكلت قبل قليل|تعشيت|خلصت أكل|अभी खाया|खा चुका|खा चुकी|खाना खा लिया/,
  ],
  bedtime: [
    /\d\s*(?:am|a\.m\.)|before (?:bed|sleep)|going to (?:bed|sleep)|bedtime|late night|midnight|want to sleep|凌晨|半夜|深夜|瞓覺|睡觉|睡覺|قبل النوم|منتصف الليل|الفجر|أريد النوم|सोने|आधी रात|नींद/,
  ],
  goal: [
    /(?:help me|trying to|try to|want to|need to|i'm trying) (?:stop|quit|resist|cut|avoid|skip|not (?:eat|order))|resist (?:the |this |my )?(?:craving|snack|urge)|quit (?:snack|supper|late)|戒宵夜|想戒|幫我戒|帮我戒|唔想再食|不想再吃|控制唔到|控制不住|ساعدني|أريد أن أتوقف|أحاول ألا|रोकना चाहता|रोकना चाहती|छोड़ना चाहता|छोड़ना चाहती/,
  ],
  notHungry: [
    /not (?:really |actually |even )?hungry|just bored|only bored|only (?:a )?craving|唔係肚餓|冇咁肚餓|唔肚餓|只係口痕|只係悶|不饿|不是饿|只是无聊|只是嘴馋|لست جائع|مو جوعان|ملل فقط|भूख नहीं|बस बोर/,
  ],
  strongHunger: [
    /(?:haven'?t|have not|didn'?t|did not) eat(?:en)?(?: anything)?(?: all day| since| for| today)|skipped (?:dinner|lunch|breakfast|meals?)|missed (?:a |my |dinner|lunch|meals?)|starving|famished|stomach (?:is )?(?:growling|empty|hurts)|冇食晒|成日冇食|成日冇食嘢|冇食飯|上餐.*(?:[六七八九十]|\d+)個鐘前|没吃饭|整天没吃|一天没吃|上顿.*(?:[六七八九十]|\d+)个小时前|空腹|ما أكلت|لم آكل|معدتي|दिन भर कुछ नहीं खाया|कुछ नहीं खाया|खाना नहीं खाया/,
  ],
  weakHunger: [
    /genuinely hungry|really hungry|truly hungry|actually hungry|physically hungry|i'?m hungry|真係肚餓|真係好肚餓|好肚餓|真的饿|真的很饿|其实.*饿|其實.*餓|جائع فعلاً|جائع حقاً|جائع جداً|सच में भूख|भूख लगी है/,
  ],
  craveWord: [
    /想吃|想要吃|还想吃|嘴馋|夜宵|炸鸡|炸雞|点外卖|點外賣|叫外賣|叫外卖|fried chicken|pizza|burger|fries|ice cream|junk food|takeaway|takeout|وجبة خفيفة|اشتهي|أشتهي|أبغى آكل|ابغى اكل|أبي آكل|خلني آكل|खाने का मन|नाश्ते का मन|खाने की इच्छा|मन कर रहा|चिकन खाना|खाना चाहता|खाना चाहती/,
  ],
  insist: [
    /just one|one (?:more )?bite|come on|c'mon|please let me|let me eat|i really want|i (?:want|need) (?:it|that|some|more|food|fried)|give me|真係好想|真的好想|好想食|好想吃|我要食|我要吃|俾我食|畀我食|让我吃|得唔得|行吗|我愛|我爱|خليني|أبغي|أريد|ابغى|بس واحدة|बस एक|खाने दो|खाने दीजिए|मुझे खाना है|बहुत मन है/,
  ],
  pushback: [
    /annoying|shut up|stop nagging|stop it|ugh|hate you|you'?re (?:so )?(?:mean|rude)|激死|嬲|好煩|你咁煩|你好煩|烦死|气死|عصبتني|أزعجتني|مزعج|تعبتني|परेशान|चिढ़|तंग मत/,
  ],
  postpone: [
    /tomorrow|later|next week|monday|聽日|听日|明日|明天|聽朝|下次|之後先|غداً|بكرة|بعدين|कल|बाद में/,
  ],
  decision: [
    /(?:i'?m|i will|i'?ll|going to) (?:just )?(?:eat|order|get)(?:ting)? (?:it )?(?:anyway|regardless)|ordering anyway|eating anyway|i don'?t care.*(?:eat|order)|screw it|我照食|我都要食|我照叫|我偏要|我就要吃|我照吃|我要叫外賣|我叫外賣|我要叫外卖|我叫外卖|算啦我要|算了我要|算啦.*(?:叫|食)|算了.*(?:叫|吃)|i give up|i'?ll just (?:order|eat)|i'?m just (?:going to )?(?:order|eat)|ordering now|سأطلب على أي حال|سأكل رغم|मैं तो खाऊँगा|फिर भी खाऊँगा|मैं तो खा रहा/,
  ],
  exit: [
    /^\s*(?:stop|enough|bye|goodbye|nvm|never ?mind)\s*[.!]*\s*$|leave me alone|i'?m done talking|stop talking|不講|唔講|唔使講|唔想講|算了|拜拜|别说了|不聊了|خلاص|مع السلامة|ابعد عني|रहने दो|अलविदा|बात नहीं करनी/,
  ],
  recovered: [
    /i(?:'m| am) (?:okay|better|fine) now|feeling better now|而家好返|依家好返|冇事喇|没事了|现在好多了|أشعر بتحسن الآن|أنا بخير الآن|अब बेहतर हूँ|अब ठीक हूँ/,
  ],
};

const test = (value: string, key: keyof typeof P) => matches(value, P[key]);

const patch = (state: CoachState, partial: Partial<CoachState>) =>
  Object.assign(state, partial);
const reset = (state: CoachState) =>
  patch(state, {
    concern: "none",
    recommendation: "none",
    goal: "none",
    goalExplicit: false,
    recentMeal: false,
    bedtime: false,
    evidence: [],
    insistence: 0,
    advice: {},
    idle: 0,
  });
const addEvidence = (list: EvidenceTag[], ...tags: EvidenceTag[]) =>
  uniq([...list, ...tags]).slice(0, 8);

export interface CoachTurn {
  state: CoachState;
  policy: CravingPolicyResult;
}

export const advanceCoachState = ({
  prev,
  message,
  profile,
  history = [],
  now = Date.now(),
}: {
  prev?: CoachState;
  message: string;
  profile: CravingPolicyContext & { locale?: unknown };
  history?: string[];
  now?: number;
}): CoachTurn => {
  const value = message.toLocaleLowerCase();
  const base = evaluateCravingPolicy(message, profile, history);
  const carried = prev && sanitizeCoachState(prev, now);
  const next: CoachState = {
    ...(carried ?? blankCoachState(profile, now)),
    locale: String(profile.locale ?? "en"),
    roast: String(profile.roastLevel ?? "savage"),
    updatedAt: new Date(now).toISOString(),
  };
  next.turns += 1;
  if (!carried) {
    let hash = 7;
    for (let i = 0; i < message.length; i += 1)
      hash = (hash * 31 + message.charCodeAt(i)) % 9973;
    next.seed = hash;
  }
  const recentMeal = test(value, "recentMeal");
  const bedtime = test(value, "bedtime");
  const goal = test(value, "goal");
  const notHungry = test(value, "notHungry");
  const craving =
    isCravingRelated(value) ||
    test(value, "insist") ||
    test(value, "craveWord");
  const established = carried?.concern === "habitual_craving";
  const wasUnknown = carried?.concern === "unknown_hunger";

  if (base.intent === "safety") {
    patch(next, {
      concern: "safety",
      recommendation: "safety_support",
      lastUserKind: "new_info",
      newInfo: true,
      insistence: 0,
      idle: 0,
      safety: true,
      safetyTurns: 0,
      evidence: addEvidence(next.evidence, "symptoms"),
    });
    return { state: next, policy: base };
  }
  if (carried?.safety && test(value, "recovered")) {
    next.safety = false;
    reset(next);
  } else if (carried?.safety && next.safetyTurns < 2) {
    next.safetyTurns += 1;
    next.safety = true;
  } else {
    next.safety = false;
    if (carried?.concern === "safety") reset(next);
  }

  const strong =
    test(value, "strongHunger") || base.intent === "genuine_hunger";
  const weakWithContext =
    test(value, "weakHunger") && (established || wasUnknown);
  if (base.intent === "night_shift") {
    patch(next, {
      concern: "night_shift_meal",
      recommendation: "respect_hunger",
      recentMeal: false,
      bedtime: false,
      lastUserKind: "new_info",
      newInfo: true,
      insistence: 0,
      idle: 0,
      advice: {},
      evidence: addEvidence(next.evidence, "night_shift"),
    });
    return { state: next, policy: policyFor(next, base) };
  }
  if (strong || weakWithContext) {
    patch(next, {
      concern: "genuine_hunger",
      recommendation: "respect_hunger",
      recentMeal: false,
      lastUserKind: "new_info",
      newInfo: true,
      insistence: 0,
      idle: 0,
      advice: {},
      evidence: addEvidence(
        next.evidence.filter((tag) => tag !== "recent_meal"),
        "missed_meals",
      ),
    });
    return { state: next, policy: policyFor(next, base) };
  }

  const related =
    craving ||
    notHungry ||
    recentMeal ||
    goal ||
    test(value, "pushback") ||
    test(value, "postpone") ||
    test(value, "decision") ||
    test(value, "exit");
  if (established && !related) {
    patch(next, {
      lastUserKind: "unrelated",
      newInfo: false,
      idle: next.idle + 1,
    });
    if (next.idle >= 2) reset(next);
    return { state: next, policy: policyFor(next, base) };
  }
  const wantsHabit =
    established ||
    ((craving || wasUnknown) &&
      (recentMeal || carried?.recentMeal || notHungry)) ||
    (craving && recentMeal);
  if (wantsHabit) {
    const hadMeal = Boolean(carried?.recentMeal) || recentMeal;
    const hadBedtime = Boolean(carried?.bedtime) || bedtime;
    const hadGoal = Boolean(carried?.goalExplicit) || goal;
    const fresh =
      !established ||
      (recentMeal && !carried?.recentMeal) ||
      (bedtime && !carried?.bedtime) ||
      (goal && !carried?.goalExplicit) ||
      (notHungry && !carried?.evidence.includes("not_hungry"));
    const kind: UserKind = test(value, "decision")
      ? "decision"
      : test(value, "exit")
        ? "exit"
        : fresh
          ? "new_info"
          : test(value, "postpone")
            ? "postpone"
            : test(value, "pushback")
              ? "pushback"
              : "insistence";
    patch(next, {
      concern: "habitual_craving",
      goal:
        hadGoal || hadMeal || notHungry
          ? "resist_snacking"
          : (carried?.goal ?? "none"),
      goalExplicit: hadGoal,
      recentMeal: hadMeal,
      bedtime: hadBedtime,
      recommendation: hadBedtime ? "close_app_and_sleep" : "interrupt_impulse",
      lastUserKind: kind,
      newInfo: fresh,
      insistence: fresh ? 0 : next.insistence + 1,
      idle: 0,
      evidence: addEvidence(
        next.evidence,
        ...(hadMeal ? (["recent_meal"] as const) : []),
        ...(hadBedtime ? (["bedtime"] as const) : []),
        ...(hadGoal ? (["goal_resist"] as const) : []),
        ...(craving ? (["craving_stated"] as const) : []),
        ...(notHungry ? (["not_hungry"] as const) : []),
      ),
    });
    return { state: next, policy: policyFor(next, base) };
  }

  const kind: UserKind = test(value, "exit")
    ? "exit"
    : test(value, "postpone")
      ? "postpone"
      : craving
        ? "other"
        : "unrelated";
  if (base.intent === "unknown_hunger") {
    patch(next, {
      concern: "unknown_hunger",
      recommendation: "clarify_hunger",
      lastUserKind: "new_info",
      newInfo: true,
      insistence: 0,
      idle: 0,
      bedtime: bedtime || next.bedtime,
    });
    return { state: next, policy: policyFor(next, base) };
  }
  next.lastUserKind = kind;
  next.newInfo = false;
  if (kind === "unrelated" || kind === "postpone") next.idle += 1;
  if (next.idle >= 2 && next.concern !== "none") reset(next);
  return { state: next, policy: policyFor(next, base) };
};

/** Effective policy: the persisted decision, not just the latest message, drives behaviour. */
export const policyFor = (
  state: CoachState,
  base: CravingPolicyResult,
): CravingPolicyResult => {
  if (state.concern === "habitual_craving")
    return {
      intent: state.bedtime
        ? "bedtime_craving"
        : state.insistence >= 2
          ? "repeated_craving"
          : "recent_meal_craving",
      certainty: "high",
      approach: state.bedtime ? "bedtime_shutdown" : "interrupt_impulse",
      allowFoodSuggestion: false,
      allowRoast: true,
      suggestedTool: state.bedtime
        ? "none"
        : state.insistence >= 2
          ? "open_habit_autopsy"
          : "open_midnight_food_rescue",
      repeatedEvidenceCount: state.insistence,
    };
  if (state.concern === "genuine_hunger")
    return {
      intent: "genuine_hunger",
      certainty: "high",
      approach: "respect_hunger",
      allowFoodSuggestion: true,
      allowRoast: false,
      suggestedTool: "none",
      repeatedEvidenceCount: 0,
    };
  if (state.concern === "unknown_hunger" && base.intent === "none")
    return {
      ...base,
      intent: "unknown_hunger",
      approach: "clarify",
      allowFoodSuggestion: false,
      suggestedTool: "none",
    };
  return base;
};

const adviceSummary = (state: CoachState) => {
  const used = adviceTags
    .filter((tag) => (state.advice[tag] ?? 0) > 0)
    .map((tag) => `${tag}x${state.advice[tag]}`);
  return used.length ? used.join(", ") : "none yet";
};

/** Trusted, server-built instruction describing the persisted decision and how this turn must treat it. */
export const coachStateDirective = (
  state: CoachState,
  source: "chat" | "tool" = "chat",
) => {
  const header = `COACHING STATE (trusted, server-validated): concern=${state.concern}; goal=${state.goal}; recent_meal=${state.recentMeal}; bedtime_context=${state.bedtime}; recommendation=${state.recommendation}; evidence=[${state.evidence.join(", ")}]; coaching_turns=${state.turns}; last_user_move=${state.lastUserKind}; new_information_this_turn=${state.newInfo}; consecutive_insistence=${state.insistence}; safety_active=${state.safety}; advice_already_given=${adviceSummary(state)}.`;
  if (source === "tool")
    return `${header}\nThis request comes from a health tool. Never contradict the recommendation above (for example never suggest a snack while concern=habitual_craving and no new information exists). Stay in character and concise.`;
  const rules: string[] = [
    "The user's CURRENT message always matters more than a stale state. If it is about something else, answer that and keep the state in the background.",
    "Repeating a wish, arguing, complaining, teasing or being annoyed is NOT new evidence. Only new facts (hunger, missed meals, symptoms, shift work, a different situation) change the recommendation.",
  ];
  if (state.safety)
    rules.unshift(
      "SAFETY IS ACTIVE: no roast, no jokes about symptoms. Be direct, calm and supportive; recommend appropriate care. A short dry-free check-in is fine.",
    );
  const byConcern: Record<Concern, string> = {
    habitual_craving: `HOLD THE RECOMMENDATION (${state.recommendation}). Do not soften, bargain, grant permission, or say 'fine', 'just this once', 'go ahead', 'tomorrow then'. The user's goal is to resist this habit; remind them of it with wit, not guilt. It remains their decision: never shame or pressure them for eating, but never cheer it on either.`,
    genuine_hunger:
      "GENUINE HUNGER: the earlier craving coaching no longer applies. Do not roast the hunger, do not delay or moralise. Offer one sensible, satisfying practical option or ask what is available.",
    night_shift_meal:
      "NIGHT SHIFT: eating now is normal. No sleep prescriptions, no snack policing. Practical and dry.",
    unknown_hunger:
      "UNKNOWN HUNGER: ask exactly one short question separating physical hunger or missed meals from craving or boredom. Do not recommend or refuse food yet.",
    safety: "SAFETY: follow the safety rules above.",
    none: "No active coaching concern. Respond to the user's message directly.",
  };
  rules.push(byConcern[state.concern]);
  const byKind: Record<UserKind, string> = {
    new_info:
      state.concern === "habitual_craving"
        ? "This turn adds useful context. React directly and keep the plan concise."
        : "New information arrived: reassess openly.",
    insistence: `The user is repeating the craving (insistence #${state.insistence}). Reply briefly and naturally without inventing a bigger joke or repeating the lecture. ${state.insistence >= 3 ? "Use exactly one short bubble and let the conversation breathe." : ""}`,
    pushback:
      "The user is annoyed at you. Answer with playful, unbothered wit. No apology, no softening, no affection, no escalation into abuse. If it reads as real distress, drop the act and be kind and direct. The recommendation stays unchanged.",
    postpone:
      "The user wants to start tomorrow or later. React directly; a short comeback is enough. A tiny action is optional, not mandatory.",
    decision:
      "The user says they will eat or order anyway. It is their call: one dry, non-shaming line, no lecture, no 'go ahead' warmth, no permission, no extra advice. Do not reopen the argument.",
    exit: "The user wants to stop talking. Respect it: one short parting line in character, no new advice, no question, no quick replies.",
    other: "Stay in character and answer briefly.",
    unrelated:
      "The message is unrelated to the craving. Answer it in character and do not drag the craving back in.",
  };
  rules.push(byKind[state.lastUserKind]);
  rules.push(
    "Do not repeat any instruction listed in advice_already_given unless new information makes it relevant. Water, brushing teeth, walking, fruit and 'go to sleep' must not appear mechanically; use them only when the context genuinely calls for them.",
  );
  const repeated = adviceTags.filter((tag) => (state.advice[tag] ?? 0) >= 2);
  if (repeated.length && state.concern === "habitual_craving")
    rules.push(
      `You have already said this at least twice: ${repeated.join(", ")}. Do not repeat it. A plain short reaction is better than inventing another analogy.`,
    );
  return `${header}\n${rules.join("\n")}`;
};

export const hungryReply: Record<string, string> = {
  en: "I'm actually hungry",
  "zh-CN": "我其实真的饿了",
  "yue-Hant": "我其實真係肚餓",
  "ar-AE": "أنا جائع فعلاً",
  "hi-IN": "मुझे सच में भूख लगी है",
};

/** Drops quick replies that undermine the coaching objective and adds the honest "I'm actually hungry" exit. */
export const filterQuickReplies = (
  replies: { text: string; role: QuickReplyRole }[],
  state: CoachState,
  locale: string,
) => {
  if (!replies.length) return [];
  const blocked: QuickReplyRole[] = [
    "give_in",
    ...(state.concern === "habitual_craving"
      ? (["eat_meal", "hygiene"] as const)
      : []),
  ];
  const undermining = (reply: { text: string; role: QuickReplyRole }) =>
    state.concern === "habitual_craving" &&
    reply.role !== "hungry" &&
    (test(reply.text.toLocaleLowerCase(), "postpone") ||
      matches(reply.text, nagPatterns));
  const kept =
    state.lastUserKind === "exit" ||
    state.lastUserKind === "decision" ||
    state.safety
      ? []
      : replies
          .filter(
            (reply) =>
              !blocked.includes(reply.role) &&
              !undermining(reply) &&
              reply.text.trim(),
          )
          .map((reply) => reply.text.trim().slice(0, 80))
          .slice(0, 2);
  if (
    state.concern === "habitual_craving" &&
    !state.safety &&
    state.lastUserKind !== "exit" &&
    state.lastUserKind !== "decision" &&
    !replies.some((reply) => reply.role === "hungry")
  ) {
    const label = hungryReply[locale] ?? hungryReply.en;
    return [...kept.slice(0, 1), label];
  }
  return kept;
};

const softPatterns: RegExp[] = [
  /(?:fine|okay|ok|alright)[,.!]?\s+(?:just this once|go ahead|have it|eat it|you win)|go ahead and (?:eat|order)|just this once|you (?:deserve|earned) it|treat yourself|since you (?:really )?want|if you (?:really )?(?:want|insist),?\s+(?:then )?(?:go|eat|order)|let it slide|enjoy (?:it|your (?:snack|food))/i,
  /好啦[，,]?\s*(?:聽日|听日|明天|你食|隨你|随你)|就這一次|就这一次|隨你(?:便)?食|随你吃|你食啦|想食就食|想吃就吃|算你贏|算你赢|享受吧|聽日再講|明天再说|聽日先算|聽日點算聽日|听日点算听日|留返聽朝先講|留到明天再说|tomorrow(?:'s| you| will)?\s+(?:problem|can wait)|deal with (?:it|that) tomorrow/,
  /تفضل (?:كل|اطلب)|كل كما تشاء|هذه المرة فقط|اطلب ما تشاء|لا بأس هذه المرة/,
  /ठीक है[,।]?\s*(?:खा लो|खा लीजिए|खाइए|ऑर्डर)|बस इस बार|इस बार चलेगा/,
];
const concessionStarts: RegExp[] = [
  /^\s*(?:好啦|好喇|好吧|算啦|算了啦)[，,、！!]/,
  /^\s*(?:okay|ok|fine|alright|sure|whatever)[,.!]/i,
  /^\s*(?:حسناً|حسنا|طيب|تمام)[،,!]/,
  /^\s*(?:ठीक है|अच्छा ठीक है)[,।!]/,
];
const nagPatterns: RegExp[] = [
  /\bwater\b|\bhydrate|brush (?:your )?teeth|\bfruit\b|\bapple\b|\bbanana\b|飲(?:啖|杯|口)?水|喝(?:杯|口)?(?:凉|冷|温)?水|喝水|刷牙|洗面|洗個面|洗脸|生果|水果|ماء|اشرب|فرشاة|تنظيف الأسنان|पानी|ब्रश|दाँत|फल/i,
];
const affectionPatterns: RegExp[] = [
  /sweetheart|honey|\bbabe\b|\bbaby\b|darling|my love|love you|miss you|handsome|cutie|寶貝|宝贝|親愛|亲爱|甜心|老公|老婆|with love|stubborn love|my dear|xoxo|<3|\bhugs?\b|抱抱|摸摸頭|摸摸头|想你|愛你|爱你|احبك|أحبك|प्यार से|حبيبي|حبيبتي|عزيزي|يا قلبي|(?:^|[\s,।!?"“])(?:जान|प्रिय|डार्लिंग|स्वीटहार्ट)(?=$|[\s,।!?"”])/i,
];

const bodyPatterns: RegExp[] = [
  /double chin|chubby|\bflab\b|love handles|beer gut|\bbelly\b|waistline|\babs\b|\bthighs?\b|\bfat\b|\bfatty\b|雙下巴|双下巴|腹肌|脂肪|贅肉|赘肉|肚腩|小肚子|大肚|發胖|发胖|胖|肥(?!料|皂)|個磅|个磅|體重|体重|磅數|(?:on|the|your|bathroom) scales?\b|\bweigh(?:s|ing|t)?\b|黑眼圈|眼袋|皺紋|皱纹|暗瘡|痘痘|照鏡|照镜|\bmirror\b|\bwrinkles?\b|dark circles|eye bags|\bpimples?\b|\bacne\b|वज़न|वजन|وزن|كرش|سمين|بدين|دهون|मोटा|मोटापा|चर्बी|तोंद/i,
];

export type QualityIssue =
  | "caving"
  | "affection"
  | "body"
  | "nag"
  | "repeat"
  | "theatrical";

const theatricalPatterns = [
  /合約第|合同第|法庭(?:宣佈|宣布)|深夜食堂|催淚|催泪|失蹤人口|失踪人口|緊急會議|紧急会议|政府工程|政府项目|無薪假|无薪假/,
  /(?:courtroom|contract clause|missing-person report|emergency meeting|government project|unpaid leave)/i,
  /(?:你個|你的)(?:胃|雪櫃|冰箱|梳化|沙發|鞋|目標|靈魂).{0,10}(?:永動機|黑洞|垃圾桶|裝飾|保安|收工|拍拖|人格)/,
];

/** Server-side guard against personality drift; the model's own words are never trusted blindly. */
const squash = (value: string) =>
  value
    .toLocaleLowerCase()
    .replace(/[\s.,!?;:'"“”‘’。，！？、；：（）()\-—…~*]+/g, "");

/** Last assistant bubbles from the replayed model steps, used to forbid verbatim repeats. */
export const previousBubbles = (history: unknown[], limit = 8): string[] => {
  const found: string[] = [];
  for (const step of history) {
    if (
      typeof step !== "object" ||
      step === null ||
      (step as { type?: unknown }).type !== "model_output"
    )
      continue;
    const content = (step as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      const text =
        typeof part === "object" && part !== null
          ? (part as { text?: unknown }).text
          : undefined;
      if (typeof text !== "string") continue;
      try {
        const parsed = JSON.parse(text) as { bubbles?: unknown };
        if (Array.isArray(parsed.bubbles))
          found.push(
            ...parsed.bubbles
              .filter((item): item is string => typeof item === "string")
              .map((item) => item.slice(0, 160)),
          );
      } catch {
        found.push(text.slice(0, 160));
      }
    }
  }
  return found.slice(-limit);
};

/** Server-side guard against personality drift; the model's own words are never trusted blindly. */
export const qualityIssues = (
  bubbles: string[],
  state: CoachState,
  context: { advice?: unknown; previous?: string[] } = {},
): QualityIssue[] => {
  const text = bubbles.join(" ");
  const issues: QualityIssue[] = [];
  const holding = state.concern === "habitual_craving";
  if (
    (holding || state.lastUserKind === "postpone") &&
    state.concern !== "genuine_hunger" &&
    (matches(text, softPatterns) ||
      bubbles.some((bubble) => matches(bubble, concessionStarts)))
  )
    issues.push("caving");
  if (matches(text, affectionPatterns)) issues.push("affection");
  if (matches(text, theatricalPatterns)) issues.push("theatrical");
  if (
    !state.safety &&
    matches(
      text.replace(/no-fat-no-fat/gi, "").replace(/[減减]肥/g, ""),
      bodyPatterns,
    )
  )
    issues.push("body");
  if (holding && matches(text, nagPatterns)) issues.push("nag");
  if (
    holding &&
    Array.isArray(context.advice) &&
    context.advice.some(
      (tag) =>
        tag === "water" ||
        tag === "brush_teeth" ||
        tag === "fruit" ||
        tag === "eat_meal" ||
        (tag === "walk" && state.bedtime),
    )
  )
    issues.push("nag");
  if (repeatedLines(bubbles, context.previous ?? []).length)
    issues.push("repeat");
  return issues;
};

/** Shared tool decision: tools must not contradict what the chat already established. */
export const toolShouldBlockSnack = (
  state: CoachState | undefined,
  situation: string,
) =>
  Boolean(
    state &&
      state.concern === "habitual_craving" &&
      state.recentMeal &&
      ![
        "Genuinely hungry",
        "Haven't eaten for hours",
        "Working a night shift",
      ].includes(situation),
  );

export const recordAdvice = (state: CoachState, tags: unknown): CoachState => {
  if (!Array.isArray(tags)) return state;
  const advice = { ...state.advice };
  for (const tag of tags)
    if (oneOf(adviceTags, tag))
      advice[tag] = Math.min(20, (advice[tag] ?? 0) + 1);
  return { ...state, advice };
};

/** Keeps a rolling window of the coach's own recent lines so jokes are never repeated. */
export const recordLines = (
  state: CoachState,
  bubbles: string[],
): CoachState => ({
  ...state,
  lines: [
    ...state.lines,
    ...bubbles.map((bubble) => bubble.slice(0, 120)),
  ].slice(-LINE_LIMIT),
});

export const repeatedLines = (bubbles: string[], previous: string[]) => {
  const seen = previous.map(squash);
  return bubbles.filter((bubble) => seen.includes(squash(bubble)));
};

const fallbackLines = {
  plan: {
    en: "Nice try. The plan stands.",
    "zh-CN": "想得美。计划不变。",
    "yue-Hant": "諗得美喎。計劃照舊。",
    "ar-AE": "محاولة جيدة. الخطة كما هي.",
    "hi-IN": "अच्छी कोशिश। योजना वही रहेगी।",
  },
  neutral: {
    en: "Bold of you. Noted.",
    "zh-CN": "够大胆。已记录。",
    "yue-Hant": "夠膽。記低咗。",
    "ar-AE": "جريء. تم تسجيله.",
    "hi-IN": "हिम्मत है। नोट कर लिया।",
  },
  repeat: {
    en: "Again? Same answer.",
    "zh-CN": "又来？答案还是一样。",
    "yue-Hant": "又嚟？答案都係一樣。",
    "ar-AE": "مرة ثانية؟ نفس الجواب.",
    "hi-IN": "फिर वही? जवाब भी वही है।",
  },
} as const;

/** Last line of defence: remove offending bubbles; if none are clean, never ship body, affection or caving text. */
export const scrubBubbles = (
  bubbles: string[],
  state: CoachState,
  previous: string[],
  locale: string,
): string[] => {
  const flagged = bubbles.map((bubble) =>
    qualityIssues([bubble], state, { previous }),
  );
  const clean = bubbles.filter((_, index) => flagged[index].length === 0);
  if (clean.length) return clean;
  if (flagged.some((issues) => issues.includes("repeat"))) {
    const set = fallbackLines.repeat as Record<string, string>;
    return [set[locale] ?? set.en];
  }
  if (
    flagged.some((issues) =>
      issues.some(
        (issue) =>
          issue === "body" ||
          issue === "affection" ||
          issue === "caving" ||
          issue === "theatrical",
      ),
    )
  ) {
    const set = fallbackLines[
      state.concern === "habitual_craving" ? "plan" : "neutral"
    ] as Record<string, string>;
    return [set[locale] ?? set.en];
  }
  return bubbles;
};
