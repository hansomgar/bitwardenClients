import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { firstValueFrom, Subject, takeUntil } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { UserVerificationService } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { VerificationType } from "@bitwarden/common/auth/enums/verification-type";
import { Verification } from "@bitwarden/common/auth/types/verification";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
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
    private userVerificationService: UserVerificationService,
    private accountService: AccountService,
    private i18nService: I18nService,
    private router: Router,
  ) {}

  async ngOnInit() {
    const userId = await firstValueFrom(this.accountService.activeAccount$.pipe(getUserId));
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

    const userId = await firstValueFrom(this.accountService.activeAccount$.pipe(getUserId));
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
        const failedAttempts = await this.uiLockService.getFailedAttempts(userId);
        if (failedAttempts % 5 === 0) {
          this.errorMessage = this.i18nService.t("uiLockBackoffMessage", "5");
        } else {
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
        const userId = await firstValueFrom(this.accountService.activeAccount$.pipe(getUserId));
        let isValid = false;

        if (value.length >= 12) {
          // Long inputs: try master password first, then PIN
          try {
            const verification: Verification = {
              type: VerificationType.MasterPassword,
              secret: value,
            };
            isValid = await this.userVerificationService.verifyUser(verification);
          } catch {
            // Master password verification failed
          }
          if (!isValid) {
            try {
              isValid = await this.pinService.validatePin(value, userId);
            } catch {
              // PIN validation failed
            }
          }
        } else {
          // Short inputs: only PIN
          isValid = await this.pinService.validatePin(value, userId);
        }

        if (isValid) {
          await chrome.storage.local.set({ [UI_LOCK_AUTO_CHECK_THRESHOLD_KEY]: 4 });
          this.autoCheckThreshold = 4;
          await this.uiLockService.setLastUnlockTime(userId);
          await this.router.navigate(["/tabs/vault"]);
          return;
        }
      } catch {
        // Validation failed silently
      }
      this.autoCheckThreshold++;
      await chrome.storage.local.set({ [UI_LOCK_AUTO_CHECK_THRESHOLD_KEY]: this.autoCheckThreshold });
      this.isAutoChecking = false;
    }
  }
}