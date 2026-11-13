"use client";

// App shell (sidebar + top bar). Markup and measurements are ported 1:1 from the design
// (`design/OmniPost AI.dc.html`); the off-canvas navigation below 900px is an addition,
// because the design only specifies the desktop layout.
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { css } from "@/lib/css";
import type { ViewModel } from "@/lib/omnipost/logic";

export function Shell({ v, route, children }: { v: ViewModel; route: string; children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => setNavOpen(false), [route]);

  return (
    <div className={`om-root ${v.rootClass}`} style={css("display:flex; height:100vh; width:100%; overflow:hidden; background:var(--bg); color:var(--text);")}>
      <aside className={`om-aside${navOpen ? " is-open" : ""}`} style={css("width:252px; flex:0 0 252px; height:100%; background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column;")}>
        <div style={css("height:60px; flex:0 0 60px; display:flex; align-items:center; gap:10px; padding:0 18px; border-bottom:1px solid var(--border);")}>
          <div style={css("width:28px; height:28px; border-radius:8px; background:var(--primary); display:flex; align-items:center; justify-content:center;")}>
            <div style={css("width:11px; height:11px; border-radius:50%; background:var(--accent);")} />
          </div>
          <div style={css("display:flex; flex-direction:column; line-height:1.1;")}>
            <span style={css("font-weight:600; font-size:14px; letter-spacing:-0.01em;")}>
              OmniPost
            </span>
            <span style={css("font-family:'Geist Mono',monospace; font-size:9.5px; letter-spacing:0.14em; color:var(--faint); text-transform:uppercase;")}>
              AI Platform
            </span>
          </div>
        </div>
        <nav className="om-scroll" style={css("flex:1; overflow-y:auto; padding:12px 12px 20px;")}>
          {(v.navSections ?? []).map((sec: any, secI: number) => (
            <Fragment key={secI}>
              <div style={css("margin-bottom:14px;")}>
                <div style={css("font-family:'Geist Mono',monospace; font-size:9.5px; letter-spacing:0.14em; color:var(--faint); text-transform:uppercase; padding:4px 10px 6px;")}>
                  {sec.title}
                </div>
                {" "}
                {(sec.items ?? []).map((item: any, itemI: number) => (
                  <Fragment key={itemI}>
                    <div className="dc-h5" role="link" aria-current={item.weight === 600 ? "page" : undefined} onClick={item.go} style={css(`display:flex; align-items:center; gap:11px; padding:7px 10px; border-radius:7px; cursor:pointer; margin-bottom:1px; color:${item.fg}; background:${item.bg}; font-weight:${item.weight}; font-size:13px; position:relative;`)}>
                      <i className={item.icon} style={css(`font-size:16px; width:18px; text-align:center; color:${item.iconColor};`)} />
                      <span style={css("flex:1;")}>
                        {item.label}
                      </span>
                      {item.badge ? (
                        <>
                          <span style={css(`font-family:'Geist Mono',monospace; font-size:10px; padding:1px 6px; border-radius:20px; background:${item.badgeBg}; color:${item.badgeFg};`)}>
                            {item.badge}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </Fragment>
                ))}
              </div>
            </Fragment>
          ))}
        </nav>
        <div style={css("flex:0 0 auto; border-top:1px solid var(--border); padding:10px 12px; display:flex; align-items:center; gap:10px;")}>
          <div style={css("width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,var(--accent),var(--blue)); display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; font-weight:600;")}>
            AR
          </div>
          <div style={css("flex:1; line-height:1.2; min-width:0;")}>
            <div style={css("font-size:12.5px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;")}>
              Owner
            </div>
            {" "}
            <div style={css("font-size:11px; color:var(--muted);")}>
              Single-user · Admin
            </div>
          </div>
          <i className="ph ph-gear" onClick={v.goSettings} style={css("font-size:16px; color:var(--muted); cursor:pointer;")} />
        </div>
      </aside>
      {navOpen ? <div className="fixed inset-0 z-30 hidden bg-black/45 max-[900px]:block" onClick={() => setNavOpen(false)} aria-hidden="true" /> : null}
      <div style={css("flex:1; height:100%; display:flex; flex-direction:column; min-width:0;")}>
        <header className="om-topbar" style={css("height:60px; flex:0 0 60px; display:flex; align-items:center; gap:16px; padding:0 24px; border-bottom:1px solid var(--border); background:var(--surface);")}>
          <button type="button" className="dc-h5 hidden h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-[9px] border border-line bg-surface text-ink-2 max-[900px]:flex" aria-label="Open navigation" aria-expanded={navOpen} onClick={() => setNavOpen(true)}>
            <i className="ph ph-list" style={css("font-size:18px;")} />
          </button>
          <div className="om-title" style={css("min-width:0;")}>
            <div style={css("font-size:15px; font-weight:600; letter-spacing:-0.01em; display:flex; align-items:center; gap:9px;")}>
              {v.pageTitle}{" "}
              {v.pageTag ? (
                <>
                  <span style={css("font-family:'Geist Mono',monospace; font-size:9.5px; letter-spacing:0.1em; text-transform:uppercase; color:var(--accent-ink); background:var(--accent-soft); border:1px solid var(--accent-border); padding:2px 7px; border-radius:5px;")}>
                    {v.pageTag}
                  </span>
                </>
              ) : null}
            </div>
            {" "}
            <div className="om-sub" style={css("font-size:12px; color:var(--muted); margin-top:1px;")}>
              {v.pageSub}
            </div>
          </div>
          <div style={css("flex:1;")} />
          <div className="om-search" style={css("display:flex; align-items:center; gap:7px; background:var(--surface-2); border:1px solid var(--border); border-radius:9px; padding:7px 11px; width:210px; color:var(--muted);")}>
            <i className="ph ph-magnifying-glass" style={css("font-size:15px;")} />
            <span style={css("font-size:12.5px;")}>
              Search everything…
            </span>
            <span style={css("margin-left:auto; font-family:'Geist Mono',monospace; font-size:10px; border:1px solid var(--border-strong); border-radius:4px; padding:1px 5px;")}>
              ⌘K
            </span>
          </div>
          <button className="dc-h5" onClick={v.toggleTheme} title="Toggle theme" style={css("width:36px; height:36px; border-radius:9px; border:1px solid var(--border); background:var(--surface); color:var(--text-2); cursor:pointer; display:flex; align-items:center; justify-content:center;")} type="button">
            <i className={v.themeIcon} style={css("font-size:17px;")} />
          </button>
          <div className="dc-h5" role="button" aria-label="Notifications" onClick={v.goLogs} style={css("position:relative; width:36px; height:36px; border-radius:9px; border:1px solid var(--border); background:var(--surface); color:var(--text-2); cursor:pointer; display:flex; align-items:center; justify-content:center;")}>
            <i className="ph ph-bell" style={css("font-size:17px;")} />
            <span style={css("position:absolute; top:7px; right:8px; width:7px; height:7px; border-radius:50%; background:var(--red); border:2px solid var(--surface);")} />
          </div>
          <button className="dc-h2" onClick={v.goStudio} style={css("height:36px; padding:0 15px; border-radius:9px; border:none; background:var(--primary); color:var(--primary-text); font-family:'Geist',sans-serif; font-weight:500; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:7px;")} type="button">
            <i className="ph-bold ph-plus" style={css("font-size:14px;")} />
            <span className="om-create-label">Create</span>
          </button>
        </header>
        <main className="om-scroll om-main" style={css("flex:1; overflow-y:auto; padding:26px; background:var(--bg);")}>
          {children}
        </main>
      </div>
    </div>
  );
}
