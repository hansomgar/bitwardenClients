import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { firstValueFrom, Subject, takeUntil } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getOptionalUserId } from "@bitwarden/common/auth/services/account.service";
import { PinServiceAbstraction } from "@bitwarden/common/key-management/pin/pin.service.abstraction";
import { UiLockServiceAbstraction } from "@bitwarden/common/key-management/ui-lock";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import {
  ButtonModule,
  CalloutModule,
  FormFieldModule,
  TypographyModule,
} from "@bitwarden/components";

const UI_LOCK_AUTO_CHECK_THRESHOLD_KEY = "uiLockAutoCheckThreshold";
const UI_LOCK_FAILED_ATTEMPTS_KEY = "uiLockFailedAttempts";
const UI_LOCK_BACKOFF_UNTIL_KEY = "uiLockBackoffUntil";

@Component({
  templateUrl: "ui-lock.component.html",
  imports: [
    ButtonModule,
    CalloutModule,
    CommonModule,
    FormFieldModule,
    FormsModule,
    JslibModule,
    ReactiveFormsModule,
    TypographyModule,
  ],
})
export class UiLockComponent implements OnInit, OnDestroy {
  form = this.formBuilder.group({
    pinOrPassword: ["", [Validators.required]],
  });

  protected submitting = false;
  protected errorMessage: string | null = null;

  private autoCheckThreshold = 4;
  private isAutoChecking = false;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private uiLockService: UiLockServiceAbstraction,
    private pinService: PinServiceAbstraction,
    private accountService: AccountService,
    private i18nService: I18nService,
    private router: Router,
  ) {}

  async ngOnInit() {
    const userId = await firstValueFrom(this.accountService.activeAccount$.pipe(getOptionalUserId));
    if (!userId) {
      await this.router.navigate(["/login"]);
      return;
    }

    const isLocked = await this.uiLockService.isUiLocked(userId);

    if (!isLocked) {
      const result = await chrome.storage.local.get("uiLockLastUnlockTime");
      if (result["uiLockLastUnlockTime"]) {
        await this.router.navigate(["/tabs/vault"]);
        return;
      }
    }

    const thresholdResult = await chrome.storage.local.get(UI_LOCK_AUTO_CHECK_THRESHOLD_KEY);
    this.autoCheckThreshold = (thresholdResult[UI_LOCK_AUTO_CHECK_THRESHOLD_KEY] as number) ?? 4;

    this.form.controls.pinOrPassword.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (!value || this.isAutoChecking) {
          return;
        }
        this.tryAutoCheck(value);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async submit() {
    if (this.form.invalid || this.submitting) {
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    const userId = await firstValueFrom(this.accountService.activeAccount$.pipe(getOptionalUserId));
    if (!userId) {
      this.submitting = false;
      return;
    }

    const pinOrPassword = this.form.value.pinOrPassword;
    const isPin = pinOrPassword.length < 12;

    // Only PIN is subject to backoff
    if (isPin) {
      const backoffUntil = await this.uiLockService.getBackoffUntil(userId);
      if (backoffUntil && Date.now() < backoffUntil) {
        const remainingSeconds = Math.ceil((backoffUntil - Date.now()) / 1000);
        this.errorMessage = this.i18nService.t("uiLockBackoffMessage", remainingSeconds.toString());
        this.submitting = false;
        return;
      }
    }

    const success = await this.uiLockService.unlock(userId, pinOrPassword);

    if (success) {
      await chrome.storage.local.set({ [UI_LOCK_AUTO_CHECK_THRESHOLD_KEY]: 4 });
      this.autoCheckThreshold = 4;
      await this.router.navigate(["/tabs/vault"]);
    } else {
      if (isPin) {
        const backoffUntil = await this.uiLockService.getBackoffUntil(userId);
        if (backoffUntil && Date.now() < backoffUntil) {
          const remainingSeconds = Math.ceil((backoffUntil - Date.now()) / 1000);
          this.errorMessage = this.i18nService.t("uiLockBackoffMessage", remainingSeconds.toString());
        } else {
          const failedAttempts = await this.uiLockService.getFailedAttempts(userId);
          const remainingInBlock = 5 - (failedAttempts % 5);
          this.errorMessage = this.i18nService.t(
            "uiLockInvalidPinOrPassword",
            remainingInBlock.toString(),
          );
        }
      } else {
        // Master password failure: no backoff, no remaining count
        this.errorMessage = this.i18nService.t("uiLockInvalidMasterPassword");
      }
      this.form.reset();
    }

    this.submitting = false;
  }

  private async tryAutoCheck(value: string) {
    while (value.length >= this.autoCheckThreshold && !this.isAutoChecking) {
      this.isAutoChecking = true;
      try {
        const userId = await firstValueFrom(this.accountService.activeAccount$.pipe(getOptionalUserId));
        if (!userId) {
          return;
        }

        const isValid = await this.pinService.validatePin(value, userId);
        if (isValid) {
          await chrome.storage.local.set({
            [UI_LOCK_AUTO_CHECK_THRESHOLD_KEY]: 4,
            [UI_LOCK_FAILED_ATTEMPTS_KEY]: 0,
            [UI_LOCK_BACKOFF_UNTIL_KEY]: null,
          });
          this.autoCheckThreshold = 4;
          await this.uiLockService.setLastUnlockTime(userId);
          await this.router.navigate(["/tabs/vault"]);
          return;
        }
      } catch {
        // PIN validation failed silently
      }
      this.autoCheckThreshold++;
      await chrome.storage.local.set({ [UI_LOCK_AUTO_CHECK_THRESHOLD_KEY]: this.autoCheckThreshold });
      this.isAutoChecking = false;
    }
  }
}