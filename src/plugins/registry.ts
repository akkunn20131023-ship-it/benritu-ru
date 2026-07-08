import type { PluginModule } from "./types";
import { NotesPlugin } from "./builtin/notes/NotesPlugin";
import { TodoPlugin } from "./builtin/todo/TodoPlugin";
import { AiChatPlugin } from "./builtin/ai-chat/AiChatPlugin";
import { ChecklistPlugin } from "./builtin/checklist/ChecklistPlugin";
import { CalendarPlugin } from "./builtin/calendar/CalendarPlugin";
import { HabitsPlugin } from "./builtin/habits/HabitsPlugin";
import { PomodoroPlugin } from "./builtin/pomodoro/PomodoroPlugin";
import { StopwatchPlugin } from "./builtin/stopwatch/StopwatchPlugin";
import { TimerPlugin } from "./builtin/timer/TimerPlugin";
import { CalculatorPlugin } from "./builtin/calculator/CalculatorPlugin";
import { UnitConverterPlugin } from "./builtin/unit-converter/UnitConverterPlugin";
import { QrGeneratorPlugin } from "./builtin/qr-generator/QrGeneratorPlugin";
import { QrReaderPlugin } from "./builtin/qr-reader/QrReaderPlugin";
import { PasswordGeneratorPlugin } from "./builtin/password-generator/PasswordGeneratorPlugin";
import { WorldClockPlugin } from "./builtin/world-clock/WorldClockPlugin";
import { AiTutorPlugin } from "./builtin/ai-tutor/AiTutorPlugin";
import { VocabularyPlugin } from "./builtin/vocabulary/VocabularyPlugin";
import { FlashcardsPlugin } from "./builtin/flashcards/FlashcardsPlugin";
import { QuizGeneratorPlugin } from "./builtin/quiz-generator/QuizGeneratorPlugin";
import { StudyTimerPlugin } from "./builtin/study-timer/StudyTimerPlugin";
import { GradesPlugin } from "./builtin/grades/GradesPlugin";
import { StudyNotesPlugin } from "./builtin/study-notes/StudyNotesPlugin";
import { StudyStatsPlugin } from "./builtin/study-stats/StudyStatsPlugin";
import { FileBrowserPlugin } from "./builtin/file-browser/FileBrowserPlugin";
import { FileToolsPlugin } from "./builtin/file-tools/FileToolsPlugin";
import { PdfToolsPlugin } from "./builtin/pdf-tools/PdfToolsPlugin";
import { DocumentViewerPlugin } from "./builtin/document-viewer/DocumentViewerPlugin";
import { TextEditorPlugin } from "./builtin/text-editor/TextEditorPlugin";
import { ImageEditorPlugin } from "./builtin/image-editor/ImageEditorPlugin";
import { ImageOcrPlugin } from "./builtin/image-ocr/ImageOcrPlugin";
import { VideoToolsPlugin } from "./builtin/video-tools/VideoToolsPlugin";
import { AudioToolsPlugin } from "./builtin/audio-tools/AudioToolsPlugin";

/**
 * ビルトインプラグインの静的レジストリ。
 * id は electron/plugins/builtin-manifests.ts の id と一致させること
 * (main プロセス側で有効/無効状態を管理し、ここで実際の React 実装を解決する)。
 */
export const BUILTIN_PLUGIN_MODULES: Record<string, PluginModule> = {
  notes: NotesPlugin,
  todo: TodoPlugin,
  "ai-chat": AiChatPlugin,
  checklist: ChecklistPlugin,
  calendar: CalendarPlugin,
  habits: HabitsPlugin,
  pomodoro: PomodoroPlugin,
  stopwatch: StopwatchPlugin,
  timer: TimerPlugin,
  calculator: CalculatorPlugin,
  "unit-converter": UnitConverterPlugin,
  "qr-generator": QrGeneratorPlugin,
  "qr-reader": QrReaderPlugin,
  "password-generator": PasswordGeneratorPlugin,
  "world-clock": WorldClockPlugin,
  "ai-tutor": AiTutorPlugin,
  vocabulary: VocabularyPlugin,
  flashcards: FlashcardsPlugin,
  "quiz-generator": QuizGeneratorPlugin,
  "study-timer": StudyTimerPlugin,
  grades: GradesPlugin,
  "study-notes": StudyNotesPlugin,
  "study-stats": StudyStatsPlugin,
  "file-browser": FileBrowserPlugin,
  "file-tools": FileToolsPlugin,
  "pdf-tools": PdfToolsPlugin,
  "document-viewer": DocumentViewerPlugin,
  "text-editor": TextEditorPlugin,
  "image-editor": ImageEditorPlugin,
  "image-ocr": ImageOcrPlugin,
  "video-tools": VideoToolsPlugin,
  "audio-tools": AudioToolsPlugin,
};
