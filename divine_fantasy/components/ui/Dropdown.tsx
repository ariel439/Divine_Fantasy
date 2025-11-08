
import React from 'react';
import type { FC, ChangeEvent } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

const Dropdown: FC<DropdownProps> = ({ label, options, value, onChange }) => {
  return (
    <div className="flex items-center justify-between">
      <label className="text-md font-semibold text-zinc-300">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="appearance-none w-48 text-right bg-zinc-800 border border-zinc-700 text-white rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-zinc-500 cursor-pointer"
        >
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
};

export default Dropdown;
