import { describe, expect, it } from "vitest";
import { calculateBMI, getBMICategory } from "@/lib/bmi";
import { getLevel, getTotalXP, transitionMission } from "@/lib/gamification";
import { generateMissions, localDay } from "@/lib/missions";
import { validateStep } from "@/lib/validation";
import { createProfile } from "@/lib/storage";
import type { MissionStore, ProgressStore } from "@/types/app";

describe("wellness business rules", () => {
  it("calculates adult BMI from metric inputs and rejects implausible values", () => {
    expect(calculateBMI(180, 81)).toBe(25);
    expect(getBMICategory(25)).toBe("referenceElevated");
    expect(calculateBMI(0, 81)).toBeNull();
    expect(calculateBMI(180, -1)).toBeNull();
  });

  it("requires a valid adult identity without erasing Unicode names", () => {
    const profile={...createProfile(),username:"嘉欣",age:22,adultConfirmed:true};
    expect(validateStep(1,profile)).toEqual([]);
    expect(validateStep(1,{...profile,age:17})).toContain("adultOnly");
    expect(validateStep(1,{...profile,username:"<b>"})).toContain("usernameUnsafe");
  });

  it("generates deterministic, preference-sized missions", () => {
    const profile={...createProfile(),goals:["active"],preferredMissionMinutes:10 as const};
    const first=generateMissions(profile,"2026-11-16");
    const second=generateMissions(profile,"2026-11-16");
    expect(first).toEqual(second);
    expect(first).toHaveLength(3);
    expect(first[0].minutes).toBe(10);
  });

  it("groups a night shift's after-midnight activity with the prior day", () => {
    expect(localDay(new Date(2026,10,17,2,30),6)).toBe("2026-11-16");
    expect(localDay(new Date(2026,10,17,7,0),6)).toBe("2026-11-17");
  });

  it("awards mission XP exactly once", () => {
    const store:MissionStore={version:1,day:"2026-11-16",missions:[{id:"m1",day:"2026-11-16",category:"movement",title:"MOVE",description:"Move.",minutes:2,xp:20,status:"available",completedAt:null}]};
    const progress:ProgressStore={version:1,transactions:[],achievements:[]};
    const first=transitionMission(store,progress,"m1","completed","2026-11-16T10:00:00.000Z");
    const second=transitionMission(first.store,first.progress,"m1","completed","2026-11-16T10:00:01.000Z");
    expect(first.awardedXP).toBe(20);
    expect(second.changed).toBe(false);
    expect(getTotalXP(second.progress.transactions)).toBe(20);
    expect(first.progress.transactions[0].sourceId).toBe("mission:m1");
  });

  it("uses deterministic level thresholds", () => {
    expect(getLevel(0).level).toBe(1);
    expect(getLevel(100).level).toBe(2);
    expect(getLevel(899).level).toBe(4);
    expect(getLevel(900).level).toBe(5);
  });
});
