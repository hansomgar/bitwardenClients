export const UiLockTimeoutStringType = {
  OnPopupOpen: "onPopupOpen",
  OnLocked: "onLocked",
  OnRestart: "onRestart",
  Never: "never",
} as const;

export type UiLockTimeout =
  | number
  | (typeof UiLockTimeoutStringType)[keyof typeof UiLockTimeoutStringType];

export function isUiLockTimeoutNumeric(timeout: UiLockTimeout): boolean {
  return typeof timeout === "number";
}
