import { UnionOfValues } from "../types/union-of-values";

/**
 * User selectable sort orders for vault item lists.
 *
 * Used by both the browser extension popup vault list and the inline autofill menu list.
 * `LastUsed` preserves the historical behavior (last used date first, then name) and is
 * the default so that existing users see no change.
 */
export const VaultListSortOrder = {
  /** Last used date descending, then name. Historical default. */
  LastUsed: "lastUsed",
  /** Cipher name, ascending. */
  NameAsc: "nameAsc",
  /** Cipher name, descending. */
  NameDesc: "nameDesc",
  /** Login username (falling back to name), ascending. */
  UsernameAsc: "usernameAsc",
  /** Login username (falling back to name), descending. */
  UsernameDesc: "usernameDesc",
} as const;

export type VaultListSortOrder = UnionOfValues<typeof VaultListSortOrder>;

/** All selectable sort orders, in the order they should be presented to the user. */
export const VAULT_LIST_SORT_ORDERS: VaultListSortOrder[] = [
  VaultListSortOrder.LastUsed,
  VaultListSortOrder.NameAsc,
  VaultListSortOrder.NameDesc,
  VaultListSortOrder.UsernameAsc,
  VaultListSortOrder.UsernameDesc,
];

/** @returns `true` when the passed value is a known {@link VaultListSortOrder}. */
export function isVaultListSortOrder(value: unknown): value is VaultListSortOrder {
  return VAULT_LIST_SORT_ORDERS.includes(value as VaultListSortOrder);
}
