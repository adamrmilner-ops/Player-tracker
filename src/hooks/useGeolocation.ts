import { useState, useCallback } from "react";
import type { GeoLocation, WeatherInfo } from "../types";

export function useGeolocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (lat: number, lng: number) => {
    try {
      // Open-Meteo is free, no API key required
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,weather_code`
      );
      const data = await res.json();
      const current = data.current;

      const weatherCode = current.weather_code as number;
      const description = weatherCodeToDescription(weatherCode);
      const icon = weatherCodeToIcon(weatherCode);

      setWeather({
        description,
        temp: Math.round(current.temperature_2m),
        windSpeed: Math.round(current.wind_speed_10m),
        icon,
      });
    } catch {
      // Weather is nice-to-have, don't fail the whole flow
      setWeather(null);
    }
  }, []);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        await fetchWeather(loc.lat, loc.lng);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [fetchWeather]);

  return { location, weather, loading, error, requestLocation };
}

function weatherCodeToDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
  };
  return descriptions[code] || "Unknown";
}

function weatherCodeToIcon(code: number): string {
  if (code === 0) return "sun";
  if (code <= 3) return "cloud-sun";
  if (code <= 48) return "cloud-fog";
  if (code <= 55) return "cloud-drizzle";
  if (code <= 65) return "cloud-rain";
  if (code <= 75) return "snowflake";
  if (code <= 82) return "cloud-rain";
  return "cloud-lightning";
}
