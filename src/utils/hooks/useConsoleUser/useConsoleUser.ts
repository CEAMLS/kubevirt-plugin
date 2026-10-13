import { useSelector } from 'react-redux';

import { isEmpty } from '@kubevirt-utils/utils/utils';

/**
 * The signed-in user as the console resolved it from the bearer token
 * (an authentication.k8s.io SelfSubjectReview), kept in the console's redux
 * store under `sdkCore.user`.
 *
 * The console fills this on every cluster. The user.openshift.io API
 * (`users/~`) only exists with the OpenShift OAuth server; a cluster that
 * authenticates with an external OIDC provider does not serve it.
 */
export type ConsoleUserInfo = {
  extra?: Record<string, string[]>;
  groups?: string[];
  uid?: string;
  username?: string;
};

type ConsoleState = { sdkCore?: { user?: ConsoleUserInfo } };

const EMPTY_USER: ConsoleUserInfo = {};

const selectConsoleUser = (state: ConsoleState): ConsoleUserInfo | undefined =>
  state?.sdkCore?.user;

const useConsoleUser = (): [user: ConsoleUserInfo, loaded: boolean] => {
  const user = useSelector(selectConsoleUser) ?? EMPTY_USER;

  return [user, !isEmpty(user?.username)];
};

export default useConsoleUser;
