import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTranslator, detectLocale } from '.';

describe('localization', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prefers the Dynamics user language', () => {
    Object.defineProperty(window, 'Xrm', {
      configurable: true,
      value: {
        Utility: {
          getGlobalContext: () => ({ userSettings: { languageId: 1031 } }),
        },
      },
    });

    expect(detectLocale()).toBe('de');
    expect(createTranslator('de')('refresh')).toBe('Aktualisieren');
  });
});
