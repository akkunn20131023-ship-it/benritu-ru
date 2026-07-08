import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { STUDY_TIMER_PLUGIN_ID, type StudySession } from "@/plugins/builtin/study-timer/StudyTimerPlugin";

/** 学習時間ウィジェット。学習時間記録プラグインのデータから今日の学習時間を集計する */
export function StudyTimeWidget() {
  const [todayMinutes, setTodayMinutes] = useState<number | null>(null);

  useEffect(() => {
    void window.api.plugins.storeGet(STUDY_TIMER_PLUGIN_ID, "sessions").then((sessions) => {
      const list = (sessions as StudySession[] | undefined) ?? [];
      const today = list.filter((s) => new Date(s.date).toDateString() === new Date().toDateString());
      setTodayMinutes(today.reduce((sum, s) => sum + s.minutes, 0));
    });
  }, []);

  return (
    <div className="glass-panel flex items-center gap-4 rounded-xl2 p-5">
      <GraduationCap size={32} className="text-accent" strokeWidth={1.5} />
      <div>
        {todayMinutes ? (
          <>
            <p className="text-sm font-medium">
              今日の学習時間: {Math.floor(todayMinutes / 60)}時間{todayMinutes % 60}分
            </p>
            <Link to="/plugin/study-stats" className="text-xs text-accent hover:underline">
              勉強統計を見る →
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">今日はまだ学習記録がありません</p>
            <Link to="/plugin/study-timer" className="text-xs text-accent hover:underline">
              学習時間記録を開く →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
