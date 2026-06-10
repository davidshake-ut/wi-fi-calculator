import { describe, it, expect } from 'vitest';
import { hexToRgb, lightTint, readableText, readableTextHex } from '../lib/colors';

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#0052A5')).toEqual([0, 82, 165]);
  });
  it('parses 3-digit shorthand', () => {
    expect(hexToRgb('#06c')).toEqual([0, 102, 204]);
  });
  it('falls back on invalid input', () => {
    expect(hexToRgb('nope')).toEqual([37, 99, 235]);
    expect(hexToRgb(undefined, [1, 2, 3])).toEqual([1, 2, 3]);
  });
});

describe('lightTint', () => {
  it('mixes toward white', () => {
    expect(lightTint([0, 0, 0], 1)).toEqual([255, 255, 255]);
    expect(lightTint([0, 0, 0], 0)).toEqual([0, 0, 0]);
    expect(lightTint([100, 100, 100], 0.5)).toEqual([178, 178, 178]);
  });
});

describe('readableText', () => {
  it('uses white text on dark colors', () => {
    expect(readableText([37, 99, 235])).toEqual([255, 255, 255]); // blue-600
    expect(readableTextHex('#0f172a')).toBe('#ffffff');
  });
  it('uses dark text on light colors', () => {
    expect(readableText([253, 224, 71])).toEqual([15, 23, 42]); // yellow-300
    expect(readableTextHex('#a7f3d0')).toBe('#0f172a'); // light green
    expect(readableTextHex('#ffffff')).toBe('#0f172a');
  });
});
