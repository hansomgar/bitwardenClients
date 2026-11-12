import { signal, WritableSignal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { mock } from "jest-mock-extended";
import { BehaviorSubject, firstValueFrom, of, take, timeout } from "rxjs";

import { CollectionService } from "@bitwarden/admin-console/common";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { CollectionView } from "@bitwarden/common/admin-console/models/collections";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { ProductTierType } from "@bitwarden/common/billing/enums";
import { uuidAsString } from "@bitwarden/common/platform/abstractions/sdk/sdk.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { SyncService } from "@bitwarden/common/platform/sync";
import { mockAccountServiceWith, ObservableTracker } from "@bitwarden/common/spec";
import { CipherId, UserId } from "@bitwarden/common/types/guid";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { SearchService } from "@bitwarden/common/vault/abstractions/search.service";
import { VaultSettingsService } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { VaultListSortOrder } from "@bitwarden/common/vault/enums/vault-list-sort-order.enum";
import { CipherData } from "@bitwarden/common/vault/models/data/cipher.data";
import { LocalData } from "@bitwarden/common/vault/models/data/local.data";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import {
  RestrictedCipherType,
  RestrictedItemTypesService,
} from "@bitwarden/common/vault/services/restricted-item-types.service";
import {
  CipherViewLike,
  CipherViewLikeUtils,
} from "@bitwarden/common/vault/utils/cipher-view-like-utils";

import { InlineMenuFieldQualificationService } from "../../../autofill/services/inline-menu-field-qualification.service";
import { BrowserApi } from "../../../platform/browser/browser-api";
import { PopupViewCacheService } from "../../../platform/popup/view-cache/popup-view-cache.service";
import { PopupCipherViewLike } from "../views/popup-cipher.view";

import { VaultPopupAutofillService } from "./vault-popup-autofill.service";
import { VaultPopupItemsService } from "./vault-popup-items.service";
import { VaultPopupListFiltersService } from "./vault-popup-list-filters.service";

describe("VaultPopupItemsService", () => {
  let testBed: TestBed;
  let service: VaultPopupItemsService;
  let allCiphers: Record<CipherId, CipherView>;
  let autoFillCiphers: CipherView[];

  let mockOrg: Organization;
  let mockCollections: CollectionView[];
  let activeUserLastSync$: BehaviorSubject<Date | null>;
  let viewCacheService: {
    signal: jest.Mock;
    mockSignal: WritableSignal<string | null>;
  };

  let ciphersSubject: BehaviorSubject<Record<CipherId, CipherData>>;
  let localDataSubject: BehaviorSubject<Record<CipherId, LocalData>>;
  let failedToDecryptCiphersSubject: BehaviorSubject<CipherView[]>;

  const cipherServiceMock = mock<CipherService>();
  const vaultSettingsServiceMock = mock<VaultSettingsService>();
  /**
   * Recreated per test. Tests mutate this subject to exercise sort order changes, and a
   * shared instance would let leftover subscriptions from previous tests re-emit and fail
   * against the wrong test.
   */
  let vaultListSortOrder$: BehaviorSubject<VaultListSortOrder>;
  const organizationServiceMock = mock<OrganizationService>();
  const vaultPopupListFiltersServiceMock = mock<VaultPopupListFiltersService>();
  const searchService = mock<SearchService>();
  const collectionService = mock<CollectionService>();
  const vaultAutofillServiceMock = mock<VaultPopupAutofillService>();
  const syncServiceMock = mock<SyncService>();
  const inlineMenuFieldQualificationServiceMock = mock<InlineMenuFieldQualificationService>();
  const userId = Utils.newGuid() as UserId;
  const accountServiceMock = mockAccountServiceWith(userId);

  const restrictedItemTypesService = {
    restricted$: new BehaviorSubject<RestrictedCipherType[]>([]),
    isCipherRestricted: jest.fn().mockReturnValue(false),
  };

  beforeEach(() => {
    allCiphers = cipherFactory(10);
    const cipherList = Object.values(allCiphers);
    // First 2 ciphers are autofill
    autoFillCiphers = cipherList.slice(0, 2);

    // First autofill cipher is also favorite
    autoFillCiphers[0].favorite = true;

    // 3rd and 4th ciphers are favorite
    cipherList[2].favorite = true;
    cipherList[3].favorite = true;

    const cipherList$ = new BehaviorSubject<CipherView[]>(cipherList);

    cipherServiceMock.cipherListViews$.mockReturnValue(cipherList$.asObservable());

    ciphersSubject = new BehaviorSubject<Record<CipherId, CipherData>>({});
    localDataSubject = new BehaviorSubject<Record<CipherId, LocalData>>({});
    failedToDecryptCiphersSubject = new BehaviorSubject<CipherView[]>([]);

    cipherServiceMock.ciphers$.mockImplementation((userId: UserId) =>
      ciphersSubject.asObservable(),
    );
    cipherServiceMock.localData$.mockImplementation((userId: UserId) =>
      localDataSubject.asObservable(),
    );
    cipherServiceMock.failedToDecryptCiphers$.mockImplementation((userId: UserId) =>
      failedToDecryptCiphersSubject.asObservable(),
    );

    searchService.searchCiphers.mockImplementation(
      async (userId, _organizationId, _query, ciphers) => ciphers!,
    );
    cipherServiceMock.filterCiphersForUrl.mockImplementation(async (ciphers) =>
      ciphers.filter((c) => ["0", "1"].includes(uuidAsString(c.id))),
    );
    vaultSettingsServiceMock.showCardsCurrentTab$ = new BehaviorSubject(false);
    vaultSettingsServiceMock.showIdentitiesCurrentTab$ = new BehaviorSubject(false);
    vaultListSortOrder$ = new BehaviorSubject<VaultListSortOrder>(VaultListSortOrder.LastUsed);
    vaultSettingsServiceMock.vaultListSortOrder$ = vaultListSortOrder$.asObservable();
    cipherServiceMock.getSortingFunctionForOrder.mockImplementation(
      (order: VaultListSortOrder) =>
        order === VaultListSortOrder.NameAsc
          ? (a: CipherViewLike, b: CipherViewLike) => a.name.localeCompare(b.name)
          : (a: CipherViewLike, b: CipherViewLike) => 0,
    );
    // `LastUsed` delegates to the real last-used comparator, mirroring production behavior.
    // It deliberately does NOT sort alphabetically, so tests can tell the two modes apart.
    cipherServiceMock.sortCiphersByLastUsedThenName.mockImplementation(() => 0);

    vaultPopupListFiltersServiceMock.filters$ = new BehaviorSubject({
      organization: null,
      collection: null,
      cipherType: null,
      folder: null,
    });
    // Return all ciphers, `filterFunction$` will be tested in `VaultPopupListFiltersService`
    vaultPopupListFiltersServiceMock.filterFunction$ = new BehaviorSubject(
      (ciphers: PopupCipherViewLike[]) => ciphers,
    );

    vaultAutofillServiceMock.currentAutofillTab$ = new BehaviorSubject({
      url: "https://example.com",
    } as chrome.tabs.Tab);

    vaultAutofillServiceMock.nonLoginCipherTypesOnPage$ = new BehaviorSubject({
      [CipherType.Card]: true,
      [CipherType.Identity]: true,
    });

    mockOrg = {
      id: "org1",
      name: "Organization 1",
      productTierType: ProductTierType.Enterprise,
    } as Organization;

    mockCollections = [
      { id: "col1", name: "Collection 1" } as CollectionView,
      { id: "col2", name: "Collection 2" } as CollectionView,
    ];

    organizationServiceMock.organizations$.mockReturnValue(new BehaviorSubject([mockOrg]));
    collectionService.decryptedCollections$.mockReturnValue(new BehaviorSubject(mockCollections));

    activeUserLastSync$ = new BehaviorSubject<Date | null>(new Date());
    syncServiceMock.activeUserLastSync$.mockReturnValue(activeUserLastSync$);

    const testSearchSignal = createMockSignal<string | null>("");
    viewCacheService = {
      mockSignal: testSearchSignal,
      signal: jest.fn((options) => testSearchSignal),
    };

    testBed = TestBed.configureTestingModule({
      providers: [
        { provide: CipherService, useValue: cipherServiceMock },
        { provide: VaultSettingsService, useValue: vaultSettingsServiceMock },
        { provide: SearchService, useValue: searchService },
        { provide: OrganizationService, useValue: organizationServiceMock },
        { provide: AccountService, useValue: accountServiceMock },
        { provide: VaultPopupListFiltersService, useValue: vaultPopupListFiltersServiceMock },
        { provide: CollectionService, useValue: collectionService },
        { provide: VaultPopupAutofillService, useValue: vaultAutofillServiceMock },
        { provide: SyncService, useValue: syncServiceMock },
        { provide: AccountService, useValue: mockAccountServiceWith("UserId" as UserId) },
        {
          provide: InlineMenuFieldQualificationService,
          useValue: inlineMenuFieldQualificationServiceMock,
        },
        { provide: PopupViewCacheService, useValue: viewCacheService },
        {
          provide: RestrictedItemTypesService,
          useValue: restrictedItemTypesService,
        },
      ],
    });

    service = testBed.inject(VaultPopupItemsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be created", () => {
    service = testBed.inject(VaultPopupItemsService);
    expect(service).toBeTruthy();
  });

  it("should merge cipher views with collections and organization", (done) => {
    const cipherList = Object.values(allCiphers);
    cipherList[0].organizationId = "org1";
    cipherList[0].collectionIds = ["col1", "col2"];

    service.autoFillCiphers$.subscribe((ciphers) => {
      expect(ciphers[0].organization).toEqual(mockOrg);
      expect(ciphers[0].collections).toContain(mockCollections[0]);
      expect(ciphers[0].collections).toContain(mockCollections[1]);
      done();
    });
  });

  it("should update cipher list when cipherService.ciphers$ emits", async () => {
    const tracker = new ObservableTracker(service.autoFillCiphers$);

    await tracker.expectEmission();

    ciphersSubject.next({});

    await tracker.expectEmission();

    // Should only emit twice
    expect(tracker.emissions.length).toBe(2);
    await expect(tracker.pauseUntilReceived(3)).rejects.toThrow("Timeout exceeded");
  });

  it("should update cipher list when cipherService.localData$ emits", async () => {
    const tracker = new ObservableTracker(service.autoFillCiphers$);

    await tracker.expectEmission();

    localDataSubject.next({});

    await tracker.expectEmission();

    // Should only emit twice
    expect(tracker.emissions.length).toBe(2);
    await expect(tracker.pauseUntilReceived(3)).rejects.toThrow("Timeout exceeded");
  });

  it("should not emit cipher list if syncService.getLastSync returns null", async () => {
    activeUserLastSync$.next(null);

    const obs$ = service.autoFillCiphers$.pipe(timeout(50));

    await expect(firstValueFrom(obs$)).rejects.toThrow("Timeout has occurred");
  });

  describe("autoFillCiphers$", () => {
    it("should return empty array if there is no current tab", (done) => {
      (vaultAutofillServiceMock.currentAutofillTab$ as BehaviorSubject<any>).next(null);
      service.autoFillCiphers$.subscribe((ciphers) => {
        expect(ciphers).toEqual([]);
        done();
      });
    });

    it("should filter ciphers for the current tab and types", (done) => {
      const currentTab = { url: "https://example.com" } as chrome.tabs.Tab;

      (vaultSettingsServiceMock.showCardsCurrentTab$ as BehaviorSubject<boolean>).next(true);
      (vaultSettingsServiceMock.showIdentitiesCurrentTab$ as BehaviorSubject<boolean>).next(true);
      jest.spyOn(BrowserApi, "getTabFromCurrentWindow").mockResolvedValue(currentTab);

      service.autoFillCiphers$.subscribe((ciphers) => {
        expect(cipherServiceMock.filterCiphersForUrl.mock.calls.length).toBe(1);
        expect(cipherServiceMock.filterCiphersForUrl).toHaveBeenCalledWith(
          expect.anything(),
          currentTab.url,
          [CipherType.Card, CipherType.Identity],
        );
        done();
      });
    });

    it("should return ciphers sorted by type, then by last used date, then by name", (done) => {
      const expectedTypeOrder: Record<CipherType, number> = {
        [CipherType.Login]: 1,
        [CipherType.Card]: 2,
        [CipherType.Identity]: 3,
        [CipherType.SecureNote]: 4,
        [CipherType.SshKey]: 5,
        [CipherType.BankAccount]: 6,
        [CipherType.DriversLicense]: 7,
        [CipherType.Passport]: 8,
      };

      // Assume all ciphers are autofill ciphers to test sorting
      cipherServiceMock.filterCiphersForUrl.mockResolvedValue(Object.values(allCiphers));

      service.autoFillCiphers$.subscribe((ciphers) => {
        expect(ciphers.length).toBe(10);

        for (let i = 0; i < ciphers.length - 1; i++) {
          const current = ciphers[i];
          const next = ciphers[i + 1];

          expect(expectedTypeOrder[CipherViewLikeUtils.getType(current)]).toBeLessThanOrEqual(
            expectedTypeOrder[CipherViewLikeUtils.getType(next)],
          );
        }
        expect(cipherServiceMock.getSortingFunctionForOrder).toHaveBeenCalledWith(
          VaultListSortOrder.LastUsed,
        );
        done();
      });
    });

    it("applies the vault list sort order within each type group once the toggle is on", (done) => {
      vaultListSortOrder$.next(VaultListSortOrder.NameAsc);
      cipherServiceMock.filterCiphersForUrl.mockResolvedValue(Object.values(allCiphers));
      // The toggle starts off, so the user must opt in before the setting is honored.
      service.toggleAutofillSortOrder();

      const expectedTypeOrder: Record<CipherType, number> = {
        [CipherType.Login]: 1,
        [CipherType.Card]: 2,
        [CipherType.Identity]: 3,
        [CipherType.SecureNote]: 4,
        [CipherType.SshKey]: 5,
        [CipherType.BankAccount]: 6,
        [CipherType.DriversLicense]: 7,
        [CipherType.Passport]: 8,
      };

      service.autoFillCiphers$.subscribe((ciphers) => {
        expect(cipherServiceMock.getSortingFunctionForOrder).toHaveBeenCalledWith(
          VaultListSortOrder.NameAsc,
        );

        // Type grouping must still hold...
        for (let i = 0; i < ciphers.length - 1; i++) {
          expect(
            expectedTypeOrder[CipherViewLikeUtils.getType(ciphers[i])],
          ).toBeLessThanOrEqual(expectedTypeOrder[CipherViewLikeUtils.getType(ciphers[i + 1])]);
        }

        // ...and names must be ascending inside each group.
        const namesByType = new Map<CipherType, string[]>();
        ciphers.forEach((c) => {
          const type = CipherViewLikeUtils.getType(c);
          namesByType.set(type, [...(namesByType.get(type) ?? []), c.name]);
        });
        namesByType.forEach((names) => {
          expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
        });

        done();
      });
    });

    it("uses the official most-recently-used order by default even when a sort order is configured", (done) => {
      vaultListSortOrder$.next(VaultListSortOrder.NameAsc);
      cipherServiceMock.filterCiphersForUrl.mockResolvedValue(Object.values(allCiphers));
      cipherServiceMock.getSortingFunctionForOrder.mockClear();

      service.autoFillCiphers$.subscribe(() => {
        // The filtered list still honors the setting, but the autofill section must not:
        // with the toggle off it always sorts by most-recently-used.
        const autofillSortOrders = cipherServiceMock.getSortingFunctionForOrder.mock.calls.map(
          ([order]) => order,
        );
        expect(autofillSortOrders).toContain(VaultListSortOrder.LastUsed);
        done();
      });
    });

    it("sorts by account when the toggle is used while the setting is the default", (done) => {
      // The setting is the default, so "follow the setting" would be indistinguishable from
      // "most recent". The chip therefore offers account ordering instead — without this the
      // toggle looks like a no-op for every user who never changed the setting.
      vaultListSortOrder$.next(VaultListSortOrder.LastUsed);
      cipherServiceMock.filterCiphersForUrl.mockResolvedValue(Object.values(allCiphers));
      cipherServiceMock.getSortingFunctionForOrder.mockClear();

      service.toggleAutofillSortOrder();

      service.autoFillCiphers$.subscribe(() => {
        const usedOrders = cipherServiceMock.getSortingFunctionForOrder.mock.calls.map(
          ([order]) => order,
        );

        expect(usedOrders).toContain(VaultListSortOrder.UsernameAsc);
        done();
      });
    });

    it("exposes the account-ordering state so the chip can relabel itself", (done) => {
      vaultListSortOrder$.next(VaultListSortOrder.LastUsed);
      cipherServiceMock.filterCiphersForUrl.mockResolvedValue(Object.values(allCiphers));

      service.toggleAutofillSortOrder();

      service.autofillSortsByUsername$.subscribe((sortsByUsername) => {
        expect(sortsByUsername).toBe(true);
        done();
      });
    });

    it("reports whether the configured order is the default", (done) => {
      vaultListSortOrder$.next(VaultListSortOrder.LastUsed);

      service.configuredSortIsLastUsed$.subscribe((isLastUsed) => {
        expect(isLastUsed).toBe(true);
        done();
      });
    });

    it("follows the setting instead of account order when the setting is meaningful", (done) => {
      vaultListSortOrder$.next(VaultListSortOrder.NameAsc);
      cipherServiceMock.filterCiphersForUrl.mockResolvedValue(Object.values(allCiphers));
      cipherServiceMock.getSortingFunctionForOrder.mockClear();

      service.toggleAutofillSortOrder();

      service.autoFillCiphers$.subscribe(() => {
        const usedOrders = cipherServiceMock.getSortingFunctionForOrder.mock.calls.map(
          ([order]) => order,
        );

        expect(usedOrders).toContain(VaultListSortOrder.NameAsc);
        expect(usedOrders).not.toContain(VaultListSortOrder.UsernameAsc);
        done();
      });
    });

    it("actually re-sorts the autofill list when the toggle is turned on", (done) => {
      // The headline behaviour: clicking the chip must change the rendered order, not just
      // the chip label.
      vaultListSortOrder$.next(VaultListSortOrder.NameAsc);

      const scrambled = [
        { id: "3", type: CipherType.Login, name: "Login zulu" },
        { id: "1", type: CipherType.Login, name: "Login alpha" },
        { id: "2", type: CipherType.Login, name: "Login mike" },
      ] as unknown as PopupCipherViewLike[];
      cipherServiceMock.filterCiphersForUrl.mockResolvedValue(scrambled);

      // "Most recently used" keeps the incoming order so the two modes are distinguishable.
      cipherServiceMock.sortCiphersByLastUsedThenName.mockImplementation(() => 0);

      const seen: string[][] = [];
      service.autoFillCiphers$.subscribe((ciphers) => {
        seen.push(ciphers.map((c) => c.name));

        if (seen.length === 1) {
          service.toggleAutofillSortOrder();
          return;
        }

        expect(seen[0]).toEqual(["Login zulu", "Login alpha", "Login mike"]);
        expect(seen[1]).toEqual(["Login alpha", "Login mike", "Login zulu"]);
        done();
      });
    });

    it("keeps the toggle state when the configured order goes back to most-recently-used", (done) => {
      vaultListSortOrder$.next(VaultListSortOrder.NameDesc);
      service.toggleAutofillSortOrder();
      cipherServiceMock.filterCiphersForUrl.mockResolvedValue(Object.values(allCiphers));

      let emissions = 0;
      service.autoFillCiphers$.subscribe(() => {
        emissions++;

        if (emissions === 1) {
          // Configuration changes back to the official default. The toggle stays visible, so
          // its state must not be reset out from under the user.
          vaultListSortOrder$.next(VaultListSortOrder.LastUsed);
          return;
        }

        expect(service["_autofillFollowsVaultSortOrder$"].getValue()).toBe(true);
        done();
      });
    });

    it("should filter autoFillCiphers$ down to search term", (done) => {
      const searchText = "Login";

      searchService.searchCiphers.mockImplementation(
        async (userId, _organizationId, q, ciphers) => {
          return ciphers!.filter((cipher) => {
            return cipher.name.includes(searchText);
          });
        },
      );

      // there is only 1 Login returned for filteredCiphers.
      service.autoFillCiphers$.subscribe((ciphers) => {
        expect(ciphers[0].name.includes(searchText)).toBe(true);
        expect(ciphers.length).toBe(1);
        done();
      });
    });
  });

  describe("filteredCiphers$", () => {
    it("should filter filteredCipher$ down to search term", (done) => {
      const cipherList = Object.values(allCiphers);
      const searchText = "Login";

      const searchResult = cipherList.filter((cipher) => {
        return cipher.name.includes(searchText);
      });
      searchService.searchCiphers.mockResolvedValue(searchResult);

      service.filteredCiphers$.subscribe((ciphers) => {
        // There are 10 ciphers but only 3 with "Login" in the name
        expect(ciphers.length).toBe(3);
        done();
      });
    });

    it("applies the configured vault list sort order", (done) => {
      vaultListSortOrder$.next(VaultListSortOrder.NameAsc);

      service.filteredCiphers$.subscribe((ciphers) => {
        expect(cipherServiceMock.getSortingFunctionForOrder).toHaveBeenCalledWith(
          VaultListSortOrder.NameAsc,
        );

        const names = ciphers.map((c) => c.name);
        expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
        done();
      });
    });

    it("re-sorts when the sort order setting changes", (done) => {
      let callCount = 0;

      service.filteredCiphers$.subscribe(() => {
        callCount++;

        if (callCount === 1) {
          vaultListSortOrder$.next(VaultListSortOrder.NameDesc);
          return;
        }

        expect(cipherServiceMock.getSortingFunctionForOrder).toHaveBeenCalledWith(
          VaultListSortOrder.NameDesc,
        );
        done();
      });
    });
  });

  describe("autoFillCiphers$ sort order", () => {
    it("keeps sorting by type regardless of the vault list sort order", (done) => {
      vaultListSortOrder$.next(VaultListSortOrder.NameAsc);
      const spy = jest.spyOn(
        service as unknown as { sortCiphersForAutofill: () => void },
        "sortCiphersForAutofill",
      );

      service.autoFillCiphers$.subscribe(() => {
        expect(spy).toHaveBeenCalled();
        done();
      });
    });
  });

  describe("favoriteCiphers$", () => {
    it("should exclude autofill ciphers", (done) => {
      service.favoriteCiphers$.subscribe((ciphers) => {
        // 2 autofill ciphers, 3 favorite ciphers, 1 favorite cipher is also autofill = 2 favorite ciphers to show
        expect(ciphers.length).toBe(2);
        done();
      });
    });

    it("should filter favoriteCiphers$ down to search term", (done) => {
      const cipherList = Object.values(allCiphers);
      const searchText = "Card 2";

      const searchResult = cipherList.filter((cipher) => {
        return cipher.name.includes(searchText);
      });
      searchService.searchCiphers.mockResolvedValue(searchResult);

      service.favoriteCiphers$.subscribe((ciphers) => {
        // There are 2 favorite items but only one Card 2
        expect(ciphers[0].name).toBe(searchText);
        expect(ciphers.length).toBe(1);
        done();
      });
    });
  });

  describe("emptyVault$", () => {
    it("should return true if there are no ciphers", (done) => {
      cipherServiceMock.cipherListViews$.mockReturnValue(of([]));
      service.emptyVault$.pipe(take(1)).subscribe((empty) => {
        expect(empty).toBe(true);
        done();
      });
    });

    it("should return false if there are ciphers", (done) => {
      cipherServiceMock.cipherListViews$.mockReturnValue(
        of([{ id: "1", type: CipherType.Login, name: "Login 1" }] as CipherView[]),
      );

      service.emptyVault$.pipe(take(1)).subscribe((empty) => {
        expect(empty).toBe(false);
        done();
      });
    });

    it("should return true when all ciphers are deleted/archived", (done) => {
      cipherServiceMock.cipherListViews$.mockReturnValue(
        of([
          { id: "1", type: CipherType.Login, name: "Login 1", isDeleted: true },
          { id: "2", type: CipherType.Login, name: "Login 2", isDeleted: true },
          { id: "3", type: CipherType.Login, name: "Login 3", isDeleted: false, isArchived: true },
        ] as CipherView[]),
      );

      service.emptyVault$.pipe(take(1)).subscribe((empty) => {
        expect(empty).toBe(true);
        done();
      });
    });
  });

  describe("noFilteredResults$", () => {
    it("should return false when filteredResults has values", (done) => {
      service.noFilteredResults$.subscribe((noResults) => {
        expect(noResults).toBe(false);
        done();
      });
    });

    it("should return true when there are zero filteredResults", (done) => {
      searchService.searchCiphers.mockResolvedValue([]);
      service.noFilteredResults$.subscribe((noResults) => {
        expect(noResults).toBe(true);
        done();
      });
    });
  });

  describe("deletedCiphers$", () => {
    it("should return deleted ciphers", async () => {
      const deletedCipher = new CipherView();
      deletedCipher.deletedDate = new Date();
      const ciphers = [new CipherView(), new CipherView(), new CipherView(), deletedCipher];

      cipherServiceMock.cipherListViews$.mockReturnValue(of(ciphers));
      ciphersSubject.next({});

      const deletedCiphers = await firstValueFrom(service.deletedCiphers$);
      expect(deletedCiphers.length).toBe(1);
    });
  });

  describe("hasFilterApplied$", () => {
    it("should return true if the search term provided is searchable", (done) => {
      searchService.isSearchable.mockImplementation(async () => true);
      service.hasFilterApplied$.subscribe((canSearch) => {
        expect(canSearch).toBe(true);
        done();
      });
    });

    it("should return false if the search term provided is not searchable", (done) => {
      searchService.isSearchable.mockImplementation(async () => false);
      service.hasFilterApplied$.subscribe((canSearch) => {
        expect(canSearch).toBe(false);
        done();
      });
    });
  });

  describe("loading$", () => {
    let tracked: ObservableTracker<boolean>;
    let trackedCiphers: ObservableTracker<any>;
    beforeEach(() => {
      // Start tracking loading$ emissions
      tracked = new ObservableTracker(service.loading$);

      // Track favoriteCiphers$ to make cipher observables active
      trackedCiphers = new ObservableTracker(service.favoriteCiphers$);
    });

    it("should initialize with true first", async () => {
      expect(tracked.emissions[0]).toBe(true);
    });

    it("should emit false once ciphers are available", async () => {
      expect(tracked.emissions.length).toBe(2);
      expect(tracked.emissions[0]).toBe(true);
      expect(tracked.emissions[1]).toBe(false);
    });

    it("should cycle when cipherService.ciphers$ emits", async () => {
      // Restart tracking
      tracked = new ObservableTracker(service.loading$);
      ciphersSubject.next({});

      await trackedCiphers.pauseUntilReceived(2);

      expect(tracked.emissions.length).toBe(3);
      expect(tracked.emissions[0]).toBe(false);
      expect(tracked.emissions[1]).toBe(true);
      expect(tracked.emissions[2]).toBe(false);
    });
  });

  describe("applyFilter", () => {
    it("should call search Service with the new search term", async () => {
      const searchText = "Hello";
      const searchServiceSpy = jest.spyOn(searchService, "searchCiphers");

      service.applyFilter(searchText);

      await firstValueFrom(service.favoriteCiphers$.pipe(take(1)));

      expect(searchServiceSpy).toHaveBeenCalledWith("UserId", null, searchText, expect.anything());
    });
  });

  it("should update searchText$ when applyFilter is called", (done) => {
    service.searchText$.subscribe((val) => {
      expect(val).toEqual("test search");
      expect(viewCacheService.mockSignal()).toEqual("test search");
      done();
    });

    service.applyFilter("test search");
  });
});

// A function to generate a list of ciphers of different types
function cipherFactory(count: number): Record<CipherId, CipherView> {
  const ciphers: CipherView[] = [];
  for (let i = 0; i < count; i++) {
    const type = ((i % 4) + 1) as CipherType;
    switch (type) {
      case CipherType.Login:
        ciphers.push({
          id: `${i}`,
          type: CipherType.Login,
          name: `Login ${i}`,
          login: {
            username: `username${i}`,
            password: `password${i}`,
          },
        } as CipherView);
        break;
      case CipherType.SecureNote:
        ciphers.push({
          id: `${i}`,
          type: CipherType.SecureNote,
          name: `SecureNote ${i}`,
          notes: `notes${i}`,
        } as CipherView);
        break;
      case CipherType.Card:
        ciphers.push({
          id: `${i}`,
          type: CipherType.Card,
          name: `Card ${i}`,
          card: {
            cardholderName: `cardholderName${i}`,
            number: `number${i}`,
            brand: `brand${i}`,
          },
        } as CipherView);
        break;
      case CipherType.Identity:
        ciphers.push({
          id: `${i}`,
          type: CipherType.Identity,
          name: `Identity ${i}`,
          identity: {
            firstName: `firstName${i}`,
            lastName: `lastName${i}`,
          },
        } as CipherView);
        break;
    }
  }
  return Object.fromEntries(ciphers.map((c) => [c.id, c]));
}

function createMockSignal<T>(initialValue: T): WritableSignal<T> {
  const s = signal(initialValue);
  s.set = (value: T) => s.update(() => value);
  return s;
}
