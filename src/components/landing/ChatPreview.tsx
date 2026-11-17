import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { chatPrompts } from "@/config/content";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";
import { useI18n } from "@/i18n/config";

export const ChatPreview = () => {
  const {t}=useI18n();
  const [active, setActive] = useState(1);
  const [typing, setTyping] = useState(false);
  const select = (index: number) => { setActive(index); setTyping(true); };
  useEffect(() => { if (!typing) return; const timer = window.setTimeout(() => setTyping(false), 650); return () => window.clearTimeout(timer); }, [typing, active]);
  const chat = chatPrompts[active];
  return <section className="section-space bg-pink"><div className="page-shell"><SectionHeading eyebrow="Preview" lines={[t("chatA"), t("chatB")]} />
    <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
      <div className="flex flex-col gap-3" role="tablist" aria-label="Example chat prompts">{chatPrompts.map((prompt, index) => <button key={prompt.short} role="tab" aria-selected={active === index} onClick={() => select(index)} className={cn("min-h-16 border-2 border-ink px-5 text-left font-bold uppercase transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue", active === index ? "translate-x-2 bg-yellow shadow-[5px_5px_0_var(--ink)]" : "bg-white hover:translate-x-1")}>{prompt.user}</button>)}</div>
      <div className="border-2 border-ink bg-cream p-4 shadow-[10px_10px_0_var(--ink)] md:p-8"><div className="mb-6 flex items-center justify-between border-b-2 border-ink pb-4"><strong className="font-display text-2xl">NO-FAT-NO-FAT AI</strong><span className="border border-ink bg-lime px-2 py-1 text-[10px] font-bold uppercase">Preview only</span></div>
        <div className="ml-auto max-w-[85%] rounded-t-3xl rounded-bl-3xl border-2 border-ink bg-blue p-4 font-medium text-white">{chat.user}</div>
        <motion.div key={`${active}-${typing}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 max-w-[92%] rounded-t-3xl rounded-br-3xl border-2 border-ink bg-white p-5 text-lg font-bold">{typing ? <span className="typing-dots" aria-label="Coach is typing"><i /><i /><i /></span> : chat.roast}</motion.div>
        {!typing && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 border-2 border-ink bg-lime p-4"><span className="text-xs font-bold uppercase tracking-[.16em]">Suggested action</span><p className="mt-1 font-bold">{chat.action}</p></motion.div>}
      </div>
    </div>
  </div></section>;
};
