import { useState } from "react";
import { Calculator as CalculatorIcon } from "lucide-react";
import type { PluginModule } from "../../types";

type Operator = "+" | "-" | "×" | "÷";

function applyOp(a: number, b: number, op: Operator): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
  }
}

const BUTTONS: (string | { label: string; type: "op" | "eq" | "clear" | "sign" | "percent" })[] = [
  { label: "C", type: "clear" },
  { label: "±", type: "sign" },
  { label: "%", type: "percent" },
  { label: "÷", type: "op" },
  "7",
  "8",
  "9",
  { label: "×", type: "op" },
  "4",
  "5",
  "6",
  { label: "-", type: "op" },
  "1",
  "2",
  "3",
  { label: "+", type: "op" },
  "0",
  ".",
  { label: "=", type: "eq" },
];

function CalculatorPage() {
  const [display, setDisplay] = useState("0");
  const [pending, setPending] = useState<{ value: number; op: Operator } | null>(null);
  const [overwrite, setOverwrite] = useState(true);

  function inputDigit(d: string) {
    if (overwrite) {
      setDisplay(d === "." ? "0." : d);
      setOverwrite(false);
      return;
    }
    if (d === "." && display.includes(".")) return;
    setDisplay((prev) => (prev === "0" && d !== "." ? d : prev + d));
  }

  function chooseOp(op: Operator) {
    const current = parseFloat(display);
    if (pending) {
      const result = applyOp(pending.value, current, pending.op);
      setDisplay(String(result));
      setPending({ value: result, op });
    } else {
      setPending({ value: current, op });
    }
    setOverwrite(true);
  }

  function equals() {
    if (!pending) return;
    const current = parseFloat(display);
    const result = applyOp(pending.value, current, pending.op);
    setDisplay(String(result));
    setPending(null);
    setOverwrite(true);
  }

  function clear() {
    setDisplay("0");
    setPending(null);
    setOverwrite(true);
  }

  function toggleSign() {
    setDisplay((prev) => String(parseFloat(prev) * -1));
  }

  function percent() {
    setDisplay((prev) => String(parseFloat(prev) / 100));
  }

  return (
    <div className="mx-auto flex h-full max-w-xs flex-col justify-center gap-4">
      <div className="glass-panel rounded-xl2 p-6 text-right text-4xl font-semibold tabular-nums truncate">{display}</div>
      <div className="grid grid-cols-4 gap-2">
        {BUTTONS.map((btn, i) => {
          if (typeof btn === "string") {
            return (
              <button
                key={i}
                onClick={() => inputDigit(btn)}
                className="app-no-drag rounded-lg bg-black/5 py-4 text-lg font-medium hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
              >
                {btn}
              </button>
            );
          }
          const handlers: Record<string, () => void> = {
            op: () => chooseOp(btn.label as Operator),
            eq: equals,
            clear: clear,
            sign: toggleSign,
            percent: percent,
          };
          const isAccent = btn.type === "op" || btn.type === "eq";
          return (
            <button
              key={i}
              onClick={handlers[btn.type]}
              className={`app-no-drag rounded-lg py-4 text-lg font-medium transition-colors ${
                isAccent ? "bg-accent text-white hover:bg-accent-hover" : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
              }`}
            >
              {btn.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const CalculatorPlugin: PluginModule = {
  manifest: {
    id: "calculator",
    name: "電卓",
    version: "0.1.0",
    description: "四則演算の電卓",
    category: "life",
    entry: "calculator",
  },
  icon: CalculatorIcon,
  Component: CalculatorPage,
};
