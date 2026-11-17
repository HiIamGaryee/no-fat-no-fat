import { motion } from "motion/react";
import { features } from "@/config/content";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";
import { useI18n } from "@/i18n/config";

export const FeaturesSection = () => { const {t}=useI18n(); return (
  <section id="features" className="section-space scroll-mt-24 bg-cream"><div className="page-shell"><SectionHeading eyebrow="APP" lines={[t("featuresA"), t("featuresB")]} accent={t("featuresAccent")} />
    <div className="grid auto-rows-auto gap-5 md:grid-cols-2 lg:grid-cols-4">{features.map((feature, index) => { const Icon = feature.icon; return <motion.article whileHover={{ y: -8, rotate: index % 2 ? 1 : -1 }} key={feature.title} className={cn("relative min-h-72 overflow-hidden border-2 border-ink p-6 shadow-[7px_7px_0_var(--ink)]", feature.tone, feature.span)}><Icon aria-hidden className="h-12 w-12 stroke-[1.7]" /><p className="mt-8 text-xs font-bold uppercase tracking-[.18em]">{feature.kicker}</p><h3 className="mt-2 font-display text-[clamp(2.2rem,4vw,4.5rem)] uppercase leading-[.9]">{feature.title}</h3><p className="mt-5 max-w-md font-medium leading-relaxed">{feature.description}</p><span className="absolute -bottom-8 -right-5 font-display text-8xl opacity-10">0{index + 1}</span></motion.article>; })}</div>
  </div></section>
); };
