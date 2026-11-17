import { motion } from "motion/react";
import { EditorialButton } from "./EditorialButton";
import { useI18n } from "@/i18n/config";

const archColors = ["bg-ink", "bg-lime", "bg-pink", "bg-yellow", "bg-cream"] as const;

export const CTASection = () => { const {t}=useI18n(); return (
  <section className="relative min-h-[680px] overflow-hidden bg-orange py-20 md:min-h-[820px] md:py-28"><div className="absolute inset-x-0 bottom-0 flex h-[65%] items-end justify-center" aria-hidden>{archColors.map((color, index) => <motion.div key={color} whileHover={{ y: -10 }} className={`absolute bottom-[-35%] aspect-square rounded-full border-2 border-ink ${color}`} style={{ width: `${105 - index * 16}%`, maxWidth: `${1400 - index * 180}px` }} />)}</div>
    <div className="page-shell relative z-10 text-center"><h2 className="whitespace-pre-line display-title text-[clamp(4rem,11vw,10rem)] leading-[.82]">{t("ctaA")}</h2><div className="mx-auto mt-7 inline-block -rotate-2 bg-ink px-4 py-2 text-white"><p className="font-display text-[clamp(2.2rem,5vw,5rem)]">{t("ctaB")}</p></div><div className="mt-9"><EditorialButton to="/onboarding">{t("tryNow")}</EditorialButton></div></div>
  </section>
); };
