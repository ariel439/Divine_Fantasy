import React, { useState, useMemo, useEffect, ReactNode } from 'react';
import type { FC } from 'react';
import { Search, BookOpen, ChevronLeft, ArrowLeft, Book as BookIcon, History, Info, Map, Library as LibraryIcon, X } from 'lucide-react';
import type { Book, BookContent, BookShelf } from '../../types';
import { useUIStore } from '../../stores/useUIStore';

// Render individual content pieces based on type
const renderContent = (content: BookContent, index: number) => {
    switch (content.type) {
        case 'h1':
            return <h1 key={index} className="text-3xl lg:text-4xl font-bold text-white mt-8 mb-4 border-b border-zinc-800 pb-4" style={{ fontFamily: 'Cinzel, serif' }}>{content.content}</h1>;
        case 'h2':
            return <h2 key={index} className="text-2xl lg:text-3xl font-bold text-zinc-200 mt-8 mb-4" style={{ fontFamily: 'Cinzel, serif' }}>{content.content}</h2>;
        case 'p':
            return <p key={index} className="text-base lg:text-lg text-zinc-400 leading-relaxed mb-6">{content.content}</p>;
        case 'note':
            return (
                <div key={index} className="my-8 p-6 bg-zinc-900/60 border-l-4 border-zinc-700 rounded-r-2xl italic shadow-2xl">
                    <span className="not-italic font-black text-zinc-500 uppercase text-[10px] tracking-[0.2em] block mb-2">Scholar's Annotation</span>
                    <p className="text-sm lg:text-base text-zinc-300 leading-relaxed">{content.content}</p>
                </div>
            );
        case 'img':
            return (
                <figure key={index} className="my-10">
                    <img src={content.content} alt={content.caption || 'Book illustration'} className="w-full max-w-3xl mx-auto rounded-2xl border border-zinc-800 shadow-2xl" />
                    {content.caption && <figcaption className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-4">{content.caption}</figcaption>}
                </figure>
            );
        default:
            return null;
    }
}

interface LibraryScreenProps {
    onClose?: () => void;
}

const LibraryScreen: FC<LibraryScreenProps> = ({ onClose }) => {
    const { libraryBooks, setScreen } = useUIStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [activeShelf, setActiveShelf] = useState<BookShelf | 'All'>('All');
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

    const handleClose = () => {
        if (onClose) return onClose();
        setScreen('inGame');
    };

    // Escape key handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (fullscreenImage) {
                    setFullscreenImage(null);
                } else if (selectedBook) {
                    setSelectedBook(null);
                } else {
                    handleClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedBook, fullscreenImage]);

    const books = libraryBooks || [];
    
    const shelves: { id: BookShelf | 'All', label: string, icon: ReactNode }[] = [
        { id: 'All', label: 'All Archives', icon: <LibraryIcon size={16} /> },
        { id: 'Historical', label: 'Historical', icon: <History size={16} /> },
        { id: 'Informational', label: 'Informational', icon: <Info size={16} /> },
        { id: 'Maps', label: 'Maps & Charts', icon: <Map size={16} /> },
        { id: 'Miscellaneous', label: 'Miscellaneous', icon: <BookIcon size={16} /> },
    ];

    const filteredBooks = useMemo(() => {
        return books.filter(book => {
            const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                book.author.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesShelf = activeShelf === 'All' || book.shelf === activeShelf;
            return matchesSearch && matchesShelf;
        });
    }, [searchTerm, books, activeShelf]);

    const handleBookClick = (book: Book) => {
        if (book.shelf === 'Maps') {
            const firstImg = book.content.find(c => c.type === 'img');
            if (firstImg) {
                setFullscreenImage(firstImg.content);
                return;
            }
        }
        setSelectedBook(book);
    };

    return (
        <div className="relative w-screen h-screen bg-zinc-950 flex flex-col overflow-hidden">
            {/* Background Layer */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 blur-sm" style={{ backgroundImage: `url(/assets/backgrounds/minimal_bg.png)` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />

            {/* Top Navigation Bar */}
            <header className="relative z-20 w-full h-[7vh] min-h-[56px] px-8 flex justify-between items-center border-b border-zinc-800/50 backdrop-blur-xl shrink-0">
                <button 
                    onClick={selectedBook ? () => setSelectedBook(null) : handleClose} 
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all group px-4 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-zinc-800"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold tracking-widest uppercase text-[10px]">
                        {selectedBook ? 'Return to Archives' : 'Back to Location'}
                    </span>
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-bold text-white tracking-[0.3em] uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
                        The Great Library
                    </h1>
                </div>
                <div className="w-32"></div>
            </header>

            {/* Main Content Area */}
            <div className="relative z-10 w-full h-[93vh] flex flex-col lg:flex-row gap-6 p-4 lg:p-6 items-stretch overflow-hidden">
                
                {selectedBook ? (
                    /* Reading View */
                    <div className="w-full h-full animate-fade-in-up">
                        <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 shadow-2xl h-full flex flex-col overflow-hidden">
                            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 lg:p-12">
                                <article className="max-w-4xl mx-auto pb-24">
                                    <header className="text-center border-b border-zinc-800/50 pb-10 mb-12">
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            <div className="h-px w-12 bg-zinc-800" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Ancient Manuscript</span>
                                            <div className="h-px w-12 bg-zinc-800" />
                                        </div>
                                        <h1 className="text-4xl lg:text-6xl font-bold text-white tracking-tight mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
                                            {selectedBook.title}
                                        </h1>
                                        <div className="space-y-2">
                                            <p className="text-xl text-zinc-400 italic font-medium">By {selectedBook.author}</p>
                                            {selectedBook.releaseYear && (
                                                <p className="text-[11px] text-zinc-600 font-black uppercase tracking-[0.2em]">{selectedBook.releaseYear}</p>
                                            )}
                                        </div>
                                    </header>
                                    <div className="prose prose-invert max-w-none">
                                        {selectedBook.content.map(renderContent)}
                                    </div>
                                </article>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Archive List View */
                    <>
                        {/* Left Panel: Shelves/Categories */}
                        <div className="w-full lg:w-[300px] xl:w-[350px] h-full flex-shrink-0">
                            <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-5 shadow-2xl flex flex-col h-full animate-fade-in-up">
                                <div className="flex items-center gap-3 mb-6 shrink-0 px-2">
                                    <div className="p-2 bg-zinc-800 rounded-xl text-zinc-400">
                                        <LibraryIcon size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-100">Archives</h2>
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Categorized Knowledge</p>
                                    </div>
                                </div>

                                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                    {shelves.map(shelf => (
                                        <button
                                            key={shelf.id}
                                            onClick={() => setActiveShelf(shelf.id)}
                                            className={`w-full flex items-center gap-4 text-left p-3.5 rounded-xl transition-all group border ${
                                                activeShelf === shelf.id 
                                                ? 'bg-zinc-100 text-black border-transparent shadow-lg' 
                                                : 'text-zinc-400 hover:text-white border-transparent hover:bg-white/5 hover:border-zinc-800/50'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-lg ${activeShelf === shelf.id ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-800/50 text-zinc-500 group-hover:text-zinc-300'}`}>
                                                {shelf.icon}
                                            </div>
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${activeShelf === shelf.id ? '' : 'group-hover:translate-x-1 transition-transform'}`}>
                                                {shelf.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Book Grid */}
                        <div className="flex-grow h-full flex flex-col gap-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-6 lg:p-8 shadow-2xl flex flex-col h-full">
                                {/* Search & Stats */}
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 shrink-0">
                                    <div className="relative w-full md:w-96">
                                        <input 
                                            type="text"
                                            placeholder="Search by title or scribe..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-black/40 border border-zinc-800/50 rounded-xl py-2.5 pl-4 pr-12 text-xs text-zinc-300 focus:ring-2 focus:ring-zinc-700 focus:border-zinc-600 outline-none transition-all placeholder:text-zinc-600 font-medium"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-zinc-800 rounded-lg text-zinc-500">
                                            <Search size={14} />
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-black/40 rounded-xl border border-zinc-800/50">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">Manuscripts found:</span>
                                        <span className="text-xs font-black text-zinc-200">{filteredBooks.length}</span>
                                    </div>
                                </div>

                                {/* Grid */}
                                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 min-h-0">
                                    {filteredBooks.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pb-6">
                                            {filteredBooks.map(book => (
                                                <button
                                                    key={book.id}
                                                    onClick={() => handleBookClick(book)}
                                                    className="group flex flex-col gap-3 transition-all duration-500"
                                                >
                                                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-zinc-800 shadow-xl group-hover:shadow-2xl group-hover:border-zinc-700 transition-all">
                                                        {book.coverUrl ? (
                                                            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                        ) : (
                                                            <div className="w-full h-full bg-zinc-900/60 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                                                                <BookOpen size={40} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                                            <p className="text-[8px] font-black uppercase tracking-widest text-white truncate">{book.shelf}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-center px-1">
                                                        <h3 className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors truncate">{book.title}</h3>
                                                        <p className="text-[9px] font-black uppercase tracking-tighter text-zinc-600 mt-0.5">{book.author}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                            <BookOpen size={80} className="text-zinc-700 mb-6" />
                                            <p className="text-xl font-bold tracking-[0.2em] text-zinc-500 uppercase" style={{ fontFamily: 'Cinzel, serif' }}>Archives are Empty</p>
                                            <p className="text-xs font-bold text-zinc-600 mt-2 max-w-xs uppercase tracking-widest">Your search yielded no manuscripts from the shelves.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            
            {/* Fullscreen Map Viewer */}
            {fullscreenImage && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 lg:p-12 animate-fade-in">
                    <button 
                        onClick={() => setFullscreenImage(null)}
                        className="absolute top-8 right-8 p-3 bg-zinc-900/80 border border-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-2xl z-[110]"
                    >
                        <X size={32} />
                    </button>
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        <img 
                            src={fullscreenImage} 
                            alt="Map View" 
                            className="max-w-full max-h-full object-contain shadow-2xl animate-fade-in-up" 
                        />
                    </div>
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-2 bg-zinc-900/80 border border-zinc-800 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 shadow-2xl">
                        Map Viewer • Press ESC to close
                    </div>
                </div>
            )}

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
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }

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

export default LibraryScreen;