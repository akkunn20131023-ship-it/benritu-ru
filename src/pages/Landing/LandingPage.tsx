import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sun,
  Moon,
  ListChecks,
  StickyNote,
  CalendarDays,
  Wallet,
  Timer,
  Flame,
  Calculator,
  ScanText,
  FileText,
  CloudSun,
  Sparkles,
  Users,
  QrCode,
  Link2,
  Gamepad2,
  Smartphone,
  WifiOff,
  ShieldCheck,
  Zap,
  ChevronDown,
  Mail,
  Send,
} from "lucide-react";
import { useThemeStore } from "@/stores/useThemeStore";

// お問い合わせ先。実運用の連絡先メールに置き換えてください (mailto でメールアプリが開きます)。
const CONTACT_EMAIL = "support@mytnelaflow.app";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** ブランドのフローマーク (favicon と同じ二重波) */
function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="lp-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#lp-mark)" />
      <g fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round">
        <path d="M13 28 Q 22 18, 32 28 T 51 28" />
        <path d="M13 40 Q 22 30, 32 40 T 51 40" opacity="0.6" />
      </g>
    </svg>
  );
}

export default function LandingPage() {
  const { resolved, setMode } = useThemeStore();

  return (
    <div className="h-screen overflow-y-auto bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <TopNav resolved={resolved} onToggleTheme={() => setMode(resolved === "dark" ? "light" : "dark")} />
      <main>
        <Hero />
        <TrustBar />
        <Features />
        <AiPrinciples />
        <OnlineSection />
        <GamesSection />
        <PwaSection />
        <Faq />
        <Changelog />
        <Contact />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TopNav({ resolved, onToggleTheme }: { resolved: "light" | "dark"; onToggleTheme: () => void }) {
  const links = [
    { id: "features", label: "機能" },
    { id: "online", label: "オンライン" },
    { id: "games", label: "ゲーム" },
    { id: "faq", label: "FAQ" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/70">
      <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <button onClick={() => scrollToId("top")} className="flex items-center gap-2 font-semibold">
          <BrandMark size={28} /> Mytnela Flow
        </button>
        <div className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <button key={l.id} onClick={() => scrollToId(l.id)} className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10">
              {l.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onToggleTheme} aria-label="テーマ切り替え" className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-black/5 dark:hover:bg-white/10">
            {resolved === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link to="/app" className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover">
            今すぐ使う <ArrowRight size={15} />
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Section({ id, className = "", children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`mx-auto max-w-6xl px-4 ${className}`}>
      {children}
    </section>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.4, delay }}>
      {children}
    </motion.div>
  );
}

function Hero() {
  return (
    <div id="top" className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
      <Section className="relative grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Sparkles size={13} /> 登録不要・ブラウザで今すぐ
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            毎日を、
            <br className="hidden sm:block" />
            もっとスムーズに。
          </h1>
          <p className="max-w-md text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
            AI・便利ツール・共同作業・オンラインゲームを、ひとつのブラウザに。
            アカウントもインストールも不要。開いた瞬間から使えます。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/app" className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-colors hover:bg-accent-hover">
              今すぐ使う <ArrowRight size={16} />
            </Link>
            <button onClick={() => scrollToId("features")} className="rounded-full border border-black/10 px-6 py-3 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">
              機能を見る
            </button>
          </div>
        </div>
        <Reveal delay={0.1}>
          <AppMockup />
        </Reveal>
      </Section>
    </div>
  );
}

/** アプリの雰囲気を伝えるスタイライズド・プレビュー (実UIを模したベクター表現) */
function AppMockup() {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-2 shadow-2xl shadow-black/20 backdrop-blur dark:border-white/10 dark:bg-neutral-900/70" role="img" aria-label="Mytnela Flow のダッシュボード画面のイメージ">
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 rounded bg-black/5 px-2 py-0.5 text-[10px] text-neutral-400 dark:bg-white/10">mytnelaflow.app</span>
      </div>
      <div className="space-y-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-950">
        <div className="relative overflow-hidden rounded-xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-neutral-900">
          <div aria-hidden className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/20 blur-2xl" />
          <p className="text-xs font-medium text-accent">次はこれだけ</p>
          <p className="mt-1 text-lg font-bold">牛乳を買う</p>
          <p className="mt-1 text-xs text-neutral-400">まずは30秒だけ始めてみましょう。</p>
          <div className="mt-3 flex gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">できた</span>
            <span className="rounded-full bg-black/5 px-3 py-1 text-xs dark:bg-white/10">あとで</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { t: "時計", v: "7:58" },
            { t: "天気", v: "26°" },
            { t: "習慣", v: "3日" },
          ].map((c) => (
            <div key={c.t} className="rounded-lg border border-black/5 bg-white p-2.5 dark:border-white/10 dark:bg-neutral-900">
              <p className="text-[10px] text-neutral-400">{c.t}</p>
              <p className="text-sm font-bold">{c.v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrustBar() {
  const items = [
    { icon: ShieldCheck, label: "登録・ログイン不要" },
    { icon: Zap, label: "インストール不要" },
    { icon: WifiOff, label: "オフラインでも動く" },
    { icon: Smartphone, label: "PC・スマホ・タブレット対応" },
  ];
  return (
    <Section className="pb-4">
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-neutral-900/50 md:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <it.icon size={16} className="shrink-0 text-accent" /> {it.label}
          </div>
        ))}
      </div>
    </Section>
  );
}

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="mb-2 text-sm font-semibold text-accent">{eyebrow}</p>
      <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      {sub && <p className="mt-3 text-neutral-600 dark:text-neutral-300">{sub}</p>}
    </div>
  );
}

function Features() {
  const tools = [
    { icon: ListChecks, name: "ToDo", desc: "AIが大きな用事を小さく分解" },
    { icon: StickyNote, name: "メモ", desc: "Markdown対応のさっと書けるメモ" },
    { icon: CalendarDays, name: "カレンダー", desc: "予定をシンプルに管理" },
    { icon: Wallet, name: "家計簿", desc: "支出・予算・サブスクを可視化" },
    { icon: Timer, name: "ポモドーロ", desc: "集中と休憩のリズム作り" },
    { icon: Flame, name: "習慣", desc: "続けたいことを毎日ひと押し" },
    { icon: Calculator, name: "電卓・変換", desc: "計算・単位変換をその場で" },
    { icon: ScanText, name: "OCR", desc: "画像から文字を読み取り" },
    { icon: FileText, name: "PDF・ファイル", desc: "閲覧・変換・整理" },
    { icon: CloudSun, name: "天気", desc: "今日の空模様をひと目で" },
    { icon: Sparkles, name: "AIチャット", desc: "優しく一緒に考える相棒" },
    { icon: Gamepad2, name: "ミニゲーム", desc: "息抜きのちょっとした遊び" },
  ];
  return (
    <Section id="features" className="py-16">
      <SectionHeading eyebrow="便利ツール" title="毎日に必要なものを、ひとつに。" sub="ばらばらのアプリを行き来しなくても、ここに揃っています。すべてブラウザだけで、無料で使えます。" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {tools.map((t, i) => (
          <Reveal key={t.name} delay={(i % 4) * 0.05}>
            <div className="h-full rounded-xl border border-black/5 bg-white/60 p-4 transition-colors hover:border-accent/30 dark:border-white/10 dark:bg-neutral-900/50">
              <t.icon size={20} className="text-accent" />
              <p className="mt-2 font-semibold">{t.name}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{t.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function AiPrinciples() {
  const points = ["できていないことを責めません", "むずかしい言葉を使いません", "選択肢は多くても3つまで", "一度に情報を出しすぎません"];
  return (
    <Section className="py-16">
      <div className="grid items-center gap-8 rounded-3xl border border-black/5 bg-gradient-to-br from-accent/10 to-transparent p-8 dark:border-white/10 md:grid-cols-2 md:p-12">
        <div>
          <p className="mb-2 text-sm font-semibold text-accent">AIの考え方</p>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">命令ではなく、となりで一緒に考える。</h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-300">Mytnela Flow のAIは「考える負担」を減らすためにあります。急かさず、責めず、やさしく。</p>
        </div>
        <ul className="space-y-2.5">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-2.5 rounded-lg bg-white/60 px-4 py-3 text-sm dark:bg-neutral-900/50">
              <Sparkles size={15} className="shrink-0 text-accent" /> {p}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function OnlineSection() {
  const ways = [
    { icon: Zap, name: "ルームコード", desc: "6文字のコードを共有するだけ" },
    { icon: Link2, name: "招待URL", desc: "リンクを送れば開くだけで参加" },
    { icon: QrCode, name: "QRコード", desc: "その場で読み取ってすぐ合流" },
  ];
  const features = ["共同ToDo", "共同メモ", "共同ホワイトボード", "共同チャット", "共同チェックリスト", "共同買い物リスト"];
  return (
    <Section id="online" className="py-16">
      <SectionHeading eyebrow="オンライン共同作業" title="みんなで、その場で。登録なしで。" sub="参加はルームコード・招待URL・QRコードだけ。アカウントも連絡先も要りません。" />
      <div className="grid gap-4 md:grid-cols-3">
        {ways.map((w, i) => (
          <Reveal key={w.name} delay={i * 0.05}>
            <div className="flex h-full flex-col gap-1 rounded-xl border border-black/5 bg-white/60 p-5 dark:border-white/10 dark:bg-neutral-900/50">
              <w.icon size={22} className="text-accent" />
              <p className="mt-1 font-semibold">{w.name}</p>
              <p className="text-sm text-neutral-500">{w.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {features.map((f) => (
          <span key={f} className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white/60 px-3 py-1.5 text-sm dark:border-white/10 dark:bg-neutral-900/50">
            <Users size={13} className="text-accent" /> {f}
          </span>
        ))}
      </div>
      <div className="mt-6">
        <Link to="/plugin/realtime-chat" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
          リアルタイムチャットを試す <ArrowRight size={15} />
        </Link>
      </div>
    </Section>
  );
}

function GamesSection() {
  const games = ["三目並べ", "オセロ", "五目並べ", "クイズ", "お絵描き", "タイピング対戦"];
  return (
    <Section id="games" className="py-16">
      <div className="rounded-3xl border border-black/5 bg-white/60 p-8 dark:border-white/10 dark:bg-neutral-900/50 md:p-12">
        <SectionHeading eyebrow="オンラインゲーム" title="ルームコードで、すぐ対戦。" sub="友達にコードやQRを送るだけで一緒に遊べます。ゲームは順次追加していきます。" />
        <div className="flex flex-wrap gap-2">
          {games.map((g) => (
            <span key={g} className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-4 py-2 text-sm dark:border-white/10 dark:bg-neutral-900">
              <Gamepad2 size={14} className="text-accent" /> {g}
              <span className="rounded-full bg-black/5 px-1.5 text-[10px] text-neutral-400 dark:bg-white/10">準備中</span>
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-neutral-500">まずは共同チャットなど、いま使えるオンライン機能からお試しいただけます。</p>
      </div>
    </Section>
  );
}

function PwaSection() {
  const steps = ["ブラウザのメニューを開く", "「ホーム画面に追加」を選ぶ", "アプリのように起動＆オフライン利用"];
  return (
    <Section className="py-16">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-semibold text-accent">アプリとして使う (PWA)</p>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">ホーム画面に追加すれば、いつもの1タップ。</h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-300">インストール不要のまま、ホーム画面アイコンから起動できます。電波がなくても基本機能はそのまま使えます。</p>
        </div>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-neutral-900/50">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">{i + 1}</span>
              <span className="text-sm">{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

const FAQ_ITEMS = [
  { q: "本当に登録なしで使えますか？", a: "はい。アカウント登録・ログイン・メールアドレス・電話番号はすべて不要です。URLを開いた瞬間から使えます。" },
  { q: "データはどこに保存されますか？", a: "基本はあなたの端末（ブラウザ内）に保存されます。設定画面からいつでもエクスポート／インポートでバックアップできます。" },
  { q: "料金はかかりますか？", a: "無料で使えます。" },
  { q: "オフラインでも使えますか？", a: "はい。一度開けば、ToDo・メモ・電卓などの基本機能はオフラインでも動作します。" },
  { q: "オンライン機能はどうやって参加しますか？", a: "ルームコード・招待URL・QRコードのいずれかで参加できます。こちらも登録は不要です。" },
  { q: "スマホでも使えますか？", a: "PC・スマートフォン・タブレットに対応しています。ホーム画面に追加すればアプリのように使えます。" },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section id="faq" className="py-16">
      <SectionHeading eyebrow="よくある質問" title="はじめての方へ" />
      <div className="mx-auto max-w-3xl space-y-2">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="overflow-hidden rounded-xl border border-black/5 bg-white/60 dark:border-white/10 dark:bg-neutral-900/50">
              <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-medium">
                {item.q}
                <ChevronDown size={16} className={`shrink-0 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && <p className="px-5 pb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{item.a}</p>}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function Changelog() {
  const entries = [
    { date: "2026-07-18", items: ["ブランドを Mytnela Flow に統一", "ランディングページを公開", "リアルタイム共同作業の基盤を追加"] },
    { date: "2026-07-17", items: ["家計簿（予算・サブスク・支出分析）を追加", "PWA・オフライン対応を強化"] },
    { date: "2026-07-16", items: ["ホームに「次の1つ」表示、AIによるタスク分解を追加", "ニュース・記憶ゲームを追加"] },
  ];
  return (
    <Section className="py-16">
      <SectionHeading eyebrow="更新履歴" title="日々よくなっています。" />
      <div className="mx-auto max-w-3xl space-y-4">
        {entries.map((e) => (
          <div key={e.date} className="flex gap-4 rounded-xl border border-black/5 bg-white/60 p-5 dark:border-white/10 dark:bg-neutral-900/50">
            <span className="shrink-0 text-xs font-medium text-neutral-400 tabular-nums">{e.date}</span>
            <ul className="space-y-1 text-sm">
              {e.items.map((it) => (
                <li key={it} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Contact() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ subject: subject || "Mytnela Flow へのお問い合わせ", body });
    window.location.href = `mailto:${CONTACT_EMAIL}?${params.toString()}`;
  }
  return (
    <Section id="contact" className="py-16">
      <div className="mx-auto max-w-2xl">
        <SectionHeading eyebrow="お問い合わせ・フィードバック" title="ご意見をお聞かせください。" sub="ご質問・ご要望・不具合の報告など、お気軽にどうぞ。送信ボタンでお使いのメールアプリが開きます。" />
        <form onSubmit={submit} className="space-y-3">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="件名（任意）" className="w-full rounded-lg border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900/60" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="内容をご記入ください" className="w-full resize-none rounded-lg border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900/60" />
          <button type="submit" className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover">
            <Send size={15} /> メールで送る
          </button>
        </form>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500">
          <Mail size={13} /> {CONTACT_EMAIL}
        </p>
      </div>
    </Section>
  );
}

function FinalCta() {
  return (
    <Section className="py-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-cyan-400 px-8 py-14 text-center text-white">
        <h2 className="text-2xl font-bold md:text-3xl">今日から、毎日をもっとスムーズに。</h2>
        <p className="mx-auto mt-2 max-w-md text-white/90">登録もインストールもいりません。開くだけです。</p>
        <Link to="/app" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-accent shadow-lg transition-transform hover:scale-[1.02]">
          今すぐ使う <ArrowRight size={16} />
        </Link>
      </div>
    </Section>
  );
}

function Footer() {
  const nav = [
    { id: "features", label: "機能" },
    { id: "online", label: "オンライン" },
    { id: "games", label: "ゲーム" },
    { id: "faq", label: "FAQ" },
    { id: "contact", label: "お問い合わせ" },
  ];
  return (
    <footer className="border-t border-black/5 py-10 dark:border-white/10">
      <Section>
        <div className="flex flex-col justify-between gap-6 md:flex-row">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 font-semibold">
              <BrandMark size={24} /> Mytnela Flow
            </div>
            <p className="mt-2 text-sm text-neutral-500">毎日をもっとスムーズに。AI・便利ツール・共同作業・ゲームをひとつに。</p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-neutral-400">サービス</p>
              {nav.map((n) => (
                <button key={n.id} onClick={() => scrollToId(n.id)} className="text-left text-neutral-600 hover:text-accent dark:text-neutral-300">
                  {n.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-neutral-400">規約・その他</p>
              <Link to="/terms" className="text-neutral-600 hover:text-accent dark:text-neutral-300">利用規約</Link>
              <Link to="/privacy" className="text-neutral-600 hover:text-accent dark:text-neutral-300">プライバシーポリシー</Link>
              <Link to="/app" className="text-neutral-600 hover:text-accent dark:text-neutral-300">アプリを開く</Link>
            </div>
          </div>
        </div>
        <p className="mt-8 text-xs text-neutral-400">© {new Date().getFullYear()} Mytnela Flow</p>
      </Section>
    </footer>
  );
}
