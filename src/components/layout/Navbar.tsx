import { Menu } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { hasCompletedProfile } from "@/lib/storage";
import { useI18n } from "@/i18n/config";
import type { Locale } from "@/types/profile";

const localeOptions:{value:Locale;label:string}[]=[{value:"en",label:"EN"},{value:"zh-CN",label:"简中"},{value:"yue-Hant",label:"廣東話"},{value:"ar-AE",label:"العربية"},{value:"hi-IN",label:"हिन्दी"}];

const links = [
  { key: "navFeatures", href: "#features" }, { key: "navHow", href: "#how-it-works" },
  { key: "navPersonality", href: "#personality" }, { key: "navLanguages", href: "#languages" },
] as const;

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { locale, setLocale, t } = useI18n();
  const tryPath = hasCompletedProfile() ? "/app" : "/onboarding";
  if (pathname !== "/") return null;
  return <nav aria-label="Primary navigation" className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-5">
    <div className="mx-auto flex min-h-14 max-w-[1440px] items-center justify-between gap-4 rounded-full border-2 border-ink bg-cream px-3 shadow-[4px_4px_0_var(--ink)] md:px-5">
      <BrandLogo className="text-sm sm:text-base" />
      <div className="hidden items-center gap-1 lg:flex">{links.map((link) => <a key={link.href} href={link.href} className="rounded-full px-3 py-3 text-xs font-bold uppercase hover:bg-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue">{t(link.key)}</a>)}</div>
      <div className="flex items-center gap-2">
        <span className="hidden sm:block"><Select id="global-locale" label="Language" compact value={locale} onChange={setLocale} options={localeOptions}/></span>
        <Button asChild className="min-h-10 rounded-full border-2 px-4 text-xs shadow-none"><Link to={tryPath}>{t("tryNow")}</Link></Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button size="icon" variant="ghost" className="rounded-full shadow-none lg:hidden" aria-label="Open menu"><Menu /></Button></SheetTrigger>
          <SheetContent><div className="mt-12 flex flex-col gap-3">{links.map((link) => <SheetClose asChild key={link.href}><a href={link.href} onClick={() => setOpen(false)} className="border-b-2 border-ink py-4 font-display text-3xl uppercase">{t(link.key)}</a></SheetClose>)}<SheetClose asChild><Link to={tryPath} className="mt-4 flex min-h-14 items-center justify-center border-2 border-ink bg-pink font-bold uppercase shadow-[5px_5px_0_var(--ink)]">{t("tryNow")}</Link></SheetClose></div></SheetContent>
        </Sheet>
      </div>
    </div>
  </nav>;
};
