import { useState } from "react";
import { motion } from "motion/react";
import { languages } from "@/config/content";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";
import { useI18n } from "@/i18n/config";
import type { Locale } from "@/types/profile";

export const LanguagePreview = () => {
  const { locale, setLocale, t } = useI18n();
  const [active, setActive] = useState(() => {
    const codeMap: Record<Locale,string> = { en:"en", "zh-CN":"zh", "yue-Hant":"yue", "ar-AE":"ar", "hi-IN":"hi" };
    const index = languages.findIndex((item) => item.code === codeMap[locale]);
    return index >= 0 ? index : 0;
  });
  const language = languages[active];
  return <section id="languages" className="section-space scroll-mt-24 bg-blue text-white"><div className="page-shell"><SectionHeading eyebrow="5×" lines={[t("languagesA"), t("languagesB")]} light />
    <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]"><div className="flex flex-wrap content-start gap-3" role="tablist" aria-label="Language preview">{languages.map((item, index) => <button key={item.code} role="tab" aria-selected={active === index} onClick={() => { setActive(index); const localeMap: Record<string, Locale> = { en:"en", zh:"zh-CN", yue:"yue-Hant", ar:"ar-AE", hi:"hi-IN" }; setLocale(localeMap[item.code]); }} lang={item.code} className={cn("min-h-14 border-2 border-white px-5 text-lg font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lime", active === index ? "bg-lime text-ink shadow-[5px_5px_0_white]" : "bg-transparent hover:bg-white hover:text-ink")}>{item.label}</button>)}</div>
      <motion.div key={language.code} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} role="tabpanel" className="relative min-h-64 border-2 border-ink bg-white p-7 text-ink shadow-[10px_10px_0_var(--lime)] md:p-10"><p className="text-xs font-bold uppercase tracking-[.2em]">Coach says</p><blockquote lang={language.code} dir={language.dir} className="mt-7 text-[clamp(1.8rem,4vw,3.5rem)] font-bold leading-tight">“{language.roast}”</blockquote><div className="absolute -right-3 -top-5 rotate-3 border-2 border-ink bg-pink px-3 py-1 text-xs font-bold uppercase">Idiomatic, not robotic</div></motion.div>
    </div>
  </div></section>;
};
