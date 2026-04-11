const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  rainProbability: number;
}

export interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  description: string;
  rainProbability: number;
}

export const getWeatherByCoords = async (
  lat: number,
  lon: number
): Promise<WeatherData | null> => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    const data = await response.json();

    if (!response.ok) return null;

    return {
      temp: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      description: data.weather[0].main,
      icon: data.weather[0].icon,
      rainProbability: data.clouds.all,
    };
  } catch (error) {
    console.error('Weather API error:', error);
    return null;
  }
};

export const getWeatherForecast = async (
  lat: number,
  lon: number
): Promise<ForecastDay[]> => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    const data = await response.json();

    if (!response.ok) return [];

    const dailyData: Record<string, any> = {};

    data.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          tempMax: item.main.temp_max,
          tempMin: item.main.temp_min,
          description: item.weather[0].main,
          rainProbability: item.pop * 100,
        };
      } else {
        dailyData[date].tempMax = Math.max(dailyData[date].tempMax, item.main.temp_max);
        dailyData[date].tempMin = Math.min(dailyData[date].tempMin, item.main.temp_min);
      }
    });

    return Object.values(dailyData).slice(0, 5);
  } catch (error) {
    console.error('Forecast API error:', error);
    return [];
  }
};

export const getPakistanWeather = async (): Promise<WeatherData | null> => {
  return getWeatherByCoords(30.1938, 71.4732);
};

export const generateWeatherAlerts = (weather: WeatherData): string[] => {
  const alerts: string[] = [];

  if (weather.rainProbability > 70) {
    alerts.push('rain');
  }

  if (weather.temp > 40) {
    alerts.push('heat_wave');
  }

  if (weather.temp < 5) {
    alerts.push('frost');
  }

  if (weather.windSpeed > 30) {
    alerts.push('wind');
  }

  return alerts;
};
