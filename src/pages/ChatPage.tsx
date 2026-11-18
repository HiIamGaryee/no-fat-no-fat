import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Bot, Send, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useAppDataContext } from "@/components/app/AppDataContext";
import { buildInteractionHistory, formatAssistantBubbles, sendChatMessage, toChatProfile } from "@/lib/chat";
import { clearChat, loadChat, saveChat } from "@/lib/storage";
import { toolActionUrl } from "@/lib/tools/tool-registry";
import type { ChatExchange } from "@/types/chat";
import { useI18n } from "@/i18n/config";
import { translateUi } from "@/i18n/ui-translations";
import type { Locale } from "@/types/profile";

const prompts = ["I keep postponing exercise.", "Help me plan one healthy action today.", "My routine fell apart again."] as const;
const actionCopy = [
  ["open_midnight_food_rescue","FRIDGE INVESTIGATION","Hungry or bored? Let's catch the culprit.","OPEN TOOL"],
  ["open_excuse_court","EXCUSE COURT","Your alibi looks suspicious.","OPEN CASE"],
  ["open_food_detective","FOOD DETECTIVE","Compare it before you inhale it.","INVESTIGATE"],
  ["open_movement_roulette","MOVE, DRAMA LATER","A tiny mission. No opera required.","START"],
  ["open_habit_autopsy","HABIT AUTOPSY","Find where the routine died.","INVESTIGATE"],
  ["open_evidence_lab","EVIDENCE LAB","Receipts, not excuses.","SEE PROOF"],
  ["view_progress","SHOW THE RECEIPTS","See what actually moved.","VIEW"],
  ["suggest_mission","DO SOMETHING","One small mission. Right now.","START"],
] as const;

const AssistantTurn = ({ exchange, animate, locale, onQuickReply }:{ exchange:ChatExchange;animate:boolean;locale:Locale;onQuickReply:(reply:string)=>void }) => {
  const bubbles=formatAssistantBubbles(exchange.bubbles,exchange.assistant);
  const [visible,setVisible]=useState(animate?1:bubbles.length);
  const copy=actionCopy.find(([id])=>id===exchange.action?.id);
  const hasExtras=Boolean((copy&&exchange.action)||exchange.quickReplies?.length);
  const target=bubbles.length+(animate&&hasExtras?1:0);

  useEffect(()=>{
    if(!animate||visible>=target)return;
    const timer=window.setTimeout(()=>setVisible(count=>count+1),420);
    return ()=>window.clearTimeout(timer);
  },[animate,target,visible]);

  const complete=visible>=target;
  return <div className="flex max-w-[88%] items-start gap-2 sm:max-w-[78%]">
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-pink"><Bot className="h-4 w-4" /></span>
    <div className="min-w-0">
      <div className="flex flex-col items-start gap-2">{bubbles.slice(0,visible).map((bubble,index)=><motion.div key={`${exchange.id}-${index}`} initial={animate?{opacity:0,y:5}:false} animate={{opacity:1,y:0}} data-i18n-skip className="chat-message w-fit max-w-full whitespace-pre-wrap break-words rounded-e-2xl rounded-bl-2xl border-2 border-ink bg-white px-3.5 py-2.5 font-medium leading-snug shadow-[3px_3px_0_var(--ink)]">{bubble}</motion.div>)}</div>
      {complete&&copy&&exchange.action&&<Link to={toolActionUrl(exchange.action)} className="mt-3 block max-w-sm border-2 border-ink bg-lime p-3 shadow-[3px_3px_0_var(--ink)] transition-transform hover:-translate-y-0.5"><span className="flex items-center justify-between gap-3 font-display text-lg uppercase"><span>{translateUi(locale,copy[1])}</span><ArrowUpRight className="h-5 w-5 shrink-0" /></span><span className="mt-0.5 block text-xs font-medium normal-case">{translateUi(locale,copy[2])}</span><span className="mt-2 block text-xs font-black uppercase">{translateUi(locale,copy[3])}</span></Link>}
      {complete&&exchange.quickReplies?.length?<div className="mt-3 flex flex-wrap gap-2">{exchange.quickReplies.map(reply=><button key={reply} type="button" onClick={()=>onQuickReply(reply)} className="min-h-10 rounded-full border-2 border-ink bg-white px-3 text-sm font-bold hover:bg-yellow">{reply}</button>)}</div>:null}
    </div>
  </div>;
};

export const ChatPage = () => {
  const { profile } = useAppDataContext();
  const { locale } = useI18n();
  const [exchanges, setExchanges] = useState<ChatExchange[]>(() => loadChat().exchanges);
  const [input, setInput] = useState("");
  const [pendingUser, setPendingUser] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [revealingId, setRevealingId] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [exchanges, sending]);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const message = input.trim();
    if (!message || sending) return;
    setSending(true);
    setPendingUser(message);
    setError("");
    setInput("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await sendChatMessage({ message, history:buildInteractionHistory(exchanges), profile:toChatProfile(profile) }, controller.signal);
      const exchange:ChatExchange = { id:globalThis.crypto?.randomUUID?.() ?? String(Date.now()), user:message, assistant:result.text, bubbles:result.bubbles, quickReplies:result.quickReplies, modelSteps:result.steps, createdAt:new Date().toISOString(), action:result.action };
      const next = [...exchanges, exchange];
      setRevealingId(exchange.id);
      setExchanges(next);
      setPendingUser("");
      saveChat({ version:1, exchanges:next });
    } catch (reason) {
      console.error("[chat] request failed", reason);
      if (reason instanceof Error && reason.name !== "AbortError") {
        setInput(message);
        setError(reason.name === "TimeoutError" ? "The coach took too long. Your message is ready to retry." : reason.message);
      }
      setPendingUser("");
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  };

  const keyDown = (event:KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); }
  };

  const reset = () => {
    if (!window.confirm(translateUi(locale,"Delete this browser's UNFIT AI conversation history?"))) return;
    abortRef.current?.abort();
    clearChat();
    setExchanges([]);
    setError("");
  };

  return (
    <section className="overflow-hidden border-2 border-ink bg-white shadow-[7px_7px_0_var(--ink)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink bg-pink p-4">
        <div className="flex items-center gap-3">
          <motion.div animate={{ rotate:[-2,2,-2] }} transition={{ duration:3,repeat:Infinity }} className="grid h-12 w-12 place-items-center rounded-full border-2 border-ink bg-ink text-lime"><Bot /></motion.div>
          <div><h2 className="font-display text-2xl uppercase">UNFIT AI</h2><p className="text-xs font-bold uppercase">{`${profile.roastLevel} mode`}</p></div>
        </div>
        <div className="flex gap-1">
          {sending && <button onClick={() => abortRef.current?.abort()} className="inline-flex min-h-11 items-center gap-2 px-3 text-xs font-bold uppercase"><X className="h-4 w-4" />Cancel</button>}
          <button onClick={reset} disabled={!exchanges.length} className="inline-flex min-h-11 items-center gap-2 px-3 text-xs font-bold uppercase disabled:opacity-40"><Trash2 className="h-4 w-4" />Clear</button>
        </div>
      </header>
      <div className="grid min-h-[min(620px,calc(100dvh-190px))] grid-rows-[1fr_auto]">
        <div aria-live="polite" className="max-h-[calc(100dvh-310px)] min-h-[360px] overflow-y-auto bg-cream p-4 md:p-6">
          {!exchanges.length && <div className="mx-auto grid max-w-xl place-items-center py-12 text-center"><div className="grid h-24 w-24 place-items-center rounded-full border-2 border-ink bg-lime font-display text-4xl shadow-[6px_6px_0_var(--ink)]">AI</div><h3 className="mt-7 font-display text-4xl uppercase">YOUR EXCUSE. MY DESK.</h3><p className="mt-3 max-w-md font-medium">Ask for a practical next move. The roast is optional. The useful answer is not.</p><div className="mt-7 flex flex-wrap justify-center gap-2">{prompts.map((prompt) => <button key={prompt} onClick={() => setInput(prompt)} className="min-h-11 border-2 border-ink bg-white px-3 text-sm font-bold hover:bg-yellow">{prompt}</button>)}</div></div>}
          {exchanges.map((exchange) => <div key={exchange.id} className="mx-auto mb-7 max-w-3xl space-y-3"><div className="ms-auto flex max-w-[86%] items-start justify-end gap-2 sm:max-w-[72%]"><div data-i18n-skip className="chat-message min-w-0 whitespace-pre-wrap break-words rounded-s-2xl rounded-br-2xl border-2 border-ink bg-blue px-3.5 py-2.5 font-medium leading-snug text-white">{exchange.user}</div><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-white"><UserRound className="h-4 w-4" /></span></div><AssistantTurn exchange={exchange} animate={exchange.id===revealingId} locale={locale} onQuickReply={reply=>{setInput(reply);requestAnimationFrame(()=>document.querySelector<HTMLTextAreaElement>("#chat-message")?.focus());}} /></div>)}
          {pendingUser&&<div className="mx-auto mb-3 flex max-w-3xl justify-end"><div className="flex max-w-[86%] items-start justify-end gap-2 sm:max-w-[72%]"><div data-i18n-skip className="chat-message min-w-0 whitespace-pre-wrap break-words rounded-s-2xl rounded-br-2xl border-2 border-ink bg-blue px-3.5 py-2.5 font-medium leading-snug text-white">{pendingUser}</div><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-white"><UserRound className="h-4 w-4" /></span></div></div>}
          {sending && <div className="mx-auto flex max-w-3xl items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-pink"><Bot className="h-4 w-4" /></span><div className="typing-dots border-2 border-ink bg-white"><i /><i /><i /></div></div>}
          <div ref={endRef} />
        </div>
        <form onSubmit={submit} className="border-t-2 border-ink bg-white p-3 md:p-4">
          <div className="mx-auto max-w-3xl"><label className="sr-only" htmlFor="chat-message">Message UNFIT AI</label><div className="flex items-end gap-2"><textarea id="chat-message" rows={2} maxLength={2000} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={keyDown} placeholder="Present your excuse for investigation..." className="min-h-[56px] min-w-0 flex-1 resize-none border-2 border-ink bg-cream p-3 font-medium outline-none focus:ring-4 focus:ring-blue" /><button disabled={sending || !input.trim()} className="grid h-14 w-14 shrink-0 place-items-center border-2 border-ink bg-lime shadow-[3px_3px_0_var(--ink)] disabled:opacity-40" aria-label="Send message"><Send /></button></div>{error && <p role="alert" className="mt-2 border-s-4 border-orange ps-3 text-sm font-bold text-orange">{error}</p>}<p className="mt-2 flex items-start gap-2 text-[11px] text-ink/60"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />Messages and minimal displayed context are sent to Google's Gemini service. Local history stays in this browser. General wellness only—not medical care.</p></div>
        </form>
      </div>
    </section>
  );
};
