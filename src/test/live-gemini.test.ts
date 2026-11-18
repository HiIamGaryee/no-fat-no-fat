import { describe, expect, it } from "vitest";
import handler from "../../api/chat";

describe("live Gemini smoke", () => {
  it.skipIf(process.env.RUN_LIVE_GEMINI !== "1")(
    "applies craving policy in every locale and roast level",
    async () => {
      const locales = ["en", "zh-CN", "yue-Hant", "ar-AE", "hi-IN"] as const;
      const roastLevels = ["sarcastic", "savage", "unhinged"] as const;
      for (const locale of locales)
        for (const roastLevel of roastLevels) {
          let statusCode = 200;
          let payload: unknown;
          const response = {
            status(code: number) {
              statusCode = code;
              return response;
            },
            setHeader() {
              return;
            },
            json(value: unknown) {
              payload = value;
            },
          };
          await handler(
            {
              method: "POST",
              headers: {
                host: "local.test",
                origin: "https://local.test",
                "content-type": "application/json",
                "x-forwarded-for": `live-${locale}-${roastLevel}`,
              },
              body: {
                message:
                  "I just ate dinner and want another snack before sleep.",
                history: [],
                profile: {
                  username: "QA",
                  locale,
                  goals: ["habits"],
                  schedule: "daytime",
                  wakeTime: "07:00",
                  sleepTime: "23:00",
                  activityPreference: "light",
                  preferredMissionMinutes: 2,
                  roastLevel,
                  recentActivity: [],
                },
              },
            },
            response,
          );
          expect(statusCode).toBe(200);
          expect(payload).toMatchObject({
            bubbles: expect.arrayContaining([expect.any(String)]),
          });
          expect(
            (payload as { bubbles: string[] }).bubbles.length,
          ).toBeLessThanOrEqual(2);
        }
    },
    180000,
  );
  it.skipIf(process.env.RUN_LIVE_GEMINI !== "1")(
    "returns a real structured response in every supported locale",
    async () => {
      const cases = [
        {
          locale: "en",
          message:
            "Reply in one short English sentence with a gentle hydration reminder.",
          script: /[A-Za-z]/,
        },
        {
          locale: "zh-CN",
          message: "请用简体中文写一句温和的饮水提醒。",
          script: /[\u4e00-\u9fff]/,
        },
        {
          locale: "yue-Hant",
          message: "請用自然書面廣東話寫一句溫和飲水提示。",
          script: /[\u4e00-\u9fff]/,
        },
        {
          locale: "ar-AE",
          message: "اكتب تذكيراً لطيفاً وقصيراً لشرب الماء بالعربية.",
          script: /[\u0600-\u06ff]/,
        },
        {
          locale: "hi-IN",
          message: "हिंदी में पानी पीने की एक छोटी और विनम्र याद दिलाएँ।",
          script: /[\u0900-\u097f]/,
        },
      ] as const;
      for (const item of cases) {
        let statusCode = 200;
        let payload: unknown;
        const response = {
          status(code: number) {
            statusCode = code;
            return response;
          },
          setHeader() {
            return;
          },
          json(value: unknown) {
            payload = value;
          },
        };
        await handler(
          {
            method: "POST",
            headers: {
              host: "local.test",
              origin: "https://local.test",
              "content-type": "application/json",
            },
            body: {
              message: item.message,
              history: [],
              profile: {
                username: "QA",
                locale: item.locale,
                goals: ["habits"],
                schedule: "daytime",
                wakeTime: "07:00",
                sleepTime: "23:00",
                activityPreference: "light",
                preferredMissionMinutes: 2,
                roastLevel: "sarcastic",
                recentActivity: [],
              },
            },
          },
          response,
        );
        expect(statusCode).toBe(200);
        expect(payload).toMatchObject({
          text: expect.stringMatching(item.script),
          steps: expect.any(Array),
          model: expect.any(String),
        });
      }
    },
    120000,
  );
});
