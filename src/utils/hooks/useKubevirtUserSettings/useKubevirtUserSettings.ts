import { useEffect, useState } from 'react';

import { ConfigMapModel, modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import { IoK8sApiCoreV1ConfigMap } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import useConsoleUser from '@kubevirt-utils/hooks/useConsoleUser/useConsoleUser';
import { getKubevirtUserSettingsKey } from '@kubevirt-utils/hooks/useConsoleUser/utils';
import { operatorNamespaceSignal } from '@kubevirt-utils/store/operatorNamespace';
import { isEmpty } from '@kubevirt-utils/utils/utils';
import useK8sWatchData from '@multicluster/hooks/useK8sWatchData';

import { KUBEVIRT_USER_SETTINGS_CONFIG_MAP_NAME } from './utils/const';
import { UseKubevirtUserSettings } from './utils/types';
import { UserSettingsState } from './utils/userSettingsInitialState';
import { parseNestedJSON, patchUserConfigMap } from './utils/utils';

const useKubevirtUserSettings: UseKubevirtUserSettings = (key, cluster) => {
  const [error, setError] = useState<Error>();
  const [userSettings, setUserSettings] = useState<UserSettingsState>();
  const [loading, setLoading] = useState<boolean>(false);
  const [settingsInitialized, setSettingsInitialized] = useState<boolean>(false);
  const operatorNamespace = operatorNamespaceSignal.value;

  // The console resolves the user from the token on every cluster; the
  // user.openshift.io `users/~` object does not exist with external OIDC.
  const [user, loadedUser] = useConsoleUser();

  const userName = getKubevirtUserSettingsKey(user);

  const [userConfigMap, loadedConfigMap, configMapError] = useK8sWatchData<IoK8sApiCoreV1ConfigMap>(
    operatorNamespace &&
      userName && {
        cluster,
        groupVersionKind: modelToGroupVersionKind(ConfigMapModel),
        name: KUBEVIRT_USER_SETTINGS_CONFIG_MAP_NAME,
        namespace: operatorNamespace,
      },
  );

  const loadedCM = (loadedConfigMap || !isEmpty(configMapError)) && !isEmpty(operatorNamespace);
  const loadedUsr = loadedUser;

  useEffect(() => {
    if (!loadedCM || !loadedUsr) return;

    if (!isEmpty(userConfigMap) && userName) {
      setUserSettings(
        (<unknown>parseNestedJSON(userConfigMap?.data?.[userName]) || {}) as UserSettingsState,
      );
    }

    setSettingsInitialized(true);
  }, [userConfigMap, userName, loadedCM, loadedUsr]);

  const pushUserSettingsChanges = async (data, resolve, reject) => {
    setLoading(true);

    try {
      await patchUserConfigMap(userConfigMap, userName, data, cluster);
      resolve(key ? data[key] : data);
    } catch (apiError) {
      setError(apiError);
      reject(apiError);
    }

    setLoading(false);
  };

  const updateUserSetting = (val: any) => {
    return new Promise((resolve, reject) => {
      setUserSettings((prevUserSettings) => {
        const data = key ? { ...prevUserSettings, [key]: val } : val;

        pushUserSettingsChanges(data, resolve, reject);

        return data;
      });
    });
  };

  return [
    key ? userSettings?.[key] : userSettings,
    userSettings && updateUserSetting,
    !loading && settingsInitialized,
    error || configMapError,
  ];
};

export default useKubevirtUserSettings;
