export const malformedLegacySaveFixture = {
  version: '1.0',
  timestamp: 42,
  saveName: null,
  screenshotUrl: 100,
  character: {
    effects: {
      bleeding: 'bad',
      bleedMinutesAccumulated: null,
    },
  },
  location: {
    currentLocationId: 999,
  },
};

export const v12SaveFixture = {
  version: '1.2',
  timestamp: '2026-04-05T12:00:00.000Z',
  saveName: 'slot-a',
  screenshotUrl: '/img.png',
  character: { effects: { bleeding: 3, bleedMinutesAccumulated: 9 } },
  location: { currentLocationId: 'driftwatch' },
  diary: {},
  inventory: {},
  journal: {},
  skills: {},
  worldTime: {},
  worldState: {},
  companion: {},
  jobs: {},
  rooms: {},
  shops: {},
};

