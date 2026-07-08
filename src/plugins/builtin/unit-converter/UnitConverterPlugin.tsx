import { useMemo, useState } from "react";
import { ArrowRightLeft, Ruler } from "lucide-react";
import type { PluginModule } from "../../types";

type Category = "length" | "weight" | "temperature";

const LENGTH_UNITS: Record<string, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  in: 0.0254,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344,
};

const WEIGHT_UNITS: Record<string, number> = {
  mg: 0.000001,
  g: 0.001,
  kg: 1,
  t: 1000,
  oz: 0.0283495,
  lb: 0.453592,
};

const CATEGORY_LABELS: Record<Category, string> = { length: "長さ", weight: "重さ", temperature: "温度" };

function convertLinear(value: number, from: string, to: string, table: Record<string, number>): number {
  return (value * table[from]) / table[to];
}

function convertTemperature(value: number, from: string, to: string): number {
  let celsius: number;
  if (from === "C") celsius = value;
  else if (from === "F") celsius = ((value - 32) * 5) / 9;
  else celsius = value - 273.15;

  if (to === "C") return celsius;
  if (to === "F") return (celsius * 9) / 5 + 32;
  return celsius + 273.15;
}

function UnitConverterPage() {
  const [category, setCategory] = useState<Category>("length");
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("cm");

  const units = category === "length" ? Object.keys(LENGTH_UNITS) : category === "weight" ? Object.keys(WEIGHT_UNITS) : ["C", "F", "K"];

  const result = useMemo(() => {
    const num = parseFloat(value);
    if (Number.isNaN(num)) return "";
    if (category === "length") return convertLinear(num, from, to, LENGTH_UNITS).toLocaleString(undefined, { maximumFractionDigits: 6 });
    if (category === "weight") return convertLinear(num, from, to, WEIGHT_UNITS).toLocaleString(undefined, { maximumFractionDigits: 6 });
    return convertTemperature(num, from, to).toLocaleString(undefined, { maximumFractionDigits: 4 });
  }, [value, from, to, category]);

  function changeCategory(next: Category) {
    setCategory(next);
    const defaultUnits = next === "length" ? ["m", "cm"] : next === "weight" ? ["kg", "g"] : ["C", "F"];
    setFrom(defaultUnits[0]);
    setTo(defaultUnits[1]);
  }

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col gap-5 pt-6">
      <div className="flex gap-2">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
          <button
            key={c}
            onClick={() => changeCategory(c)}
            className={`app-no-drag rounded-lg px-4 py-2 text-sm transition-colors ${
              category === c ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
            }`}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="glass-panel space-y-4 rounded-xl2 p-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-500">数値</label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="app-no-drag w-full rounded-lg bg-black/5 px-3 py-2.5 text-sm outline-none dark:bg-white/10"
            />
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="app-no-drag mt-2 w-full rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10"
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <ArrowRightLeft size={18} className="mb-3 text-neutral-400" />

          <div>
            <label className="mb-1 block text-xs text-neutral-500">結果</label>
            <div className="w-full truncate rounded-lg bg-black/5 px-3 py-2.5 text-sm dark:bg-white/10">{result}</div>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="app-no-drag mt-2 w-full rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10"
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export const UnitConverterPlugin: PluginModule = {
  manifest: {
    id: "unit-converter",
    name: "単位変換",
    version: "0.1.0",
    description: "長さ・重さ・温度の単位変換",
    category: "life",
    entry: "unit-converter",
  },
  icon: Ruler,
  Component: UnitConverterPage,
};
