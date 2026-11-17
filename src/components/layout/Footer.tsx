import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import { useI18n } from "@/i18n/config";

const footerLinks = [{ label: "Features", href: "#features" }, { label: "How it works", href: "#how-it-works" }, { label: "AI personality", href: "#personality" }, { label: "Languages", href: "#languages" }];
const footerLanguages = ["English", "简体中文", "廣東話", "العربية", "हिन्दी"];

export const Footer = () => { const {t}=useI18n(); return (
  <footer className="overflow-hidden bg-ink py-14 text-white md:py-20"><div className="page-shell"><BrandLogo light /><p className="mt-12 font-display text-[clamp(4rem,11vw,10.5rem)] leading-[.78] tracking-[-.04em]">NO-FAT-<br className="sm:hidden" />NO-FAT®</p><p className="mt-8 max-w-xl font-accent text-3xl italic text-pink">{t("footerTag")}</p>
    <div className="mt-16 grid gap-10 border-t border-white/40 pt-10 sm:grid-cols-2 lg:grid-cols-4"><div><p className="footer-label">Navigate</p>{footerLinks.map((link) => <a key={link.href} href={link.href} className="footer-link">{link.label}</a>)}</div><div><p className="footer-label">Languages</p>{footerLanguages.map((language) => <span key={language} className="footer-link">{language}</span>)}</div><div><p className="footer-label">Future app</p><Link className="footer-link" to="/app">Dashboard scaffold</Link><Link className="footer-link" to="/app/chat">Chat scaffold</Link><Link className="footer-link" to="/app/tools">Tools scaffold</Link></div><div><p className="footer-label">The serious bit</p><p className="text-sm leading-relaxed text-white/70">NO-FAT-NO-FAT supports sustainable habits and general wellbeing. It does not diagnose, treat, or replace professional medical advice. No dangerous dieting. No body shaming. Ever.</p></div></div>
    <div className="mt-12 flex flex-col gap-3 border-t border-white/20 pt-6 text-xs uppercase tracking-wider text-white/60 sm:flex-row sm:justify-between"><p>© 2026 NO-FAT-NO-FAT</p><p>Privacy-first. Browser-local by design.</p></div>
  </div></footer>
); };
