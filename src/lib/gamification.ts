import type { AchievementUnlock, Mission, MissionStatus, MissionStore, ProgressStore, XPTransaction } from "@/types/app";

export const levelTable = [
  { level: 1, threshold: 0, label: "Rookie Excuse Criminal" },
  { level: 2, threshold: 100, label: "Suspiciously Active" },
  { level: 3, threshold: 250, label: "Habit Investigator" },
  { level: 4, threshold: 500, label: "Excuse Prosecutor" },
  { level: 5, threshold: 900, label: "Chief of Damage Control" },
] as const;

export const getTotalXP = (transactions: XPTransaction[]) => transactions.reduce((total, item) => total + item.amount, 0);
export const getLevel = (xp: number) => [...levelTable].reverse().find((item) => xp >= item.threshold) ?? levelTable[0];
export const getLevelProgress = (xp: number) => { const current=getLevel(xp); const next=levelTable.find(item=>item.level===current.level+1); return {current,next,percent:next?Math.min(100,((xp-current.threshold)/(next.threshold-current.threshold))*100):100}; };

export const achievementCatalog = [
  { id:"first", title:"FIRST CONFESSION", description:"Complete your first mission.", condition:(missions:Mission[])=>missions.filter(m=>m.status==="completed").length>=1 },
  { id:"five", title:"EXCUSE UNDER ARREST", description:"Complete five missions.", condition:(missions:Mission[])=>missions.filter(m=>m.status==="completed").length>=5 },
  { id:"comeback", title:"THE COMEBACK", description:"Complete a mission after missing at least one day.", condition:(missions:Mission[])=>{const days=[...new Set(missions.filter(m=>m.completedAt).map(m=>m.day))].sort();return days.some((day,index)=>index>0&&(new Date(day).getTime()-new Date(days[index-1]).getTime())>86400000);} },
  { id:"three-days", title:"CONSISTENCY SUSPECT", description:"Complete missions on three different days.", condition:(missions:Mission[])=>new Set(missions.filter(m=>m.completedAt).map(m=>m.day)).size>=3 },
  { id:"movement-ten", title:"NICE TRY, COUCH", description:"Complete ten movement missions.", condition:(missions:Mission[])=>missions.filter(m=>m.status==="completed"&&m.category==="movement").length>=10 },
  { id:"seven-days", title:"STILL SHOWING UP", description:"Record activity on seven different days.", condition:(missions:Mission[])=>new Set(missions.filter(m=>m.completedAt).map(m=>m.day)).size>=7 },
  { id:"case-closed", title:"CASE CLOSED", description:"Complete your first Excuse Court action.", condition:()=>false },
  { id:"comeback-file", title:"THE COMEBACK FILE", description:"Complete a recovery mission.", condition:()=>false },
  { id:"spin-cycle", title:"SPIN CYCLE", description:"Finish three Movement Roulette missions.", condition:()=>false },
  { id:"pattern-detected", title:"PATTERN DETECTED", description:"Complete a Habit Autopsy investigation.", condition:()=>false },
  { id:"receipts", title:"THE RECEIPTS", description:"Review progress after recording multiple activities.", condition:()=>false },
] as const;

export const evaluateAchievements = (missions: Mission[], current: AchievementUnlock[]) => {
  const currentIds=new Set(current.map(item=>item.id));
  return achievementCatalog.filter(item=>!currentIds.has(item.id)&&item.condition(missions)).map(item=>({id:item.id,unlockedAt:new Date().toISOString()}));
};

export const transitionMission = (store: MissionStore, progress: ProgressStore, id: string, status: MissionStatus, completedAt = new Date().toISOString()) => {
  const mission = store.missions.find((item) => item.id === id);
  if (!mission || mission.status === "completed") return { changed:false, store, progress, awardedXP:0, unlocked:[] as AchievementUnlock[] };
  const timestamp = status === "completed" ? completedAt : null;
  const missions = store.missions.map((item) => item.id === id ? { ...item, status, completedAt:timestamp } : item) as Mission[];
  const sourceId = `mission:${id}`;
  let transactions = status === "completed" && !progress.transactions.some((item) => item.sourceId === sourceId)
    ? [...progress.transactions, { id:`xp:${sourceId}`, sourceId, amount:mission.xp, reason:mission.title, createdAt:completedAt }]
    : progress.transactions;
  let awardedXP = transactions === progress.transactions ? 0 : mission.xp;
  const priorDays = [...new Set(missions.filter((item) => item.completedAt && item.id !== id).map((item) => item.day))].sort();
  const lastDay = priorDays.at(-1);
  const comebackId = `comeback:${mission.day}`;
  if (status === "completed" && lastDay && new Date(mission.day).getTime() - new Date(lastDay).getTime() > 86400000 && !transactions.some((item) => item.sourceId === comebackId)) {
    transactions = [...transactions, { id:`xp:${comebackId}`, sourceId:comebackId, amount:15, reason:"Comeback action", createdAt:completedAt }];
    awardedXP += 15;
  }
  const unlocked = evaluateAchievements(missions, progress.achievements);
  return {
    changed:true,
    store:{ ...store, missions },
    progress:{ version:1 as const, transactions, achievements:[...progress.achievements, ...unlocked] },
    awardedXP,
    unlocked,
  };
};
