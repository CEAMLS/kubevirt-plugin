import { ConsoleUserInfo } from './useConsoleUser';

export const KUBE_ADMIN_USERNAME = 'kube:admin';
export const KUBE_ADMIN_CONSOLE_IDENTIFIER = 'kubeadmin';

/**
 * A ConfigMap data key may only hold `-`, `_`, `.` and alphanumerics.
 * @param value - the raw value, for example a username
 * @returns the value with every other run of characters replaced by `-`
 */
export const sanitizeConfigMapKey = (value?: string): string | undefined =>
  value?.replace(/[^-._a-zA-Z0-9]+/g, '-');

/**
 * Key of the user's entry in the kubevirt-user-settings ConfigMap: the uid
 * when the user has one (an OAuth User object), else the sanitized username.
 * These are the same keys the former `users/~` lookup produced, so settings
 * saved before this change are still found.
 * @param user - the signed-in user from the console store
 * @returns the ConfigMap data key, or undefined while the user is unknown
 */
export const getKubevirtUserSettingsKey = (user?: ConsoleUserInfo): string | undefined =>
  user?.uid || sanitizeConfigMapKey(user?.username);

const sha256Hex = async (text: string): Promise<string> => {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Identifier the console puts in the name of its own user-settings ConfigMap
 * (`user-settings-<identifier>` in openshift-console-user-settings). Mirrors
 * the console's pkg/usersettings/helpers.go: `kubeadmin` for kube:admin
 * without a uid, else the hex sha256 of the username.
 * @param user - the signed-in user from the console store
 * @returns the identifier, or undefined while the user is unknown
 */
export const getConsoleUserSettingsIdentifier = async (
  user?: ConsoleUserInfo,
): Promise<string | undefined> => {
  if (!user?.username) return undefined;
  if (user.username === KUBE_ADMIN_USERNAME && !user.uid) return KUBE_ADMIN_CONSOLE_IDENTIFIER;

  return sha256Hex(user.username);
};
