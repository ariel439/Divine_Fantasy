
import React from 'react';
import type { FC, ReactNode } from 'react';
import { Save, Download, Trash2, ImageOff } from 'lucide-react';

interface SaveSlotData {
    id: number;
    isEmpty: boolean;
    screenshotUrl?: string;
    saveName?: string;
    saveDate?: string;
}

interface SaveSlotProps {
    slot: SaveSlotData;
    mode: 'save' | 'load';
    onSave: (slotId: number) => void;
    onLoad: (slotId: number) => void;
    onDelete: (slotId: number) => void;
}

const SaveSlot: FC<SaveSlotProps> = ({ slot, mode, onSave, onLoad, onDelete }) => {
    const ActionButton: FC<{ icon: ReactNode; text: string; onClick: () => void; className?: string }> = ({ icon, text, onClick, className }) => (
        <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${className}`}>
            {icon} {text}
        </button>
    );

    const renderActions = () => {
        switch (mode) {
            case 'save':
                return (
                    <ActionButton
                        icon={<Save size={14} />}
                        text={slot.isEmpty ? "Save" : "Overwrite"}
                        onClick={() => onSave(slot.id)}
                        className="bg-blue-600/50 text-blue-200 hover:bg-blue-600/80 border border-blue-500/60"
                    />
                );
            case 'load':
                if (slot.isEmpty) return null;
                return (
                    <>
                        <ActionButton
                            icon={<Download size={14} />}
                            text="Load"
                            onClick={() => onLoad(slot.id)}
                            className="bg-green-600/50 text-green-200 hover:bg-green-600/80 border border-green-500/60"
                        />
                        <ActionButton
                            icon={<Trash2 size={14} />}
                            text="Delete"
                            onClick={() => onDelete(slot.id)}
                            className="bg-red-600/50 text-red-200 hover:bg-red-600/80 border border-red-500/60"
                        />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex items-center gap-4 p-3 bg-zinc-900/70 rounded-lg border border-zinc-800 hover:bg-zinc-800/60 transition-colors">
            <div className="w-32 h-24 flex-shrink-0 bg-black/30 rounded-md border border-zinc-700 flex items-center justify-center">
                {slot.isEmpty ? (
                    <ImageOff size={32} className="text-zinc-600" />
                ) : (
                    <img src={slot.screenshotUrl} alt={`Save slot ${slot.id}`} className="w-full h-full object-cover rounded-md" />
                )}
            </div>
            <div className="flex-grow">
                {slot.isEmpty ? (
                    <p className="text-lg font-semibold text-zinc-500 italic">Empty Slot</p>
                ) : (
                    <>
                        <h3 className="text-lg font-bold text-white truncate">{slot.saveName}</h3>
                        <p className="text-xs text-zinc-400 mt-1">{slot.saveDate}</p>
                    </>
                )}
            </div>
            <div className="flex flex-col gap-2 items-end">
                {renderActions()}
            </div>
        </div>
    );
};

export default SaveSlot;
