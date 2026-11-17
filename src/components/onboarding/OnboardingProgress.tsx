export const OnboardingProgress = ({ step, total }: { step: number; total: number }) => (
  <div aria-label={`Step ${step + 1} of ${total}`} className="flex items-center gap-3"><span className="whitespace-nowrap text-xs font-bold uppercase tracking-[.15em]">{String(step + 1).padStart(2,"0")} / {String(total).padStart(2,"0")}</span><div className="flex flex-1 gap-1.5">{Array.from({length:total}).map((_,index)=><span key={index} className={`h-3 flex-1 border-2 border-ink transition-colors duration-300 ${index<=step?"bg-blue":"bg-white"}`}/>)}</div></div>
);
