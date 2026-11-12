import { inject, Injectable, NgZone } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  merge,
  MonoTypeOperatorFunction,
  Observable,
  of,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  tap,
  withLatestFrom,
} from "rxjs";

import { CollectionService } from "@bitwarden/admin-console/common";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
import { SyncService } from "@bitwarden/common/platform/sync";
import { CollectionId, OrganizationId, UserId } from "@bitwarden/common/types/guid";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { SearchService } from "@bitwarden/common/vault/abstractions/search.service";
import { VaultSettingsService } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { VaultListSortOrder } from "@bitwarden/common/vault/enums/vault-list-sort-order.enum";
import { RestrictedItemTypesService } from "@bitwarden/common/vault/services/restricted-item-types.service";
import {
  CipherViewLike,
  CipherViewLikeUtils,
} from "@bitwarden/common/vault/utils/cipher-view-like-utils";

import { runInsideAngular } from "../../../platform/browser/run-inside-angular.operator";
import { PopupViewCacheService } from "../../../platform/popup/view-cache/popup-view-cache.service";
import { waitUntil } from "../../util";
import { PopupCipherViewLike } from "../views/popup-cipher.view";

import { VaultPopupAutofillService } from "./vault-popup-autofill.service";
import { MY_VAULT_ID, VaultPopupListFiltersService } from "./vault-popup-list-filters.service";

/**
 * Service for managing the various item lists on the new Vault tab in the browser popup.
 */
@Injectable({
  providedIn: "root",
})
export class VaultPopupItemsService {
  private cachedSearchText = inject(PopupViewCacheService).signal<string>({
    key: "vault-search-text",
    initialValue: "",
    persistNavigation: true,
  });

  readonly searchText$ = toObservable(this.cachedSearchText);

  /**
   * Subject that emits whenever new ciphers are being processed/filtered.
   * @private
   */
  private _ciphersLoading$ = new Subject<void>();

  /**
   * Whether the autofill suggestions section should follow the user's vault list sort
   * order instead of the built-in most-recently-used ordering.
   *
   * Deliberately in-memory and reset to `false` on every popup open: the official
   * behavior is most-recently-used first, and this toggle only exists so users can take a
   * one-off look at the list in their configured order.
   * @private
   */
  private readonly _autofillFollowsVaultSortOrder$ = new BehaviorSubject<boolean>(false);

  /**
   * Whether the autofill suggestions section should be sorted by account username,
   * ascending.
   *
   * Only meaningful when the configured vault list sort order is most-recently-used: in
   * that case "follow the setting" would be indistinguishable from "most recent", so the
   * toggle offers account ordering instead of being a no-op.
   * @private
   */
  private readonly _autofillSortsByUsername$ = new BehaviorSubject<boolean>(false);

  /**
   * Emits whether the autofill suggestions section is currently ordered by the vault list
   * sort order rather than by most recently used.
   */
  readonly autofillFollowsVaultSortOrder$: Observable<boolean> =
    this._autofillFollowsVaultSortOrder$.asObservable();

  /**
   * Emits whether the autofill suggestions section is currently ordered by account
   * username instead of by most recently used.
   */
  readonly autofillSortsByUsername$: Observable<boolean> =
    this._autofillSortsByUsername$.asObservable();

  /**
   * Emits `true` when the configured vault list sort order is most-recently-used, i.e. when
   * the toggle has to fall back to account ordering instead of following the setting.
   */
  readonly configuredSortIsLastUsed$: Observable<boolean> =
    this.vaultSettingsService.vaultListSortOrder$.pipe(
      map((sortOrder) => sortOrder === VaultListSortOrder.LastUsed),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  /**
   * Last configured sort order observed from state. Kept in sync by a subscription in the
   * constructor so {@link toggleAutofillSortOrder} can decide synchronously which flag to
   * flip. Seeded with the default so an early toggle stays deterministic.
   */
  private _latestConfiguredSortOrder: VaultListSortOrder = VaultListSortOrder.LastUsed;

  private activeUserId$ = this.accountService.activeAccount$.pipe(
    map((a) => a?.id),
    filter((userId): userId is UserId => userId !== null),
  );

  private organizations$ = this.activeUserId$.pipe(
    switchMap((userId) => this.organizationService.organizations$(userId)),
  );

  private decryptedCollections$ = this.activeUserId$.pipe(
    switchMap((userId) => this.collectionService.decryptedCollections$(userId)),
  );

  /**
   * Observable that contains the list of other cipher types that should be shown
   * in the autofill section of the Vault tab. Depends on vault settings.
   * @private
   */
  private _otherAutoFillTypes$: Observable<CipherType[]> = combineLatest([
    this.vaultSettingsService.showCardsCurrentTab$,
    this.vaultSettingsService.showIdentitiesCurrentTab$,
    this.vaultPopupAutofillService.nonLoginCipherTypesOnPage$,
  ]).pipe(
    map(([showCardsSettingEnabled, showIdentitiesSettingEnabled, nonLoginCipherTypesOnPage]) => {
      const showCards = showCardsSettingEnabled || nonLoginCipherTypesOnPage[CipherType.Card];
      const showIdentities =
        showIdentitiesSettingEnabled || nonLoginCipherTypesOnPage[CipherType.Identity];

      return [
        ...(showCards ? [CipherType.Card] : []),
        ...(showIdentities ? [CipherType.Identity] : []),
      ];
    }),
  );

  /**
   * Observable that contains the list of all decrypted ciphers.
   * @private
   */
  private _allDecryptedCiphers$: Observable<CipherViewLike[]> =
    this.accountService.activeAccount$.pipe(
      map((a) => a?.id),
      filter((userId): userId is UserId => userId != null),
      switchMap((userId) =>
        merge(this.cipherService.ciphers$(userId), this.cipherService.localData$(userId)).pipe(
          runInsideAngular(this.ngZone),
          tap(() => this._ciphersLoading$.next()),
          waitUntilSync(this.syncService),
          switchMap(() =>
            combineLatest([
              this.cipherService
                .cipherListViews$(userId)
                .pipe(filter((ciphers) => ciphers != null)),
              this.cipherService.failedToDecryptCiphers$(userId).pipe(startWith([])),
              this.restrictedItemTypesService.restricted$,
            ]),
          ),
          map(([ciphers, failedToDecryptCiphers, restrictions]) => {
            const allCiphers = [...(failedToDecryptCiphers || []), ...ciphers];

            return allCiphers.filter(
              (cipher) => !this.restrictedItemTypesService.isCipherRestricted(cipher, restrictions),
            );
          }),
        ),
      ),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );

  private _activeCipherList$: Observable<PopupCipherViewLike[]> = this._allDecryptedCiphers$.pipe(
    switchMap((ciphers) =>
      combineLatest([this.organizations$, this.decryptedCollections$]).pipe(
        map(([organizations, collections]) => {
          const orgMap = Object.fromEntries(organizations.map((org) => [org.id, org]));
          const collectionMap = Object.fromEntries(collections.map((col) => [col.id, col]));
          return ciphers
            .filter((c) => !CipherViewLikeUtils.isDeleted(c) && !CipherViewLikeUtils.isArchived(c))

            .map((cipher) => {
              (cipher as PopupCipherViewLike).collections = cipher.collectionIds?.map(
                (colId) => collectionMap[colId as CollectionId],
              );
              (cipher as PopupCipherViewLike).organization =
                orgMap[cipher.organizationId as OrganizationId];
              return cipher;
            });
        }),
      ),
    ),
  );

  /**
   * Observable that indicates whether there is search text present that is searchable.
   * @private
   */
  private _hasSearchText = this.searchText$.pipe(
    switchMap((searchText) => {
      return this.searchService.isSearchable(searchText);
    }),
  );

  private _filteredCipherList$: Observable<PopupCipherViewLike[]> = combineLatest([
    this._activeCipherList$,
    this.searchText$,
    this.vaultPopupListFiltersService.filterFunction$,
    getUserId(this.accountService.activeAccount$),
    this.vaultSettingsService.vaultListSortOrder$,
  ]).pipe(
    map(
      ([ciphers, searchText, filterFunction, userId, sortOrder]) =>
        [filterFunction(ciphers), searchText, userId, sortOrder] as const,
    ),
    switchMap(async ([ciphers, searchText, userId, sortOrder]) => {
      const results = await this.searchService.searchCiphers(userId, null, searchText, ciphers);

      // Sorting happens after search so that results keep the user selected order. The
      // autofill suggestions section re-sorts its own list, so it is intentionally not
      // affected by this setting.
      return results.sort(this.cipherService.getSortingFunctionForOrder(sortOrder));
    }),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  /**
   * List of ciphers that are filtered using filters and search.
   * Includes favorite ciphers and ciphers currently suggested for autofill.
   * Ciphers are sorted by name.
   */
  filteredCiphers$: Observable<PopupCipherViewLike[]> = this._filteredCipherList$.pipe(
    shareReplay({ refCount: false, bufferSize: 1 }),
  );

  /**
   * List of ciphers that can be used for autofill on the current tab. Includes cards and/or identities
   * if enabled in the vault settings.
   *
   * Ciphers are always grouped by type (Login, then Card, then Identity) so the section keeps its
   * structure. Within each type group the ciphers are ordered by most-recently-used, which is the
   * official behavior, unless the user temporarily opted into the configured sort order via
   * {@link toggleAutofillSortOrder}.
   *
   * See {@link refreshCurrentTab} to trigger re-evaluation of the current tab.
   */
  autoFillCiphers$: Observable<PopupCipherViewLike[]> = combineLatest([
    this._filteredCipherList$,
    this._otherAutoFillTypes$,
    this.vaultPopupAutofillService.currentAutofillTab$,
    this.vaultSettingsService.vaultListSortOrder$,
    this._autofillFollowsVaultSortOrder$,
    this._autofillSortsByUsername$,
  ]).pipe(
    switchMap(
      async ([
        ciphers,
        otherTypes,
        tab,
        sortOrder,
        followsVaultSortOrder,
        sortsByUsername,
      ]) => {
        if (!tab || !tab.url) {
          return [];
        }

        const autofillCiphers = await this.cipherService.filterCiphersForUrl(
          ciphers,
          tab.url,
          otherTypes,
        );

        // Three states, in priority order:
        //  1. Explicit account ordering — used when the configured order is the default, so
        //     the toggle can still produce a visible change.
        //  2. Follow the configured vault list sort order.
        //  3. Fall back to the official most-recently-used ordering.
        //
        // No `sortOrder !== LastUsed` short-circuit here: it used to make the toggle a no-op
        // for every user who left the setting at its default value.
        let effectiveSortOrder: VaultListSortOrder = VaultListSortOrder.LastUsed;
        if (sortsByUsername) {
          effectiveSortOrder = VaultListSortOrder.UsernameAsc;
        } else if (followsVaultSortOrder) {
          effectiveSortOrder = sortOrder;
        }

        return autofillCiphers.sort(this.sortCiphersForAutofill(effectiveSortOrder));
      },
    ),
    shareReplay({ refCount: false, bufferSize: 1 }),
  );

  /**
   * List of favorite ciphers that are not currently suggested for autofill.
   * Ciphers are sorted by name.
   */
  favoriteCiphers$: Observable<PopupCipherViewLike[]> = this.autoFillCiphers$.pipe(
    withLatestFrom(this._filteredCipherList$),
    map(([autoFillCiphers, ciphers]) =>
      ciphers.filter((cipher) => cipher.favorite && !autoFillCiphers.includes(cipher)),
    ),
    shareReplay({ refCount: false, bufferSize: 1 }),
  );

  /**
   * Observable that indicates whether the service is currently loading ciphers.
   */
  loading$: Observable<boolean> = merge(
    this._ciphersLoading$.pipe(map(() => true)),
    this.favoriteCiphers$.pipe(map(() => false)),
  ).pipe(startWith(true), distinctUntilChanged(), shareReplay({ refCount: false, bufferSize: 1 }));

  /** Observable that indicates whether there is search text present.
   */
  hasSearchText$: Observable<boolean> = this._hasSearchText.pipe(
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /**
   * Observable that indicates whether a filter or search text is currently applied to the ciphers.
   */
  hasFilterApplied$ = combineLatest([
    this._hasSearchText,
    this.vaultPopupListFiltersService.filters$,
  ]).pipe(
    map(([hasSearchText, filters]) => {
      return hasSearchText || Object.values(filters).some((filter) => filter !== null);
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /**
   * Observable that indicates whether the user's vault is empty.
   */
  emptyVault$: Observable<boolean> = this._activeCipherList$.pipe(
    map((ciphers) => !ciphers.length),
  );

  /**
   * Observable that contains the count of ciphers in the active filtered list.
   */
  cipherCount$: Observable<number> = this._activeCipherList$.pipe(map((ciphers) => ciphers.length));

  /**
   * Observable that indicates whether there are no ciphers to show with the current filter.
   */
  noFilteredResults$: Observable<boolean> = this._filteredCipherList$.pipe(
    map((ciphers) => !ciphers.length),
  );

  /** Observable that indicates when the user should see the deactivated org state */
  showDeactivatedOrg$: Observable<boolean> = combineLatest([
    this.vaultPopupListFiltersService.filters$.pipe(distinctUntilKeyChanged("organization")),
    this.organizations$,
  ]).pipe(
    map(([filters, orgs]) => {
      if (!filters.organization || filters.organization.id === MY_VAULT_ID) {
        return false;
      }

      const org = orgs.find((o) => o.id === filters?.organization?.id);
      return org ? !org.enabled : false;
    }),
  );

  /**
   * Observable that contains the list of ciphers that have been deleted.
   */
  deletedCiphers$: Observable<PopupCipherViewLike[]> = this._allDecryptedCiphers$.pipe(
    switchMap((ciphers) =>
      combineLatest([this.organizations$, this.decryptedCollections$]).pipe(
        map(([organizations, collections]) => {
          const orgMap = Object.fromEntries(organizations.map((org) => [org.id, org]));
          const collectionMap = Object.fromEntries(collections.map((col) => [col.id, col]));
          return ciphers
            .filter((c) => CipherViewLikeUtils.isDeleted(c))
            .map(
              (cipher) =>
                ({
                  ...cipher,
                  collections: cipher.collectionIds?.map(
                    (colId) => collectionMap[colId as CollectionId],
                  ),
                  organization: orgMap[cipher.organizationId as OrganizationId],
                }) as PopupCipherViewLike,
            );
        }),
      ),
    ),
    shareReplay({ refCount: false, bufferSize: 1 }),
  );

  constructor(
    private cipherService: CipherService,
    private vaultSettingsService: VaultSettingsService,
    private vaultPopupListFiltersService: VaultPopupListFiltersService,
    private organizationService: OrganizationService,
    private searchService: SearchService,
    private collectionService: CollectionService,
    private vaultPopupAutofillService: VaultPopupAutofillService,
    private syncService: SyncService,
    private accountService: AccountService,
    private ngZone: NgZone,
    private restrictedItemTypesService: RestrictedItemTypesService,
  ) {
    // Track the configured order so `toggleAutofillSortOrder` can pick the right flag
    // synchronously. `takeUntilDestroyed` is not needed: the service lives as long as the
    // popup, and `refCount: true` keeps this from pinning the state stream open.
    this.vaultSettingsService.vaultListSortOrder$.subscribe((sortOrder) => {
      this._latestConfiguredSortOrder = sortOrder;
    });
  }

  applyFilter(newSearchText: string) {
    this.cachedSearchText.set(newSearchText);
  }

  /**
   * Flips the autofill suggestions section between two orderings.
   *
   * When the configured vault list sort order is something meaningful, the toggle switches
   * between that order and most-recently-used. When the configured order is the default
   * (most-recently-used), following the setting would be a no-op, so the toggle switches
   * between account ordering and most-recently-used instead.
   *
   * The two flags are mutually exclusive so the rendered list always has a single,
   * predictable ordering.
   */
  toggleAutofillSortOrder() {
    if (this._latestConfiguredSortOrder === VaultListSortOrder.LastUsed) {
      this._autofillSortsByUsername$.next(!this._autofillSortsByUsername$.getValue());
      this._autofillFollowsVaultSortOrder$.next(false);
      return;
    }

    this._autofillFollowsVaultSortOrder$.next(!this._autofillFollowsVaultSortOrder$.getValue());
    this._autofillSortsByUsername$.next(false);
  }

  /**
   * Builds the comparator for ciphers in the autofill section of the Vault tab.
   *
   * Type grouping is always preserved (Login, Card, Identity, ...); the user selected
   * sort order only decides the ordering *within* each type group.
   *
   * @param sortOrder - The vault list sort order selected by the user.
   * @returns A comparator usable with `Array.prototype.sort()`.
   * @private
   */
  private sortCiphersForAutofill(
    sortOrder: VaultListSortOrder,
  ): (a: CipherViewLike, b: CipherViewLike) => number {
    const typeOrder = {
      [CipherType.Login]: 1,
      [CipherType.Card]: 2,
      [CipherType.Identity]: 3,
      [CipherType.SecureNote]: 4,
      [CipherType.SshKey]: 5,
    } as Record<CipherType, number>;

    const withinTypeComparator = this.cipherService.getSortingFunctionForOrder(sortOrder);

    return (a, b) => {
      const aType = CipherViewLikeUtils.getType(a);
      const bType = CipherViewLikeUtils.getType(b);

      // Compare types first so the sections keep their order
      if (typeOrder[aType] < typeOrder[bType]) {
        return -1;
      } else if (typeOrder[aType] > typeOrder[bType]) {
        return 1;
      }

      // Same type, so defer to the user selected sort order
      return withinTypeComparator(a, b);
    };
  }
}

/**
 * Operator that waits until the active account has synced at least once before allowing the source to continue emission.
 * @param syncService
 */
const waitUntilSync = <T>(syncService: SyncService): MonoTypeOperatorFunction<T> => {
  return waitUntil(syncService.activeUserLastSync$().pipe(filter((lastSync) => lastSync != null)));
};
