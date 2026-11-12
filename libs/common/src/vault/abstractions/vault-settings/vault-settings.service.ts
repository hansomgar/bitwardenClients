import { Observable } from "rxjs";

import { VaultListSortOrder } from "../../enums/vault-list-sort-order.enum";
/**
 * Service for managing vault settings.
 */
export abstract class VaultSettingsService {
  /**
   * An observable monitoring the state of the enable passkeys setting.
   * The observable updates when the setting changes.
   */
  abstract enablePasskeys$: Observable<boolean>;
  /**
   * An observable monitoring the state of the show cards on the current tab.
   */
  abstract showCardsCurrentTab$: Observable<boolean>;
  /**
   * An observable monitoring the state of the show identities on the current tab.
   */
  abstract showIdentitiesCurrentTab$: Observable<boolean>;
  /**
   * An observable monitoring the state of the click items on the Vault view
   * for Autofill suggestions.
   */
  abstract clickItemsToAutofillVaultView$: Observable<boolean>;
  /**
   * An observable monitoring the state of the visibility of at-risk password
   * notifications.
   *
   * This setting is only applicable for risk insights for premium users. Ciphers
   * that are marked as at-risk from an organization will always been shown
   * to users.
   */
  abstract showAtRiskPasswordNotifications$: Observable<boolean>;

  /**
   * An observable monitoring the sort order of the vault item list in the
   * browser extension popup ("All items", "Favorites" and search results).
   */
  abstract vaultListSortOrder$: Observable<VaultListSortOrder>;

  /**
   * An observable monitoring the sort order of the cipher list rendered by the
   * inline autofill menu (the account list shown on top of page form fields).
   */
  abstract autofillListSortOrder$: Observable<VaultListSortOrder>;

  /**
   * Saves the enable passkeys setting to disk.
   * @param value The new value for the passkeys setting.
   */
  abstract setEnablePasskeys(value: boolean): Promise<void>;
  /**
   * Saves the show cards on tab page setting to disk.
   * @param value The new value for the show cards on tab page setting.
   */
  abstract setShowCardsCurrentTab(value: boolean): Promise<void>;
  /**
   * Saves the show identities on tab page setting to disk.
   * @param value The new value for the show identities on tab page setting.
   */
  abstract setShowIdentitiesCurrentTab(value: boolean): Promise<void>;
  /**
   * Saves the click items on vault View for Autofill suggestions to disk.
   * @param value The new value for the click items on vault View for
   * Autofill suggestions setting.
   */
  abstract setClickItemsToAutofillVaultView(value: boolean): Promise<void>;
  /**
   * Saves the visibility state of at-risk password notifications to disk.
   * @param value The new value for the visibility of at-risk password notifications.
   */
  abstract setShowAtRiskPasswordNotifications(value: boolean): Promise<void>;

  /**
   * Saves the sort order of the vault item list in the browser extension popup to disk.
   * @param value The new sort order.
   */
  abstract setVaultListSortOrder(value: VaultListSortOrder): Promise<void>;

  /**
   * Saves the sort order of the inline autofill menu cipher list to disk.
   * @param value The new sort order.
   */
  abstract setAutofillListSortOrder(value: VaultListSortOrder): Promise<void>;
}
