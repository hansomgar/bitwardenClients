import { inject } from "@angular/core";
import { CanActivateFn, Router, UrlTree } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
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

    const userId = await firstValueFrom(accountService.activeAccount$.pipe(getUserId));
    if (!userId) {
      return true;
    }

    const isLocked = await uiLockService.isUiLocked(userId);
    if (isLocked) {
      return router.createUrlTree(["/ui-lock"]) as UrlTree;
    }

    return true;
  };
}