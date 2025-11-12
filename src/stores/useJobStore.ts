import { create } from 'zustand';

interface Job {
  id: string;
  title: string;
  description: string;
  locationId: string;
  supervisorId: string;
  payPerShift: number;
  energyCost: number;
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
}

interface JobState {
  jobs: Record<string, Job>;
  activeJob: ActiveJob | null;
  // Actions
  loadJobs: () => void; // Load from jobs.json
  takeJob: (jobId: string) => void;
  quitJob: () => void;
  workShift: () => void;
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: {},
  activeJob: null,
  loadJobs: () => {
    // TODO: Load jobs from jobs.json
    console.log('Loading jobs from JSON');
  },
  takeJob: (jobId) => {
    set({ activeJob: { jobId, performance: 100, daysWorked: 0, lastWorked: '' } });
  },
  quitJob: () => {
    set({ activeJob: null });
  },
  workShift: () => {
    // TODO: Implement work shift logic
    console.log('Working shift');
  },
}));
