
import React, { useState } from 'react';
import type { FC } from 'react';
import { X } from 'lucide-react';
import Slider from '../ui/Slider';
import ToggleSwitch from '../ui/ToggleSwitch';
import { useAudioStore } from '../../stores/useAudioStore';
import Dropdown from '../ui/Dropdown';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'Audio' | 'Graphics' | 'Gameplay';

const OptionsModal: FC<OptionsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Audio');
  const { musicEnabled, sfxEnabled, musicVolume, sfxVolume, toggleMusic, toggleSFX, setMusicVolume, setSFXVolume } = useAudioStore();
  const [settings, setSettings] = useState({
    screenMode: 'Fullscreen',
    resolution: '1920x1080',
    vsync: true,
    autosave: true,
    language: 'English',
  });

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Audio':
        return (
          <div className="space-y-6">
            <ToggleSwitch
              label="Enable Music"
              checked={musicEnabled}
              onChange={(e) => toggleMusic()}
            />
            <Slider
              label="Music Volume"
              value={Math.round(musicVolume * 100)}
              onChange={(e) => setMusicVolume(parseInt(e.target.value, 10) / 100)}
            />
            <ToggleSwitch
              label="Enable SFX"
              checked={sfxEnabled}
              onChange={(e) => toggleSFX()}
            />
            <Slider
              label="SFX Volume"
              value={Math.round(sfxVolume * 100)}
              onChange={(e) => setSFXVolume(parseInt(e.target.value, 10) / 100)}
            />
          </div>
        );
      case 'Graphics':
        return (
          <div className="space-y-6">
            <Dropdown
              label="Screen Mode"
              options={['Fullscreen', 'Windowed', 'Borderless']}
              value={settings.screenMode}
              onChange={(e) => handleSettingChange('screenMode', e.target.value)}
            />
            <Dropdown
              label="Resolution"
              options={['1920x1080', '1600x900', '1280x720']}
              value={settings.resolution}
              onChange={(e) => handleSettingChange('resolution', e.target.value)}
            />
            <ToggleSwitch
              label="VSync"
              checked={settings.vsync}
              onChange={(e) => handleSettingChange('vsync', e.target.checked)}
            />
          </div>
        );
      case 'Gameplay':
        return (
          <div className="space-y-6">
            <ToggleSwitch
              label="Autosave"
              checked={settings.autosave}
              onChange={(e) => handleSettingChange('autosave', e.target.checked)}
            />
            <Dropdown
              label="Language"
              options={['English', 'Spanish', 'French', 'German']}
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-zinc-950 rounded-xl border border-zinc-700 shadow-2xl transform transition-all duration-300 scale-95 opacity-0 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.2s ease-out forwards' }}
      >
        <div className="relative p-6 border-b border-zinc-800">
            <h2 className="text-3xl font-bold text-white text-center" style={{ fontFamily: 'Cinzel, serif' }}>
                Settings
            </h2>
            <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"><X size={24}/></button>
        </div>

        <div className="p-6">
             <div className="flex justify-center items-center gap-2 border-b-2 border-zinc-800 mb-6">
                {(['Audio', 'Graphics', 'Gameplay'] as Tab[]).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 text-md font-semibold capitalize transition-colors ${activeTab === tab ? 'text-white border-b-2 border-zinc-300 -mb-px' : 'text-zinc-400 hover:text-white'}`}>
                        {tab}
                    </button>
                ))}
            </div>
            
            <div className="min-h-[200px] p-2">
                {renderTabContent()}
            </div>
        </div>

        <div className="flex justify-end items-center gap-4 p-6 bg-black/20 border-t border-zinc-800 rounded-b-xl">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-sm font-semibold tracking-wide text-white/90 bg-zinc-700/80 border border-zinc-600 rounded-md transition-all duration-300 hover:bg-zinc-600/80 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 text-sm font-semibold tracking-wide text-white/90 bg-zinc-800 border border-zinc-700 rounded-md transition-all duration-300 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            Save
          </button>
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
  );
};

export default OptionsModal;
