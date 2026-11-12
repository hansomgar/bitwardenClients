import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Router } from "@angular/router";
import { mock } from "jest-mock-extended";
import { BehaviorSubject, of } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { VaultSettingsService } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { CompactModeService, DialogService, ToastService } from "@bitwarden/components";
import { StateProvider } from "@bitwarden/state";
import { PasswordRepromptService } from "@bitwarden/vault";

import { VaultPopupAutofillService } from "../../../services/vault-popup-autofill.service";
import { VaultPopupItemsService } from "../../../services/vault-popup-items.service";
import { VaultPopupSectionService } from "../../../services/vault-popup-section.service";
import { PopupCipherViewLike } from "../../../views/popup-cipher.view";

import { AutofillVaultListItemsComponent } from "./autofill-vault-list-items.component";

/**
 * Renders the component with its real container so the `slot="title-end"` projection chain
 * is exercised end to end.
 *
 * This exists because a unit test with a stubbed container cannot catch content that is
 * declared inside an embedded view (`@if`), which Angular silently fails to project into
 * `ng-content select`. That regression made the sort toggle invisible in the real popup.
 */
describe("AutofillVaultListItemsComponent (render integration)", () => {
  let fixture: ComponentFixture<AutofillVaultListItemsComponent>;

  const autoFillCiphers$ = new BehaviorSubject<PopupCipherViewLike[]>([]);
  const autofillFollowsVaultSortOrder$ = new BehaviorSubject<boolean>(false);
  const autofillSortsByUsername$ = new BehaviorSubject<boolean>(false);
  const configuredSortIsLastUsed$ = new BehaviorSubject<boolean>(true);
  const toggleAutofillSortOrder = jest.fn();

  const cipher = {
    id: "c1",
    name: "Test",
    type: CipherType.Login,
    login: { username: "u", uris: [{ uri: "https://example.com", match: null }] },
    favorite: false,
    reprompt: 0,
    organizationId: null,
    collectionIds: [],
    edit: true,
    viewPassword: true,
  } as unknown as PopupCipherViewLike;

  beforeEach(async () => {
    if (!HTMLSpanElement.prototype.getAnimations) {
      HTMLSpanElement.prototype.getAnimations = jest.fn().mockReturnValue([]);
    }

    await TestBed.configureTestingModule({
      imports: [AutofillVaultListItemsComponent, NoopAnimationsModule],
      providers: [
        { provide: ConfigService, useValue: { getFeatureFlag$: () => of(false) } },
        {
          provide: VaultPopupItemsService,
          useValue: {
            autoFillCiphers$,
            hasFilterApplied$: new BehaviorSubject(false),
            autofillFollowsVaultSortOrder$,
            autofillSortsByUsername$,
            configuredSortIsLastUsed$,
            toggleAutofillSortOrder,
          },
        },
        {
          provide: VaultPopupAutofillService,
          useValue: {
            currentTabIsOnBlocklist$: new BehaviorSubject(false),
            autofillAllowed$: new BehaviorSubject(true),
            nonLoginCipherTypesOnPage$: new BehaviorSubject({}),
            currentAutofillTab$: new BehaviorSubject({ url: "https://example.com" }),
            doAutofill: jest.fn(),
            refreshCurrentTab: jest.fn(),
          },
        },
        { provide: CompactModeService, useValue: { enabled$: of(false) } },
        {
          provide: VaultPopupSectionService,
          useValue: {
            getOpenDisplayStateForSection: jest.fn().mockReturnValue(() => true),
            updateSectionOpenStoredState: jest.fn(),
          },
        },
        { provide: I18nService, useValue: { t: (k: string) => k } },
        { provide: AccountService, useValue: { activeAccount$: of({ id: "UserId" }) } },
        { provide: CipherService, useValue: mock<CipherService>() },
        { provide: Router, useValue: { navigate: jest.fn() } },
        {
          provide: PlatformUtilsService,
          useValue: { getAutofillKeyboardShortcut: () => "", getBrowser: () => "edge" },
        },
        { provide: PasswordRepromptService, useValue: mock<PasswordRepromptService>() },
        { provide: ToastService, useValue: mock<ToastService>() },
        {
          provide: VaultSettingsService,
          useValue: { clickItemsToAutofillVaultView$: new BehaviorSubject(true) },
        },
        {
          provide: StateProvider,
          useValue: {
            getUserState$: jest.fn().mockReturnValue(of(null)),
            getUser: jest.fn().mockReturnValue({ update: jest.fn().mockResolvedValue(undefined) }),
            getGlobal: jest.fn().mockReturnValue({
              update: jest.fn().mockResolvedValue(undefined),
              state$: new BehaviorSubject(undefined),
            }),
          },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideProvider(DialogService, { useValue: mock<DialogService>() })
      .compileComponents();

    fixture = TestBed.createComponent(AutofillVaultListItemsComponent);
    autoFillCiphers$.next([cipher]);
    fixture.detectChanges();
  });

  const sortToggle = () =>
    fixture.debugElement
      .queryAll(By.css("button"))
      .find((b) =>
        /autofillSortBy(Setting|LastUsed|Username)/.test((b.nativeElement.textContent || "").trim()),
      );

  beforeEach(() => {
    autofillFollowsVaultSortOrder$.next(false);
    autofillSortsByUsername$.next(false);
    configuredSortIsLastUsed$.next(true);
  });

  it("projects the sort toggle into the section header", () => {
    expect(sortToggle()).toBeDefined();
    expect(sortToggle()!.nativeElement.textContent.trim()).toBe("autofillSortByLastUsed");
  });

  it("labels the chip by account when the setting is the default and account order is active", () => {
    autofillSortsByUsername$.next(true);
    fixture.detectChanges();

    expect(sortToggle()!.nativeElement.textContent.trim()).toBe("autofillSortByUsername");
  });

  it("labels the chip by setting when a meaningful sort order is configured", () => {
    configuredSortIsLastUsed$.next(false);
    autofillFollowsVaultSortOrder$.next(true);
    fixture.detectChanges();

    expect(sortToggle()!.nativeElement.textContent.trim()).toBe("autofillSortBySetting");
  });

  it("labels the chip by recent use when nothing else is active", () => {
    autofillSortsByUsername$.next(false);
    autofillFollowsVaultSortOrder$.next(false);
    fixture.detectChanges();

    expect(sortToggle()!.nativeElement.textContent.trim()).toBe("autofillSortByLastUsed");
  });

  it("invokes the service when clicked", () => {
    sortToggle()!.nativeElement.click();

    expect(toggleAutofillSortOrder).toHaveBeenCalled();
  });
});
