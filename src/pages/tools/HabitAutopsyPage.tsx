import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileSearch, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { useAppDataContext } from "@/components/app/AppDataContext";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { sendChatMessage, toChatProfile } from "@/lib/chat";
import { localDay } from "@/lib/missions";
import {
  createToolEvent,
  unlockToolAchievement,
} from "@/lib/tools/tool-events";
import type { Mission, MissionCategory } from "@/types/app";

const habits = [
  "Movement",
  "Sleep schedule",
  "Hydration reminder",
  "Meal planning",
  "Snack cravings",
  "Daily routine",
  "Other",
] as const;
const incidents = [
  "Missed once",
  "Missed several days",
  "Difficult to schedule",
  "Too tired",
  "Lost interest",
  "Forgot",
  "Goal was unrealistic",
  "Routine changed",
  "Late-night boredom",
  "Delivery-app checking",
  "Stress snacking",
  "Sleep disruption",
  "Other",
] as const;
const barriers = [
  "Work gets busy",
  "I forget",
  "I feel tired",
  "I get distracted",
  "I'm bored",
  "I'm stressed",
  "I don't enjoy it",
  "I don't know",
] as const;
export const HabitAutopsyPage = () => {
  const { store, profile, addMission } = useAppDataContext();
  const [habit, setHabit] = useState("");
  const [incident, setIncident] = useState("");
  const [barrier, setBarrier] = useState("");
  const [report, setReport] = useState(false);
  const [verdict, setVerdict] = useState("");
  const [params] = useSearchParams();
  const related = store.missions.filter((item) =>
    habit === "Movement"
      ? item.category === "movement"
      : habit === "Sleep schedule"
        ? item.category === "sleep"
        : habit === "Hydration reminder"
          ? item.category === "hydration"
          : true,
  );
  const completed = related.filter(
    (item) => item.status === "completed",
  ).length;
  const skipped = related.filter((item) => item.status === "skipped").length;
  const adjustment =
    habit === "Snack cravings"
      ? "Close the delivery app or kitchen, then do one non-food activity for two minutes."
      : incident === "Goal was unrealistic" || incident === "Too tired"
        ? "Reduce the next action to two minutes."
        : incident === "Difficult to schedule" || incident === "Routine changed"
          ? `Move it to a time that fits your ${profile.schedule} schedule.`
          : "Attach a tiny version to something you already do.";
  const investigate = () => {
    if (habit && incident && barrier) {
      setReport(true);
      setVerdict("");
      sendChatMessage({
        message: `Habit autopsy. Habit: ${habit}. What happened: ${incident}. Usual barrier: ${barrier}. Records: ${related.length} related missions, ${completed} completed, ${skipped} skipped.${params.get("context") ? ` User said: ${params.get("context")}.` : ""} Give the autopsy verdict in your roast voice, then one tiny recovery step. Do not suggest an action.`,
        history: [],
        profile: toChatProfile(profile),
      })
        .then((result) => setVerdict(result.text))
        .catch(() =>
          setVerdict("The coroner is on a break. The facts above still stand."),
        );
      createToolEvent("habit_investigation_completed", "habit-autopsy", habit, {
        habit,
        incident,
        barrier,
        completed,
        skipped,
      });
      unlockToolAchievement("pattern-detected");
    }
  };
  const recovery = () => {
    const reference = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    const category: MissionCategory =
      habit === "Movement"
        ? "movement"
        : habit === "Sleep schedule"
          ? "sleep"
          : habit === "Hydration reminder"
            ? "hydration"
            : "routine";
    const mission: Mission = {
      id: `recovery-${reference}`,
      day: localDay(),
      category,
      title:
        habit === "Snack cravings" ? "DELIVERY APP DETOX" : "THE COMEBACK FILE",
      description: adjustment,
      minutes: 2,
      xp: 15,
      status: "available",
      completedAt: null,
    };
    addMission(mission);
    createToolEvent("recovery_action_created", "habit-autopsy", mission.id, {
      habit,
      adjustment,
    });
  };
  return (
    <ToolLayout
      number="05"
      title="HABIT AUTOPSY"
      tagline="WHO KILLED YOUR ROUTINE?"
      color="bg-blue text-white"
    >
      <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
        <section className="space-y-5 border-2 border-ink bg-white p-5">
          <Choice title="Habit" items={habits} value={habit} set={setHabit} />
          <Choice
            title="What happened?"
            items={incidents}
            value={incident}
            set={setIncident}
          />
          <Choice
            title="What usually gets in the way?"
            items={barriers}
            value={barrier}
            set={setBarrier}
          />
          <button
            disabled={!habit || !incident || !barrier}
            onClick={investigate}
            className="app-button bg-pink disabled:opacity-40"
          >
            <FileSearch />
            Open report
          </button>
        </section>
        {report ? (
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="border-2 border-ink bg-cream p-6 shadow-[6px_6px_0_var(--ink)]"
          >
            <p className="text-xs font-bold uppercase">
              Autopsy report · facts first
            </p>
            <h3 className="mt-3 font-display text-4xl uppercase">
              THE MISSING {habit}
            </h3>
            <Report
              label="Recorded fact"
              value={`${related.length} related mission records: ${completed} completed and ${skipped} skipped.`}
            />
            <Report
              label="Your explanation"
              value={`${incident}; barrier selected: ${barrier}.`}
            />
            <div className="mt-5 border-t-2 border-ink pt-3">
              <span className="text-xs font-bold uppercase">
                Cause of death
              </span>
              <p className="mt-1 whitespace-pre-wrap font-medium">
                {verdict || "Dissecting your excuses..."}
              </p>
            </div>
            <Report label="Possible adjustment" value={adjustment} />
            <p className="mt-4 text-xs">
              The adjustment is a practical hypothesis, not a psychological
              diagnosis.
            </p>
            <button onClick={recovery} className="app-button mt-6 bg-lime">
              <RotateCcw />
              Create 2-min recovery mission
            </button>
          </motion.section>
        ) : (
          <section className="grid min-h-80 place-items-center border-2 border-dashed border-ink p-8 text-center">
            <strong className="font-display text-3xl">
              NO BODY. NO AUTOPSY.
            </strong>
          </section>
        )}
      </div>
    </ToolLayout>
  );
};
const Choice = ({
  title,
  items,
  value,
  set,
}: {
  title: string;
  items: readonly string[];
  value: string;
  set: (value: string) => void;
}) => (
  <fieldset>
    <legend className="mb-2 font-bold">{title}</legend>
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          onClick={() => set(item)}
          className={`min-h-11 border-2 border-ink px-3 font-bold ${value === item ? "bg-lime" : "bg-cream"}`}
        >
          {item}
        </button>
      ))}
    </div>
  </fieldset>
);
const Report = ({ label, value }: { label: string; value: string }) => (
  <div className="mt-5 border-t-2 border-ink pt-3">
    <span className="text-xs font-bold uppercase">{label}</span>
    <p className="mt-1 font-medium">{value}</p>
  </div>
);
