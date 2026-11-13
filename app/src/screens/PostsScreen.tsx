/* eslint-disable @typescript-eslint/no-explicit-any */
// Started from tools/dc2tsx.mjs output; now maintained by hand (filters, the platform filter and row actions are interactive).
// `npm run port:design` skips this file — port design changes to it manually.
"use client";

import { Fragment } from "react";
import { css } from "@/lib/css";
import type { ViewModel } from "@/lib/omnipost/logic";

const BTN = "display:inline-flex; align-items:center; gap:6px; height:32px; padding:0 12px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:var(--text-2); font:inherit; font-size:12px; font-weight:500; cursor:pointer;";
const FIELD = "height:32px; padding:0 9px; border-radius:8px; border:1px solid var(--border-strong); background:var(--surface); color:var(--text); font:inherit; font-size:12px;";

/** The expanded row: the whole post, and what can be done with it. */
function PostDetail({ p }: { p: any }) {
  return (
    <div style={css("padding:14px 18px 16px 68px; border-bottom:1px solid var(--border); background:var(--surface-2);")}>
      <div style={css("font-size:13px; line-height:1.55; white-space:pre-wrap; overflow-wrap:anywhere; color:var(--text); max-width:760px;")}>{p.caption || "No caption."}</div>
      {p.tags ? <div style={css("margin-top:6px; font-size:12px; color:var(--accent-ink); overflow-wrap:anywhere;")}>{p.tags}</div> : null}
      {p.failure ? <div style={css("margin-top:8px; font-size:12px; color:var(--red);")}>Last error: {p.failure}</div> : null}
      {p.url ? (
        <div style={css("margin-top:8px; font-size:12px;")}>
          <a href={p.url} target="_blank" rel="noreferrer" style={css("color:var(--blue); overflow-wrap:anywhere;")}>{p.url}</a>
        </div>
      ) : null}
      <div style={css("display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:14px;")}>
        {p.sched ? (
          <>
            <input type="date" aria-label="Date" value={p.sched.date} onChange={p.sched.setDate} style={css(FIELD)} />
            <input type="time" aria-label="Time" value={p.sched.time} onChange={p.sched.setTime} style={css(FIELD)} />
            <span style={css("font-family:'Geist Mono',monospace; font-size:11px; color:var(--muted);")}>{p.sched.tz}</span>
            <button type="button" className="dc-h2" disabled={p.busy} onClick={p.sched.save} style={css(BTN + "background:var(--primary); color:var(--primary-text); border-color:var(--primary);")}>
              {p.busy ? "Saving…" : "Save schedule"}
            </button>
            <button type="button" className="dc-h5" onClick={p.sched.cancel} style={css(BTN)}>Cancel</button>
          </>
        ) : p.confirming ? (
          <>
            <span style={css("font-size:12.5px; color:var(--text);")}>Delete this post for good?</span>
            <button type="button" disabled={p.busy} onClick={p.doDelete} style={css(BTN + "background:var(--red); color:#fff; border-color:var(--red);")}>
              {p.busy ? "Deleting…" : "Yes, delete"}
            </button>
            <button type="button" className="dc-h5" onClick={p.cancelDelete} style={css(BTN)}>Keep it</button>
          </>
        ) : (
          <>
            {p.canSchedule ? (
              <button type="button" className="dc-h5" disabled={p.busy} onClick={p.startSchedule} style={css(BTN)}>
                <i className="ph ph-calendar-plus" /> {p.scheduleLabel}
              </button>
            ) : null}
            {p.canPublish ? (
              <button type="button" className="dc-h5" disabled={p.busy} onClick={p.markPublished} title="Records the post as published. OmniPost does not post to the network itself." style={css(BTN)}>
                <i className="ph ph-check-circle" /> Mark as published
              </button>
            ) : null}
            {p.canDraft ? (
              <button type="button" className="dc-h5" disabled={p.busy} onClick={p.toDraft} style={css(BTN)}>
                <i className="ph ph-note-pencil" /> Move to drafts
              </button>
            ) : null}
            <button type="button" className="dc-h5" disabled={p.busy} onClick={p.askDelete} style={css(BTN + "color:var(--red);")}>
              <i className="ph ph-trash" /> Delete
            </button>
          </>
        )}
      </div>
      {p.actionError ? <div role="alert" style={css("margin-top:9px; font-size:12px; color:var(--red);")}>{p.actionError}</div> : null}
    </div>
  );
}

export function PostsScreen({ v }: { v: ViewModel }) {
  return (
    <>
    <div className="om-screen" style={css("max-width:1180px; margin:0 auto;")}>
      <div style={css("display:flex; align-items:center; gap:8px; margin-bottom:16px;")}>
        <div style={css("display:flex; gap:5px; flex-wrap:wrap;")}>
          {(v.postFilters ?? []).map((f: any, fI: number) => (
            <Fragment key={fI}>
              <div className="dc-h5" role="button" tabIndex={0} onClick={f.go} onKeyDown={(e) => { if (e.key === "Enter") f.go(); }} style={css(`padding:6px 12px; border-radius:7px; font-size:12px; cursor:pointer; border:1px solid ${f.border}; background:${f.bg}; color:${f.fg}; font-weight:${f.weight};`)}>
                {f.label}
                <span style={css("font-family:'Geist Mono',monospace; font-size:10px; margin-left:6px; color:var(--muted);")}>
                  {f.count}
                </span>
              </div>
            </Fragment>
          ))}
        </div>
        <div style={css("flex:1;")} />
        <label style={css("display:flex; align-items:center; gap:7px; border:1px solid var(--border); border-radius:8px; padding:0 11px; background:var(--surface); font-size:12px; color:var(--muted); cursor:pointer;")}>
          <i className="ph ph-funnel" />
          <select aria-label="Filter by platform" value={v.postPlatform} onChange={v.setPostPlatform} style={css("border:none; background:transparent; color:var(--text-2); font:inherit; padding:7px 0; cursor:pointer; outline:none;")}>
            {(v.postPlatforms ?? []).map((o: any) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>
      {v.postsNote ? (
        <div style={css("display:flex; align-items:center; gap:8px; margin-bottom:12px; padding:9px 13px; border:1px dashed var(--border-strong); border-radius:9px; font-size:12px; color:var(--muted);")}>
          <i className="ph ph-info" style={css("font-size:15px;")} />
          {v.postsNote}
        </div>
      ) : null}
      <div style={css("background:var(--surface); border:1px solid var(--border); border-radius:12px; box-shadow:var(--shadow-sm); overflow:hidden;")}>
        <div style={css("display:grid; grid-template-columns:38px 2.4fr 1.1fr 1fr 1fr 90px; gap:12px; padding:11px 18px; border-bottom:1px solid var(--border); background:var(--surface-2); font-size:11px; font-weight:500; color:var(--muted); text-transform:uppercase; letter-spacing:0.05em;")}>
          <div />
          <div>
            Content
          </div>
          <div>
            Platforms
          </div>
          <div>
            Account
          </div>
          <div>
            Schedule
          </div>
          <div>
            Status
          </div>
        </div>
        {" "}
        {(v.postRows ?? []).map((p: any, pI: number) => (
          <Fragment key={pI}>
            <div className="dc-h5" role={p.canOpen ? "button" : undefined} tabIndex={p.canOpen ? 0 : undefined} aria-expanded={p.canOpen ? !!p.open : undefined} onClick={p.toggle} onKeyDown={(e) => { if (p.canOpen && e.key === "Enter") p.toggle(); }} style={css(`display:grid; grid-template-columns:38px 2.4fr 1.1fr 1fr 1fr 90px; gap:12px; padding:13px 18px; border-bottom:1px solid var(--border); align-items:center; cursor:${p.canOpen ? "pointer" : "default"};`)}>
              <i className={p.canOpen ? (p.open ? "ph ph-caret-down" : "ph ph-caret-right") : "ph ph-dot-outline"} style={css("font-size:14px; color:var(--muted);")} />
              <div style={css("min-width:0;")}>
                <div style={css("font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;")}>
                  {p.title}
                </div>
                <div style={css("font-size:11px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;")}>
                  {p.excerpt}
                </div>
                <div style={css("display:flex; align-items:center; gap:4px; margin-top:3px; font-family:'Geist Mono',monospace; font-size:9.5px; color:var(--faint);")}>
                  <i className={p.srcIcon} style={css("font-size:11px;")} />
                  {p.source}
                </div>
              </div>
              <div style={css("display:flex; gap:5px;")}>
                {(p.icons ?? []).map((ic: any, icI: number) => (
                  <Fragment key={icI}>
                    <i className={ic.icon} style={css(`font-size:16px; color:${ic.color};`)} />
                  </Fragment>
                ))}
              </div>
              <div style={css("font-size:12px; color:var(--text-2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;")}>
                {p.account}
              </div>
              <div style={css("font-family:'Geist Mono',monospace; font-size:11px; color:var(--text-2);")}>
                {p.when}
              </div>
              <div>
                <span style={css(`font-size:10.5px; padding:3px 9px; border-radius:6px; background:${p.statusBg}; color:${p.statusFg}; white-space:nowrap;`)}>
                  {p.status}
                </span>
              </div>
            </div>
            {p.open ? <PostDetail p={p} /> : null}
          </Fragment>
        ))}
        {v.postsEmpty ? (
          <div style={css("padding:38px 18px; text-align:center; color:var(--muted); font-size:13px;")}>
            <div style={css("margin-bottom:12px;")}>{v.postsEmpty}</div>
            <button type="button" className="dc-h2" onClick={v.goStudioFromPosts} style={css(BTN + "background:var(--primary); color:var(--primary-text); border-color:var(--primary);")}>
              <i className="ph-bold ph-plus" /> Create a post
            </button>
          </div>
        ) : null}
      </div>
    </div>
    </>
  );
}
