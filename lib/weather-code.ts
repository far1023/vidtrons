import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudLightning,
  CloudHail,
  type LucideIcon,
} from "lucide-react";

export interface WeatherInfo {
  label: string;
  icon: LucideIcon;
}

/**
 * Maps WMO weather interpretation codes to Indonesian labels and Lucide icons.
 * Day/night variants are resolved based on `isDay` (1/0) from Open-Meteo.
 */
export function getWeatherInfo(code: number, isDay = true): WeatherInfo {
  switch (code) {
    case 0:
      return {
        label: "Cerah",
        icon: isDay ? Sun : Moon,
      };

    case 1:
      return {
        label: "Cerah berawan",
        icon: isDay ? CloudSun : CloudMoon,
      };

    case 2:
      return {
        label: "Berawan sebagian",
        icon: isDay ? CloudSun : CloudMoon,
      };

    case 3:
      return {
        label: "Mendung",
        icon: Cloud,
      };

    case 45:
    case 48:
      return {
        label: "Berkabut",
        icon: CloudFog,
      };

    case 51:
    case 53:
    case 55:
      return {
        label: "Gerimis",
        icon: CloudDrizzle,
      };

    case 56:
    case 57:
      return {
        label: "Gerimis beku",
        icon: CloudDrizzle,
      };

    case 61:
      return {
        label: "Hujan ringan",
        icon: CloudRain,
      };

    case 63:
      return {
        label: "Hujan sedang",
        icon: CloudRain,
      };

    case 65:
      return {
        label: "Hujan lebat",
        icon: CloudRainWind,
      };

    case 66:
    case 67:
      return {
        label: "Hujan beku",
        icon: CloudRain,
      };

    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return {
        label: "Salju",
        icon: CloudSnow,
      };

    case 80:
      return {
        label: "Hujan lokal ringan",
        icon: CloudRain,
      };

    case 81:
      return {
        label: "Hujan lokal sedang",
        icon: CloudRain,
      };

    case 82:
      return {
        label: "Hujan lokal lebat",
        icon: CloudRainWind,
      };

    case 95:
      return {
        label: "Badai petir",
        icon: CloudLightning,
      };

    case 96:
    case 99:
      return {
        label: "Badai petir disertai hujan es",
        icon: CloudHail,
      };

    default:
      return {
        label: "Tidak diketahui",
        icon: Cloud,
      };
  }
}
