// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Data, NavigationEnd, Router, RouterModule } from "@angular/router";
import { Subject, filter, switchMap, takeUntil, tap } from "rxjs";

import { BitSvg, svg } from "@bitwarden/assets/svg";

const VaultwardenLogo = svg`
  <svg version="1.1" viewBox="0 0 385 60" xmlns="http://www.w3.org/2000/svg">
  <title>Vaultwarden</title>
 <g transform="translate(2,4) scale(1.3)"> 
  <!-- 盾牌填充色改为 #08a647 -->
  <path fill="#08a647" d="M32.041 24.546V5.95H18.848v33.035c2.336-1.22 4.427-2.547 6.272-3.98 4.614-3.565 6.921-7.051 6.921-10.46Zm5.654-22.314v22.314c0 1.665-.329 3.317-.986 4.953-.658 1.637-1.473 3.09-2.445 4.359-.971 1.268-2.13 2.503-3.475 3.704-1.345 1.2-2.586 2.199-3.725 2.993a46.963 46.963 0 0 1-3.563 2.251c-1.237.707-2.116 1.187-2.636 1.439-.52.251-.938.445-1.252.58-.235.117-.49.175-.765.175s-.53-.058-.766-.174c-.314-.136-.731-.33-1.252-.581-.52-.252-1.398-.732-2.635-1.439a47.003 47.003 0 0 1-3.564-2.251c-1.138-.794-2.38-1.792-3.725-2.993-1.345-1.2-2.503-2.436-3.475-3.704-.972-1.27-1.787-2.722-2.444-4.359C.329 27.863 0 26.211 0 24.546V2.232c0-.504.187-.94.56-1.308A1.823 1.823 0 0 1 1.885.372H35.81c.511 0 .953.184 1.326.552.373.368.56.804.56 1.308Z" />
 </g>
 <g transform="translate(80,-3) rotate(10)">
     <!-- 齿轮 显示 -->
  <path fill="#08a647" d="m30 .05a.85.85 0 00-.44.37l-1.5 2.5c-.27.022-.53.046-.8.076l-2-2.2a.85.85 0 00-1.4.29l-1 2.8c-.26.074-.51.15-.77.23l-2.4-1.8a.85.85 0 00-1.4.56l-.44 2.9c-.23.12-.47.24-.7.37l-2.7-1.3a.85.85 0 00-1.2.81l.14 3c-.2.16-.4.33-.6.49l-2.9-.72a.85.85 0 00-1 1l.72 2.9c-.17.2-.33.4-.49.6l-3-.14a.85.85 0 00-.81 1.2l1.3 2.7c-.13.23-.25.46-.37.7l-2.9.44a.85.85 0 00-.56 1.4l1.8 2.4c-.081.25-.16.51-.23.77l-2.8 1a.85.85 0 00-.29 1.4l2.2 2c-.03.26-.054.53-.076.8l-2.5 1.5a.85.85 0 000 1.5l2.5 1.5c.022.27.046.53.076.8l-2.2 2a.85.85 0 00.29 1.4l2.8 1c.074.26.15.51.23.77l-1.8 2.4a.85.85 0 00.56 1.4l2.9.44c.12.23.24.47.37.7l-1.3 2.7a.85.85 0 00.81 1.2l3-.14c.16.2.33.4.49.6l-.72 2.9a.85.85 0 001 1l2.9-.72c.2.17.4.33.6.49l-.14 3a.85.85 0 001.2.81l2.7-1.3c.23.13.46.25.7.37l.44 2.9a.85.85 0 001.4.56l2.4-1.8c.25.081.51.16.77.23l1 2.8a.85.85 0 001.4.29l2-2.2c.26.03.53.054.8.076l1.5 2.5a.85.85 0 001.5 0l1.5-2.5c.27-.022.53-.046.8-.076l2 2.2a.85.85 0 001.4-.29l1-2.8c.26-.074.51-.15.77-.23l2.4 1.8a.85.85 0 001.4-.56l.44-2.9c.23-.12.47-.24.7-.37l2.7 1.3a.85.85 0 001.2-.81l-.14-3c.2-.16.4-.33.6-.49l2.9.72a.85.85 0 001-1l-.72-2.9c.17-.2.33-.4.49-.6l3 .14a.85.85 0 00.81-1.2l-1.3-2.7c.13-.23.25-.46.37-.7l2.9-.44a.85.85 0 00.56-1.4l-1.8-2.4c.081-.25.16-.51.23-.77l2.8-1a.85.85 0 00.29-1.4l-2.2-2c.03-.26.054-.53.076-.8l2.5-1.5a.85.85 0 000-1.5l-2.5-1.5c-.022-.27-.046-.53-.076-.8l2.2-2a.85.85 0 00-.29-1.4l-2.8-1c-.074-.26-.15-.51-.23-.77l1.8-2.4a.85.85 0 00-.56-1.4l-2.9-.44c-.12-.23-.24-.47-.37-.7l1.3-2.7a.85.85 0 00-.81-1.2l-3 .14c-.16-.2-.33-.4-.49-.6l.72-2.9a.85.85 0 00-1-1l-2.9.72c-.2-.17-.4-.33-.6-.49l.14-3a.85.85 0 00-1.2-.81l-2.7 1.3c-.23-.13-.46-.25-.7-.37l-.44-2.9a.85.85 0 00-1.4-.56l-2.4 1.8c-.25-.081-.51-.16-.77-.23l-1-2.8a.85.85 0 00-1.4-.29l-2 2.2c-.26-.03-.53-.054-.8-.076l-1.5-2.5a.85.85 0 00-1-.37zm.29 5.4a1.7 1.7 0 011.7 1.7 1.7 1.7 0 01-1.7 1.7 1.7 1.7 0 01-1.7-1.7 1.7 1.7 0 011.7-1.7zm-4 2.9 2.8 2.8a1.7 1.7 0 002.4 0l2.8-2.8c6.6 1.2 12 5.4 15 11l-1.8 3.6a1.7 1.7 0 00.75 2.3l3.6 1.8c.12.92.18 1.9.18 2.8 0 5.8-2.3 11-6 15l-4-.63a1.7 1.7 0 00-2 1.4l-.63 4c-2.8 1.3-6 2.1-9.4 2.1-3.4 0-6.5-.76-9.4-2.1l-.63-4a1.7 1.7 0 00-2-1.4l-4 .63c-3.7-3.9-6-9.2-6-15 0-.96.064-1.9.18-2.8l3.6-1.8a1.7 1.7 0 00.75-2.3l-1.8-3.6c3.1-5.7 8.6-9.8 15-11zm-18 13a1.7 1.7 0 01.48.083 1.7 1.7 0 011.1 2.2 1.7 1.7 0 01-2.2 1.1 1.7 1.7 0 01-1.1-2.2 1.7 1.7 0 011.7-1.2zm43 0a1.7 1.7 0 011.7 1.2 1.7 1.7 0 01-1.1 2.2 1.7 1.7 0 01-2.2-1.1 1.7 1.7 0 011.1-2.2 1.7 1.7 0 01.48-.083zm-35 25a1.7 1.7 0 01.91.32 1.7 1.7 0 01.38 2.4 1.7 1.7 0 01-2.4.38 1.7 1.7 0 01-.38-2.4 1.7 1.7 0 011.5-.7zm27 0a1.7 1.7 0 011.5.7 1.7 1.7 0 01-.38 2.4 1.7 1.7 0 01-2.4-.38 1.7 1.7 0 01.38-2.4 1.7 1.7 0 01.91-.32z"></path>
  <!-- v 显示,已注释 -->
  <!--path fill="#08a647" d="m18 11-5.6.00073 15 42h5.3l15-42h-5.6l-9.5 27c-.63 1.7-1.2 3.4-1.6 4.9-.43 1.5-.79 2.9-1.1 4.3-.28-1.4-.63-2.8-1.1-4.4-.43-1.5-.97-3.2-1.6-5l-9.5-27z"></path-->
  <!-- V 改为真实文本显示 -->
  <text x="11" y="52" fill="#08a647" font-size="58" font-weight="bold" style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;">V</text>
</g>
   <!-- ault 改为真实文本显示 -->
  <text x="132" y="48" fill="#08a647" font-size="52" font-weight="bold" font-style="italic" style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;">ault</text>
  <!-- ault 显示,已注释 -->
  <!--path fill="#08a647" d="m77 46-1.2-3.2h-.17q-1.6 2-3.3 2.8-1.7.77-4.4.77-3.3 0-5.3-1.9-1.9-1.9-1.9-5.4 0-3.7 2.6-5.4 2.6-1.8 7.8-2l4-.12v-1q0-3.5-3.6-3.5-2.8 0-6.6 1.7l-2.1-4.3q4-2.1 8.9-2.1 4.7 0 7.2 2 2.5 2 2.5 6.2v15zm-1.9-11-2.5.083q-2.8.083-4.1 1-1.4.92-1.4 2.8 0 2.7 3.1 2.7 2.2 0 3.5-1.3 1.3-1.3 1.3-3.4zm29 11-.85-3h-.33q-1 1.6-2.9 2.5-1.9.87-4.3.87-4.1 0-6.2-2.2-2.1-2.2-2.1-6.3v-15h6.3v14q0 2.5.89 3.8.89 1.2 2.8 1.2 2.7 0 3.8-1.8 1.2-1.8 1.2-5.9v-11h6.3v23zm18 0h-6.3v-32h6.3zm16-4.6q1.7 0 4-.73v4.7q-2.4 1.1-5.8 1.1-3.8 0-5.6-1.9-1.7-1.9-1.7-5.8v-11h-3v-2.7l3.5-2.1 1.8-4.9h4.1v4.9h6.5v4.8h-6.5v11q0 1.4.75 2 .77.64 2 .64z"></path-->
  <!-- warden 显示 -->
  <path fill="#08a647" d="m254 46-4.2-13q-.4-1.2-1.5-5.6h-.17q-.83 3.6-1.5 5.6l-4.3 13h-4l-6.2-23h3.6q2.2 8.6 3.3 13 1.2 4.5 1.3 6.1h.17q.23-1.2.73-3.1.52-1.9.89-3l4.2-13h3.7l4.1 13q1.2 3.6 1.6 6h.17q.083-.75.44-2.3.37-1.6 4.3-17h3.6l-6.3 23zm29 0-.69-3.2h-.17q-1.7 2.1-3.4 2.9-1.7.75-4.2.75-3.4 0-5.3-1.7-1.9-1.7-1.9-5 0-6.9 11-7.2l3.9-.12v-1.4q0-2.7-1.2-4-1.1-1.3-3.7-1.3-2.8 0-6.4 1.7l-1.1-2.6q1.7-.92 3.7-1.4 2-.52 4-.52 4.1 0 6 1.8 2 1.8 2 5.8v16zm-7.8-2.4q3.2 0 5.1-1.8 1.9-1.8 1.9-4.9v-2.1l-3.5.15q-4.1.15-5.9 1.3-1.8 1.1-1.8 3.5 0 1.9 1.1 2.8 1.1.98 3.2.98zm28-21q1.5 0 2.7.25l-.48 3.2q-1.4-.31-2.5-.31-2.8 0-4.7 2.2-2 2.2-2 5.6v12h-3.5v-23h2.8l.4 4.2h.17q1.3-2.2 3.1-3.4 1.8-1.2 3.9-1.2zm22 20h-.19q-2.4 3.5-7.2 3.5-4.5 0-7-3.1-2.5-3.1-2.5-8.7 0-5.6 2.5-8.8 2.5-3.1 6.9-3.1 4.6 0 7.1 3.4h.27l-.15-1.6-.083-1.6v-9.3h3.5v32h-2.8zm-6.9.58q3.5 0 5.1-1.9 1.6-1.9 1.6-6.2v-.73q0-4.8-1.6-6.9-1.6-2.1-5.1-2.1-3 0-4.7 2.4-1.6 2.3-1.6 6.7 0 4.4 1.6 6.6 1.6 2.2 4.7 2.2zm27 2.9q-5.1 0-8-3.1-2.9-3.1-2.9-8.5 0-5.5 2.7-8.8 2.7-3.2 7.3-3.2 4.3 0 6.8 2.8 2.5 2.8 2.5 7.4v2.2h-16q.1 4 2 6.1 1.9 2.1 5.4 2.1 3.7 0 7.3-1.5v3.1q-1.8.79-3.5 1.1-1.6.35-3.9.35zm-.94-21q-2.7 0-4.4 1.8-1.6 1.8-1.9 4.9h12q0-3.3-1.5-5-1.5-1.7-4.2-1.7zm31 20v-15q0-2.8-1.3-4.2-1.3-1.4-4-1.4-3.6 0-5.2 1.9-1.7 1.9-1.7 6.4v12h-3.5v-23h2.8l.56 3.1h.17q1.1-1.7 3-2.6 1.9-.94 4.3-.94 4.1 0 6.2 2 2.1 2 2.1 6.3v15z"></path>
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
