import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
import { UiLockServiceAbstraction } from "@bitwarden/common/key-management/ui-lock";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import {
  ButtonModule,
  CalloutModule,
  FormFieldModule,
  TypographyModule,
} from "@bitwarden/components";

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
export class UiLockComponent implements OnInit {
  form = this.formBuilder.group({
    pinOrPassword: ["", [Validators.required]],
  });

  protected submitting = false;
  protected errorMessage: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private uiLockService: UiLockServiceAbstraction,
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
  }

  async submit() {
    if (this.form.invalid || this.submitting) {
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    const userId = await firstValueFrom(this.accountService.activeAccount$.pipe(getUserId));
    const pinOrPassword = this.form.value.pinOrPassword;

    const backoffUntil = await this.uiLockService.getBackoffUntil(userId);
    if (backoffUntil && Date.now() < backoffUntil) {
      const remainingSeconds = Math.ceil((backoffUntil - Date.now()) / 1000);
      this.errorMessage = this.i18nService.t("uiLockBackoffMessage", remainingSeconds.toString());
      this.submitting = false;
      return;
    }

    const success = await this.uiLockService.unlock(userId, pinOrPassword);

    if (success) {
      await this.router.navigate(["/tabs/vault"]);
    } else {
      const failedAttempts = await this.uiLockService.getFailedAttempts(userId);
      const remainingAttempts = 5 - failedAttempts;

      if (remainingAttempts > 0) {
        this.errorMessage = this.i18nService.t(
          "uiLockInvalidPinOrPassword",
          remainingAttempts.toString(),
        );
      } else {
        this.errorMessage = this.i18nService.t("uiLockBackoffMessage", "5");
      }
      this.form.reset();
    }

    this.submitting = false;
  }
}