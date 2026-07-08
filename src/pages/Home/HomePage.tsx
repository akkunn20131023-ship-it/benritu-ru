import { ClockWidget } from "./widgets/ClockWidget";
import { WeatherWidget } from "./widgets/WeatherWidget";
import { TodoWidget } from "./widgets/TodoWidget";
import { HabitsWidget } from "./widgets/HabitsWidget";
import { AiSuggestionWidget } from "./widgets/AiSuggestionWidget";
import { RecentWidget } from "./widgets/RecentWidget";
import { UsageStatsWidget } from "./widgets/UsageStatsWidget";
import { StudyTimeWidget } from "./widgets/StudyTimeWidget";

/** ホーム画面: 日付/時計/天気/ToDo/習慣/AIおすすめ/最近使った項目/学習時間/使用統計を並べたダッシュボード */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ClockWidget />
        <WeatherWidget />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TodoWidget />
        <HabitsWidget />
        <AiSuggestionWidget />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <RecentWidget />
        <StudyTimeWidget />
        <UsageStatsWidget />
      </div>
    </div>
  );
}
