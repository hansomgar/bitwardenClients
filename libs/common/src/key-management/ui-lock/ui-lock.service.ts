import { firstValueFrom, map, Observable } from "rxjs";

import { AccountService } from "../../auth/abstractions/account.service";
import { UserVerificationService } from "../../auth/abstractions/user-verification/user-verification.service.abstraction";
import { VerificationType } from "../../auth/enums/verification-type";
import { Verification } from "../../auth/types/verification";
import { PinServiceAbstraction } from "../pin/pin.service.abstraction";
import { StateProvider } from "../../platform/state";
import { UserId } from "../../types/guid";

import { UI_LOCK_TIMEOUT } from "./ui-lock.state";
import { isUiLockTimeoutNumeric, UiLockTimeout, UiLockTimeoutStringType } from "./ui-lock.types";

const UI_LOCK_LAST_UNLOCK_KEY = "uiLockLastUnlockTime";
const UI_LOCK_FAILED_ATTEMPTS_KEY = "uiLockFailedAttempts";
const UI_LOCK_BACKOFF_UNTIL_KEY = "uiLockBackoffUntil";
const UI_LOCK_SKIP_CHECK_KEY = "uiLockSkipCheck";
const UI_LOCK_MANUAL_LOCK_KEY = "uiLockManuallyLocked";

export abstract class UiLockServiceAbstraction {
  abstract isUiLocked$(userId: UserId): Observable<boolean>;
  abstract isUiLocked(userId: UserId): Promise<boolean>;
  abstract unlock(userId: UserId, pinOrPassword: string): Promise<boolean>;
  abstract setLastUnlockTime(userId: UserId): Promise<void>;
  abstract getUiLockTimeout$(userId: UserId): Observable<UiLockTimeout>;
  abstract setUiLockTimeout(userId: UserId, timeout: UiLockTimeout): Promise<void>;
  abstract getFailedAttempts(userId: UserId): Promise<number>;
  abstract getBackoffUntil(userId: UserId): Promise<number | null>;
  abstract setSkipCheck(skip: boolean): Promise<void>;
  abstract getSkipCheck(): Promise<boolean>;
  abstract lockNow(userId: UserId): Promise<void>;
  abstract clearManualLock(userId: UserId): Promise<void>;
}

export class UiLockService implements UiLockServiceAbstraction {
  private uiLockTimeoutState;

  constructor(
    private stateProvider: StateProvider,
    private pinService: PinServiceAbstraction,
    private userVerificationService: UserVerificationService,
    private accountService: AccountService,
  ) {
    this.uiLockTimeoutState = this.stateProvider.getActive(UI_LOCK_TIMEOUT);
  }

  isUiLocked$(userId: UserId): Observable<boolean> {
    return this.uiLockTimeoutState.state$.pipe(
      map((timeout) => {
        if (timeout == null || timeout === UiLockTimeoutStringType.Never) {
          return false;
        }
        if (!isUiLockTimeoutNumeric(timeout)) {
          // onLocked / onRestart are handled by the background or on restart.
          return false;
        }
        return true;
      }),
    );
  }

  async isUiLocked(userId: UserId): Promise<boolean> {
    const timeout = await firstValueFrom(
      this.uiLockTimeoutState.state$.pipe(map((x) => x ?? UiLockTimeoutStringType.Never)),
    );

    // When timeout is "Never", check if the user manually locked
    if (timeout === UiLockTimeoutStringType.Never) {
      const manualResult = await chrome.storage.local.get(UI_LOCK_MANUAL_LOCK_KEY);
      return (manualResult[UI_LOCK_MANUAL_LOCK_KEY] as boolean) === true;
    }

    // String-based timeouts are handled outside of the regular timer check.
    if (!isUiLockTimeoutNumeric(timeout)) {
      return false;
    }

    const timeoutMinutes = timeout as number;
    if (timeoutMinutes <= 0) {
      return false;
    }

    const result = await chrome.storage.local.get(UI_LOCK_LAST_UNLOCK_KEY);
    const lastUnlockTime = result[UI_LOCK_LAST_UNLOCK_KEY] as number | undefined;

    if (!lastUnlockTime) {
      return true;
    }

    const elapsedMinutes = (Date.now() - lastUnlockTime) / 60000;
    return elapsedMinutes >= timeoutMinutes;
  }

  async unlock(userId: UserId, pinOrPassword: string): Promise<boolean> {
    // Short inputs (< 12 chars) are treated as PIN for backoff purposes
    const isShortPin = pinOrPassword.length < 12;

    // Only short PINs are subject to backoff; long PINs and master passwords bypass
    if (isShortPin) {
      const backoffUntil = await this.getBackoffUntil(userId);
      if (backoffUntil && Date.now() < backoffUntil) {
        return false;
      }
    }

    let verified = false;

    if (isShortPin) {
      // Short inputs can only be PINs
      try {
        verified = await this.pinService.validatePin(pinOrPassword, userId);
      } catch {
        // PIN validation failed
      }
    } else {
      // Long inputs: try master password first, then PIN
      try {
        const verification: Verification = {
          type: VerificationType.MasterPassword,
          secret: pinOrPassword,
        };
        verified = await this.userVerificationService.verifyUser(verification);
      } catch {
        // Master password verification failed
      }

      if (!verified) {
        try {
          verified = await this.pinService.validatePin(pinOrPassword, userId);
        } catch {
          // PIN validation failed
        }
      }
    }

    if (verified) {
      await this.resetFailedAttempts(userId);
      await this.clearManualLock(userId);
      await this.setLastUnlockTime(userId);
      return true;
    }

    // Only short PIN attempts count towards backoff
    if (isShortPin) {
      await this.recordFailedAttempt(userId);
    }
    return false;
  }

  async setLastUnlockTime(userId: UserId): Promise<void> {
    await chrome.storage.local.set({ [UI_LOCK_LAST_UNLOCK_KEY]: Date.now() });
  }

  getUiLockTimeout$(userId: UserId): Observable<UiLockTimeout> {
    return this.uiLockTimeoutState.state$.pipe(map((x) => x ?? UiLockTimeoutStringType.Never));
  }

  async setUiLockTimeout(userId: UserId, timeout: UiLockTimeout): Promise<void> {
    await this.uiLockTimeoutState.update(() => timeout);
  }

  async getFailedAttempts(userId: UserId): Promise<number> {
    const result = await chrome.storage.local.get(UI_LOCK_FAILED_ATTEMPTS_KEY);
    return (result[UI_LOCK_FAILED_ATTEMPTS_KEY] as number) ?? 0;
  }

  async getBackoffUntil(userId: UserId): Promise<number | null> {
    const result = await chrome.storage.local.get(UI_LOCK_BACKOFF_UNTIL_KEY);
    return (result[UI_LOCK_BACKOFF_UNTIL_KEY] as number) ?? null;
  }

  private async recordFailedAttempt(userId: UserId): Promise<void> {
    const failedAttempts = (await this.getFailedAttempts(userId)) + 1;
    await chrome.storage.local.set({ [UI_LOCK_FAILED_ATTEMPTS_KEY]: failedAttempts });

    if (failedAttempts % 5 === 0) {
      const blockNumber = failedAttempts / 5;
      // Escalating backoff: 10s, 30s, 1min, 5min, 15min, 30min, 60min, 120min, then *2
      const baseSequence = [10, 30, 60, 300, 900, 1800, 3600, 7200];
      const backoffSeconds =
        blockNumber <= baseSequence.length
          ? baseSequence[blockNumber - 1]
          : 7200 * Math.pow(2, blockNumber - 8);
      await chrome.storage.local.set({
        [UI_LOCK_BACKOFF_UNTIL_KEY]: Date.now() + backoffSeconds * 1000,
      });
    }
  }

  private async resetFailedAttempts(userId: UserId): Promise<void> {
    await chrome.storage.local.set({
      [UI_LOCK_FAILED_ATTEMPTS_KEY]: 0,
      [UI_LOCK_BACKOFF_UNTIL_KEY]: null,
    });
  }

  async setSkipCheck(skip: boolean): Promise<void> {
    await chrome.storage.local.set({ [UI_LOCK_SKIP_CHECK_KEY]: skip });
  }

  async getSkipCheck(): Promise<boolean> {
    const result = await chrome.storage.local.get(UI_LOCK_SKIP_CHECK_KEY);
    return (result[UI_LOCK_SKIP_CHECK_KEY] as boolean) ?? false;
  }

  async lockNow(userId: UserId): Promise<void> {
    await chrome.storage.local.set({ [UI_LOCK_MANUAL_LOCK_KEY]: true });
    await chrome.storage.local.remove(UI_LOCK_LAST_UNLOCK_KEY);
  }

  async clearManualLock(userId: UserId): Promise<void> {
    await chrome.storage.local.remove(UI_LOCK_MANUAL_LOCK_KEY);
  }
}
