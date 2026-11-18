import { useState } from "react";
import { CheckCircle2, Moon, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useAppDataContext } from "@/components/app/AppDataContext";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { createToolEvent } from "@/lib/tools/tool-events";
import { useI18n } from "@/i18n/config";
import { deleteToolEvent, loadToolEvents } from "@/lib/storage";
import type { LocalProfile } from "@/types/profile";
import { evaluateCravingPolicy } from "@/lib/craving-policy";

const situations = [
  "Genuinely hungry",
  "Craving something",
  "Working a night shift",
  "Bored",
  "Haven't eaten for hours",
  "Want to sleep",
  "Not sure",
] as const;
type Decision = {
  finding: string;
  action: string;
  alternative: string;
  why: string;
};
const decisions: Record<string, Decision> = {
  "Genuinely hungry": {
    finding: "You report genuine hunger.",
    action: "Consider a satisfying meal or snack using food available to you.",
    alternative:
      "Choose a simple option with protein, fibre, or both if that suits you.",
    why: "Hunger is information, not a disciplinary hearing.",
  },
  "Craving something": {
    finding: "This sounds more like a craving than urgent hunger.",
    action:
      "If you ate recently and bedtime is close, skip the snack and go to sleep.",
    alternative: "If hunger grows or feels physical, reassess it honestly.",
    why: "A craving is a suggestion, not a court order.",
  },
  "Working a night shift": {
    finding: "You're awake for work, so 4 AM belongs to your schedule.",
    action: "Consider a meal or snack that fits your working day.",
    alternative: "Plan one easy option for the next shift.",
    why: "Clock time alone does not make eating abnormal.",
  },
  Bored: {
    finding: "Food may be competing with boredom.",
    action: "Close the kitchen and change the activity for five minutes.",
    alternative:
      "If physical hunger remains, reassess without the boredom costume.",
    why: "Your fridge is not an entertainment subscription.",
  },
  "Haven't eaten for hours": {
    finding: "Several hours have passed since food.",
    action: "Consider eating something satisfying and practical.",
    alternative: "Start with an available snack while planning your next meal.",
    why: "Skipping more food is not a prize.",
  },
  "Want to sleep": {
    finding: "Sleep is the plan, not another fridge meeting.",
    action:
      "If you ate recently and aren't physically hungry, put the phone away and sleep.",
    alternative:
      "If you are genuinely hungry, reassess instead of forcing sleep through it.",
    why: "Habitual snacking does not need a bedtime encore.",
  },
  "Not sure": {
    finding: "The evidence is inconclusive.",
    action: "Rate your hunger from 1–10 and name what food sounds satisfying.",
    alternative: "Pause briefly and check again.",
    why: "One clarifying question beats a dramatic verdict.",
  },
};
const minutes = (value: string) => {
  const [hour = 0, minute = 0] = value.split(":").map(Number);
  return hour * 60 + minute;
};
const inWindow = (value: number, start: number, end: number) =>
  start <= end
    ? value >= start && value <= end
    : value >= start || value <= end;
export const decideMidnightFood = (
  situation: string,
  lastMeal: string,
  profile: Pick<LocalProfile, "schedule" | "sleepTime" | "wakeTime">,
  now = new Date(),
): Decision => {
  const current = now.getHours() * 60 + now.getMinutes();
  const bedtime = inWindow(
    current,
    (minutes(profile.sleepTime) - 120 + 1440) % 1440,
    minutes(profile.wakeTime),
  );
  const elapsed = lastMeal
    ? (current - minutes(lastMeal) + 1440) % 1440
    : Number.POSITIVE_INFINITY;
  const policy = evaluateCravingPolicy(
    `${situation}. ${elapsed <= 180 ? "I just ate." : ""} ${bedtime ? "It is bedtime and I want to sleep." : ""}`,
    profile,
  );
  if (policy.intent === "night_shift")
    return decisions["Working a night shift"];
  if (policy.approach === "bedtime_shutdown")
    return {
      finding: "You ate recently. The fridge is filing a duplicate request.",
      action:
        "Skip the unnecessary snack, put the phone away, and go to sleep.",
      alternative:
        "If clear physical hunger appears, reassess it instead of guessing.",
      why: "Bedtime boredom does not need catering.",
    };
  return decisions[situation] ?? decisions["Not sure"];
};
export const MidnightFoodPage = () => {
  const { profile } = useAppDataContext();
  const { locale } = useI18n();
  const [situation, setSituation] = useState("");
  const [lastMeal, setLastMeal] = useState("");
  const [available, setAvailable] = useState("");
  const [result, setResult] = useState<Decision | null>(null);
  const [savedDecisionId, setSavedDecisionId] = useState("");
  const [history, setHistory] = useState(() =>
    loadToolEvents().events.filter((item) => item.tool === "midnight-food"),
  );
  const investigate = () => {
    if (!situation) return;
    setResult(decideMidnightFood(situation, lastMeal, profile));
  };
  const save = () => {
    if (!result) return;
    const event = createToolEvent(
      "food_decision_recorded",
      "midnight-food",
      situation,
      {
        situation,
        action: result.action,
        schedule: profile.schedule,
        lastMealKnown: Boolean(lastMeal),
      },
    );
    setSavedDecisionId(event.id);
    setHistory(
      loadToolEvents().events.filter((item) => item.tool === "midnight-food"),
    );
  };
  return (
    <ToolLayout
      number="01"
      title="MIDNIGHT FOOD RESCUE"
      tagline="THE FRIDGE INCIDENT."
      color="bg-pink"
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <section className="border-2 border-ink bg-white p-5 md:p-7">
          <Moon className="h-12 w-12" />
          <h3 className="mt-4 font-display text-3xl uppercase">
            What actually happened?
          </h3>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {situations.map((item) => (
              <button
                key={item}
                onClick={() => setSituation(item)}
                className={`min-h-12 border-2 border-ink p-3 text-start font-bold ${situation === item ? "bg-lime shadow-[3px_3px_0_var(--ink)]" : "bg-cream"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="font-bold">
              Last meal time <span className="font-normal">(optional)</span>
              <input
                type="time"
                className="brand-input"
                value={lastMeal}
                onChange={(event) => setLastMeal(event.target.value)}
              />
            </label>
            <label className="font-bold">
              Available options <span className="font-normal">(optional)</span>
              <input
                className="brand-input"
                maxLength={120}
                value={available}
                onChange={(event) => setAvailable(event.target.value)}
                placeholder="Toast, yoghurt, leftovers..."
              />
            </label>
          </div>
          <p className="mt-4 text-sm">
            Saved schedule: <strong>{profile.schedule}</strong>
          </p>
          <button
            disabled={!situation}
            onClick={investigate}
            className="app-button mt-6 bg-lime disabled:opacity-40"
          >
            Investigate
          </button>
        </section>
        {result ? (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-ink bg-yellow p-6 shadow-[6px_6px_0_var(--ink)]"
          >
            <p className="text-xs font-bold uppercase tracking-wider">
              Case · The Midnight Fridge
            </p>
            <h3 className="mt-3 font-display text-4xl uppercase">
              INVESTIGATION COMPLETE
            </h3>
            <Result label="Finding" value={result.finding} />
            <Result label="Action" value={result.action} />
            <Result label="Alternative" value={result.alternative} />
            <Result label="Why" value={result.why} />
            <button onClick={save} className="app-button mt-6 bg-pink">
              <CheckCircle2 />
              Save decision
            </button>
            {savedDecisionId && (
              <button
                onClick={() => {
                  createToolEvent(
                    "craving_action_completed",
                    "midnight-food",
                    savedDecisionId,
                    { situation, action: result.action, outcome: "completed" },
                    `craving-complete-${savedDecisionId}`,
                  );
                  setHistory(
                    loadToolEvents().events.filter(
                      (item) => item.tool === "midnight-food",
                    ),
                  );
                }}
                className="app-button mt-3 bg-lime"
              >
                <CheckCircle2 />I did the action
              </button>
            )}
          </motion.section>
        ) : (
          <section className="grid min-h-72 place-items-center border-2 border-dashed border-ink p-8 text-center">
            <strong className="font-display text-3xl">
              SELECT THE INCIDENT.
            </strong>
          </section>
        )}
      </div>
      {history.length > 0 && (
        <section className="border-2 border-ink bg-white p-5">
          <h3 className="font-display text-3xl uppercase">
            LOCAL CASE HISTORY
          </h3>
          <div className="mt-4 space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border-t border-ink pt-2"
              >
                <span className="text-sm font-bold">
                  {String(item.metadata.situation)} ·{" "}
                  {new Date(item.timestamp).toLocaleDateString(locale)}
                </span>
                <button
                  aria-label="Delete decision"
                  onClick={() => {
                    deleteToolEvent(item.id);
                    setHistory(
                      loadToolEvents().events.filter(
                        (event) => event.tool === "midnight-food",
                      ),
                    );
                  }}
                  className="grid h-11 w-11 place-items-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </ToolLayout>
  );
};
const Result = ({ label, value }: { label: string; value: string }) => (
  <div className="mt-4 border-t-2 border-ink pt-3">
    <span className="text-xs font-bold uppercase">{label}</span>
    <p className="mt-1 font-medium">{value}</p>
  </div>
);
