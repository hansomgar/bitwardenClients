/** Placed under `send-form` because the generated name is a form concern, not a domain one. */

/** Size units in ascending order, using binary multiples (1 KB = 1024 B). */
const SIZE_UNITS: ReadonlyArray<{ suffix: string; divisor: number }> = [
  { suffix: "B", divisor: 1 },
  { suffix: "KB", divisor: 1024 },
  { suffix: "MB", divisor: 1024 ** 2 },
  { suffix: "GB", divisor: 1024 ** 3 },
  { suffix: "TB", divisor: 1024 ** 4 },
];

/** Pads a number to two digits, e.g. `9` -> `"09"`. */
function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

/**
 * Formats a date as `YYYY-MM-DD HH:mm:ss` using local time.
 *
 * Built by hand rather than via `Intl` or a locale-aware pipe so the generated Send name is
 * stable and identical across every locale and client.
 */
export function formatSendTimestamp(date: Date): string {
  const datePart = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  const timePart = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
  return `${datePart} ${timePart}`;
}

/**
 * Formats a byte count with an automatically chosen unit, e.g. `36147` -> `"35.3KB"`.
 *
 * Whole bytes are shown without a decimal (`512B`); larger values keep one decimal
 * (`35.3KB`, `1.5MB`). Trailing `.0` is dropped so `1024` becomes `"1KB"` rather than
 * `"1.0KB"`.
 */
export function formatSendFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0B";
  }

  // Pick the largest unit the value reaches, staying within the defined unit list.
  let unit = SIZE_UNITS[0];
  for (const candidate of SIZE_UNITS) {
    if (bytes >= candidate.divisor) {
      unit = candidate;
    }
  }

  if (unit.suffix === "B") {
    return `${Math.round(bytes)}B`;
  }

  const value = bytes / unit.divisor;
  // Round to one decimal and strip a trailing `.0`.
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);

  return `${text}${unit.suffix}`;
}

/**
 * Builds the fallback name for a text Send, e.g.
 * `2026-11-12 12:00:09 ( length : 12678 )`.
 *
 * @param date - Timestamp used in the name.
 * @param length - Character count of the Send body.
 */
export function buildTextSendName(date: Date, length: number): string {
  const safeLength = Number.isFinite(length) && length > 0 ? Math.round(length) : 0;
  return `${formatSendTimestamp(date)} ( length : ${safeLength} )`;
}

/**
 * Builds the fallback name for a file Send, e.g.
 * `2026-11-12 12:00:09 ( size : 35.2KB )`.
 *
 * @param date - Timestamp used in the name.
 * @param bytes - Size of the selected file in bytes.
 */
export function buildFileSendName(date: Date, bytes: number): string {
  return `${formatSendTimestamp(date)} ( size : ${formatSendFileSize(bytes)} )`;
}
