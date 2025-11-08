import React, { useState } from 'react';
import type { FC, ReactNode } from 'react';
import { Coins, Check, X, Clock, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import Section from '../ui/Section';
import Stat from '../ui/Stat';
import ProgressBar from '../ui/ProgressBar';

const JobScreen: FC = () => {
    // --- MOCK DATA ---
    const jobData = {
        title: "Dockhand",
        guild: "Driftwatch Shipping Guild",
        pay: 160,
        supervisor: { name: "Captain Elias", portrait: 'https://i.imgur.com/vHqJdJA.jpeg', disposition: 'Neutral' },
        nextShift: { hour: 8, minute: 0 },
        standing: {
            relationship: 65,
            performance: 80,
        }
    };

    const calendarData = { // This now mainly holds static or May-specific info
        year: 780,
        today: 15, // May 15th
        attendance: {
            1: 'attended', 2: 'attended', 3: 'missed',
            6: 'attended', 7: 'attended', 8: 'late', 9: 'attended', 10: 'attended',
            13: 'attended', 14: 'attended',
        } as Record<number, 'attended' | 'missed' | 'late'>
    };
    
    // Data for the entire year for navigation
    const yearData = [
        { name: 'January', days: 31, firstDayOfWeek: 1, workDays: [1, 2, 3, 4, 5] },
        { name: 'February', days: 28, firstDayOfWeek: 4, workDays: [1, 2, 3, 4, 5] },
        { name: 'March', days: 31, firstDayOfWeek: 4, workDays: [1, 2, 3, 4, 5] },
        { name: 'April', days: 30, firstDayOfWeek: 0, workDays: [1, 2, 3, 4, 5] },
        { name: 'May', days: 31, firstDayOfWeek: 2, workDays: [1, 2, 3, 4, 5] },
        { name: 'June', days: 30, firstDayOfWeek: 5, workDays: [1, 2, 3, 4, 5] },
        { name: 'July', days: 31, firstDayOfWeek: 0, workDays: [1, 2, 3, 4, 5] },
        { name: 'August', days: 31, firstDayOfWeek: 3, workDays: [1, 2, 3, 4, 5] },
        { name: 'September', days: 30, firstDayOfWeek: 6, workDays: [1, 2, 3, 4, 5] },
        { name: 'October', days: 31, firstDayOfWeek: 1, workDays: [1, 2, 3, 4, 5] },
        { name: 'November', days: 30, firstDayOfWeek: 4, workDays: [1, 2, 3, 4, 5] },
        { name: 'December', days: 31, firstDayOfWeek: 6, workDays: [1, 2, 3, 4, 5] },
    ];
    // --- END MOCK DATA ---
    
    const [currentMonthIndex, setCurrentMonthIndex] = useState(4); // Start on May (index 4)

    const weekDaysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const handlePrevMonth = () => {
        setCurrentMonthIndex(prev => Math.max(0, prev - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonthIndex(prev => Math.min(yearData.length - 1, prev + 1));
    };


    const renderCalendar = () => {
        const currentMonth = yearData[currentMonthIndex];
        const isMay = currentMonthIndex === 4;
        const isFutureMonth = currentMonthIndex > 4;

        const days = [];
        // Add padding for days before the 1st of the month
        for (let i = 0; i < currentMonth.firstDayOfWeek; i++) {
            days.push(<div key={`pad-${i}`} className="w-full aspect-square"></div>);
        }

        // Add days of the month
        for (let day = 1; day <= currentMonth.days; day++) {
            const dayOfWeek = (currentMonth.firstDayOfWeek + day - 1) % 7;
            const isWorkDay = currentMonth.workDays.includes(dayOfWeek);
            const status = isMay ? calendarData.attendance[day] : undefined;
            const isToday = isMay && day === calendarData.today;
            
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
                }
            } else if (isWorkDay) {
                if (isMay && day < calendarData.today) {
                    icon = <X size={20} className="text-red-400" />;
                    tooltipText = 'Missed (Unexcused)';
                } else if ((isMay && day >= calendarData.today) || isFutureMonth) {
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
                        <div className="absolute bottom-full mb-2 px-2 py-1 text-xs font-semibold text-white bg-zinc-900/90 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap backdrop-blur-sm z-20 capitalize">
                           {tooltipText}
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };


    return (
        <div className="w-full h-full p-8 pt-12 pb-24 flex flex-col">
            <header className="w-full max-w-screen-2xl mx-auto mb-8 flex-shrink-0">
                <h1 className="text-5xl font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>
                    Job
                </h1>
            </header>
            <div className="w-full max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 flex-grow min-h-0">
                {/* Left Column (Info) - Takes 2/5 of width on large screens */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <Section title="Position Details">
                        <div className="p-4 bg-black/20 rounded-lg border border-zinc-800 space-y-2">
                            <Stat label="Title" value={jobData.title} />
                            <Stat label="Organization" value={jobData.guild} />
                            <Stat label="Pay" value={<span className="flex items-center gap-1.5">{jobData.pay}<Coins size={16} className="text-orange-400"/> / Shift</span>} />
                            <Stat label="Next Shift" value={`Tomorrow at ${String(jobData.nextShift.hour).padStart(2, '0')}:${String(jobData.nextShift.minute).padStart(2, '0')}`} />
                        </div>
                    </Section>
                    
                     <Section title="Supervisor">
                        <div className="flex items-center gap-4 bg-black/20 p-4 rounded-lg border border-zinc-800">
                            <img src={jobData.supervisor.portrait} alt={jobData.supervisor.name} className="w-20 h-20 rounded-full object-cover border-2 border-zinc-600"/>
                            <div>
                                <p className="font-bold text-xl text-white">{jobData.supervisor.name}</p>
                                <p className="text-md text-zinc-400">Disposition: {jobData.supervisor.disposition}</p>
                            </div>
                        </div>
                    </Section>

                    <Section title="Standing">
                        <div className="p-4 bg-black/20 rounded-lg border border-zinc-800 space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-zinc-300 mb-1 text-left">Relationship</p>
                                <ProgressBar value={jobData.standing.relationship} max={100} colorClass="bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.7)]" variant="thick" showText={true} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-zinc-300 mb-1 text-left">Performance</p>
                                <ProgressBar value={jobData.standing.performance} max={100} colorClass="bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.7)]" variant="thick" showText={true} />
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
                        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-zinc-400 mb-2 flex-shrink-0">
                           {weekDaysShort.map(day => <div key={day}>{day}</div>)}
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