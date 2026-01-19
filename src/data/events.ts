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

type ChoiceEventId =
  | 'beryl_letter_pickup'
  | 'apple_tree_event'
  | 'rescue_wolf_choice'
  | 'fallen_log_event'
  | 'abandoned_campsite_event'
  | 'hollow_stump_event'
  | 'overgrown_path_event';

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
  rescue_wolf_choice: {
    id: 'rescue_wolf_choice',
    title: 'Whimpering Sound',
    imageUrl: '/assets/events/rescue_wolf.png',
    text:
      'Following the soft whimpers, you find a small wolf puppy huddled beneath a fallen tree. Its fur is matted from mud and rain, and it watches you with wide, uncertain eyes.',
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
};
