# Weather & Calendar System Update

## Overview
- Replace minute-based cycles with a realistic calendar and seasonal weather.
- Centralize environment in `useWorldTimeStore` for consistent state across UI and logic.
- Honor `clockPaused` to prevent double-counting time.
- Derive formatted dates from calendar fields.

## Calendar Model
- Add `year`, `month` (1–12), `dayOfMonth` (1–30) while keeping absolute `day` for math.
- Season mapping: Spring (Mar–May), Summer (Jun–Aug), Autumn (Sep–Nov), Winter (Dec–Feb).
- `passTime(minutes)` rolls minutes → hours → dayOfMonth → month → year.
- `getFormattedDate()` renders like `3 May 780` from calendar fields.

## Seasonal Weather (Probabilistic)
- Daily baseline is chosen from season-dependent probabilities.
- Example probabilities:
  - Spring: Sunny 40%, Cloudy 35%, Rain 25%, Snow 0%
  - Summer: Sunny 60%, Cloudy 30%, Rain 10%, Snow 0%
  - Autumn: Sunny 35%, Cloudy 40%, Rain 25%, Snow 0–5% (rare, late autumn)
  - Winter: Sunny 25%, Cloudy 35%, Snow 35%, Rain 5%
- Weather persists for multi-hour blocks; not flipping every 15 minutes.

## Temperature Model
- Daily min/max ranges by season:
  - Spring: 8–20°C; Summer: 18–32°C; Autumn: 5–18°C; Winter: −10–6°C.
- Draw daily min/max per day; apply a diurnal curve (cool night, warm afternoon).
- Precipitation/clouds adjust temp: Cloudy −3–4°C, Rain −2°C, Snow −6°C.
- Store `temperatureC` centrally; UI reads it directly.

## Environment Lifecycle
- `rollDailyEnvironment()` generates daily baseline (weather, min/max temp, event duration).
- `applyHourlyEnvironment()` nudges temperature and updates weather when `minute >= nextWeatherChangeAt`.
- Optional: Include `windKph`, `humidity` for later gameplay tie-ins.

## Store API Changes (useWorldTimeStore)
- State: `year`, `month`, `dayOfMonth`, `day`, `hour`, `minute`, `clockPaused`, `season`, `weather`, `temperatureC`, `nextWeatherChangeAt`.
- Methods:
  - `passTime(minutes)` → advances calendar and environment; calls `applyHourlyEnvironment()` on hour boundaries; `rollDailyEnvironment()` at new day.
  - `getFormattedDate()`, `getFormattedTime()`.
  - `getSeason()` derives from `month`.
  - `getWeather()` returns current store `weather` (no minute cycling).

## UI & Logic Updates
- LocationScreen
  - Replace local `getWeatherDisplay()` temp math with store `temperatureC` and `weather`.
  - Night label: show `Clear` when `weather === 'Sunny'` and it’s night for UX polish.
  - Keep travel slowdowns: Rain ×1.5, Snow ×2.
- WeatherParticles
  - Continue rendering for Rain/Snow; transitions remain.
- Ambient Audio
  - Keep day/night ambience. Optional future: weather-specific tracks.

## Limitations Addressed
- Clock pause: Check `clockPaused` before ticking in `Game.tsx` global timer. Avoids double-counting (`src/components/Game.tsx:97–102`).
- Date formatting: Derive from calendar instead of hardcoded (`src/stores/useWorldTimeStore.ts:63–66`).
- Weather randomness: Replace deterministic minute cycle with season-aware probabilities.
- Legacy store: Remove unused `useEnvironmentStore` in favor of centralized environment.

## Migration Steps
1. Extend `useWorldTimeStore` with calendar/environment fields and APIs.
2. Initialize calendar in `GameManagerService.startNewGame()` (`src/services/GameManagerService.ts`).
3. Update `passTime()` to call environment lifecycle methods.
4. Honor `clockPaused` in `Game.tsx` interval loop.
5. Replace `LocationScreen` temp/weather reads with centralized state.
6. Remove `useEnvironmentStore.ts` and references.
7. Persist new fields in `SaveLoadService`.

## Testing Plan
- Pause tests: Start a timed action; ensure clock doesn’t advance until completion.
- Season roll-over: Advance days to confirm month/season transitions every 3 months.
- Weather distribution: Simulate many days per season; confirm probability targets.
- Temperature bounds: Verify daily temp ranges and diurnal curve stay within expected limits.
- Save/load: Confirm environment and calendar persist correctly.

## Future Enhancements
- Regional climate per location (coastal vs. inland).
- Wind/humidity affecting fishing/travel.
- NPC forecasts or a library-based almanac.
