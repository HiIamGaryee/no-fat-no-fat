import { appendFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import handler from "../../api/chat";
import { qualityIssues, type CoachState } from "@/lib/coach-state";

const live = process.env.RUN_LIVE_GEMINI === "1";
const transcript = process.env.RUN_LIVE_LOG;
let ip = 0;

const profile = (locale: string, roastLevel: string) => ({ username: "Tester", locale, goals: ["habits"], schedule: "regular", wakeTime: "07:00", sleepTime: "23:00", activityPreference: "light", preferredMissionMinutes: 5, roastLevel, recentActivity: [] });

interface Turn { user: string; bubbles: string[]; quickReplies: string[]; ok: boolean; ms: number }

/** Mirrors ChatPage: persists coaching state and keeps only the user's real messages as history. */
const converse = async (locale: string, roastLevel: string, lines: string[]) => {
  let coach: CoachState | undefined;
  const history: unknown[] = [];
  const turns: Turn[] = [];
  for (const user of lines) {
    let result: { status: number; body: Record<string, unknown> } = { status: 0, body: {} };
    const started = Date.now();
    for (let attempt = 0; attempt < 3 && result.status !== 200; attempt += 1) {
      let status = 200;
      let body: Record<string, unknown> = {};
      const res = { status: (code: number) => ((status = code), res), setHeader: () => undefined, json: (value: unknown) => ((body = value as Record<string, unknown>), undefined) };
      await handler({ method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `20.0.${Math.floor(++ip / 250)}.${ip % 250}` }, body: { message: user, history: history.slice(-16), profile: profile(locale, roastLevel), source: "chat", coach } } as never, res as never);
      result = { status, body };
    }
    const bubbles = (result.body.bubbles as string[] | undefined) ?? [];
    const quickReplies = (result.body.quickReplies as string[] | undefined) ?? [];
    turns.push({ user, bubbles, quickReplies, ok: result.status === 200, ms: Date.now() - started });
    if (transcript) appendFileSync(transcript, `[${locale}/${roastLevel}] USER: ${user}\n   AI: ${result.status === 200 ? bubbles.join(" | ") : `(failed ${result.status})`}\n   QR: ${quickReplies.join(" / ")}\n`);
    if (result.status === 200) {
      coach = result.body.coach as CoachState | undefined;
      history.push({ type: "user_input", content: [{ type: "text", text: user }] });
    }
  }
  return { turns, coach };
};

const longest = (bubble: string) => (/[㐀-鿿]/.test(bubble) ? bubble.length : bubble.split(/\s+/).length);

const assertPersonality = (turns: Turn[], coach: CoachState | undefined, maxUnits: number) => {
  const answered = turns.filter((turn) => turn.ok);
  expect(answered.length, "most turns must succeed").toBeGreaterThanOrEqual(Math.ceil(turns.length * 0.8));
  answered.forEach((turn) => {
    expect(turn.bubbles.length).toBeLessThanOrEqual(3);
    turn.bubbles.forEach((bubble) => expect(longest(bubble), bubble).toBeLessThanOrEqual(maxUnits));
    expect(turn.quickReplies.length).toBeLessThanOrEqual(3);
  });
  if (coach?.concern === "habitual_craving") answered.forEach((turn) => expect(qualityIssues(turn.bubbles, coach), turn.bubbles.join(" ")).toEqual([]));
  const openers = answered.map((turn) => turn.bubbles[0]?.slice(0, 10));
  expect(new Set(openers).size, "replies must not open identically").toBeGreaterThanOrEqual(Math.floor(answered.length * 0.75));
  expect(new Set(answered.map((turn) => turn.bubbles.join("|"))).size, "no verbatim repeats").toBe(answered.length);
};

const cantonese = ["我啱啱食完晚飯，凌晨三點，但係想食炸雞。幫我忍住。", "真係好想食。", "激死我啦。", "咁我聽日先開始啦。", "俾我食一啖啦。", "你咁煩嘅。", "我愛炸雞。", "好想食呀", "就一次咋", "算啦我要叫外賣"];

describe.skipIf(!live)("live multi-turn personality (real Gemini)", () => {
  it("15-turn Unhinged Cantonese sounds like texting, not scripted theatre", async () => {
    const lines = [
      "今日唔想運動。",
      "聽日先算啦。",
      "我啱啱食完又想叫外賣。",
      "其實只係口痕。",
      "但真係好想食喎。",
      "算啦，唔叫喇。",
      "今日返工好攰。",
      "唔想聽大道理。",
      "咁我而家做咩好？",
      "其實我上餐係十個鐘前。",
      "我有少少頭暈。",
      "而家好返啲。",
      "講返運動，五分鐘可以做咩？",
      "哈哈，你把口幾衰。",
      "得啦，我試吓。",
    ];
    const { turns } = await converse("yue-Hant", "unhinged", lines);
    const answered = turns.filter((turn) => turn.ok);
    expect(answered.length).toBeGreaterThanOrEqual(12);
    expect(answered.filter((turn) => turn.bubbles.length === 1).length).toBeGreaterThanOrEqual(9);
    answered.forEach((turn) => {
      expect(turn.bubbles.length).toBeLessThanOrEqual(2);
      expect(turn.quickReplies.length).toBeLessThanOrEqual(2);
      expect(turn.bubbles.join(""), turn.user).not.toMatch(/合約第|法庭宣佈|深夜食堂|催淚|因此|然而/);
    });
    expect(answered.filter((turn) => /[?？]/.test(turn.bubbles.join(""))).length).toBeLessThan(12);
  }, 300_000);
  it("Test A/B/C: Cantonese craving holds through repeated pushback, postponement and begging", async () => {
    const { turns, coach } = await converse("yue-Hant", "unhinged", cantonese);
    expect(coach).toMatchObject({ concern: "habitual_craving", recommendation: "close_app_and_sleep" });
    assertPersonality(turns, coach, 70);
    turns.filter((turn) => turn.ok).forEach((turn) => expect(turn.bubbles.join("")).toMatch(/[㐀-鿿]/));
  }, 300_000);

  it("Test E: 20 turns in Unhinged mode keep the character", async () => {
    const lines = ["It's 3 AM. I just ate, but I want fried chicken. Help me resist it.", ...Array.from({ length: 19 }, (_, i) => ["just one bite", "you are annoying", "I'll start tomorrow", "come on, please let me", "I really want it", "ugh fine whatever"][i % 6])];
    const { turns, coach } = await converse("en", "unhinged", lines);
    expect(coach?.turns).toBeGreaterThanOrEqual(16);
    assertPersonality(turns, coach, 40);
  }, 600_000);

  it("Test D: genuine hunger reassesses the earlier coaching", async () => {
    const { turns, coach } = await converse("en", "savage", ["It's 3 AM. I just ate but I want another snack.", "I want fried chicken", "Actually I skipped dinner and lunch, I haven't eaten all day and I'm genuinely hungry."]);
    expect(coach).toMatchObject({ concern: "genuine_hunger", recommendation: "respect_hunger" });
    const last = turns.at(-1)!;
    expect(last.ok).toBe(true);
    expect(last.bubbles.join(" ")).not.toMatch(/close the (?:app|fridge)|go to sleep|resist/i);
  }, 200_000);

  it.each(["sarcastic", "savage", "unhinged"] as const)("Levels: %s stays in its lane and never softens", async (level) => {
    const { turns, coach } = await converse("en", level, ["It's 3 AM. I just ate, but I want fried chicken. Help me resist it.", "just one bite", "I'll start tomorrow"]);
    expect(coach).toMatchObject({ concern: "habitual_craving", roast: level });
    assertPersonality(turns, coach, 40);
  }, 200_000);

  it.each([
    ["zh-CN", /[㐀-鿿]/, ["我刚吃完饭，凌晨三点还想吃炸鸡，帮我忍住。", "真的好想吃", "气死我了", "那我明天再开始吧"]],
    ["ar-AE", /[؀-ۿ]/, ["أكلت للتو لكن اشتهي وجبة خفيفة الساعة ٣ فجراً. ساعدني.", "أريدها بشدة", "أنت مزعج", "سأبدأ غداً"]],
    ["hi-IN", /[ऀ-ॿ]/, ["अभी खाया है लेकिन रात 3 बजे नाश्ते का मन कर रहा है। मदद करो।", "बस एक बार", "तुम बहुत परेशान करते हो", "कल से शुरू करूँगा"]],
  ] as const)("Test F: %s keeps the same coaching and the right script", async (locale, script, lines) => {
    const { turns, coach } = await converse(locale, "savage", [...lines]);
    expect(coach).toMatchObject({ concern: "habitual_craving" });
    assertPersonality(turns, coach, 70);
    turns.filter((turn) => turn.ok).forEach((turn) => expect(turn.bubbles.join(" ")).toMatch(script));
  }, 300_000);
});
