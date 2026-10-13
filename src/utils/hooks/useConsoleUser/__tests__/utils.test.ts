import { webcrypto } from 'crypto';

import {
  getConsoleUserSettingsIdentifier,
  getKubevirtUserSettingsKey,
  sanitizeConfigMapKey,
} from '../utils';

describe('useConsoleUser utils', () => {
  beforeAll(() => {
    if (!globalThis.crypto?.subtle) {
      Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
    }
  });

  it('sanitizes a username into a valid ConfigMap key', () => {
    expect(sanitizeConfigMapKey('kube:admin')).toBe('kube-admin');
    expect(sanitizeConfigMapKey('jane.doe@example.edu')).toBe('jane.doe-example.edu');
    expect(sanitizeConfigMapKey(undefined)).toBeUndefined();
  });

  it('keys kubevirt user settings by uid, else by sanitized username', () => {
    expect(getKubevirtUserSettingsKey({ uid: 'abc-123', username: 'jane' })).toBe('abc-123');
    expect(getKubevirtUserSettingsKey({ username: 'jane.doe@example.edu' })).toBe(
      'jane.doe-example.edu',
    );
    expect(getKubevirtUserSettingsKey({})).toBeUndefined();
    expect(getKubevirtUserSettingsKey(undefined)).toBeUndefined();
  });

  it('names the console user-settings ConfigMap like the console does', async () => {
    expect(await getConsoleUserSettingsIdentifier({ username: 'kube:admin' })).toBe('kubeadmin');
    // kube:admin with a uid is an ordinary user to the console
    expect(await getConsoleUserSettingsIdentifier({ uid: 'x', username: 'kube:admin' })).toMatch(
      /^[0-9a-f]{64}$/,
    );
    // sha256("jane.doe@example.edu")
    expect(await getConsoleUserSettingsIdentifier({ username: 'jane.doe@example.edu' })).toBe(
      '350d37d1c70a223e1f8539b398ab72a871f3d167b1df94de2f0b38213c6cd03f',
    );
    expect(await getConsoleUserSettingsIdentifier({})).toBeUndefined();
  });
});
