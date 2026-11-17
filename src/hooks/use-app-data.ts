import { useMemo, useState } from "react";
import { getLevelProgress, getTotalXP, transitionMission } from "@/lib/gamification";
import { lowerEffortMission } from "@/lib/missions";
import { getDailyMissions, loadMissionStore, loadProfile, loadProgress, saveMissionStore, saveProgress } from "@/lib/storage";
import type { Mission, MissionStatus } from "@/types/app";
import { unlockToolAchievement } from "@/lib/tools/tool-events";

export const useAppData=()=>{
  const profile=loadProfile()!;
  const [store,setStore]=useState(()=>getDailyMissions(profile));
  const [progress,setProgressState]=useState(loadProgress);
  const [notice,setNotice]=useState("");
  const today=store.missions.filter(item=>item.day===store.day);
  const setMissionStatus=(id:string,status:MissionStatus)=>{
    const latest=loadMissionStore();
    const mission=latest.missions.find(item=>item.id===id);
    if(!mission)return;
    const result=transitionMission(latest,loadProgress(),id,status);
    if(!result.changed)return;
    saveMissionStore(result.store);saveProgress(result.progress);setStore(result.store);setProgressState(result.progress);
    if(status==="completed"&&id.startsWith("recovery-"))unlockToolAchievement("comeback-file");
    if(status==="completed")setNotice(result.unlocked.length?`${result.unlocked[0].id.toUpperCase()} UNLOCKED`:`+${result.awardedXP} XP`);
    window.setTimeout(()=>setNotice(""),2200);
  };
  const replaceMission=(id:string)=>{const latest=loadMissionStore();const missions=latest.missions.map(item=>item.id===id?lowerEffortMission(item):item);const next={...latest,missions};saveMissionStore(next);setStore(next);};
  const addMission=(mission:Mission)=>{const latest=loadMissionStore();if(latest.missions.some(item=>item.id===mission.id))return mission.id;const next={...latest,missions:[...latest.missions,mission]};saveMissionStore(next);setStore(next);return mission.id;};
  const totalXP=getTotalXP(progress.transactions);const level=useMemo(()=>getLevelProgress(totalXP),[totalXP]);
  return {profile,store,today,progress,totalXP,level,notice,setMissionStatus,replaceMission,addMission};
};
