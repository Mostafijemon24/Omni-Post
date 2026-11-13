import { describe, expect, it } from "vitest";
import { filterPosts, monthGrid, monthLabel, postCounts, recentCount, shiftMonth, upcomingPosts, type UiPost } from "@/lib/omnipost/posts";

const post = (over: Partial<UiPost>): UiPost => ({ id: "1", title: "t", status: "draft", date: "", platforms: ["facebook"], ...over });
const posts = [
  post({ id: "a", status: "scheduled", scheduledAt: "2027-01-16T04:00:00Z", platforms: ["linkedin"] }),
  post({ id: "b", status: "scheduled", scheduledAt: "2027-01-15T04:00:00Z" }),
  post({ id: "c", status: "published", publishedAt: "2027-01-10T00:00:00Z" }),
  post({ id: "d", status: "draft" }),
  post({ id: "e", status: "failed", scheduledAt: "2026-10-01T00:00:00Z" }),
];

describe("post lists", () => {
  it("counts posts by status", () => {
    expect(postCounts(posts)).toEqual({ posts: 5, scheduled: 2, published: 1, drafts: 1, approval: 0, failed: 1 });
  });
  it("filters by status and platform", () => {
    expect(filterPosts(posts, "posts").length).toBe(5);
    expect(filterPosts(posts, "drafts").map((p) => p.id)).toEqual(["d"]);
    expect(filterPosts(posts, "scheduled", "linkedin").map((p) => p.id)).toEqual(["a"]);
    expect(filterPosts(posts, "published", "linkedin")).toEqual([]);
  });
  it("orders upcoming posts soonest first", () => {
    expect(upcomingPosts(posts).map((p) => p.id)).toEqual(["b", "a"]);
  });
  it("counts only recent posts", () => {
    const now = Date.parse("2027-01-20T00:00:00Z");
    expect(recentCount(posts, "published", 30, now)).toBe(1);
    expect(recentCount(posts, "failed", 30, now)).toBe(0);
  });
});

describe("calendar months", () => {
  it("moves across year boundaries", () => {
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(monthLabel("2027-02")).toBe("February 2027");
  });
  it("builds a Monday-first grid of whole weeks", () => {
    const jan = monthGrid("2027-01"); // 1 Jan 2027 is a Friday
    expect(jan.length).toBe(35);
    expect(jan[0]).toEqual({ date: "2026-12-28", day: 28, inMonth: false });
    expect(jan[4]).toEqual({ date: "2027-01-01", day: 1, inMonth: true });
    expect(jan[34].date).toBe("2027-01-31");
    expect(monthGrid("2027-02").length).toBe(28); // 1 Feb 2027 is a Monday, 28 days
    expect(monthGrid("2026-08").length).toBe(42); // starts on a Saturday, 31 days
  });
});
