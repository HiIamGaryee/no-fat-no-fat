import { useState } from "react";
import { Trophy } from "lucide-react";
import { useAppDataContext } from "@/components/app/AppDataContext";
import { achievementCatalog } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/config";
import { loadToolEvents } from "@/lib/storage";

const filters = [
  { id: 7, label: "7 days" },
  { id: 30, label: "30 days" },
  { id: 0, label: "All time" },
] as const;
export const ProgressPage = () => {
  const { locale } = useI18n();
  const { store, progress, totalXP, level } = useAppDataContext();
  const [days, setDays] = useState(7);
  const cutoff = days ? new Date(Date.now() - days * 86400000) : null;
  const completed = store.missions.filter(
    (item) =>
      item.completedAt && (!cutoff || new Date(item.completedAt) >= cutoff),
  );
  const activeDays = new Set(completed.map((item) => item.day));
  const counts = completed.reduce<Record<string, number>>(
    (acc, item) => ({ ...acc, [item.category]: (acc[item.category] ?? 0) + 1 }),
    {},
  );
  const top =
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None yet";
  const unlocked = new Set(progress.achievements.map((item) => item.id));
  const cravingEvents = loadToolEvents().events.filter(
    (item) => item.type === "food_decision_recorded",
  );
  const cravingCompletions = loadToolEvents().events.filter(
    (item) => item.type === "craving_action_completed",
  );
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            onClick={() => setDays(item.id)}
            className={cn(
              "min-h-11 border-2 border-ink px-4 font-bold uppercase",
              days === item.id
                ? "bg-lime shadow-[3px_3px_0_var(--ink)]"
                : "bg-white",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total XP", value: totalXP, color: "bg-blue text-white" },
          { label: "Level", value: level.current.level, color: "bg-pink" },
          { label: "Completed", value: completed.length, color: "bg-lime" },
          { label: "Active days", value: activeDays.size, color: "bg-yellow" },
        ].map((item) => (
          <article
            key={item.label}
            className={`${item.color} border-2 border-ink p-5`}
          >
            <p className="text-xs font-bold uppercase">{item.label}</p>
            <strong className="mt-4 block font-display text-6xl">
              {item.value}
            </strong>
          </article>
        ))}
      </div>
      <section className="border-2 border-ink bg-white p-6">
        <h2 className="font-display text-4xl uppercase">WEEKLY ACTIVITY</h2>
        {completed.length ? (
          <>
            <div className="mt-6 grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, index) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - index));
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                const count = completed.filter(
                  (item) => item.day === key,
                ).length;
                return (
                  <div key={key} className="text-center">
                    <div
                      className={cn(
                        "grid h-20 place-items-center border-2 border-ink font-display text-2xl",
                        count ? "bg-lime" : "bg-cream",
                      )}
                    >
                      {count}
                    </div>
                    <span className="mt-2 block text-[10px] font-bold uppercase">
                      {date.toLocaleDateString(locale, { weekday: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-5 text-sm font-bold">
              Most completed category:{" "}
              <span className="uppercase text-blue">{top}</span>
            </p>
          </>
        ) : (
          <Empty />
        )}
      </section>
      <section className="border-2 border-ink bg-yellow p-6">
        <h2 className="font-display text-4xl uppercase">CRAVING ACTIONS</h2>
        <p className="mt-2 text-sm">
          Verified local records only. Choosing an action and completing it are
          counted separately.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            { label: "Actions chosen", value: cravingEvents.length },
            { label: "Confirmed outcomes", value: cravingCompletions.length },
          ].map((item) => (
            <article
              key={item.label}
              className="border-2 border-ink bg-white p-4"
            >
              <span className="text-xs font-bold uppercase">{item.label}</span>
              <strong className="mt-2 block font-display text-5xl">
                {item.value}
              </strong>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-5 font-display text-4xl uppercase">
          MISSION HISTORY
        </h2>
        {completed.length ? (
          <div className="space-y-2">
            {completed
              .slice()
              .reverse()
              .map((item) => (
                <article
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-white p-4"
                >
                  <div>
                    <strong>{item.title}</strong>
                    <p className="text-xs uppercase text-ink/60">
                      {item.category} · {item.day}
                    </p>
                  </div>
                  <span className="font-bold text-blue">+{item.xp} XP</span>
                </article>
              ))}
          </div>
        ) : (
          <Empty />
        )}
      </section>
      <section>
        <h2 className="mb-5 font-display text-4xl uppercase">ACHIEVEMENTS</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievementCatalog.map((item) => (
            <article
              key={item.id}
              className={cn(
                "border-2 border-ink p-5",
                unlocked.has(item.id) ? "bg-yellow" : "bg-white opacity-45",
              )}
            >
              <Trophy />
              <strong className="mt-4 block font-display text-2xl">
                {item.title}
              </strong>
              <p className="mt-2 text-sm">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
      <p className="text-xs text-ink/60">
        Participation records reflect completed actions only and do not prove
        medical improvement.
      </p>
    </div>
  );
};
const Empty = () => (
  <div className="mt-5 border-2 border-dashed border-ink p-8 text-center">
    <strong className="font-display text-2xl">NO EVIDENCE YET.</strong>
    <p className="mt-2 text-sm">
      Complete a mission. We promise not to act surprised.
    </p>
  </div>
);
