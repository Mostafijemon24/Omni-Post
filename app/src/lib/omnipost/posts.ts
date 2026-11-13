/**
 * Pure helpers behind the Posts lists, the Content Calendar and the dashboard counters,
 * once they show real posts from the database instead of the design's sample data.
 */

export type UiPost = {
  id: string;
  title: string;
  status: string;
  /** Local calendar date in the post's own timezone (`YYYY-MM-DD`), empty when it has no time. */
  date: string;
  platforms: string[];
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
};

export type PostCounts = { posts: number; scheduled: number; published: number; drafts: number; approval: number; failed: number };

export function postCounts(posts: UiPost[]): PostCounts {
  const n = (status: string) => posts.filter((p) => p.status === status).length;
  return { posts: posts.length, scheduled: n("scheduled"), published: n("published"), drafts: n("draft"), approval: n("approval"), failed: n("failed") };
}

/** Which statuses each Posts filter shows; `posts` shows everything. */
export const FILTER_STATUS: Record<string, string | undefined> = { posts: undefined, scheduled: "scheduled", published: "published", drafts: "draft", approval: "approval", failed: "failed" };

export function filterPosts<T extends UiPost>(posts: T[], filter: string, platform = ""): T[] {
  const status = FILTER_STATUS[filter];
  return posts.filter((p) => (!status || p.status === status) && (!platform || p.platforms.includes(platform)));
}

/** Scheduled posts, soonest first. */
export function upcomingPosts<T extends UiPost>(posts: T[], limit = 4): T[] {
  return posts.filter((p) => p.status === "scheduled" && p.scheduledAt)
    .sort((a, b) => Date.parse(a.scheduledAt!) - Date.parse(b.scheduledAt!)).slice(0, limit);
}

/** Posts in `status` whose relevant moment falls within the last `days` days. */
export function recentCount(posts: UiPost[], status: string, days: number, now = Date.now()): number {
  const since = now - days * 86_400_000;
  return posts.filter((p) => p.status === status && Date.parse(p.publishedAt || p.scheduledAt || p.createdAt || "") >= since).length;
}

const pad = (n: number) => String(n).padStart(2, "0");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** `2027-01` + 1 → `2027-02`; crosses year boundaries. */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Today's date as the browser's wall clock sees it. */
export function localDate(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export type GridDay = { date: string; day: number; inMonth: boolean };

/** Monday-first month grid in whole weeks (28, 35 or 42 days), padded with the neighbouring months. */
export function monthGrid(month: string): GridDay[] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7; // days shown before the 1st
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const total = Math.ceil((lead + daysInMonth) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1, 1 - lead + i));
    return { date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`, day: d.getUTCDate(), inMonth: d.getUTCMonth() === m - 1 };
  });
}
