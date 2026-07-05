import { inject } from "@angular/core";
import { CanActivateFn, Router, UrlTree } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getOptionalUserId } from "@bitwarden/common/auth/services/account.service";
import { UiLockServiceAbstraction } from "@bitwarden/common/key-management/ui-lock";

export function uiLockGuard(): CanActivateFn {
  return async () => {
    const uiLockService = inject(UiLockServiceAbstraction);
    const accountService = inject(AccountService);
    const router = inject(Router);

    const skipCheck = await uiLockService.getSkipCheck();
    if (skipCheck) {
      await uiLockService.setSkipCheck(false);
      return true;
    }

    // getOptionalUserId returns null when no account is active, instead of throwing
    const userId = await firstValueFrom(accountService.activeAccount$.pipe(getOptionalUserId));
    if (!userId) {
      return true;
    }

    const isLocked = await uiLockService.isUiLocked(userId);
    if (isLocked) {
      return router.createUrlTree(["/ui-lock"]) as UrlTree;
    }

    // Reset the lock timer on every successful guard check,
    // so the timeout counts from the last popup interaction, not from unlock.
    await uiLockService.setLastUnlockTime(userId);

    return true;
  };
}