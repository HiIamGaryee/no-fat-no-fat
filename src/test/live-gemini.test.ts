import { describe, expect, it } from "vitest";
import handler from "../../api/chat";

describe("live Gemini smoke", () => {
  it.skipIf(process.env.RUN_LIVE_GEMINI !== "1")("returns a real structured response through the proxy handler", async () => {
    let statusCode=200;
    let payload:unknown;
    const response={status(code:number){statusCode=code;return response;},setHeader(){return;},json(value:unknown){payload=value;}};
    await handler({method:"POST",headers:{host:"local.test",origin:"https://local.test","content-type":"application/json"},body:{message:"Reply in one short sentence with a gentle practical hydration reminder.",history:[],profile:{username:"QA",locale:"en",goals:["habits"],schedule:"daytime",wakeTime:"07:00",sleepTime:"23:00",activityPreference:"light",preferredMissionMinutes:2,roastLevel:"sarcastic",recentActivity:[]}}},response);
    expect(statusCode).toBe(200);
    expect(payload).toMatchObject({text:expect.any(String),steps:expect.any(Array),model:expect.any(String)});
  },30000);
});
