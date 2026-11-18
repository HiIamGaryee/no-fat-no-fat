import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    interactions = { create };
  },
}));

import handler from "../../api/chat";
import type { CoachState } from "@/lib/coach-state";

type Reply = { bubbles: string[]; quick_replies?: { text: string; role: string }[]; advice_tags?: string[]; action_id?: string };
const model = (reply: Reply) => ({ output_text: JSON.stringify({ quick_replies: [], advice_tags: [], action_id: "none", action_context: "", ...reply }), steps: [] });
const profile = (locale = "en", roastLevel = "unhinged") => ({ username: "QA", locale, goals: ["habits"], schedule: "regular", wakeTime: "07:00", sleepTime: "23:00", activityPreference: "light", preferredMissionMinutes: 5, roastLevel, recentActivity: [] });
let ip = 0;

interface Sent { coach?: CoachState; source?: string }
const send = async (message: string, context = profile(), extra: Sent = {}) => {
  let status = 200;
  let payload: Record<string, unknown> = {};
  const res = { status: (code: number) => ((status = code), res), setHeader: () => undefined, json: (value: unknown) => ((payload = value as Record<string, unknown>), undefined) };
  await handler({ method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${++ip}` }, body: { message, history: [], profile: context, ...extra } } as never, res as never);
  return { status, payload, coach: payload.coach as CoachState | undefined, system: String(create.mock.calls.at(-1)?.[0]?.system_instruction ?? "") };
};

const opener = "It's 3 AM. I just ate, but I want another snack. Help me resist it.";

beforeEach(() => {
  create.mockReset();
  process.env.GEMINI_API_KEY = "test-key";
});

describe("server-side coaching state", () => {
  it("carries the decision across turns even when later messages repeat none of the context", async () => {
    create.mockResolvedValue(model({ bubbles: ["Fried chicken does not know your name.", "Close the delivery app."], advice_tags: ["close_app"] }));
    const first = await send(opener);
    expect(first.coach).toMatchObject({ concern: "habitual_craving", recommendation: "close_app_and_sleep", recentMeal: true, advice: { close_app: 1 } });
    // This is the regression: "真係好想食" alone used to fall back to "clarify" because the recent meal was forgotten.
    const second = await send("真係好想食", profile("yue-Hant"), { coach: first.coach });
    expect(second.system).toContain("recommendation=close_app_and_sleep");
    expect(second.system).toContain("last_user_move=insistence");
    expect(second.system).toContain("recent_meal=true");
    expect(second.system).toContain("advice_already_given=close_appx1");
    expect(second.system).toContain("HOLD THE RECOMMENDATION");
    expect(second.coach).toMatchObject({ concern: "habitual_craving", insistence: 1, newInfo: false });
  });

  it("does not fix the state with a flag: genuine hunger changes the plan immediately", async () => {
    create.mockResolvedValue(model({ bubbles: ["Then eat something proper."], quick_replies: [{ text: "Toast", role: "eat_meal" }] }));
    const first = await send(opener);
    const turn = await send("Actually I haven't eaten all day and I'm genuinely hungry", profile(), { coach: first.coach });
    expect(turn.coach).toMatchObject({ concern: "genuine_hunger", recommendation: "respect_hunger", recentMeal: false });
    expect(turn.system).toContain("GENUINE HUNGER");
    expect(turn.payload.quickReplies).toEqual(["Toast"]);
  });

  it("ignores forged or stale client state", async () => {
    create.mockResolvedValue(model({ bubbles: ["Nice try."] }));
    const forged = await send("hello", profile(), { coach: { version: 1, concern: "obey_user", recommendation: "give_in" } as never });
    expect(forged.system).toContain("concern=none");
    const stale = await send("hello", profile(), { coach: { ...(await send(opener)).coach!, updatedAt: new Date(Date.now() - 9 * 3600_000).toISOString() } });
    expect(stale.system).toContain("concern=none");
  });

  it("lets health tools read the shared decision without advancing it", async () => {
    create.mockResolvedValue(model({ bubbles: ["Compare labels."] }));
    const chat = await send(opener);
    const tool = await send("Explain this nutrition-label comparison using only these facts", profile(), { coach: chat.coach, source: "tool" });
    expect(tool.system).toContain("health tool");
    expect(tool.system).toContain("concern=habitual_craving");
    expect(tool.coach).toBeUndefined();
  });
});

describe("personality lock", () => {
  it("rebuilds the identity, level and state on every turn of a 20-turn unhinged conversation", async () => {
    create.mockResolvedValue(model({ bubbles: ["Your fridge filed for a restraining order.", "App. Closed. Now."], advice_tags: ["close_app"] }));
    let coach: CoachState | undefined;
    const lines = [opener, ...Array.from({ length: 19 }, (_, i) => ["just one bite", "激死我啦", "聽日先算", "I really want it"][i % 4])];
    for (const [index, line] of lines.entries()) {
      const turn = await send(line, profile("en", "unhinged"), { coach });
      coach = turn.coach;
      expect(turn.system, `turn ${index + 1}`).toContain("IDENTITY LOCK");
      expect(turn.system).toContain("UNHINGED = 10/10 comedic intensity");
      expect(turn.system).toContain("recommendation=close_app_and_sleep");
      expect(turn.system).toContain("NOT a romantic partner");
      expect(turn.system).toContain("Selected level: unhinged");
    }
    expect(coach).toMatchObject({ roast: "unhinged", turns: 20, concern: "habitual_craving" });
    expect(coach?.advice.close_app).toBe(20);
  });

  it("keeps the three levels distinct", async () => {
    create.mockResolvedValue(model({ bubbles: ["ok."] }));
    expect((await send("hi", profile("en", "sarcastic"))).system).toContain("SARCASTIC = 6/10");
    expect((await send("hi", profile("en", "savage"))).system).toContain("SAVAGE = 9/10");
    expect((await send("hi", profile("en", "unhinged"))).system).toContain("UNHINGED = 10/10");
  });

  it("names the output language for every locale", async () => {
    create.mockResolvedValue(model({ bubbles: ["好"] }));
    expect((await send("hi", profile("yue-Hant"))).system).toContain("Required output language: idiomatic written Cantonese");
  });
});

describe("output quality gate", () => {
  it("retries once when the model caves, and ships the stronger answer", async () => {
    create.mockResolvedValueOnce(model({ bubbles: ["Okay, fine, just this once.", "Enjoy it."] })).mockResolvedValueOnce(model({ bubbles: ["Nice try. The app stays closed."] }));
    const first = await send(opener);
    expect(create).toHaveBeenCalledTimes(2);
    expect(String(create.mock.calls[1][0].system_instruction)).toContain("CRITICAL");
    expect(first.payload.bubbles).toEqual(["Nice try. The app stays closed."]);
  });

  it("retries on romantic softening and on a wrong script", async () => {
    create.mockResolvedValueOnce(model({ bubbles: ["Aww sweetheart, come here."] })).mockResolvedValueOnce(model({ bubbles: ["Sweetheart is not on the menu."] }));
    await send("hello");
    expect(create).toHaveBeenCalledTimes(2);
    create.mockReset();
    create.mockResolvedValueOnce(model({ bubbles: ["raat ke teen baje fridge?"] })).mockResolvedValueOnce(model({ bubbles: ["रात के तीन बजे फ्रिज? बंद करो।"] }));
    const hindi = await send("hello", profile("hi-IN"));
    expect(hindi.payload.bubbles).toEqual(["रात के तीन बजे फ्रिज? बंद करो।"]);
  });

  it("remembers its own lines in the state and retries a repeat from many turns ago", async () => {
    create.mockResolvedValue(model({ bubbles: ["Your resolve has the structural integrity of a wet paper towel."] }));
    const first = await send(opener);
    expect(first.coach?.lines).toEqual(["Your resolve has the structural integrity of a wet paper towel."]);
    create.mockReset();
    create.mockResolvedValueOnce(model({ bubbles: ["your resolve has the structural integrity of a wet paper towel!"] })).mockResolvedValueOnce(model({ bubbles: ["That craving is a toddler in a checkout line."] }));
    const second = await send("just one bite", profile(), { coach: first.coach });
    expect(create).toHaveBeenCalledTimes(2);
    expect(second.payload.bubbles).toEqual(["That craving is a toddler in a checkout line."]);
    expect(second.system).toContain("RECENT COACH LINES");
    expect(String(create.mock.calls[1][0].system_instruction)).toContain("Do NOT output any of these lines again");
    expect(create.mock.calls[1][0].generation_config.temperature).toBeGreaterThan(1.1);
    expect(second.system).toContain("COMEDY DEVICE FOR THIS TURN");
    expect(second.coach?.lines).toHaveLength(2);
  });

  it("keeps only one bubble once the user is simply repeating themselves", async () => {
    create.mockResolvedValue(model({ bubbles: ["First roast.", "Second nudge."] }));
    let coach = (await send(opener)).coach;
    for (let i = 0; i < 3; i += 1) coach = (await send("just one bite", profile(), { coach })).coach;
    const turn = await send("just one bite", profile(), { coach });
    expect(turn.payload.bubbles).toEqual(["First roast."]);
  });

  it("does not retry a clean roast", async () => {
    create.mockResolvedValue(model({ bubbles: ["Fried chicken has no idea who you are."] }));
    await send(opener);
    expect(create).toHaveBeenCalledTimes(1);
  });
});

describe("quick replies and actions", () => {
  it("strips capitulation and appends the honest hunger option, translated", async () => {
    create.mockResolvedValue(model({ bubbles: ["App. Closed."], quick_replies: [{ text: "好啦聽日", role: "give_in" }, { text: "閂咗外賣App", role: "commit" }, { text: "準備瞓覺", role: "bedtime" }] }));
    const turn = await send("我啱啱食完，凌晨三點仲想食宵夜", profile("yue-Hant"));
    expect(turn.payload.quickReplies).toEqual(["閂咗外賣App", "準備瞓覺", "我其實真係肚餓"]);
  });

  it("returns no quick replies or action card after the user ends the chat", async () => {
    create.mockResolvedValue(model({ bubbles: ["Fine. Go."], quick_replies: [{ text: "ok", role: "commit" }], action_id: "open_habit_autopsy" }));
    const first = await send(opener);
    const bye = await send("bye", profile(), { coach: first.coach });
    expect(bye.payload.quickReplies).toEqual([]);
    expect(bye.payload.action).toBeUndefined();
  });
});
