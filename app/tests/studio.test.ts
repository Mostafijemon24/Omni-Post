import { describe, expect, it } from "vitest";
import { formatSchedule, parseHashtags, shortenToLimit } from "@/lib/omnipost/studio";

describe("shortenToLimit", () => {
  it("leaves text that fits untouched", () => {
    expect(shortenToLimit("Short post.", 280)).toBe("Short post.");
  });
  it("drops trailing paragraphs first", () => {
    const out = shortenToLimit("First paragraph.\n\nSecond one that is long enough to overflow.", 20);
    expect(out).toBe("First paragraph.");
  });
  it("never exceeds the limit", () => {
    const long = "word ".repeat(200);
    const out = shortenToLimit(long, 280);
    expect(out.length).toBeLessThanOrEqual(280);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("parseHashtags", () => {
  it("normalises, prefixes and de-duplicates", () => {
    expect(parseHashtags("ai, #WordPress  #ai webdev!")).toEqual(["#ai", "#WordPress", "#webdev"]);
  });
});

describe("formatSchedule", () => {
  it("formats a date, time and zone", () => {
    expect(formatSchedule("2027-01-15", "10:00", "Asia/Dhaka")).toBe("Jan 15, 2027 · 10:00 · Asia/Dhaka");
  });
  it("reports a missing date", () => {
    expect(formatSchedule("", "10:00", "Asia/Dhaka")).toBe("Not scheduled");
  });
});
