import { useMemo, useState } from "react";
import { Wallet, Plus, Trash2, TrendingUp, TrendingDown, Repeat, PiggyBank } from "lucide-react";
import { randomId } from "@/lib/randomId";
import { usePluginStore } from "../../usePluginStore";
import type { PluginModule } from "../../types";

const PLUGIN_ID = "finance";

type TxType = "expense" | "income";

interface Transaction {
  id: string;
  type: TxType;
  amount: number; // 常に正の数として保持し、種別で符号を解釈する
  category: string;
  memo: string;
  date: string; // YYYY-MM-DD
}

interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycleMonths: number; // 1 = 毎月, 12 = 毎年 など
  nextBilling: string; // YYYY-MM-DD
}

interface FinanceData {
  transactions: Transaction[];
  subscriptions: Subscription[];
  monthlyBudget: number;
}

const EMPTY: FinanceData = { transactions: [], subscriptions: [], monthlyBudget: 0 };

const EXPENSE_CATEGORIES = ["食費", "日用品", "交通", "交際", "趣味", "住居", "光熱費", "通信", "医療", "その他"];
const INCOME_CATEGORIES = ["給与", "副収入", "臨時収入", "その他"];

const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
const formatYen = (n: number) => yen.format(Math.round(n));

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthKey(date: string): string {
  return date.slice(0, 7); // YYYY-MM
}

function currentMonthKey(): string {
  return todayKey().slice(0, 7);
}

/** 直近 n ヶ月の "YYYY-MM" を古い順で返す */
function lastNMonths(n: number): string[] {
  const keys: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    keys.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function FinancePage() {
  const [data, setData, loaded] = usePluginStore<FinanceData>(PLUGIN_ID, "data", EMPTY);
  const [tab, setTab] = useState<"ledger" | "subscriptions">("ledger");

  if (!loaded) return null;

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4">
      <div className="flex gap-1 rounded-lg glass-panel p-1 text-sm">
        <TabButton active={tab === "ledger"} onClick={() => setTab("ledger")} icon={<Wallet size={15} />} label="家計簿" />
        <TabButton active={tab === "subscriptions"} onClick={() => setTab("subscriptions")} icon={<Repeat size={15} />} label="サブスク" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "ledger" ? <Ledger data={data} setData={setData} /> : <Subscriptions data={data} setData={setData} />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`app-no-drag flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 font-medium transition-colors ${
        active ? "bg-accent text-white" : "text-neutral-500 hover:bg-black/5 dark:hover:bg-white/10"
      }`}
    >
      {icon} {label}
    </button>
  );
}

/* ------------------------------- 家計簿 ------------------------------- */

function Ledger({ data, setData }: { data: FinanceData; setData: (d: FinanceData) => void }) {
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(todayKey());
  const [memo, setMemo] = useState("");
  const [budgetInput, setBudgetInput] = useState(String(data.monthlyBudget || ""));

  const thisMonth = currentMonthKey();
  const monthTx = useMemo(() => data.transactions.filter((t) => monthKey(t.date) === thisMonth), [data.transactions, thisMonth]);
  const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTx) if (t.type === "expense") map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [monthTx]);

  const trend = useMemo(() => {
    const months = lastNMonths(6);
    return months.map((m) => ({
      month: m,
      expense: data.transactions.filter((t) => t.type === "expense" && monthKey(t.date) === m).reduce((s, t) => s + t.amount, 0),
    }));
  }, [data.transactions]);

  const recent = useMemo(() => [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30), [data.transactions]);

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  function addTx() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    const tx: Transaction = { id: randomId(), type, amount: value, category, memo: memo.trim(), date };
    setData({ ...data, transactions: [tx, ...data.transactions] });
    setAmount("");
    setMemo("");
  }

  function deleteTx(id: string) {
    setData({ ...data, transactions: data.transactions.filter((t) => t.id !== id) });
  }

  function saveBudget() {
    const value = Number(budgetInput);
    setData({ ...data, monthlyBudget: Number.isFinite(value) && value > 0 ? value : 0 });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 入力フォーム */}
      <div className="glass-panel flex flex-col gap-2.5 rounded-xl2 p-4">
        <div className="flex gap-1 rounded-lg bg-black/5 p-1 text-xs dark:bg-white/10">
          <button
            onClick={() => {
              setType("expense");
              setCategory(EXPENSE_CATEGORIES[0]);
            }}
            className={`app-no-drag flex-1 rounded-md py-1.5 font-medium transition-colors ${type === "expense" ? "bg-white text-red-500 shadow-sm dark:bg-neutral-800" : "text-neutral-500"}`}
          >
            支出
          </button>
          <button
            onClick={() => {
              setType("income");
              setCategory(INCOME_CATEGORIES[0]);
            }}
            className={`app-no-drag flex-1 rounded-md py-1.5 font-medium transition-colors ${type === "income" ? "bg-white text-emerald-500 shadow-sm dark:bg-neutral-800" : "text-neutral-500"}`}
          >
            収入
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTx()}
            placeholder="金額"
            className="app-no-drag w-28 rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="app-no-drag rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10">
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="app-no-drag rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10" />
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTx()}
            placeholder="メモ (任意)"
            className="app-no-drag min-w-[8rem] flex-1 rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10"
          />
          <button onClick={addTx} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
            <Plus size={16} /> 追加
          </button>
        </div>
      </div>

      {/* 今月サマリー */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="今月の収入" value={formatYen(income)} tone="income" icon={<TrendingUp size={14} />} />
        <SummaryCard label="今月の支出" value={formatYen(expense)} tone="expense" icon={<TrendingDown size={14} />} />
        <SummaryCard label="残高" value={formatYen(balance)} tone={balance >= 0 ? "income" : "expense"} icon={<Wallet size={14} />} />
      </div>

      {/* 予算 */}
      <div className="glass-panel flex flex-col gap-2 rounded-xl2 p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <PiggyBank size={15} className="text-accent" /> 今月の予算
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              inputMode="numeric"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              onBlur={saveBudget}
              onKeyDown={(e) => e.key === "Enter" && saveBudget()}
              placeholder="未設定"
              className="app-no-drag w-28 rounded-lg bg-black/5 px-3 py-1.5 text-right text-sm outline-none dark:bg-white/10"
            />
            <span className="text-xs text-neutral-500">円 / 月</span>
          </div>
        </div>
        {data.monthlyBudget > 0 ? (
          <>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className={`h-full rounded-full transition-all ${expense > data.monthlyBudget ? "bg-red-400" : "bg-accent"}`}
                style={{ width: `${Math.min(100, (expense / data.monthlyBudget) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-neutral-500">
              {expense <= data.monthlyBudget
                ? `残り ${formatYen(data.monthlyBudget - expense)} 使えます`
                : `予算より ${formatYen(expense - data.monthlyBudget)} 多く使っています`}
            </p>
          </>
        ) : (
          <p className="text-xs text-neutral-500">金額を入れると、今月あとどれくらい使えるかを表示します。</p>
        )}
      </div>

      {/* カテゴリ別内訳 */}
      {byCategory.length > 0 && (
        <div className="glass-panel flex flex-col gap-2.5 rounded-xl2 p-4">
          <span className="text-sm font-semibold">今月の支出内訳</span>
          {byCategory.map(([cat, amt], i) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-xs text-neutral-500">{cat}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(amt / byCategory[0][1]) * 100}%`, opacity: 1 - i * 0.08 }} />
              </div>
              <span className="w-20 shrink-0 text-right text-xs tabular-nums">{formatYen(amt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* 6ヶ月推移 */}
      <TrendChart trend={trend} />

      {/* 履歴 */}
      <div className="glass-panel flex flex-col rounded-xl2 p-2">
        <span className="px-3 py-2 text-sm font-semibold">最近の記録</span>
        {recent.length === 0 ? (
          <p className="px-3 pb-3 text-sm text-neutral-500">まだ記録がありません。上の欄から追加してみましょう。</p>
        ) : (
          recent.map((t) => (
            <div key={t.id} className="group flex items-center gap-3 rounded-md px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10">
              <span className="w-20 shrink-0 text-xs text-neutral-400 tabular-nums">{t.date.slice(5)}</span>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-neutral-500 dark:bg-white/10">{t.category}</span>
              <span className="flex-1 truncate text-sm text-neutral-500">{t.memo}</span>
              <span className={`shrink-0 text-sm font-medium tabular-nums ${t.type === "income" ? "text-emerald-500" : "text-neutral-800 dark:text-neutral-200"}`}>
                {t.type === "income" ? "+" : "-"}
                {formatYen(t.amount)}
              </span>
              <Trash2 size={14} className="app-no-drag shrink-0 cursor-pointer opacity-0 group-hover:opacity-60 hover:opacity-100" onClick={() => deleteTx(t.id)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone, icon }: { label: string; value: string; tone: "income" | "expense"; icon: React.ReactNode }) {
  return (
    <div className="glass-panel flex flex-col gap-1 rounded-xl2 p-3">
      <span className="flex items-center gap-1 text-[11px] text-neutral-500">
        {icon} {label}
      </span>
      <span className={`text-base font-bold tabular-nums ${tone === "income" ? "text-emerald-500" : "text-red-500"}`}>{value}</span>
    </div>
  );
}

function TrendChart({ trend }: { trend: { month: string; expense: number }[] }) {
  const max = Math.max(1, ...trend.map((t) => t.expense));
  return (
    <div className="glass-panel flex flex-col gap-2 rounded-xl2 p-4">
      <span className="text-sm font-semibold">支出の推移 (6ヶ月)</span>
      <div className="flex items-end justify-between gap-2" style={{ height: 96 }}>
        {trend.map((t) => (
          <div key={t.month} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] text-neutral-400 tabular-nums">{t.expense > 0 ? formatYen(t.expense).replace("￥", "") : ""}</span>
            <div className="w-full rounded-t-md bg-accent/80 transition-all" style={{ height: `${(t.expense / max) * 64}px`, minHeight: t.expense > 0 ? 4 : 0 }} />
            <span className="text-[10px] text-neutral-500">{Number(t.month.slice(5))}月</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ サブスク ------------------------------ */

function Subscriptions({ data, setData }: { data: FinanceData; setData: (d: FinanceData) => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cycleMonths, setCycleMonths] = useState(1);
  const [nextBilling, setNextBilling] = useState(todayKey());

  const subs = useMemo(() => [...data.subscriptions].sort((a, b) => a.nextBilling.localeCompare(b.nextBilling)), [data.subscriptions]);
  const monthlyTotal = subs.reduce((s, sub) => s + sub.amount / sub.cycleMonths, 0);
  const yearlyTotal = monthlyTotal * 12;

  function addSub() {
    const value = Number(amount);
    if (!name.trim() || !Number.isFinite(value) || value <= 0) return;
    const sub: Subscription = { id: randomId(), name: name.trim(), amount: value, cycleMonths, nextBilling };
    setData({ ...data, subscriptions: [...data.subscriptions, sub] });
    setName("");
    setAmount("");
  }

  function deleteSub(id: string) {
    setData({ ...data, subscriptions: data.subscriptions.filter((s) => s.id !== id) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="月あたり合計" value={formatYen(monthlyTotal)} tone="expense" icon={<Repeat size={14} />} />
        <SummaryCard label="年あたり合計" value={formatYen(yearlyTotal)} tone="expense" icon={<Repeat size={14} />} />
      </div>

      <div className="glass-panel flex flex-wrap gap-2 rounded-xl2 p-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="サービス名" className="app-no-drag min-w-[8rem] flex-1 rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10" />
        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="金額"
          className="app-no-drag w-24 rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10"
        />
        <select value={cycleMonths} onChange={(e) => setCycleMonths(Number(e.target.value))} className="app-no-drag rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10">
          <option value={1}>毎月</option>
          <option value={3}>3ヶ月ごと</option>
          <option value={6}>半年ごと</option>
          <option value={12}>毎年</option>
        </select>
        <input type="date" value={nextBilling} onChange={(e) => setNextBilling(e.target.value)} className="app-no-drag rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10" />
        <button onClick={addSub} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
          <Plus size={16} /> 追加
        </button>
      </div>

      <div className="glass-panel flex flex-col rounded-xl2 p-2">
        {subs.length === 0 ? (
          <p className="p-4 text-center text-sm text-neutral-500">登録された定期支払いはありません。</p>
        ) : (
          subs.map((s) => (
            <div key={s.id} className="group flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-black/5 dark:hover:bg-white/10">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="text-xs text-neutral-500">
                  次回 {s.nextBilling} ・ {formatYen(s.amount / s.cycleMonths)}/月 相当
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatYen(s.amount)}
                <span className="ml-1 text-xs font-normal text-neutral-400">/{s.cycleMonths === 1 ? "月" : s.cycleMonths === 12 ? "年" : `${s.cycleMonths}ヶ月`}</span>
              </span>
              <Trash2 size={14} className="app-no-drag shrink-0 cursor-pointer opacity-0 group-hover:opacity-60 hover:opacity-100" onClick={() => deleteSub(s.id)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export const FinancePlugin: PluginModule = {
  manifest: {
    id: "finance",
    name: "家計簿",
    version: "0.1.0",
    description: "支出・収入の記録、予算管理、サブスクの把握、支出分析",
    category: "life",
    entry: "finance",
  },
  icon: Wallet,
  Component: FinancePage,
};
