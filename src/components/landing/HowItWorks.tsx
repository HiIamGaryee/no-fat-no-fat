import { motion } from "motion/react";
import { SectionHeading } from "./SectionHeading";
import { useI18n } from "@/i18n/config";

const steps = [
  { n: "01", title: "CONFESS", copy: "Create a profile and tell the AI about your goals." },
  { n: "02", title: "GET ROASTED", copy: "Talk to your AI coach and let it investigate your excuses." },
  { n: "03", title: "DO SOMETHING", copy: "Receive small, practical health actions and track your progress." },
] as const;

export const HowItWorks = () => { const {t}=useI18n(); return (
  <section id="how-it-works" className="section-space scroll-mt-24 overflow-hidden bg-orange"><div className="page-shell"><SectionHeading eyebrow="01—03" lines={[t("howA"), t("howB")]} />
    <div className="grid gap-5 lg:grid-cols-3">{steps.map((step, index) => <motion.article initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .3 }} transition={{ delay: index * .12 }} key={step.n} className="relative min-h-80 border-2 border-ink bg-yellow p-6 shadow-[8px_8px_0_var(--ink)] even:bg-pink lg:even:-rotate-2"><span className="font-display text-[clamp(6rem,12vw,10rem)] leading-none">{step.n}</span><h3 className="font-display text-5xl uppercase leading-none md:text-6xl">{step.title}</h3><p className="mt-5 max-w-sm text-lg font-bold">{step.copy}</p></motion.article>)}</div>
  </div></section>
); };
