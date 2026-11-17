import { ChartNoAxesColumnIncreasing, Dices, FileSearch, Gavel, Moon, Search, type LucideIcon } from "lucide-react";
import type { ToolAction, ToolActionId, ToolId } from "@/types/tools";

export interface ToolDefinition { id:ToolId;action:ToolActionId;path:string;title:string;tagline:string;description:string;color:string;icon:LucideIcon;preview:string; }
export const toolRegistry:ToolDefinition[]=[
  {id:"midnight-food",action:"open_midnight_food_rescue",path:"/app/tools/midnight-food",title:"MIDNIGHT FOOD RESCUE",tagline:"THE FRIDGE INCIDENT.",description:"Investigate hunger, cravings and night-shift eating without food guilt.",color:"bg-pink",icon:Moon,preview:"Schedule-aware decisions"},
  {id:"excuse-court",action:"open_excuse_court",path:"/app/tools/excuse-court",title:"EXCUSE COURT",tagline:"OBJECTION. THAT'S AN EXCUSE.",description:"Put a barrier on trial and leave with one realistic action.",color:"bg-orange",icon:Gavel,preview:"Excuse → evidence → action"},
  {id:"food-detective",action:"open_food_detective",path:"/app/tools/food-detective",title:"FOOD DETECTIVE",tagline:"YOUR FOOD HAS BEEN QUESTIONED.",description:"Compare real nutrition-label values on an equal basis.",color:"bg-yellow",icon:Search,preview:"Manual label comparison"},
  {id:"movement-roulette",action:"open_movement_roulette",path:"/app/tools/movement-roulette",title:"MOVEMENT ROULETTE",tagline:"SPIN THE WHEEL. MOVE SOMETHING.",description:"Generate an ability-aware movement mission and run a real timer.",color:"bg-lime",icon:Dices,preview:"Wheel + timer + XP"},
  {id:"habit-autopsy",action:"open_habit_autopsy",path:"/app/tools/habit-autopsy",title:"HABIT AUTOPSY",tagline:"WHO KILLED YOUR ROUTINE?",description:"Compare your explanation with actual records and plan a recovery.",color:"bg-blue text-white",icon:FileSearch,preview:"Facts separated from hypotheses"},
  {id:"evidence-lab",action:"open_evidence_lab",path:"/app/tools/evidence-lab",title:"EVIDENCE LAB",tagline:"THE RECEIPTS DON'T LIE.",description:"See mission, barrier and recovery patterns built from local records.",color:"bg-ink text-white",icon:ChartNoAxesColumnIncreasing,preview:"Real local analytics"},
];
export const actionRoutes:Record<ToolActionId,string>={open_midnight_food_rescue:"/app/tools/midnight-food",open_excuse_court:"/app/tools/excuse-court",open_food_detective:"/app/tools/food-detective",open_movement_roulette:"/app/tools/movement-roulette",open_habit_autopsy:"/app/tools/habit-autopsy",open_evidence_lab:"/app/tools/evidence-lab",suggest_mission:"/app/tools/movement-roulette",view_progress:"/app/progress"};
export const toolActionUrl=(action:ToolAction)=>{const base=actionRoutes[action.id];return action.context?`${base}?context=${encodeURIComponent(action.context.slice(0,300))}`:base;};
