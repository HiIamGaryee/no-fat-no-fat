import { locales, type LocalProfile, type OnboardingDraft } from "@/types/profile";
import type { AppSettings, Mission, MissionStore, ProgressStore } from "@/types/app";
import { generateMissions, localDayForProfile } from "@/lib/missions";
import type { ChatExchange, ChatStore } from "@/types/chat";
import { toolActionIds, type ToolEvent, type ToolEventStore } from "@/types/tools";

export const STORAGE_KEYS = { profile: "nfnf:profile:v1", onboarding: "nfnf:onboarding:v1", preferences: "nfnf:preferences:v1", missions:"nfnf:missions:v1", progress:"nfnf:progress:v1", settings:"nfnf:settings:v1", chat:"nfnf:chat:v1", toolEvents:"nfnf:tool-events:v1" } as const;

const safeRead = (key: string): unknown => {
  try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
};

const safeWrite = (key: string, value: unknown) => {
  try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
};

const safeRemove = (key:string) => { try { window.localStorage.removeItem(key); return true; } catch { return false; } };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

export const isValidProfile = (value: unknown): value is LocalProfile => {
  if (!isRecord(value) || value.version !== 1) return false;
  return typeof value.id === "string" && typeof value.username === "string" &&
    (value.age === null || typeof value.age === "number") && typeof value.adultConfirmed === "boolean" && locales.includes(value.locale as LocalProfile["locale"]) &&
    (value.heightCm === null || typeof value.heightCm === "number") && (value.weightKg === null || typeof value.weightKg === "number") &&
    Array.isArray(value.goals) && value.goals.every((goal) => typeof goal === "string") && typeof value.schedule === "string" &&
    typeof value.wakeTime === "string" && typeof value.sleepTime === "string" && typeof value.activityPreference === "string" &&
    [2,5,10,15].includes(value.preferredMissionMinutes as number) && ["sarcastic","savage","unhinged"].includes(value.roastLevel as string) &&
    typeof value.createdAt === "string" && typeof value.updatedAt === "string" &&
    (value.onboardingCompletedAt === null || typeof value.onboardingCompletedAt === "string");
};

export const createProfile = (): LocalProfile => {
  const now = new Date().toISOString();
  return { version: 1, id: globalThis.crypto?.randomUUID?.() ?? `nfnf-${Date.now()}`, username: "", age: null, adultConfirmed: false, locale: "en", heightCm: null, weightKg: null, goals: [], schedule: "", wakeTime: "07:00", sleepTime: "23:00", activityPreference: "", preferredMissionMinutes: 5, roastLevel: "savage", createdAt: now, updatedAt: now, onboardingCompletedAt: null };
};

export const loadProfile = () => { const value = safeRead(STORAGE_KEYS.profile); return isValidProfile(value) ? value : null; };
export const saveProfile = (profile: LocalProfile) => safeWrite(STORAGE_KEYS.profile, profile);
export const loadDraft = (): OnboardingDraft | null => { const value = safeRead(STORAGE_KEYS.onboarding); return isRecord(value) && value.version === 1 && typeof value.step === "number" && isValidProfile(value.profile) ? value as unknown as OnboardingDraft : null; };
export const saveDraft = (draft: OnboardingDraft) => safeWrite(STORAGE_KEYS.onboarding, draft);
export const clearDraft = () => { try { window.localStorage.removeItem(STORAGE_KEYS.onboarding); } catch { return; } };
export const loadLocale = () => { const value = safeRead(STORAGE_KEYS.preferences); return isRecord(value) && locales.includes(value.locale as LocalProfile["locale"]) ? value.locale as LocalProfile["locale"] : loadProfile()?.locale ?? "en"; };
export const saveLocale = (locale: LocalProfile["locale"]) => safeWrite(STORAGE_KEYS.preferences, { version: 1, locale });
export const hasCompletedProfile = () => Boolean(loadProfile()?.onboardingCompletedAt);

const validMission=(value:unknown):value is Mission=>isRecord(value)&&typeof value.id==="string"&&typeof value.day==="string"&&typeof value.category==="string"&&typeof value.title==="string"&&typeof value.description==="string"&&typeof value.minutes==="number"&&typeof value.xp==="number"&&["available","in-progress","completed","skipped"].includes(value.status as string)&&(value.completedAt===null||typeof value.completedAt==="string");
export const loadMissionStore=():MissionStore=>{const value=safeRead(STORAGE_KEYS.missions);return isRecord(value)&&value.version===1&&typeof value.day==="string"&&Array.isArray(value.missions)&&value.missions.every(validMission)?value as unknown as MissionStore:{version:1,day:"",missions:[]};};
export const saveMissionStore=(store:MissionStore)=>safeWrite(STORAGE_KEYS.missions,store);
export const getDailyMissions=(profile:LocalProfile)=>{const store=loadMissionStore();const day=localDayForProfile(profile);if(store.day===day)return store;const existingIds=new Set(store.missions.map(item=>item.id));const generated=generateMissions(profile,day).filter(item=>!existingIds.has(item.id));const next={version:1 as const,day,missions:[...store.missions,...generated]};saveMissionStore(next);return next;};
const validTransaction=(value:unknown)=>isRecord(value)&&typeof value.id==="string"&&typeof value.sourceId==="string"&&typeof value.amount==="number"&&value.amount>=0&&typeof value.reason==="string"&&typeof value.createdAt==="string";
const validAchievement=(value:unknown)=>isRecord(value)&&typeof value.id==="string"&&typeof value.unlockedAt==="string";
export const loadProgress=():ProgressStore=>{const value=safeRead(STORAGE_KEYS.progress);return isRecord(value)&&value.version===1&&Array.isArray(value.transactions)&&value.transactions.every(validTransaction)&&Array.isArray(value.achievements)&&value.achievements.every(validAchievement)?value as unknown as ProgressStore:{version:1,transactions:[],achievements:[]};};
export const saveProgress=(progress:ProgressStore)=>safeWrite(STORAGE_KEYS.progress,progress);
export const loadSettings=():AppSettings=>{const value=safeRead(STORAGE_KEYS.settings);return isRecord(value)&&value.version===1&&typeof value.reducedMotion==="boolean"&&typeof value.highReadability==="boolean"?{version:1,reducedMotion:value.reducedMotion,highReadability:value.highReadability,memoryEnabled:typeof value.memoryEnabled==="boolean"?value.memoryEnabled:true}:{version:1,reducedMotion:false,highReadability:false,memoryEnabled:true};};
export const saveSettings=(settings:AppSettings)=>safeWrite(STORAGE_KEYS.settings,settings);
export const exportAppData=()=>({exportVersion:1,exportedAt:new Date().toISOString(),profile:loadProfile(),preferences:safeRead(STORAGE_KEYS.preferences),missions:loadMissionStore(),progress:loadProgress(),settings:loadSettings(),chat:loadChat(),toolEvents:loadToolEvents()});
const uniqueBy=(items:unknown[],key:(item:unknown)=>unknown)=>new Set(items.map(key)).size===items.length;
export const importAppData=(value:unknown)=>{if(!isRecord(value)||value.exportVersion!==1||!isValidProfile(value.profile))return false;const missions=value.missions;const progress=value.progress;const settings=value.settings;const preferences=value.preferences;const chat=value.chat;const toolEvents=value.toolEvents??{version:1,events:[]};if(!isRecord(missions)||missions.version!==1||!Array.isArray(missions.missions)||!missions.missions.every(validMission)||!uniqueBy(missions.missions,item=>(item as Mission).id)||!isRecord(progress)||progress.version!==1||!Array.isArray(progress.transactions)||!progress.transactions.every(validTransaction)||!uniqueBy(progress.transactions,item=>(item as {sourceId:string}).sourceId)||!Array.isArray(progress.achievements)||!progress.achievements.every(validAchievement)||!uniqueBy(progress.achievements,item=>(item as {id:string}).id)||!isRecord(settings)||settings.version!==1||typeof settings.reducedMotion!=="boolean"||typeof settings.highReadability!=="boolean"||!isRecord(chat)||chat.version!==1||!Array.isArray(chat.exchanges)||!chat.exchanges.every(validExchange)||!uniqueBy(chat.exchanges,item=>(item as ChatExchange).id)||!isRecord(toolEvents)||toolEvents.version!==1||!Array.isArray(toolEvents.events)||!toolEvents.events.every(validToolEvent)||!uniqueBy(toolEvents.events,item=>(item as ToolEvent).id))return false;const locale=isRecord(preferences)&&locales.includes(preferences.locale as LocalProfile["locale"])?preferences.locale:value.profile.locale;const normalizedSettings={version:1,reducedMotion:settings.reducedMotion,highReadability:settings.highReadability,memoryEnabled:typeof settings.memoryEnabled==="boolean"?settings.memoryEnabled:true};const payload=new Map<string,unknown>([[STORAGE_KEYS.profile,value.profile],[STORAGE_KEYS.preferences,{version:1,locale}],[STORAGE_KEYS.missions,missions],[STORAGE_KEYS.progress,progress],[STORAGE_KEYS.settings,normalizedSettings],[STORAGE_KEYS.chat,chat],[STORAGE_KEYS.toolEvents,toolEvents]]);const backup=new Map([...payload.keys()].map(key=>[key,safeRead(key)]));for(const [key,next] of payload){if(safeWrite(key,next))continue;for(const [restoreKey,previous] of backup){if(previous===null)safeRemove(restoreKey);else safeWrite(restoreKey,previous);}return false;}return true;};
export const resetProgress=()=>[STORAGE_KEYS.missions,STORAGE_KEYS.progress,STORAGE_KEYS.toolEvents].map(safeRemove).every(Boolean);
export const deleteAllAppData=()=>Object.values(STORAGE_KEYS).map(safeRemove).every(Boolean);
const validExchange=(value:unknown):value is ChatExchange=>isRecord(value)&&typeof value.id==="string"&&typeof value.user==="string"&&typeof value.assistant==="string"&&(value.bubbles===undefined||(Array.isArray(value.bubbles)&&value.bubbles.every(item=>typeof item==="string")))&&(value.quickReplies===undefined||(Array.isArray(value.quickReplies)&&value.quickReplies.every(item=>typeof item==="string")))&&Array.isArray(value.modelSteps)&&typeof value.createdAt==="string"&&(value.action===undefined||(isRecord(value.action)&&toolActionIds.includes(value.action.id as never)&&(value.action.context===undefined||typeof value.action.context==="string")));
export const loadChat=():ChatStore=>{const value=safeRead(STORAGE_KEYS.chat);return isRecord(value)&&value.version===1&&Array.isArray(value.exchanges)&&value.exchanges.every(validExchange)?value as unknown as ChatStore:{version:1,exchanges:[]};};
export const saveChat=(chat:ChatStore)=>safeWrite(STORAGE_KEYS.chat,{...chat,exchanges:chat.exchanges.slice(-20)});
export const clearChat=()=>{try{window.localStorage.removeItem(STORAGE_KEYS.chat);return true;}catch{return false;}};
const toolEventTypes=["food_decision_recorded","craving_action_completed","excuse_case_created","excuse_action_completed","food_comparison_saved","movement_mission_completed","habit_investigation_completed","recovery_action_created","evidence_reviewed"];
const toolIds=["midnight-food","excuse-court","food-detective","movement-roulette","habit-autopsy","evidence-lab"];
const validToolEvent=(value:unknown):value is ToolEvent=>isRecord(value)&&typeof value.id==="string"&&toolEventTypes.includes(value.type as string)&&toolIds.includes(value.tool as string)&&typeof value.timestamp==="string"&&typeof value.referenceId==="string"&&isRecord(value.metadata)&&Object.values(value.metadata).every(item=>item===null||["string","number","boolean"].includes(typeof item));
export const loadToolEvents=():ToolEventStore=>{const value=safeRead(STORAGE_KEYS.toolEvents);return isRecord(value)&&value.version===1&&Array.isArray(value.events)&&value.events.every(validToolEvent)?value as unknown as ToolEventStore:{version:1,events:[]};};
export const saveToolEvent=(event:ToolEvent)=>{const store=loadToolEvents();if(store.events.some(item=>item.id===event.id))return true;return safeWrite(STORAGE_KEYS.toolEvents,{version:1,events:[...store.events,event]});};
export const deleteToolEvent=(id:string)=>{const store=loadToolEvents();return safeWrite(STORAGE_KEYS.toolEvents,{version:1,events:store.events.filter(item=>item.id!==id)});};
