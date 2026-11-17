import { motion } from "motion/react";
import { EditorialButton } from "./EditorialButton";
import { CoachMascot } from "./CoachMascot";
import { useI18n } from "@/i18n/config";

export const Hero = () => { const {t}=useI18n(); return (
  <section className="relative min-h-[760px] overflow-hidden bg-lime pb-16 pt-28 md:pb-24 md:pt-36">
    <div className="page-shell relative z-10 grid items-center gap-10 lg:grid-cols-[1.25fr_.75fr]">
      <div>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-5 inline-block rotate-[-2deg] border-2 border-ink bg-yellow px-3 py-1 text-xs font-bold uppercase tracking-[.18em]">{t("heroEyebrow")}</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }} className="display-title text-[clamp(4.4rem,11vw,10.5rem)] leading-[.8]">
          <span className="block">{t("heroA")}</span><span className="inline-block bg-ink px-[.06em] text-lime">{t("heroB")}</span>
        </motion.h1>
        <div className="mt-5 flex flex-wrap items-end gap-x-5 gap-y-2"><p className="whitespace-pre-line display-title text-[clamp(3rem,7vw,7rem)] leading-none">{t("heroNoFat")}</p><p className="max-w-[220px] -rotate-3 font-accent text-[clamp(1.8rem,3vw,3.2rem)] italic leading-none">{t("heroAccent")}</p></div>
        <p className="mt-7 max-w-2xl text-base font-medium leading-relaxed md:text-lg">{t("heroCopy")}</p>
        <div className="mt-8 flex flex-wrap gap-4"><EditorialButton to="/onboarding">{t("tryNow")}</EditorialButton><a href="#personality" className="inline-flex min-h-14 items-center border-b-2 border-ink px-2 font-bold uppercase">{t("meetCoach")} ↓</a></div>
      </div>
      <CoachMascot />
    </div>
    <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full border-[40px] border-pink md:h-80 md:w-80" />
  </section>
); };
