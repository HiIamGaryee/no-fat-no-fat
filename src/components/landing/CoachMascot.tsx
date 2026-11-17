import { motion } from "motion/react";

export const CoachMascot = () => (
  <motion.div className="relative mx-auto aspect-[4/5] w-[min(88%,430px)]" animate={{ y: [0, -10, 0], rotate: [0, 1, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} aria-label="Illustration of a mischievous AI coach" role="img">
    <div className="absolute inset-x-[12%] bottom-[4%] top-[16%] rotate-3 rounded-[45%_45%_30%_30%] border-[3px] border-ink bg-pink shadow-[12px_12px_0_var(--ink)]" />
    <div className="absolute left-[25%] top-[31%] h-[12%] w-[16%] rounded-full border-[3px] border-ink bg-white"><span className="absolute right-[22%] top-[28%] h-[38%] w-[38%] rounded-full bg-ink" /></div>
    <div className="absolute right-[25%] top-[31%] h-[12%] w-[16%] rounded-full border-[3px] border-ink bg-white"><span className="absolute left-[22%] top-[28%] h-[38%] w-[38%] rounded-full bg-ink" /></div>
    <div className="absolute left-[34%] top-[52%] h-[3px] w-[32%] -rotate-6 bg-ink after:absolute after:-right-1 after:-top-2 after:h-3 after:w-3 after:rounded-full after:bg-white" />
    <div className="absolute left-[11%] top-[5%] h-[30%] w-[30%] -rotate-12 border-[3px] border-ink bg-blue [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
    <div className="absolute -left-[2%] bottom-[23%] rotate-12 border-2 border-ink bg-yellow px-4 py-2 font-display text-xl shadow-[4px_4px_0_var(--ink)]">I HAVE RECEIPTS.</div>
    <div className="absolute -right-[5%] top-[5%] -rotate-6 rounded-full border-2 border-ink bg-white px-4 py-3 text-center text-sm font-bold shadow-[4px_4px_0_var(--ink)]">That excuse?<br />Adorable.</div>
  </motion.div>
);
