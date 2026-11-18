import type { ChatApiRequest, ChatApiResponse, ChatExchange, ChatProfileContext } from "@/types/chat";
import type { LocalProfile } from "@/types/profile";
import { loadLocale, loadMissionStore, loadSettings, loadToolEvents } from "@/lib/storage";
import { toolActionIds } from "@/types/tools";

const cleanBubble=(value:string)=>value.replace(/\s+/g," ").trim();
const sentenceParts=(value:string)=>value.match(/[^.!?。！？]+[.!?。！？]?/g)?.map(cleanBubble).filter(Boolean)??[];

export const formatAssistantBubbles=(bubbles:unknown,text="")=>{
  const structured=Array.isArray(bubbles)?bubbles.filter((item):item is string=>typeof item==="string").map(cleanBubble).filter(Boolean):[];
  if(structured.length)return structured.slice(0,4);
  const paragraphs=text.split(/\n\s*\n|\n+/).map(cleanBubble).filter(Boolean);
  if(paragraphs.length>1)return paragraphs.slice(0,4);
  const sentences=sentenceParts(text);
  if(sentences.length<2)return [cleanBubble(text)].filter(Boolean);
  return sentences.reduce<string[]>((chunks,sentence)=>{
    const last=chunks.at(-1);
    if(last&&`${last} ${sentence}`.split(/\s+/).length<=25&&!/[?？!]$/.test(last))chunks[chunks.length-1]=`${last} ${sentence}`;
    else chunks.push(sentence);
    return chunks;
  },[]).slice(0,4);
};

export const toChatProfile=(profile:LocalProfile):ChatProfileContext=>{const memoryEnabled=loadSettings().memoryEnabled;const missions=memoryEnabled?loadMissionStore().missions.filter(item=>item.status==="completed").slice(-4).map(item=>`Completed mission: ${item.title} on ${item.day}`):[];const events=memoryEnabled?loadToolEvents().events.slice(-4).map(item=>`Tool record: ${item.type} on ${item.timestamp.slice(0,10)}`):[];return {username:profile.username,locale:loadLocale(),goals:profile.goals,schedule:profile.schedule,wakeTime:profile.wakeTime,sleepTime:profile.sleepTime,activityPreference:profile.activityPreference,preferredMissionMinutes:profile.preferredMissionMinutes,roastLevel:profile.roastLevel,recentActivity:[...missions,...events].slice(-8)};};
export const buildInteractionHistory=(exchanges:ChatExchange[])=>exchanges.slice(-8).flatMap(exchange=>[{type:"user_input",content:[{type:"text",text:exchange.user}]},...exchange.modelSteps]);
export const sendChatMessage=async(request:ChatApiRequest,signal?:AbortSignal):Promise<ChatApiResponse>=>{const timeout=new AbortController();const timer=window.setTimeout(()=>timeout.abort(new DOMException("Request timed out.","TimeoutError")),30000);const controller=new AbortController();const abort=()=>controller.abort(signal?.reason??timeout.signal.reason);signal?.addEventListener("abort",abort,{once:true});timeout.signal.addEventListener("abort",abort,{once:true});try{const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(request),signal:controller.signal});const body=await response.json().catch(()=>null) as (ChatApiResponse&{error?:string})|null;if(!response.ok)throw new Error(body?.error??"UNFIT AI failed to answer.");if(!body||typeof body.text!=="string"||!Array.isArray(body.steps))throw new Error("The coach returned an invalid response.");const bubbles=formatAssistantBubbles(body.bubbles,body.text);if(!bubbles.length)throw new Error("The coach returned an invalid response.");const quickReplies=Array.isArray(body.quickReplies)?body.quickReplies.filter((item):item is string=>typeof item==="string"&&item.trim().length>0).map(item=>item.trim().slice(0,80)).slice(0,3):undefined;const action=body.action&&typeof body.action.id==="string"&&toolActionIds.includes(body.action.id)&&(!body.action.context||typeof body.action.context==="string")?{id:body.action.id,context:body.action.context?.slice(0,300)}:undefined;return {...body,bubbles,quickReplies,action};}finally{window.clearTimeout(timer);signal?.removeEventListener("abort",abort);}};
