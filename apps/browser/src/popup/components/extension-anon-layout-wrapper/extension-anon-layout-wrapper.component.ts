// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Data, NavigationEnd, Router, RouterModule } from "@angular/router";
import { Subject, filter, switchMap, takeUntil, tap } from "rxjs";

import { BitSvg, svg } from "@bitwarden/assets/svg";

const VaultwardenLogo = svg`
  <svg viewBox="0 0 290 45" xmlns="http://www.w3.org/2000/svg">
    <title>Vaultwarden by HandsomeGuy</title>
    <!-- 盾牌填充色改为 #08a647 -->
    <path fill="#08a647" d="M32.041 24.546V5.95H18.848v33.035c2.336-1.22 4.427-2.547 6.272-3.98 4.614-3.565 6.921-7.051 6.921-10.46Zm5.654-22.314v22.314c0 1.665-.329 3.317-.986 4.953-.658 1.637-1.473 3.09-2.445 4.359-.971 1.268-2.13 2.503-3.475 3.704-1.345 1.2-2.586 2.199-3.725 2.993a46.963 46.963 0 0 1-3.563 2.251c-1.237.707-2.116 1.187-2.636 1.439-.52.251-.938.445-1.252.58-.235.117-.49.175-.765.175s-.53-.058-.766-.174c-.314-.136-.731-.33-1.252-.581-.52-.252-1.398-.732-2.635-1.439a47.003 47.003 0 0 1-3.564-2.251c-1.138-.794-2.38-1.792-3.725-2.993-1.345-1.2-2.503-2.436-3.475-3.704-.972-1.27-1.787-2.722-2.444-4.359C.329 27.863 0 26.211 0 24.546V2.232c0-.504.187-.94.56-1.308A1.823 1.823 0 0 1 1.885.372H35.81c.511 0 .953.184 1.326.552.373.368.56.804.56 1.308Z" />
    <!-- 将文字拆分为两个 tspan，分别控制字号和样式 -->
    <text fill="#08a647" x="48" y="36" font-family="Arial, Helvetica, sans-serif">
        <tspan font-weight="bold" font-style="italic" font-size="48">vault</tspan>
        <tspan font-size="36" dx="2">warden</tspan>
    </text>
</svg>`;
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import {
  SvgModule,
  Translation,
  AnonLayoutComponent,
  AnonLayoutWrapperData,
  AnonLayoutWrapperDataService,
  ANON_LAYOUT_DEFAULTS,
  ContentVerticalPaddingType,
  FooterVerticalPaddingType,
  HeroTextAlignmentType,
  SecondaryContentLocationType,
} from "@bitwarden/components";
import { I18nPipe } from "@bitwarden/ui-common";

import { CurrentAccountComponent } from "../../../auth/popup/account-switching/current-account.component";
import { AccountSwitcherService } from "../../../auth/popup/account-switching/services/account-switcher.service";
import { PopOutComponent } from "../../../platform/popup/components/pop-out.component";
import { PopupHeaderComponent } from "../../../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../../../platform/popup/layout/popup-page.component";

import { EXTENSION_ANON_LAYOUT_DEFAULTS } from "./extension-anon-layout-defaults";

export interface ExtensionAnonLayoutWrapperData extends AnonLayoutWrapperData {
  showAcctSwitcher?: boolean;
  showBackButton?: boolean;
  showLogo?: boolean;
  hideFooter?: boolean;
}

// FIXME(https://bitwarden.atlassian.net/browse/CL-764): Migrate to OnPush
// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
  templateUrl: "extension-anon-layout-wrapper.component.html",
  imports: [
    AnonLayoutComponent,
    CommonModule,
    CurrentAccountComponent,
    I18nPipe,
    SvgModule,
    PopOutComponent,
    PopupPageComponent,
    PopupHeaderComponent,
    RouterModule,
  ],
})
export class ExtensionAnonLayoutWrapperComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  protected showAcctSwitcher: boolean;
  protected showBackButton: boolean;
  protected showLogo: boolean = true;

  protected pageTitle: string;
  protected pageSubtitle: string;
  protected pageIcon: BitSvg;
  protected showReadonlyHostname: boolean;
  protected maxWidth: "md" | "3xl";
  protected hasLoggedInAccount: boolean = false;
  protected hideFooter: boolean;
  protected hideCardWrapper: boolean = false;
  protected hidePageIcon?: boolean;
  protected contentVerticalPadding?: ContentVerticalPaddingType;
  protected footerVerticalPadding?: FooterVerticalPaddingType;
  protected heroTextAlignment?: HeroTextAlignmentType;
  protected secondaryContentLocation?: SecondaryContentLocationType;

  protected theme: string;
  protected logo = VaultwardenLogo;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private i18nService: I18nService,
    private extensionAnonLayoutWrapperDataService: AnonLayoutWrapperDataService,
    private accountSwitcherService: AccountSwitcherService,
  ) {}

  async ngOnInit(): Promise<void> {
    // Set the initial page data on load
    this.setAnonLayoutWrapperDataFromRouteData(this.route.snapshot.firstChild?.data);

    // Listen for page changes and update the page data appropriately
    this.listenForPageDataChanges();
    this.listenForServiceDataChanges();

    this.accountSwitcherService.availableAccounts$
      .pipe(takeUntil(this.destroy$))
      .subscribe((accounts) => {
        this.hasLoggedInAccount = accounts.some((account) => account.id !== "addAccount");
      });
  }

  private listenForPageDataChanges() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        // reset page data on page changes
        tap(() => this.resetPageData()),
        switchMap(() => this.route.firstChild?.data || null),
        takeUntil(this.destroy$),
      )
      .subscribe((firstChildRouteData: Data | null) => {
        this.setAnonLayoutWrapperDataFromRouteData(firstChildRouteData);
      });
  }

  private setAnonLayoutWrapperDataFromRouteData(firstChildRouteData: Data | null) {
    if (!firstChildRouteData) {
      return;
    }

    if (firstChildRouteData["pageTitle"] !== undefined) {
      this.pageTitle = this.handleStringOrTranslation(firstChildRouteData["pageTitle"]);
    }

    if (firstChildRouteData["pageSubtitle"] !== undefined) {
      this.pageSubtitle = this.handleStringOrTranslation(firstChildRouteData["pageSubtitle"]);
    }

    if (firstChildRouteData["pageIcon"] !== undefined) {
      this.pageIcon = firstChildRouteData["pageIcon"];
    }

    // When undefined, fall back to ANON_LAYOUT_DEFAULTS / EXTENSION_ANON_LAYOUT_DEFAULTS — single
    // source of truth for route-init defaults, the reset emission, and the component-level
    // input defaults.
    this.showReadonlyHostname =
      firstChildRouteData["showReadonlyHostname"] ?? ANON_LAYOUT_DEFAULTS.showReadonlyHostname;
    this.maxWidth = firstChildRouteData["maxWidth"] ?? ANON_LAYOUT_DEFAULTS.maxWidth;
    this.hideCardWrapper =
      firstChildRouteData["hideCardWrapper"] ?? ANON_LAYOUT_DEFAULTS.hideCardWrapper;
    this.hidePageIcon = firstChildRouteData["hidePageIcon"] ?? ANON_LAYOUT_DEFAULTS.hidePageIcon;
    this.contentVerticalPadding =
      firstChildRouteData["contentVerticalPadding"] ?? ANON_LAYOUT_DEFAULTS.contentVerticalPadding;
    this.footerVerticalPadding =
      firstChildRouteData["footerVerticalPadding"] ?? ANON_LAYOUT_DEFAULTS.footerVerticalPadding;
    this.heroTextAlignment =
      firstChildRouteData["heroTextAlignment"] ?? ANON_LAYOUT_DEFAULTS.heroTextAlignment;

    this.showAcctSwitcher =
      firstChildRouteData["showAcctSwitcher"] ?? EXTENSION_ANON_LAYOUT_DEFAULTS.showAcctSwitcher;
    this.showBackButton =
      firstChildRouteData["showBackButton"] ?? EXTENSION_ANON_LAYOUT_DEFAULTS.showBackButton;
    this.showLogo = firstChildRouteData["showLogo"] ?? EXTENSION_ANON_LAYOUT_DEFAULTS.showLogo;
    this.hideFooter =
      firstChildRouteData["hideFooter"] ?? EXTENSION_ANON_LAYOUT_DEFAULTS.hideFooter;
    this.secondaryContentLocation =
      firstChildRouteData["secondaryContentLocation"] ??
      ANON_LAYOUT_DEFAULTS.secondaryContentLocation;

    // Cache the route-data payload so resetToCachedRouteData() can later restore it.
    this.extensionAnonLayoutWrapperDataService.cacheRouteData(
      firstChildRouteData as Partial<AnonLayoutWrapperData>,
    );
  }

  private listenForServiceDataChanges() {
    this.extensionAnonLayoutWrapperDataService
      .anonLayoutWrapperData$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: ExtensionAnonLayoutWrapperData) => {
        this.setAnonLayoutWrapperDataFromService(data);
      });
  }

  private setAnonLayoutWrapperDataFromService(data: ExtensionAnonLayoutWrapperData) {
    if (!data) {
      return;
    }

    // Null emissions are used to reset the page data as all fields are optional.

    if (data.pageTitle !== undefined) {
      this.pageTitle =
        data.pageTitle !== null ? this.handleStringOrTranslation(data.pageTitle) : null;
    }

    if (data.pageSubtitle !== undefined) {
      this.pageSubtitle =
        data.pageSubtitle !== null ? this.handleStringOrTranslation(data.pageSubtitle) : null;
    }

    if (data.pageIcon !== undefined) {
      this.pageIcon = data.pageIcon !== null ? data.pageIcon : null;
    }

    if (data.hideFooter !== undefined) {
      this.hideFooter = data.hideFooter !== null ? data.hideFooter : null;
    }

    if (data.showReadonlyHostname !== undefined) {
      this.showReadonlyHostname = data.showReadonlyHostname;
    }

    if (data.hideCardWrapper !== undefined) {
      this.hideCardWrapper = data.hideCardWrapper;
    }

    if (data.showAcctSwitcher !== undefined) {
      this.showAcctSwitcher = data.showAcctSwitcher;
    }

    if (data.showBackButton !== undefined) {
      this.showBackButton = data.showBackButton;
    }

    if (data.showLogo !== undefined) {
      this.showLogo = data.showLogo;
    }

    if (data.hidePageIcon !== undefined) {
      this.hidePageIcon = data.hidePageIcon;
    }
    if (data.contentVerticalPadding !== undefined) {
      this.contentVerticalPadding = data.contentVerticalPadding;
    }
    if (data.footerVerticalPadding !== undefined) {
      this.footerVerticalPadding = data.footerVerticalPadding;
    }
    if (data.heroTextAlignment !== undefined) {
      this.heroTextAlignment = data.heroTextAlignment;
    }
    if (data.secondaryContentLocation !== undefined) {
      this.secondaryContentLocation = data.secondaryContentLocation;
    }
  }

  private handleStringOrTranslation(value: string | Translation): string {
    if (typeof value === "string") {
      // If it's a string, return it as is
      return value;
    }

    // If it's a Translation object, translate it
    return this.i18nService.t(value.key, ...(value.placeholders ?? []));
  }

  private resetPageData() {
    this.pageTitle = null;
    this.pageSubtitle = null;
    this.pageIcon = null;
    this.showReadonlyHostname = null;
    this.showAcctSwitcher = null;
    this.showBackButton = null;
    this.showLogo = null;
    this.maxWidth = null;
    this.hideFooter = null;
    this.hideCardWrapper = null;
    this.hidePageIcon = undefined;
    this.contentVerticalPadding = undefined;
    this.footerVerticalPadding = undefined;
    this.heroTextAlignment = undefined;
    this.secondaryContentLocation = undefined;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
