export interface WeatherInfo {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}

/** WMO weather code -> 日本語ラベル (Open-Meteo の仕様: https://open-meteo.com/en/docs) */
export function weatherCodeToLabel(code: number): string {
  if (code === 0) return "快晴";
  if (code <= 2) return "晴れ";
  if (code === 3) return "くもり";
  if (code === 45 || code === 48) return "霧";
  if (code >= 51 && code <= 57) return "霧雨";
  if (code >= 61 && code <= 67) return "雨";
  if (code >= 71 && code <= 77) return "雪";
  if (code >= 80 && code <= 82) return "にわか雨";
  if (code >= 85 && code <= 86) return "にわか雪";
  if (code >= 95) return "雷雨";
  return "不明";
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("この環境では位置情報が利用できません"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10_000 });
  });
}

export async function fetchWeather(latitude: number, longitude: number): Promise<WeatherInfo> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("天気情報の取得に失敗しました");
  const data = (await res.json()) as {
    current_weather?: { temperature: number; weathercode: number; is_day: number };
  };
  if (!data.current_weather) throw new Error("天気情報の取得に失敗しました");
  return {
    temperature: data.current_weather.temperature,
    weatherCode: data.current_weather.weathercode,
    isDay: data.current_weather.is_day === 1,
  };
}
