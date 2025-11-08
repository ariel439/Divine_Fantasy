

import React, { useState, useMemo } from 'react';
import type { FC } from 'react';
import { Search, BookOpen, ChevronLeft, MapPin } from 'lucide-react';
import type { Book, BookContent } from '../../types';
import { mockBooks } from '../../data';

// Updated renderContent to apply better styling for readability
const renderContent = (content: BookContent, index: number) => {
    switch (content.type) {
        case 'h1':
            return <h1 key={index} className="text-3xl lg:text-4xl font-bold text-white mt-8 mb-4 border-b border-zinc-700 pb-2" style={{ fontFamily: 'Cinzel, serif' }}>{content.content}</h1>;
        case 'h2':
            return <h2 key={index} className="text-2xl lg:text-3xl font-bold text-zinc-200 mt-8 mb-4" style={{ fontFamily: 'Cinzel, serif' }}>{content.content}</h2>;
        case 'p':
            return <p key={index} className="text-base lg:text-lg text-zinc-300 leading-relaxed mb-4">{content.content}</p>;
        case 'img':
            return (
                <figure key={index} className="my-8">
                    <img src={content.content} alt={content.caption || 'Book illustration'} className="w-full max-w-3xl mx-auto rounded-lg border border-zinc-700 shadow-lg" />
                    {content.caption && <figcaption className="text-center text-sm text-zinc-400 italic mt-3">{content.caption}</figcaption>}
                </figure>
            );
        default:
            return null;
    }
}

interface LibraryScreenProps {
    onClose: () => void;
}

const LibraryScreen: FC<LibraryScreenProps> = ({ onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);

    const filteredBooks = useMemo(() => {
        return mockBooks.filter(book => 
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    // Reading View (when a book is selected)
    if (selectedBook) {
        return (
            <div className="w-full h-full flex flex-col">
                 <header className="flex-shrink-0 p-4">
                    <button onClick={() => setSelectedBook(null)} className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 z-10 relative">
                        <ChevronLeft size={24} />
                        <span className="font-semibold">Back to Library</span>
                    </button>
                </header>
                <div className="flex-grow overflow-y-auto custom-scrollbar min-h-0">
                    <article className="max-w-4xl mx-auto px-4 sm:px-8 pb-24">
                        <header className="text-center border-b-2 border-zinc-700 pb-6 mb-8">
                            <h1 className="text-4xl lg:text-6xl font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>{selectedBook.title}</h1>
                            <p className="text-lg text-zinc-400 italic mt-2">{selectedBook.author}</p>
                        </header>
                        {selectedBook.content.map(renderContent)}
                    </article>
                </div>
            </div>
        );
    }

    // Book List View (default)
    return (
        <div className="w-full h-full p-4 sm:p-8 pt-12 pb-24 flex flex-col">
            <header className="w-full max-w-screen-2xl mx-auto mb-6 flex-shrink-0 flex justify-between items-start flex-wrap gap-4">
                <div>
                    <h1 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Cinzel, serif' }}>Library</h1>
                    <div className="relative max-w-md">
                        <input 
                            type="text"
                            placeholder="Search by title or author..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/30 border border-zinc-700 rounded-md py-2.5 pl-4 pr-10 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 outline-none transition"
                        />
                        <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="flex items-center gap-2 mt-2 px-4 py-2 text-sm font-semibold text-white/90 bg-zinc-800 border border-zinc-700 rounded-md transition-all duration-300 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                >
                    <MapPin size={16} />
                    Back to Location
                </button>
            </header>
            <div className="w-full max-w-screen-2xl mx-auto flex-grow overflow-y-auto custom-scrollbar min-h-0 pr-4 pt-2">
                {filteredBooks.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredBooks.map(book => (
                            <button
                                key={book.id}
                                onClick={() => setSelectedBook(book)}
                                className="group bg-black/20 rounded-lg border border-zinc-800 p-4 text-center aspect-[3/4] flex flex-col justify-center items-center hover:bg-zinc-800/60 hover:border-zinc-600 transform hover:-translate-y-1 transition-all duration-300"
                            >
                                <BookOpen size={48} className="text-zinc-500 group-hover:text-zinc-300 mb-4 transition-colors" />
                                <h3 className="font-bold text-lg text-white leading-tight">{book.title}</h3>
                                <p className="text-sm text-zinc-400 mt-1">{book.author}</p>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center">
                        <BookOpen size={48} className="mb-4" />
                        <h2 className="text-2xl font-bold">No Books Found</h2>
                        <p className="mt-1">Your search for "{searchTerm}" did not match any books in the library.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LibraryScreen;