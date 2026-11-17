import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export const ToolLayout=({number,title,tagline,color="bg-white",children}:{number:string;title:string;tagline:string;color?:string;children:ReactNode})=><div className="space-y-6"><Link to="/app/tools" className="inline-flex min-h-11 items-center gap-2 font-bold uppercase"><ArrowLeft className="h-4 w-4"/>All tools</Link><header className={`${color} relative overflow-hidden border-2 border-ink p-6 shadow-[7px_7px_0_var(--ink)] md:p-9`}><span className="text-xs font-bold uppercase tracking-[.2em]">Tool {number}</span><h2 className="mt-4 whitespace-pre-line font-display text-[clamp(3rem,8vw,7rem)] uppercase leading-[.84]">{title}</h2><p className="mt-5 max-w-2xl text-lg font-bold">{tagline}</p></header>{children}<p className="text-xs text-ink/60">General wellness information only. Choose actions appropriate to your abilities and circumstances.</p></div>;
