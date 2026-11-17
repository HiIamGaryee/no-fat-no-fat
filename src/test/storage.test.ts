import { describe, expect, it } from "vitest";
import { createProfile, deleteAllAppData, exportAppData, importAppData, loadChat, loadProfile, loadSettings, saveChat, saveProfile, STORAGE_KEYS } from "@/lib/storage";

const completeProfile=()=>({...createProfile(),username:"Gary",age:30,adultConfirmed:true,goals:["habits"],schedule:"daytime" as const,activityPreference:"light" as const,onboardingCompletedAt:"2026-11-16T00:00:00.000Z"});

describe("browser-local persistence", () => {
  it("survives malformed JSON with safe defaults", () => {
    window.localStorage.setItem(STORAGE_KEYS.profile,"{oops");
    window.localStorage.setItem(STORAGE_KEYS.chat,"null");
    expect(loadProfile()).toBeNull();
    expect(loadChat().exchanges).toEqual([]);
  });

  it("caps conversation history", () => {
    const exchanges=Array.from({length:25},(_,index)=>({id:`e${index}`,user:"u",assistant:"a",modelSteps:[],createdAt:new Date(index).toISOString()}));
    saveChat({version:1,exchanges});
    expect(loadChat().exchanges).toHaveLength(20);
  });

  it("migrates settings that predate the memory control", () => {
    window.localStorage.setItem(STORAGE_KEYS.settings,JSON.stringify({version:1,reducedMotion:false,highReadability:true}));
    expect(loadSettings().memoryEnabled).toBe(true);
  });

  it("rejects duplicate canonical reward sources on import", () => {
    saveProfile(completeProfile());
    const backup=exportAppData();
    const transaction={id:"x",sourceId:"mission:m1",amount:20,reason:"test",createdAt:new Date().toISOString()};
    const tampered={...backup,progress:{version:1,transactions:[transaction,{...transaction,id:"y"}],achievements:[]}};
    expect(importAppData(tampered)).toBe(false);
    expect(loadProfile()?.username).toBe("Gary");
  });

  it("deletes only application-owned keys", () => {
    window.localStorage.setItem("unrelated:key","keep");
    saveProfile(completeProfile());
    expect(deleteAllAppData()).toBe(true);
    expect(window.localStorage.getItem("unrelated:key")).toBe("keep");
    expect(loadProfile()).toBeNull();
  });
});
