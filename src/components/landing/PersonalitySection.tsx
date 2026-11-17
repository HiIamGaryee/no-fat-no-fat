import { useState } from "react";
import { motion } from "motion/react";
import { personalities } from "@/config/content";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";
import { useI18n } from "@/i18n/config";

export const PersonalitySection = () => {
  const [active, setActive] = useState<(typeof personalities)[number]["id"]>("savage");
  const {t}=useI18n();
  const selected = personalities.find((item) => item.id === active)!;
  return <section id="personality" className="section-space scroll-mt-24 overflow-hidden bg-ink text-white">
    <div className="page-shell"><SectionHeading eyebrow="AI" lines={[t("personalityA"), t("personalityB")]} accent={t("personalityAccent")} light />
      <div className="grid gap-5 md:grid-cols-3" role="tablist" aria-label="AI coach personalities">{personalities.map((item, index) => <button key={item.id} role="tab" aria-selected={active === item.id} onClick={() => setActive(item.id)} className={cn("group min-h-64 border-2 border-white p-6 text-left text-ink transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink", item.color, active === item.id ? "-translate-y-3 shadow-[8px_8px_0_white]" : "hover:-translate-y-2", index === 1 && "md:rotate-2")}><span className="text-xs font-bold uppercase tracking-[.2em]">Mode 0{index + 1}</span><h3 className="mt-8 font-display text-5xl uppercase">{item.title}</h3><p className="mt-4 max-w-xs font-medium">{item.blurb}</p></button>)}</div>
      <motion.div key={selected.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} role="tabpanel" className="mt-10 grid gap-5 border-2 border-white bg-white p-5 text-ink shadow-[10px_10px_0_var(--pink)] md:grid-cols-[auto_1fr] md:p-8"><span className="grid h-16 w-16 place-items-center rounded-full border-2 border-ink bg-pink font-display text-2xl">AI</span><div><p className="text-xs font-bold uppercase tracking-[.2em]">Live personality sample</p><p className="mt-2 max-w-4xl text-xl font-bold leading-snug md:text-3xl">“{selected.response}”</p></div></motion.div>
    </div>
  </section>;
};
