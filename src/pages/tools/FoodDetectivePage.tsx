import { useState } from "react";
import { Bot, LoaderCircle, Save, Scale } from "lucide-react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router-dom";
import { useAppDataContext } from "@/components/app/AppDataContext";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { Select } from "@/components/ui/select";
import { sendChatMessage, toChatProfile } from "@/lib/chat";
import { createToolEvent } from "@/lib/tools/tool-events";

interface Food {
  name: string;
  basis: string;
  energy: string;
  protein: string;
  carbs: string;
  sugar: string;
  fat: string;
  sodium: string;
}

const nutrients = [
  { key: "energy", label: "Energy", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbohydrate", unit: "g" },
  { key: "sugar", label: "Sugar", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "sodium", label: "Sodium", unit: "mg" },
] as const;

const emptyFood = (name: string): Food => ({
  name,
  basis: "per 100 g/ml",
  energy: "",
  protein: "",
  carbs: "",
  sugar: "",
  fat: "",
  sodium: "",
});

const factualFood = (food: Food) => ({
  name: food.name.trim().slice(0, 80),
  basis: food.basis,
  nutrients: Object.fromEntries(
    nutrients.map(({ key, unit }) => [
      key,
      food[key] === "" ? null : { value: Number(food[key]), unit },
    ]),
  ),
});

export const FoodDetectivePage = () => {
  const { profile } = useAppDataContext();
  const [params] = useSearchParams();
  const cravingContext = (params.get("context") ?? "").slice(0, 300);
  const [foodA, setFoodA] = useState<Food>(emptyFood("Food A"));
  const [foodB, setFoodB] = useState<Food>(emptyFood("Food B"));
  const [compared, setCompared] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (side: "a" | "b", key: keyof Food, value: string) => {
    const setFood = side === "a" ? setFoodA : setFoodB;
    setFood((current) => ({ ...current, [key]: value }));
    setCompared(false);
    setExplanation("");
  };

  const valid = nutrients.some(
    ({ key }) => foodA[key] !== "" && foodB[key] !== "",
  );

  const explain = async () => {
    setLoading(true);
    setExplanation("");
    const facts = { foodA: factualFood(foodA), foodB: factualFood(foodB) };
    try {
      const response = await sendChatMessage({
        message: `Compare these nutrition labels using only the supplied facts: ${JSON.stringify(facts)}. State clearly whether Food A or Food B better fits the user's stated nutrition goal, if one is provided. If no goal is provided, summarize the meaningful differences and say that neither is universally healthier; explain that the better fit depends on the person's needs and serving size. State that missing values are unknown, distinguish label observations from suggestions, and never invent values. Do not say anyone must eat either food. Keep the answer concise.${cravingContext ? ` User context: ${cravingContext}. If they want help interrupting a habitual craving, do not turn this into replacement-food suggestions.` : ""}`,
        history: [],
        profile: toChatProfile(profile),
      });
      setExplanation(response.text);
    } catch {
      setExplanation(
        "Gemini is unavailable. The factual comparison remains above; no AI explanation was generated.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolLayout
      number="03"
      title="FOOD DETECTIVE"
      tagline="YOUR FOOD HAS BEEN QUESTIONED."
      color="bg-yellow"
    >
      <section className="border-2 border-ink bg-white p-5">
        <div className="mb-5 border-s-4 border-blue ps-4 text-sm">
          <strong>Manual nutrition-label mode.</strong> Enter factual values
          from product labels on the same stated basis. Missing values stay
          missing.
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          {(["a", "b"] as const).map((side, index) => {
            const food = side === "a" ? foodA : foodB;
            return (
              <fieldset
                key={side}
                className={`border-2 border-ink p-5 ${index ? "bg-pink" : "bg-lime"}`}
              >
                <legend className="px-2 font-display text-3xl">
                  FOOD {side.toUpperCase()}
                </legend>
                <label className="font-bold">
                  Name
                  <input
                    className="brand-input"
                    value={food.name}
                    maxLength={80}
                    onChange={(event) =>
                      update(side, "name", event.target.value)
                    }
                  />
                </label>
                <label className="mt-4 block font-bold">
                  Comparison basis
                  <Select
                    value={food.basis}
                    onChange={(basis) => update(side, "basis", basis)}
                    options={["per 100 g/ml", "per declared serving"].map(
                      (basis) => ({ value: basis, label: basis }),
                    )}
                  />
                </label>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {nutrients.map(({ key, label, unit }) => (
                    <label key={key} className="text-sm font-bold">
                      {label} ({unit})
                      <input
                        className="brand-input"
                        type="number"
                        min="0"
                        step="any"
                        value={food[key]}
                        onChange={(event) =>
                          update(side, key, event.target.value)
                        }
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </div>
        {foodA.basis !== foodB.basis && (
          <p
            role="alert"
            className="mt-4 border-2 border-orange bg-orange/10 p-3 font-bold"
          >
            Choose the same basis before comparing.
          </p>
        )}
        <button
          disabled={!valid || foodA.basis !== foodB.basis}
          onClick={() => setCompared(true)}
          className="app-button mt-6 bg-blue text-white disabled:opacity-40"
        >
          <Scale />
          Compare labels
        </button>
      </section>

      {compared && (
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-ink bg-ink p-5 text-white"
        >
          <h3 className="font-display text-4xl text-yellow">
            THE NUTRITION SHOWDOWN
          </h3>
          <p className="mt-2 text-sm">
            Basis: {foodA.basis}. Source: values manually supplied from
            nutrition labels.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr>
                  <th className="comparison-cell text-start">Nutrient</th>
                  <th className="comparison-cell">{foodA.name}</th>
                  <th className="comparison-cell">{foodB.name}</th>
                  <th className="comparison-cell">Difference</th>
                </tr>
              </thead>
              <tbody>
                {nutrients.map(({ key, label, unit }) => {
                  const valueA = foodA[key] === "" ? null : Number(foodA[key]);
                  const valueB = foodB[key] === "" ? null : Number(foodB[key]);
                  return (
                    <tr key={key}>
                      <th className="comparison-cell text-start">{label}</th>
                      <td className="comparison-cell">
                        {valueA === null ? "Missing" : `${valueA} ${unit}`}
                      </td>
                      <td className="comparison-cell">
                        {valueB === null ? "Missing" : `${valueB} ${unit}`}
                      </td>
                      <td className="comparison-cell">
                        {valueA === null || valueB === null
                          ? "Not comparable"
                          : `${Math.abs(valueA - valueB).toFixed(1)} ${unit}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-5 max-w-3xl text-sm">
            These numbers describe differences, not moral value. Which option
            fits depends on your needs, serving size and overall eating pattern.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() =>
                createToolEvent(
                  "food_comparison_saved",
                  "food-detective",
                  `${foodA.name}-${foodB.name}`,
                  { foodA: foodA.name, foodB: foodB.name, basis: foodA.basis },
                )
              }
              className="app-button bg-lime text-ink"
            >
              <Save />
              Save comparison
            </button>
            <button
              onClick={explain}
              disabled={loading}
              className="app-button bg-pink text-ink disabled:opacity-40"
            >
              {loading ? <LoaderCircle className="animate-spin" /> : <Bot />}
              Explain these facts
            </button>
          </div>
          {explanation && (
            <div className="mt-5 whitespace-pre-wrap border-2 border-white bg-cream p-4 text-ink">
              {explanation}
            </div>
          )}
        </motion.section>
      )}
    </ToolLayout>
  );
};
