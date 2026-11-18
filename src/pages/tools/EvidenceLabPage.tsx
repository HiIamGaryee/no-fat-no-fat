import { useMemo, useState } from "react";
import { Bot, ChartNoAxesColumnIncreasing, LoaderCircle } from "lucide-react";
import { motion } from "motion/react";
import { useAppDataContext } from "@/components/app/AppDataContext";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { sendChatMessage, toChatProfile } from "@/lib/chat";
import { loadToolEvents } from "@/lib/storage";
import { createToolEvent } from "@/lib/tools/tool-events";
import { cn } from "@/lib/utils";

const filters = [7, 30, 0] as const;
export const EvidenceLabPage = () => {
  const { profile, store, totalXP, level } = useAppDataContext();
  const events = loadToolEvents().events;
  const [days, setDays] = useState<number>(7);
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const missions = useMemo(() => {
    if (!days) return store.missions;
    const cutoff = Date.now() - (days - 1) * 86400000;
    return store.missions.filter(
      (item) => new Date(`${item.day}T00:00:00`).getTime() >= cutoff,
    );
  }, [days, store.missions]);
  const completed = missions.filter((item) => item.status === "completed");
  const activeDays = new Set(completed.map((item) => item.day));
  const rate = missions.length
    ? Math.round((completed.length / missions.length) * 100)
    : 0;
  const categories = completed.reduce<Record<string, number>>(
    (acc, item) => ({ ...acc, [item.category]: (acc[item.category] ?? 0) + 1 }),
    {},
  );
  const topCategory =
    Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None";
  const barriers = events.reduce<Record<string, number>>((acc, item) => {
    const value =
      typeof item.metadata.barrier === "string"
        ? item.metadata.barrier
        : typeof item.metadata.excuse === "string"
          ? item.metadata.excuse
          : "";
    return value ? { ...acc, [value]: (acc[value] ?? 0) + 1 } : acc;
  }, {});
  const topBarrier =
    Object.entries(barriers).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "None recorded";
  const recoveries = events.filter(
    (item) => item.type === "recovery_action_created",
  );
  const cravingEvents = events.filter(
    (item) =>
      item.type === "food_decision_recorded" &&
      ["Craving something", "Bored", "Want to sleep"].includes(
        String(item.metadata.situation),
      ),
  );
  const cravingTriggers = cravingEvents.reduce<Record<string, number>>(
    (acc, item) => {
      const trigger = String(item.metadata.situation ?? "Not recorded");
      return { ...acc, [trigger]: (acc[trigger] ?? 0) + 1 };
    },
    {},
  );
  const cravingActions = cravingEvents.filter(
    (item) => typeof item.metadata.action === "string",
  );
  const confirmedOutcomes = events.filter(
    (item) => item.type === "craving_action_completed",
  );
  const investigate = async () => {
    setLoading(true);
    setInsight("");
    const summary = {
      period: days || "all",
      assigned: missions.length,
      completed: completed.length,
      activeDays: activeDays.size,
      completionRate: rate,
      categoryCounts: categories,
      topBarrier,
      recoveryActions: recoveries.length,
      cravingEpisodes: cravingEvents.length,
      cravingActionsChosen: cravingActions.length,
      cravingActionsCompleted: confirmedOutcomes.length,
      cravingTriggers,
    };
    try {
      const response = await sendChatMessage({
        message: `Evidence Lab analysis. Use only these aggregated facts: ${JSON.stringify(summary)}. Give one observation, clearly label one possible hypothesis, and suggest one small next experiment. Do not claim health improvement.`,
        history: [],
        profile: toChatProfile(profile),
      });
      setInsight(response.text);
      createToolEvent("evidence_reviewed", "evidence-lab", String(Date.now()), {
        period: String(days || "all"),
        completed: completed.length,
      });
    } catch {
      setInsight(
        "Gemini is unavailable. Your local evidence remains visible; no AI insight was generated.",
      );
    } finally {
      setLoading(false);
    }
  };
  const calendar = Array.from(
    { length: days === 7 ? 7 : days === 30 ? 30 : 30 },
    (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - ((days === 7 ? 6 : 29) - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return {
        key,
        count: completed.filter((item) => item.day === key).length,
      };
    },
  );
  return (
    <ToolLayout
      number="06"
      title={"THE RECEIPTS\nDON'T LIE."}
      tagline="ACTUAL RECORDS. NO IMAGINARY VICTORIES."
      color="bg-ink text-white"
    >
      <div className="flex flex-wrap gap-2">
        {filters.map((value) => (
          <button
            key={value}
            onClick={() => setDays(value)}
            className={cn(
              "min-h-11 border-2 border-ink px-4 font-bold",
              days === value ? "bg-lime" : "bg-white",
            )}
          >
            {value ? `Last ${value} days` : "All time"}
          </button>
        ))}
      </div>
      <section className="border-2 border-ink bg-yellow p-5">
        <h3 className="font-display text-3xl">CRAVING EVIDENCE</h3>
        <p className="mt-2 text-sm">
          Self-reported records only. A chosen action is not counted as a
          successful outcome unless you confirmed it.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Reported episodes", value: cravingEvents.length },
            { label: "Actions chosen", value: cravingActions.length },
            { label: "Confirmed outcomes", value: confirmedOutcomes.length },
          ].map((item) => (
            <article
              key={item.label}
              className="border-2 border-ink bg-white p-4"
            >
              <span className="text-xs font-bold uppercase">{item.label}</span>
              <strong className="mt-2 block font-display text-4xl">
                {item.value}
              </strong>
            </article>
          ))}
        </div>
        <Chart title="REPORTED CRAVING TRIGGERS" data={cravingTriggers} />
      </section>
      {missions.length === 0 ? (
        <div className="border-2 border-dashed border-ink p-12 text-center">
          <ChartNoAxesColumnIncreasing className="mx-auto h-16 w-16" />
          <h3 className="mt-4 font-display text-4xl">NO EVIDENCE YET.</h3>
          <p className="mt-2">Even detectives need something to work with.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Completed missions",
                value: completed.length,
                color: "bg-lime",
              },
              {
                label: "Active days",
                value: activeDays.size,
                color: "bg-pink",
              },
              {
                label: "Completion rate",
                value: `${rate}%`,
                color: "bg-yellow",
              },
              {
                label: "XP / Level",
                value: `${totalXP} / ${level.current.level}`,
                color: "bg-blue text-white",
              },
            ].map((item) => (
              <motion.article
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.label}
                className={`${item.color} border-2 border-ink p-5`}
              >
                <span className="text-xs font-bold uppercase">
                  {item.label}
                </span>
                <strong className="mt-3 block font-display text-5xl">
                  {item.value}
                </strong>
                {item.label === "Completion rate" && (
                  <p className="mt-2 text-[10px]">
                    Completed ÷ assigned missions in period
                  </p>
                )}
              </motion.article>
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <Chart title="MISSION CATEGORIES" data={categories} />
            <Chart title="EXCUSE PATTERNS" data={barriers} />
            <section className="border-2 border-ink bg-white p-5">
              <h3 className="font-display text-3xl">PERSONAL CONSISTENCY</h3>
              <div className="mt-5 grid grid-cols-7 gap-1.5">
                {calendar.map((day) => (
                  <div
                    key={day.key}
                    title={`${day.key}: ${day.count}`}
                    className={cn(
                      "aspect-square border border-ink",
                      day.count > 1
                        ? "bg-blue"
                        : day.count === 1
                          ? "bg-lime"
                          : "bg-cream",
                    )}
                  />
                ))}
              </div>
            </section>
            <section className="border-2 border-ink bg-orange p-5">
              <h3 className="font-display text-3xl">RECOVERY BEHAVIOUR</h3>
              <strong className="mt-4 block text-5xl">
                {recoveries.length}
              </strong>
              <p className="mt-2 text-sm">
                Recovery actions created. Most completed category:{" "}
                <strong>{topCategory}</strong>. Most reported barrier:{" "}
                <strong>{topBarrier}</strong>.
              </p>
            </section>
          </div>
        </>
      )}
      <section className="border-2 border-ink bg-pink p-5">
        <h3 className="font-display text-3xl">AI INVESTIGATION</h3>
        <p className="mt-2 text-sm">
          Only aggregated statistics shown above are sent.
        </p>
        <button
          onClick={investigate}
          disabled={loading || !missions.length}
          className="app-button mt-4 bg-ink text-white disabled:opacity-40"
        >
          {loading ? <LoaderCircle className="animate-spin" /> : <Bot />}Let the
          AI investigate
        </button>
        {insight && (
          <div className="mt-5 whitespace-pre-wrap border-2 border-ink bg-white p-4 font-medium">
            {insight}
          </div>
        )}
      </section>
    </ToolLayout>
  );
};
const Chart = ({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) => {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map((item) => item[1]));
  return (
    <section className="border-2 border-ink bg-white p-5">
      <h3 className="font-display text-3xl">{title}</h3>
      {entries.length ? (
        <div className="mt-5 space-y-3">
          {entries.map(([label, value]) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-xs font-bold uppercase">
                <span>{label}</span>
                <span>{value}</span>
              </div>
              <div className="h-5 border-2 border-ink bg-cream">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(value / max) * 100}%` }}
                  className="h-full bg-blue"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm">No recorded pattern yet.</p>
      )}
    </section>
  );
};
