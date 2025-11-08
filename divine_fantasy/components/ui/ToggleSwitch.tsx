
import React from 'react';
import type { FC, ChangeEvent } from 'react';

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const ToggleSwitch: FC<ToggleSwitchProps> = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-md font-semibold text-zinc-300">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={onChange}
        />
        <div className="block bg-zinc-700 w-14 h-8 rounded-full"></div>
        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'translate-x-6 bg-zinc-300' : ''}`}></div>
      </div>
    </label>
  );
};

export default ToggleSwitch;
