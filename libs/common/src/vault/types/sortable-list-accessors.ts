/**
 * Describes how to read the sortable keys off an arbitrary list item.
 *
 * Used by {@link CipherService.getSortingFunctionForOrder} so that surfaces which do not
 * hold real cipher objects (such as the stripped down data sent to the inline autofill
 * menu) can reuse the exact same ordering logic as the vault list.
 */
export type SortableListAccessors<T> = {
  /** @returns The display name of the item. */
  getName: (item: T) => string | null | undefined;
  /** @returns The account username of the item, if it has one. */
  getUsername: (item: T) => string | null | undefined;
};
