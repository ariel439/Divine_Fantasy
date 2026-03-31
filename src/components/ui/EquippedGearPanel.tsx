import React, { ReactElement } from 'react';
import type { FC, ReactNode } from 'react';
import {
  Shield,
  Sword,
  HardHat,
  Shirt,
  Hand,
  Footprints,
  Gem,
  Radio,
  Ribbon,
  SplitSquareHorizontal,
  Eye,
} from 'lucide-react';
import type { Item, EquipmentSlot } from '../../types';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { getSocialPresenceSummary } from '../../utils/socialPresentation';

interface EquippedGearPanelProps {
  equippedItems: Partial<Record<EquipmentSlot, Item>>;
  onItemSelect: (item: Item) => void;
}

const Slot: FC<{
  slot: EquipmentSlot;
  item: Item | undefined;
  placeholder: ReactNode;
  onItemSelect: (item: Item) => void;
}> = ({ slot, item, placeholder, onItemSelect }) => {
  const Component = item ? 'button' : 'div';
  const handleClick = () => {
    if (item) onItemSelect(item);
  };

  return (
    <Component
      onClick={handleClick}
      className={`relative flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-800 bg-black/40 transition-all duration-300 md:h-24 md:w-24 ${
        item ? 'group cursor-pointer shadow-xl hover:border-white hover:bg-zinc-100' : 'group hover:border-zinc-700'
      }`}
      title={item ? item.name : slot.charAt(0).toUpperCase() + slot.slice(1)}
    >
      {item ? (
        <div className="text-zinc-100 transition-colors group-hover:text-black">
          {(() => {
            const iconEl = item.icon as ReactElement<any> | undefined;
            if (iconEl && typeof iconEl.type === 'string' && iconEl.type === 'img') {
              const src = (iconEl.props && (iconEl.props as any).src) || '';
              const alt = (iconEl.props && (iconEl.props as any).alt) || item.name;
              return <img src={src} alt={alt} className="h-10 w-10 rounded object-contain transition-transform group-hover:scale-110" />;
            }
            return iconEl ? React.cloneElement(iconEl, { size: 36 }) : null;
          })()}
        </div>
      ) : (
        <div className="opacity-20 transition-opacity group-hover:opacity-40">{placeholder}</div>
      )}

      <span
        className={`absolute -bottom-2 left-1/2 -translate-x-1/2 rounded border px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter transition-all ${
          item ? 'border-zinc-700 bg-zinc-800 text-zinc-300' : 'border-zinc-800 bg-zinc-900 text-zinc-600'
        }`}
      >
        {slot}
      </span>
    </Component>
  );
};

const EquippedGearPanel: FC<EquippedGearPanelProps> = ({ equippedItems, onItemSelect }) => {
  const EmptySlot = () => <div className="h-20 w-20 md:h-24 md:w-24" />;
  const { equipmentLoadouts, activeEquipmentLoadout, saveEquipmentLoadout, applyEquipmentLoadout } = useCharacterStore();
  const socialPresence = getSocialPresenceSummary();

  const slots: { slot: EquipmentSlot; placeholder: ReactNode }[] = [
    { slot: 'head', placeholder: <HardHat size={32} /> },
    { slot: 'cape', placeholder: <Ribbon size={32} /> },
    { slot: 'amulet', placeholder: <Gem size={32} /> },
    { slot: 'weapon', placeholder: <Sword size={32} /> },
    { slot: 'chest', placeholder: <Shirt size={32} /> },
    { slot: 'shield', placeholder: <Shield size={32} /> },
    { slot: 'legs', placeholder: <SplitSquareHorizontal size={32} /> },
    { slot: 'gloves', placeholder: <Hand size={32} /> },
    { slot: 'boots', placeholder: <Footprints size={32} /> },
    { slot: 'ring', placeholder: <Radio size={32} /> },
  ];

  const getSlot = (slotName: EquipmentSlot) => {
    const slotConfig = slots.find((s) => s.slot === slotName)!;
    return <Slot slot={slotName} item={equippedItems[slotName]} placeholder={slotConfig.placeholder} onItemSelect={onItemSelect} />;
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-transparent p-6 custom-scrollbar">
      <div className="mb-6 flex flex-shrink-0 items-center justify-center">
        <div className="flex items-center gap-2">
          {[1, 2].map((slot) => {
            const loadout = equipmentLoadouts[slot as 1 | 2];
            const savedCount = Object.keys(loadout || {}).length;
            const isEmpty = savedCount === 0;
            const isSelected = activeEquipmentLoadout === (slot as 1 | 2);
            return (
              <button
                key={slot}
                onClick={(event) => {
                  if (event.shiftKey || isEmpty) saveEquipmentLoadout(slot as 1 | 2);
                  else applyEquipmentLoadout(slot as 1 | 2);
                }}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-black uppercase tracking-[0.2em] transition-all ${
                  isSelected
                    ? 'border-amber-300 bg-amber-100 text-black shadow-[0_0_20px_rgba(251,191,36,0.18)]'
                    : isEmpty
                      ? 'border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-zinc-500'
                      : 'border-amber-800/50 bg-amber-950/30 text-amber-200 hover:border-amber-600'
                }`}
                title={isEmpty ? `Save current gear to Loadout ${slot}` : `Apply Loadout ${slot} (Shift+Click to overwrite)`}
              >
                {slot === 1 ? 'I' : 'II'}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-x-5 gap-y-7 justify-items-center">
            <EmptySlot />
            {getSlot('head')}
            <EmptySlot />

            {getSlot('cape')}
            {getSlot('amulet')}
            {getSlot('ring')}

            {getSlot('weapon')}
            {getSlot('chest')}
            {getSlot('shield')}

            {getSlot('gloves')}
            {getSlot('legs')}
            {getSlot('boots')}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/60 bg-black/30 p-4">
          <div className="flex items-center gap-2 text-zinc-300 mb-3">
            <Eye size={16} className="text-amber-300" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Social Presence</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/40 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Presentation</p>
              <p className="mt-1 text-base font-bold text-zinc-100">{socialPresence.presentationLabel}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/40 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Threat</p>
              <p className="mt-1 text-base font-bold text-zinc-100">{socialPresence.threatLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquippedGearPanel;
