import { describe, expect, it } from 'vitest';
import { SaveLoadService } from './SaveLoadService';
import { malformedLegacySaveFixture, v12SaveFixture } from './fixtures/legacySaves';

describe('SaveLoadService.migrate', () => {
  it('sanitizes legacy/unknown payload fields safely', () => {
    const migrated = SaveLoadService.migrate(malformedLegacySaveFixture);

    expect(migrated.version).toBe('1.3');
    expect(migrated.saveName).toBe('Imported Save');
    expect(migrated.screenshotUrl).toBeUndefined();
    expect(migrated.character.effects.bleeding).toBe(0);
    expect(migrated.character.effects.bleedMinutesAccumulated).toBe(0);
    expect(migrated.location.currentLocationId).toBeNull();
  });

  it('preserves valid save fields', () => {
    const migrated = SaveLoadService.migrate(v12SaveFixture);

    expect(migrated.timestamp).toBe('2026-04-05T12:00:00.000Z');
    expect(migrated.saveName).toBe('slot-a');
    expect(migrated.screenshotUrl).toBe('/img.png');
    expect(migrated.character.effects.bleeding).toBe(3);
    expect(migrated.character.effects.bleedMinutesAccumulated).toBe(9);
    expect(migrated.location.currentLocationId).toBe('driftwatch');
  });
});
