import { create } from 'zustand';
import jobsData from '../data/jobs.json';
import { useWorldTimeStore } from './useWorldTimeStore';
import { useCharacterStore } from './useCharacterStore';
import { useDiaryStore } from './useDiaryStore';

interface Job {
  id: string;
  title: string;
  description: string;
  locationId: string;
  supervisorId: string;
  payPerShift: number;
  energyCost: number;
  latePayFactor?: number;
  minEnergyToStart?: number;
  dismissal?: { maxMissed?: number; maxLate?: number; minFriendship?: number };
  paySchedule?: 'daily' | 'weekly';
  schedule: {
    startHour: number;
    endHour: number;
    lateGracePeriodHours: number;
  };
}

interface ActiveJob {
  jobId: string;
  performance: number;
  daysWorked: number;
  lastWorked: string; // date string
  hiredOn: string; // date string YYYY-MM-DD
  missedDays: number;
  lateDays: number;
  payBonus?: number;
}

interface JobState {
  jobs: Record<string, Job>;
  activeJob: ActiveJob | null;
  attendance: Record<string, 'attended' | 'late' | 'missed' | 'exhausted'>;
  firedJobs: Record<string, { reason: string; rehiredFrom: string }>
  // Actions
  loadJobs: () => void; // Load from jobs.json
  takeJob: (jobId: string) => void;
  quitJob: () => void;
  workShift: () => { status: 'attended' | 'late' | 'missed' | 'exhausted' | 'insufficient'; minutesWorked: number; payCopper: number; energySpent: number } | null;
  ensureAttendanceForDay: (year: number, month: number, day: number) => void;
  canHire: (jobId: string) => { ok: boolean; reason?: string; rehiredFrom?: string };
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: {},
  activeJob: null,
  attendance: {},
  firedJobs: {},
  loadJobs: () => {
    const result: Record<string, Job> = {};
    Object.entries(jobsData as any).forEach(([id, raw]: any) => {
      result[id] = {
        id,
        title: raw.title,
        description: raw.description,
        locationId: raw.location_id,
        supervisorId: raw.supervisor_id,
        payPerShift: Number(raw.pay_per_shift || 0),
        energyCost: Number(raw.energy_cost || 0),
        latePayFactor: Number(raw.late_pay_factor ?? 0.75),
        minEnergyToStart: Number(raw.min_energy_to_start ?? Math.min(30, Number(raw.energy_cost || 60) / 2)),
        dismissal: {
          maxMissed: Number(raw.dismissal?.max_missed ?? 3),
          maxLate: Number(raw.dismissal?.max_late ?? 5),
          minFriendship: Number(raw.dismissal?.min_friendship ?? -20),
        },
        paySchedule: (raw.pay_schedule ?? 'daily') as 'daily' | 'weekly',
        schedule: {
          startHour: Number(raw.schedule?.start_hour || 8),
          endHour: Number(raw.schedule?.end_hour || 16),
          lateGracePeriodHours: Number(raw.schedule?.late_grace_period_hours || 2),
        },
      };
    });
    set({ jobs: result });
  },
  takeJob: (jobId) => {
    const block = get().canHire(jobId);
    if (!block.ok) {
      useDiaryStore.getState().addInteraction(`Cannot be rehired until ${block.rehiredFrom}.`);
      return;
    }
    const current = get().jobs[jobId];
    if (!current) return;
    const t = useWorldTimeStore.getState();
    const dateKey = `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.dayOfMonth).padStart(2, '0')}`;
    set({ activeJob: { jobId, performance: 0, daysWorked: 0, lastWorked: '', hiredOn: dateKey, missedDays: 0, lateDays: 0, payBonus: 0 } });
  },
  quitJob: () => {
    set({ activeJob: null });
  },
  workShift: () => {
    const active = get().activeJob;
    if (!active) return null;
    const job = get().jobs[active.jobId];
    if (!job) return null;
    const time = useWorldTimeStore.getState();
    const firstDow = ((time.month - 1) * 30) % 7; // 0=Sunday
    const weekday = (firstDow + time.dayOfMonth - 1) % 7; // 0=Sunday ... 6=Saturday
    if (weekday === 0 || weekday === 6) {
      useDiaryStore.getState().addInteraction('No scheduled shifts on weekends.');
      return null;
    }
    const todayKey = `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.dayOfMonth).padStart(2, '0')}`;
    if (active.hiredOn === todayKey) {
      return null; // Starts tomorrow
    }
    const energyAvail = useCharacterStore.getState().energy;
    const minEnergy = Number(job.minEnergyToStart ?? Math.min(30, job.energyCost / 2));
    if (energyAvail < minEnergy) {
      return { status: 'insufficient', minutesWorked: 0, payCopper: 0, energySpent: 0 };
    }
    const now = time.hour * 60 + time.minute;
    const start = job.schedule.startHour * 60;
    const end = job.schedule.endHour * 60;
    const graceEnd = start + job.schedule.lateGracePeriodHours * 60;
    const preWindowStart = Math.max(0, start - 60);
    let status: 'attended' | 'late' | 'missed' = 'missed';
    if (now >= preWindowStart && now <= start) status = 'attended';
    else if (now > start && now <= graceEnd) status = 'late';
    else status = 'missed';
    if (status === 'missed') {
      set((state) => ({
        attendance: { ...state.attendance, [todayKey]: 'missed' },
        activeJob: state.activeJob ? { ...state.activeJob, performance: Math.max(0, state.activeJob.performance - 10), missedDays: state.activeJob.missedDays + 1 } : state.activeJob,
      }));
      const sup = job.supervisorId;
      if (sup) useDiaryStore.getState().updateRelationship(sup, { friendship: -5 });
      const rel = useDiaryStore.getState().relationships[sup]?.friendship?.value ?? 0;
      const monthlyMissed = Object.entries(get().attendance).filter(([k, v]) => v === 'missed' && k.startsWith(`${time.year}-${String(time.month).padStart(2, '0')}-`)).length;
      const totalLateMissed = Object.values(get().attendance).filter((v) => v === 'missed' || v === 'late').length;
      const shouldDismiss = (monthlyMissed >= 3) || (totalLateMissed >= 5) || (rel < -50 && totalLateMissed > 0);
      if (shouldDismiss) {
        set({ activeJob: null });
        useDiaryStore.getState().addInteraction('You were dismissed due to poor attendance.');
      }
      return null;
    }
    const fullDuration = Math.max(1, end - start);
    const baseMinutes = status === 'attended' ? (end - start) : Math.max(0, end - now);
    const maxEnergySpend = job.energyCost;
    const usableEnergy = Math.min(energyAvail, maxEnergySpend);
    const minutesAvailable = Math.floor((usableEnergy / job.energyCost) * fullDuration);
    let minutesWorked = Math.min(baseMinutes, minutesAvailable);
    let energySpent = Math.round(job.energyCost * (minutesWorked / fullDuration));
    energySpent = Math.min(energySpent, usableEnergy, maxEnergySpend);
    useCharacterStore.setState((state) => ({ energy: Math.max(0, state.energy - energySpent) }));
    const payFactorBase = status === 'late' ? Number(job.latePayFactor ?? 0.75) : 1.0;
    const basePay = job.payPerShift + (get().activeJob?.payBonus ?? 0);
    const payCopper = Math.floor(basePay * payFactorBase * (minutesWorked / fullDuration));
    useCharacterStore.getState().addCurrency('copper', payCopper);
    const dateKey = todayKey;
    const exhausted = minutesWorked < baseMinutes;
    set((state) => ({
      attendance: { ...state.attendance, [dateKey]: exhausted ? 'exhausted' : status },
      activeJob: state.activeJob ? {
        ...state.activeJob,
        daysWorked: state.activeJob.daysWorked + 1,
        lastWorked: dateKey,
        performance: Math.max(0, Math.min(100, state.activeJob.performance + (exhausted ? -2 : (status === 'late' ? -3 : 2)))),
        lateDays: state.activeJob.lateDays + (status === 'late' ? 1 : 0),
      } : state.activeJob,
    }));
    const sup = job.supervisorId;
    if (sup) useDiaryStore.getState().updateRelationship(sup, { friendship: exhausted ? -1 : (status === 'late' ? -2 : 1) });
    useWorldTimeStore.getState().passTime(minutesWorked);
    // Raise on 100 performance
    const aj = get().activeJob;
    if (aj && aj.performance >= 100) {
      set({ activeJob: { ...aj, performance: 0, payBonus: (aj.payBonus ?? 0) + 2 } });
      useDiaryStore.getState().addInteraction('You received a raise for outstanding performance.');
    }
    const rel = useDiaryStore.getState().relationships[sup]?.friendship?.value ?? 0;
    const monthlyMissed = Object.entries(get().attendance).filter(([k, v]) => v === 'missed' && k.startsWith(`${time.year}-${String(time.month).padStart(2, '0')}-`)).length;
    const totalLateMissed = Object.values(get().attendance).filter((v) => v === 'missed' || v === 'late').length;
    const shouldDismiss = (monthlyMissed >= 3) || (totalLateMissed >= 5) || (rel < -50 && totalLateMissed > 0);
    if (shouldDismiss) {
      const t = useWorldTimeStore.getState();
      const rehiredFrom = (() => {
        let y = t.year, m = t.month, d = t.dayOfMonth + 7;
        while (d > 30) { d -= 30; m += 1; }
        while (m > 12) { m -= 12; y += 1; }
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      })();
      set((state) => ({ activeJob: null, firedJobs: { ...state.firedJobs, [job.id]: { reason: 'dismissal', rehiredFrom } } }));
      useDiaryStore.getState().addInteraction('You were dismissed due to poor performance/relationship.');
    }
    return { status: exhausted ? 'exhausted' : status, minutesWorked, payCopper, energySpent };
  },
  ensureAttendanceForDay: (year, month, day) => {
    const aj = get().activeJob;
    if (!aj) return;
    const job = get().jobs[aj.jobId];
    if (!job) return;
    const firstDow = ((month - 1) * 30) % 7; // 0=Sunday
    const weekday = (firstDow + day - 1) % 7; // 0=Sunday ... 6=Saturday
    const isWorkday = weekday >= 1 && weekday <= 5; // Mon-Fri
    if (!isWorkday) return; // Do not penalize weekends
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const already = get().attendance[dateKey];
    const hiredOn = aj.hiredOn;
    if (already) return;
    const [HY, HM, HD] = hiredOn.split('-').map(Number);
    const afterHire = (year > HY) || (year === HY && month > HM) || (year === HY && month === HM && day > HD);
    if (!afterHire) return;
    set((state) => ({
      attendance: { ...state.attendance, [dateKey]: 'missed' },
      activeJob: state.activeJob ? { ...state.activeJob, missedDays: state.activeJob.missedDays + 1, performance: Math.max(0, state.activeJob.performance - 10) } : state.activeJob,
    }));
    const sup = job.supervisorId;
    if (sup) useDiaryStore.getState().updateRelationship(sup, { friendship: -5 });
    const rel = useDiaryStore.getState().relationships[sup]?.friendship?.value ?? 0;
    const monthMissed = Object.entries(get().attendance).filter(([k, v]) => v === 'missed' && k.startsWith(`${year}-${String(month).padStart(2, '0')}-`)).length;
    const totalLateMissed = Object.values(get().attendance).filter((v) => v === 'missed' || v === 'late').length;
    const shouldDismiss = (monthMissed >= 3) || (totalLateMissed >= 5) || (rel < -50 && totalLateMissed > 0);
    if (shouldDismiss) {
      const rehiredFrom = (() => {
        let y = year, m = month, d = day + 7;
        while (d > 30) { d -= 30; m += 1; }
        while (m > 12) { m -= 12; y += 1; }
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      })();
      set((state) => ({ activeJob: null, firedJobs: { ...state.firedJobs, [job.id]: { reason: 'dismissal', rehiredFrom } } }));
      useDiaryStore.getState().addInteraction('You were dismissed due to poor attendance/relationship.');
    }
  },
  canHire: (jobId) => {
    const info = get().firedJobs[jobId];
    if (!info) return { ok: true };
    const t = useWorldTimeStore.getState();
    const curKey = `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.dayOfMonth).padStart(2, '0')}`;
    if (curKey < info.rehiredFrom) return { ok: false, reason: info.reason, rehiredFrom: info.rehiredFrom };
    return { ok: true };
  },
}));
