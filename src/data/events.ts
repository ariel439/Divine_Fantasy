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
export const raidVictoryWeekPassageSlides: Slide[] = events.raidVictoryWeekPassageSlides;
export const raidSaltyMugIntroSlides: Slide[] = events.raid_salty_mug_intro;
export const elaraDeliverySlides: Slide[] = events.elaraDeliverySlides;
export const berylDeliverySlides: Slide[] = events.berylDeliverySlides;
export const benCheatEventSlides: Slide[] = events.benCheatEventSlides;
export const sellLocketSlides: Slide[] = events.sellLocketSlides;
export const evilEndingSlides: Slide[] = events.evilEndingSlides;
export const evilEndingWeekPassageSlides: Slide[] = events.evilEndingWeekPassageSlides;
export const hybridEndingSlides: Slide[] = events.hybridEndingSlides;
export const whitefangFinnKillSlides: Slide[] = events.whitefangFinnKillSlides;
export const finnPersonalKillSlides: Slide[] = events.finnPersonalKillSlides;
export const whitefangUnreadableWoodsSlides: Slide[] = events.whitefangUnreadableWoodsSlides;
export const whitefangUnreadableBeachSlides: Slide[] = events.whitefangUnreadableBeachSlides;
export const whitefangUnreadableMountainSlides: Slide[] = events.whitefangUnreadableMountainSlides;
export const whitefangWoodsVisionSlides: Slide[] = events.whitefangWoodsVisionSlides;
export const whitefangBeachVisionSlides: Slide[] = events.whitefangBeachVisionSlides;
export const whitefangMountainVisionSlides: Slide[] = events.whitefangMountainVisionSlides;
export const whitefangCaveBlockedSlides: Slide[] = events.whitefangCaveBlockedSlides;
export const whitefangExpeditionBreachSlides: Slide[] = events.whitefangExpeditionBreachSlides;
export const whitefangBindingSlides: Slide[] = events.whitefangBindingSlides;
export const robertaWallRepairSlides: Slide[] = events.robertaWallRepairSlides;
export const robertaKissSlides: Slide[] = events.robertaKissSlides;

export const ronaldWolfHuntSlides: Slide[] = [
  {
    image: '/assets/locations/driftwatch_woods_day.png',
    text:
      "Ronald leads you off the safer trail and into the deeper dark of the woods without wasting a word. Every so often he crouches to study snapped brush, damp earth, or the mark of claws dug into bark, then moves again before you can ask what he found.",
  },
  {
    image: '/assets/events/ronald_wolf_hunt.png',
    text:
      "At last he raises a hand for silence. Ahead, the trees open around a half-ruined den churned raw by paws and old bones. Ronald's voice stays low and flat. 'There. Four of them. Stay steady, and do not chase what breaks first.'",
  },
];

type ChoiceEventId =
  | 'intro_pastime_choice'
  | 'whitefang_binding_choice'
  | 'beryl_letter_pickup'
  | 'forge_crate_note_pickup'
  | 'apple_tree_event'
  | 'pear_tree_event'
  | 'blackberry_bramble_event'
  | 'fallen_log_event'
  | 'abandoned_campsite_event'
  | 'hollow_stump_event'
  | 'fresh_grave_event'
  | 'hidden_cabin_path_event'
  | 'ronald_wolf_hunt_intro'
  | 'ronald_wolf_pup_choice'
  | 'ronald_clear_hidden_path';

export interface ChoiceEventConfig {
  id: ChoiceEventId;
  title: string;
  imageUrl?: string;
  text: string;
}

export const choiceEvents: Record<ChoiceEventId, ChoiceEventConfig> = {
  intro_pastime_choice: {
    id: 'intro_pastime_choice',
    title: 'A Quiet Afternoon',
    imageUrl: '/assets/events/luke_afternoon_choice.png',
    text:
      "The chores are done and Old Leo is occupied for a while. For once, Luke has a little time that belongs only to him. How does he spend it?",
  },
  whitefang_binding_choice: {
    id: 'whitefang_binding_choice',
    title: 'White Fang of Heaven',
    imageUrl: '/assets/items/white_fang_of_heaven.png',
    text:
      "Ren Zhen's shadow breaks apart, but the glaive does not fall still. Its storm-dark hunger drags at Luke's chest like a hand trying to pull open everything in him that was already raw, bitter, and unresolved.",
  },
  beryl_letter_pickup: {
    id: 'beryl_letter_pickup',
    title: 'Crumpled Letter',
    imageUrl: '/assets/items/crumpled_letter.png',
    text: "A crumpled letter lies in the puddle. It's soaked but legible.",
  },
  forge_crate_note_pickup: {
    id: 'forge_crate_note_pickup',
    title: 'Marked Crate Note',
    imageUrl: '/assets/items/crumpled_letter.png',
    text: "Near a stack of cargo at the docks, you spot a grease-stained tally note tucked under a rope spool. The markings tie dusk shipments back to the Salty Mug cellar.",
  },
  apple_tree_event: {
    id: 'apple_tree_event',
    title: 'Wild Apple Tree',
    imageUrl: '/assets/events/event_apple_tree.png',
    text:
      'You come across a wild apple tree, its branches heavy with ripe fruit. The apples look tempting, but the bark is rough and the ground uneven beneath your feet.',
  },
  pear_tree_event: {
    id: 'pear_tree_event',
    title: 'Pear Tree',
    imageUrl: '/assets/events/event_pear_tree.png',
    text:
      'A pear tree leans over the trail, its branches bowed by fruit. The bark is slick with moss and the ground beneath it is soft and uneven.',
  },
  blackberry_bramble_event: {
    id: 'blackberry_bramble_event',
    title: 'Blackberry Bramble',
    imageUrl: '/assets/events/event_blackberry_bramble.png',
    text:
      'A bramble thicket has gone wild at the edge of the path, heavy with blackberries and thick with thorns.',
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
  fresh_grave_event: {
    id: 'fresh_grave_event',
    title: 'Fresh Grave',
    imageUrl: '/assets/events/event_fresh_grave.png',
    text:
      'The earth here looks freshly turned. A rough marker stone leans crookedly over a grave that cannot have been dug very long ago.',
  },
  hidden_cabin_path_event: {
    id: 'hidden_cabin_path_event',
    title: 'Half-Swallowed Path',
    imageUrl: '/assets/events/ronald_wolf_hunt.png',
    text:
      'While pushing deeper through the woods, you notice a narrow trail half-buried beneath roots, briar, and old brush. Something about it feels made, not natural. It looks like it once led somewhere worth hiding.',
  },
  ronald_wolf_hunt_intro: {
    id: 'ronald_wolf_hunt_intro',
    title: 'Wolf Hunt',
    imageUrl: '/assets/events/ronald_wolf_hunt.png',
    text:
      'Ronald leads you deeper beneath the trees without wasting words. Before long he slows, crouches, and points to broken brush and old scat. The pack is near. If you mean to help him, this is where talk ends.',
  },
  ronald_wolf_pup_choice: {
    id: 'ronald_wolf_pup_choice',
    title: 'A Survivor In The Den',
    imageUrl: '/assets/events/ronald_wolf_pup_choice.png',
    text:
      'When the last of the pack falls, a thin whine reaches you from the back of the den. Tucked between roots and old fur lies a wolf pup, all sharp eyes and shaking ribs, too young to understand what just happened.',
  },
  ronald_clear_hidden_path: {
    id: 'ronald_clear_hidden_path',
    title: 'Hidden Path',
    imageUrl: '/assets/events/event_fallen_log.png',
    text:
      'Behind a screen of brush and thorn, the old path is still there if you know where to look. It is half-swallowed by roots, briar, and fallen limbs. Clearing it will take time, strength, and a good axe.',
  },
  };

export const introRobertTrainingSlides: Slide[] = [
  {
    image: '/assets/events/luke_train_robert.png',
    text: "Luke finds Robert behind the lighthouse where the older boy has marked a rough sparring circle in the dirt. Robert makes him keep his feet under him, hands high, shoulders square, correcting every lazy step with the blunt certainty of an older brother who has decided that surviving Driftwatch starts now."
  },
  {
    image: '/assets/events/luke_train_robert.png',
    text: "By the time the light begins to fade, Luke's arms ache and his pride aches more. Robert only claps him once on the shoulder and tells him that taking a hit means nothing if you stay standing after it."
  }
];

export const introKidsHelpingSlides: Slide[] = [
  {
    image: '/assets/events/luke_help_kids.png',
    text: "Instead of chasing his own amusement, Luke ends up surrounded by the younger children, calming one argument, fixing a broken toy, and turning scraps into something that keeps them laughing a little longer."
  },
  {
    image: '/assets/events/luke_help_kids.png',
    text: "By evening the little ones are tired, fed, and quieter than usual. In a house like Leo's Lighthouse, being useful often means making do with almost nothing, and Luke is already learning how."
  }
];

export const introStudyShenhaicSlides: Slide[] = [
  {
    image: '/assets/events/luke_study_shenhaic.png',
    text: "Luke spends the spare hour by lantern light with a weathered page Old Leo once kept from a foreign sailor's bundle, tracing the strange Shenhaic characters again and again until a few sounds finally begin to stick in his memory."
  }
];
