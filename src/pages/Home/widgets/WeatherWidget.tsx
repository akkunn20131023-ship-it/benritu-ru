import { useEffect, useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Loader2,
  MapPin,
  Moon,
  Sun,
} from "lucide-react";
import { fetchWeather, getCurrentPosition, weatherCodeToLabel, type WeatherInfo } from "@/lib/weather";

type Status = "idle" | "loading" | "error" | "ready";

function WeatherIcon({ code, isDay, size }: { code: number; isDay: boolean; size: number }) {
  const props = { size, className: "text-accent", strokeWidth: 1.5 };
  if (code === 0) return isDay ? <Sun {...props} /> : <Moon {...props} />;
  if (code <= 2) return <CloudSun {...props} />;
  if (code === 3) return <Cloud {...props} />;
  if (code === 45 || code === 48) return <CloudFog {...props} />;
  if (code >= 51 && code <= 57) return <CloudDrizzle {...props} />;
  if (code >= 61 && code <= 67) return <CloudRain {...props} />;
  if (code >= 71 && code <= 77) return <CloudSnow {...props} />;
  if (code >= 80 && code <= 82) return <CloudRain {...props} />;
  if (code >= 85 && code <= 86) return <CloudSnow {...props} />;
  if (code >= 95) return <CloudLightning {...props} />;
  return <CloudSun {...props} />;
}

/** 天気ウィジェット。ブラウザのGeolocationで現在地を取得し、Open-Meteo (APIキー不要) から現在の天気を表示する。 */
export function WeatherWidget() {
  const [status, setStatus] = useState<Status>("idle");
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function load() {
    setStatus("loading");
    try {
      const position = await getCurrentPosition();
      const info = await fetchWeather(position.coords.latitude, position.coords.longitude);
      setWeather(info);
      setStatus("ready");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "天気情報の取得に失敗しました");
      setStatus("error");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (status === "loading" || status === "idle") {
    return (
      <div className="glass-panel flex items-center gap-4 rounded-xl2 p-6">
        <Loader2 size={40} className="animate-spin text-accent" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-medium">現在地の天気を取得中...</p>
          <p className="text-xs text-neutral-500">位置情報の利用を許可してください</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="glass-panel flex items-center gap-4 rounded-xl2 p-6">
        <MapPin size={40} className="text-neutral-400" strokeWidth={1.5} />
        <div className="flex-1">
          <p className="text-sm font-medium">{errorMessage}</p>
          <button onClick={() => void load()} className="app-no-drag mt-1 text-xs text-accent hover:underline">
            再試行
          </button>
        </div>
      </div>
    );
  }

  const info = weather!;
  return (
    <div className="glass-panel flex items-center gap-4 rounded-xl2 p-6">
      <WeatherIcon code={info.weatherCode} isDay={info.isDay} size={40} />
      <div>
        <p className="text-lg font-semibold">{Math.round(info.temperature)}°C</p>
        <p className="text-xs text-neutral-500">{weatherCodeToLabel(info.weatherCode)}</p>
      </div>
    </div>
  );
}
