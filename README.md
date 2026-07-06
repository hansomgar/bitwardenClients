<p align="center">
  <img src="https://raw.githubusercontent.com/bitwarden/brand/main/screenshots/apps-combo-logo.png" alt="Bitwarden" />
</p>
<p align="center">
  <a href="https://github.com/bitwarden/clients/actions/workflows/build-browser.yml?query=branch:main" target="_blank"><img src="https://github.com/bitwarden/clients/actions/workflows/build-browser.yml/badge.svg?branch=main" alt="GitHub Workflow browser build on main" /></a>
  <a href="https://github.com/bitwarden/clients/actions/workflows/build-cli.yml?query=branch:main" target="_blank"><img src="https://github.com/bitwarden/clients/actions/workflows/build-cli.yml/badge.svg?branch=main" alt="GitHub Workflow CLI build on main" /></a>
  <a href="https://github.com/bitwarden/clients/actions/workflows/build-desktop.yml?query=branch:main" target="_blank"><img src="https://github.com/bitwarden/clients/actions/workflows/build-desktop.yml/badge.svg?branch=main" alt="GitHub Workflow desktop build on main" /></a>
  <a href="https://github.com/bitwarden/clients/actions/workflows/build-web.yml?query=branch:main" target="_blank"><img src="https://github.com/bitwarden/clients/actions/workflows/build-web.yml/badge.svg?branch=main" alt="GitHub Workflow web build on main" /></a>
</p>

---

# Bitwarden Client Applications

This repository houses all Bitwarden client applications except the mobile applications ([iOS](https://github.com/bitwarden/ios) | [android](https://github.com/bitwarden/android)).

Please refer to the [Clients section](https://contributing.bitwarden.com/getting-started/clients/) of the [Contributing Documentation](https://contributing.bitwarden.com/) for build instructions, recommended tooling, code style tips, and lots of other great information to get you started.

## Related projects:

- [bitwarden/server](https://github.com/bitwarden/server): The core infrastructure backend (API, database, Docker, etc).
- [bitwarden/ios](https://github.com/bitwarden/ios): Bitwarden iOS Password Manager & Authenticator apps.
- [bitwarden/android](https://github.com/bitwarden/android): Bitwarden Android Password Manager & Authenticator apps.
- [bitwarden/directory-connector](https://github.com/bitwarden/directory-connector): A tool for syncing a directory (AD, LDAP, Azure, G Suite, Okta) to an organization.

# We're Hiring!

Interested in contributing in a big way? Consider joining our team! We're hiring for many positions. Please take a look at our [Careers page](https://bitwarden.com/careers/) to see what opportunities are [currently open](https://bitwarden.com/careers/#open-positions) as well as what it's like to work at Bitwarden.

# Contribute

Code contributions are welcome! Please commit any pull requests against the `main` branch. Learn more about how to contribute by reading the [Contributing Guidelines](https://contributing.bitwarden.com/contributing/). Check out the [Contributing Documentation](https://contributing.bitwarden.com/) for how to get started with your first contribution.

Security audits and feedback are welcome. Please open an issue or email us privately if the report is sensitive in nature. You can read our security policy in the [`SECURITY.md`](SECURITY.md) file.

---

# 2026-07-05自定义功能增强 (Edge 浏览器扩展)

## 一、自动填充设置增强

### 1.1 禁用 HTTP 页面警告
在自动填充设置页的"附加选项"区域添加了 `disableHttpWarning` 复选框（默认关闭）。开启后，用户在 HTTP 页面上不会再看到"不安全页面"的自动填充警告。

**修改文件：**
| 文件 | 改动 |
|------|------|
| `apps/browser/src/autofill/popup/settings/autofill.component.html` | 添加 checkbox UI |
| `apps/browser/src/autofill/popup/settings/autofill.component.ts` | 绑定表单控件 |
| `libs/common/src/autofill/services/autofill-settings.service.ts` | 新增 `disableHttpWarning` 的 `UserKeyDefinition`（boolean，默认 false） |
| `libs/common/src/autofill/models/autofill-script.ts` | 通过 `AutofillScript` 模型传递到 content script |
| `libs/common/src/autofill/services/insert-autofill-content.service.ts` | `userCancelledInsecureUrlAutofill` 中检查该设置 |
| `apps/browser/src/_locales/en/messages.json` | 添加英文翻译 |
| `apps/browser/src/_locales/zh_CN/messages.json` | 添加中文翻译 |

### 1.2 自动填充列表显示数量配置
在自动填充设置页添加了下拉框，允许用户选择自动填充列表显示数量（1-10，默认 5）。

**修改文件：**
| 文件 | 改动 |
|------|------|
| `apps/browser/src/autofill/popup/settings/autofill.component.html` | 添加下拉框 UI |
| `apps/browser/src/autofill/popup/settings/autofill.component.ts` | 绑定选择值 |
| `libs/common/src/autofill/services/autofill-settings.service.ts` | 新增 `vaultListDisplayCount` 的 `UserKeyDefinition`（number，默认 5，范围 1-10） |
| `apps/browser/src/autofill/background/overlay.background.ts` | 从后台传递到 iframe |
| `apps/browser/src/autofill/overlay/inline-menu/iframe-content/autofill-inline-menu-list-iframe.ts` | 调整 iframe maxHeight 为 650px，接收并传递到列表组件 |
| `apps/browser/src/autofill/overlay/inline-menu/pages/list/autofill-inline-menu-list.ts` | 替换硬编码 `showCiphersPerPage`，一次性加载全部 cipher |
| `apps/browser/src/autofill/overlay/inline-menu/iframe-content/autofill-inline-menu-iframe.service.ts` | 新增 `adjustVaultListDisplayCount` 消息，动态调整逻辑 |
| `apps/browser/src/autofill/overlay/inline-menu/abstractions/autofill-inline-menu-list.ts` | 消息类型新增 `vaultListDisplayCount` 字段和 `adjustVaultListDisplayCount` handler |
| `apps/browser/src/autofill/overlay/inline-menu/pages/list/list.scss` | 移除静态 `max-height` |
| `apps/browser/src/_locales/en/messages.json` | 添加英文翻译 |
| `apps/browser/src/_locales/zh_CN/messages.json` | 添加中文翻译 |

### 1.3 动态列表高度
- 列表高度根据选中数量动态计算（每项 **6.4rem**）
- iframe 容器最大高度设为 **650px**（容纳最多 10 项；经过 180px → 600px → 700px → 650px 多轮调优）
- 移除了静态 CSS `max-height`（原为 18rem），改为 `setProperty('max-height', ..., 'important')` 动态设置
- 同时向 Shadow DOM 注入 `style` 标签覆盖 `.inline-menu-list-actions` 的 `max-height`，实现双层 CSS 硬编码覆盖
- 通过 `postMessage` 实现 iframe 与列表页面通信，根据可用视口高度自动减少显示数量
- 滚动条判断逻辑：`scrollHeight > clientHeight`（替代原硬编码的 `showCiphersPerPage > 3`）
- 所有 cipher 一次性加载，不分页

### 1.4 列表项序号
在 `buildFillCipherElement` 方法中为每个条目添加 `.cipher-index` span 元素（1-based 序号），在 `list.scss` 中添加对应样式。

---

## 二、界面上锁 (UI Lock) 功能

### 2.1 功能概述

类似于手机锁屏，在用户设定时间内未操作扩展弹窗后，自动锁定 UI 界面，需要输入 PIN 码或主密码才能解锁。仅影响弹窗 UI，不影响后台自动填充、密码保存、FIDO2/WebAuthn 等服务。

**计时策略：** 锁定倒计时从用户最后一次在弹窗中操作开始计算（每次打开弹窗或切换标签页时自动重置计时器），而非从解锁那一刻开始。只要用户持续使用弹窗，就不会被锁定。

**默认行为：** 默认选择"从不"，即不会自动上锁，只有用户手动点击"立即上锁"按钮才会锁定。

### 2.2 完整文件清单

**新建文件（6 个）：**

| 文件 | 说明 |
|------|------|
| `libs/common/src/key-management/ui-lock/ui-lock.state.ts` | `UI_LOCK_TIMEOUT` 的 `UserKeyDefinition<UiLockTimeout>`（`UI_LOCK_SETTINGS_DISK`，默认 "never" = 从不） |
| `libs/common/src/key-management/ui-lock/ui-lock.service.ts` | 核心服务：抽象类 `UiLockServiceAbstraction` + 实现类 `UiLockService` |
| `libs/common/src/key-management/ui-lock/index.ts` | Barrel export：导出 `UiLockServiceAbstraction`、`UiLockService`、`UI_LOCK_TIMEOUT` |
| `apps/browser/src/popup/ui-lock/ui-lock.guard.ts` | 路由守卫：`uiLockGuard()` — `CanActivateFn` |
| `apps/browser/src/popup/ui-lock/ui-lock.component.ts` | 解锁页面组件 |
| `apps/browser/src/popup/ui-lock/ui-lock.component.html` | 解锁页面模板 |

**修改文件（7 个）：**

| 文件 | 改动 |
|------|------|
| `apps/browser/src/popup/services/services.module.ts` | DI 注册：`UiLockServiceAbstraction` → `UiLockService` |
| `apps/browser/src/popup/app-routing.module.ts` | 引入 `uiLockGuard`，在根路由和 `/tabs` 路由添加守卫，注册 `/ui-lock` 路由 |
| `apps/browser/src/auth/popup/settings/account-security.component.html` | 添加"界面上锁时间"下拉框 + "立即上锁"按钮 |
| `apps/browser/src/auth/popup/settings/account-security.component.ts` | 注入 `UiLockServiceAbstraction`，绑定 `uiLockTimeout` 表单控件，添加 `lockNow()` 方法 |
| `apps/browser/src/_locales/en/messages.json` | 添加 8 个英文翻译键 |
| `apps/browser/src/_locales/zh_CN/messages.json` | 添加 8 个中文翻译键 |

### 2.3 核心服务详细设计

**文件：** `libs/common/src/key-management/ui-lock/ui-lock.service.ts`

**抽象接口 `UiLockServiceAbstraction`：**
```
isUiLocked$(userId)  → Observable<boolean>   // 响应式检查
isUiLocked(userId)    → Promise<boolean>      // 一次性检查（计算实际时间差）
unlock(userId, pinOrPassword) → Promise<boolean>  // 验证并解锁
setLastUnlockTime(userId)     → Promise<void>      // 记录解锁时间
getUiLockTimeout$(userId)     → Observable<UiLockTimeout>  // 获取超时设置
setUiLockTimeout(userId, timeout) → Promise<void>  // 设置超时
getFailedAttempts(userId)     → Promise<number>      // 获取失败次数
getBackoffUntil(userId)       → Promise<number|null> // 获取退让截止时间
setSkipCheck(skip)            → Promise<void>        // 跳过本次检查
getSkipCheck()                → Promise<boolean>     // 读取跳过标志
lockNow(userId)               → Promise<void>        // 立即上锁
clearManualLock(userId)       → Promise<void>        // 清除手动上锁标记
setPopupOpenedForLockCheck()  → void                 // 设置弹窗打开内存标记（用于 onPopupOpen 选项）
consumePopupOpenedForLockCheck() → boolean           // 消费弹窗打开内存标记
```

**存储架构：**

| 层级 | 存储介质 | 键 | 说明 |
|------|---------|-----|------|
| 设置层 | `StateProvider` (disk) | `uiLockTimeout` | 用户配置的超时选项，默认 "never"（从不） |
| 运行时 | `chrome.storage.local` | `uiLockLastUnlockTime` | 最后解锁时间戳（ms） |
| 运行时 | `chrome.storage.local` | `uiLockFailedAttempts` | 累计失败次数 |
| 运行时 | `chrome.storage.local` | `uiLockBackoffUntil` | 退让截止时间戳（ms） |
| 运行时 | `chrome.storage.local` | `uiLockSkipCheck` | 跳过本次 UI 锁检查 |
| 运行时 | `chrome.storage.local` | `uiLockAutoCheckThreshold` | 自动检测最小字符数阈值，初始 4，失败递增，成功解锁后重置为 4 |
| 运行时 | `chrome.storage.local` | `uiLockManuallyLocked` | 手动/事件上锁标记，任何超时选项下触发 lockNow() 都会设置 |

**`lockNow` 实现：** 设置 `uiLockManuallyLocked = true`，同时清除 `uiLockLastUnlockTime`。

**`isUiLocked` 实现：**
- 首先检查 `uiLockManuallyLocked` 标记。若为 `true` 表示手动/事件上锁，返回已锁定。
- 当超时选项为数字时：读取 `uiLockLastUnlockTime`，计算 `(Date.now() - lastUnlockTime) / 60000`，与 `timeoutMinutes` 比较。若 `lastUnlockTime` 不存在，直接返回 `true`。
- 当超时选项为字符串（`onPopupOpen`/`onLocked`/`onRestart`）时：由对应事件触发上锁，此处不基于时间判定，返回未锁定。

**`unlock` 成功时：** 调用 `clearManualLock()` 清除 `uiLockManuallyLocked` 标记，确保解锁后不再被锁定。

**私有方法 `recordFailedAttempt`：** 失败计数 +1 后写入 `chrome.storage.local`；每 5 次失败触发退让，使用递增序列计算等待时间。

**私有方法 `resetFailedAttempts`：** 同时将 `failedAttempts` 设为 0、`backoffUntil` 设为 null，由 `unlock()` 成功时调用。

### 2.4 上锁/解锁完整流程

#### 上锁流程

UI 锁可以通过以下四种方式触发上锁，最终都调用 `lockNow()`：

```
触发源                          调用链
─────────────────────────────────────────────────────────────
用户点击"立即上锁"按钮           account-security.component.ts
或 Vault 顶部"上锁界面"按钮       vault.component.ts
                                ↓
                            uiLockService.lockNow(userId)
                                ↓
                chrome.storage.local.uiLockManuallyLocked = true
                chrome.storage.local.uiLockLastUnlockTime 删除
                                ↓
                          导航到 /ui-lock
─────────────────────────────────────────────────────────────
系统锁屏/屏保                    idle.background.ts
                                ↓
                            uiLockService.lockNow(userId)
                                ↓
                chrome.storage.local.uiLockManuallyLocked = true
─────────────────────────────────────────────────────────────
浏览器重启（非"从不"选项）        runtime.background.ts
                                ↓
                            uiLockService.lockNow(userId)
                                ↓
                chrome.storage.local.uiLockManuallyLocked = true
─────────────────────────────────────────────────────────────
"弹窗出现时"选项                 AppComponent 构造函数设置内存标记
                                ↓
                            uiLockGuard 检查标记
                                ↓
                            uiLockService.lockNow(userId)
                                ↓
                chrome.storage.local.uiLockManuallyLocked = true
```

上锁后的状态：
- `uiLockManuallyLocked = true`：表示当前处于锁定状态。
- `uiLockLastUnlockTime` 被删除：确保数字超时选项也会判定为锁定。
- 用户再次访问 popup 路由时，`uiLockGuard` 检测到锁定，重定向到 `/ui-lock`。

#### 解锁流程

用户在 `/ui-lock` 页面输入 PIN 或主密码后触发 `submit()`：

```
ui-lock.component.ts submit()
    ↓
检查退让期（backoffUntil）
    ↓
判断输入长度
    ↓
├── 输入长度 < 12 字符
│       ↓
│   只验证 PIN（pinService.validatePin）
│       ↓
│   若失败：failedAttempts +1，可能触发退让
│   若成功：调用 uiLockService.unlock()
│
└── 输入长度 >= 12 字符
        ↓
    先验证主密码（userVerificationService.verifyUser）
        ↓
    若失败，再尝试验证 PIN
        ↓
    若成功：调用 uiLockService.unlock()
        ↓
uiLockService.unlock() 成功
    ↓
resetFailedAttempts()      // failedAttempts=0, backoffUntil=null
clearManualLock()          // uiLockManuallyLocked = false
setLastUnlockTime()        // uiLockLastUnlockTime = Date.now()
    ↓
导航到 /tabs/vault
```

#### 自动检测流程

`ui-lock.component.ts` 订阅输入框 `valueChanges`：

```
输入长度 >= autoCheckThreshold（初始 4）
    ↓
tryAutoCheck(value)
    ↓
while 循环中调用 pinService.validatePin(value)
    ↓
成功：
  - autoCheckThreshold = 4
  - failedAttempts = 0
  - backoffUntil = null
  - clearManualLock()
  - setLastUnlockTime()
  - 导航到 /tabs/vault
失败：
  - autoCheckThreshold +1
  - 持久化到 chrome.storage.local
  - 不显示错误，不计入 failedAttempts
```

#### 守卫放行流程

当用户打开 popup 且未锁定时，守卫会：

```
uiLockGuard 执行
    ↓
检查 skipCheck，若为 true 则重置并放行
    ↓
获取当前用户
    ↓
对 "onPopupOpen" 选项检查内存标记
    ↓
调用 isUiLocked(userId)
    ↓
未锁定：
  - 调用 setLastUnlockTime(userId)  // 重置计时器
  - 放行，用户可继续操作
已锁定：
  - 重定向到 /ui-lock
```

### 2.5 DI 注册

**文件：** `apps/browser/src/popup/services/services.module.ts`

```typescript
import { UiLockServiceAbstraction, UiLockService } from "@bitwarden/common/key-management/ui-lock";

// 在 providers 数组中添加：
safeProvider({
  provide: UiLockServiceAbstraction,
  useClass: UiLockService,
  deps: [StateProvider, PinServiceAbstraction, UserVerificationService, AccountService],
}),
```

### 2.6 路由守卫

**文件：** `apps/browser/src/popup/ui-lock/ui-lock.guard.ts`

`uiLockGuard()` 实现 `CanActivateFn`：
1. 检查 `skipCheck` 标志（`lockNow` 后导航时需要跳过），如果为 `true` 则重置并放行
2. 获取当前用户，调用 `isUiLocked()` 检查
3. 如果已锁定，重定向到 `/ui-lock`
4. 如果未锁定，**重置 `lastUnlockTime` 为当前时间**，然后放行

> **计时策略：** 锁定倒计时从用户**最后一次在弹窗中操作**（即最后一次通过守卫检查）开始计算，而非从解锁那一刻开始。每次用户点击图标打开弹窗或切换标签页时，计时器自动重置。这意味着只要用户持续使用弹窗，就不会被锁定。

**文件：** `apps/browser/src/popup/app-routing.module.ts`

- 引入 `UiLockComponent` 和 `uiLockGuard`
- 根路由 `canActivate` 数组**最前面**添加 `uiLockGuard()`，确保在任何缓存恢复或重定向之前先检查
- `/tabs` 路由也添加 `uiLockGuard()`
- 注册 `/ui-lock` 路由指向 `UiLockComponent`

### 2.7 设置页面

**文件：** `apps/browser/src/auth/popup/settings/account-security.component.html`

布局结构（Tailwind CSS）：
```
[界面上锁时间 标签]
[下拉框 (tw-flex-1)]  [立即上锁按钮]
```

- 将 `<bit-label>` 独立于 `<bit-form-field>` 之外，确保下拉框和按钮在同一行垂直居中
- 按钮使用 `type="button"` 防止默认表单提交行为
- 按钮高度与下拉框一致（`tw-items-center`）

**文件：** `apps/browser/src/auth/popup/settings/account-security.component.ts`

- 注入 `UiLockServiceAbstraction`
- 表单新增 `uiLockTimeout` 控件（默认"从不"）
- `uiLockTimeoutOptions` 使用 `this.i18nService.t("minutes")` 和 `this.i18nService.t("hours")` 显示单位
- 选项：弹窗出现时、1/5/10/30 分钟、1/2/4/8/12/24 小时、系统锁定时、浏览器重启时、从不
- 设置超时后立即调用 `setLastUnlockTime()` 初始化计时器
- `lockNow()` 方法：调用 `uiLockService.lockNow()` → `setSkipCheck(true)` → 导航到 `/ui-lock` → `setTimeout(() => window.close(), 500)`

### 2.8 解锁页面

**文件：** `apps/browser/src/popup/ui-lock/ui-lock.component.html`

- 纯内容布局，无 `<popup-page>` 和 `<popup-header>` 框
- 提示文字使用 `uiLockEnterPinOrPassword` 翻译键
- 密码输入框 `type="password"`，`autofocus` 自动聚焦
- 回车键触发 `submit()`
- 解锁按钮

**文件：** `apps/browser/src/popup/ui-lock/ui-lock.component.ts`

核心逻辑：
- `ngOnInit`：初始化阈值（从 `chrome.storage.local` 读取，默认 4）；检查 `isUiLocked`，如果 `false` 且 `lastUnlockTime` 不存在（刚被 `lockNow` 清除），说明是"立即上锁"场景，跳转到 `/tabs/vault`；订阅 `valueChanges` 触发 `tryAutoCheck`
- `submit()`：区分 PIN（<12字符）/主密码（>=12字符），执行退让检查，调用 `unlock()`；成功时重置 `autoCheckThreshold` 为 4 并持久化，跳转 vault；失败时根据场景显示不同错误消息
- `tryAutoCheck()`：自动检测，见下方
- `ngOnDestroy`：取消 `valueChanges` 订阅

### 2.9 PIN 自动检测

从输入达到 4 位开始，通过 `valueChanges` 订阅自动实时检测 PIN 是否正确。**注意：自动检测仅验证 PIN 码（`pinService.validatePin`），不检查主密码。**

核心实现使用 `while` 循环确保在阈值递增后立即重新检测当前输入值：

```typescript
private async tryAutoCheck(value: string) {
  while (value.length >= this.autoCheckThreshold && !this.isAutoChecking) {
    this.isAutoChecking = true;
    // 调用 pinService.validatePin 验证
    if (valid) {
      // 成功：重置阈值、失败计数、退让，跳转 vault
    } else {
      // 失败：阈值 +1，持久化，无提示，不计入失败计数
    }
    this.isAutoChecking = false;
  }
}
```

| 场景 | 行为 |
|------|------|
| 输入长度 >= 阈值 | 自动调用 `pinService.validatePin()` 检测（仅 PIN，不检测主密码） |
| 正确 | 自动解锁，重置阈值(4)、失败计数(0)、退让(null)，跳转到 `/tabs/vault` |
| 失败 | 阈值 +1 并持久化到 `chrome.storage.local`，不显示错误，不计入失败计数 |
| 阈值规则 | 只增不减，关闭弹窗再打开不重置，唯一回归方法是成功解锁 |
| 并发保护 | `isAutoChecking` 标志 + `while` 循环确保阈值递增后立即重检 |

### 2.10 PIN 与主密码区分

| 输入长度 | 验证顺序 | 退让策略 | 失败计数 |
|---------|---------|---------|---------|
| < 12 字符 | 仅 PIN | 受约束 | 计入 |
| >= 12 字符 | 主密码 → PIN | 不受约束 | 不计入 |

**验证逻辑演进过程：**
1. 初始版本：所有输入先验证 PIN，失败后验证主密码
2. 第一次优化：通过字符长度区分（<12=PIN, >=12=主密码），PIN 受退让约束，主密码不受
3. 第二次优化：<12 字符仅验证 PIN（主密码不可能低于 12 位），>=12 字符优先验证主密码再验证 PIN
4. 最终版本：<12 字符仅 PIN 且计入失败计数，>=12 字符主密码→PIN 且不计入失败计数

### 2.11 退让策略 (Backoff)

仅对短 PIN（< 12 字符）生效，主密码不受退让约束。

**递增退让时间序列：**

```
[10, 30, 60, 300, 900, 1800, 3600, 7200, 14400, 28800, ...]
 10秒 30秒 1分  5分  15分  30分  60分  120分 240分 480分
                                                第9次起 ×2
```

| 退让次数 | 触发失败次数 | 等待时间 |
|---------|------------|---------|
| 第 1 次 | 第 5 次 | 10 秒 |
| 第 2 次 | 第 10 次 | 30 秒 |
| 第 3 次 | 第 15 次 | 1 分钟 |
| 第 4 次 | 第 20 次 | 5 分钟 |
| 第 5 次 | 第 25 次 | 15 分钟 |
| 第 6 次 | 第 30 次 | 30 分钟 |
| 第 7 次 | 第 35 次 | 60 分钟 |
| 第 8 次 | 第 40 次 | 120 分钟 |
| 第 9 次+ | 第 45 次+ | `7200 × 2^(n-8)` 秒（即 240 分钟起，每次 ×2） |

**计算公式：** `blockNumber = failedAttempts / 5`，前 8 次查表，第 9 次起 `7200 * 2^(blockNumber - 8)`。

**实现：** 在 `recordFailedAttempt` 中，`blockNumber = failedAttempts / 5`，查表获取退让秒数。退让期间短 PIN 直接拒绝，显示实际剩余秒数（从 `backoffUntil` 计算）。

**错误提示：**

| 场景 | 消息 |
|------|------|
| 退让中 | "失败次数过多，请等待 X 秒后再试" |
| 退让外，PIN 错误 | "PIN 或密码错误，还剩 X 次尝试机会" |
| 主密码错误 | "主密码错误"（不显示剩余次数） |

### 2.12 UI 锁选项与行为说明

当前 UI 锁超时设置支持下拉选项，默认选中**"从不"。**

| 选项 | 触发条件 | 效果说明 |
|------|---------|---------|
| **弹窗出现时** | 每次新的扩展弹窗被打开 | 新弹窗打开时立即锁定，解锁后当前弹窗内可继续操作；不同浏览器窗口的弹窗各自独立，都需要解锁 |
| **1 分钟 ~ 24 小时** | 距离最后一次通过守卫检查超过设定时间 | 持续使用弹窗时不会锁定；关闭弹窗后超过设定时间再打开会锁定 |
| **系统锁定时** | 操作系统进入锁屏/屏保 | 系统锁屏后立即锁定 UI |
| **浏览器重启时** | 扩展初始化/浏览器重启 | 只要选择非"从不"，重启后首次打开弹窗都会锁定，不论之前是否已超时 |
| **从不** | 不自动触发 | 不会自动锁定；但如果用户手动点了"立即上锁"，锁定状态会持久化，重启后依然锁定 |

**浏览器重启行为：**
- 选择非"从不"时，扩展启动会自动锁定 UI，因此重启后打开弹窗一定需要解锁。
- 选择"从不"时，重启后保持重启前的锁定状态：如果之前手动上锁了，重启后仍锁定；否则保持解锁。

**影响范围：**
UI 锁仅限制手动打开的扩展弹窗（popup），不影响浏览器自动调出的流程，例如自动填充内联菜单、保存/更新密码通知栏、右键菜单自动填充、后台自动填充服务等。

---

## 三、翻译键完整列表

### 自动填充设置

| Key | 英文 | 中文 |
|-----|------|------|
| `disableHttpWarning` | Disable HTTP page warning | 禁用 HTTP 页面警告 |
| `vaultListDisplayCount` | Vault list display count | 列表显示数量 |

### 界面上锁

| Key | 英文 | 中文 |
|-----|------|------|
| `uiLockHeader` | UI Lock | 界面上锁 |
| `uiLockTimeout` | UI Lock Timeout | 界面上锁时间 |
| `uiLockNow` | Lock Now | 立即上锁 |
| `uiLockEnterPinOrPassword` | Enter your PIN or master password | 请输入 PIN 码或主密码 |
| `uiLockConfirmUnlock` | Unlock | 解锁 |
| `uiLockInvalidPinOrPassword` | Invalid PIN or password. $REMAINING$ attempts remaining. | PIN 或密码错误，还剩 $REMAINING$ 次尝试机会 |
| `uiLockInvalidMasterPassword` | Invalid master password | 主密码错误 |
| `uiLockBackoffMessage` | Too many failed attempts. Please wait $SECONDS$ seconds. | 失败次数过多，请等待 $SECONDS$ 秒后再试 |
| `onPopupOpen` | On popup open | 弹窗出现时 |
| `onLocked` | On system lock | 系统锁定时 |
| `onRestart` | On browser restart | 浏览器重启时 |
| `never` | Never | 从不 |

### 风险密码提示

| Key | 英文 | 中文 |
|-----|------|------|
| `atRiskPasswordExposed` | At-risk password (exposed) | 存在风险的密码（已泄露密码） |
| `atRiskPasswordWeak` | At-risk password (weak) | 存在风险的密码（弱密码） |
| `atRiskPasswordReused` | At-risk password (reused) | 存在风险的密码（重复使用密码） |

> **注意：** 带 `$VARIABLE$` 的消息必须声明 `placeholders` 定义，否则扩展加载失败。

---

## 四、关键 Bug 修复记录

| 问题 | 根因 | 修复 |
|------|------|------|
| 1 分钟和 1 小时选项缺少单位 | 使用了单数 key `"minute"`/`"hour"` 不存在 | 改为复数 `"minutes"`/`"hours"` |
| 上锁效果不生效 | `uiLockGuard` 仅在 `/tabs` 路由，且 `setLastUnlockTime` 未在设置后调用 | 根路由添加守卫 + 设置后立即调用 `setLastUnlockTime` |
| 按钮文字不显示 | 缺少 `type="button"` 导致默认提交行为 | 添加 `type="button"` |
| 按钮与下拉框不对齐 | `<bit-label>` 嵌套在 `<bit-form-field>` 内影响高度 | 将 `<bit-label>` 移出独立，使用 `tw-flex tw-items-center` |
| 退让时间显示"等待 5 秒"但实际是 300 秒 | `submit` 中硬编码 `"5"` 秒 | 改为从 `backoffUntil` 计算实际剩余秒数 |
| 自动解锁成功后计数未清零 | `tryAutoCheck` 成功时未重置 `failedAttempts` 和 `backoffUntil` | 成功时同时调用 `resetFailedAttempts` |
| Nx 缓存导致旧代码编译 | Nx 增量编译缓存了旧版本文件 | 重启 dev server 或修改文件触发重编译 |
| UI 锁计时从解锁开始算，而非从操作结束开始 | `setLastUnlockTime` 仅在解锁时调用 | 守卫检查通过时也调用 `setLastUnlockTime`，每次打开弹窗重置计时器 |
| 手动/事件上锁在某些超时选项下不生效 | `isUiLocked` 对字符串类型直接返回 `false` | 将 `uiLockManuallyLocked` 检查提前到最前面，任何超时选项下都优先判断 |
| 密码页面顶部 callout 占用空间且信息重复 | 模板中 `missingWebsite` 和 `changeAtRiskPassword` 两个 callout | 删除两个 callout，风险提示保留在密码输入框下方 |

---

## 五、编译与调试注意事项

1. **编译命令：** `npx nx serve browser --configuration=edge-dev`
2. **Nx 缓存问题：** 修改文件后如果错误仍然提示旧代码，需要重启 dev server 清除缓存
3. **TypeScript 严格模式：** 必须使用枚举值（如 `VerificationType.MasterPassword`）而非字符串字面量
4. **i18n 占位符：** 所有带 `$VARIABLE$` 的翻译消息必须在 `messages.json` 中声明 `placeholders`
5. **组件依赖：** 修改组件模板时需同步更新 `.ts` 文件中的 `imports` 数组
6. **扩展加载路径：** 编译输出在 `dist/apps/browser/edge-dev`，Edge 浏览器加载此目录

---

## 六、复现提示词

以下提示词可用于让 AI 在新的 Bitwarden Clients 代码库中复现以上全部功能：

```
请在 Bitwarden Browser Extension (Edge) 项目中实现以下功能。项目使用 Nx monorepo + Angular + TypeScript + Tailwind CSS。

## 1. 自动填充设置增强

### 1.1 禁用 HTTP 页面警告
- 在 autofill.component.html 的"Additional Options"区域添加一个 checkbox，标签用 i18n key "disableHttpWarning"，绑定到 disableHttpWarning 表单控件
- 在 AutofillSettingsService 中新增 disableHttpWarning 的 UserKeyDefinition（boolean 类型，默认 false）
- 在 AutofillScript 模型中添加 disableHttpWarning 字段
- 在 insert-autofill-content.service.ts 的 userCancelledInsecureUrlAutofill 方法中，检查 disableHttpWarning 设置，如果为 true 则跳过 HTTP 警告
- 在 messages.json（en 和 zh_CN）中添加翻译

### 1.2 自动填充列表显示数量
- 在 autofill.component.html 的"Additional Options"区域添加一个下拉框，标签用 i18n key "vaultListDisplayCount"，可选值 1-10，默认 5
- 在 AutofillSettingsService 中新增 vaultListDisplayCount 的 UserKeyDefinition（number 类型，默认 5，范围 1-10）
- 数据流：overlay.background.ts → autofill-inline-menu-list-iframe.ts → autofill-inline-menu-list.ts
- 替换 autofill-inline-menu-list.ts 中的硬编码 showCiphersPerPage，一次性加载全部 cipher
- 动态计算列表高度：每项 6.4rem，iframe 最大高度 650px（在 autofill-inline-menu-list-iframe.ts 中修改）
- 移除 list.scss 中 .inline-menu-list-actions 的静态 max-height，改为 JS 通过 setProperty('max-height', ..., 'important') 动态设置
- 根据可用视口高度（viewportHeight - iframe.top）自动减少显示数量，通过 postMessage 发送 adjustVaultListDisplayCount 消息
- 在 autofill-inline-menu-iframe.service.ts 中新增 adjustVaultListDisplayCount 消息处理逻辑
- 滚动条逻辑改为 scrollHeight > clientHeight
- 在 messages.json 中添加翻译

### 1.3 列表项序号
- 在 buildFillCipherElement 方法中为每个条目添加 .cipher-index span 元素，显示 1-based 序号
- 在 list.scss 中添加 .cipher-index 样式

## 2. 界面上锁 (UI Lock) 功能

### 2.1 新建文件

**libs/common/src/key-management/ui-lock/ui-lock.types.ts:**
- 定义 UiLockTimeout 联合类型：number | "onPopupOpen" | "onLocked" | "onRestart" | "never"
- 定义 UiLockTimeoutStringType 常量对象
- 实现 isUiLockTimeoutNumeric 类型守卫函数

**libs/common/src/key-management/ui-lock/ui-lock.state.ts:**
- 创建 UI_LOCK_TIMEOUT 的 UserKeyDefinition<UiLockTimeout>，使用 UI_LOCK_SETTINGS_DISK，默认值为 "never"，deserializer: (value) => value ?? "never"

**libs/common/src/key-management/ui-lock/ui-lock.service.ts:**
- 创建抽象类 UiLockServiceAbstraction，定义接口：isUiLocked$, isUiLocked, unlock, setLastUnlockTime, getUiLockTimeout$, setUiLockTimeout, getFailedAttempts, getBackoffUntil, setSkipCheck, getSkipCheck, lockNow, clearManualLock
- 创建实现类 UiLockService，构造函数注入 StateProvider, PinServiceAbstraction, UserVerificationService, AccountService
- 使用 chrome.storage.local 存储运行时状态，键名：uiLockLastUnlockTime, uiLockFailedAttempts, uiLockBackoffUntil, uiLockSkipCheck, uiLockManuallyLocked
- isUiLocked: 首先检查 uiLockManuallyLocked 标记；对数字超时读取 lastUnlockTime 计算时间差；字符串类型（onPopupOpen/onLocked/onRestart）由事件/守卫触发
- unlock: 区分 PIN（<12字符）和主密码（>=12字符），PIN 先验证 pinService.validatePin，主密码先验证 userVerificationService.verifyUser(VerificationType.MasterPassword)，失败后尝试 PIN；成功时调用 clearManualLock()
- recordFailedAttempt: 仅 `<12` 字符计入，每 5 次触发退让，使用递增序列 [10,30,60,300,900,1800,3600,7200]，第9次起 ×2
- lockNow: 设置 uiLockManuallyLocked=true，删除 uiLockLastUnlockTime
- clearManualLock: 清除 uiLockManuallyLocked 标记

**libs/common/src/key-management/ui-lock/index.ts:**
- 导出 UiLockServiceAbstraction, UiLockService, UI_LOCK_TIMEOUT, UiLockTimeout, UiLockTimeoutStringType, isUiLockTimeoutNumeric

**apps/browser/src/popup/ui-lock/ui-lock.guard.ts:**
- 实现 uiLockGuard() 返回 CanActivateFn
- 检查 skipCheck，如果 true 则重置并放行
- 对 "onPopupOpen" 选项检查内存标记 popupOpenedForLockCheck，若存在则调用 lockNow() 并重定向到 /ui-lock
- 获取当前用户，调用 isUiLocked，如果锁定则重定向到 /ui-lock
- 检查通过后调用 setLastUnlockTime() 重置计时器

**apps/browser/src/popup/ui-lock/ui-lock.component.html:**
- 纯内容布局，无 <popup-page> 和 <popup-header>
- 提示文字使用 uiLockEnterPinOrPassword 翻译
- 密码输入框 type=password autofocus，回车触发 submit()
- 解锁按钮

**apps/browser/src/popup/ui-lock/ui-lock.component.ts:**
- 实现 ngOnInit: 检查 isUiLocked，若 false 且无 lastUnlockTime（lockNow 场景）则跳转 /tabs/vault
- 实现 submit(): 区分 PIN/主密码，退让检查，调用 unlock()
- 实现 tryAutoCheck(): 从 4 位开始自动检测，阈值持久化到 chrome.storage.local（键 uiLockAutoCheckThreshold），失败阈值+1，成功重置为 4
- 自动检测成功时同时重置 failedAttempts 和 backoffUntil

### 2.2 修改现有文件

**apps/browser/src/popup/services/services.module.ts:**
- 导入 UiLockServiceAbstraction, UiLockService
- 注册 safeProvider: UiLockServiceAbstraction → UiLockService, deps: [StateProvider, PinServiceAbstraction, UserVerificationService, AccountService]

**apps/browser/src/popup/app-routing.module.ts:**
- 导入 UiLockComponent, uiLockGuard
- 根路由 canActivate 最前面添加 uiLockGuard()
- /tabs 路由 canActivate 添加 uiLockGuard()
- 注册 /ui-lock 路由指向 UiLockComponent

**apps/browser/src/auth/popup/settings/account-security.component.html:**
- 在 session timeout 下方添加"界面上锁时间"下拉框和"立即上锁"按钮
- 布局：<bit-label> 独立于 <bit-form-field>，下拉框和按钮使用 tw-flex tw-items-center tw-gap-3，按钮靠右
- 按钮 type="button" 使用 i18n key "uiLockNow"

**apps/browser/src/auth/popup/settings/account-security.component.ts:**
- 注入 UiLockServiceAbstraction
- 表单新增 uiLockTimeout 控件（默认 "never"）
- uiLockTimeoutOptions 使用 i18nService.t("minutes")/i18nService.t("hours") 显示单位
- 选项值："onPopupOpen", 1,5,10,30,60,120,240,480,720,1440, "onLocked", "onRestart", "never"
- 设置数字超时后立即调用 setLastUnlockTime()
- lockNow(): lockNow() → setSkipCheck(true) → router.navigate(['/ui-lock']) → setTimeout(() => window.close(), 500)

**apps/browser/src/_locales/en/messages.json 和 zh_CN/messages.json:**
- 添加所有翻译键（见翻译键列表），带 $VARIABLE$ 的键必须添加 placeholders 定义

### 2.3 上锁/解锁逻辑

#### 上锁流程

所有上锁最终都调用 `uiLockService.lockNow(userId)`，执行以下原子操作：

```
lockNow(userId)
  → chrome.storage.local.uiLockManuallyLocked = true
  → chrome.storage.local.uiLockLastUnlockTime 删除
```

触发 `lockNow()` 的四种场景：

1. **手动上锁**：用户点击设置页"立即上锁"按钮或 Vault 顶部"上锁界面"按钮。
2. **系统锁定时**：`idle.background.ts` 监听到 `chrome.idle.onStateChanged === "locked"` 且用户选项为 `"onLocked"`。
3. **浏览器重启时**：`runtime.background.ts` 的 `init()` 中对所有 `uiLockTimeout !== "never"` 的用户调用。
4. **弹窗出现时**：`AppComponent` 构造函数设置内存标记 `popupOpenedForLockCheck`，`uiLockGuard` 对 `"onPopupOpen"` 选项检查到标记后调用。

上锁后用户访问任何 popup 路由都会先进入 `uiLockGuard`，守卫检测到锁定后重定向到 `/ui-lock`。

#### 守卫流程

```
uiLockGuard 执行
  → 检查 uiLockSkipCheck，若为 true 则重置并放行（用于 lockNow 后导航）
  → 获取当前活跃用户 userId
  → 若 consumeSkipAfterSessionUnlock() 返回 true（刚解锁会话锁）
       → 调用 clearManualLock(userId) 清除手动上锁标志
       → 调用 setLastUnlockTime(userId) 重置计时器，放行
  → 若 uiLockTimeout === "onPopupOpen" 且 consumePopupOpenedForLockCheck() 返回 true
       → 调用 lockNow(userId)
       → 重定向到 /ui-lock
  → 调用 isUiLocked(userId)
       → true：重定向到 /ui-lock
       → false：调用 setLastUnlockTime(userId) 重置计时器，放行
```

#### 解锁流程

在 `/ui-lock` 页面，用户输入 PIN 或主密码后触发 `submit()`：

```
submit(value)
  → 检查 backoffUntil：若仍在退让期内，直接显示剩余秒数错误
  → 判断输入长度
       ├── < 12 字符：只验证 PIN（pinService.validatePin）
       │             失败：failedAttempts +1，可能触发退让
       │             成功：进入 unlock 成功处理
       └── >= 12 字符：先验证主密码（userVerificationService.verifyUser）
                      主密码失败：再尝试 PIN
                      任一成功：进入 unlock 成功处理
                       都失败：显示主密码错误（不计入失败次数、不退让）

unlock 成功处理
  → resetFailedAttempts()    // failedAttempts=0, backoffUntil=null
  → clearManualLock()        // uiLockManuallyLocked=false
  → setLastUnlockTime()      // lastUnlockTime=Date.now()
  → 导航到 /tabs/vault
```

#### 会话锁解锁后跳过 UI 锁

当用户在 `/lock` 页面通过主密码/PIN/生物识别解锁会话锁后：

```
LockComponent 解锁成功
  → this.messagingService.send("unlocked")
  → runtime.background.ts 处理 "unlocked" 消息
       → uiLockService.setSkipAfterSessionUnlock()
       → 在 chrome.storage.session 写入一次性标记
  → LockComponent 导航到 /tabs/current 或之前的 URL
  → uiLockGuard 执行
       → consumeSkipAfterSessionUnlock() 返回 true
       → 调用 clearManualLock() 清除 uiLockManuallyLocked 标志
       → 调用 setLastUnlockTime() 刷新计时器
       → 放行
```

这样用户从会话锁进入主界面时，不会立即再弹出 UI 锁输入框。该标记为一次性，消费后立即清除；弹窗关闭或刷新后失效。

#### 自动检测流程

`ui-lock.component.ts` 订阅输入框 `valueChanges`：

```
输入长度 >= autoCheckThreshold（初始 4，存储键 uiLockAutoCheckThreshold）
  → tryAutoCheck(value)
       → while 循环调用 pinService.validatePin(value)
            成功：
              - autoCheckThreshold = 4
              - failedAttempts = 0
              - backoffUntil = null
              - clearManualLock()
              - setLastUnlockTime()
              - 导航到 /tabs/vault
            失败：
              - autoCheckThreshold +1
              - 持久化到 chrome.storage.local
              - 不显示错误，不计入 failedAttempts
```

#### 浏览器重启与系统锁定

- **浏览器重启**：扩展启动时遍历所有用户，只要 `uiLockTimeout !== "never"` 就调用 `lockNow()`。因此选择数字超时、`onLocked`、`onRestart` 中的任意一项，重启后打开弹窗都需要解锁；选择 `"从不"` 则保持重启前状态。
- **系统锁定**：操作系统进入锁屏时，对所有 `"onLocked"` 用户调用 `lockNow()`。

### 2.4 后台事件处理

**浏览器重启时上锁：**
- 在 runtime.background.ts 的 init() 中，扩展启动后遍历所有用户
- 对任何 uiLockTimeout !== "never" 的用户调用 lockNow()
- 因此选择非"从不"时，浏览器重启后打开弹窗一定需要解锁

**系统锁定时上锁：**
- 在 idle.background.ts 中监听 chrome.idle.onStateChanged
- 当 newState === "locked" 且用户 uiLockTimeout === "onLocked" 时调用 lockNow()

**弹窗出现时上锁：**
- 在 AppComponent 构造函数中设置内存标记 popupOpenedForLockCheck（每个弹窗实例独立）
- uiLockGuard 检查到 "onPopupOpen" 且标记存在时调用 lockNow() 并重定向到 /ui-lock
- 不同浏览器窗口的弹窗各自独立触发

### 2.5 影响范围

- UI 锁只限制手动打开的扩展弹窗（popup）
- 不影响自动填充内联菜单、保存/更新密码通知栏、右键菜单自动填充、后台自动填充、FIDO2/WebAuthn 等服务

### 2.6 编译验证
- 运行 npx nx serve browser --configuration=edge-dev
- 确保 TypeScript 使用枚举值（VerificationType.MasterPassword）而非字符串字面量
- 确保所有 i18n 占位符已定义
- 注意 Nx 缓存可能导致旧代码编译，必要时重启 dev server

## 3. 密码库顶部菜单添加锁定按钮

### 3.1 在 vault.component.html 中添加按钮
- 在密码库顶部导航栏中，密码库标题右侧添加两个 bitIconButton 按钮
- 第一个按钮：icon="bwi-lock"，title 使用 i18n key "lockSession"，click 触发 lockSession()
- 第二个按钮：icon="bwi-eye-slash"，title 使用 i18n key "lockUi"，click 触发 lockUi()

### 3.2 在 vault.component.ts 中添加方法
- 注入 LockService, AccountService, UiLockServiceAbstraction
- 新增 lockSession() 方法：获取 activeAccount userId，调用 lockService.lock(userId)
- 新增 lockUi() 方法：调用 uiLockService.lockNow()，设置 skipCheck(true)，导航到 /ui-lock，500ms 后关闭弹窗

### 3.3 添加翻译键
- 在 messages.json（en 和 zh_CN）中添加 lockSession 和 lockUi 的翻译

## 4. UI 锁界面添加会话锁定按钮

### 4.1 修改 extension-anon-layout-wrapper.component.html
- 在 VaultwardenLogo 右侧添加 bitIconButton 按钮
- 使用 *ngIf="showLockSessionButton" 控制显示
- icon="bwi-lock"，title 使用 i18n key "lockSession"，click 触发 lockSession()

### 4.2 修改 extension-anon-layout-wrapper.component.ts
- 注入 LockService, AccountService
- 新增 showLockSessionButton 字段（默认 false）
- 新增 lockSession() 方法：获取 activeAccount userId，调用 lockService.lock(userId)
- 在 ExtensionAnonLayoutWrapperData 接口中添加 showLockSessionButton 可选属性
- 在 setAnonLayoutWrapperDataFromRouteData 和 handleExtensionAnonLayoutWrapperDataServiceUpdate 中读取该字段

### 4.3 修改 extension-anon-layout-defaults.ts
- 在 EXTENSION_ANON_LAYOUT_DEFAULTS 中添加 showLockSessionButton: false

### 4.4 修改 app-routing.module.ts
- 在 /ui-lock 路由的 data 中设置 showLockSessionButton: true

```

---

## 七、风险密码提示优化

### 7.1 功能概述
将密码库详情页中密码输入框下方的"存在风险的密码"提示，改为按风险类型分类显示，并使用不同颜色的图标区分优先级。

### 7.2 风险类型及优先级（从高到低）

| 优先级 | 类型 | 判断条件 | 图标颜色 |
|--------|------|---------|---------|
| 1 | 已泄露密码 (exposed) | `exposed_result.type === "Found" && exposed_result.value > 0` | 红色 (`tw-text-danger`) |
| 2 | 弱密码 (weak) | `password_strength < 3` | 橙色 (`tw-text-warning`) |
| 3 | 重复使用密码 (reused) | `reuse_count > 1` | 黄色 (`tw-text-[#b8960a]`) |

- 如果密码同时存在多种风险，只显示优先级最高的那个类型
- 显示格式：`存在风险的密码（已泄露密码）` / `At-risk password (exposed)`

### 7.3 修改文件清单

| 文件 | 改动 |
|------|------|
| `libs/common/src/vault/abstractions/cipher-risk.service.ts` | 新增 `PasswordRiskType` 类型和 `getPasswordRiskType()` 函数，按优先级返回风险类型 |
| `libs/vault/src/cipher-view/cipher-view.component.ts` | 新增 `passwordRiskResult` 和 `passwordRiskType` 信号，传递给子组件；删除 `removeAtRiskCallout` 及相关 `FeatureFlag`/`ConfigService` 依赖 |
| `libs/vault/src/cipher-view/cipher-view.component.html` | 删除顶部 `missingWebsite` 和 `changeAtRiskPassword` 两个 callout；向子组件传递 `passwordRiskType` |
| `libs/vault/src/cipher-view/login-credentials/login-credentials-view.component.ts` | 新增 `@Input() passwordRiskType`、`riskTypeMessage` getter 和 `riskIconColor` getter |
| `libs/vault/src/cipher-view/login-credentials/login-credentials-view.component.html` | 风险提示从固定 `atRiskPassword` 改为 `riskTypeMessage` 动态显示；图标颜色从固定 `tw-text-warning` 改为 `[ngClass]="riskIconColor"` |
| `apps/browser/src/_locales/en/messages.json` | 新增 3 个翻译键 |
| `apps/browser/src/_locales/zh_CN/messages.json` | 新增 3 个翻译键 |

### 7.4 核心实现

**`getPasswordRiskType()` 函数：**
```typescript
export type PasswordRiskType = "exposed" | "weak" | "reused";

export function getPasswordRiskType(risk: CipherRiskResult): PasswordRiskType | null {
  if (risk.exposed_result.type === "Found" && risk.exposed_result.value > 0) {
    return "exposed";
  }
  if (risk.password_strength < 3) {
    return "weak";
  }
  if ((risk.reuse_count ?? 1) > 1) {
    return "reused";
  }
  return null;
}
```

**`riskIconColor` getter（图标颜色映射）：**
```typescript
get riskIconColor(): string {
  switch (this.passwordRiskType) {
    case "exposed": return "tw-text-danger";      // 红色
    case "weak":    return "tw-text-warning";      // 橙色
    case "reused":  return "tw-text-[#b8960a]";    // 黄色
    default:        return "tw-text-warning";
  }
}
```

### 7.5 新增翻译键

| Key | 英文 | 中文 |
|-----|------|------|
| `atRiskPasswordExposed` | At-risk password (exposed) | 存在风险的密码（已泄露密码） |
| `atRiskPasswordWeak` | At-risk password (weak) | 存在风险的密码（弱密码） |
| `atRiskPasswordReused` | At-risk password (reused) | 存在风险的密码（重复使用密码） |

### 7.6 删除的功能
- 密码详情页顶部的"更改存在风险的密码" callout 提示框（`changeAtRiskPassword`）
- 密码详情页顶部的"缺失网站" callout 提示框（`missingWebsite`）
- `removeAtRiskCallout` 信号及相关的 `FeatureFlag.PM32016RemoveAtRiskCallout` 和 `ConfigService` 依赖

---

## 八、密码库顶部菜单添加锁定按钮

在浏览器插件主界面（密码库）的顶部导航栏中添加了两个锁定按钮：

- **上锁会话**：立即锁定整个用户会话，需要重新输入主密码
- **上锁界面**：立即锁定当前弹窗界面，并根据 UI 锁超时设置决定下次打开弹窗时是否需要解锁

## 九、UI 锁计时策略优化

### 9.1 功能概述
将 UI 锁的计时起点从"解锁那一刻"改为"用户最后一次在弹窗中操作"，每次用户打开弹窗或切换标签页时自动重置计时器。

### 9.2 修改文件

| 文件 | 改动 |
|------|------|
| `apps/browser/src/popup/ui-lock/ui-lock.guard.ts` | 守卫检查通过后调用 `setLastUnlockTime(userId)` 重置计时器 |

### 9.3 计时逻辑
```
用户解锁 → 操作弹窗 → 每次打开/切换标签页时计时器自动重置
用户关闭弹窗 → 计时器从最后一次操作开始倒计时
用户在超时前再次打开弹窗 → 计时器重新归零
```

## 十、UI 锁界面添加会话锁定按钮

在界面锁定（UI Lock）页面的顶部导航栏中添加了"上锁会话"按钮，用户在界面锁定状态下可以直接点击该按钮立即锁定整个会话。

---

## 十一、UI 锁选项扩展（最新）

### 11.1 新增选项

在原有的数字超时和"从不"基础上，界面上锁下拉框新增了以下选项：

- **弹窗出现时**：每次打开新的扩展弹窗时立即上锁，解锁后当前弹窗内可继续操作；不同浏览器窗口的弹窗各自独立触发。
- **系统锁定时**：操作系统进入锁屏或屏保时立即上锁。
- **浏览器重启时**：扩展初始化时上锁；并且只要选择非"从不"，浏览器重启后都会自动上锁。

### 11.2 默认选项

界面上锁默认选择 **"从不"**，不会自动锁定，只有用户手动触发"立即上锁"才会锁定。

### 11.3 浏览器重启行为

- **非"从不"**：扩展启动时自动对所有相关用户上锁，因此重启后打开弹窗一定需要解锁，不依赖之前是否已超时。
- **"从不"**：重启后保持重启前的状态。如果之前手动上锁了，重启后仍锁定；否则保持解锁。

### 11.4 影响范围

UI 锁仅限制手动打开的扩展弹窗（popup），不影响浏览器自动调出的流程，例如自动填充内联菜单、保存/更新密码通知栏、右键菜单自动填充、后台自动填充、FIDO2/WebAuthn 等服务。

### 11.5 会话锁与界面锁的联动

当用户通过解锁会话锁（vault lock）进入主界面时，自动跳过本次 UI 锁检查，避免用户连续输入两次密码/PIN。

实现方式：
- 会话锁解锁成功后，background 向 `chrome.storage.session` 写入一次性标记。
- 弹窗路由守卫在检查 UI 锁前先消费该标记。
- 如果标记存在，则调用 `clearManualLock()` 清除 `uiLockManuallyLocked` 标志，并刷新 `uiLockLastUnlockTime`，然后放行；否则继续走正常的 UI 锁判定流程。
- 该标记仅在一次导航中有效，弹窗关闭或刷新后即失效。

---

## 十二、插件图标徽章数字显示优化

### 12.1 功能说明

当浏览器插件检测到当前页面有可自动填充的账号时，插件图标下方会显示建议账号数量。

### 12.2 显示规则

| 建议账号数量 | 图标显示 |
|---|---|
| 0 | 不显示数字 |
| 1 ~ 99 | 显示实际数量 |
| ≥ 100 | 显示 `99+` |

### 12.3 行为示例

- 当前页面匹配到 5 个账号：图标显示 `5`
- 当前页面匹配到 50 个账号：图标显示 `50`
- 当前页面匹配到 150 个账号：图标显示 `99+`
