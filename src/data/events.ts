import { Slide } from '../types';
import eventData from './events.json';

// Type assertion to ensure JSON data matches Slide[] structure
const events = eventData as Record<string, Slide[]>;

export const lukePrologueSlides: Slide[] = events.lukePrologueSlides;
export const wakeupEventSlides: Slide[] = events.wakeupEventSlides;
export const finnDebtIntroSlides: Slide[] = events.finnDebtIntroSlides;
export const breakfastEventSlides: Slide[] = events.breakfastEventSlides;
export const playEventSlidesSarah: Slide[] = events.playEventSlidesSarah;
export const playEventSlidesRobert: Slide[] = events.playEventSlidesRobert;
export const playEventSlidesKyle: Slide[] = events.playEventSlidesKyle;
export const playEventSlidesAlone: Slide[] = events.playEventSlidesAlone;
export const smugglerTrapSlides: Slide[] = events.smugglerTrapSlides;
export const robertCaughtSlides: Slide[] = events.robertCaughtSlides;
export const gameOverSlides: Slide[] = events.gameOverSlides;
export const starvationSlides: Slide[] = events.starvationSlides;
export const timeoutSlides: Slide[] = events.timeoutSlides;
export const rebelRaidIntroSlides: Slide[] = events.rebelRaidIntroSlides;
export const rebelVictorySlides: Slide[] = events.rebelVictorySlides;
export const raidVictorySlides: Slide[] = events.raidVictorySlides;
export const raidSaltyMugIntroSlides: Slide[] = events.raid_salty_mug_intro;
export const elaraDeliverySlides: Slide[] = events.elaraDeliverySlides;
export const berylDeliverySlides: Slide[] = events.berylDeliverySlides;
export const benCheatEventSlides: Slide[] = events.benCheatEventSlides;
export const sellLocketSlides: Slide[] = events.sellLocketSlides;
export const evilEndingSlides: Slide[] = events.evilEndingSlides;
export const hybridEndingSlides: Slide[] = events.hybridEndingSlides;

type ChoiceEventId =
  | 'beryl_letter_pickup'
  | 'apple_tree_event'
  | 'fallen_log_event'
  | 'abandoned_campsite_event'
  | 'hollow_stump_event'
  | 'overgrown_path_event'
  | 'arena_desperate_brawler'
  | 'arena_brawler'
  | 'arena_pit_brawler'
  | 'slum_thug_ambush'
  | 'slum_knife_thug_ambush';

export interface ChoiceEventConfig {
  id: ChoiceEventId;
  title: string;
  imageUrl?: string;
  text: string;
}

export const choiceEvents: Record<ChoiceEventId, ChoiceEventConfig> = {
  beryl_letter_pickup: {
    id: 'beryl_letter_pickup',
    title: 'Crumpled Letter',
    imageUrl: '/assets/items/crumpled_letter.png',
    text: "A crumpled letter lies in the puddle. It's soaked but legible.",
  },
  apple_tree_event: {
    id: 'apple_tree_event',
    title: 'Wild Apple Tree',
    imageUrl: '/assets/events/event_apple_tree.png',
    text:
      'You come across a wild apple tree, its branches heavy with ripe fruit. The apples look tempting, but the bark is rough and the ground uneven beneath your feet.',
  },
  fallen_log_event: {
    id: 'fallen_log_event',
    title: 'Fallen Log',
    imageUrl: '/assets/events/event_fallen_log.png',
    text:
      'You find a large fallen log blocking part of the path. The wood looks solid enough to be chopped into useful firewood.',
  },
  abandoned_campsite_event: {
    id: 'abandoned_campsite_event',
    title: 'Abandoned Campsite',
    imageUrl: '/assets/events/event_abandoned_campsite.png',
    text:
      'You stumble upon a small campsite. The fire has long since gone cold, but a few scattered belongings remain among the damp ashes.',
  },
  hollow_stump_event: {
    id: 'hollow_stump_event',
    title: 'Hollow Stump',
    imageUrl: '/assets/events/event_hollow_stump.png',
    text:
      'In a small clearing sits a moss-covered stump with a dark, hollow center. Something glints faintly inside when the light catches it.',
  },
  overgrown_path_event: {
    id: 'overgrown_path_event',
    title: 'Overgrown Path',
    imageUrl: '/assets/locations/driftwatch_woods_day.png',
    text:
      'A tangle of thick vines and branches chokes what looks like an old path leading deeper into the woods. With the right tool, you could probably clear a way through.',
  },
  arena_desperate_brawler: {
    id: 'arena_desperate_brawler',
    title: 'Rat Pit: Desperate Brawler',
    imageUrl: '/assets/locations/driftwatch_slums_night.png',
    text:
      'A hollow-eyed man steps into the sawdust ring. This is low-stakes work: fists only, no blades, and a few copper changing hands in the dark.',
  },
  arena_brawler: {
    id: 'arena_brawler',
    title: 'Rat Pit: Brawler',
    imageUrl: '/assets/locations/driftwatch_slums_night.png',
    text:
      'A hard-built brawler rolls his shoulders across the ring while the crowd leans in. The purse is better here, and the blows come heavier.',
  },
  arena_pit_brawler: {
    id: 'arena_pit_brawler',
    title: 'Rat Pit: Pit Brawler',
    imageUrl: '/assets/locations/driftwatch_slums_night.png',
    text:
      'The pit champion is all scars and bad intent. The room quiets when he steps up. If you take this fight, you are taking it for real.',
  },
  slum_thug_ambush: {
    id: 'slum_thug_ambush',
    title: 'Slum Ambush',
    imageUrl: '/assets/locations/driftwatch_slums_night.png',
    text:
      'A broad-shouldered thug drifts out of the dark with two more shapes hanging back. He wants easy copper and thinks you look like easy prey.',
  },
  slum_knife_thug_ambush: {
    id: 'slum_knife_thug_ambush',
    title: 'Knife in the Dark',
    imageUrl: '/assets/locations/driftwatch_slums_night.png',
    text:
      'A lean thug steps close enough for you to catch the glint of a knife. His smile says he has done this before, and often.',
  },
};
