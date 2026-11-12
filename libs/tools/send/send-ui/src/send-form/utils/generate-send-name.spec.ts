import {
  buildFileSendName,
  buildTextSendName,
  formatSendFileSize,
  formatSendTimestamp,
} from "./generate-send-name";

describe("formatSendTimestamp", () => {
  it("formats as YYYY-MM-DD HH:mm:ss with zero padding", () => {
    const date = new Date(2026, 10, 12, 12, 0, 9); // month is 0-based -> November

    expect(formatSendTimestamp(date)).toBe("2026-11-12 12:00:09");
  });

  it("pads single-digit months, days, hours, minutes and seconds", () => {
    const date = new Date(2026, 0, 5, 3, 7, 2);

    expect(formatSendTimestamp(date)).toBe("2026-01-05 03:07:02");
  });
});

describe("formatSendFileSize", () => {
  it("uses bytes below 1 KB", () => {
    expect(formatSendFileSize(512)).toBe("512B");
    expect(formatSendFileSize(0)).toBe("0B");
  });

  it("switches to KB at 1024 bytes", () => {
    expect(formatSendFileSize(1024)).toBe("1KB");
    expect(formatSendFileSize(36147)).toBe("35.3KB");
  });

  it("switches to MB and GB automatically", () => {
    expect(formatSendFileSize(1024 ** 2)).toBe("1MB");
    expect(formatSendFileSize(1572864)).toBe("1.5MB");
    expect(formatSendFileSize(1024 ** 3)).toBe("1GB");
  });

  it("drops a trailing .0 so whole values stay short", () => {
    expect(formatSendFileSize(2048)).toBe("2KB");
  });

  it("falls back to 0B for invalid input", () => {
    expect(formatSendFileSize(Number.NaN)).toBe("0B");
    expect(formatSendFileSize(-5)).toBe("0B");
  });
});

describe("buildTextSendName", () => {
  it("embeds the timestamp and body length", () => {
    const date = new Date(2026, 10, 12, 12, 0, 9);

    expect(buildTextSendName(date, 12678)).toBe("2026-11-12 12:00:09 ( length : 12678 )");
  });

  it("reports zero for an empty or invalid length", () => {
    const date = new Date(2026, 10, 12, 12, 0, 9);

    expect(buildTextSendName(date, 0)).toContain("( length : 0 )");
    expect(buildTextSendName(date, Number.NaN)).toContain("( length : 0 )");
  });
});

describe("buildFileSendName", () => {
  it("embeds the timestamp and formatted file size", () => {
    const date = new Date(2026, 10, 12, 12, 0, 9);

    expect(buildFileSendName(date, 36147)).toBe("2026-11-12 12:00:09 ( size : 35.3KB )");
  });

  it("uses bytes for very small files", () => {
    const date = new Date(2026, 10, 12, 12, 0, 9);

    expect(buildFileSendName(date, 512)).toBe("2026-11-12 12:00:09 ( size : 512B )");
  });
});
