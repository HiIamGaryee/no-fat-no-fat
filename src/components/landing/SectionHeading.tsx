import { cn } from "@/lib/utils";

export const SectionHeading = ({ eyebrow, lines, light, accent, className }: { eyebrow?: string; lines: string[]; light?: boolean; accent?: string; className?: string }) => (
  <header className={cn("mb-12 md:mb-16", light && "text-white", className)}>
    {eyebrow && <p className="mb-4 inline-block -rotate-2 border-2 border-current px-3 py-1 text-xs font-bold uppercase tracking-[.18em]">{eyebrow}</p>}
    <h2 className="display-title text-[clamp(3.4rem,9vw,8.5rem)] leading-[.86]">{lines.map((line) => <span className="block" key={line}>{line}</span>)}</h2>
    {accent && <p className="mt-4 font-accent text-[clamp(1.7rem,4vw,4rem)] italic">{accent}</p>}
  </header>
);
