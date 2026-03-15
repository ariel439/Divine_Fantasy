import { create } from 'zustand';
import { useWorldStateStore } from './useWorldStateStore';
import { useJobStore } from './useJobStore';
import { useCharacterStore } from './useCharacterStore';

type Weather = 'Sunny' | 'Cloudy' | 'Rainy' | 'Snowy';
type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

interface WorldTimeState {
  year: number;
  month: number;
  dayOfMonth: number;
  day: number;
  hour: number;
  minute: number;
  clockPaused: boolean;
  weather: Weather;
  season: Season;
  temperatureC: number;
  dailyMinTemp?: number;
  dailyMaxTemp?: number;
  nextWeatherChangeMinutes?: number;
  instanceMode?: boolean;
  backupYear?: number;
  backupMonth?: number;
  backupDayOfMonth?: number;
  backupDay?: number;
  backupHour?: number;
  backupMinute?: number;
  // Actions
  passTime: (minutes: number) => void;
  getFormattedTime: () => string;
  getFormattedDate: () => string;
  setClockPaused: (paused: boolean) => void;
  getSeason: () => Season;
  getWeather: () => Weather;
  setWeather: (weather: Weather) => void;
  rollDailyEnvironment: () => void;
  applyHourlyEnvironment: () => void;
  enterTemporalInstance: (t: { year: number; month: number; dayOfMonth: number; day?: number; hour: number; minute: number }) => void;
  exitTemporalInstance: () => void;
}

export const useWorldTimeStore = create<WorldTimeState>((set, get) => ({
  year: 780,
  month: 5,
  dayOfMonth: 3,
  day: 1,
  hour: 8,
  minute: 0,
  clockPaused: false,
  weather: 'Sunny',
  season: 'Spring',
  temperatureC: 15,
  instanceMode: false,
  nextWeatherChangeMinutes: 180,
  passTime: (minutes) => {
    set((state) => {
      const prevYear = state.year;
      const prevMonth = state.month;
      const prevDay = state.dayOfMonth;
      let m = state.minute + minutes;
      let h = state.hour;
      let d = state.day;
      let dom = state.dayOfMonth;
      let mo = state.month;
      let y = state.year;

      while (m >= 60) { m -= 60; h += 1; }
      while (h >= 24) { h -= 24; d += 1; dom += 1; }
      if (dom > 30) { dom = 1; mo += 1; }
      if (mo > 12) { mo = 1; y += 1; }

      const season = ((mo >= 3 && mo <= 5) ? 'Spring' : (mo >= 6 && mo <= 8) ? 'Summer' : (mo >= 9 && mo <= 11) ? 'Autumn' : 'Winter') as Season;

      let weather = state.weather;
      let nextWeatherChangeMinutes = (state.nextWeatherChangeMinutes ?? 180) - minutes;

      // Handle weather change via countdown
      if (nextWeatherChangeMinutes <= 0) {
        const introMode = useWorldStateStore.getState().introMode;
        
        if (introMode) {
            weather = 'Rainy';
            nextWeatherChangeMinutes = 1440; // Don't re-roll during intro
        } else {
            const w = season;
            const newWeather = (() => {
              if (w === 'Spring') {
                const r = Math.random();
                return r < 0.4 ? 'Sunny' : r < 0.75 ? 'Cloudy' : 'Rainy';
              } else if (w === 'Summer') {
                const r = Math.random();
                return r < 0.6 ? 'Sunny' : r < 0.9 ? 'Cloudy' : 'Rainy';
              } else if (w === 'Autumn') {
                const r = Math.random();
                return r < 0.35 ? 'Sunny' : r < 0.75 ? 'Cloudy' : 'Rainy';
              } else {
                const r = Math.random();
                return r < 0.25 ? 'Sunny' : r < 0.6 ? 'Cloudy' : r < 0.95 ? 'Snowy' : 'Rainy';
              }
            })();
            
            weather = newWeather as Weather;
            // Set next change between 2 and 6 hours
            nextWeatherChangeMinutes = 120 + Math.floor(Math.random() * 241);
        }
      }

      const dailyMin = state.dailyMinTemp ?? 10;
      const dailyMax = state.dailyMaxTemp ?? 20;
      const phi = ((h - 6 + (m / 60)) / 24) * Math.PI * 2;
      const factor = 0.5 - 0.5 * Math.cos(phi);
      let temperatureC = dailyMin + (dailyMax - dailyMin) * factor;
      const wMod = weather === 'Cloudy' ? -3 : weather === 'Rainy' ? -2 : weather === 'Snowy' ? -6 : 0;
      temperatureC = Math.round(temperatureC + wMod);

      // End-of-day processing
      if (!state.instanceMode && (prevDay !== dom || prevMonth !== mo || prevYear !== y)) {
        try { useJobStore.getState().ensureAttendanceForDay(prevYear, prevMonth, prevDay); } catch {}
        try {
          const maxSocial = useCharacterStore.getState().maxSocialEnergy;
          useCharacterStore.setState({ socialEnergy: maxSocial });
        } catch {}
      }

      return {
        year: y,
        month: mo,
        dayOfMonth: dom,
        day: d,
        hour: h,
        minute: m,
        season,
        temperatureC,
        weather,
        nextWeatherChangeMinutes,
      };
    });
  },
  setClockPaused: (paused: boolean) => set({ clockPaused: paused }),
  getFormattedTime: () => {
    const { hour, minute } = get();
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  },
  getFormattedDate: () => {
    const { dayOfMonth, month, year } = get();
    const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${dayOfMonth} ${names[month - 1]} ${year}`;
  },
  getSeason: () => {
    const { month } = get();
    return ((month >= 3 && month <= 5) ? 'Spring' : (month >= 6 && month <= 8) ? 'Summer' : (month >= 9 && month <= 11) ? 'Autumn' : 'Winter') as Season;
  },
  getWeather: () => get().weather,
  setWeather: (weather) => set({ weather }),
  rollDailyEnvironment: () => {
    const { month } = get();
    const season = ((month >= 3 && month <= 5) ? 'Spring' : (month >= 6 && month <= 8) ? 'Summer' : (month >= 9 && month <= 11) ? 'Autumn' : 'Winter') as Season;
    const chooseWeather = () => {
      if (season === 'Spring') {
        const r = Math.random();
        return r < 0.4 ? 'Sunny' : r < 0.75 ? 'Cloudy' : 'Rainy';
      } else if (season === 'Summer') {
        const r = Math.random();
        return r < 0.6 ? 'Sunny' : r < 0.9 ? 'Cloudy' : 'Rainy';
      } else if (season === 'Autumn') {
        const r = Math.random();
        return r < 0.35 ? 'Sunny' : r < 0.75 ? 'Cloudy' : 'Rainy';
      } else {
        const r = Math.random();
        return r < 0.25 ? 'Sunny' : r < 0.6 ? 'Cloudy' : r < 0.95 ? 'Snowy' : 'Rainy';
      }
    };
    const weather = chooseWeather();
    const ranges = season === 'Spring' ? [8, 20] : season === 'Summer' ? [18, 32] : season === 'Autumn' ? [5, 18] : [-10, 6];
    const min = ranges[0] + Math.floor(Math.random() * Math.max(1, ranges[1] - ranges[0] - 5));
    const max = min + 5 + Math.floor(Math.random() * 5);
    const next = 120 + Math.floor(Math.random() * 241);
    set({ season, weather, dailyMinTemp: min, dailyMaxTemp: max, nextWeatherChangeMinutes: next });
  },
  applyHourlyEnvironment: () => {
    const { hour, minute, dailyMinTemp, dailyMaxTemp } = get();
    const phi = ((hour - 6 + (minute / 60)) / 24) * Math.PI * 2;
    const factor = 0.5 - 0.5 * Math.cos(phi);
    const base = (dailyMinTemp ?? 10) + ((dailyMaxTemp ?? 20) - (dailyMinTemp ?? 10)) * factor;
    const mod = get().weather === 'Cloudy' ? -3 : get().weather === 'Rainy' ? -2 : get().weather === 'Snowy' ? -6 : 0;
    set({ temperatureC: Math.round(base + mod) });
  },
  enterTemporalInstance: (t) => {
    set((state) => ({
      backupYear: state.year, backupMonth: state.month, backupDayOfMonth: state.dayOfMonth,
      backupDay: state.day, backupHour: state.hour, backupMinute: state.minute,
      year: t.year, month: t.month, dayOfMonth: t.dayOfMonth,
      day: typeof t.day === 'number' ? t.day : state.day,
      hour: t.hour, minute: t.minute, instanceMode: true,
    }));
  },
  exitTemporalInstance: () => {
    set((state) => ({
      year: state.backupYear ?? state.year, month: state.backupMonth ?? state.month,
      dayOfMonth: state.backupDayOfMonth ?? state.dayOfMonth, day: state.backupDay ?? state.day,
      hour: state.backupHour ?? state.hour, minute: state.backupMinute ?? state.minute,
      backupYear: undefined, backupMonth: undefined, backupDayOfMonth: undefined,
      backupDay: undefined, backupHour: undefined, backupMinute: undefined,
      instanceMode: false,
    }));
  },
}));
