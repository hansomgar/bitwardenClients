import { CommonModule } from "@angular/common";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { mock } from "jest-mock-extended";
import { BehaviorSubject } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { FolderApiServiceAbstraction } from "@bitwarden/common/vault/abstractions/folder/folder-api.service.abstraction";
import { FolderService } from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";
import { CipherType } from "@bitwarden/common/vault/enums";
import {
  RestrictedCipherType,
  RestrictedItemTypesService,
} from "@bitwarden/common/vault/services/restricted-item-types.service";
import { ButtonModule, DialogService, MenuModule, NoItemsModule } from "@bitwarden/components";import { GlobalStateProvider } from "@bitwarden/state";
import { FakeGlobalStateProvider } from "@bitwarden/state-test-utils";

import { BrowserApi } from "../../../../../platform/browser/browser-api";
import BrowserPopupUtils from "../../../../../platform/browser/browser-popup-utils";

import { NewItemDropdownComponent, NewItemInitialValues } from "./new-item-dropdown.component";

describe("NewItemDropdownComponent", () => {
  let component: NewItemDropdownComponent;
  let fixture: ComponentFixture<NewItemDropdownComponent>;
  let dialogServiceMock: jest.Mocked<DialogService>;
  let configServiceMock: jest.Mocked<ConfigService>;
  const browserApiMock: jest.Mocked<typeof BrowserApi> = mock<typeof BrowserApi>();
  let restrictedItemTypesServiceMock: jest.Mocked<RestrictedItemTypesService>;

  const mockTab = { url: "https://example.com" };

  const featureFlagSubject = new BehaviorSubject<boolean>(false);
  let navigate: jest.SpyInstance;

  beforeAll(() => {
    jest.spyOn(BrowserApi, "getTabFromCurrentWindow").mockResolvedValue(mockTab as chrome.tabs.Tab);
    jest.spyOn(BrowserPopupUtils, "inPopout").mockReturnValue(false);
    jest.spyOn(Utils, "getHostname").mockReturnValue("example.com");
  });

  beforeEach(async () => {
    dialogServiceMock = mock<DialogService>();
    dialogServiceMock.open.mockClear();
    configServiceMock = mock<ConfigService>();
    configServiceMock.getFeatureFlag$.mockReturnValue(featureFlagSubject.asObservable());
    featureFlagSubject.next(false);

    const activatedRouteMock = {
      snapshot: { paramMap: { get: jest.fn() } },
    };

    const i18nServiceMock = mock<I18nService>();
    // Return the key itself so assertions can identify which string was rendered.
    i18nServiceMock.t.mockImplementation((key: string) => key);
    const folderServiceMock = mock<FolderService>();
    const folderApiServiceAbstractionMock = mock<FolderApiServiceAbstraction>();
    const accountServiceMock = mock<AccountService>();
    restrictedItemTypesServiceMock = {
      restricted$: new BehaviorSubject<RestrictedCipherType[]>([]),
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        JslibModule,
        CommonModule,
        RouterLink,
        ButtonModule,
        MenuModule,
        NoItemsModule,
        NewItemDropdownComponent,
      ],
      providers: [
        { provide: I18nService, useValue: { t: (key: string) => key } },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: DialogService, useValue: dialogServiceMock },
        { provide: I18nService, useValue: i18nServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: BrowserApi, useValue: browserApiMock },
        { provide: FolderService, useValue: folderServiceMock },
        { provide: FolderApiServiceAbstraction, useValue: folderApiServiceAbstractionMock },
        { provide: AccountService, useValue: accountServiceMock },
        { provide: RestrictedItemTypesService, useValue: restrictedItemTypesServiceMock },
        { provide: GlobalStateProvider, useValue: new FakeGlobalStateProvider() },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewItemDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    navigate = jest.spyOn(router, "navigate").mockResolvedValue(true);
  });

  describe("buildQueryParams", () => {
    it("should build query params for a Login cipher when not popped out", async () => {
      await component.ngOnInit();
      component.initialValues = {
        folderId: "222-333-444",
        organizationId: "444-555-666",
        collectionId: "777-888-999",
      } as NewItemInitialValues;

      jest.spyOn(BrowserPopupUtils, "inPopout").mockReturnValue(false);
      jest.spyOn(Utils, "getHostname").mockReturnValue("example.com");

      const params = await component.buildQueryParams(CipherType.Login);

      expect(params).toEqual({
        type: CipherType.Login.toString(),
        collectionId: "777-888-999",
        organizationId: "444-555-666",
        folderId: "222-333-444",
        prefillNameAndURIFromTab: "true",
      });
    });

    it("should build query params for a Login cipher when popped out", async () => {
      component.initialValues = {
        collectionId: "777-888-999",
      } as NewItemInitialValues;

      jest.spyOn(BrowserPopupUtils, "inPopout").mockReturnValue(true);

      const params = await component.buildQueryParams(CipherType.Login);

      expect(params).toEqual({
        type: CipherType.Login.toString(),
        collectionId: "777-888-999",
      });
    });

    it("should build query params for a secure note", async () => {
      component.initialValues = {
        collectionId: "777-888-999",
      } as NewItemInitialValues;

      const params = await component.buildQueryParams(CipherType.SecureNote);

      expect(params).toEqual({
        type: CipherType.SecureNote.toString(),
        collectionId: "777-888-999",
      });
    });

    it("should build query params for an Identity", async () => {
      component.initialValues = {
        collectionId: "777-888-999",
      } as NewItemInitialValues;

      const params = await component.buildQueryParams(CipherType.Identity);

      expect(params).toEqual({
        type: CipherType.Identity.toString(),
        collectionId: "777-888-999",
      });
    });

    it("should build query params for a Card", async () => {
      component.initialValues = {
        collectionId: "777-888-999",
      } as NewItemInitialValues;

      const params = await component.buildQueryParams(CipherType.Card);

      expect(params).toEqual({
        type: CipherType.Card.toString(),
        collectionId: "777-888-999",
      });
    });

    it("should build query params for a SshKey", async () => {
      component.initialValues = {
        collectionId: "777-888-999",
      } as NewItemInitialValues;

      const params = await component.buildQueryParams(CipherType.SshKey);

      expect(params).toEqual({
        type: CipherType.SshKey.toString(),
        collectionId: "777-888-999",
      });
    });

    it("should build query params for a BankAccount", async () => {
      component.initialValues = {
        collectionId: "777-888-999",
      } as NewItemInitialValues;

      const params = await component.buildQueryParams(CipherType.BankAccount);

      expect(params).toEqual({
        type: CipherType.BankAccount.toString(),
        collectionId: "777-888-999",
      });
    });
  });

  describe("add login shortcut", () => {
    const buttons = () => fixture.debugElement.queryAll(By.css("button[bitButton]"));

    /** Looks a button up by its rendered label so assertions never depend on DOM order. */
    const buttonLabelled = (label: string) =>
      buttons().find((b) => (b.nativeElement.textContent || "").trim() === label);

    it("renders the 'new' dropdown first, then the 'login' shortcut", async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const rendered = buttons();
      expect(rendered.length).toBe(2);
      expect(rendered[0].nativeElement.textContent.trim()).toBe("new");
      expect(rendered[1].nativeElement.textContent.trim()).toBe("login");
    });

    it("styles the 'login' shortcut as primary and the dropdown as secondary", async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      // Creating a login is the dominant action, so it carries the primary styling.
      const loginButton = buttonLabelled("login")!.nativeElement as HTMLButtonElement;
      expect(loginButton.className).toContain("tw-bg-bg-brand");

      // The multi-type dropdown is demoted to secondary.
      const newButton = buttonLabelled("new")!.nativeElement as HTMLButtonElement;
      expect(newButton.className).toContain("tw-bg-bg-secondary");
    });

    it("links the shortcut to the add-cipher page for a login", async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const shortcutDebug = buttonLabelled("login")!;
      const shortcut = shortcutDebug.nativeElement as HTMLButtonElement;
      const link = shortcutDebug.injector.get(RouterLink);

      expect(shortcut.textContent.trim()).toBe("login");
      expect(link.urlTree?.toString()).toContain("/add-cipher");
      expect(link.urlTree?.queryParams["type"]).toBe(CipherType.Login.toString());
    });

    it("prefills name and uri from the current tab for the login shortcut", async () => {
      await component.ngOnInit();
      jest.spyOn(BrowserPopupUtils, "inPopout").mockReturnValue(false);
      await fixture.whenStable();
      fixture.detectChanges();

      const link = buttonLabelled("login")!.injector.get(RouterLink);

      expect(link.urlTree?.queryParams["prefillNameAndURIFromTab"]).toBe("true");
    });

    it("hides the shortcut when logins are restricted by policy", async () => {
      (restrictedItemTypesServiceMock.restricted$ as BehaviorSubject<RestrictedCipherType[]>).next([
        { cipherType: CipherType.Login },
      ] as RestrictedCipherType[]);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(buttons().length).toBe(1);
      expect(buttons()[0].nativeElement.textContent.trim()).toBe("new");
    });

    it("hides the shortcut when the new item dialog feature flag is on", () => {
      featureFlagSubject.next(true);
      fixture.detectChanges();

      // The single "new" button navigates straight to the new item page, so no shortcut.
      expect(buttons().length).toBe(1);
    });
  });

  describe("new item types", () => {
    beforeEach(() => {
      featureFlagSubject.next(true);
      fixture.detectChanges();
    });

    it("navigateToNewItemPage navigates to /new-item with initial values as query params", () => {
      component.initialValues = {
        folderId: "folder-1",
        organizationId: "org-1" as any,
        collectionId: "col-1" as any,
      };

      fixture.debugElement.query(By.css("button")).triggerEventHandler("click", null);

      expect(navigate).toHaveBeenCalledWith(["/new-item"], {
        queryParams: {
          folderId: "folder-1",
          organizationId: "org-1",
          collectionId: "col-1",
        },
      });
    });

    it("navigateToNewItemPage passes undefined query params when initialValues is not set", () => {
      component.initialValues = undefined;

      fixture.debugElement.query(By.css("button")).triggerEventHandler("click", null);

      expect(navigate).toHaveBeenCalledWith(["/new-item"], {
        queryParams: {
          folderId: undefined,
          organizationId: undefined,
          collectionId: undefined,
        },
      });
    });
  });
});
