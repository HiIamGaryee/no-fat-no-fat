import { ArrowLeft, ArrowUpRight, SearchX } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/layout/BrandLogo";

const destinations = [
  { label:"Go home", to:"/", tone:"bg-lime" },
  { label:"Open dashboard", to:"/app", tone:"bg-pink" },
  { label:"Explore health tools", to:"/app/tools", tone:"bg-yellow" },
] as const;

export const ScaffoldPage = (props:{title:string;phase:string}) => {
  void props;
  return (
  <main className="relative grid min-h-screen overflow-hidden bg-orange p-5 text-ink md:p-10">
    <div className="absolute -end-24 -top-24 h-72 w-72 rotate-12 border-[3px] border-ink bg-pink md:h-96 md:w-96" />
    <div className="absolute -bottom-28 -start-24 h-72 w-72 rounded-full border-[3px] border-ink bg-blue md:h-96 md:w-96" />
    <section className="relative z-10 m-auto w-full max-w-5xl border-2 border-ink bg-cream p-6 shadow-[12px_12px_0_var(--ink)] md:p-12">
      <div className="flex flex-wrap items-center justify-between gap-5"><BrandLogo/><span className="rotate-3 border-2 border-ink bg-yellow px-4 py-2 text-xs font-bold uppercase tracking-[.18em]">Case 404</span></div>
      <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.22em]">Missing page report</p><h1 className="mt-4 font-display text-[clamp(4.5rem,15vw,11rem)] uppercase leading-[.76]">THIS PAGE<br/><span className="text-blue">ESCAPED.</span></h1><p className="mt-8 max-w-2xl text-lg font-bold leading-relaxed md:text-xl">We checked the links, questioned the browser, and interrogated the URL. This page is nowhere to be found.</p></div><SearchX className="hidden h-40 w-40 rotate-[-8deg] stroke-[1.2] lg:block"/></div>
      <div className="mt-10 grid gap-3 sm:grid-cols-3">{destinations.map((destination,index)=><Link key={destination.to} to={destination.to} className={`${destination.tone} flex min-h-16 items-center justify-between border-2 border-ink px-4 font-bold uppercase shadow-[4px_4px_0_var(--ink)] transition-transform hover:-translate-y-1`}>{index===0&&<ArrowLeft className="h-5 w-5 rtl:rotate-180"/>}<span>{destination.label}</span>{index>0&&<ArrowUpRight className="h-5 w-5 rtl:-rotate-90"/>}</Link>)}</div>
      <p className="mt-9 border-t-2 border-ink pt-5 text-sm font-medium">The page may have moved, the address may be mistyped, or the link brought an excuse instead of evidence.</p>
    </section>
  </main>
  );
};
