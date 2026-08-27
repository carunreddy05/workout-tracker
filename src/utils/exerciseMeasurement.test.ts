import { describe, it, expect } from 'vitest';
import { getMeasurementType, isVolumeEligible, calcSetVolume, isBodyweightOnly } from './exerciseMeasurement';

describe('exercise measurement types', () => {
  it('classifies known bodyweight exercises as bodyweight', () => {
    for (const name of ['Push Ups', 'Dips', 'Nordic Curl', 'Ab Wheel Rollout', 'Decline Sit Ups', 'Hanging Knee Raise']) {
      expect(getMeasurementType(name)).toBe('bodyweight');
      expect(isBodyweightOnly(name)).toBe(true);
    }
  });

  it('classifies a typical weighted exercise as weighted', () => {
    expect(getMeasurementType('Barbell Bench Press')).toBe('weighted');
    expect(isBodyweightOnly('Barbell Bench Press')).toBe(false);
  });

  it('defaults an unknown exercise name to weighted (safe default for legacy/renamed data)', () => {
    expect(getMeasurementType('Some Exercise That Was Later Renamed')).toBe('weighted');
  });
});

describe('calcSetVolume', () => {
  it('a bodyweight set with weight 0 contributes zero volume, not a display bug', () => {
    expect(calcSetVolume('Push Ups', 0, 15)).toBe(0);
  });

  it('a weighted set contributes weight * reps', () => {
    expect(calcSetVolume('Barbell Bench Press', 60, 8)).toBe(480);
  });

  it('isVolumeEligible is false for bodyweight, true for weighted', () => {
    expect(isVolumeEligible('Push Ups')).toBe(false);
    expect(isVolumeEligible('Barbell Bench Press')).toBe(true);
  });
});
