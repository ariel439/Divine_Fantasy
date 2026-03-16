import React, { useState, useMemo, useEffect, ReactNode } from 'react';
import type { FC } from 'react';
import { CheckSquare, Square, Search, XCircle, ArrowLeft, BookOpen, ScrollText, Award, User, Target, Briefcase, Coins, Clock, Zap, ChevronLeft, ChevronRight, UserX, ClipboardList, CalendarDays, UserRound, Check, X } from 'lucide-react';
import type { Quest } from '../../types';
import { useJournalStore } from '../../stores/useJournalStore';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { useUIStore } from '../../stores/useUIStore';
import { useJobStore } from '../../stores/useJobStore';
import { useWorldTimeStore } from '../../stores/useWorldTimeStore';
import { useDiaryStore } from '../../stores/useDiaryStore';
import npcsData from '../../data/npcs.json';
import ProgressBar from '../ui/ProgressBar';
import Stat from '../ui/Stat';

const JournalScreen: FC = () => {
    const { setScreen } = useUIStore();
    const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [mainTab, setMainTab] = useState<'quests' | 'job'>('quests');
    const [questStatusTab, setQuestStatusTab] = useState<'active' | 'completed'>('active');
    const { questsList, quests } = useJournalStore();

    // Derive selected quest from store to ensure it's always up to date
    const selectedQuest = useMemo(() => {
        if (!selectedQuestId) return null;
        return questsList.find(q => q.id === selectedQuestId) || null;
    }, [selectedQuestId, questsList]);

    // Job Data
    const { activeJob, jobs, attendance } = useJobStore();
    const { year, month, dayOfMonth } = useWorldTimeStore();
    const { relationships } = useDiaryStore();

    const filteredQuests = useMemo(() => {
        const source = questsList || [];
        let quests = source.filter(q => q.status === questStatusTab);
        if (searchTerm) {
            quests = quests.filter(q => 
                q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return quests;
    }, [questStatusTab, searchTerm, questsList]);
    
    // Set initial quest on tab change or first load
    useEffect(() => {
        if (filteredQuests.length > 0 && !selectedQuestId) {
            setSelectedQuestId(filteredQuests[0].id);
        }
    }, [filteredQuests, selectedQuestId]);

    // Update selected quest if it's filtered out
    useEffect(() => {
        if (selectedQuestId && !filteredQuests.some(q => q.id === selectedQuestId)) {
            setSelectedQuestId(filteredQuests[0]?.id || null);
        }
    }, [filteredQuests, selectedQuestId]);

    // Job Logic
    const [currentMonthIndex, setCurrentMonthIndex] = useState(month - 1);
    const weekDaysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const handlePrevMonth = () => setCurrentMonthIndex(prev => Math.max(0, prev - 1));
    const handleNextMonth = () => setCurrentMonthIndex(prev => Math.min(11, prev + 1));

    const renderCalendar = () => {
        if (!activeJob) return null;
        
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

        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const currentMonth = {
            name: monthNames[currentMonthIndex],
            days: 30,
            firstDayOfWeek: getFirstDayOfWeekForMonth(currentMonthIndex + 1),
            workDays: [1,2,3,4,5],
        };
        
        const isCurrentMonth = currentMonthIndex === (month - 1);
        const isFutureMonth = currentMonthIndex > (month - 1);
        const monthAttendance = filterAttendanceForMonth(currentMonthIndex + 1, year);

        const hiredOnParts = activeJob.hiredOn.split('-').map(Number);
        const hiredYear = hiredOnParts[0];
        const hiredMonth = hiredOnParts[1];
        const hiredDay = hiredOnParts[2];

        const days = [];
        for (let i = 0; i < currentMonth.firstDayOfWeek; i++) {
            days.push(<div key={`pad-${i}`} className="w-full aspect-square"></div>);
        }

        for (let day = 1; day <= currentMonth.days; day++) {
            const dayOfWeek = (currentMonth.firstDayOfWeek + day - 1) % 7;
            const isWorkDay = currentMonth.workDays.includes(dayOfWeek);
            const status = monthAttendance[day];
            const isToday = isCurrentMonth && day === dayOfMonth;
            
            let icon: ReactNode = null;
            let tooltipText = '';

            if (status) {
                if (status === 'attended') icon = <Check size={16} className="text-green-400" />, tooltipText = 'Attended';
                else if (status === 'missed') icon = <X size={16} className="text-red-400" />, tooltipText = 'Missed';
                else if (status === 'late') icon = <Clock size={16} className="text-yellow-400" />, tooltipText = 'Arrived Late';
                else if (status === 'exhausted') icon = <Zap size={16} className="text-amber-400" />, tooltipText = 'Too Exhausted';
            } else if (isWorkDay) {
                const beforeHire = (year < hiredYear) || (year === hiredYear && (currentMonthIndex + 1) < hiredMonth) || (year === hiredYear && (currentMonthIndex + 1) === hiredMonth && day < hiredDay);
                if (beforeHire) icon = <UserX size={14} className="text-zinc-600" />, tooltipText = 'Not Hired';
                else if (year === hiredYear && (currentMonthIndex + 1) === hiredMonth && day === hiredDay) icon = <Briefcase size={14} className="text-zinc-500" />, tooltipText = 'Hired Today';
                else if (isCurrentMonth && day < dayOfMonth) icon = <X size={16} className="text-red-400/50" />, tooltipText = 'Missed (Unexcused)';
                else icon = <Briefcase size={14} className="text-zinc-700" />, tooltipText = 'Upcoming Shift';
            }

            days.push(
                <div key={day} className={`relative group w-full aspect-square flex flex-col items-center justify-center bg-black/40 border ${isToday ? 'border-zinc-400 shadow-[0_0_10px_rgba(255,255,255,0.05)]' : 'border-zinc-800/50'} rounded-lg transition-all hover:bg-black/60`}>
                    <span className={`absolute top-1.5 right-2 text-[10px] font-black tracking-tighter ${isToday ? 'text-white' : 'text-zinc-600'}`}>
                        {String(day).padStart(2, '0')}
                    </span>
                    {icon && <div className="mt-1">{icon}</div>}
                    {tooltipText && (
                        <div className="absolute bottom-full mb-2 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white bg-zinc-900 border border-zinc-800 rounded-md shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap backdrop-blur-md z-30">
                           {tooltipText}
                        </div>
                    )}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="relative w-screen h-screen bg-zinc-950 flex flex-col overflow-hidden">
            {/* Background Layer */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 blur-sm" style={{ backgroundImage: `url(/assets/backgrounds/minimal_bg.png)` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />

            {/* Top Navigation Bar */}
            <header className="relative z-20 w-full h-[7vh] min-h-[56px] px-8 flex justify-between items-center border-b border-zinc-800/50 backdrop-blur-xl shrink-0">
                <button 
                    onClick={() => setScreen('inGame')} 
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all group px-4 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-zinc-800"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold tracking-widest uppercase text-[10px]">Resume Game</span>
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-bold text-white tracking-[0.3em] uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
                        Adventurer's Journal
                    </h1>
                </div>
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-zinc-800/50">
                    <button 
                        onClick={() => setMainTab('quests')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mainTab === 'quests' ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Quests
                    </button>
                    <button 
                        onClick={() => setMainTab('job')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mainTab === 'job' ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Employment
                    </button>
                </div>
            </header>

            {/* Main Content Area - Symmetrical Layout */}
            <div className="relative z-10 w-full h-[86vh] flex flex-col lg:flex-row gap-6 p-4 lg:p-6 items-stretch overflow-hidden">
                
                {mainTab === 'quests' ? (
                    <>
                        {/* Left Panel: Quest List */}
                        <div className="w-full lg:w-[400px] xl:w-[450px] h-full flex-shrink-0">
                            <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-5 shadow-2xl flex flex-col h-full animate-fade-in-up">
                                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-zinc-800/50 mb-4 shrink-0">
                                    {(['active', 'completed'] as const).map(tab => (
                                        <button 
                                            key={tab} 
                                            onClick={() => setQuestStatusTab(tab)} 
                                            className={`flex-1 px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-lg ${
                                                questStatusTab === tab 
                                                ? 'bg-zinc-100 text-black shadow-lg' 
                                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                            }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* Search Bar */}
                                <div className="relative mb-4 shrink-0">
                                    <input 
                                        type="text"
                                        placeholder="Search chronicles..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-black/40 border border-zinc-800/50 rounded-xl py-2.5 pl-4 pr-12 text-xs text-zinc-300 focus:ring-2 focus:ring-zinc-700 focus:border-zinc-600 outline-none transition-all placeholder:text-zinc-600 font-medium"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-zinc-800 rounded-lg text-zinc-500">
                                        <Search size={14} />
                                    </div>
                                </div>

                                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-1">
                                    {filteredQuests.length === 0 ? (
                                        <div className="text-center py-12 text-zinc-600">
                                            <ScrollText size={40} className="mx-auto mb-4 opacity-10" />
                                            <p className="font-black uppercase tracking-widest text-[9px]">No Records Found</p>
                                        </div>
                                    ) : filteredQuests.map(quest => (
                                        <button
                                            key={quest.id}
                                            onClick={() => setSelectedQuestId(quest.id)}
                                            className={`w-full text-left p-3.5 rounded-xl transition-all group ${
                                                selectedQuestId === quest.id 
                                                ? 'bg-zinc-100 text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                                                : 'hover:bg-white/5 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800/50'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className={`text-sm font-bold tracking-tight ${selectedQuestId === quest.id ? 'font-black' : ''}`}>
                                                    {quest.title}
                                                </span>
                                                {selectedQuestId === quest.id && <BookOpen size={12} />}
                                            </div>
                                            <p className={`text-[9px] uppercase font-black tracking-tighter mt-1 opacity-50 ${selectedQuestId === quest.id ? 'text-zinc-900' : 'text-zinc-500'}`}>
                                                From: {quest.giver}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {/* Right Panel: Details */}
                        <div className="flex-grow h-full overflow-y-auto custom-scrollbar pr-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            {selectedQuest ? (
                                <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-6 lg:p-10 shadow-2xl flex flex-col min-h-full">
                                    {/* Quest Header */}
                                    <div className="pb-6 border-b border-zinc-800/50">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-1.5 bg-zinc-800 rounded-lg text-zinc-400">
                                                        <ScrollText size={16} />
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Chronicled Event</span>
                                                </div>
                                                <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Cinzel, serif' }}>{selectedQuest.title}</h2>
                                            </div>
                                            <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-xl border border-zinc-800/50">
                                                <User size={14} className="text-zinc-500" />
                                                <div className="text-right">
                                                    <p className="text-[7px] font-black uppercase tracking-tighter text-zinc-600">Contract Giver</p>
                                                    <p className="text-[10px] font-bold text-zinc-300">{selectedQuest.giver}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="pt-6 lg:pt-8 space-y-8 flex-grow">
                                        {/* Description */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <BookOpen size={16} className="text-zinc-500" />
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-200">The Objective</h3>
                                            </div>
                                            <p className="text-zinc-400 text-base lg:text-lg leading-relaxed font-medium italic pl-6 border-l-2 border-zinc-800/50">
                                                "{selectedQuest.description}"
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Target size={16} className="text-zinc-500" />
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-200">Progress Tracker</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                                                {selectedQuest.objectives.map((obj, index) => {
                                                    const isBeryl = selectedQuest.id === 'finn_debt_collection' && index === 2; // Beryl is stage 2
                                                    const world = useWorldStateStore.getState();
                                                    const failed = isBeryl && world.getFlag('beryl_debt_forgiven');
                                                    
                                                    return (
                                                        <div key={index} className={`flex items-center gap-3 p-3 rounded-xl bg-black/40 border transition-all ${
                                                            failed ? 'border-red-900/50 bg-red-950/10' : 
                                                            obj.completed ? 'border-emerald-900/50 bg-emerald-950/5' : 
                                                            'border-zinc-800 group hover:border-zinc-700'
                                                        }`}>
                                                            <div className="flex-shrink-0">
                                                                {failed ? (
                                                                    <XCircle size={16} className="text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
                                                                ) : obj.completed ? (
                                                                    <CheckSquare size={16} className="text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                                                ) : (
                                                                    <Square size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                                                )}
                                                            </div>
                                                            <p className={`text-xs font-medium tracking-wide ${
                                                                failed ? 'text-red-400/70 line-through' : 
                                                                obj.completed ? 'text-zinc-500 line-through' : 
                                                                'text-zinc-200'
                                                            }`}>
                                                                {obj.text}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Rewards Section */}
                                        {selectedQuest.status === 'completed' && (
                                            <div className="space-y-4 animate-fade-in pt-4" style={{ animationDelay: '400ms' }}>
                                                <div className="flex items-center gap-3">
                                                    <Award size={16} className="text-yellow-500" />
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/80">Spoils of Adventure</h3>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                                                    {selectedQuest.rewards.map((reward, index) => (
                                                        <div key={index} className="flex items-center gap-3 bg-yellow-950/10 border border-yellow-900/30 p-3 rounded-xl group hover:bg-yellow-900/20 transition-all">
                                                            <Award size={14} className="text-yellow-600 group-hover:scale-110 transition-transform" />
                                                            <span className="text-[10px] font-black text-yellow-200 uppercase tracking-tight">{reward}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-zinc-900/20 backdrop-blur-md rounded-2xl border border-zinc-800/30 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                                    <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center border border-zinc-800 mb-6 opacity-20">
                                        <ScrollText size={40} className="text-zinc-400" />
                                    </div>
                                    <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-[10px]">No Records Selected</p>
                                    <p className="text-zinc-600 text-xs mt-2 max-w-[250px]">Select a chronicle from the archives to review its details and progress.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    // Job Integration
                    <div className="w-full h-full flex flex-col lg:flex-row gap-6 items-stretch animate-fade-in-up">
                        {!activeJob ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-12 shadow-2xl max-w-md">
                                    <UserX size={64} className="text-zinc-600 mb-6 mx-auto opacity-20" />
                                    <h2 className="text-3xl font-bold text-zinc-400 mb-4" style={{ fontFamily: 'Cinzel, serif' }}>Unemployed</h2>
                                    <p className="text-zinc-500 font-medium leading-relaxed">
                                        You do not have an active job. Visit guilds or supervisors around the city to find work and secure your future.
                                    </p>
                                </div>
                            </div>
                        ) : (() => {
                            const job = jobs[activeJob.jobId];
                            const supervisor = npcsData[job.supervisorId as keyof typeof npcsData] as any;
                            const relRaw = relationships[job.supervisorId]?.friendship?.value ?? 0;
                            const relVal = Math.max(-100, Math.min(100, relRaw));
                            const nextShift = { hour: job.schedule.startHour, minute: 0 };
                            const totalMissed = Object.values(attendance).filter((v) => v === 'missed').length;
                            const totalLate = Object.values(attendance).filter((v) => v === 'late').length;

                            return (
                                <>
                                    {/* Left Column (Job Info) */}
                                    <div className="w-full lg:w-[400px] xl:w-[450px] h-full flex flex-col gap-6 flex-shrink-0">
                                        <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-5 shadow-2xl flex flex-col h-1/2">
                                            <div className="flex items-center gap-3 mb-6 shrink-0 px-2">
                                                <div className="p-2 bg-zinc-800 rounded-xl text-zinc-400">
                                                    <ClipboardList size={18} />
                                                </div>
                                                <div>
                                                    <h2 className="text-sm font-black uppercase tracking-widest text-zinc-100">Position Details</h2>
                                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Current Employment</p>
                                                </div>
                                            </div>
                                            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-4">
                                                <div className="space-y-3">
                                                    <div className="p-4 bg-black/40 rounded-xl border border-zinc-800/50">
                                                        <Stat label="Title" value={job.title} />
                                                        <Stat label="Guild" value="Driftwatch Shipping Guild" />
                                                        <Stat label="Base Pay" value={<span className="flex items-center gap-1.5 font-sans font-bold">{job.payPerShift}<Coins size={14} className="text-orange-400"/></span>} />
                                                        <Stat label="Next Shift" value={`Tomorrow at ${String(nextShift.hour).padStart(2, '0')}:${String(nextShift.minute).padStart(2, '0')}`} />
                                                    </div>
                                                    <div className="p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
                                                        <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3">Shift Protocol</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-[11px] font-medium"><span className="text-zinc-400">On‑time Window</span><span className="text-zinc-200">07:00 – 08:00</span></div>
                                                            <div className="flex justify-between text-[11px] font-medium"><span className="text-zinc-400">Late Window</span><span className="text-zinc-200">08:00 – 10:00</span></div>
                                                            <div className="flex justify-between text-[11px] font-medium"><span className="text-zinc-400">Late Penalty</span><span className="text-red-400/80">-{Math.round((1 - (job.latePayFactor ?? 0.75)) * 100)}% Pay</span></div>
                                                            <div className="flex justify-between text-[11px] font-medium pt-2 border-t border-zinc-800/50"><span className="text-zinc-400">Min Energy Req.</span><span className="text-sky-400">{Math.min(30, job.energyCost / 2)} Energy</span></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-5 shadow-2xl flex flex-col h-1/2">
                                            <div className="flex items-center gap-3 mb-6 shrink-0 px-2">
                                                <div className="p-2 bg-zinc-800 rounded-xl text-zinc-400">
                                                    <UserRound size={18} />
                                                </div>
                                                <div>
                                                    <h2 className="text-sm font-black uppercase tracking-widest text-zinc-100">Supervision</h2>
                                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Chain of Command</p>
                                                </div>
                                            </div>
                                            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-6">
                                                <div className="flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-zinc-800/50">
                                                    <div className="relative shrink-0">
                                                        <img src={supervisor?.portrait || '/assets/portraits/boric.png'} alt={supervisor?.name || 'Supervisor'} className="w-16 h-16 rounded-2xl object-cover border-2 border-zinc-700 shadow-xl"/>
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white uppercase tracking-wider text-sm">{supervisor?.name || 'Supervisor'}</p>
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Primary Oversight</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-6">
                                                    <div>
                                                        <div className="flex justify-between items-end mb-2 px-1">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Favor</span>
                                                            <span className="text-[11px] font-sans font-black text-sky-400">{relVal >= 66 ? 'TRUSTED' : relVal >= 33 ? 'STABLE' : relVal >= 0 ? 'COOL' : 'HOSTILE'}</span>
                                                        </div>
                                                        <ProgressBar value={relVal} max={100} colorClass="bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.3)]" variant="thick" showText={false} />
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between items-end mb-2 px-1">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Efficiency</span>
                                                            <span className="text-[11px] font-sans font-black text-purple-400">{activeJob.performance}%</span>
                                                        </div>
                                                        <ProgressBar value={activeJob.performance} max={100} colorClass="bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]" variant="thick" showText={false} />
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800/50 space-y-2">
                                                    <div className="flex justify-between text-[11px]"><span className="text-zinc-500 font-bold uppercase tracking-tighter">Total Absences</span><span className="text-zinc-200 font-sans font-bold">{totalMissed}</span></div>
                                                    <div className="flex justify-between text-[11px]"><span className="text-zinc-500 font-bold uppercase tracking-tighter">Late Arrivals</span><span className="text-zinc-200 font-sans font-bold">{totalLate}</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column (Calendar) */}
                                    <div className="flex-grow h-full">
                                        <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-6 lg:p-8 shadow-2xl flex flex-col h-full">
                                            <div className="flex items-center justify-between mb-8 shrink-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-zinc-800 rounded-xl text-zinc-400">
                                                        <CalendarDays size={18} />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-100">Attendance Log</h2>
                                                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Shift History & Schedule</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 bg-black/40 p-1.5 rounded-xl border border-zinc-800/50">
                                                    <button onClick={handlePrevMonth} disabled={currentMonthIndex === 0} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-20 transition-all"><ChevronLeft size={18} /></button>
                                                    <div className="px-4 text-center min-w-[140px]">
                                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-200">{['January','February','March','April','May','June','July','August','September','October','November','December'][currentMonthIndex]}</span>
                                                        <span className="text-[9px] block font-black text-zinc-500 tracking-widest">YEAR {year}</span>
                                                    </div>
                                                    <button onClick={handleNextMonth} disabled={currentMonthIndex === 11} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-20 transition-all"><ChevronRight size={18} /></button>
                                                </div>
                                            </div>
                                            <div className="flex-grow flex flex-col min-h-0">
                                                <div className="grid grid-cols-7 gap-3 text-center mb-4 px-2">
                                                    {weekDaysShort.map((day, i) => <div key={`wd-${i}`} className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{day}</div>)}
                                                </div>
                                                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                                                    <div className="grid grid-cols-7 gap-3 pb-4">
                                                        {renderCalendar()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
            
            <footer className="relative z-20 w-full h-[7vh] min-h-[56px] border-t border-zinc-800/50 backdrop-blur-xl shrink-0" />

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }

                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }

                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
                
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default JournalScreen;