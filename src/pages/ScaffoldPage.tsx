import { ArrowLeft, Construction } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/layout/BrandLogo";

export const ScaffoldPage = ({ title, phase }: { title: string; phase: string }) => (
  <main className="grid min-h-screen place-items-center bg-lime p-5"><section className="w-full max-w-3xl border-2 border-ink bg-cream p-7 shadow-[10px_10px_0_var(--ink)] md:p-12"><BrandLogo /><Construction className="mt-16 h-16 w-16" /><p className="mt-7 text-xs font-bold uppercase tracking-[.2em]">Route scaffold · {phase}</p><h1 className="mt-2 font-display text-[clamp(3.5rem,10vw,7rem)] uppercase leading-[.85]">{title}</h1><p className="mt-7 max-w-xl text-lg font-medium">This route is wired and ready for a later phase. For now, it is being refreshingly honest about not existing yet.</p><Link to="/" className="mt-10 inline-flex min-h-12 items-center border-2 border-ink bg-pink px-5 font-bold uppercase shadow-[5px_5px_0_var(--ink)]"><ArrowLeft className="mr-2" />Back to landing</Link></section></main>
);
