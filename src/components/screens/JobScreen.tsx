import React, { useState } from 'react';
import type { FC, ReactNode } from 'react';
import { Coins, Check, X, Clock, Briefcase, ChevronLeft, ChevronRight, UserX, Zap } from 'lucide-react';
import Section from '../ui/Section';
import Stat from '../ui/Stat';
import ProgressBar from '../ui/ProgressBar';
import { useJobStore } from '../../stores/useJobStore';
import { useWorldTimeStore } from '../../stores/useWorldTimeStore';
import { useDiaryStore } from '../../stores/useDiaryStore';
import npcsData from '../../data/npcs.json';

const JobScreen: FC = () => {
    const { activeJob, jobs, attendance } = useJobStore();
    const { year, month, dayOfMonth } = useWorldTimeStore();
    const { relationships } = useDiaryStore();
    if (!activeJob) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                <UserX size={64} className="text-zinc-600 mb-4" />
                <h1 className="text-4xl font-bold text-zinc-400" style={{ fontFamily: 'Cinzel, serif' }}>No Job</h1>
                <p className="text-lg text-zinc-500 mt-2 max-w-md">You do not have a job yet. Visit guilds or supervisors around the city to find work.</p>
            </div>
        );
    }
    const job = jobs[activeJob.jobId];
    const supervisor = npcsData[job.supervisorId as keyof typeof npcsData] as any;
    const relRaw = relationships[job.supervisorId]?.friendship?.value ?? 0;
    const relVal = Math.max(-100, Math.min(100, relRaw));
    const nextShift = { hour: job.schedule.startHour, minute: 0 };

    const getFirstDayOfWeekForMonth = (m: number) => ((m - 1) * 30) % 7;
    const filterAttendanceForMonth = (m: number, y: number) => {
        const entries = Object.entries(attendance).filter(([date]) => {
            const [Y, M] = date.split('-');
            return Number(Y) === y && Number(M) === m;
        });
        return Object.fromEntries(entries.map(([date, status]) => {
            const parts = date.split('-');
            const day = Number(parts[2]);
            return [day, status];
        })) as Record<number, 'attended' | 'missed' | 'late'>;
    };
    const calendarData = {
        year,
        today: dayOfMonth,
        attendance: filterAttendanceForMonth(month, year)
    };
    const hiredOnParts = activeJob.hiredOn.split('-').map(Number);
    const hiredYear = hiredOnParts[0];
    const hiredMonth = hiredOnParts[1];
    const hiredDay = hiredOnParts[2];
    
    // Data for the entire year for navigation
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const yearData = Array.from({ length: 12 }, (_, i) => ({
        name: monthNames[i],
        days: 30,
        firstDayOfWeek: getFirstDayOfWeekForMonth(i + 1),
        workDays: [1,2,3,4,5],
    }));
    // --- END MOCK DATA ---
    
    const [currentMonthIndex, setCurrentMonthIndex] = useState(month - 1);

    const weekDaysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const handlePrevMonth = () => {
        setCurrentMonthIndex(prev => Math.max(0, prev - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonthIndex(prev => Math.min(yearData.length - 1, prev + 1));
    };


    const renderCalendar = () => {
        const currentMonth = yearData[currentMonthIndex];
        const isCurrentMonth = currentMonthIndex === (month - 1);
        const isFutureMonth = currentMonthIndex > (month - 1);
        const monthAttendance = filterAttendanceForMonth(currentMonthIndex + 1, year);

        const days = [];
        // Add padding for days before the 1st of the month
        for (let i = 0; i < currentMonth.firstDayOfWeek; i++) {
            days.push(<div key={`pad-${i}`} className="w-full aspect-square"></div>);
        }

        // Add days of the month
        for (let day = 1; day <= currentMonth.days; day++) {
          const dayOfWeek = (currentMonth.firstDayOfWeek + day - 1) % 7;
          const isWorkDay = currentMonth.workDays.includes(dayOfWeek);
          const status = monthAttendance[day];
          const isToday = isCurrentMonth && day === calendarData.today;
          const cellIndex = currentMonth.firstDayOfWeek + day - 1;
          const rowIndex = Math.floor(cellIndex / 7);
          const tooltipPosClass = rowIndex === 0 ? 'top-full mt-2' : 'bottom-full mb-2';
            
            let icon: ReactNode = null;
            let tooltipText = '';

            if (status) {
                if (status === 'attended') {
                    icon = <Check size={20} className="text-green-400" />;
                    tooltipText = 'Attended';
                } else if (status === 'missed') {
                    icon = <X size={20} className="text-red-400" />;
                    tooltipText = 'Missed';
                } else if (status === 'late') {
                    icon = <Clock size={20} className="text-yellow-400" />;
                    tooltipText = 'Arrived Late';
                } else if (status === 'exhausted') {
                    icon = <Zap size={18} className="text-amber-400" />;
                    tooltipText = 'Too Exhausted';
                }
            } else if (isWorkDay) {
                const viewingYear = year;
                const viewingMonth = currentMonthIndex + 1;
                const isHireDayViewing = viewingYear === hiredYear && viewingMonth === hiredMonth && day === hiredDay;
                const beforeHire = (viewingYear < hiredYear) || (viewingYear === hiredYear && viewingMonth < hiredMonth) || (viewingYear === hiredYear && viewingMonth === hiredMonth && day < hiredDay);
                if (beforeHire) {
                    icon = <UserX size={18} className="text-zinc-500" />;
                    tooltipText = 'Not Hired';
                } else if (isHireDayViewing) {
                    icon = <Briefcase size={16} className="text-zinc-500" />;
                    tooltipText = 'Hired Today';
                } else if (isCurrentMonth && day < calendarData.today) {
                    icon = <X size={20} className="text-red-400" />;
                    tooltipText = 'Missed (Unexcused)';
                } else if ((isCurrentMonth && day >= calendarData.today) || isFutureMonth) {
                    icon = <Briefcase size={16} className="text-zinc-500" />;
                    tooltipText = 'Upcoming Shift';
                }
            }


            days.push(
                <div key={day} className="relative group w-full aspect-square flex flex-col items-center justify-center bg-black/20 border border-zinc-800 rounded-md p-1">
                    <span className={`absolute top-1 right-2 text-xs ${isToday ? 'text-white font-bold' : 'text-zinc-500'}`}>
                        {day}
                    </span>
            {isToday && <div className="absolute inset-0 rounded-md ring-2 ring-zinc-400 pointer-events-none"></div>}
                    {icon && (
                        <div className="mt-2">
                           {icon}
                        </div>
                    )}
            {tooltipText && (
                        <div className={`absolute ${tooltipPosClass} px-2 py-1 text-xs font-semibold text-white bg-zinc-900/90 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap backdrop-blur-sm z-20 capitalize`}>
                           {tooltipText}
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };


    return (
        <div className="w-full h-full px-8 pt-12 pb-24 flex flex-col">
            <header className="w-full max-w-screen-2xl mx-auto mb-8 flex-shrink-0">
                <h1 className="text-5xl font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>
                    Job
                </h1>
            </header>
            <div className="w-full max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                {/* Left Column (Info) - Takes 2/5 of width on large screens */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <Section title="Position Details">
                        <div className="p-4 bg-black/20 rounded-lg border border-zinc-800 space-y-2">
                            <Stat label="Title" value={job.title} />
                            <Stat label="Organization" value="Driftwatch Shipping Guild" />
                            <Stat label="Pay" value={<span className="flex items-center gap-1.5">{job.payPerShift}<Coins size={16} className="text-orange-400"/> / Shift</span>} />
                            <Stat label="Next Shift" value={`Tomorrow at ${String(nextShift.hour).padStart(2, '0')}:${String(nextShift.minute).padStart(2, '0')}`} />
                            <div className="mt-3 p-3 bg-black/30 border border-zinc-700 rounded-md text-xs text-zinc-300">
                                <div className="flex justify-between"><span>On‑time window</span><span>07:00–08:00</span></div>
                                <div className="flex justify-between mt-1"><span>Late window</span><span>08:00–10:00</span></div>
                                <div className="flex justify-between mt-1"><span>Min energy to start</span><span>{Math.min(30, job.energyCost / 2)}</span></div>
                                <div className="flex justify-between mt-1"><span>Late pay factor</span><span>{(job.latePayFactor ?? 0.75).toFixed(2)}</span></div>
                            </div>
                        </div>
                    </Section>
                    
                     <Section title="Supervisor">
                        <div className="flex items-center gap-4 bg-black/20 p-4 rounded-lg border border-zinc-800">
                            <img src={supervisor?.portrait || '/assets/portraits/boric.png'} alt={supervisor?.name || 'Supervisor'} className="w-20 h-20 rounded-full object-cover border-2 border-zinc-600"/>
                            <div>
                                <p className="font-bold text-xl text-white">{supervisor?.name || 'Supervisor'}</p>
                                <p className="text-md text-zinc-400">Disposition: {relVal >= 66 ? 'Friendly' : relVal >= 33 ? 'Neutral' : relVal >= 0 ? 'Cool' : 'Hostile'}</p>
                            </div>
                        </div>
                    </Section>

                    <Section title="Standing">
                        <div className="p-4 bg-black/20 rounded-lg border border-zinc-800 space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-zinc-300 mb-1 text-left">Relationship</p>
                                <ProgressBar value={relVal} max={100} colorClass="bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.7)]" variant="thick" showText={true} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-zinc-300 mb-1 text-left">Performance</p>
                                <ProgressBar value={activeJob.performance} max={100} colorClass="bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.7)]" variant="thick" showText={true} />
                            </div>
                            <div className="text-xs text-zinc-400">
                                {(() => {
                                  const totalMissed = Object.values(attendance).filter((v) => v === 'missed').length;
                                  const totalLate = Object.values(attendance).filter((v) => v === 'late').length;
                                  return (
                                    <>
                                      <div className="flex justify-between"><span>Missed days</span><span>{totalMissed}</span></div>
                                      <div className="flex justify-between mt-1"><span>Late days</span><span>{totalLate}</span></div>
                                    </>
                                  );
                                })()}
                                {activeJob.performance >= 90 && <div className="mt-2 text-amber-300">Near raise: hit 100 performance for a pay increase.</div>}
                                {(activeJob.missedDays >= (job.dismissal?.maxMissed ?? 3) - 1 || activeJob.lateDays >= (job.dismissal?.maxLate ?? 5) - 1) && (
                                  <div className="mt-2 text-red-300">Warning: At risk of dismissal.</div>
                                )}
                            </div>
                        </div>
                    </Section>
                </div>
                
                {/* Right Column (Calendar) - Takes 3/5 of width on large screens */}
                <div className="lg:col-span-3 bg-black/20 rounded-lg border border-zinc-800 p-6 flex flex-col min-h-0">
                    <h3 className="text-xl font-bold text-zinc-300 mb-4 tracking-wider flex-shrink-0" style={{ fontFamily: 'Cinzel, serif' }}>
                        Attendance Log
                    </h3>
                     <div className="bg-black/30 rounded-lg border border-zinc-700 p-4 flex flex-col flex-grow min-h-0">
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                           <button
                                onClick={handlePrevMonth}
                                disabled={currentMonthIndex === 0}
                                className="p-1 rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:text-zinc-600 disabled:bg-transparent disabled:cursor-not-allowed transition-colors"
                                aria-label="Previous month"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <h3 className="text-xl font-bold text-white tracking-wide">{yearData[currentMonthIndex].name} {calendarData.year}</h3>
                            <button
                                onClick={handleNextMonth}
                                disabled={currentMonthIndex === yearData.length - 1}
                                className="p-1 rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:text-zinc-600 disabled:bg-transparent disabled:cursor-not-allowed transition-colors"
                                aria-label="Next month"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-400 mb-2">
                              {weekDaysShort.map((day, i) => <div key={`wd-${i}`}>{day}</div>)}
                            </div>
                        <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar pr-1">
                            <div className="grid grid-cols-7 gap-1.5">
                               {renderCalendar()}
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default JobScreen;
