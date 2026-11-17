import { describe, expect, it } from "vitest";
import { handler } from "../../netlify/functions/chat";

describe("Netlify chat function adapter",()=>{
  it("rejects non-POST requests",async()=>{
    const result=await handler({httpMethod:"GET",headers:{},body:null});
    expect(result.statusCode).toBe(405);
  });

  it("rejects malformed JSON before invoking Gemini",async()=>{
    const result=await handler({httpMethod:"POST",headers:{},body:"{"});
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toMatchObject({error:"Invalid JSON."});
  });
});
