import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { mock, MockProxy } from "jest-mock-extended";
import { of } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { BillingAccountProfileStateService } from "@bitwarden/common/billing/abstractions";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PremiumUpgradePromptService } from "@bitwarden/common/vault/abstractions/premium-upgrade-prompt.service";

import { NewSendDropdownComponent } from "./new-send-dropdown.component";

describe("NewSendDropdownComponent", () => {
  let fixture: ComponentFixture<NewSendDropdownComponent>;
  let component: NewSendDropdownComponent;
  let billingService: MockProxy<BillingAccountProfileStateService>;
  let premiumUpgradeService: MockProxy<PremiumUpgradePromptService>;
  let router: Router;

  const buttons = () =>
    fixture.debugElement
      .queryAll(By.css("button[bitButton]"))
      .map((b) => (b.nativeElement.textContent || "").trim());

  const buttonByLabel = (label: string) =>
    fixture.debugElement
      .queryAll(By.css("button[bitButton]"))
      .find((b) => (b.nativeElement.textContent || "").trim() === label);

  beforeEach(async () => {
    billingService = mock<BillingAccountProfileStateService>();
    premiumUpgradeService = mock<PremiumUpgradePromptService>();

    const accountService = mock<AccountService>();
    accountService.activeAccount$ = of({ id: "user-123" } as any);
    billingService.hasPremiumFromAnySource$.mockReturnValue(of(true));

    const i18nService = mock<I18nService>();
    i18nService.t.mockImplementation((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [NewSendDropdownComponent],
      providers: [
        { provide: BillingAccountProfileStateService, useValue: billingService },
        { provide: AccountService, useValue: accountService },
        { provide: PremiumUpgradePromptService, useValue: premiumUpgradeService },
        { provide: I18nService, useValue: i18nService },
        { provide: Router, useValue: { navigate: jest.fn().mockResolvedValue(true) } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: jest.fn() } } } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(NewSendDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe("default (dropdown) mode", () => {
    it("renders a single dropdown trigger", () => {
      expect(buttons().length).toBe(1);
      expect(buttons()[0]).toBe("new");
    });

    it("does not render the split buttons", () => {
      expect(buttonByLabel("sendTypeFile")).toBeUndefined();
    });

    it("uses 'createSend' as the label when the icon is hidden", () => {
      fixture.componentRef.setInput("hideIcon", true);
      fixture.detectChanges();

      expect(buttons()[0]).toBe("createSend");
    });
  });

  describe("split button mode", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("useSplitButtons", true);
      fixture.componentRef.setInput("buttonType", "primary");
      fixture.detectChanges();
    });

    it("renders file then text, with no dropdown trigger", () => {
      expect(buttons()).toEqual(["sendTypeFile", "sendTypeText"]);
    });

    it("styles the text button as primary and the file button as secondary", () => {
      const fileButton = buttonByLabel("sendTypeFile")!.nativeElement as HTMLButtonElement;
      const textButton = buttonByLabel("sendTypeText")!.nativeElement as HTMLButtonElement;

      expect(textButton.className).toContain("tw-bg-bg-brand");
      expect(fileButton.className).toContain("tw-bg-bg-secondary");
    });

    it("prompts for premium when a file send is attempted without premium", async () => {
      component.hasNoPremium = true;
      fixture.detectChanges();

      await component.sendFileClick();

      expect(premiumUpgradeService.promptForPremium).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it("navigates to the file send form when the user has premium", async () => {
      component.hasNoPremium = false;

      await component.sendFileClick();

      expect(router.navigate).toHaveBeenCalledWith(["/add-send"], {
        queryParams: { type: 1, isNew: true },
      });
    });
  });
});
