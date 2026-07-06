import { UserKeyDefinition, UI_LOCK_SETTINGS_DISK } from "../../platform/state";

import { UiLockTimeout, UiLockTimeoutStringType } from "./ui-lock.types";

export const UI_LOCK_TIMEOUT = new UserKeyDefinition<UiLockTimeout>(
  UI_LOCK_SETTINGS_DISK,
  "uiLockTimeout",
  {
    deserializer: (value: UiLockTimeout) => {
      if (value === undefined || value === null) {
        return UiLockTimeoutStringType.Never;
      }
      return value;
    },
    clearOn: [],
  },
);