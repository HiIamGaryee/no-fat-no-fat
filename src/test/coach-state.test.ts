import { describe, expect, it, vi } from "vitest";
import {
  advanceCoachState,
  coachStateDirective,
  filterQuickReplies,
  hungryReply,
  qualityIssues,
  recordAdvice,
  jokeDeviceFor,
  recordLines,
  scrubBubbles,
  repeatedLines,
  sanitizeCoachState,
  toolShouldBlockSnack,
  type CoachState,
} from "@/lib/coach-state";
import { decideMidnightFood } from "@/pages/tools/MidnightFoodPage";
import { clearChat, loadChat, loadCoachState, saveChat, STORAGE_KEYS } from "@/lib/storage";
import { sendChatMessage } from "@/lib/chat";

const profile = (locale = "en", roastLevel = "unhinged", schedule = "regular") => ({ username: "QA", locale, schedule, wakeTime: "07:00", sleepTime: "23:00", roastLevel });
const play = (messages: string[], context = profile()) => {
  let state: CoachState | undefined;
  const history: string[] = [];
  return messages.map((message) => {
    const turn = advanceCoachState({ prev: state, message, profile: context, history: [...history] });
    history.push(message);
    state = turn.state;
    return turn;
  });
};
const opener = "It's 3 AM. I just ate, but I want another snack. Help me resist it.";

describe("Test A: repeated craving never overturns the recommendation", () => {
  const nagging = ["I want fried chicken", "just one bite", "come on lah", "真係好想食", "我愛炸雞", "please let me eat", "I really want it", "我要食炸雞", "give me the app", "one more bite"];
  const turns = play([opener, ...nagging]);

  it("establishes the habit once, from the first message", () => {
    expect(turns[0].state).toMatchObject({ concern: "habitual_craving", goal: "resist_snacking", goalExplicit: true, recentMeal: true, bedtime: true, recommendation: "close_app_and_sleep", newInfo: true });
  });
  it("keeps the same recommendation through ten insistent turns, even without repeating the context", () => {
    turns.slice(1).forEach((turn, index) => {
      expect(turn.state.recommendation).toBe("close_app_and_sleep");
      expect(turn.state.concern).toBe("habitual_craving");
      expect(turn.state.recentMeal).toBe(true);
      expect(turn.state.newInfo).toBe(false);
      expect(turn.state.lastUserKind).toBe("insistence");
      expect(turn.state.insistence).toBe(index + 1);
      expect(turn.policy.allowFoodSuggestion).toBe(false);
    });
  });
  it("asks for ever shorter replies as insistence grows, without a new lecture", () => {
    expect(coachStateDirective(turns[2].state)).not.toMatch(/Be even shorter/);
    expect(coachStateDirective(turns[6].state)).toMatch(/Be even shorter/);
    expect(coachStateDirective(turns[6].state)).toMatch(/HOLD THE RECOMMENDATION/);
  });
});

describe("Test B: emotional pushback", () => {
  it("treats annoyance as colloquial pushback, not new evidence", () => {
    const [, annoyed, again] = play([opener, "激死我啦", "你咁煩嘅"]);
    expect(annoyed.state).toMatchObject({ lastUserKind: "pushback", newInfo: false, recommendation: "close_app_and_sleep" });
    expect(again.state.lastUserKind).toBe("pushback");
    expect(coachStateDirective(annoyed.state)).toMatch(/No apology, no softening, no affection/);
    expect(coachStateDirective(annoyed.state)).toMatch(/real distress/);
  });
});

describe("Test C: procrastination", () => {
  it("never accepts 'tomorrow' as progress and asks for a step today", () => {
    const [, postponed] = play([opener, "聽日先算"]);
    expect(postponed.state).toMatchObject({ lastUserKind: "postpone", recommendation: "close_app_and_sleep" });
    expect(coachStateDirective(postponed.state)).toMatch(/Never praise or accept postponement/);
    expect(coachStateDirective(postponed.state)).toMatch(/ONE realistic step/);
  });
  it("applies even before any craving concern exists", () => {
    const [turn] = play(["I'll start tomorrow"]);
    expect(turn.state.lastUserKind).toBe("postpone");
    expect(coachStateDirective(turn.state)).toMatch(/Never praise or accept postponement/);
  });
  it("respects a clear request to stop the conversation", () => {
    const [, exit] = play([opener, "bye"]);
    expect(exit.state.lastUserKind).toBe("exit");
    expect(coachStateDirective(exit.state)).toMatch(/Respect it/);
    expect(filterQuickReplies([{ text: "ok", role: "commit" }], exit.state, "en")).toEqual([]);
  });
  it("lets the user decide without shaming or cheering", () => {
    const [, decided] = play([opener, "I'm ordering anyway"]);
    expect(decided.state.lastUserKind).toBe("decision");
    expect(coachStateDirective(decided.state)).toMatch(/non-shaming/);
    expect(coachStateDirective(decided.state)).toMatch(/no permission/);
  });
});

describe("Test D: genuine hunger and safety reassess the plan", () => {
  it("drops craving coaching when the user reports missed meals", () => {
    const [, hungry, after] = play([opener, "Actually I haven't eaten all day and I'm genuinely hungry", "I want fried chicken"]);
    expect(hungry.state).toMatchObject({ concern: "genuine_hunger", recommendation: "respect_hunger", recentMeal: false, newInfo: true });
    expect(hungry.policy).toMatchObject({ allowFoodSuggestion: true, allowRoast: false });
    expect(after.state.concern).toBe("genuine_hunger");
    expect(after.policy.allowFoodSuggestion).toBe(true);
  });
  it("accepts the 'I'm actually hungry' quick reply in every language as new information", () => {
    Object.entries(hungryReply).forEach(([locale, label]) => {
      const [, turn] = play([opener, label], profile(locale));
      expect(turn.state.concern, locale).toBe("genuine_hunger");
    });
  });
  it("treats a night shift as a normal meal and never sleep-prescribes", () => {
    const [, shift] = play([opener, "I'm on a night shift and this is my meal"]);
    expect(shift.state).toMatchObject({ concern: "night_shift_meal", recommendation: "respect_hunger", recentMeal: false });
  });
  it("escalates safety, silences roasting, then decays", () => {
    const turns = play([opener, "I feel dizzy", "ok", "ok", "ok", "how do I stretch my back?"]);
    expect(turns[1].state).toMatchObject({ safety: true, concern: "safety", recommendation: "safety_support" });
    expect(turns[1].policy.allowRoast).toBe(false);
    expect(turns[2].state.safety).toBe(true);
    expect(turns[4].state.safety).toBe(false);
    expect(turns[4].state.concern).not.toBe("safety");
  });
});

describe("Test E: persistence across 20 turns", () => {
  it("keeps the selected roast level, concern and a growing but bounded state", () => {
    const messages = [opener, ...Array.from({ length: 19 }, (_, i) => ["just one bite", "激死我啦", "聽日先算", "I really want it"][i % 4])];
    const turns = play(messages);
    const last = turns.at(-1)!.state;
    expect(last).toMatchObject({ roast: "unhinged", concern: "habitual_craving", recommendation: "close_app_and_sleep" });
    expect(last.turns).toBe(20);
    expect(JSON.stringify(last).length).toBeLessThan(900);
  });
  it("tracks advice already given so it is not repeated mechanically", () => {
    let state = play([opener])[0].state;
    state = recordAdvice(recordAdvice(state, ["water", "sleep"]), ["water", "bogus"]);
    expect(state.advice).toEqual({ water: 2, sleep: 1 });
    expect(coachStateDirective(state)).toMatch(/water.?x2/);
  });
  it("lets an unrelated topic decay a stale concern", () => {
    const turns = play([opener, "how do I stretch my back?", "and what about push-ups form?"]);
    expect(turns[1].state.lastUserKind).toBe("unrelated");
    expect(turns[1].state.concern).toBe("habitual_craving");
    expect(turns[2].state.concern).toBe("none");
  });
});

describe("Test F: the same decision logic in all five languages", () => {
  const openers: [string, string, string][] = [
    ["en", "I just ate dinner but I want another snack at 3 AM", "bye"],
    ["zh-CN", "我刚吃完饭，但是凌晨三点还想吃宵夜", "不聊了"],
    ["yue-Hant", "我啱啱食完，凌晨三點仲想食宵夜", "唔想講"],
    ["ar-AE", "أكلت للتو لكن اشتهي وجبة خفيفة الفجر", "خلاص"],
    ["hi-IN", "अभी खाया है लेकिन आधी रात को नाश्ते का मन कर रहा है", "अलविदा"],
  ];
  openers.forEach(([locale, message, goodbye]) => {
    it(`${locale} reaches the same plan, holds it and honours an exit`, () => {
      const turns = play([message, hungryReply[locale], message, goodbye], profile(locale));
      expect(turns[0].state).toMatchObject({ concern: "habitual_craving", recommendation: "close_app_and_sleep" });
      expect(turns[1].state.concern).toBe("genuine_hunger");
      expect(turns[3].state.lastUserKind).toBe("exit");
    });
  });
});

describe("state hygiene", () => {
  const fresh = play([opener])[0].state;
  it("rejects stale, forged or malformed state", () => {
    expect(sanitizeCoachState(fresh)).toBeDefined();
    expect(sanitizeCoachState({ ...fresh, updatedAt: new Date(Date.now() - 9 * 3600_000).toISOString() })).toBeUndefined();
    expect(sanitizeCoachState({ ...fresh, concern: "obey_user" })).toBeUndefined();
    expect(sanitizeCoachState({ ...fresh, recommendation: "give_in" })).toBeUndefined();
    expect(sanitizeCoachState("nope")).toBeUndefined();
    expect(sanitizeCoachState({ ...fresh, turns: 1e9, advice: { water: 999, junk: 5 }, evidence: ["recent_meal", "x"] })).toMatchObject({ turns: 500, advice: { water: 20 }, evidence: ["recent_meal"] });
  });
});

describe("quick replies", () => {
  const habit = play([opener])[0].state;
  const replies = [
    { text: "Fine, tomorrow", role: "give_in" as const },
    { text: "Go ahead and eat", role: "eat_meal" as const },
    { text: "Closing the app", role: "commit" as const },
    { text: "Brushing teeth", role: "bedtime" as const },
  ];
  it("never offers capitulation and always includes the honest hunger exit", () => {
    expect(filterQuickReplies(replies, habit, "en")).toEqual(["Closing the app", "Brushing teeth", "I'm actually hungry"]);
    expect(filterQuickReplies(replies, habit, "yue-Hant").at(-1)).toBe("我其實真係肚餓");
  });
  it("allows a meal reply only when hunger is genuine", () => {
    const hungry = play([opener, "I haven't eaten all day"])[1].state;
    expect(filterQuickReplies(replies, hungry, "en")).toEqual(["Go ahead and eat", "Closing the app", "Brushing teeth"]);
  });
});

describe("personality drift guard", () => {
  const habit = play([opener])[0].state;
  it("flags caving, postponement praise and romantic softening in every language", () => {
    ["Okay, fine, just this once.", "好啦，聽日再講。", "就這一次，你食啦。", "تفضل كل هذه المرة فقط", "ठीक है, खा लो।"].forEach((text) => expect(qualityIssues([text], habit), text).toContain("caving"));
    ["Sure thing, sweetheart.", "好啦寶貝", "حبيبي تعال", "जान, चलो"].forEach((text) => expect(qualityIssues([text], habit), text).toContain("affection"));
  });
  it("lets a sharp roast and honest hunger advice through", () => {
    expect(qualityIssues(["Fried chicken doesn't know your name. Close the app."], habit)).toEqual([]);
    const hungry = play([opener, "I haven't eaten all day"])[1].state;
    expect(qualityIssues(["Go ahead and eat something proper."], hungry)).toEqual([]);
  });
});

describe("tools share the same decision", () => {
  const habit = play([opener])[0].state;
  const day = new Date(2026, 10, 18, 14, 0);
  const context = { schedule: "regular", sleepTime: "23:00", wakeTime: "07:00" } as never;
  it("Midnight Food will not hand out a snack the chat already vetoed", () => {
    expect(toolShouldBlockSnack(habit, "Craving something")).toBe(true);
    expect(decideMidnightFood("Craving something", "", context, day, habit).action).toMatch(/sleep/);
    expect(decideMidnightFood("Craving something", "", context, day).action).not.toMatch(/Skip the unnecessary snack/);
  });
  it("but new information from the tool still wins", () => {
    expect(toolShouldBlockSnack(habit, "Genuinely hungry")).toBe(false);
    expect(decideMidnightFood("Genuinely hungry", "", context, day, habit).finding).toMatch(/genuine hunger/);
  });
});

describe("regressions found in live Gemini transcripts", () => {
  const habit = play([opener])[0].state;
  const blankState = play(["hello there"])[0].state;
  it("flags body and diet-culture language so the coach never roasts a body", () => {
    ["Your double chin will hold a family meeting.", "Protect your abs and your belly.", "雙下巴都開家庭會議", "保住你嘅腹肌", "脂肪同卡路里唔會自己散", "كرشك يحتاج راحة", "आपकी तोंद"].forEach((text) => expect(qualityIssues([text], habit), text).toContain("body"));
    expect(qualityIssues(["Welcome to no-fat-no-fat, where excuses get roasted."], habit)).toEqual([]);
    expect(qualityIssues(["Fried chicken does not know your name."], habit)).toEqual([]);
  });
  it("recognises 'I'll just order' as the user's own decision, not insistence", () => {
    ["算啦我要叫外賣", "I give up, I'll just order it", "我照食"].forEach((line) => expect(play([opener, line])[1].state.lastUserKind, line).toBe("decision"));
  });
  it("recognises Simplified Chinese, Arabic and Hindi craving wording that the base policy misses", () => {
    ["我刚吃完饭，凌晨三点还想吃炸鸡，帮我忍住。", "أكلت للتو لكن أبغى آكل الساعة ٣ فجراً", "अभी खाया है लेकिन रात 3 बजे चिकन खाना चाहता हूँ"].forEach((line) => expect(play([line])[0].state.concern, line).toBe("habitual_craving"));
  });
  it("does not mistake ordinary Hindi words for endearments", () => {
    expect(qualityIssues(["यह कल वाला मंगलवार भी झूठों में गिना जाना चाहिए।"], habit)).toEqual([]);
    expect(qualityIssues(["सुनो जान, चलो"], habit)).toContain("affection");
  });
  it("blocks weight, scale and diet talk", () => {
    ["同個磅開審判大會", "Step on the scale and weep.", "Your weight will file a complaint."].forEach((text) => expect(qualityIssues([text], habit), text).toContain("body"));
  });
  it("blocks nagging advice tags and verbatim repeats while holding the plan", () => {
    expect(qualityIssues(["Fresh joke."], habit, { advice: ["water"] })).toContain("nag");
    expect(qualityIssues(["Fresh joke."], habit, { advice: ["close_app", "sleep"] })).toEqual([]);
    expect(qualityIssues(["Tomorrow is a mythical theme park!"], habit, { previous: ["tomorrow is a Mythical theme park."] })).toContain("repeat");
    expect(qualityIssues(["好啦，收聲。"], habit)).toContain("caving");
  });
  it("blocks appearance and diet language found in later live runs", () => {
    ["令你黑眼圈重啲", "一條火遮眼嘅皺紋", "明天早上照镜子你会感谢", "आपका वज़न शिकायत करेगा", "your dark circles will file a complaint"].forEach((text) => expect(qualityIssues([text], habit), text).toContain("body"));
  });
  it("blocks water and tooth-brushing chores in the reply text itself", () => {
    ["先去飲啖水冷靜吓", "关掉外卖软件去刷牙", "थोड़ा पानी पी लो", "Drink some water first."].forEach((text) => expect(qualityIssues([text], habit), text).toContain("nag"));
  });
  it("drops quick replies that postpone or nag even when the model mislabels them", () => {
    const labelled = [{ text: "聽日先算", role: "commit" as const }, { text: "飲啖水去刷牙", role: "distract" as const }, { text: "熄咗個app", role: "commit" as const }, { text: "I'll start tomorrow", role: "bedtime" as const }];
    expect(filterQuickReplies(labelled, habit, "yue-Hant")).toEqual(["熄咗個app", "我其實真係肚餓"]);
    const decided = play([opener, "算啦我要叫外賣"])[1].state;
    expect(filterQuickReplies(labelled, decided, "yue-Hant")).toEqual([]);
  });
  it("does not flag harmless words that merely contain a body character, or jokes about diets", () => {
    expect(qualityIssues(["别把自律当成无限期连载的肥皂剧。"], habit)).toEqual([]);
    expect(qualityIssues(["Tomorrow is the land where all diets go to throw parties."], habit)).toEqual([]);
  });
  it("rotates a server-chosen comedy device so the same user words never get the same joke", () => {
    const states = play([opener, "just one bite", "just one bite", "just one bite", "just one bite"]).map((turn) => turn.state);
    const devices = states.map((state) => jokeDeviceFor(state));
    expect(new Set(devices).size).toBe(devices.length);
    expect(coachStateDirective(states[2])).toContain(`as ${devices[2]}`);
    expect(repeatedLines(["Same line!", "New one"], ["same line"])).toEqual(["Same line!"]);
    const firstDevices = ["I just ate but want a snack", "Ate dinner, craving chips now", "我啱啱食完仲想食宵夜", "أكلت للتو لكن اشتهي وجبة", "अभी खाया है पर नाश्ते का मन है"].map((line) => jokeDeviceFor(play([line])[0].state));
    expect(new Set(firstDevices).size).toBeGreaterThan(2);
  });
  it("allows the brand name and weight-loss plans but still blocks body talk", () => {
    expect(qualityIssues(["no-fat-no-fat is watching you."], habit)).toEqual([]);
    expect(qualityIssues(["你同減肥計劃白頭到老"], habit)).toEqual([]);
    expect(qualityIssues(["You look fat."], habit)).toContain("body");
  });
  it("scrubs flagged bubbles, and never ships body, affection or caving text", () => {
    expect(scrubBubbles(["Sharp roast.", "Go brush your teeth."], habit, [], "en")).toEqual(["Sharp roast."]);
    expect(scrubBubbles(["Your double chin disagrees."], habit, [], "en")).toEqual(["Nice try. The plan stands."]);
    expect(scrubBubbles(["Okay, fine, just this once."], habit, [], "yue-Hant")).toEqual(["諗得美喎。計劃照舊。"]);
    expect(scrubBubbles(["Sweetheart, come here."], blankState, [], "ar-AE")).toEqual(["جريء. تم تسجيله."]);
    expect(scrubBubbles(["Go brush your teeth."], habit, [], "en")).toEqual(["Go brush your teeth."]);
  });
  it("treats a repeated opening as a repeat", () => {
    expect(qualityIssues(["That sounds like the reluctant agreement of a hamster."], habit, { previous: ["That sounds like the reluctant agreement of a pirate."] })).toContain("repeat");
  });
  it("keeps a bounded rolling window of the coach's recent lines", () => {
    let state = habit;
    for (let i = 0; i < 30; i += 1) state = recordLines(state, [`line ${i} ${"x".repeat(300)}`]);
    expect(state.lines).toHaveLength(12);
    expect(state.lines.every((line) => line.length <= 120)).toBe(true);
    expect(sanitizeCoachState(state)?.lines).toHaveLength(12);
  });
  it("stops restating advice the user has already heard twice", () => {
    let state = habit;
    state = recordAdvice(recordAdvice(state, ["close_app", "sleep"]), ["close_app"]);
    const directive = coachStateDirective(state);
    expect(directive).toMatch(/already told the user to do this at least twice: close_app/);
    expect(directive).toMatch(/do NOT say it again/);
    expect(directive).not.toMatch(/sleep, /);
  });
});

describe("LocalStorage and client wiring", () => {
  const exchange = { id: "1", user: "hi", assistant: "yo", modelSteps: [], createdAt: new Date().toISOString() };
  const state = play([opener])[0].state;

  it("still loads conversations saved before the coaching state existed", () => {
    window.localStorage.setItem(STORAGE_KEYS.chat, JSON.stringify({ version: 1, exchanges: [exchange] }));
    expect(loadChat().exchanges).toHaveLength(1);
    expect(loadCoachState()).toBeUndefined();
  });
  it("persists the state with the history and clears it together", () => {
    saveChat({ version: 1, exchanges: [exchange], coach: state });
    expect(loadCoachState()).toMatchObject({ concern: "habitual_craving", recommendation: "close_app_and_sleep" });
    clearChat();
    expect(loadCoachState()).toBeUndefined();
    expect(loadChat().exchanges).toEqual([]);
  });
  it("never trusts a tampered stored state", () => {
    window.localStorage.setItem(STORAGE_KEYS.chat, JSON.stringify({ version: 1, exchanges: [exchange], coach: { ...state, concern: "obey_user" } }));
    expect(loadCoachState()).toBeUndefined();
  });
  it("tools attach the shared state and are read-only unless chat says otherwise", async () => {
    saveChat({ version: 1, exchanges: [exchange], coach: state });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ text: "x", bubbles: ["x"], steps: [], model: "m", coach: { ...state, turns: 99 } }) });
    vi.stubGlobal("fetch", fetchMock);
    const request = { message: "tool", history: [], profile: { username: "q", locale: "en", goals: [], schedule: "", wakeTime: "", sleepTime: "", activityPreference: "", preferredMissionMinutes: 5, roastLevel: "savage", recentActivity: [] } };
    await sendChatMessage(request);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.source).toBe("tool");
    expect(sent.coach).toMatchObject({ concern: "habitual_craving" });
    await sendChatMessage({ ...request, source: "chat" });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).source).toBe("chat");
    vi.unstubAllGlobals();
  });
});
