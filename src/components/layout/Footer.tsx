import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import { useI18n } from "@/i18n/config";
import type { Locale } from "@/types/profile";

const footerLinks = [{ label: "Features", href: "#features" }, { label: "How it works", href: "#how-it-works" }, { label: "AI personality", href: "#personality" }, { label: "Languages", href: "#languages" }];
const footerLanguages: { label: string; locale: Locale }[] = [{ label: "English", locale: "en" }, { label: "简体中文", locale: "zh-CN" }, { label: "廣東話", locale: "yue-Hant" }, { label: "العربية", locale: "ar-AE" }, { label: "हिन्दी", locale: "hi-IN" }];
const legalLinks = [{ label: "Privacy Policy", to: "/privacy-policy" }, { label: "Cookies Policy", to: "/cookies-policy" }, { label: "Terms & Conditions", to: "/terms-and-conditions" }];

export const Footer = () => { const {locale,setLocale,t}=useI18n(); return (
  <footer className="overflow-hidden bg-ink py-14 text-white md:py-20"><div className="page-shell"><BrandLogo light /><p className="mt-12 font-display text-[clamp(4rem,11vw,10.5rem)] leading-[.78] tracking-[-.04em]">NO-FAT-<br className="sm:hidden" />NO-FAT®</p><p className="mt-8 max-w-xl font-accent text-3xl italic text-pink">{t("footerTag")}</p>
    <div className="mt-16 grid gap-10 border-t border-white/40 pt-10 sm:grid-cols-2 lg:grid-cols-4"><div><p className="footer-label">Navigate</p>{footerLinks.map((link) => <a key={link.href} href={link.href} className="footer-link">{link.label}</a>)}</div><div><p className="footer-label">Languages</p>{footerLanguages.map((language) => <button type="button" key={language.locale} onClick={()=>setLocale(language.locale)} aria-pressed={locale===language.locale} className={`footer-link text-start ${locale===language.locale?"text-lime underline":""}`}>{language.label}</button>)}</div><div><p className="footer-label">Legal</p>{legalLinks.map((link)=><Link key={link.to} className="footer-link" to={link.to}>{link.label}</Link>)}</div><div><p className="footer-label">The serious bit</p><p className="text-sm leading-relaxed text-white/70">NO-FAT-NO-FAT supports sustainable habits and general wellbeing. It does not diagnose, treat, or replace professional medical advice. No dangerous dieting. No body shaming. Ever.</p></div></div>
    <div className="mt-12 flex flex-col gap-3 border-t border-white/20 pt-6 text-xs uppercase tracking-wider text-white/60 sm:flex-row sm:justify-between"><p>© 2026 NO-FAT-NO-FAT</p><div className="flex flex-wrap gap-x-5 gap-y-2">{legalLinks.map((link)=><Link key={link.to} className="hover:text-pink" to={link.to}>{link.label}</Link>)}</div></div>
  </div></footer>
); };
