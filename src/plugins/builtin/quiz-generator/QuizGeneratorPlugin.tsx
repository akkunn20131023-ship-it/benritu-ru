import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FileQuestion, Upload, Sparkles, Settings, RotateCcw } from "lucide-react";
import { randomId } from "@/lib/randomId";
import { useAiComplete, parseJsonLoose } from "../../useAiComplete";
import { usePluginStore } from "../../usePluginStore";
import type { PluginModule } from "../../types";

export const QUIZ_GENERATOR_PLUGIN_ID = "quiz-generator";
const PLUGIN_ID = QUIZ_GENERATOR_PLUGIN_ID;

interface QuizQuestion {
  question: string;
  choices: string[];
  answerIndex: number;
}

export interface QuizHistoryEntry {
  id: string;
  title: string;
  score: number;
  total: number;
  date: number;
}

type Mode = "input" | "generating" | "quiz" | "result";

function buildPrompt(sourceText: string, count: number): { system: string; user: string } {
  return {
    system:
      "あなたは教育コンテンツ作成者です。与えられた文章の理解度を確認する多肢選択式クイズ(4択)を作成してください。" +
      "出力は必ず次のJSON形式のみとし、説明文やコードフェンスを含めないでください。" +
      '{"questions":[{"question":"問題文","choices":["選択肢1","選択肢2","選択肢3","選択肢4"],"answerIndex":0}]}',
    user: `以下の文章から${count}問のクイズを作成してください。\n\n${sourceText.slice(0, 12000)}`,
  };
}

function QuizGeneratorPage() {
  const complete = useAiComplete();
  const [history, setHistory] = usePluginStore<QuizHistoryEntry[]>(PLUGIN_ID, "history", []);
  const [mode, setMode] = useState<Mode>("input");
  const [sourceText, setSourceText] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    void window.api.ai.getConfig().then((c) => setConfigured(c.provider !== "none"));
  }, []);

  async function handlePdf(file: File) {
    setError(null);
    setSourceLabel(file.name);
    const buffer = await file.arrayBuffer();
    const text = await window.api.files.extractPdfText(buffer);
    setSourceText(text);
  }

  async function generate() {
    if (!sourceText.trim()) return;
    setMode("generating");
    setError(null);
    try {
      const { system, user } = buildPrompt(sourceText, count);
      const raw = await complete([
        { role: "system", content: system },
        { role: "user", content: user },
      ]);
      const parsed = parseJsonLoose<{ questions: QuizQuestion[] }>(raw);
      if (!parsed.questions?.length) throw new Error("問題を生成できませんでした");
      setQuestions(parsed.questions);
      setAnswers([]);
      setCurrent(0);
      setMode("quiz");
    } catch (err) {
      setError((err as Error).message);
      setMode("input");
    }
  }

  function selectAnswer(choiceIndex: number) {
    const next = [...answers, choiceIndex];
    setAnswers(next);
    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
    } else {
      const score = questions.filter((q, i) => q.answerIndex === next[i]).length;
      setHistory([{ id: randomId(), title: sourceLabel || "クイズ", score, total: questions.length, date: Date.now() }, ...history]);
      setMode("result");
    }
  }

  function reset() {
    setMode("input");
    setQuestions([]);
    setAnswers([]);
    setCurrent(0);
    setSourceText("");
    setSourceLabel("");
    setError(null);
  }

  if (configured === false) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <FileQuestion size={32} className="text-accent" />
        <p className="text-sm font-medium">AIプロバイダーが未設定です</p>
        <p className="max-w-sm text-xs text-neutral-500">クイズ生成にはAIプロバイダーの設定が必要です。</p>
        <Link
          to="/settings/ai"
          className="app-no-drag mt-2 flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Settings size={14} /> AI設定を開く
        </Link>
      </div>
    );
  }

  if (mode === "quiz") {
    const q = questions[current];
    return (
      <div className="mx-auto flex h-full max-w-xl flex-col justify-center gap-5">
        <p className="text-xs text-neutral-500">
          問題 {current + 1} / {questions.length}
        </p>
        <div className="glass-panel rounded-xl2 p-6">
          <p className="mb-4 text-base font-medium">{q.question}</p>
          <div className="space-y-2">
            {q.choices.map((c, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                className="app-no-drag block w-full rounded-lg bg-black/5 px-4 py-2.5 text-left text-sm hover:bg-accent/15 hover:text-accent dark:bg-white/10"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (mode === "result") {
    const score = questions.filter((q, i) => q.answerIndex === answers[i]).length;
    return (
      <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-5">
        <p className="text-2xl font-bold">
          {score} / {questions.length} 正解
        </p>
        <div className="w-full space-y-2">
          {questions.map((q, i) => (
            <div key={i} className={`glass-panel rounded-lg p-3 text-sm ${answers[i] === q.answerIndex ? "" : "ring-1 ring-red-400"}`}>
              <p className="font-medium">{q.question}</p>
              <p className="text-xs text-neutral-500">
                正解: {q.choices[q.answerIndex]} {answers[i] !== q.answerIndex && `(あなたの回答: ${q.choices[answers[i]]})`}
              </p>
            </div>
          ))}
        </div>
        <button onClick={reset} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
          <RotateCcw size={14} /> 新しいクイズを作る
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-xl flex-col gap-4 pt-6">
      <h2 className="text-sm font-semibold text-neutral-500">クイズ生成 (テキスト貼り付け / PDFアップロード)</h2>

      <textarea
        value={sourceText}
        onChange={(e) => {
          setSourceText(e.target.value);
          setSourceLabel("");
        }}
        placeholder="クイズにしたい文章を貼り付けてください..."
        rows={8}
        className="app-no-drag w-full resize-none rounded-lg glass-panel px-4 py-3 text-sm outline-none"
      />

      <div className="flex items-center justify-between">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-3.5 py-2 text-sm hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
        >
          <Upload size={14} /> PDFから読み込み
        </button>
        {sourceLabel && <span className="text-xs text-neutral-500">{sourceLabel}</span>}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handlePdf(file);
          }}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        問題数
        <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="app-no-drag rounded-lg bg-black/5 px-2 py-1.5 outline-none dark:bg-white/10">
          {[3, 5, 10].map((n) => (
            <option key={n} value={n}>
              {n}問
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={generate}
        disabled={!sourceText.trim() || mode === "generating"}
        className="app-no-drag flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
      >
        <Sparkles size={14} /> {mode === "generating" ? "生成中..." : "クイズを生成"}
      </button>

      {history.length > 0 && (
        <div className="mt-2">
          <h3 className="mb-1.5 text-xs font-medium text-neutral-500">最近の結果</h3>
          <div className="space-y-1">
            {history.slice(0, 5).map((h) => (
              <div key={h.id} className="flex justify-between text-xs text-neutral-500">
                <span className="truncate">{h.title}</span>
                <span>
                  {h.score}/{h.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const QuizGeneratorPlugin: PluginModule = {
  manifest: {
    id: "quiz-generator",
    name: "クイズ生成",
    version: "0.1.0",
    description: "テキストやPDFからAIがクイズを自動生成",
    category: "study",
    entry: "quiz-generator",
  },
  icon: FileQuestion,
  Component: QuizGeneratorPage,
};
