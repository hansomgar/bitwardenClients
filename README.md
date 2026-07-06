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
在自动填充设置页添加了下拉框，允许用户选择自动填充列表显示数量（1-10，默认 3）。

**修改文件：**
| 文件 | 改动 |
|------|------|
| `apps/browser/src/autofill/popup/settings/autofill.component.html` | 添加下拉框 UI |
| `apps/browser/src/autofill/popup/settings/autofill.component.ts` | 绑定选择值 |
| `libs/common/src/autofill/services/autofill-settings.service.ts` | 新增 `vaultListDisplayCount` 的 `UserKeyDefinition`（number，默认 3，范围 1-10） |
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

### 2.2 完整文件清单

**新建文件（6 个）：**

| 文件 | 说明 |
|------|------|
| `libs/common/src/key-management/ui-lock/ui-lock.state.ts` | `UI_LOCK_TIMEOUT` 的 `UserKeyDefinition`（`UI_LOCK_SETTINGS_DISK`，默认 0 = 从不） |
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
getUiLockTimeout$(userId)     → Observable<number>  // 获取超时设置
setUiLockTimeout(userId, timeoutMinutes) → Promise<void>  // 设置超时
getFailedAttempts(userId)     → Promise<number>      // 获取失败次数
getBackoffUntil(userId)       → Promise<number|null> // 获取退让截止时间
setSkipCheck(skip)            → Promise<void>        // 跳过本次检查
getSkipCheck()                → Promise<boolean>     // 读取跳过标志
lockNow(userId)               → Promise<void>        // 立即上锁
clearManualLock(userId)       → Promise<void>        // 清除手动上锁标记
```

**存储架构：**

| 层级 | 存储介质 | 键 | 说明 |
|------|---------|-----|------|
| 设置层 | `StateProvider` (disk) | `uiLockTimeout` | 用户配置的超时分钟数，默认 0（从不） |
| 运行时 | `chrome.storage.local` | `uiLockLastUnlockTime` | 最后解锁时间戳（ms） |
| 运行时 | `chrome.storage.local` | `uiLockFailedAttempts` | 累计失败次数 |
| 运行时 | `chrome.storage.local` | `uiLockBackoffUntil` | 退让截止时间戳（ms） |
| 运行时 | `chrome.storage.local` | `uiLockSkipCheck` | 跳过本次 UI 锁检查 |
| 运行时 | `chrome.storage.local` | `uiLockAutoCheckThreshold` | 自动检测最小字符数阈值，初始 4，失败递增，成功解锁后重置为 4 |
| 运行时 | `chrome.storage.local` | `uiLockManuallyLocked` | 手动上锁标记，超时设为"从不"时区分首次加载和手动上锁 |

**`lockNow` 实现：** 设置 `uiLockManuallyLocked = true`，同时清除 `uiLockLastUnlockTime`。

**`isUiLocked` 实现：**
- 当 `timeoutMinutes <= 0`（从不）时：检查 `uiLockManuallyLocked` 标记。若为 `true` 表示用户手动上锁，返回已锁定；否则返回未锁定。
- 当 `timeoutMinutes > 0` 时：读取 `uiLockLastUnlockTime`，计算 `(Date.now() - lastUnlockTime) / 60000`，与 `timeoutMinutes` 比较。若 `lastUnlockTime` 不存在，直接返回 `true`。

**`unlock` 成功时：** 调用 `clearManualLock()` 清除 `uiLockManuallyLocked` 标记，确保解锁后不再被锁定。

**私有方法 `recordFailedAttempt`：** 失败计数 +1 后写入 `chrome.storage.local`；每 5 次失败触发退让，使用递增序列计算等待时间。

**私有方法 `resetFailedAttempts`：** 同时将 `failedAttempts` 设为 0、`backoffUntil` 设为 null，由 `unlock()` 成功时调用。

### 2.4 DI 注册

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

### 2.5 路由守卫

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

### 2.6 设置页面

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
- 表单新增 `uiLockTimeout` 控件（默认 5）
- `uiLockTimeoutOptions` 使用 `this.i18nService.t("minutes")` 和 `this.i18nService.t("hours")` 显示单位
- 选项：1/5/10/30 分钟，1/2/4/8/12/24 小时，永不（值 0）
- 设置超时后立即调用 `setLastUnlockTime()` 初始化计时器
- `lockNow()` 方法：调用 `uiLockService.lockNow()` → `setSkipCheck(true)` → 导航到 `/ui-lock` → `setTimeout(() => window.close(), 500)`

### 2.7 解锁页面

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

### 2.8 PIN 自动检测

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

### 2.9 PIN 与主密码区分

| 输入长度 | 验证顺序 | 退让策略 | 失败计数 |
|---------|---------|---------|---------|
| < 12 字符 | 仅 PIN | 受约束 | 计入 |
| >= 12 字符 | 主密码 → PIN | 不受约束 | 不计入 |

**验证逻辑演进过程：**
1. 初始版本：所有输入先验证 PIN，失败后验证主密码
2. 第一次优化：通过字符长度区分（<12=PIN, >=12=主密码），PIN 受退让约束，主密码不受
3. 第二次优化：<12 字符仅验证 PIN（主密码不可能低于 12 位），>=12 字符优先验证主密码再验证 PIN
4. 最终版本：<12 字符仅 PIN 且计入失败计数，>=12 字符主密码→PIN 且不计入失败计数

### 2.10 退让策略 (Backoff)

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
| 超时设为"从不"时手动上锁无效 | `isUiLocked` 在 `timeoutMinutes<=0` 时直接返回 `false` | 新增 `uiLockManuallyLocked` 标记，`lockNow` 设置标记，`isUiLocked` 检查标记 |
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
- 在 autofill.component.html 的"Additional Options"区域添加一个下拉框，标签用 i18n key "vaultListDisplayCount"，可选值 1-10，默认 3
- 在 AutofillSettingsService 中新增 vaultListDisplayCount 的 UserKeyDefinition（number 类型，默认 3，范围 1-10）
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

**libs/common/src/key-management/ui-lock/ui-lock.state.ts:**
- 创建 UI_LOCK_TIMEOUT 的 UserKeyDefinition<number>，使用 UI_LOCK_SETTINGS_DISK，默认值 5，deserializer: (value) => value ?? 5

**libs/common/src/key-management/ui-lock/ui-lock.service.ts:**
- 创建抽象类 UiLockServiceAbstraction，定义接口：isUiLocked$, isUiLocked, unlock, setLastUnlockTime, getUiLockTimeout$, setUiLockTimeout, getFailedAttempts, getBackoffUntil, setSkipCheck, getSkipCheck, lockNow, clearManualLock
- 创建实现类 UiLockService，构造函数注入 StateProvider, PinServiceAbstraction, UserVerificationService, AccountService
- 使用 chrome.storage.local 存储运行时状态，键名：uiLockLastUnlockTime, uiLockFailedAttempts, uiLockBackoffUntil, uiLockSkipCheck, uiLockManuallyLocked
- isUiLocked: 当 timeoutMinutes<=0 时检查 uiLockManuallyLocked 标记；否则读取 lastUnlockTime 计算时间差
- unlock: 区分 PIN（<12字符）和主密码（>=12字符），PIN 先验证 pinService.validatePin，主密码先验证 userVerificationService.verifyUser(VerificationType.MasterPassword)，失败后尝试 PIN；成功时调用 clearManualLock()
- recordFailedAttempt: 仅 `<12` 字符计入，每 5 次触发退让，使用递增序列 [10,30,60,300,900,1800,3600,7200]，第9次起 ×2
- lockNow: 设置 uiLockManuallyLocked=true，删除 uiLockLastUnlockTime

**libs/common/src/key-management/ui-lock/index.ts:**
- 导出 UiLockServiceAbstraction, UiLockService, UI_LOCK_TIMEOUT

**apps/browser/src/popup/ui-lock/ui-lock.guard.ts:**
- 实现 uiLockGuard() 返回 CanActivateFn
- 检查 skipCheck，如果 true 则重置并放行
- 获取当前用户，调用 isUiLocked，如果锁定则重定向到 /ui-lock

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
- 表单新增 uiLockTimeout 控件（默认 5）
- uiLockTimeoutOptions 使用 i18nService.t("minutes")/i18nService.t("hours") 显示单位
- 选项值：1,5,10,30,60,120,240,480,720,1440,0
- 设置超时后立即调用 setLastUnlockTime()
- lockNow(): lockNow() → setSkipCheck(true) → router.navigate(['/ui-lock']) → setTimeout(() => window.close(), 500)

**apps/browser/src/_locales/en/messages.json 和 zh_CN/messages.json:**
- 添加所有翻译键（见翻译键列表），带 $VARIABLE$ 的键必须添加 placeholders 定义

### 2.3 编译验证
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
- **上锁界面**：立即锁定当前界面，用户在设置的时间内打开弹窗只需验证指纹/面容或PIN码

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
