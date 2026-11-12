import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { combineLatest, map, Observable, startWith } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { VaultSettingsService } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { CipherViewLikeUtils } from "@bitwarden/common/vault/utils/cipher-view-like-utils";
import {
  ChipActionComponent,
  TypographyModule,
  TooltipDirective,
} from "@bitwarden/components";

import BrowserPopupUtils from "../../../../../platform/browser/browser-popup-utils";
import { VaultPopupAutofillService } from "../../../services/vault-popup-autofill.service";
import { VaultPopupItemsService } from "../../../services/vault-popup-items.service";
import { PopupCipherViewLike } from "../../../views/popup-cipher.view";
import { SimplifiedAutofillInfoComponent } from "../simplified-autofill-info/simplified-autofill-info.component";
import { VaultListItemsContainerComponent } from "../vault-list-items-container/vault-list-items-container.component";

// FIXME(https://bitwarden.atlassian.net/browse/CL-764): Migrate to OnPush
// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
  imports: [
    CommonModule,
    TypographyModule,
    VaultListItemsContainerComponent,
    JslibModule,
    SimplifiedAutofillInfoComponent,
    TooltipDirective,
    ChipActionComponent,
  ],
  selector: "app-autofill-vault-list-items",
  templateUrl: "autofill-vault-list-items.component.html",
})
export class AutofillVaultListItemsComponent {
  /**
   * The list of ciphers that can be used to autofill the current page.
   * @protected
   */
  protected autofillCiphers$: Observable<PopupCipherViewLike[]> =
    this.vaultPopupItemsService.autoFillCiphers$;

  /**
   * Flag indicating whether the refresh button should be shown. Only shown when the popup is within the FF sidebar.
   * @protected
   */
  protected showRefresh: boolean = BrowserPopupUtils.inSidebar(window);

  /** Flag indicating whether the login item should automatically autofill when clicked  */
  protected clickItemsToAutofillVaultView$: Observable<boolean> =
    this.vaultSettingsService.clickItemsToAutofillVaultView$.pipe(
      startWith(true), // Start with true to avoid flashing the fill button on first load
    );

  protected readonly groupByType = toSignal(
    this.vaultPopupItemsService.hasFilterApplied$.pipe(map((hasFilter) => !hasFilter)),
  );

  /**
   * Emits whether the autofill list is currently ordered by the configured sort order.
   * @protected
   */
  protected autofillFollowsVaultSortOrder$: Observable<boolean> =
    this.vaultPopupItemsService.autofillFollowsVaultSortOrder$;

  /**
   * Emits whether the autofill list is currently ordered by the account username.
   * @protected
   */
  protected autofillSortsByUsername$: Observable<boolean> =
    this.vaultPopupItemsService.autofillSortsByUsername$;

  /**
   * Emits whether the configured vault list sort order is the default
   * (most-recently-used). In that case following the setting would be a no-op, so the
   * toggle offers account ordering instead.
   * @protected
   */
  protected configuredSortIsLastUsed$: Observable<boolean> =
    this.vaultPopupItemsService.configuredSortIsLastUsed$;

  /**
   * Emits the chip label key for the current state. The label names the ordering the list
   * is currently using.
   * @protected
   */
  protected sortChipLabelKey$: Observable<string> = combineLatest([
    this.autofillFollowsVaultSortOrder$,
    this.autofillSortsByUsername$,
  ]).pipe(
    map(([followsSetting, sortsByUsername]: [boolean, boolean]) => {
      if (sortsByUsername) {
        return "autofillSortByUsername";
      }
      if (followsSetting) {
        return "autofillSortBySetting";
      }
      return "autofillSortByLastUsed";
    }),
  );

  /**
   * Emits the chip tooltip key for the current state. The tooltip names the ordering the
   * next click switches to.
   * @protected
   */
  protected sortChipTooltipKey$: Observable<string> = combineLatest([
    this.configuredSortIsLastUsed$,
    this.autofillFollowsVaultSortOrder$,
    this.autofillSortsByUsername$,
  ]).pipe(
    map(([configuredIsLastUsed, followsSetting, sortsByUsername]: [boolean, boolean, boolean]) => {
      // Anything other than "currently most-recently-used" switches back to most recent.
      if (sortsByUsername || followsSetting) {
        return "autofillSortByLastUsedTooltip";
      }
      // Currently most-recently-used: the next click follows the setting, or falls back to
      // account ordering when the setting is itself most-recently-used.
      return configuredIsLastUsed
        ? "autofillSortByUsernameTooltip"
        : "autofillSortBySettingTooltip";
    }),
  );

  /**
   * Switches the autofill list between the configured sort order and most-recently-used.
   * @protected
   */
  protected toggleAutofillSortOrder() {
    this.vaultPopupItemsService.toggleAutofillSortOrder();
  }

  /**
   * Observable that determines whether the empty autofill tip should be shown.
   * The tip is shown when there are no login ciphers to autofill, no filter is applied, and autofill is allowed in
   * the current context (e.g. not in a popout).
   * @protected
   */
  protected showEmptyAutofillTip$: Observable<boolean> = combineLatest([
    this.vaultPopupItemsService.hasFilterApplied$,
    this.autofillCiphers$,
    this.vaultPopupAutofillService.autofillAllowed$,
  ]).pipe(
    map(
      ([hasFilter, ciphers, canAutoFill]) =>
        !hasFilter &&
        canAutoFill &&
        ciphers.filter((c) => CipherViewLikeUtils.getType(c) == CipherType.Login).length === 0,
    ),
  );

  /**
   * Flag indicating that the current tab location is blocked
   */
  currentURIIsBlocked$: Observable<boolean> =
    this.vaultPopupAutofillService.currentTabIsOnBlocklist$;

  constructor(
    private vaultPopupItemsService: VaultPopupItemsService,
    private vaultPopupAutofillService: VaultPopupAutofillService,
    private vaultSettingsService: VaultSettingsService,
  ) {}

  /**
   * Refreshes the current tab to re-populate the autofill ciphers.
   * @protected
   */
  protected refreshCurrentTab() {
    this.vaultPopupAutofillService.refreshCurrentTab();
  }
}
