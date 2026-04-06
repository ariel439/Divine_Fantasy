import { useUIStore } from '../../stores/useUIStore';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { useWorldTimeStore } from '../../stores/useWorldTimeStore';
import { useJournalStore } from '../../stores/useJournalStore';
import {
  benCheatEventSlides,
  rebelRaidIntroSlides,
  evilEndingSlides,
  hybridEndingSlides,
  whitefangFinnKillSlides,
  whitefangShenhaiEndingSlides,
  whitefangExpeditionBreachSlides,
  robertaKissSlides,
  ronaldWolfHuntSlides,
} from '../../data/events';

export function handleTriggerEventAction(eventId: string, endDialogue: () => void): void {
  const ui = useUIStore.getState();
  ui.setCurrentEventId(eventId);

  if (eventId === 'raid_salty_mug_intro') {
    ui.setEventSlides(rebelRaidIntroSlides);
    ui.setScreen('event');
    endDialogue();
    ui.setDialogueNpcId(null);
  } else if (eventId === 'ronald_wolf_hunt_intro') {
    ui.setEventSlides(ronaldWolfHuntSlides);
    ui.setScreen('event');
    endDialogue();
    ui.setDialogueNpcId(null);
  } else if (eventId === 'roberta_kiss_event') {
    ui.setEventSlides(robertaKissSlides);
    ui.setScreen('event');
    endDialogue();
    ui.setDialogueNpcId(null);
  } else if (eventId === 'ben_cheat_event') {
    ui.setEventSlides(benCheatEventSlides);
    ui.setScreen('event');
    endDialogue();
  } else if (eventId === 'thieves_guild_end') {
    useWorldStateStore.getState().setFlag('finn_thieves_guild_complete', true);
    useWorldStateStore.getState().setFlag('finn_debt_collection_active', false);
    useWorldStateStore.getState().setFlag('finn_timeout_ready', false);
    useWorldStateStore.getState().setFlag('finn_timeout_triggered', false);
    ui.setEventSlides(evilEndingSlides);
    ui.setScreen('event');
    endDialogue();
  } else if (eventId === 'finn_hybrid_end') {
    useWorldStateStore.getState().setFlag('finn_hybrid_branch_complete', true);
    useWorldStateStore.getState().setFlag('finn_debt_collection_active', false);
    useWorldStateStore.getState().setFlag('finn_timeout_ready', false);
    useWorldStateStore.getState().setFlag('finn_timeout_triggered', false);
    ui.setEventSlides(hybridEndingSlides);
    ui.setScreen('event');
    endDialogue();
  } else if (eventId === 'whitefang_finn_end') {
    useWorldStateStore.getState().setFlag('finn_whitefang_branch_complete', true);
    useWorldStateStore.getState().setFlag('finn_dead', true);
    if (!useWorldStateStore.getState().getData('npc_finn_death_date')) {
      useWorldStateStore.getState().setData('npc_finn_death_date', useWorldTimeStore.getState().getFormattedDate());
    }
    useWorldStateStore.getState().setFlag('finn_resolved', true);
    useWorldStateStore.getState().setFlag('finn_debt_collection_active', false);
    useWorldStateStore.getState().setFlag('finn_timeout_ready', false);
    useWorldStateStore.getState().setFlag('finn_timeout_triggered', false);

    try { useJournalStore.getState().failQuest('finn_debt_collection'); } catch {}
    ui.setEventSlides(whitefangFinnKillSlides);
    ui.setCurrentEventId('whitefang_finn_end');
    ui.setScreen('event');
    endDialogue();
  } else if (eventId === 'whitefang_shenhai_ending') {
    useWorldStateStore.getState().setFlag('whitefang_shenhai_ending_started', true);
    ui.setEventSlides(whitefangShenhaiEndingSlides);
    ui.setCurrentEventId('whitefang_shenhai_ending');
    ui.setScreen('event');
    endDialogue();
  } else if (eventId === 'whitefang_expedition_breach') {
    useWorldStateStore.getState().setFlag('whitefang_cave_breached', true);
    ui.setEventSlides(whitefangExpeditionBreachSlides);
    ui.setCurrentEventId('whitefang_expedition_breach');
    ui.setScreen('event');
    endDialogue();
  } else {
    ui.setScreen('choiceEvent');
    endDialogue();
  }
}
