import type { LocalProfile } from "@/types/profile";
import type { Mission, MissionCategory } from "@/types/app";

export const localDay = (date = new Date(), rolloverHour = 0) => { const adjusted=new Date(date);if(adjusted.getHours()<rolloverHour)adjusted.setDate(adjusted.getDate()-1);return `${adjusted.getFullYear()}-${String(adjusted.getMonth()+1).padStart(2,"0")}-${String(adjusted.getDate()).padStart(2,"0")}`; };
export const localDayForProfile = (profile:LocalProfile,date=new Date()) => localDay(date,profile.schedule==="night"?6:0);

const templates: Record<MissionCategory,{title:string;description:string;xp:number}> = {
  movement:{title:"THE QUICK ESCAPE",description:"Take a comfortable movement break.",xp:20},
  routine:{title:"ROUTINE REPAIR",description:"Do one small task at your usual planned time.",xp:15},
  hydration:{title:"WATER WITNESS",description:"Pause and have a glass of water if appropriate.",xp:10},
  reflection:{title:"EXCUSE AUTOPSY",description:"Write one sentence about what got in the way today.",xp:10},
  sleep:{title:"LANDING SEQUENCE",description:"Prepare one part of your sleep routine.",xp:15},
  food:{title:"THE CALM CHOICE",description:"Pause before one meal and choose what feels balanced.",xp:15},
};

export const generateMissions = (profile: LocalProfile, day=localDayForProfile(profile)): Mission[] => {
  const primary=profile.goals[0];
  const categories: MissionCategory[] = primary==="sleep"?["sleep","routine","reflection"]:primary==="food"||primary==="weight"?["food","movement","reflection"]:primary==="routine"?["routine","movement","sleep"]:["movement","routine","hydration"];
  return categories.map((category,index)=>({id:`${day}-${category}-${index}`,day,category,title:templates[category].title,description:templates[category].description,minutes:category==="movement"?profile.preferredMissionMinutes:Math.min(5,profile.preferredMissionMinutes),xp:templates[category].xp,status:"available",completedAt:null}));
};

export const lowerEffortMission = (mission: Mission): Mission => ({...mission,title:`MINI ${mission.title}`,description:"Do the smallest comfortable version. Showing up counts.",minutes:2,xp:10,status:"available"});
