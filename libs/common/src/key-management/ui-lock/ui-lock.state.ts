import { UserKeyDefinition, UI_LOCK_SETTINGS_DISK } from "../../platform/state";

export const UI_LOCK_TIMEOUT = new UserKeyDefinition<number>(
  UI_LOCK_SETTINGS_DISK,
  "uiLockTimeout",
  {
    deserializer: (value: number) => value ?? 5,
    clearOn: [],
  },
);