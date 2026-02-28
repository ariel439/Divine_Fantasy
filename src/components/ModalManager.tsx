import React from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useCharacterStore } from '../stores/useCharacterStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useJournalStore } from '../stores/useJournalStore';
import { GameManagerService } from '../services/GameManagerService';
import SleepWaitModal from './modals/SleepWaitModal';
import ConfirmationModal from './modals/ConfirmationModal';
import OptionsModal from './modals/OptionsModal';
import TutorialModal from './modals/TutorialModal';
import { finnDebtIntroSlides, raidSaltyMugIntroSlides } from '../data/events';

const ModalManager: React.FC = () => {
  const { activeModal, closeModal, sleepWaitMode, sleepQuality, confirmationType, setEventSlides, setCurrentEventId, setScreen, setDialogueNpcId, currentScreen, dialogueNpcId } = useUIStore();
  const ui = useUIStore(); // For accessing state directly if needed or other props

  if (!activeModal) return null;

  return (
    <>
      {activeModal === 'options' && (
        <OptionsModal isOpen={true} onClose={closeModal} />
      )}

      {activeModal === 'sleepWait' && (
        (() => {
          const world = useWorldStateStore.getState();
          const loc = useLocationStore.getState().getCurrentLocation();
          const isIntroSleep = world.introMode && (world.tutorialStep === 6 || world.tutorialStep === 7) && loc.id === 'orphanage_room';
          const currentSeconds = isIntroSleep ? (20 * 3600) : (useWorldTimeStore.getState().hour * 3600 + useWorldTimeStore.getState().minute * 60);
          const fixedDuration = isIntroSleep ? 10 : undefined;
          
          return (
            <SleepWaitModal
              isOpen={true}
              mode={sleepWaitMode || 'wait'}
              sleepQuality={sleepQuality ?? 1.0}
              currentTimeInSeconds={currentSeconds}
              fixedDuration={fixedDuration}
              onComplete={(hours) => {
                console.log(`[SleepWait] complete mode=${sleepWaitMode} hours=${fixedDuration ?? hours}`);
                const worldState = useWorldStateStore.getState();
                
                if (sleepWaitMode === 'sleep') {
                  const quality = sleepQuality ?? 1.0;
                  const duration = fixedDuration ?? hours;
                  useCharacterStore.getState().sleep(duration, quality);
                }
                
                if (useWorldStateStore.getState().getFlag('start_finn_debt_on_sleep')) {
                  useWorldStateStore.getState().setFlag('start_finn_debt_on_sleep', false);
                  useWorldTimeStore.setState({ hour: 8, minute: 0, year: 780 });
                  useLocationStore.getState().setLocation('salty_mug');
                  useWorldStateStore.getState().setFlag('finn_debt_intro_pending', true);
                  setEventSlides(finnDebtIntroSlides);
                  setCurrentEventId('finn_debt_intro');
                  setScreen('event');
                } else if (isIntroSleep) {
                  useWorldTimeStore.setState({ hour: 6, minute: 0 });
                  useWorldStateStore.getState().setFlag('robert_smuggler_incident', true);
                  try { useJournalStore.getState().setQuestStage('luke_tutorial', 7); } catch {}
                  useLocationStore.getState().setLocation('leo_lighthouse');
                  setCurrentEventId('kyle_smuggler_alert');
                  setDialogueNpcId('npc_kyle');
                  setScreen('dialogue');
                } else {
                  const durationMin = (fixedDuration ?? hours) * 60;
                  console.log(`[SleepWait] passTime ${durationMin}m`);
                  useWorldTimeStore.getState().passTime(durationMin);
                }
                useWorldTimeStore.getState().setClockPaused(false);
                closeModal();
              }}
              onCancel={() => { useWorldTimeStore.getState().setClockPaused(false); closeModal(); }}
            />
          );
        })()
      )}

      {activeModal === 'confirmation' && (() => {
        const loc = useLocationStore.getState().getCurrentLocation();
        const { tutorialStep, introMode } = useWorldStateStore.getState();
        const isIntroSkip = introMode && loc.id === 'orphanage_room' && tutorialStep === 0;
        
        let title = isIntroSkip ? 'Skip Intro' : undefined;
        let message: React.ReactNode = isIntroSkip ? (
          <div>
            <p className="mb-2">Are you sure you want to skip the intro?</p>
            <p className="text-zinc-400 text-sm">You will start at the Salty Mug without receiving any intro rewards.</p>
          </div>
        ) : (
          <p>Are you sure?</p>
        );
        let confirmText = isIntroSkip ? 'Skip Intro' : 'Confirm';

        if (confirmationType === 'raid_start') {
          title = 'Start Raid';
          message = (
              <div>
                 <p className="mb-2">Are you sure you want to start the raid on the Salty Mug?</p>
                 <p className="text-zinc-400 text-sm">Make sure you are prepared. There is no turning back.</p>
              </div>
          );
          confirmText = "Let's Go";
        }

        const onConfirm = () => {
          if (confirmationType === 'raid_start') {
              setEventSlides(raidSaltyMugIntroSlides);
              setCurrentEventId('raid_salty_mug_intro');
              setScreen('event');
              setDialogueNpcId(null);
          } else if (isIntroSkip) {
            useWorldTimeStore.setState({ hour: 8, minute: 0 });
            useCharacterStore.setState({ hunger: 100 });
            useWorldStateStore.getState().setIntroCompleted(true);
            useWorldStateStore.getState().setFlag('intro_completed', true);
            useWorldStateStore.getState().setIntroMode(false);
            useWorldStateStore.getState().removeKnownNpc('npc_robert');
            useWorldTimeStore.setState({ year: 780 });
            useLocationStore.getState().setLocation('salty_mug');
            setEventSlides(finnDebtIntroSlides);
            setCurrentEventId('finn_debt_intro');
            try { useJournalStore.getState().completeQuest('luke_tutorial'); } catch {}
            setScreen('event');
          }
          useWorldTimeStore.getState().setClockPaused(false);
          closeModal();
        };
        const onCancel = () => {
          useWorldTimeStore.getState().setClockPaused(false);
          closeModal();
        };
        return (
          <ConfirmationModal
            isOpen={true}
            title={title}
            message={message}
            onConfirm={onConfirm}
            onCancel={onCancel}
            confirmText={confirmText}
            cancelText={'Cancel'}
          />
        );
      })()}

      {activeModal === 'tutorial' && (() => {
        const loc = useLocationStore.getState().getCurrentLocation();
        const { tutorialStep } = useWorldStateStore.getState();
        let message = 'Follow the highlighted action to proceed.';
        if (loc.id === 'orphanage_room' && tutorialStep === 0) {
          message = 'Locations display the current time and weather, with available actions listed to the right. Please select the highlighted action to leave the room.';
        } else if (currentScreen === 'dialogue' && dialogueNpcId === 'npc_old_leo' && tutorialStep <= 2) {
          message = 'Conversations present choices. Speak with Old Leo and select one starting path to begin your day.';
        } else if (currentScreen === 'combat' && !useWorldStateStore.getState().getFlag('combat_tutorial_seen')) {
          message = 'In combat, select a target on the right, then press Attack.';
        }
        const handleClose = () => {
          const world = useWorldStateStore.getState();
          if (loc.id === 'orphanage_room' && world.tutorialStep === 0) {
            useWorldStateStore.getState().setSeenRoomTutorial(true);
          }
          if (currentScreen === 'dialogue' && dialogueNpcId === 'npc_old_leo' && world.tutorialStep <= 2) {
            useWorldStateStore.getState().setSeenLeoTutorial(true);
          }
          if (currentScreen === 'combat') {
            useWorldStateStore.getState().setFlag('combat_tutorial_seen', true);
            useWorldStateStore.getState().setFlag('combat_tutorial_active', false);
          }
          closeModal();
        };
        const handleSkipIntro = () => {
          useWorldTimeStore.setState({ hour: 8, minute: 0 });
          useCharacterStore.setState({ hunger: 100 });
          useWorldStateStore.getState().setIntroCompleted(true);
          useWorldStateStore.getState().setFlag('intro_completed', true);
          useWorldStateStore.getState().setIntroMode(false);
          useWorldStateStore.getState().removeKnownNpc('npc_robert');
          useWorldStateStore.getState().setFlag('finn_debt_intro_pending', true);
          useWorldTimeStore.setState({ year: 780 });
          useLocationStore.getState().setLocation('salty_mug');
          setEventSlides(finnDebtIntroSlides);
          setCurrentEventId('finn_debt_intro');
          try { useJournalStore.getState().completeQuest('luke_tutorial'); } catch {}
          setScreen('event');
          closeModal();
        };
        return (
          <TutorialModal 
            isOpen={true} 
            title="Tutorial" 
            message={message} 
            onClose={handleClose} 
            secondaryActionText={loc.id === 'orphanage_room' && tutorialStep === 0 ? 'Skip Intro' : undefined} 
            onSecondary={loc.id === 'orphanage_room' && tutorialStep === 0 ? handleSkipIntro : undefined} 
          />
        );
      })()}
    </>
  );
};

export default ModalManager;
