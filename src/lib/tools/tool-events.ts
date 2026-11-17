import { loadProgress, loadToolEvents, saveProgress, saveToolEvent } from "@/lib/storage";
import type { ToolEvent, ToolEventType, ToolId } from "@/types/tools";

export const unlockToolAchievement=(id:string)=>{const progress=loadProgress();if(progress.achievements.some(item=>item.id===id))return false;saveProgress({...progress,achievements:[...progress.achievements,{id,unlockedAt:new Date().toISOString()}]});return true;};

export const createToolEvent=(type:ToolEventType,tool:ToolId,referenceId:string,metadata:ToolEvent["metadata"],stableId?:string)=>{
  const event:ToolEvent={id:stableId??globalThis.crypto?.randomUUID?.()??`${tool}-${Date.now()}`,type,tool,referenceId,timestamp:new Date().toISOString(),metadata};
  saveToolEvent(event);
  const events=loadToolEvents().events;
  if(type==="habit_investigation_completed")unlockToolAchievement("pattern-detected");
  if(type==="movement_mission_completed"){
    if(typeof metadata.sourceCase==="string")unlockToolAchievement("case-closed");
    if(events.filter(item=>item.type==="movement_mission_completed").length>=3)unlockToolAchievement("spin-cycle");
  }
  if(type==="evidence_reviewed"&&typeof metadata.completed==="number"&&metadata.completed>=3)unlockToolAchievement("receipts");
  return event;
};
