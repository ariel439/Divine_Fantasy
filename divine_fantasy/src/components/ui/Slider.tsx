
import React from 'react';
import type { FC, ChangeEvent } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const Slider: FC<SliderProps> = ({ label, value, min = 0, max = 100, onChange }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-md font-semibold text-zinc-300">{label}</label>
        <span className="text-lg font-mono font-bold text-white">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb"
      />
      <style>{`
        .range-thumb::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: #a1a1aa; /* zinc-400 */
            cursor: pointer;
            border-radius: 50%;
            border: 3px solid #3f3f46; /* zinc-700 */
            transition: background-color 0.2s ease;
        }
        .range-thumb::-webkit-slider-thumb:hover {
            background: #e4e4e7; /* zinc-200 */
        }
        .range-thumb::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: #a1a1aa; /* zinc-400 */
            cursor: pointer;
            border-radius: 50%;
            border: 3px solid #3f3f46; /* zinc-700 */
            transition: background-color 0.2s ease;
        }
        .range-thumb::-moz-range-thumb:hover {
            background: #e4e4e7; /* zinc-200 */
        }
      `}</style>
    </div>
  );
};

export default Slider;
