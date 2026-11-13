/* eslint-disable @typescript-eslint/no-explicit-any */
// Started from tools/dc2tsx.mjs output; now maintained by hand (month navigation, the list view and events are interactive).
// `npm run port:design` skips this file — port design changes to it manually.
"use client";

import { Fragment } from "react";
import { css } from "@/lib/css";
import type { ViewModel } from "@/lib/omnipost/logic";

const NAV = "width:30px; height:30px; display:inline-flex; align-items:center; justify-content:center; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:var(--text-2); font:inherit; font-size:16px; cursor:pointer;";

export function CalendarScreen({ v }: { v: ViewModel }) {
  return (
    <>
    <div className="om-screen" style={css("max-width:1180px; margin:0 auto;")}>
      <div style={css("display:flex; align-items:center; gap:12px; margin-bottom:16px;")}>
        <div style={css("display:flex; gap:4px; background:var(--surface-2); border:1px solid var(--border); border-radius:9px; padding:3px;")}>
          {(v.calViews ?? []).map((v: any, vI: number) => (
            <Fragment key={vI}>
              <div role="button" tabIndex={0} onClick={v.go} onKeyDown={(e) => { if (e.key === "Enter") v.go(); }} style={css(`padding:6px 13px; border-radius:6px; font-size:12.5px; font-weight:${v.weight}; cursor:pointer; background:${v.bg}; color:${v.fg};`)}>
                {v.label}
              </div>
            </Fragment>
          ))}
        </div>
        <div style={css("flex:1;")} />
        <div style={css("display:flex; align-items:center; gap:10px;")}>
          <button type="button" className="dc-h5" aria-label="Previous month" onClick={v.calPrev} style={css(NAV)}>
            <i className="ph ph-caret-left" />
          </button>
          <span style={css("font-weight:600; font-size:15px; min-width:150px; text-align:center;")}>
            {v.calTitle}
          </span>
          <button type="button" className="dc-h5" aria-label="Next month" onClick={v.calNext} style={css(NAV)}>
            <i className="ph ph-caret-right" />
          </button>
          <button type="button" className="dc-h5" onClick={v.calGoToday} style={css(NAV + "width:auto; padding:0 11px; font-size:12px;")}>
            Today
          </button>
        </div>
        <div style={css("flex:1;")} />
        <div style={css("display:flex; align-items:center; gap:14px; font-size:11.5px; color:var(--muted);")}>
          <span>
            <i className="ph-bold ph-circle" style={css("color:var(--accent);")} />
            {" Scheduled"}
          </span>
          <span>
            <i className="ph-bold ph-circle" style={css("color:var(--blue);")} />
            {" Published"}
          </span>
          <span>
            <i className="ph-bold ph-circle" style={css("color:var(--amber);")} />
            {" Pending"}
          </span>
        </div>
      </div>
      {" "}
      <div style={css("background:var(--surface); border:1px solid var(--border); border-radius:12px; box-shadow:var(--shadow-sm); overflow:hidden;")}>
        {v.calIsList ? (
          <div>
            {(v.calList ?? []).map((d: any) => (
              <div key={d.date} style={css("display:flex; gap:16px; padding:12px 18px; border-bottom:1px solid var(--border);")}>
                <div style={css(`flex:0 0 64px; font-size:12.5px; font-weight:600; color:${d.isToday ? "var(--accent-ink)" : "var(--text)"};`)}>{d.date}</div>
                <div style={css("flex:1; min-width:0; display:flex; flex-direction:column; gap:5px;")}>
                  {(d.posts ?? []).map((e: any, eI: number) => (
                    <div key={eI} role="button" tabIndex={0} onClick={e.go} onKeyDown={(k) => { if (k.key === "Enter") e.go(); }} style={css(`font-size:12px; padding:6px 9px; border-radius:6px; background:${e.bg}; color:${e.fg}; display:flex; align-items:center; gap:7px; cursor:pointer; min-width:0;`)}>
                      <i className={e.icon} style={css("font-size:13px;")} />
                      <span style={css("overflow:hidden; text-overflow:ellipsis; white-space:nowrap;")}>{e.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {v.calEmpty ? <div style={css("padding:38px 18px; text-align:center; color:var(--muted); font-size:13px;")}>{v.calEmpty}</div> : null}
          </div>
        ) : (
          <>
            <div style={css("display:grid; grid-template-columns:repeat(7,1fr); border-bottom:1px solid var(--border);")}>
              {(v.dayHeaders ?? []).map((d: any, dI: number) => (
                <Fragment key={dI}>
                  <div style={css("padding:9px 12px; font-size:11px; font-weight:500; color:var(--muted); text-transform:uppercase; letter-spacing:0.06em; border-right:1px solid var(--border);")}>
                    {d}
                  </div>
                </Fragment>
              ))}
            </div>
            <div style={css("display:grid; grid-template-columns:repeat(7,1fr); grid-auto-rows:118px;")}>
              {(v.calCells ?? []).map((c: any, cI: number) => (
                <Fragment key={cI}>
                  <div style={css(`border-right:1px solid var(--border); border-bottom:1px solid var(--border); padding:7px 8px; display:flex; flex-direction:column; gap:4px; background:${c.bg}; overflow:hidden;`)}>
                    <div style={css(`font-size:11.5px; font-weight:${c.dayWeight}; color:${c.dayColor};`)}>
                      {c.day}
                    </div>
                    {(c.posts ?? []).map((e: any, eI: number) => (
                      <Fragment key={eI}>
                        <div role="button" tabIndex={0} title={e.label} onClick={e.go} onKeyDown={(k) => { if (k.key === "Enter") e.go(); }} style={css(`font-size:10.5px; padding:3px 6px; border-radius:5px; background:${e.bg}; color:${e.fg}; display:flex; align-items:center; gap:5px; white-space:nowrap; overflow:hidden; cursor:pointer;`)}>
                          <i className={e.icon} style={css("font-size:11px;")} />
                          <span style={css("overflow:hidden; text-overflow:ellipsis;")}>
                            {e.label}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                    {c.more ? (
                      <div role="button" tabIndex={0} onClick={c.showAll} onKeyDown={(k) => { if (k.key === "Enter") c.showAll(); }} style={css("font-size:10.5px; color:var(--muted); cursor:pointer; padding:0 6px;")}>
                        {c.more}
                      </div>
                    ) : null}
                  </div>
                </Fragment>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}
