import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "react-router-dom";
import { useAppDataContext } from "@/components/app/AppDataContext";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { localDay } from "@/lib/missions";
import { loadToolEvents } from "@/lib/storage";
import { createToolEvent } from "@/lib/tools/tool-events";
import type { Mission } from "@/types/app";

const activities = [
  { title: "COMFORTABLE WALK", category: "Walking", instruction: "Walk at a comfortable pace or use an equivalent movement.", modification: "March gently in place.", seated: false, quiet: false, rarity: "COMMON", cheer: "Left foot, right foot. You are literally winning." },
  { title: "CHAIR MOBILITY", category: "Seated Movement", instruction: "Move shoulders, ankles and arms comfortably while seated.", modification: "Use a smaller comfortable range.", seated: true, quiet: true, rarity: "COMMON", cheer: "Sitting down and still scoring points. Smooth." },
  { title: "STRETCH BREAK", category: "Stretching", instruction: "Choose gentle stretches that feel comfortable.", modification: "Stay seated and stretch arms and ankles.", seated: true, quiet: true, rarity: "COMMON", cheer: "Reach for the sky. Or at least the ceiling." },
  { title: "STANDING RESET", category: "Standing Break", instruction: "Stand, change position and move gently.", modification: "Shift posture while seated.", seated: false, quiet: true, rarity: "RARE", cheer: "Up you get. The couch never saw it coming." },
  { title: "BEGINNER DANCE", category: "Beginner Dance", instruction: "Play one song and move in any comfortable way.", modification: "Dance with arms while seated.", seated: false, quiet: false, rarity: "EPIC", cheer: "Main character energy. Pick a banger." },
  { title: "RECOVERY BREAK", category: "Recovery Break", instruction: "Breathe, reset posture and take easy mobility movements.", modification: "Simply pause and breathe comfortably.", seated: true, quiet: true, rarity: "COMMON", cheer: "Rest is part of the game. Respect." },
  { title: "GENTLE MOBILITY", category: "Gentle Mobility", instruction: "Circle joints gently and move without forcing range.", modification: "Choose two comfortable movements only.", seated: true, quiet: true, rarity: "RARE", cheer: "Smooth joints, smoother vibes." },
  { title: "BODYWEIGHT BASICS", category: "Simple Bodyweight", instruction: "Try comfortable sit-to-stands or wall presses.", modification: "Use supported standing or arm presses.", seated: false, quiet: true, rarity: "EPIC", cheer: "Tiny reps, giant bragging rights." },
] as const;

const rarityStyle: Record<string, string> = {
  COMMON: "bg-white text-ink",
  RARE: "bg-yellow text-ink",
  EPIC: "bg-pink text-ink",
};
const ranks = [
  { min: 10, name: "ROULETTE LEGEND" },
  { min: 3, name: "WARM-UP HERO" },
  { min: 0, name: "ROOKIE MOVER" },
] as const;
const goal = 3;
const spinMs = 3.2;
const confettiColors = ["bg-lime", "bg-pink", "bg-orange", "bg-yellow", "bg-white"] as const;
const confetti = Array.from({ length: 28 }, (_, index) => {
  const angle = (index / 28) * Math.PI * 2;
  const distance = 110 + (index % 4) * 38;
  return {
    id: index,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance - 30,
    color: confettiColors[index % confettiColors.length],
    spin: index % 2 ? 360 : -360,
  };
});
const pegs = Array.from({ length: 8 }, (_, index) => index * 45);
const wheelColors = "conic-gradient(#CCED53 0 12.5%,#F99CD2 12.5% 25%,#F35A2A 25% 37.5%,#FACB38 37.5% 50%,#3949FC 50% 62.5%,#CCED53 62.5% 75%,#F99CD2 75% 87.5%,#FACB38 87.5% 100%)";

const Confetti = () => (
  <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center overflow-hidden">
    {confetti.map((piece) => (
      <motion.span
        key={piece.id}
        initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
        animate={{ x: piece.x, y: piece.y + 90, opacity: 0, scale: 0.6, rotate: piece.spin }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className={`absolute h-3 w-3 border border-ink ${piece.color}`}
      />
    ))}
  </div>
);

export const MovementRoulettePage = () => {
  const { addMission, setMissionStatus } = useAppDataContext();
  const reduced = useReducedMotion();
  const [params] = useSearchParams();
  const initialMinutes = Number(params.get("minutes"));
  const [minutes, setMinutes] = useState([2, 5, 10, 15].includes(initialMinutes) ? initialMinutes : 5);
  const [seated, setSeated] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selected, setSelected] = useState<(typeof activities)[number] | null>(null);
  const [remaining, setRemaining] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [crushed, setCrushed] = useState(false);
  const [spun, setSpun] = useState(false);
  const [history] = useState(() =>
    loadToolEvents().events.filter((item) => item.type === "movement_mission_completed"),
  );
  const [added, setAdded] = useState(0);
  const today = localDay();
  const done =
    added + history.filter((item) => localDay(new Date(item.timestamp)) === today).length;
  const total = history.length + added;
  const endAt = useRef(0);
  const eligible = useMemo(
    () => activities.filter((item) => (!seated || item.seated) && (!quiet || item.quiet)),
    [seated, quiet],
  );

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) {
        setRunning(false);
        setFinished(true);
      }
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running && !finished) setRemaining(minutes * 60);
  }, [minutes, running, finished]);

  const spin = () => {
    if (spinning) return;
    setFinished(false);
    setRunning(false);
    setCrushed(false);
    setSelected(null);
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const result = eligible[bytes[0] % eligible.length];
    const index = activities.findIndex((item) => item.title === result.title);
    setSpinning(true);
    setRotation(rotation + (reduced ? 0 : 2160) + (360 - ((rotation % 360) + index * 45 + 22.5) % 360));
    window.setTimeout(() => {
      setSelected(result);
      setSpinning(false);
      setSpun(true);
      setRemaining(minutes * 60);
    }, reduced ? 20 : spinMs * 1000);
  };

  const start = () => {
    endAt.current = Date.now() + remaining * 1000;
    setRunning(true);
    setFinished(false);
  };
  const pause = () => {
    setRemaining(Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000)));
    setRunning(false);
  };
  const stop = () => {
    setRunning(false);
    setFinished(false);
    setRemaining(minutes * 60);
  };
  const confirm = () => {
    if (!selected) return;
    const reference = params.get("case") ?? globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    const id = `tool-movement-${reference}`;
    const mission: Mission = {
      id,
      day: localDay(),
      category: "movement",
      title: selected.title,
      description: selected.instruction,
      minutes,
      xp: 20,
      status: "available",
      completedAt: null,
    };
    addMission(mission);
    setMissionStatus(id, "completed");
    createToolEvent("movement_mission_completed", "movement-roulette", id, {
      activity: selected.title,
      minutes,
      sourceCase: params.get("case"),
    });
    setAdded((count) => count + 1);
    setCrushed(true);
    setFinished(false);
    setSelected(null);
  };

  const clock = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const progress = Math.round(((minutes * 60 - remaining) / (minutes * 60)) * 100);
  const rank = ranks.find((item) => total >= item.min)?.name;

  return (
    <ToolLayout number="04" title="MOVEMENT ROULETTE" tagline="SPIN THE WHEEL. MOVE SOMETHING." color="bg-lime">
      <div className="grid grid-cols-3 gap-2 border-2 border-ink bg-ink p-3 text-white">
        {[
          { icon: Zap, label: "Total moves", value: total },
          { icon: Flame, label: "Moves done", value: `${done}/${goal}` },
          { icon: Trophy, label: "Rank", value: rank },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon className="h-6 w-6 shrink-0 text-lime" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase text-white/60">{label}</div>
              <div className="truncate font-display text-xl leading-none">{value}</div>
            </div>
          </div>
        ))}
        <div className="col-span-3 flex items-center gap-2">
          {Array.from({ length: goal }, (_, index) => (
            <Star
              key={index}
              className={`h-7 w-7 transition-all duration-500 ${index < done ? "scale-110 fill-yellow text-yellow" : "text-white/30"}`}
            />
          ))}
          <div className="h-3 flex-1 border border-white/40">
            <motion.div
              animate={{ width: `${Math.min(100, (done / goal) * 100)}%` }}
              className="h-full bg-lime"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-7 xl:grid-cols-2">
        <section className="relative overflow-hidden border-2 border-ink bg-white p-5 shadow-[6px_6px_0_0_#181513]">
          <div className="relative mx-auto aspect-square w-full max-w-[440px]">
            <motion.div
              animate={spinning ? { rotate: [0, -14, 0] } : { rotate: 0 }}
              transition={spinning ? { duration: 0.18, repeat: Infinity } : undefined}
              className="absolute start-1/2 top-[-10px] z-10 h-0 w-0 -translate-x-1/2 border-x-[16px] border-t-[32px] border-x-transparent border-t-ink drop-shadow-[0_3px_0_#F35A2A]"
            />
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ duration: reduced ? 0 : spinMs, ease: [0.12, 0.8, 0.12, 1] }}
              className={`relative h-full w-full rounded-full border-[6px] border-ink ${spinning ? "shadow-[0_0_40px_10px_#FACB38]" : "shadow-[0_0_0_6px_#CCED53]"}`}
              style={{ background: wheelColors }}
            >
              {pegs.map((angle) => (
                <span
                  key={angle}
                  className="absolute inset-0"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <span className="absolute start-1/2 top-1 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-ink bg-white" />
                </span>
              ))}
              <div className="absolute inset-[35%] grid place-items-center rounded-full border-4 border-ink bg-white">
                <motion.div
                  animate={spinning ? { rotate: -360 } : { scale: [1, 1.12, 1] }}
                  transition={
                    spinning
                      ? { duration: 0.8, repeat: Infinity, ease: "linear" }
                      : { duration: 1.6, repeat: Infinity }
                  }
                >
                  <Sparkles className="h-12 w-12 text-orange" />
                </motion.div>
              </div>
            </motion.div>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-2">
            {[2, 5, 10, 15].map((value) => (
              <button
                key={value}
                onClick={() => setMinutes(value)}
                className={`min-h-11 border-2 border-ink font-bold transition-transform hover:-translate-y-0.5 ${minutes === value ? "bg-pink" : "bg-cream"}`}
              >
                {value}m
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Toggle label="Seated only" checked={seated} set={setSeated} />
            <Toggle label="Quiet indoor" checked={quiet} set={setQuiet} />
          </div>
          <motion.button
            onClick={spin}
            disabled={spinning}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            animate={spinning ? undefined : { boxShadow: ["0 0 0 0 #F35A2A", "0 0 0 10px rgba(243,90,42,0)"] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="app-button mt-5 w-full bg-orange text-xl disabled:opacity-50"
          >
            {spinning ? "SPINNING..." : spun ? "SPIN AGAIN" : "SPIN THE WHEEL"}
          </motion.button>
        </section>

        <section className="relative overflow-hidden border-2 border-ink bg-blue p-6 text-white shadow-[6px_6px_0_0_#181513]">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.title}
                initial={{ opacity: 0, scale: 0.7, rotate: -4 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 14 }}
              >
                {!reduced && <Confetti />}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`border-2 border-ink px-3 py-1 text-xs font-bold ${rarityStyle[selected.rarity]}`}>
                    {selected.rarity}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider">{selected.category}</span>
                  <motion.span
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="ms-auto border-2 border-ink bg-lime px-3 py-1 font-display text-lg text-ink"
                  >
                    +20 XP
                  </motion.span>
                </div>
                <h3 className="mt-4 font-display text-5xl uppercase leading-none text-lime">{selected.title}</h3>
                <p className="mt-3 border-s-4 border-yellow ps-3 font-bold text-yellow">{selected.cheer}</p>
                <p className="mt-5 text-lg font-medium">{selected.instruction}</p>
                <p className="mt-3 text-sm text-white/70">Modification: {selected.modification}</p>
                <div className="mt-8 border-2 border-white bg-ink p-5 text-center">
                  <div className="font-display text-7xl tabular-nums">{clock}</div>
                  <div className="mt-4 h-4 border-2 border-white">
                    <motion.div animate={{ width: `${progress}%` }} className="h-full bg-lime" />
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {!running && remaining === minutes * 60 && (
                      <button onClick={start} className="app-button bg-lime text-ink"><Play />Start</button>
                    )}
                    {running && (
                      <button onClick={pause} className="app-button bg-yellow text-ink"><Pause />Pause</button>
                    )}
                    {!running && remaining < minutes * 60 && !finished && (
                      <button onClick={start} className="app-button bg-lime text-ink"><Play />Resume</button>
                    )}
                    <button onClick={stop} className="app-button bg-white text-ink"><Square />Stop</button>
                    <button onClick={spin} disabled={running} className="app-button bg-pink text-ink"><RotateCcw />Replace</button>
                  </div>
                </div>
                {finished && (
                  <motion.div
                    initial={{ scale: 0.8, rotate: -3 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 12 }}
                    className="relative mt-5 border-2 border-ink bg-lime p-5 text-ink"
                  >
                    {!reduced && <Confetti />}
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 0.7, repeat: Infinity }}>
                      <CheckCircle2 className="h-10 w-10" />
                    </motion.div>
                    <h4 className="mt-2 font-display text-3xl uppercase">Timer complete. Boom.</h4>
                    <p className="mt-2 font-medium">Did you complete the activity?</p>
                    <button onClick={confirm} className="app-button mt-4 bg-pink">Yes, award XP once</button>
                  </motion.div>
                )}
              </motion.div>
            ) : crushed ? (
              <motion.div
                key="crushed"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
                className="relative grid min-h-[500px] place-items-center text-center"
              >
                {!reduced && <Confetti />}
                <div>
                  <motion.div
                    animate={{ rotate: [-8, 8, -8], scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="mx-auto grid h-28 w-28 place-items-center rounded-full border-4 border-ink bg-yellow text-ink"
                  >
                    <Trophy className="h-16 w-16" />
                  </motion.div>
                  <strong className="mt-5 block font-display text-5xl text-lime">MISSION CRUSHED!</strong>
                  <p className="mt-3 text-lg font-bold">+20 XP banked. {done >= goal ? "Daily goal smashed. Legend." : `${goal - done} more to hit today's goal.`}</p>
                  <button onClick={spin} className="app-button mt-6 bg-orange text-ink"><Zap />Spin again</button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="idle" exit={{ opacity: 0 }} className="grid min-h-[500px] place-items-center text-center">
                <div>
                  <motion.strong
                    animate={spinning ? { scale: [1, 1.1, 1] } : undefined}
                    transition={{ duration: 0.4, repeat: Infinity }}
                    className="block font-display text-4xl text-lime"
                  >
                    {spinning ? "HERE IT COMES..." : "AWAITING CHAOS."}
                  </motion.strong>
                  <p className="mt-3">Configure, spin, then decide whether the result suits you.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </ToolLayout>
  );
};

const Toggle = ({ label, checked, set }: { label: string; checked: boolean; set: (value: boolean) => void }) => (
  <button
    onClick={() => set(!checked)}
    className={`min-h-11 border-2 border-ink px-3 font-bold transition-transform hover:-translate-y-0.5 ${checked ? "bg-lime" : "bg-white"}`}
  >
    {label}
  </button>
);
