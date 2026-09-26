// Open-Meteo, coordinates from env only. The result is cached in sqlite; the browser never sees where.
export type WeatherNow = {
  temperature: number;
  feelsLike: number;
  code: number;
  wind: number;
  isDay: boolean;
  humidity: number;
  time: string | null;
};

export async function fetchWeather(): Promise<WeatherNow | null> {
  const lat = process.env.WEATHER_LAT;
  const lon = process.env.WEATHER_LON;
  if (!lat || !lon) return null;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day,relative_humidity_2m&timezone=Europe%2FBerlin`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const c = (await res.json())?.current ?? {};
  return {
    temperature: c.temperature_2m,
    feelsLike: c.apparent_temperature,
    code: c.weather_code,
    wind: c.wind_speed_10m,
    isDay: c.is_day === 1,
    humidity: c.relative_humidity_2m,
    time: typeof c.time === "string" ? c.time.slice(11, 16) : null,
  };
}
