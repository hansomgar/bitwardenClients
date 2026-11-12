import { Component, EventEmitter, Input, NO_ERRORS_SCHEMA, Output } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { mock } from "jest-mock-extended";
import { BehaviorSubject, of } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { GlobalStateProvider } from "@bitwarden/common/platform/state";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { VaultSettingsService } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import {
  ChipActionComponent,
  CompactModeService,
  DialogService,
  ToastService,
  TooltipDirective,
} from "@bitwarden/components";
import { StateProvider } from "@bitwarden/state";
import { PasswordRepromptService } from "@bitwarden/vault";

import BrowserPopupUtils from "../../../../../platform/browser/browser-popup-utils";
import { VaultPopupAutofillService } from "../../../services/vault-popup-autofill.service";
import { VaultPopupItemsService } from "../../../services/vault-popup-items.service";
import { PopupCipherViewLike } from "../../../views/popup-cipher.view";
import { SimplifiedAutofillInfoComponent } from "../simplified-autofill-info/simplified-autofill-info.component";

import { AutofillVaultListItemsComponent } from "./autofill-vault-list-items.component";
import { VaultListItemsContainerComponent } from "../vault-list-items-container/vault-list-items-container.component";

/**
 * Projects its content so the `slot="title-end"` children rendered by the component under
 * test stay in the DOM. The real container relies on `bit-section-header` for projection,
 * which `NO_ERRORS_SCHEMA` stubs out without an `ng-content`.
 */
@Component({
  selector: "app-vault-list-items-container",
  template: `<ng-content></ng-content>`,
  standalone: true,
})
class MockVaultListItemsContainerComponent {
  @Input() ciphers: PopupCipherViewLike[] = [];
  @Input() title?: string;
  @Input() description?: string;
  @Input() showRefresh = false;
  @Input() disableDescriptionMargin = false;
  @Input() groupByType = false;
  @Input() primaryActionAutofill = false;
  @Input() isAutofillList = false;
  @Input() showAutofillButton = false;
  @Output() onRefresh = new EventEmitter<void>();
}

describe("AutofillVaultListItemsComponent", () => {
  let fixture: ComponentFixture<AutofillVaultListItemsComponent>;

  const autoFillCiphers$ = new BehaviorSubject<PopupCipherViewLike[]>([]);
  const hasFilterApplied$ = new BehaviorSubject<boolean>(false);
  const autofillAllowed$ = new BehaviorSubject<boolean>(true);
  const currentTabIsOnBlocklist$ = new BehaviorSubject<boolean>(false);
  const clickItemsToAutofillVaultView$ = new BehaviorSubject<boolean>(true);
  const autofillFollowsVaultSortOrder$ = new BehaviorSubject<boolean>(false);
  const autofillSortsByUsername$ = new BehaviorSubject<boolean>(false);
  const configuredSortIsLastUsed$ = new BehaviorSubject<boolean>(true);
  const toggleAutofillSortOrder = jest.fn();

  beforeEach(async () => {
    autofillFollowsVaultSortOrder$.next(false);
    autofillSortsByUsername$.next(false);
    configuredSortIsLastUsed$.next(true);
    toggleAutofillSortOrder.mockClear();

    // Mock getAnimations for all span elements before any components are created
    if (!HTMLSpanElement.prototype.getAnimations) {
      HTMLSpanElement.prototype.getAnimations = jest.fn().mockReturnValue([]);
    }

    jest.spyOn(BrowserPopupUtils, "inSidebar").mockReturnValue(false);
    jest.spyOn(BrowserPopupUtils, "inPopup").mockReturnValue(false);

    await TestBed.configureTestingModule({
      imports: [AutofillVaultListItemsComponent],
      providers: [
        { provide: PasswordRepromptService, useValue: mock<PasswordRepromptService>() },
        { provide: CipherService, useValue: mock<CipherService>() },
        { provide: GlobalStateProvider, useValue: mock<GlobalStateProvider>() },
        {
          provide: AccountService,
          useValue: { activeAccount$: new BehaviorSubject({ id: "acct-id" }) },
        },
        { provide: PlatformUtilsService, useValue: mock<PlatformUtilsService>() },
        { provide: ToastService, useValue: mock<ToastService>() },
        { provide: DialogService, useValue: mock<DialogService>() },
        { provide: I18nService, useValue: { t: (key: string) => key } },
        { provide: CompactModeService, useValue: { enabled$: new BehaviorSubject(false) } },
        { provide: ConfigService, useValue: { getFeatureFlag$: () => new BehaviorSubject(true) } },
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
        {
          provide: VaultPopupItemsService,
          useValue: {
            autoFillCiphers$,
            hasFilterApplied$,
            autofillFollowsVaultSortOrder$,
            autofillSortsByUsername$,
            configuredSortIsLastUsed$,
            toggleAutofillSortOrder,
          },
        },
        {
          provide: VaultPopupAutofillService,
          useValue: {
            autofillAllowed$,
            currentTabIsOnBlocklist$,
            refreshCurrentTab: jest.fn(),
            currentAutofillTab$: of(null),
          },
        },
        {
          provide: VaultSettingsService,
          useValue: { clickItemsToAutofillVaultView$ },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(AutofillVaultListItemsComponent, {
        remove: { imports: [VaultListItemsContainerComponent] },
        add: { imports: [MockVaultListItemsContainerComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AutofillVaultListItemsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe("app-simplified-autofill-info visibility", () => {
    it("is always declared as a static child so it can be projected", async () => {
      autoFillCiphers$.next([]);
      fixture.detectChanges();
      await fixture.whenStable();

      // It must not sit inside an `@if`, otherwise `ng-content select` cannot project it.
      // Whether anything is actually shown is decided by the container.
      expect(
        fixture.debugElement.query(By.directive(SimplifiedAutofillInfoComponent)),
      ).not.toBeNull();
    });

    it("is rendered when ciphers are present", async () => {
      autoFillCiphers$.next([{ type: CipherType.Login } as PopupCipherViewLike]);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(
        fixture.debugElement.query(By.directive(SimplifiedAutofillInfoComponent)),
      ).not.toBeNull();
    });
  });

  describe("autofill sort toggle", () => {
    const sortToggleButton = () =>
      fixture.debugElement.query(By.directive(ChipActionComponent))?.nativeElement as
        | HTMLButtonElement
        | undefined;

    beforeEach(() => {
      autoFillCiphers$.next([{ type: CipherType.Login } as PopupCipherViewLike]);
    });

    it("is always shown when ciphers are present, regardless of the configured sort order", async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(sortToggleButton()).toBeDefined();
    });

    it("offers switching to the configured order while most-recently-used is active", async () => {
      // A meaningful sort order is configured, so the chip offers the setting.
      configuredSortIsLastUsed$.next(false);
      autofillFollowsVaultSortOrder$.next(false);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(sortToggleButton()?.textContent?.trim()).toBe("autofillSortByLastUsed");
    });

    it("offers account ordering while most-recently-used is active and the setting is the default", async () => {
      // Following the setting would be a no-op here, so the chip offers account order.
      configuredSortIsLastUsed$.next(true);
      autofillFollowsVaultSortOrder$.next(false);
      autofillSortsByUsername$.next(false);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(sortToggleButton()?.textContent?.trim()).toBe("autofillSortByLastUsed");
    });

    it("labels the chip by account once account ordering is active", async () => {
      configuredSortIsLastUsed$.next(true);
      autofillSortsByUsername$.next(true);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(sortToggleButton()?.textContent?.trim()).toBe("autofillSortByUsername");
    });

    it("offers switching back to most-recently-used while the configured order is active", async () => {
      configuredSortIsLastUsed$.next(false);
      autofillFollowsVaultSortOrder$.next(true);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(sortToggleButton()?.textContent?.trim()).toBe("autofillSortBySetting");
    });

    it("explains the current state through a tooltip", async () => {
      const tooltipText = () =>
        fixture.debugElement
          .query(By.directive(TooltipDirective))
          ?.injector.get(TooltipDirective).tooltipContent();

      // Default setting, currently most-recently-used => next click sorts by account.
      configuredSortIsLastUsed$.next(true);
      autofillFollowsVaultSortOrder$.next(false);
      autofillSortsByUsername$.next(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(tooltipText()).toBe("autofillSortByUsernameTooltip");

      // Account ordering active => next click goes back to most recent.
      autofillSortsByUsername$.next(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(tooltipText()).toBe("autofillSortByLastUsedTooltip");

      // Meaningful setting configured, currently most-recently-used => next click follows it.
      configuredSortIsLastUsed$.next(false);
      autofillSortsByUsername$.next(false);
      autofillFollowsVaultSortOrder$.next(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(tooltipText()).toBe("autofillSortBySettingTooltip");
    });

    it("delegates toggling to the items service", async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      sortToggleButton()?.click();

      expect(toggleAutofillSortOrder).toHaveBeenCalled();
    });
  });
});
