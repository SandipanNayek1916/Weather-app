import React, { useState, useEffect, useRef, useMemo, memo, lazy, Suspense } from 'react';
import './styles.css';
import Lenis from '@studio-freight/lenis';
// Auth and LoginModal removed — no sign-in feature needed
import { LogOut, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import NavFolder from './NavFolder.jsx';

const WeatherCharts = lazy(() => import('./WeatherCharts.jsx'));
const MapOverlay = lazy(() => import('./MapOverlay.jsx'));

const { createElement: h, startTransition } = React;
const runTransition =
  typeof startTransition === "function"
    ? startTransition
    : function fallbackTransition(callback) {
      callback();
    };

function el(type, props, ...children) {
  return h(type, props, ...children.flat(Infinity));
}

const DEFAULT_LOCATION = {
  name: "Bardhaman",
  admin1: "West Bengal",
  country: "India",
  latitude: 22.5726,
  longitude: 88.3639,
};

const STORAGE_KEYS = {
  favorites: "weathernow-favorites-v1",
  recents: "weathernow-recents-v1",
  settings: "weathernow-settings-v1",
};

const BRAND_NAME = "Weather Website";
const BRAND_LOGO_URL = "/weather-logo.png";
const DEFAULT_SETTINGS = {
  soundEnabled: false,
};

const QUICK_CITIES = [
  DEFAULT_LOCATION,
  {
    name: "Delhi",
    admin1: "Delhi",
    country: "India",
    latitude: 28.6139,
    longitude: 77.209,
  },
  {
    name: "Mumbai",
    admin1: "Maharashtra",
    country: "India",
    latitude: 19.076,
    longitude: 72.8777,
  },
  {
    name: "Bengaluru",
    admin1: "Karnataka",
    country: "India",
    latitude: 12.9716,
    longitude: 77.5946,
  },
  {
    name: "Chennai",
    admin1: "Tamil Nadu",
    country: "India",
    latitude: 13.0827,
    longitude: 80.2707,
  },
];

const WEATHER_CODE_MAP = {
  0: { label: "Clear sky", shortLabel: "SUN", theme: "sunny" },
  1: { label: "Mostly clear", shortLabel: "SUN", theme: "sunny" },
  2: { label: "Partly cloudy", shortLabel: "CLD", theme: "cloudy" },
  3: { label: "Overcast", shortLabel: "OVR", theme: "cloudy" },
  45: { label: "Fog", shortLabel: "FOG", theme: "mist" },
  48: { label: "Rime fog", shortLabel: "FOG", theme: "mist" },
  51: { label: "Light drizzle", shortLabel: "DRZ", theme: "rain" },
  53: { label: "Drizzle", shortLabel: "DRZ", theme: "rain" },
  55: { label: "Heavy drizzle", shortLabel: "DRZ", theme: "rain" },
  56: { label: "Freezing drizzle", shortLabel: "ICE", theme: "rain" },
  57: { label: "Dense freezing drizzle", shortLabel: "ICE", theme: "rain" },
  61: { label: "Light rain", shortLabel: "RAN", theme: "rain" },
  63: { label: "Rain", shortLabel: "RAN", theme: "rain" },
  65: { label: "Heavy rain", shortLabel: "RAN", theme: "rain" },
  66: { label: "Freezing rain", shortLabel: "ICE", theme: "rain" },
  67: { label: "Heavy freezing rain", shortLabel: "ICE", theme: "rain" },
  71: { label: "Light snow", shortLabel: "SNO", theme: "snow" },
  73: { label: "Snow", shortLabel: "SNO", theme: "snow" },
  75: { label: "Heavy snow", shortLabel: "SNO", theme: "snow" },
  77: { label: "Snow grains", shortLabel: "SNO", theme: "snow" },
  80: { label: "Rain showers", shortLabel: "SHR", theme: "rain" },
  81: { label: "Heavy showers", shortLabel: "SHR", theme: "rain" },
  82: { label: "Violent showers", shortLabel: "SHR", theme: "storm" },
  85: { label: "Snow showers", shortLabel: "SNO", theme: "snow" },
  86: { label: "Heavy snow showers", shortLabel: "SNO", theme: "snow" },
  95: { label: "Thunderstorm", shortLabel: "STM", theme: "storm" },
  96: { label: "Storm with hail", shortLabel: "STM", theme: "storm" },
  99: { label: "Severe hailstorm", shortLabel: "STM", theme: "storm" },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roundCoordinate(value) {
  return Math.round(Number(value) * 1000) / 1000;
}

function normalizeLocation(location) {
  return {
    name: location.name || "Unknown",
    admin1: location.admin1 || "",
    country: location.country || "",
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
  };
}

function sameLocation(first, second) {
  if (!first || !second) {
    return false;
  }

  return (
    roundCoordinate(first.latitude) === roundCoordinate(second.latitude) &&
    roundCoordinate(first.longitude) === roundCoordinate(second.longitude)
  );
}

function pushUniqueLocation(list, location, maxItems) {
  const normalized = normalizeLocation(location);
  const nextItems = [normalized].concat(
    list.filter(function filterItem(item) {
      return !sameLocation(item, normalized);
    })
  );

  return nextItems.slice(0, maxItems);
}

function readStoredLocations(key) {
  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(function filterEntry(item) {
        return item && item.name && item.latitude !== undefined && item.longitude !== undefined;
      })
      .map(normalizeLocation);
  } catch (error) {
    return [];
  }
}

function writeStoredLocations(key, items) {
  try {
    window.localStorage.setItem(key, JSON.stringify(items.map(normalizeLocation)));
  } catch (error) {
    // Ignore storage failures so the app still works in restricted browsers.
  }
}

function readStoredSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.settings);

    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw);
    return {
      soundEnabled:
        typeof parsed.soundEnabled === "boolean"
          ? parsed.soundEnabled
          : DEFAULT_SETTINGS.soundEnabled,
    };
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

function writeStoredSettings(settings) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  } catch (error) {
    // Ignore storage failures.
  }
}

function getWeatherTheme(weatherCode, isDay) {
  const base = WEATHER_CODE_MAP[weatherCode] || WEATHER_CODE_MAP[0];

  if (!isDay && base.theme === "sunny") {
    return { label: "Clear night", shortLabel: "NGT", theme: "night" };
  }

  if (!isDay && base.theme === "cloudy") {
    return {
      label: weatherCode === 3 ? "Cloudy night" : "Partly cloudy night",
      shortLabel: "NCL",
      theme: "cloudy",
    };
  }

  return base;
}

function toRounded(value) {
  return Math.round(Number(value));
}

function formatTemperature(value) {
  return `${toRounded(value)}\u00B0C`;
}

function formatPercent(value) {
  return `${toRounded(value)}%`;
}

function formatPressure(value) {
  return `${toRounded(value)} hPa`;
}

function formatWind(value) {
  return `${toRounded(value)} km/h`;
}

function formatAirValue(value, unit) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }

  return `${Math.round(Number(value) * 10) / 10}${unit}`;
}

function formatClock(dateString) {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatHour(dateString) {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "numeric",
  });
}

function formatWeekday(dateString) {
  return new Date(dateString).toLocaleDateString([], {
    weekday: "short",
  });
}

function formatShortDate(dateString) {
  return new Date(dateString).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function formatRelativeDay(index) {
  if (index === 0) {
    return "Today";
  }

  if (index === 1) {
    return "Tomorrow";
  }

  return `${index}d out`;
}

function getAqiLabel(aqi) {
  const value = Number(aqi);

  if (Number.isNaN(value)) {
    return "Unavailable";
  }

  if (value <= 50) {
    return "Good";
  }

  if (value <= 100) {
    return "Moderate";
  }

  if (value <= 150) {
    return "Unhealthy for sensitive groups";
  }

  if (value <= 200) {
    return "Unhealthy";
  }

  if (value <= 300) {
    return "Very unhealthy";
  }

  return "Hazardous";
}

function getUvLabel(uvIndex) {
  const value = Number(uvIndex);

  if (Number.isNaN(value)) {
    return "Unavailable";
  }

  if (value < 3) {
    return "Low";
  }

  if (value < 6) {
    return "Moderate";
  }

  if (value < 8) {
    return "High";
  }

  if (value < 11) {
    return "Very high";
  }

  return "Extreme";
}

function getComfortLabel(score) {
  if (score >= 82) {
    return "Prime conditions";
  }

  if (score >= 65) {
    return "Good window";
  }

  if (score >= 45) {
    return "Mixed conditions";
  }

  return "Stay weather-aware";
}

function getDaylightProgress(currentTime, sunrise, sunset) {
  const current = new Date(currentTime).getTime();
  const start = new Date(sunrise).getTime();
  const end = new Date(sunset).getTime();

  if (current <= start) {
    return 0;
  }

  if (current >= end) {
    return 1;
  }

  return (current - start) / (end - start);
}

function buildWeatherUrl(location) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "surface_pressure",
      "is_day",
      "precipitation",
    ].join(","),
    hourly: [
      "temperature_2m",
      "weather_code",
      "is_day",
      "precipitation_probability",
      "wind_speed_10m",
      "wind_direction_10m",
      "relative_humidity_2m",
      "surface_pressure",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "sunrise",
      "sunset",
      "uv_index_max",
    ].join(","),
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    timezone: "auto",
    forecast_days: "7",
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function buildAirUrl(location) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    hourly: ["us_aqi", "pm2_5", "pm10", "uv_index"].join(","),
    timezone: "auto",
    forecast_hours: "24",
  });

  return `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
}

function buildGeocodeUrl(query) {
  const params = new URLSearchParams({
    name: query,
    count: "6",
    language: "en",
    format: "json",
  });

  return `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

async function searchLocations(query) {
  const payload = await fetchJson(buildGeocodeUrl(query));
  return payload.results || [];
}

function getCurrentIndex(timeValues, currentTime) {
  if (!Array.isArray(timeValues) || !timeValues.length) {
    return 0;
  }

  const exactIndex = timeValues.indexOf(currentTime);

  if (exactIndex >= 0) {
    return exactIndex;
  }

  const currentMs = new Date(currentTime).getTime();
  let bestIndex = 0;
  let bestDiff = Infinity;

  for (let index = 0; index < timeValues.length; index += 1) {
    const diff = Math.abs(new Date(timeValues[index]).getTime() - currentMs);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function formatLocationLabel(location) {
  const parts = [location.name, location.admin1, location.country].filter(Boolean);
  return parts.join(", ");
}

function formatLocationMeta(location) {
  const parts = [location.admin1, location.country].filter(Boolean);
  return parts.join(", ");
}

function createCoordinateLabel(location) {
  return `${Number(location.latitude).toFixed(2)}, ${Number(location.longitude).toFixed(2)}`;
}

function buildMapEmbedUrl(location) {
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  const delta = 0.28;
  const left = (longitude - delta).toFixed(4);
  const right = (longitude + delta).toFixed(4);
  const top = (latitude + delta).toFixed(4);
  const bottom = (latitude - delta).toFixed(4);

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude.toFixed(4)}%2C${longitude.toFixed(4)}`;
}

function buildMapLink(location) {
  return `https://www.openstreetmap.org/?mlat=${Number(location.latitude).toFixed(4)}&mlon=${Number(location.longitude).toFixed(4)}#map=10/${Number(location.latitude).toFixed(4)}/${Number(location.longitude).toFixed(4)}`;
}

function buildInsights(weather, air, hourlyItems) {
  const score = clamp(
    100 -
    weather.current.relative_humidity_2m * 0.28 -
    weather.current.wind_speed_10m * 0.65 -
    Math.max(0, Number(air.uv_index || 0) - 5) * 6 -
    Math.max(0, Number(air.us_aqi || 0) - 40) * 0.18 -
    weather.current.precipitation * 10,
    18,
    94
  );

  const nextRain = hourlyItems.find(function findRain(item) {
    return item.rainChance >= 45;
  });
  const nextShift = hourlyItems.find(function findShift(item) {
    return item.weatherCode !== weather.current.weather_code;
  });

  return {
    comfortScore: toRounded(score),
    comfortLabel: getComfortLabel(score),
    comfortNote:
      score >= 70
        ? "Great for stepping out, commuting, or evening plans."
        : "Conditions are changing enough that you may want a quick weather check later.",
    rainHeadline: nextRain
      ? `Rain risk rises around ${formatClock(nextRain.time)}`
      : "No strong rain signal in the next several hours",
    rainNote: nextRain
      ? `${nextRain.rainChance}% rain chance with ${formatWind(nextRain.wind)} winds.`
      : "The short-term forecast stays relatively calm and manageable.",
    shiftHeadline: nextShift
      ? `Conditions shift to ${getWeatherTheme(nextShift.weatherCode, nextShift.isDay).label.toLowerCase()}`
      : "The current weather pattern looks stable",
    shiftNote: nextShift
      ? `Expect the character of the sky to change by about ${formatClock(nextShift.time)}.`
      : "No major condition swings detected in the near-term outlook.",
  };
}

function buildLifestyle(weather, air, hourlyItems) {
  const currentTemperature = Number(weather.current.temperature_2m);
  const humidity = Number(weather.current.relative_humidity_2m);
  const wind = Number(weather.current.wind_speed_10m);
  const aqi = Number(air.us_aqi || 0);
  const uv = Number(air.uv_index || 0);
  const bestHour = hourlyItems.reduce(function chooseBestHour(best, item) {
    const score =
      100 -
      Number(item.rainChance || 0) * 0.7 -
      Number(item.wind || 0) * 1.3 -
      Math.abs(Number(item.temperature || currentTemperature) - 26) * 2.1;

    if (!best || score > best.score) {
      return {
        score,
        item,
      };
    }

    return best;
  }, null);

  let clothing = "A light layer should be enough for most plans.";

  if (currentTemperature >= 34) {
    clothing = "Go for breathable clothes, sunglasses, and water-ready plans.";
  } else if (currentTemperature <= 18) {
    clothing = "A light jacket or extra layer will feel better outdoors.";
  } else if (humidity >= 78) {
    clothing = "Light fabrics will feel best because the air is carrying extra moisture.";
  }

  let travel = "Travel conditions look manageable across most of the day.";

  if (aqi >= 140) {
    travel = "Air quality is elevated, so shorter outdoor transfers will feel better.";
  } else if (wind >= 28) {
    travel = "Wind may make roads and open commutes feel rougher than the temperature suggests.";
  } else if (weather.current.precipitation > 0.6) {
    travel = "Active rain is in the mix, so leave extra time for slower movement.";
  }

  let outside = "A balanced outdoor window is available today.";

  if (uv >= 8) {
    outside = "Aim for earlier or later outdoor plans because midday UV is intense.";
  } else if (aqi >= 100) {
    outside = "Outside time is still possible, but shorter windows will feel better with the current air.";
  } else if (bestHour) {
    outside = `The smoothest outdoor window looks close to ${formatClock(bestHour.item.time)}.`;
  }

  return {
    clothing,
    travel,
    outside,
    bestWindow: bestHour
      ? `${formatClock(bestHour.item.time)} with about ${bestHour.item.rainChance}% rain risk`
      : "No standout window available yet",
  };
}

function buildAlerts(weather, air, hourlyItems, dailyItems) {
  const alerts = [];
  const highRainHour = hourlyItems.find(function findHour(item) {
    return Number(item.rainChance) >= 65;
  });
  const windyHour = hourlyItems.find(function findWind(item) {
    return Number(item.wind) >= 28;
  });
  const hotDay = dailyItems.find(function findHot(item) {
    return Number(item.max) >= 36;
  });

  if (Number(air.us_aqi || 0) >= 120) {
    alerts.push({
      tone: "warm",
      title: "Air quality caution",
      detail: `${getAqiLabel(air.us_aqi)} conditions are in effect right now.`,
    });
  }

  if (Number(air.uv_index || 0) >= 8) {
    alerts.push({
      tone: "sun",
      title: "High UV",
      detail: `UV is running high, so midday sun protection matters today.`,
    });
  }

  if (highRainHour) {
    alerts.push({
      tone: "rain",
      title: "Rain spike ahead",
      detail: `${highRainHour.rainChance}% rain chance around ${formatClock(highRainHour.time)}.`,
    });
  }

  if (windyHour) {
    alerts.push({
      tone: "wind",
      title: "Windy period",
      detail: `${formatWind(windyHour.wind)} winds are showing up near ${formatClock(windyHour.time)}.`,
    });
  }

  if (hotDay) {
    alerts.push({
      tone: "heat",
      title: "Hot day ahead",
      detail: `${formatWeekday(hotDay.date)} peaks near ${formatTemperature(hotDay.max)}.`,
    });
  }

  return alerts.slice(0, 4);
}

function averageValue(items, getValue) {
  if (!items.length) {
    return null;
  }

  const total = items.reduce(function accumulate(sum, item) {
    return sum + Number(getValue(item) || 0);
  }, 0);

  return total / items.length;
}

function buildCommutePlan(hourlyItems) {
  const morning = hourlyItems.filter(function filterMorning(item) {
    const hour = new Date(item.time).getHours();
    return hour >= 7 && hour <= 10;
  });
  const evening = hourlyItems.filter(function filterEvening(item) {
    const hour = new Date(item.time).getHours();
    return hour >= 17 && hour <= 20;
  });

  function createWindow(title, items) {
    if (!items.length) {
      return {
        title,
        headline: "No window available",
        note: "There is not enough hourly data loaded yet for this commute window.",
      };
    }

    const avgRain = toRounded(averageValue(items, function getRain(item) {
      return item.rainChance;
    }));
    const avgWind = toRounded(averageValue(items, function getWind(item) {
      return item.wind;
    }));
    const avgTemp = toRounded(averageValue(items, function getTemp(item) {
      return item.temperature;
    }));
    const roughest = items.find(function findRough(item) {
      return item.rainChance >= 55 || item.wind >= 26;
    });

    return {
      title,
      headline: `${avgTemp}\u00B0C avg, ${avgRain}% rain, ${avgWind} km/h wind`,
      note: roughest
        ? `Watch conditions around ${formatClock(roughest.time)} when the commute looks rougher.`
        : "This window looks comparatively smooth for travel and routine movement.",
    };
  }

  return {
    morning: createWindow("Morning commute", morning),
    evening: createWindow("Evening commute", evening),
  };
}

function getChartValue(item, metric) {
  if (metric === "rain") {
    return Number(item.rainChance || 0);
  }

  if (metric === "wind") {
    return Number(item.wind || 0);
  }

  return Number(item.temperature || 0);
}

function buildChartGeometry(items, metric) {
  if (!items.length) {
    return {
      path: "",
      areaPath: "",
      points: [],
      min: 0,
      max: 0,
    };
  }

  const values = items.map(function mapValue(item) {
    return getChartValue(item, metric);
  });
  const min = Math.min.apply(null, values);
  const max = Math.max.apply(null, values);
  const range = Math.max(max - min, 1);

  const points = values.map(function mapPoint(value, index) {
    const x = items.length === 1 ? 16 : 16 + (index / (items.length - 1)) * 84;
    const y = 92 - ((value - min) / range) * 76;
    return {
      x,
      y,
      value,
      label: formatHour(items[index].time),
    };
  });

  const path = points
    .map(function createSegment(point, index) {
      return `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    })
    .join(" ");
  const areaPath = `${path} L 100 100 L 16 100 Z`;

  return {
    path,
    areaPath,
    points,
    min,
    max,
  };
}

function formatChartMetric(metric, value) {
  if (metric === "rain") {
    return `${toRounded(value)}%`;
  }

  if (metric === "wind") {
    return `${toRounded(value)} km/h`;
  }

  return formatTemperature(value);
}

function buildComparisonSummary(baseWeather, baseAir, compareWeather, compareAir) {
  const temperatureDelta =
    Number(compareWeather.current.temperature_2m) - Number(baseWeather.current.temperature_2m);
  const rainDelta =
    Number(compareWeather.daily.precipitation_probability_max[0]) -
    Number(baseWeather.daily.precipitation_probability_max[0]);
  const aqiDelta = Number(compareAir.us_aqi || 0) - Number(baseAir.us_aqi || 0);

  return {
    temperatureDelta,
    rainDelta,
    aqiDelta,
    temperatureCopy:
      temperatureDelta >= 0
        ? `${Math.abs(toRounded(temperatureDelta))}\u00B0 warmer`
        : `${Math.abs(toRounded(temperatureDelta))}\u00B0 cooler`,
    rainCopy:
      rainDelta >= 0
        ? `${Math.abs(toRounded(rainDelta))}% higher rain risk`
        : `${Math.abs(toRounded(rainDelta))}% lower rain risk`,
    aqiCopy:
      aqiDelta >= 0
        ? `${Math.abs(toRounded(aqiDelta))} AQI points heavier`
        : `${Math.abs(toRounded(aqiDelta))} AQI points cleaner`,
  };
}

function buildBestOutsideHours(hourlyItems) {
  return hourlyItems
    .map(function mapHour(item) {
      const score = clamp(
        100 -
        Number(item.rainChance || 0) * 0.78 -
        Number(item.wind || 0) * 1.15 -
        Math.abs(Number(item.temperature || 0) - 26) * 1.8,
        8,
        96
      );

      return {
        time: item.time,
        score: toRounded(score),
        rainChance: item.rainChance,
        wind: item.wind,
        temperature: item.temperature,
      };
    })
    .sort(function sortHours(first, second) {
      return second.score - first.score;
    })
    .slice(0, 3);
}

function buildHealthAdvisories(weather, air) {
  const items = [];
  const humidity = Number(weather.current.relative_humidity_2m || 0);
  const uv = Number(air.uv_index || 0);
  const aqi = Number(air.us_aqi || 0);

  items.push(
    aqi >= 120
      ? {
        label: "Air health",
        headline: getAqiLabel(aqi),
        note: "Mask-friendly plans and shorter outdoor exposure may feel better today.",
      }
      : {
        label: "Air health",
        headline: "Air looks manageable",
        note: "Current air conditions are more supportive for routine outdoor time.",
      }
  );

  items.push(
    uv >= 8
      ? {
        label: "UV advisory",
        headline: "High UV hours",
        note: "Midday sun protection matters, especially for long outdoor sessions.",
      }
      : {
        label: "UV advisory",
        headline: "UV is calmer",
        note: "Sun exposure is easier to manage, though protection is still smart.",
      }
  );

  items.push(
    humidity >= 82
      ? {
        label: "Comfort watch",
        headline: "Sticky air",
        note: "High humidity can make the day feel warmer and heavier than the number suggests.",
      }
      : {
        label: "Comfort watch",
        headline: "Comfortable moisture",
        note: "Humidity is not the main factor pushing comfort down right now.",
      }
  );

  return items;
}

function getSkyMotion(currentTime, sunrise, sunset, isDay) {
  const current = new Date(currentTime);
  const currentMinutes = current.getHours() * 60 + current.getMinutes();
  const sunriseDate = new Date(sunrise);
  const sunsetDate = new Date(sunset);
  const sunriseMinutes = sunriseDate.getHours() * 60 + sunriseDate.getMinutes();
  const sunsetMinutes = sunsetDate.getHours() * 60 + sunsetDate.getMinutes();

  let progress;

  if (isDay) {
    progress = clamp(
      (currentMinutes - sunriseMinutes) / Math.max(sunsetMinutes - sunriseMinutes, 1),
      0,
      1
    );
  } else {
    const fullNight = currentMinutes < sunriseMinutes
      ? currentMinutes + 24 * 60 - sunsetMinutes
      : currentMinutes - sunsetMinutes;
    const totalNight = sunriseMinutes + 24 * 60 - sunsetMinutes;
    progress = clamp(fullNight / Math.max(totalNight, 1), 0, 1);
  }

  return {
    left: `${10 + progress * 76}%`,
    top: `${isDay ? 14 + Math.sin(progress * Math.PI) * 28 : 18 + Math.sin(progress * Math.PI) * 18}%`,
  };
}

function createSparkle(id, x, y) {
  return {
    id,
    x,
    y,
    size: 10 + (id % 14),
  };
}

function createAmbientAudioController() {
  let audioContext = null;
  let masterGain = null;
  let windSource = null;
  let rainSource = null;
  let breezeSource = null;
  let windGain = null;
  let rainGain = null;
  let breezeGain = null;
  let windFilter = null;
  let thunderTimer = null;
  let cricketTimer = null;

  function createNoiseSource(context) {
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  async function ensureContext() {
    if (audioContext) {
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      return;
    }

    const ContextClass = window.AudioContext || window.webkitAudioContext;

    if (!ContextClass) {
      return;
    }

    audioContext = new ContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.0001;
    masterGain.connect(audioContext.destination);

    // Wind channel — adjustable bandpass
    windSource = createNoiseSource(audioContext);
    windFilter = audioContext.createBiquadFilter();
    windFilter.type = "bandpass";
    windFilter.frequency.value = 420;
    windFilter.Q.value = 0.35;
    windGain = audioContext.createGain();
    windGain.gain.value = 0.0001;
    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(masterGain);
    windSource.start();

    // Rain channel — highpass for patter
    rainSource = createNoiseSource(audioContext);
    const rainHighpass = audioContext.createBiquadFilter();
    rainHighpass.type = "highpass";
    rainHighpass.frequency.value = 1400;
    rainGain = audioContext.createGain();
    rainGain.gain.value = 0.0001;
    rainSource.connect(rainHighpass);
    rainHighpass.connect(rainGain);
    rainGain.connect(masterGain);
    rainSource.start();

    // Breeze/ambient channel — low bandpass for gentle hum/breeze
    breezeSource = createNoiseSource(audioContext);
    const breezeFilter = audioContext.createBiquadFilter();
    breezeFilter.type = "bandpass";
    breezeFilter.frequency.value = 180;
    breezeFilter.Q.value = 0.2;
    breezeGain = audioContext.createGain();
    breezeGain.gain.value = 0.0001;
    breezeSource.connect(breezeFilter);
    breezeFilter.connect(breezeGain);
    breezeGain.connect(masterGain);
    breezeSource.start();
  }

  function scheduleThunderIfNeeded(enabled, theme) {
    if (thunderTimer) {
      window.clearInterval(thunderTimer);
      thunderTimer = null;
    }

    if (!enabled || theme !== "storm" || !audioContext || !masterGain) {
      return;
    }

    thunderTimer = window.setInterval(function playThunder() {
      if (!audioContext || Math.random() > 0.34) {
        return;
      }

      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(58, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(22, audioContext.currentTime + 1.6);
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.07, audioContext.currentTime + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 2.0);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      osc.stop(audioContext.currentTime + 2.1);
    }, 3800);
  }

  function scheduleCrickets(enabled, isNight) {
    if (cricketTimer) {
      window.clearInterval(cricketTimer);
      cricketTimer = null;
    }

    if (!enabled || !isNight || !audioContext || !masterGain) {
      return;
    }

    cricketTimer = window.setInterval(function playCricket() {
      if (!audioContext || Math.random() > 0.5) {
        return;
      }

      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = "sine";
      const freq = 3800 + Math.random() * 600;
      osc.frequency.setValueAtTime(freq, audioContext.currentTime);
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.012, audioContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      osc.stop(audioContext.currentTime + 0.15);
    }, 280);
  }

  async function update(config) {
    if (!config.enabled) {
      if (masterGain && audioContext) {
        masterGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.18);
      }
      scheduleThunderIfNeeded(false, config.theme);
      scheduleCrickets(false, false);
      return;
    }

    await ensureContext();

    if (!audioContext || !masterGain || !windGain || !rainGain || !breezeGain) {
      return;
    }

    const theme = config.theme;
    const isNight = !config.isDay;
    let windLevel = 0.0001;
    let rainLevel = 0.0001;
    let breezeLevel = 0.0001;
    let windFreq = 420;
    let windQ = 0.35;

    if (theme === "sunny" || theme === "night") {
      // Gentle warm breeze
      windLevel = clamp(Number(config.windSpeed || 0) / 50, 0.01, 0.08);
      breezeLevel = 0.04;
      windFreq = 320;
      windQ = 0.25;
    } else if (theme === "cloudy") {
      // Deeper, moodier wind
      windLevel = clamp(Number(config.windSpeed || 0) / 38, 0.02, 0.14);
      breezeLevel = 0.06;
      windFreq = 280;
      windQ = 0.3;
    } else if (theme === "rain") {
      // Rain patter + moderate wind
      windLevel = clamp(Number(config.windSpeed || 0) / 34, 0.03, 0.16);
      rainLevel = clamp(Number(config.rainAmount || 0) / 8, 0.035, 0.1);
      breezeLevel = 0.03;
      windFreq = 380;
      windQ = 0.4;
    } else if (theme === "storm") {
      // Heavy rain + strong gusting wind
      windLevel = clamp(Number(config.windSpeed || 0) / 28, 0.06, 0.22);
      rainLevel = clamp(Number(config.rainAmount || 0) / 6, 0.05, 0.12);
      breezeLevel = 0.02;
      windFreq = 460;
      windQ = 0.5;
    } else if (theme === "mist") {
      // Very soft, ethereal hum
      windLevel = 0.02;
      breezeLevel = 0.08;
      windFreq = 200;
      windQ = 0.15;
    } else if (theme === "snow") {
      // Quiet muffled wind
      windLevel = clamp(Number(config.windSpeed || 0) / 45, 0.01, 0.1);
      breezeLevel = 0.05;
      windFreq = 250;
      windQ = 0.2;
    }

    masterGain.gain.setTargetAtTime(0.55, audioContext.currentTime, 0.2);
    windGain.gain.setTargetAtTime(windLevel, audioContext.currentTime, 0.22);
    rainGain.gain.setTargetAtTime(rainLevel, audioContext.currentTime, 0.22);
    breezeGain.gain.setTargetAtTime(breezeLevel, audioContext.currentTime, 0.22);

    // Smoothly shift wind filter for different tones per weather
    windFilter.frequency.setTargetAtTime(windFreq, audioContext.currentTime, 0.3);
    windFilter.Q.setTargetAtTime(windQ, audioContext.currentTime, 0.3);

    scheduleThunderIfNeeded(true, theme);
    scheduleCrickets(true, isNight && (theme === "sunny" || theme === "night" || theme === "cloudy"));
  }

  function stop() {
    if (thunderTimer) {
      window.clearInterval(thunderTimer);
      thunderTimer = null;
    }

    if (cricketTimer) {
      window.clearInterval(cricketTimer);
      cricketTimer = null;
    }

    if (masterGain && audioContext) {
      masterGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.16);
    }
  }

  return {
    update,
    stop,
  };
}

function SearchSuggestions(props) {
  if (!props.items.length) {
    return null;
  }

  return el(
    "div",
    { className: "search-results" },
    props.items.map(function renderItem(item) {
      const label = formatLocationMeta(item) || createCoordinateLabel(item);
      return el(
        "button",
        {
          key: `${item.id || item.latitude}-${item.longitude}`,
          type: "button",
          className: "search-result",
          onClick: function handleClick() {
            props.onSelect(item);
          },
        },
        el("span", { className: "search-result-title" }, item.name),
        el("span", { className: "search-result-meta" }, label)
      );
    })
  );
}

function LoadingBlock(props) {
  return el(
    "div",
    { className: "status-card glass-card" },
    el("div", { className: "status-pulse", "aria-hidden": "true" }),
    el("div", null, props.label)
  );
}

function ErrorBlock(props) {
  return el(
    "div",
    { className: "status-card status-card-error glass-card" },
    el("strong", null, "Could not load weather data."),
    el("p", null, props.message),
    el(
      "button",
      {
        type: "button",
        className: "action-button action-button-secondary",
        onClick: props.onRetry,
      },
      "Try again"
    )
  );
}

function CursorEffects(props) {
  return el(
    "div",
    { className: "cursor-layer", "aria-hidden": "true" },
    el("div", {
      className: props.visible ? "cursor-core cursor-visible" : "cursor-core",
      style: { transform: "translate3d(var(--mouse-x), var(--mouse-y), 0)" }
    }),
    el("div", {
      className: props.visible ? "cursor-halo cursor-visible" : "cursor-halo",
      style: { transform: "translate3d(var(--mouse-x), var(--mouse-y), 0)" }
    }),
    props.sparkles.map(function mapSparkle(item) {
      return el("div", {
        key: item.id,
        className: "cursor-sparkle",
        style: {
          transform: `translate3d(${item.x}px, ${item.y}px, 0) scale(${item.scale})`,
          opacity: 0,
        },
      });
    })
  );
}

function WeatherGlyph(props) {
  const theme = props.theme;
  const size = props.size || 34;
  const stroke = props.isNight ? "#dbe7ff" : "currentColor";
  const className = [props.className, "weather-glyph", `weather-glyph-${theme}`]
    .filter(Boolean)
    .join(" ");

  if (theme === "sunny") {
    return el(
      "svg",
      {
        viewBox: "0 0 48 48",
        className,
        width: size,
        height: size,
        fill: "none",
        stroke,
        strokeWidth: "2.4",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
      },
      el("circle", { cx: "24", cy: "24", r: "7.5" }),
      Array.from({ length: 8 }).map(function renderRay(_, index) {
        const angle = (Math.PI * 2 * index) / 8;
        const x1 = 24 + Math.cos(angle) * 11;
        const y1 = 24 + Math.sin(angle) * 11;
        const x2 = 24 + Math.cos(angle) * 17;
        const y2 = 24 + Math.sin(angle) * 17;

        return el("line", {
          key: `sun-ray-${index}`,
          x1: x1.toFixed(2),
          y1: y1.toFixed(2),
          x2: x2.toFixed(2),
          y2: y2.toFixed(2),
        });
      })
    );
  }

  if (theme === "night") {
    return el(
      "svg",
      {
        viewBox: "0 0 48 48",
        className,
        width: size,
        height: size,
        fill: "none",
        stroke,
        strokeWidth: "2.4",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
      },
      el("path", { d: "M31 11a13 13 0 1 0 6 24A15 15 0 1 1 31 11Z" }),
      el("circle", { cx: "34", cy: "16", r: "1.2", fill: stroke, stroke: "none" }),
      el("circle", { cx: "37", cy: "22", r: "1.1", fill: stroke, stroke: "none" })
    );
  }

  if (theme === "mist") {
    return el(
      "svg",
      {
        viewBox: "0 0 48 48",
        className,
        width: size,
        height: size,
        fill: "none",
        stroke,
        strokeWidth: "2.4",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
      },
      el("path", { d: "M10 18h28" }),
      el("path", { d: "M6 24h24" }),
      el("path", { d: "M14 30h26" })
    );
  }

  return el(
    "svg",
    {
      viewBox: "0 0 48 48",
      className,
      width: size,
      height: size,
      fill: "none",
      stroke,
      strokeWidth: "2.4",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
    },
    el("path", { d: "M16 33h18a8 8 0 0 0 1-15.9 11.5 11.5 0 0 0-21.7 3.7A6.9 6.9 0 0 0 16 33Z" }),
    theme === "rain" || theme === "storm"
      ? [
        el("path", { key: "rain-1", d: "M19 36l-2 5" }),
        el("path", { key: "rain-2", d: "M26 36l-2 5" }),
        el("path", { key: "rain-3", d: "M33 36l-2 5" }),
      ]
      : null,
    theme === "storm"
      ? el("path", { d: "M24 35l-2.5 6h4l-2 6 7-9h-4l2-5Z" })
      : null,
    theme === "snow"
      ? [
        el("circle", { key: "snow-1", cx: "19", cy: "39", r: "1.4" }),
        el("circle", { key: "snow-2", cx: "26", cy: "42", r: "1.4" }),
        el("circle", { key: "snow-3", cx: "33", cy: "39", r: "1.4" }),
      ]
      : null
  );
}

function AmbientBackground(props) {
  const windFactor = clamp((Number(props.windSpeed || 0) - 4) / 26, 0, 1);
  const rainFactor = clamp(Number(props.rainAmount || 0) / 4, 0, 1);
  const cloudDuration = `${42 - windFactor * 18}s`;
  const rainDuration = `${1.2 - rainFactor * 0.35}s`;

  const isRainy = props.theme === "rain" || props.theme === "storm";
  const isSnowy = props.theme === "snow";
  const isCloudy = props.theme === "cloudy" || isRainy || props.theme === "mist" || isSnowy;
  const backCloudCount = props.theme === "storm" ? 8 : isCloudy ? 6 : 3;
  const frontCloudCount = props.theme === "storm" ? 6 : isCloudy ? 5 : 2;
  const rainCount = props.theme === "storm" ? 48 : isRainy ? 40 : isSnowy ? 30 : 14;
  const starCount = !props.isDay ? 18 : 10;

  return el(
    "div",
    {
      className: `ambient-scene ambient-scene-${props.theme} ambient-scene-${props.isDay ? "day" : "night"
        }`,
      "aria-hidden": "true",
      style: {
        "--cloud-speed": cloudDuration,
        "--front-cloud-speed": `${34 - windFactor * 15}s`,
        "--rain-speed": rainDuration,
        "--scene-energy": props.cinematicMode ? 1 : 0.65,
        "--sparkle-opacity": props.cinematicMode ? 0.42 : 0.2,
        "--sky-left": props.skyMotion ? props.skyMotion.left : "50%",
        "--sky-top": props.skyMotion ? props.skyMotion.top : "12%",
        "--parallax-x": props.pointer ? `${props.pointer.x}px` : "0px",
        "--parallax-y": props.pointer ? `${props.pointer.y}px` : "0px",
      },
    },
    el("div", { className: "ambient-sky-gradient" }),
    el("div", { className: "ambient-grid" }),
    el("div", { className: "ambient-wash" }),
    el("div", { className: "ambient-noise" }),
    el(
      "div",
      { className: "aurora-ribbons" },
      Array.from({ length: 3 }).map(function renderRibbon(_, index) {
        return el("span", { key: `aurora-${index}` });
      })
    ),
    el("div", { className: "ambient-orb ambient-orb-a" }),
    el("div", { className: "ambient-orb ambient-orb-b" }),
    el("div", { className: "sky-disc" }),
    el("div", { className: "sky-disc-glow" }),
    el(
      "div",
      { className: "sun-rays" },
      Array.from({ length: 8 }).map(function renderRay(_, index) {
        return el("span", {
          key: `ray-${index}`,
          style: {
            transform: `rotate(${index * 45}deg) translateY(-110px)`,
          },
        });
      })
    ),
    el(
      "div",
      { className: "star-field" },
      Array.from({ length: starCount }).map(function renderStar(_, index) {
        return el("span", { key: `star-${index}` });
      })
    ),
    el(
      "div",
      { className: "meteor-layer" },
      Array.from({ length: 2 }).map(function renderMeteor(_, index) {
        return el("span", { key: `meteor-${index}` });
      })
    ),
    el(
      "div",
      { className: "cloud-layer cloud-layer-back" },
      Array.from({ length: backCloudCount }).map(function renderCloud(_, index) {
        return el("span", { key: `cloud-back-${index}` });
      })
    ),
    el(
      "div",
      { className: "cloud-layer cloud-layer-mid" },
      Array.from({ length: isCloudy ? 4 : 0 }).map(function renderCloud(_, index) {
        return el("span", { key: `cloud-mid-${index}` });
      })
    ),
    el(
      "div",
      { className: "cloud-layer cloud-layer-front" },
      Array.from({ length: frontCloudCount }).map(function renderCloud(_, index) {
        return el("span", { key: `cloud-front-${index}` });
      })
    ),
    el(
      "div",
      { className: "rain-layer" },
      Array.from({ length: rainCount }).map(function renderDrop(_, index) {
        return el("span", { key: `rain-${index}` });
      })
    ),
    el(
      "div",
      { className: "lightning-layer" },
      Array.from({ length: 3 }).map(function renderBolt(_, index) {
        return el("span", { key: `bolt-${index}` });
      })
    ),
    el(
      "div",
      { className: "ambient-particles" },
      Array.from({ length: 8 }).map(function renderParticle(_, index) {
        return el("span", { key: `particle-${index}` });
      })
    ),
    el(
      "div",
      { className: "ambient-sparkles" },
      Array.from({ length: 10 }).map(function renderSparkle(_, index) {
        return el("span", { key: `ambient-sparkle-${index}` });
      })
    ),
    el("div", { className: "ambient-radar-ring ambient-radar-ring-a" }),
    el("div", { className: "ambient-radar-ring ambient-radar-ring-b" })
  );
}

function GaugeCard(props) {
  const safeValue = clamp(Number(props.value) || 0, 0, props.max);
  const circumference = 2 * Math.PI * 48;
  const progress = (safeValue / props.max) * circumference;

  return el(ScrollReveal, { as: "article", className: "gauge-card glass-card reveal-card" },
    el("div", { className: "mini-label" }, props.label),
    el(
      "div",
      { className: "gauge-wrap" },
      el(
        "svg",
        { viewBox: "0 0 120 120", className: "gauge-svg", role: "img", "aria-label": props.label },
        el("circle", {
          cx: "60",
          cy: "60",
          r: "48",
          className: "gauge-track",
        }),
        el("circle", {
          cx: "60",
          cy: "60",
          r: "48",
          className: `gauge-progress gauge-progress-${props.tone}`,
          style: {
            strokeDasharray: circumference,
            strokeDashoffset: circumference - progress,
          },
        })
      ),
      el(
        "div",
        { className: "gauge-center" },
        el("strong", null, props.displayValue)
      ),
      el("div", { className: "gauge-caption" }, props.caption)
    )
  );
}

function SearchPanel(props) {
  return el(
    "div",
    { className: "search-shell", id: "search-panel", ref: props.panelRef },
    el(
      "form",
      {
        className: "search-form",
        onSubmit: props.onSearchSubmit,
      },
      el(
        "label",
        { className: "search-label", htmlFor: "city-search" },
        "Search city"
      ),
      el(
        "div",
        { className: "search-row" },
        el("input", {
          id: "city-search",
          className: "search-input",
          type: "text",
          placeholder: "Search for a city",
          value: props.searchValue,
          autoComplete: "off",
          onChange: props.onSearchChange,
          onKeyDown: props.onSearchKeyDown,
        }),
        el(
          "button",
          { type: "submit", className: "action-button" },
          "Search"
        ),
        el(
          "button",
          {
            type: "button",
            className: "action-button action-button-secondary",
            onClick: props.onUseCurrentLocation,
            disabled: props.locating,
          },
          props.locating ? "Locating..." : "Use my location"
        )
      ),
      el(
        "div",
        { className: "search-note" },
        props.searching
          ? "Looking up matching cities..."
          : "Search worldwide or jump to your current location."
      )
    ),
    el(SearchSuggestions, {
      items: props.suggestions,
      onSelect: props.onSelectSuggestion,
    })
  );
}

function LocationRail(props) {
  if (!props.items.length) {
    return null;
  }

  return el(
    "div",
    { className: "city-rail" },
    props.items.map(function renderCity(city) {
      const active = sameLocation(city, props.selectedLocation);
      return el(
        "button",
        {
          key: `${city.name}-${city.country}-${roundCoordinate(city.latitude)}-${roundCoordinate(city.longitude)}`,
          type: "button",
          className: active ? "city-chip city-chip-active" : "city-chip",
          onClick: function handleClick() {
            props.onChooseCity(city);
          },
        },
        city.name
      );
    })
  );
}

function HeroSection(props) {
  const weatherTheme = getWeatherTheme(
    props.weather.current.weather_code,
    props.weather.current.is_day
  );
  const currentDay = props.weather.daily;
  const daylightProgress = getDaylightProgress(
    props.weather.current.time,
    currentDay.sunrise[0],
    currentDay.sunset[0]
  );

  return el(
    "section",
    { className: "hero-grid" },
    el(ScrollReveal, { as: "div", className: "hero-copy-panel glass-card reveal-card" },
      el("div", { className: "eyebrow" }, `Live forecast`),
      el("h1", null, "Atmospheric intelligence."),
      el(
        "p",
        { className: "hero-copy" },
        "Precise radar, air quality, and global tracking."
      ),
      el(SearchPanel, props.searchProps),
      el(
        "div",
        { className: "hero-actions" },
        el("a", { className: "ghost-button", href: "#forecast-section" }, "Jump to forecast"),
        el("a", { className: "ghost-button ghost-button-strong", href: "#details-section" }, "View details")
      ),
      el(
        "div",
        { className: "hero-subsection" },
        el("div", { className: "subsection-title" }, "Quick cities"),
        el(QuickCityRail, {
          selectedLocation: props.selectedLocation,
          onChooseCity: props.onChooseCity,
        })
      ),
      el(
        "div",
        { className: "hero-subsection" },
        el(
          "div",
          { className: "section-heading-inline" },
          el("div", { className: "subsection-title" }, "Saved cities"),
          el(
            "button",
            {
              type: "button",
              className: props.isFavorite
                ? "city-chip city-chip-active city-chip-compact"
                : "city-chip city-chip-compact",
              onClick: function handleFavoriteClick() {
                props.onToggleFavorite(props.selectedLocation);
              },
            },
            props.isFavorite ? "Saved" : "Save this city"
          )
        ),
        props.favoriteCities.length
          ? el(LocationRail, {
            items: props.favoriteCities,
            selectedLocation: props.selectedLocation,
            onChooseCity: props.onChooseCity,
          })
          : el("p", { className: "helper-copy" }, "Save cities you want quick access to here.")
      ),
      el(
        "div",
        { className: "hero-subsection" },
        el(
          "div",
          { className: "section-heading-inline" },
          el("div", { className: "subsection-title" }, "Recent searches"),
          props.recentCities.length
            ? el(
              "button",
              {
                type: "button",
                className: "city-chip city-chip-compact",
                onClick: props.onClearRecent,
              },
              "Clear"
            )
            : null
        ),
        props.recentCities.length
          ? el(LocationRail, {
            items: props.recentCities,
            selectedLocation: props.selectedLocation,
            onChooseCity: props.onChooseCity,
          })
          : el("p", { className: "helper-copy" }, "Your recent locations will appear here automatically.")
      ),
      el(
        "div",
        { className: "ticker-strip" },
        props.tickerItems.map(function renderItem(item) {
          return el(
            "div",
            { key: item.label, className: "ticker-chip" },
            el("span", null, item.label),
            el("strong", null, item.value)
          );
        })
      )
    ),
    el(
      "div",
      { className: "hero-side-column" },
      el(
        ScrollReveal,
        { as: "article", className: `current-card current-card-${weatherTheme.theme} glass-card reveal-card` },
        el(
          "div",
          { className: "current-card-top" },
          el(
            "div",
            null,
            el("div", { className: "card-label" }, "Current weather"),
            el("h2", { className: "current-location" }, props.locationLabel),
            el(
              "p",
              { className: "card-subtle" },
              `Updated ${formatClock(props.weather.current.time)} ${props.weather.timezone_abbreviation || ""}`
            )
          ),
          el(
            "div",
            { className: "weather-badge weather-badge-icon" },
            el(WeatherGlyph, {
              theme: weatherTheme.theme,
              isNight: !props.weather.current.is_day,
              className: "weather-glyph weather-glyph-badge",
              size: 28,
            }),
            el("span", null, weatherTheme.shortLabel)
          )
        ),
        el(
          "div",
          { className: "temperature-row" },
          el("div", { className: "temperature-main" }, formatTemperature(props.weather.current.temperature_2m)),
          el(
            "div",
            { className: "temperature-side" },
            el("div", { className: "condition-line" }, weatherTheme.label),
            el("div", { className: "card-subtle" }, `Feels like ${formatTemperature(props.weather.current.apparent_temperature)}`)
          )
        ),
        el(
          "div",
          { className: "today-range" },
          el(
            "div",
            { className: "range-chip" },
            el("span", null, "High"),
            el("strong", null, formatTemperature(currentDay.temperature_2m_max[0]))
          ),
          el(
            "div",
            { className: "range-chip" },
            el("span", null, "Low"),
            el("strong", null, formatTemperature(currentDay.temperature_2m_min[0]))
          ),
          el(
            "div",
            { className: "range-chip" },
            el("span", null, "Rain chance"),
            el("strong", null, formatPercent(currentDay.precipitation_probability_max[0]))
          )
        )
      ),
      
      el(
        "div",
        { className: "hero-mini-grid" },
        el(GaugeCard, {
          label: "US AQI",
          value: props.air.us_aqi,
          max: 300,
          displayValue:
            props.air.us_aqi === null ? "--" : toRounded(props.air.us_aqi),
          caption: getAqiLabel(props.air.us_aqi),
          tone: "mint",
        }),
        el(GaugeCard, {
          label: "UV",
          value: props.air.uv_index,
          max: 12,
          displayValue: formatAirValue(props.air.uv_index, ""),
          caption: getUvLabel(props.air.uv_index),
          tone: "warm",
        }),
        el(ScrollReveal, { as: "article", className: "mini-panel glass-card reveal-card" },
          el("div", { className: "mini-label" }, "Daylight arc"),
          el(
            "div",
            { className: "sun-track" },
            el("div", {
              className: "sun-progress",
              style: { width: `${clamp(daylightProgress * 100, 0, 100)}%` },
            }),
            el("div", {
              className: "sun-knob",
              style: { left: `${clamp(daylightProgress * 100, 0, 100)}%` },
            })
          ),
          el(
            "div",
            { className: "sun-meta" },
            el(
              "div",
              null,
              el("span", null, "Sunrise"),
              el("strong", null, formatClock(currentDay.sunrise[0]))
            ),
            el(
              "div",
              null,
              el("span", null, "Sunset"),
              el("strong", null, formatClock(currentDay.sunset[0]))
            )
          )
        ),
        el(ScrollReveal, { as: "article", className: "mini-panel mini-panel-story glass-card reveal-card" },
          el("div", { className: "mini-label" }, "Outdoor score"),
          el("strong", { className: "story-value" }, props.insights.comfortScore),
          el("div", { className: "story-title" }, props.insights.comfortLabel),
          el("p", { className: "story-copy" }, props.insights.comfortNote)
        )
      )
    )
  );
}

function QuickCityRail(props) {
  return el(LocationRail, {
    items: QUICK_CITIES,
    selectedLocation: props.selectedLocation,
    onChooseCity: props.onChooseCity,
  });
}

function IntroOverlay(props) {
  const locationMeta = formatLocationMeta(props.location) || createCoordinateLabel(props.location);

  return el(
    "div",
    {
      className: [
        "intro-overlay",
        `intro-overlay-${props.theme}`,
        props.isDay ? "intro-overlay-day" : "intro-overlay-night",
        props.exiting ? "intro-overlay-leave" : "",
      ]
        .filter(Boolean)
        .join(" "),
    },
    el("div", { className: "intro-noise" }),
    el("div", { className: "intro-orbit intro-orbit-a" }),
    el("div", { className: "intro-orbit intro-orbit-b" }),
    el(
      "div",
      { className: "intro-lines" },
      el("span", { className: "intro-line intro-line-a" }),
      el("span", { className: "intro-line intro-line-b" }),
      el("span", { className: "intro-line intro-line-c" }),
      el("span", { className: "intro-line intro-line-d" })
    ),
    el(
      "div",
      { className: "intro-content glass-card" },
      el("div", { className: "intro-chip" }, props.isDay ? "Live sky sequence" : "Night atmosphere live"),
      el(
        "div",
        { className: "intro-head" },
        el("div", { className: "intro-kicker" }, BRAND_NAME),
        el("h1", { className: "intro-city" }, props.location.name),
        el("p", { className: "intro-region" }, locationMeta)
      ),
      el(
        "div",
        { className: "intro-main" },
        el("div", { className: "intro-temp" }, formatTemperature(props.temperature)),
        el(
          "div",
          { className: "intro-stack" },
          el("div", { className: "intro-condition" }, props.conditionLabel),
          el(
            "div",
            { className: "intro-range" },
            `H ${formatTemperature(props.high)}  L ${formatTemperature(props.low)}`
          )
        )
      ),
      el(
        "div",
        { className: "intro-metrics" },
        el(
          "div",
          { className: "intro-metric" },
          el("span", null, "Humidity"),
          el("strong", null, formatPercent(props.humidity))
        ),
        el(
          "div",
          { className: "intro-metric" },
          el("span", null, "Wind"),
          el("strong", null, formatWind(props.wind))
        ),
        el(
          "div",
          { className: "intro-metric" },
          el("span", null, "Air"),
          el(
            "strong",
            null,
            props.aqi === null || props.aqi === undefined
              ? "Unavailable"
              : getAqiLabel(props.aqi)
          )
        )
      ),
      el("div", { className: "intro-caption" }, "Calibrating atmosphere, daylight, and forecast layers")
    )
  );
}

function HourlySection(props) {
  const temperatures = props.items.map(function mapTemperature(item) {
    return Number(item.temperature);
  });
  const minTemperature = Math.min.apply(null, temperatures);
  const maxTemperature = Math.max.apply(null, temperatures);
  const temperatureSpan = Math.max(maxTemperature - minTemperature, 1);

  return el(ScrollReveal, { as: "section", className: "panel-section glass-card reveal-card", id: "hourly-section" },
    el(
      "div",
      { className: "section-heading" },
      el(
        "div",
        null,
        el("div", { className: "eyebrow" }, "Next 24 hours"),
        el("h2", null, "Hourly forecast"),
        el(
          "p",
          { className: "section-copy" },
          "A longer hourly runway makes temperature swings, wind changes, and rain risk easier to scan."
        )
      )
    ),
    el(
      "div",
      { className: "hourly-grid" },
      props.items.map(function renderHour(item, index) {
        const theme = getWeatherTheme(item.weatherCode, item.isDay);
        const fill = clamp(
          ((Number(item.temperature) - minTemperature) / temperatureSpan) * 100,
          14,
          100
        );

        return el(
          "article",
          {
            key: `${item.time}-${item.temperature}-${item.rainChance}-${item.weatherCode}`,
            className: "hour-card",
          },
          el("div", { className: "hour-time" }, formatHour(item.time)),
          el(
            "div",
            { className: "hour-icon-wrap" },
            el(WeatherGlyph, {
              theme: theme.theme,
              isNight: !item.isDay,
              className: "weather-glyph weather-glyph-hour",
              size: 28,
            }),
            el("div", { className: "hour-icon" }, theme.shortLabel)
          ),
          el("strong", { className: "hour-temp" }, formatTemperature(item.temperature)),
          el(
            "div",
            {
              className: "hour-bar",
              style: {
                "--fill": `${fill}%`,
                "--delay": `${index * 85}ms`,
              },
            },
            el("span")
          ),
          el("div", { className: "hour-meta" }, `${item.rainChance}% rain chance`),
          el("div", { className: "hour-meta" }, `${toRounded(item.wind)} km/h wind`)
        );
      })
    )
  );
}

function AlertSection(props) {
  if (!props.items.length) {
    return null;
  }

  return el(ScrollReveal, { as: "section", className: "panel-section glass-card reveal-card" },
    el(
      "div",
      { className: "section-heading" },
      el(
        "div",
        null,
        el("div", { className: "eyebrow" }, "Live signals"),
        el("h2", null, "Today highlights"),
        el(
          "p",
          { className: "section-copy" },
          "The strongest weather changes are surfaced here so the dashboard stays useful at a glance."
        )
      )
    ),
    el(
      "div",
      { className: "alert-grid" },
      props.items.map(function renderAlert(item) {
        return el(
          "article",
          {
            key: `${item.title}-${item.tone}`,
            className: `alert-card alert-card-${item.tone} glass-card`,
          },
          el("div", { className: "mini-label" }, item.title),
          el("p", { className: "alert-copy" }, item.detail)
        );
      })
    )
  );
}

function InsightSection(props) {
  return el(
    "section",
    { className: "insight-grid" },
    el(ScrollReveal, { as: "article", className: "insight-card glass-card reveal-card" },
      el("div", { className: "mini-label" }, "Comfort signal"),
      el("h3", null, props.insights.comfortLabel),
      el("p", null, props.insights.comfortNote)
    ),
    el(ScrollReveal, { as: "article", className: "insight-card glass-card reveal-card" },
      el("div", { className: "mini-label" }, "Rain outlook"),
      el("h3", null, props.insights.rainHeadline),
      el("p", null, props.insights.rainNote)
    ),
    el(ScrollReveal, { as: "article", className: "insight-card glass-card reveal-card" },
      el("div", { className: "mini-label" }, "Pattern change"),
      el("h3", null, props.insights.shiftHeadline),
      el("p", null, props.insights.shiftNote)
    )
  );
}

function ForecastSection(props) {
  return el(ScrollReveal, { as: "section", className: "panel-section glass-card reveal-card", id: "forecast-section" },
    el(
      "div",
      { className: "section-heading" },
      el(
        "div",
        null,
        el("div", { className: "eyebrow" }, "Next 7 days"),
        el("h2", null, "Weekly outlook"),
        el(
          "p",
          { className: "section-copy" },
          "Seven days of outlook, spread, UV, and rain risk give the dashboard a stronger planning view."
        )
      )
    ),
    el(
      "div",
      { className: "daily-grid" },
      props.items.map(function renderDay(item, index) {
        const theme = getWeatherTheme(item.weatherCode, true);
        const temperatureSpan = clamp(((item.max - item.min) / 20) * 100, 18, 100);

        return el(
          "article",
          {
            key: `${item.date}-${item.max}-${item.min}-${item.rainChance}-${item.weatherCode}`,
            className: "day-card",
          },
          el(
            "div",
            { className: "day-top" },
            el(
              "div",
              null,
              el("div", { className: "mini-label" }, formatRelativeDay(index)),
              el("strong", { className: "day-name" }, formatWeekday(item.date)),
              el("div", { className: "card-subtle" }, formatShortDate(item.date))
            ),
            el(
              "div",
              { className: "weather-badge weather-badge-small weather-badge-icon" },
              el(WeatherGlyph, {
                theme: theme.theme,
                isNight: false,
                className: "weather-glyph weather-glyph-day",
                size: 22,
              }),
              el("span", null, theme.shortLabel)
            )
          ),
          el("div", { className: "day-condition" }, theme.label),
          el(
            "div",
            { className: "day-temps" },
            el("strong", null, formatTemperature(item.max)),
            el("span", null, formatTemperature(item.min))
          ),
          el(
            "div",
            {
              className: "temp-span-track",
              style: {
                "--fill": `${temperatureSpan}%`,
                "--delay": `${index * 95}ms`,
              },
            },
            el("span")
          ),
          el(
            "div",
            { className: "day-meta-row" },
            el("span", null, `${item.rainChance}% rain`),
            el("span", null, `UV ${toRounded(item.uv)}`)
          )
        );
      })
    )
  );
}

function LifestyleSection(props) {
  return el(
    "section",
    { className: "insight-grid lifestyle-grid" },
    el(ScrollReveal, { as: "article", className: "insight-card glass-card reveal-card" },
      el("div", { className: "mini-label" }, "Clothing cue"),
      el("h3", null, "Dress for the air"),
      el("p", null, props.lifestyle.clothing)
    ),
    el(ScrollReveal, { as: "article", className: "insight-card glass-card reveal-card" },
      el("div", { className: "mini-label" }, "Travel advice"),
      el("h3", null, "Move with less friction"),
      el("p", null, props.lifestyle.travel)
    ),
    el(ScrollReveal, { as: "article", className: "insight-card glass-card reveal-card" },
      el("div", { className: "mini-label" }, "Outside window"),
      el("h3", null, props.lifestyle.bestWindow),
      el("p", null, props.lifestyle.outside)
    )
  );
}

function BestTimeSection(props) {
  return el(ScrollReveal, { as: "section", className: "panel-section glass-card reveal-card", id: "best-time-section" },
    el(
      "div",
      { className: "section-heading" },
      el(
        "div",
        null,
        el("div", { className: "eyebrow" }, "Smart outside timing"),
        el("h2", null, "Best hours to go out"),
        el(
          "p",
          { className: "section-copy" },
          "These hour-by-hour picks combine temperature, rain, and wind so the cleanest outside window stands out."
        )
      )
    ),
    el(
      "div",
      { className: "best-time-grid" },
      props.items.map(function renderHour(item) {
        return el(ScrollReveal, { as: "article", key: item.time, className: "best-time-card glass-card reveal-card" },
          el("div", { className: "mini-label" }, formatClock(item.time)),
          el("strong", { className: "story-value best-time-score" }, formatTemperature(item.temperature)),
          el(
            "p",
            { className: "story-copy" },
            `${item.rainChance}% rain chance and ${toRounded(item.wind)} km/h wind.`
          )
        );
      })
    )
  );
}

function HealthSection(props) {
  return el(
    "section",
    { className: "insight-grid health-grid" },
    props.items.map(function renderItem(item) {
      return el(ScrollReveal, { as: "article", key: item.label, className: "insight-card glass-card reveal-card health-card" },
        el("div", { className: "mini-label" }, item.label),
        el("h3", null, item.headline),
        el("p", null, item.note)
      );
    })
  );
}

function MapSection(props) {
  return el(ScrollReveal, { as: "section", className: 'panel-section glass-card reveal-card', id: 'map-section' },
    h(Suspense, { fallback: h('div', { style: { height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b96a5' } }, 'Loading Geographic Radar...') },
      h(MapOverlay, { lat: props.location?.latitude, lon: props.location?.longitude, name: props.location?.name })
    )
  );
}

function CommuteSection(props) {
  return el(ScrollReveal, { as: "section", className: "panel-section glass-card reveal-card", id: "commute-section" },
    el(
      "div",
      { className: "section-heading" },
      el(
        "div",
        null,
        el("div", { className: "eyebrow" }, "Smart travel tools"),
        el("h2", null, "Commute assistant"),
        el(
          "p",
          { className: "section-copy" },
          "Morning and evening commute windows are summarized so travel friction is easier to read."
        )
      )
    ),
    el(
      "div",
      { className: "commute-grid" },
      [props.plan.morning, props.plan.evening].map(function renderWindow(item) {
        return el(
          "article",
          { key: item.title, className: "commute-card" },
          el("div", { className: "mini-label" }, item.title),
          el("h3", null, item.headline),
          el("p", null, item.note)
        );
      })
    )
  );
}

function TrendSection(props) {
  return el(ScrollReveal, { as: "section", className: "panel-section glass-card reveal-card", id: "trend-section" },
    h(Suspense, { fallback: h('div', { style: { height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b96a5' } }, 'Loading Interactive Charts...') },
      h(WeatherCharts, { hourly: props.hourly })
    )
  );
}

function ComparisonSection(props) {
  return el(ScrollReveal, { as: "section", className: "panel-section glass-card reveal-card", id: "compare-section" },
    el(
      "div",
      { className: "section-heading" },
      el(
        "div",
        null,
        el("div", { className: "eyebrow" }, "Interactive compare"),
        el("h2", null, "City comparison mode"),
        el(
          "p",
          { className: "section-copy" },
          "Compare the active city with another place to spot temperature, rain, and air-quality differences instantly."
        )
      )
    ),
    el(
      "div",
      { className: "compare-city-row" },
      props.options.map(function renderOption(city) {
        const active = sameLocation(city, props.compareLocation);
        return el(
          "button",
          {
            key: `${city.name}-${city.country}-${roundCoordinate(city.latitude)}`,
            type: "button",
            className: active ? "city-chip city-chip-active" : "city-chip",
            onClick: function handleClick() {
              props.onCompareChange(city);
            },
          },
          city.name
        );
      })
    ),
    props.loading
      ? el("div", { className: "helper-copy" }, "Loading comparison weather...")
      : props.summary
        ? el(
          "div",
          { className: "compare-grid" },
          el(
            "article",
            { className: "compare-card" },
            el("div", { className: "mini-label" }, "Temperature"),
            el("h3", null, props.summary.temperatureCopy),
            el("p", null, `${props.compareLocation.name} compared with ${props.baseLocation.name}.`)
          ),
          el(
            "article",
            { className: "compare-card" },
            el("div", { className: "mini-label" }, "Rain signal"),
            el("h3", null, props.summary.rainCopy),
            el("p", null, "Useful for travel, errands, and outdoor planning.")
          ),
          el(
            "article",
            { className: "compare-card" },
            el("div", { className: "mini-label" }, "Air quality"),
            el("h3", null, props.summary.aqiCopy),
            el("p", null, "Air differences are surfaced separately so the cleanest option is easier to spot.")
          )
        )
        : el("div", { className: "helper-copy" }, "Choose a second city to begin comparing.")
  );
}

function DetailsSection(props) {
  return el(ScrollReveal, { as: "section", className: "panel-section glass-card reveal-card", id: "details-section" },
    el(
      "div",
      { className: "section-heading" },
      el(
        "div",
        null,
        el("div", { className: "eyebrow" }, "Detailed atmosphere"),
        el("h2", null, "Weather details and signals"),
        el(
          "p",
          { className: "section-copy" },
          "Everything is still balanced around your original choices: temperature, humidity, wind, pressure, UV, air quality, and solar timing."
        )
      )
    ),
    el(
      "div",
      { className: "details-grid" },
      el(
        "article",
        { className: "detail-card detail-card-highlight" },
        el("div", { className: "detail-label" }, "Air quality"),
        el(
          "strong",
          { className: "detail-value" },
          props.air.us_aqi === null ? "--" : toRounded(props.air.us_aqi)
        ),
        el("div", { className: "detail-support" }, getAqiLabel(props.air.us_aqi)),
        el("div", { className: "detail-note" }, el("div", null, `PM2.5: ${formatAirValue(props.air.pm2_5, " µg/m³")}`), el("div", { style: { marginTop: "4px" } }, `PM10: ${formatAirValue(props.air.pm10, " µg/m³")}`))
      ),
      el(
        "article",
        { className: "detail-card" },
        el("div", { className: "detail-label" }, "Humidity"),
        el("strong", { className: "detail-value" }, formatPercent(props.weather.current.relative_humidity_2m)),
        el("div", { className: "detail-support" }, "Relative humidity"),
        el("p", { className: "detail-note" }, "Helpful for understanding how sticky, dry, or comfortable the air feels.")
      ),
      el(
        "article",
        { className: "detail-card" },
        el("div", { className: "detail-label" }, "Wind"),
        el("strong", { className: "detail-value" }, formatWind(props.weather.current.wind_speed_10m)),
        el("div", { className: "detail-support" }, "At 10 meters"),
        el("p", { className: "detail-note" }, "Wind can quickly change comfort, commuting ease, and rain exposure.")
      ),
      el(
        "article",
        { className: "detail-card" },
        el("div", { className: "detail-label" }, "Pressure"),
        el("strong", { className: "detail-value" }, formatPressure(props.weather.current.surface_pressure)),
        el("div", { className: "detail-support" }, "Surface pressure"),
        el("p", { className: "detail-note" }, "A deeper atmospheric read that pairs well with shifting cloud and rain patterns.")
      ),
      el(
        "article",
        { className: "detail-card" },
        el("div", { className: "detail-label" }, "UV index"),
        el("strong", { className: "detail-value" }, formatAirValue(props.air.uv_index, "")),
        el("div", { className: "detail-support" }, getUvLabel(props.air.uv_index)),
        el("p", { className: "detail-note" }, "Useful for planning sun protection during your brightest hours.")
      ),
      el(
        "article",
        { className: "detail-card" },
        el("div", { className: "detail-label" }, "Precipitation now"),
        el("strong", { className: "detail-value" }, formatAirValue(props.weather.current.precipitation, " mm")),
        el("div", { className: "detail-support" }, "Current precipitation"),
        el("p", { className: "detail-note" }, "A real-time rain snapshot helps distinguish damp air from actual rainfall.")
      ),
      el(
        "article",
        { className: "detail-card" },
        el("div", { className: "detail-label" }, "Sunrise"),
        el("strong", { className: "detail-value" }, formatClock(props.weather.daily.sunrise[0])),
        el("div", { className: "detail-support" }, "Local time"),
        el("p", { className: "detail-note" }, "Day-start timing for routines, travel, and photography windows.")
      ),
      el(
        "article",
        { className: "detail-card" },
        el("div", { className: "detail-label" }, "Sunset"),
        el("strong", { className: "detail-value" }, formatClock(props.weather.daily.sunset[0])),
        el("div", { className: "detail-support" }, "Local time"),
        el("p", { className: "detail-note" }, "Useful for planning outdoor time before daylight fades.")
      ),
      el(
        "article",
        { className: "detail-card detail-card-map" },
        el("div", { className: "detail-label" }, "Selected location"),
        el("strong", { className: "detail-value detail-value-location" }, props.locationLabel),
        el("div", { className: "detail-support" }, `Coordinates ${props.coordinateLabel}`),
        el("p", { className: "detail-note" }, `Timezone ${props.weather.timezone} (${props.weather.timezone_abbreviation || "local"})`)
      )
    )
  );
}

// Performance-optimized ScrollReveal: uses a single shared IntersectionObserver
// instead of creating one per component (was ~30+ observers before)
const sharedObserverCallbacks = new Map();
let sharedObserver = null;

function getSharedObserver() {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    function handleEntries(entries) {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (entry.isIntersecting) {
          const cb = sharedObserverCallbacks.get(entry.target);
          if (cb) {
            cb();
            sharedObserverCallbacks.delete(entry.target);
            sharedObserver.unobserve(entry.target);
          }
        }
      }
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  );
  return sharedObserver;
}

function ScrollReveal(props) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(function observe() {
    const el_ = ref.current;
    if (!el_) return;
    const obs = getSharedObserver();
    sharedObserverCallbacks.set(el_, function () { setIsVisible(true); });
    obs.observe(el_);
    return function cleanup() {
      sharedObserverCallbacks.delete(el_);
      obs.unobserve(el_);
    };
  }, []);

  const elementProps = Object.assign({}, props);
  delete elementProps.as;
  delete elementProps.children;
  elementProps.ref = ref;
  elementProps.className = `scroll-reveal ${props.className || ""} ${isVisible ? "is-visible" : ""}`;

  return el(props.as || "div", elementProps, props.children);
}

function App() {
  // Auth removed — no sign-in feature


  useEffect(function initLenis() {
    if (typeof Lenis !== "undefined") {
      const lenis = new Lenis({
        duration: 1.2,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);

      return function () {
        lenis.destroy();
      };
    }
  }, []);
  const skipSuggestionLookup = useRef(false);
  const sparkleTimerRef = useRef(null);
  const sparkleIdRef = useRef(0);
  const searchPanelRef = useRef(null);
  const introPlayedRef = useRef(false);
  const autoLocateRef = useRef(false);
  const audioControllerRef = useRef(null);
  const [searchValue, setSearchValue] = useState(DEFAULT_LOCATION.name);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_LOCATION);
  const [weatherPayload, setWeatherPayload] = useState(null);
  const [airPayload, setAirPayload] = useState(null);
  const [cursorState, setCursorState] = useState({
    x: 0,
    y: 0,
    visible: false,
  });
  const [sparkles, setSparkles] = useState([]);
  const [favoriteCities, setFavoriteCities] = useState(function loadFavorites() {
    return readStoredLocations(STORAGE_KEYS.favorites);
  });
  const [recentCities, setRecentCities] = useState(function loadRecents() {
    return readStoredLocations(STORAGE_KEYS.recents);
  });
  const [settings, setSettings] = useState(function loadSettings() {
    return readStoredSettings();
  });
  const [chartMetric, setChartMetric] = useState("temperature");
  const [compareLocation, setCompareLocation] = useState(function initialCompare() {
    return QUICK_CITIES[1];
  });
  const [comparePayload, setComparePayload] = useState(null);
  const [compareAirPayload, setCompareAirPayload] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [introExiting, setIntroExiting] = useState(false);

  async function loadWeather(location) {
    setLoading(true);
    setErrorMessage("");

    try {
      const [weather, airQuality] = await Promise.all([
        fetchJson(buildWeatherUrl(location)),
        fetchJson(buildAirUrl(location)),
      ]);

      setSelectedLocation(location);
      setWeatherPayload(weather);
      setAirPayload(airQuality);
      setSuggestions([]);
      return true;
    } catch (error) {
      setErrorMessage(
        "The weather service could not be reached right now. Please try again in a moment."
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(function loadDefaultCity() {
    loadWeather(DEFAULT_LOCATION);
  }, []);

  useEffect(function syncFavoriteCities() {
    writeStoredLocations(STORAGE_KEYS.favorites, favoriteCities);
  }, [favoriteCities]);

  useEffect(function syncRecentCities() {
    writeStoredLocations(STORAGE_KEYS.recents, recentCities);
  }, [recentCities]);

  useEffect(function syncSettings() {
    writeStoredSettings(settings);
  }, [settings]);

  useEffect(function ensureAudioController() {
    audioControllerRef.current = createAmbientAudioController();

    return function cleanup() {
      if (audioControllerRef.current) {
        audioControllerRef.current.stop();
      }
    };
  }, []);

  useEffect(function tryAutoLocateOnLoad() {
    if (!navigator.geolocation || autoLocateRef.current) {
      return undefined;
    }

    autoLocateRef.current = true;

    if (!navigator.permissions || !navigator.permissions.query) {
      return undefined;
    }

    let cancelled = false;

    navigator.permissions
      .query({ name: "geolocation" })
      .then(function handlePermission(permissionStatus) {
        if (cancelled || permissionStatus.state !== "granted") {
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async function handleSuccess(position) {
            if (cancelled) {
              return;
            }

            let locationName = "Current location";
            let locationAdmin1 = "";
            let locationCountry = "";

            try {
              const reverseRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
              if (reverseRes.ok) {
                const data = await reverseRes.json();
                if (data.city || data.locality) {
                  locationName = data.city || data.locality;
                  locationAdmin1 = data.principalSubdivision || "";
                  locationCountry = data.countryName || "";
                }
              }
            } catch (error) {
              // fallback
            }

            const location = {
              name: locationName,
              admin1: locationAdmin1,
              country: locationCountry,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };

            await chooseLocation(location);
          },
          function ignoreFailure() {
            // Keep the default city when automatic location access is unavailable.
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
          }
        );
      })
      .catch(function ignorePermissionError() {
        // Ignore unsupported or blocked permission queries.
      });

    return function cleanup() {
      cancelled = true;
    };
  }, []);

  useEffect(
    function keepComparisonDistinct() {
      if (!compareLocation || !sameLocation(compareLocation, selectedLocation)) {
        return;
      }

      const fallback = QUICK_CITIES.concat(favoriteCities).concat(recentCities).find(function findCity(city) {
        return !sameLocation(city, selectedLocation);
      });

      if (fallback) {
        setCompareLocation(fallback);
      }
    },
    [compareLocation, selectedLocation, favoriteCities, recentCities]
  );

  useEffect(function handleOutsideSearchClick() {
    function closeSearchResults(event) {
      if (!searchPanelRef.current) {
        return;
      }

      if (!searchPanelRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    }

    window.addEventListener("mousedown", closeSearchResults);
    window.addEventListener("touchstart", closeSearchResults);

    return function cleanup() {
      window.removeEventListener("mousedown", closeSearchResults);
      window.removeEventListener("touchstart", closeSearchResults);
    };
  }, []);

  useEffect(function trackPointer() {
    function handleMove(event) {
      const x = event.clientX;
      const y = event.clientY;
      
      // Update DOM perfectly at screen refresh rate bypassing React
      document.documentElement.style.setProperty('--mouse-x', x + 'px');
      document.documentElement.style.setProperty('--mouse-y', y + 'px');
      document.documentElement.style.setProperty('--parallax-x', (((x / window.innerWidth) - 0.5) * 28) + 'px');
      document.documentElement.style.setProperty('--parallax-y', (((y / window.innerHeight) - 0.5) * 20) + 'px');

      setCursorState(state => {
        if (!state.visible) return { visible: true };
        return state;
      });

      if (!sparkleTimerRef.current) {
        const nextId = sparkleIdRef.current;
        sparkleIdRef.current += 1;
        setSparkles(function addSparkle(items) {
          return items.concat(createSparkle(nextId, x, y)).slice(-6);
        });
        sparkleTimerRef.current = window.setTimeout(function releaseSparkle() {
          sparkleTimerRef.current = null;
        }, 150);
      }
    }

    function handleLeave() {
      setCursorState(state => ({ visible: false }));
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerleave", handleLeave);

    return function cleanup() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
      if (sparkleTimerRef.current) clearTimeout(sparkleTimerRef.current);
    };
  }, []);

  useEffect(
    function pruneSparkles() {
      if (!sparkles.length) {
        return undefined;
      }

      const timer = window.setTimeout(function removeOldSparkles() {
        setSparkles(function trimSparkles(items) {
          return items.slice(-4);
        });
      }, 600);

      return function cleanup() {
        window.clearTimeout(timer);
      };
    },
    [sparkles]
  );

  useEffect(
    function runIntroSequence() {
      if (!weatherPayload || loading || introPlayedRef.current) {
        return undefined;
      }

      introPlayedRef.current = true;
      setShowIntro(true);
      setIntroExiting(false);

      const exitTimer = window.setTimeout(function startOutro() {
        setIntroExiting(true);
      }, 2100);
      const hideTimer = window.setTimeout(function hideIntro() {
        setShowIntro(false);
      }, 3200);

      return function cleanup() {
        // Removed clearTimeout so timers survive React 18 StrictMode's instant remount
      };
    },
    [weatherPayload, loading]
  );

  useEffect(
    function lookupSuggestions() {
      const trimmedValue = searchValue.trim();

      if (skipSuggestionLookup.current) {
        skipSuggestionLookup.current = false;
        setSearching(false);
        return;
      }

      if (trimmedValue.length < 2) {
        setSearching(false);
        setSuggestions([]);
        return;
      }

      let ignore = false;
      const timer = window.setTimeout(async function requestSuggestions() {
        setSearching(true);

        try {
          const results = await searchLocations(trimmedValue);

          if (!ignore) {
            runTransition(function updateSuggestions() {
              setSuggestions(results);
            });
          }
        } catch (error) {
          if (!ignore) {
            setSuggestions([]);
          }
        } finally {
          if (!ignore) {
            setSearching(false);
          }
        }
      }, 240);

      return function cleanup() {
        ignore = true;
        window.clearTimeout(timer);
      };
    },
    [searchValue]
  );

  async function chooseLocation(location) {
    const normalized = normalizeLocation(location);
    skipSuggestionLookup.current = true;
    setSearchValue(normalized.name || `${normalized.latitude}, ${normalized.longitude}`);
    setSuggestions([]);
    const didLoad = await loadWeather(normalized);

    if (didLoad) {
      setRecentCities(function updateRecents(items) {
        return pushUniqueLocation(items, normalized, 8);
      });
    }
  }

  function toggleFavoriteCity(location) {
    const normalized = normalizeLocation(location);

    setFavoriteCities(function updateFavorites(items) {
      if (items.some(function hasCity(item) {
        return sameLocation(item, normalized);
      })) {
        return items.filter(function removeCity(item) {
          return !sameLocation(item, normalized);
        });
      }

      return pushUniqueLocation(items, normalized, 8);
    });
  }

  function toggleSound() {
    setSettings(function toggleAudio(current) {
      return {
        soundEnabled: !current.soundEnabled,
      };
    });
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Escape") {
      setSuggestions([]);
    }
  }

  async function handleSearchSubmit(event) {
    event.preventDefault();

    const query = searchValue.trim();

    if (!query) {
      return;
    }

    setSearching(true);

    try {
      const results = await searchLocations(query);

      if (!results.length) {
        setErrorMessage("No matching city was found. Try a different search.");
        setSuggestions([]);
        return;
      }

      await chooseLocation(results[0]);
    } catch (error) {
      setErrorMessage("City search failed. Please check the name and try again.");
    } finally {
      setSearching(false);
    }
  }

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setErrorMessage("This browser does not support geolocation.");
      return;
    }

    setLocating(true);
    setErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      async function handleSuccess(position) {
        let locationName = "Current location";
        let locationAdmin1 = "";
        let locationCountry = "";

        try {
          const reverseRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
          if (reverseRes.ok) {
            const data = await reverseRes.json();
            if (data.city || data.locality) {
              locationName = data.city || data.locality;
              locationAdmin1 = data.principalSubdivision || "";
              locationCountry = data.countryName || "";
            }
          }
        } catch (error) {
          // fallback to default if API fails
        }

        const location = {
          name: locationName,
          admin1: locationAdmin1,
          country: locationCountry,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        await chooseLocation(location);
        setLocating(false);
      },
      function handleFailure() {
        setLocating(false);
        setErrorMessage("Location access was denied or unavailable.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  useEffect(
    function loadComparisonWeather() {
      if (!compareLocation || sameLocation(compareLocation, selectedLocation)) {
        setComparePayload(null);
        setCompareAirPayload(null);
        setCompareLoading(false);
        return undefined;
      }

      let ignore = false;
      setCompareLoading(true);

      Promise.all([
        fetchJson(buildWeatherUrl(compareLocation)),
        fetchJson(buildAirUrl(compareLocation)),
      ])
        .then(function handleComparisonSuccess(results) {
          if (ignore) {
            return;
          }

          setComparePayload(results[0]);
          setCompareAirPayload(results[1]);
        })
        .catch(function handleComparisonFailure() {
          if (ignore) {
            return;
          }

          setComparePayload(null);
          setCompareAirPayload(null);
        })
        .finally(function finishComparison() {
          if (!ignore) {
            setCompareLoading(false);
          }
        });

      return function cleanup() {
        ignore = true;
      };
    },
    [compareLocation, selectedLocation]
  );

  useEffect(
    function syncAmbientAudio() {
      if (!audioControllerRef.current || !weatherPayload) {
        return;
      }

      const nextTheme = getWeatherTheme(
        weatherPayload.current.weather_code,
        weatherPayload.current.is_day
      ).theme;

      audioControllerRef.current.update({
        enabled: settings.soundEnabled,
        theme: nextTheme,
        isDay: Boolean(weatherPayload.current.is_day),
        windSpeed: weatherPayload.current.wind_speed_10m,
        rainAmount: weatherPayload.current.precipitation,
      });
    },
    [
      settings.soundEnabled,
      weatherPayload ? weatherPayload.current.weather_code : null,
      weatherPayload ? weatherPayload.current.is_day : null,
      weatherPayload ? weatherPayload.current.wind_speed_10m : null,
      weatherPayload ? weatherPayload.current.precipitation : null,
    ]
  );

  if (loading && !weatherPayload) {
    return el(
      "div",
      { className: "app-shell app-shell-sunny" },
      el(AmbientBackground, {
        theme: "sunny",
        isDay: true,
      }),
      el(CursorEffects, {
        x: cursorState.x,
        y: cursorState.y,
        visible: cursorState.visible,
        sparkles,
      }),
      el(
        "main",
        { className: "page-wrap" },
        el(LoadingBlock, { label: "Loading..." })
      )
    );
  }

  if (errorMessage && !weatherPayload) {
    return el(
      "div",
      { className: "app-shell app-shell-sunny" },
      el(AmbientBackground, {
        theme: "sunny",
        isDay: true,
      }),
      el(CursorEffects, {
        x: cursorState.x,
        y: cursorState.y,
        visible: cursorState.visible,
        sparkles,
      }),
      el(
        "main",
        { className: "page-wrap" },
        el(ErrorBlock, {
          message: errorMessage,
          onRetry: function retry() {
            loadWeather(DEFAULT_LOCATION);
          },
        })
      )
    );
  }

  const currentIndex = getCurrentIndex(
    weatherPayload.hourly.time,
    weatherPayload.current.time
  );
  const airIndex = getCurrentIndex(airPayload.hourly.time, weatherPayload.current.time);
  const airSnapshot = {
    us_aqi: airPayload.hourly.us_aqi[airIndex] ?? null,
    pm2_5: airPayload.hourly.pm2_5[airIndex] ?? null,
    pm10: airPayload.hourly.pm10[airIndex] ?? null,
    uv_index: airPayload.hourly.uv_index[airIndex] ?? null,
  };
  const currentTheme = getWeatherTheme(
    weatherPayload.current.weather_code,
    weatherPayload.current.is_day
  );
  const theme = currentTheme.theme;
  const hourlyItems = weatherPayload.hourly.time
    .slice(currentIndex, currentIndex + 24)
    .map(function mapHour(time, offset) {
      const index = currentIndex + offset;
      return {
        time,
        temperature: weatherPayload.hourly.temperature_2m[index],
        weatherCode: weatherPayload.hourly.weather_code[index],
        isDay: Boolean(weatherPayload.hourly.is_day[index]),
        rainChance: toRounded(
          weatherPayload.hourly.precipitation_probability[index]
        ),
        wind: weatherPayload.hourly.wind_speed_10m[index],
      };
    });
  const dailyItems = weatherPayload.daily.time.map(function mapDay(date, index) {
    return {
      date,
      weatherCode: weatherPayload.daily.weather_code[index],
      max: weatherPayload.daily.temperature_2m_max[index],
      min: weatherPayload.daily.temperature_2m_min[index],
      rainChance: toRounded(
        weatherPayload.daily.precipitation_probability_max[index]
      ),
      uv: weatherPayload.daily.uv_index_max[index],
    };
  });
  const locationLabel = formatLocationLabel(selectedLocation);
  const coordinateLabel = createCoordinateLabel(selectedLocation);
  const tickerItems = [
    { label: "Feels like", value: formatTemperature(weatherPayload.current.apparent_temperature) },
    { label: "Humidity", value: formatPercent(weatherPayload.current.relative_humidity_2m) },
    { label: "Wind", value: formatWind(weatherPayload.current.wind_speed_10m) },
    { label: "Pressure", value: formatPressure(weatherPayload.current.surface_pressure) },
  ];
  const insights = buildInsights(weatherPayload, airSnapshot, hourlyItems);
  const lifestyle = buildLifestyle(weatherPayload, airSnapshot, hourlyItems);
  const bestOutsideHours = buildBestOutsideHours(hourlyItems);
  const healthAdvisories = buildHealthAdvisories(weatherPayload, airSnapshot);
  const alerts = buildAlerts(weatherPayload, airSnapshot, hourlyItems, dailyItems);
  const commutePlan = buildCommutePlan(hourlyItems);
  const compareOptions = pushUniqueLocation(
    QUICK_CITIES.concat(favoriteCities).concat(recentCities).filter(function filterCity(city) {
      return !sameLocation(city, selectedLocation);
    }),
    compareLocation,
    10
  );
  const compareSummary =
    comparePayload && compareAirPayload
      ? buildComparisonSummary(
        weatherPayload,
        airSnapshot,
        comparePayload,
        {
          us_aqi: compareAirPayload.hourly.us_aqi[
            getCurrentIndex(compareAirPayload.hourly.time, comparePayload.current.time)
          ] ?? null,
        }
      )
      : null;
  const isFavorite = favoriteCities.some(function checkFavorite(item) {
    return sameLocation(item, selectedLocation);
  });
  const introProps = {
    theme,
    isDay: Boolean(weatherPayload.current.is_day),
    exiting: introExiting,
    location: selectedLocation,
    temperature: weatherPayload.current.temperature_2m,
    conditionLabel: currentTheme.label,
    high: weatherPayload.daily.temperature_2m_max[0],
    low: weatherPayload.daily.temperature_2m_min[0],
    humidity: weatherPayload.current.relative_humidity_2m,
    wind: weatherPayload.current.wind_speed_10m,
    aqi: airSnapshot.us_aqi,
  };
  const skyMotion = getSkyMotion(
    weatherPayload.current.time,
    weatherPayload.daily.sunrise[0],
    weatherPayload.daily.sunset[0],
    Boolean(weatherPayload.current.is_day)
  );

  return (
    <React.Fragment>
      {el(
        "div",
        {
          className: `app-shell app-shell-${theme} app-shell-accent-ocean app-shell-cinematic`,
        },
        el(AmbientBackground, {
          theme,
          isDay: Boolean(weatherPayload.current.is_day),
          windSpeed: weatherPayload.current.wind_speed_10m,
          rainAmount: weatherPayload.current.precipitation,
          cinematicMode: true,
          skyMotion,
          pointer: cursorState.visible
        ? { x: 0, y: 0 }
        : { x: 0, y: 0 },
        }),
        showIntro ? el(IntroOverlay, introProps) : null,
        !showIntro
          ? el(CursorEffects, {
            x: cursorState.x,
            y: cursorState.y,
            visible: cursorState.visible,
            sparkles,
          })
          : null,
        el(
          "header",
          { className: "topbar page-wrap" },
          el(
            "a",
            { href: "#weather-app", className: "brand" },
            el("img", { className: "brand-mark-img", src: BRAND_LOGO_URL, alt: "Weather App", width: 52, height: 52 }),
            el(
              "span",
              { className: "brand-copy" },
              el("strong", null, BRAND_NAME)
            )
          ),
          h(NavFolder, { folderName: 'Navigate' }),
          el("div", { className: "topbar-tools" },
            el(
              "button",
              {
                type: "button",
                className: settings.soundEnabled
                  ? "ghost-button ghost-button-strong topbar-toggle"
                  : "ghost-button topbar-toggle",
                onClick: toggleSound,
              },
              settings.soundEnabled ? "🔊 Sound on" : "🔇 Sound off"
            ),
            el("div", { className: "topbar-note" }, `Live in ${selectedLocation.name}`)
          )
        ),
        el(
          "main",
          { className: "page-wrap", id: "weather-app" },
          errorMessage
            ? el(
              "div",
              { className: "inline-alert glass-card" },
              el("span", null, errorMessage)
            )
            : null,
          loading ? el(LoadingBlock, { label: "Refreshing forecast..." }) : null,
          el(HeroSection, {
            weather: weatherPayload,
            air: airSnapshot,
            insights,
            locationLabel,
            selectedLocation,
            searchProps: {
              panelRef: searchPanelRef,
              searchValue,
              searching,
              suggestions,
              locating,
              onSearchChange: function handleChange(event) {
                setSearchValue(event.target.value);
              },
              onSearchKeyDown: handleSearchKeyDown,
              onSearchSubmit: handleSearchSubmit,
              onUseCurrentLocation: handleUseCurrentLocation,
              onSelectSuggestion: chooseLocation,
            },
            onChooseCity: chooseLocation,
            onToggleFavorite: toggleFavoriteCity,
            tickerItems,
            favoriteCities,
            recentCities,
            isFavorite,
            onClearRecent: function clearRecent() {
              setRecentCities([]);
            },
          }),
          el(AlertSection, { items: alerts }),
          el(BestTimeSection, { items: bestOutsideHours }),
          el(HealthSection, { items: healthAdvisories }),
          el(InsightSection, { insights }),
          el(LifestyleSection, { lifestyle }),
          el(CommuteSection, { plan: commutePlan }),
          el(TrendSection, {
            items: hourlyItems,
            hourly: weatherPayload.hourly,
            metric: chartMetric,
            onMetricChange: setChartMetric,
          }),
          el(HourlySection, { items: hourlyItems }),
          el(ForecastSection, { items: dailyItems }),
          el(ComparisonSection, {
            options: compareOptions,
            compareLocation,
            onCompareChange: setCompareLocation,
            loading: compareLoading,
            summary: compareSummary,
            baseLocation: selectedLocation,
          }),
          el(MapSection, {
            location: selectedLocation,
            weather: weatherPayload,
            air: airSnapshot,
          }),
          el(DetailsSection, {
            weather: weatherPayload,
            air: airSnapshot,
            locationLabel,
            coordinateLabel,
          })
        ),
        el(
          "footer",
          { className: "site-footer page-wrap" },
          el(
            "div",
            { className: "footer-panel glass-card" },
            el(
              "div",
              { className: "footer-actions" },
              el("a", { href: "#search-panel", className: "footer-link" }, "Change city"),
              el("a", { href: "#map-section", className: "footer-link" }, "Open map"),
              el(
                "button",
                {
                  type: "button",
                  className: favoriteCities.some(function hasSelected(item) {
                    return sameLocation(item, selectedLocation);
                  })
                    ? "footer-link footer-link-strong"
                    : "footer-link",
                  onClick: function handleFooterFavorite() {
                    toggleFavoriteCity(selectedLocation);
                  },
                },
                favoriteCities.some(function hasSelected(item) {
                  return sameLocation(item, selectedLocation);
                })
                  ? "Saved city"
                  : "Save city"
              ),
              el(
                "a",
                {
                  href: "https://open-meteo.com/",
                  target: "_blank",
                  rel: "noreferrer",
                  className: "footer-link footer-link-strong",
                },
                "Open-Meteo"
              )
            ),
            el(
              "div",
              { className: "footer-copyright" },
              "© 2026 · Sandipan Nayek"
            )
          )
        )
      )}
    </React.Fragment>
  );
}

export default App;
