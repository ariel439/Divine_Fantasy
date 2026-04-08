import React, { useState } from 'react';
import type { FC } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { useLocationStore } from '../../stores/useLocationStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useDiaryStore } from '../../stores/useDiaryStore';
import { useSkillStore } from '../../stores/useSkillStore';
import { useWorldTimeStore } from '../../stores/useWorldTimeStore';
import { GameManagerService } from '../../services/GameManagerService';

type QuestId = 'roberta' | 'ronald' | 'finn' | 'whitefang' | 'crank';

interface Scenario {
  label: string;
  description: string[];
  launch: () => void;
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

const grant = (itemId: string, qty: number) => {
  const inv = useInventoryStore.getState();
  const cur = inv.getItemQuantity(itemId);
  if (cur > 0) inv.removeItem(itemId, cur);
  if (qty > 0) inv.addItem(itemId, qty);
};

const setGold = (gold: number) =>
  useCharacterStore.setState(s => ({ ...s, currency: { copper: 0, silver: 0, gold } }));

const setRel = (npcId: string, friendship: number, love = 0) => {
  const diary = useDiaryStore.getState();
  const rel = (diary.relationships[npcId] || {}) as { friendship?: { value: number }; love?: { value: number } };
  const df = friendship - (rel.friendship?.value || 0);
  const dl = love - (rel.love?.value || 0);
  if (df !== 0) diary.updateRelationship(npcId, { friendship: df });
  if (dl !== 0) diary.updateRelationship(npcId, { love: dl });
};


const go = (locationId: string, hour = 9) => {
  useCharacterStore.setState(s => ({ ...s, hp: s.maxHp, energy: 100, hunger: 80 }));
  useLocationStore.getState().setLocation(locationId);
  useWorldTimeStore.setState({ hour, minute: 0 });
  useUIStore.getState().setScreen('inGame');
};

// ─── Scenarios ─────────────────────────────────────────────────────────────────

const SCENARIOS: Record<QuestId, Scenario> = {
  roberta: {
    label: 'Roberta — End to End',
    description: [
      'Relationship 50 with Roberta (Q2 gate met)',
      'All lore & conversation flags seen',
      'Carpentry skill 10',
      '30 wooden planks, 60 iron nails, 6 rope, 8 cloth, 1 hammer',
      '99 gold — no quests started',
      'Location: Tide & Trade, 9am',
    ],
    launch: () => {
      GameManagerService.startNewGame('luke_orphan');
      GameManagerService.skipStoryIntroToFinnWeek();

      // Clear Finn quest (skipStory starts it automatically)
      const j = useJournalStore.getState();
      j.updateQuest('finn_debt_collection', { active: false, completed: false, currentStage: 0 });
      useJournalStore.setState(s => ({ questsList: s.questsList.filter(q => q.id !== 'finn_debt_collection') }));

      const ws = useWorldStateStore.getState();
      ws.setFlag('finn_debt_collection_active', false);
      ws.addKnownNpc('npc_roberta');
      ws.setFlag('roberta_first_meet_done', true);
      ws.setFlag('roberta_lore_seen', true);
      ws.setFlag('roberta_asked_manage_alone', true);
      ws.setFlag('roberta_asked_shop_future', true);
      ws.setFlag('roberta_romance_unlocked', false);
      ws.setFlag('roberta_romance_open', false);
      ['roberta_upgrade_counter_done', 'roberta_upgrade_displays_done',
        'roberta_upgrade_storefront_done', 'roberta_shop_upgrades_complete',
        'roberta_kiss_done', 'tide_trade_wall_repaired', 'tide_trade_upgraded',
      ].forEach(f => ws.setFlag(f, false));

      setRel('npc_roberta', 50);
      useSkillStore.getState().setSkillLevel('carpentry', 10);
      setGold(99);

      // Q1: 10 planks (triggers "I already have them" shortcut), Q2 needs 16+36+4+5
      grant('wooden_plank', 30);
      grant('iron_nails', 60);
      grant('rope', 6);
      grant('cloth', 8);
      grant('hammer', 1);

      go('tide_trade');
    },
  },

  ronald: {
    label: 'Ronald — End to End',
    description: [
      'Relationship 20 with Ronald',
      'chainmail_shirt, chainmail_leggings, iron_helmet',
      'bronze_sword, bronze_shield',
      '99 gold — no quest started',
      'Location: Mosswatch Keep, 9am',
    ],
    launch: () => {
      GameManagerService.startNewGame('luke_orphan');
      GameManagerService.skipStoryIntroToFinnWeek();

      const j = useJournalStore.getState();
      j.updateQuest('finn_debt_collection', { active: false, completed: false, currentStage: 0 });
      useJournalStore.setState(s => ({ questsList: s.questsList.filter(q => q.id !== 'finn_debt_collection') }));

      const ws = useWorldStateStore.getState();
      ws.setFlag('finn_debt_collection_active', false);
      ws.addKnownNpc('npc_ronald');
      ws.setFlag('ronald_referred_by_matthias', false);
      ws.setFlag('ronald_referred_by_stan', false);
      ws.setFlag('ronald_wolf_pack_started', false);
      ws.setFlag('ronald_wolf_pack_cleared', false);
      ws.setFlag('wolf_puppy_adopted', false);
      ws.setFlag('ronald_asked_why_alone', false);
      ws.setFlag('ronald_asked_forest_secret', false);
      ws.setFlag('ronald_hidden_cabin_known', false);
      ws.setData('ronald_hidden_path_progress', '0');

      setRel('npc_ronald', 20);
      setGold(99);

      grant('chainmail_shirt', 1);
      grant('chainmail_leggings', 1);
      grant('iron_helmet', 1);
      grant('bronze_sword', 1);
      grant('bronze_shield', 1);

      go('mosswatch_keep');
    },
  },

  finn: {
    label: 'Finn Week 1 — Sandbox',
    description: [
      'Standard week 1 start (same as Skip to Finn Week)',
      'Finn debt quest active — 7 days, no debts paid',
      '99 gold',
      'Location: Salty Mug, 8am',
    ],
    launch: () => {
      GameManagerService.startNewGame('luke_orphan');
      GameManagerService.skipStoryIntroToFinnWeek();
      setGold(99);
      useUIStore.getState().setScreen('inGame');
    },
  },

  crank: {
    label: 'Old Crank — Treasure Hunt',
    description: [
      'Relationship 20 with Old Crank (past ask gate met)',
      'spade in inventory (map earned by talking to Old Crank)',
      '99 gold — quest not started',
      'Location: Salty Mug, 9pm',
    ],
    launch: () => {
      GameManagerService.startNewGame('luke_orphan');
      GameManagerService.skipStoryIntroToFinnWeek();

      const j = useJournalStore.getState();
      j.updateQuest('finn_debt_collection', { active: false, completed: false, currentStage: 0 });
      useJournalStore.setState(s => ({ questsList: s.questsList.filter(q => q.id !== 'finn_debt_collection') }));

      const ws = useWorldStateStore.getState();
      ws.setFlag('finn_debt_collection_active', false);
      ws.addKnownNpc('npc_old_crank');
      ws.setFlag('crank_lore_mug_seen', true);
      ws.setFlag('crank_gossip_1_seen', true);
      ws.setFlag('crank_gossip_2_seen', true);
      ws.setFlag('crank_gossip_3_seen', true);
      [
        'crank_rat_seen',
        'crank_past_seen',
        'crank_cave_found', 'crank_search_1_done', 'crank_search_2_done',
        'crank_seq_s1', 'crank_seq_s2', 'crank_seq_s3', 'crank_seq_s4', 'crank_seq_s5',
        'crank_seq_done', 'crank_cave_chamber_reached', 'crank_treasure_dug',
      ].forEach(f => ws.setFlag(f, false));

      setRel('npc_old_crank', 20);
      setGold(99);
      grant('spade', 1);
      go('salty_mug', 21);
    },
  },

  whitefang: {
    label: 'White Fang — End to End',
    description: [
      'iron_helmet, iron_chainmail, iron_leggings',
      'iron_sword, iron_shield, spade',
      'Basic Shenhaic known',
      '99 gold — no quest started',
      'Location: Grand Library, 9am',
    ],
    launch: () => {
      GameManagerService.startNewGame('luke_orphan');
      GameManagerService.skipStoryIntroToFinnWeek();

      const j = useJournalStore.getState();
      j.updateQuest('finn_debt_collection', { active: false, completed: false, currentStage: 0 });
      useJournalStore.setState(s => ({ questsList: s.questsList.filter(q => q.id !== 'finn_debt_collection') }));

      const ws = useWorldStateStore.getState();
      ws.setFlag('finn_debt_collection_active', false);
      ws.addKnownNpc('npc_shihan');
      ws.addKnownNpc('npc_adalia');
      ws.setFlag('knows_shenhaic_basic', true);
      [
        'whitefang_signs_noticed', 'whitefang_book_read',
        'whitefang_woods_vision_seen', 'whitefang_beach_vision_seen',
        'whitefang_mountain_vision_seen', 'whitefang_cave_discovered',
        'whitefang_expedition_agreed', 'whitefang_cave_breached',
        'whitefang_renzhen_shadow_defeated', 'whitefang_camp_unlocked',
        'whitefang_bound', 'whitefang_resisted',
        'whitefang_beach_necklace_buried', 'whitefang_beach_necklace_recovered',
        'whitefang_week_closed',
      ].forEach(f => ws.setFlag(f, false));

      setGold(99);

      grant('iron_helmet', 1);
      grant('iron_chainmail', 1);
      grant('iron_leggings', 1);
      grant('iron_sword', 1);
      grant('iron_shield', 1);
      grant('spade', 1);

      go('grand_library');
    },
  },
};

// ─── Quest list config ─────────────────────────────────────────────────────────

const QUESTS: Array<{ id: QuestId; label: string; sub: string }> = [
  { id: 'roberta', label: 'Roberta', sub: 'Planks for the Past + Set the Shop Right' },
  { id: 'ronald', label: 'Ronald', sub: "Teeth in the Trees" },
  { id: 'finn', label: 'Finn Week 1', sub: "Finn's Debt Collection" },
  { id: 'whitefang', label: 'White Fang', sub: "White Fang's Echo" },
  { id: 'crank', label: 'Old Crank', sub: "Old Crank's Map" },
];

// ─── Main Component ────────────────────────────────────────────────────────────

const QuestDebugScreen: FC = () => {
  const { setScreen } = useUIStore();
  const [selected, setSelected] = useState<QuestId>('roberta');
  const scenario = SCENARIOS[selected];

  return (
    <div className="w-full h-full bg-black/85 p-4 md:p-6">
      <div className="w-full h-full bg-zinc-950/95 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>
            Quest Debug
          </h1>
          <button
            onClick={() => setScreen('debugMenu')}
            className="px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sm text-white border border-zinc-600 flex items-center gap-2"
          >
            <ArrowLeft size={15} /> Back
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left — Quest List */}
          <nav className="w-56 shrink-0 border-r border-zinc-800 py-3 flex flex-col gap-1 px-2 overflow-y-auto">
            {QUESTS.map(q => (
              <button
                key={q.id}
                onClick={() => setSelected(q.id)}
                className={`text-left px-3 py-3 rounded-lg transition-all ${
                  selected === q.id
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <div className="text-sm font-semibold">{q.label}</div>
                <div className="text-xs text-zinc-500 mt-0.5 leading-tight">{q.sub}</div>
              </button>
            ))}
          </nav>

          {/* Right — Scenario Panel */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
              <div className="font-semibold text-white text-base">{scenario.label}</div>

              <ul className="flex flex-col gap-1.5">
                {scenario.description.map(line => (
                  <li key={line} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-zinc-600 mt-0.5 shrink-0">—</span>
                    {line}
                  </li>
                ))}
              </ul>

              <button
                onClick={scenario.launch}
                className="mt-2 flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-100 text-sm font-semibold border border-emerald-800/60 transition-all w-fit"
              >
                <Play size={14} fill="currentColor" />
                Launch
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              Resets full game state on launch. More scenarios will be added here per quest.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default QuestDebugScreen;
