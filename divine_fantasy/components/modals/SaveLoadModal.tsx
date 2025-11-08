
import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import { X } from 'lucide-react';
import { mockSaveSlots } from '../../data';
import SaveSlot from '../ui/SaveSlot';
import ConfirmationModal from './ConfirmationModal';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: 'mainMenu' | 'inGame';
}

type Tab = 'Save' | 'Load';

const SaveLoadModal: FC<SaveLoadModalProps> = ({ isOpen, onClose, context }) => {
  const [activeTab, setActiveTab] = useState<Tab>(context === 'mainMenu' ? 'Load' : 'Save');
  const [saveName, setSaveName] = useState('New Save');
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(context === 'mainMenu' ? 'Load' : 'Save');
    }
  }, [isOpen, context]);

  if (!isOpen) return null;

  const handleSave = (slotId: number) => {
    const slot = mockSaveSlots.find(s => s.id === slotId);
    if (!slot) return;
    if (slot.isEmpty) {
        console.log(`Saving to slot ${slotId} with name "${saveName}"`);
        onClose(); // In a real app, update state and then close
    } else {
        setConfirmationState({
            isOpen: true,
            title: "Overwrite Save?",
            message: `Are you sure you want to overwrite "${slot.saveName}"? This action cannot be undone.`,
            onConfirm: () => {
                console.log(`Overwriting slot ${slotId} with name "${saveName}"`);
                setConfirmationState(null);
                onClose();
            }
        });
    }
  };

  const handleLoad = (slotId: number) => {
    console.log(`Loading from slot ${slotId}`);
    onClose();
  };

  const handleDelete = (slotId: number) => {
     const slot = mockSaveSlots.find(s => s.id === slotId);
     if (!slot) return;
     setConfirmationState({
        isOpen: true,
        title: "Delete Save?",
        message: `Are you sure you want to delete "${slot.saveName}"? This action is permanent.`,
        onConfirm: () => {
            console.log(`Deleting slot ${slotId}`);
            setConfirmationState(null);
            // Here you would update the state of mockSaveSlots, for a demo we just log
        }
    });
  };

  const renderContent = () => (
    <div className="space-y-3 pr-2 overflow-y-auto custom-scrollbar h-full">
      {mockSaveSlots.map(slot => (
        <SaveSlot
          key={slot.id}
          slot={slot}
          mode={activeTab.toLowerCase() as 'save' | 'load'}
          onSave={handleSave}
          onLoad={handleLoad}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300"
        onClick={onClose}
      >
        <div 
          className="w-full max-w-3xl h-[80vh] bg-zinc-950 rounded-xl border border-zinc-700 shadow-2xl transform transition-all duration-300 scale-95 opacity-0 animate-scale-in flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: 'scaleIn 0.2s ease-out forwards' }}
        >
          <div className="relative p-4 border-b border-zinc-800 flex-shrink-0">
              <h2 className="text-3xl font-bold text-white text-center" style={{ fontFamily: 'Cinzel, serif' }}>
                  {context === 'mainMenu' ? 'Load Game' : 'Save / Load Game'}
              </h2>
              <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"><X size={24}/></button>
          </div>

          <div className="p-4 flex-shrink-0">
               <div className="flex justify-center items-center gap-2 border-b-2 border-zinc-800 mb-4">
                  {context === 'inGame' && (
                    <button key="Save" onClick={() => setActiveTab('Save')} className={`px-8 py-2 text-md font-semibold capitalize transition-colors ${activeTab === 'Save' ? 'text-white border-b-2 border-zinc-300 -mb-px' : 'text-zinc-400 hover:text-white'}`}>
                        Save
                    </button>
                  )}
                  <button key="Load" onClick={() => setActiveTab('Load')} className={`px-8 py-2 text-md font-semibold capitalize transition-colors ${activeTab === 'Load' ? 'text-white border-b-2 border-zinc-300 -mb-px' : 'text-zinc-400 hover:text-white'}`}>
                      Load
                  </button>
              </div>
              {activeTab === 'Save' && context === 'inGame' && (
                  <div className="mb-2">
                      <label htmlFor="saveName" className="text-sm font-semibold text-zinc-300 mb-1 block">Save Name</label>
                      <input 
                        id="saveName"
                        type="text"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        className="w-full bg-black/30 border border-zinc-700 rounded-md py-2 px-4 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 outline-none transition"
                      />
                  </div>
              )}
          </div>
          
          <div className="px-4 pb-4 flex-grow min-h-0">
            {renderContent()}
          </div>
         <style>{`
          @keyframes scaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-scale-in {
            animation: scaleIn 0.2s ease-out forwards;
          }
        `}</style>
        </div>
      </div>
      {confirmationState && (
        <ConfirmationModal
            isOpen={confirmationState.isOpen}
            title={confirmationState.title}
            message={confirmationState.message}
            onConfirm={confirmationState.onConfirm}
            onCancel={() => setConfirmationState(null)}
            confirmText="Yes"
            cancelText="No"
        />
      )}
    </>
  );
};

export default SaveLoadModal;
