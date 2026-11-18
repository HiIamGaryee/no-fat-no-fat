export interface ChatExchange {
  id: string;
  user: string;
  assistant: string;
  bubbles?: string[];
  quickReplies?: string[];
  modelSteps: unknown[];
  createdAt: string;
  action?: import("./tools").ToolAction;
}

export interface ChatStore { version: 1; exchanges: ChatExchange[]; }
export interface ChatProfileContext { username:string;locale:string;goals:string[];schedule:string;wakeTime:string;sleepTime:string;activityPreference:string;preferredMissionMinutes:number;roastLevel:string;recentActivity:string[]; }
export interface ChatApiRequest { message:string; history:unknown[]; profile:ChatProfileContext; }
export interface ChatApiResponse { text:string; bubbles:string[]; quickReplies?:string[]; steps:unknown[]; model:string; action?:import("./tools").ToolAction; }
