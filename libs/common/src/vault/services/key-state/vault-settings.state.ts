import { VAULT_SETTINGS_DISK, KeyDefinition, UserKeyDefinition } from "../../../platform/state";
import { VaultListSortOrder } from "../../enums/vault-list-sort-order.enum";

export const USER_ENABLE_PASSKEYS = new KeyDefinition<boolean>(
  VAULT_SETTINGS_DISK,
  "enablePasskeys",
  {
    deserializer: (obj) => obj,
  },
);

export const SHOW_CARDS_CURRENT_TAB = new UserKeyDefinition<boolean>(
  VAULT_SETTINGS_DISK,
  "showCardsCurrentTab",
  {
    deserializer: (obj) => obj,
    clearOn: [], // do not clear user settings
  },
);

export const SHOW_IDENTITIES_CURRENT_TAB = new UserKeyDefinition<boolean>(
  VAULT_SETTINGS_DISK,
  "showIdentitiesCurrentTab",
  {
    deserializer: (obj) => obj,
    clearOn: [], // do not clear user settings
  },
);

export const CLICK_ITEMS_AUTOFILL_VAULT_VIEW = new UserKeyDefinition<boolean>(
  VAULT_SETTINGS_DISK,
  "clickItemsToAutofillOnVaultView",
  {
    deserializer: (obj) => obj,
    clearOn: [], // do not clear user settings
  },
);

export const SHOW_AT_RISK_PASSWORD_NOTIFICATIONS = new UserKeyDefinition<boolean>(
  VAULT_SETTINGS_DISK,
  "showAtRiskPasswordNotifications",
  {
    deserializer: (obj) => obj,
    clearOn: [], // do not clear user settings
  },
);

/**
 * Sort order applied to the vault item list in the browser extension popup
 * ("All items", "Favorites" and search results).
 */
export const VAULT_LIST_SORT_ORDER = new UserKeyDefinition<VaultListSortOrder>(
  VAULT_SETTINGS_DISK,
  "vaultListSortOrder",
  {
    deserializer: (obj) => obj,
    clearOn: [], // do not clear user settings
  },
);

/**
 * Sort order applied to the cipher list rendered by the inline autofill menu
 * (the account list shown on top of web page form fields).
 */
export const AUTOFILL_LIST_SORT_ORDER = new UserKeyDefinition<VaultListSortOrder>(
  VAULT_SETTINGS_DISK,
  "autofillListSortOrder",
  {
    deserializer: (obj) => obj,
    clearOn: [], // do not clear user settings
  },
);
