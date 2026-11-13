/* eslint-disable @typescript-eslint/no-explicit-any */
// Started from tools/dc2tsx.mjs output; now maintained by hand (the brief and editor are interactive).
// `npm run port:design` skips this file — port design changes to it manually.
"use client";

import { Fragment, type CSSProperties } from "react";
import { css } from "@/lib/css";
import type { ViewModel } from "@/lib/omnipost/logic";

const field = css("width:100%; border:1px solid var(--border); border-radius:8px; padding:8px 10px; font-size:12.5px; background:var(--surface-2); color:var(--text); font-family:inherit; outline:none;");
const area: CSSProperties = { ...field, resize: "vertical", lineHeight: 1.6 };
const NOTICE: Record<string, string> = {
  ok: "background:var(--accent-soft); border:1px solid var(--accent-border); color:var(--accent-ink);",
  info: "background:var(--blue-soft); border:1px solid var(--border); color:var(--blue);",
  warn: "background:var(--amber-soft); border:1px solid var(--border); color:var(--amber);",
};

export function StudioScreen({ v }: { v: ViewModel }) {
  const av = v.activeVar;
  const edit = v.studioEditing;
  return (
    <>
    <div className="om-screen om-stack" style={css("max-width:1180px; margin:0 auto; display:grid; grid-template-columns:340px 1fr; gap:18px; align-items:start;")}>
      <div style={css("background:var(--surface); border:1px solid var(--border); border-radius:12px; box-shadow:var(--shadow-sm); position:sticky; top:0;")}>
        <div style={css("padding:14px 18px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px;")}>
          <i className="ph ph-sparkle" style={css("color:var(--accent-ink); font-size:16px;")} />
          <span style={css("font-weight:600; font-size:14px;")}>
            Generation brief
          </span>
        </div>
        {" "}
        <div style={css("padding:16px 18px; display:flex; flex-direction:column; gap:13px;")}>
          <div>
            <label style={css("font-size:11px; font-weight:500; color:var(--muted); display:block; margin-bottom:5px;")}>
              {"AI PROVIDER & MODEL"}
            </label>
            {" "}
            <select id="st-model" aria-label="AI provider and model" value={v.brief.model} onChange={(e) => v.setBriefField("model", e.target.value)} style={field}>
              {v.studioModels.map((m: any) => (
                <option key={m.model} value={m.model}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={css("font-size:11px; font-weight:500; color:var(--muted); display:block; margin-bottom:5px;")}>
              TOPIC / MAIN SUBJECT
            </label>
            {" "}
            <textarea aria-label="Topic" rows={2} value={v.brief.topic} onChange={(e) => v.setBriefField("topic", e.target.value)} style={area} />
          </div>
          <div className="om-stack" style={css("display:grid; grid-template-columns:1fr 1fr; gap:10px;")}>
            <div>
              <label style={css("font-size:11px; font-weight:500; color:var(--muted); display:block; margin-bottom:5px;")}>
                TONE
              </label>
              <select aria-label="Tone" value={v.brief.tone} onChange={(e) => v.setBriefField("tone", e.target.value)} style={field}>
                {v.studioTones.map((t: string) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={css("font-size:11px; font-weight:500; color:var(--muted); display:block; margin-bottom:5px;")}>
                LANGUAGE
              </label>
              <select aria-label="Language" value={v.brief.language} onChange={(e) => v.setBriefField("language", e.target.value)} style={field}>
                {v.studioLanguages.map((t: string) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={css("font-size:11px; font-weight:500; color:var(--muted); display:block; margin-bottom:5px;")}>
              FOCUS KEYWORD
            </label>
            <input aria-label="Focus keyword" value={v.brief.keyword} onChange={(e) => v.setBriefField("keyword", e.target.value)} style={field} />
          </div>
          <div>
            <label style={css("font-size:11px; font-weight:500; color:var(--muted); display:block; margin-bottom:7px;")}>
              TARGET PLATFORMS
            </label>
            {" "}
            <div style={css("display:flex; flex-wrap:wrap; gap:7px;")}>
              {(v.platformChips ?? []).map((c: any, cI: number) => (
                <Fragment key={cI}>
                  <button type="button" aria-pressed={c.on} onClick={c.toggle} style={css(`display:flex; align-items:center; gap:6px; padding:6px 10px; border-radius:20px; font-size:12px; cursor:pointer; font-family:inherit; border:1px solid ${c.border}; background:${c.bg}; color:${c.fg};`)}>
                    <i className={c.on ? "ph ph-check" : c.icon} />
                    {c.name}
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
          <button className="dc-h2" onClick={v.generate} disabled={v.generating} style={css("margin-top:4px; height:40px; border:none; border-radius:9px; background:var(--primary); color:var(--primary-text); font-family:'Geist',sans-serif; font-weight:500; font-size:13.5px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;")} type="button">
            <i className={v.genIcon} style={css(`font-size:16px; ${v.genSpin}`)} />
            {v.genLabel}
          </button>
          <div style={css(`font-size:11px; text-align:center; color:${v.aiModeColor};`)}>
            <i className="ph ph-circle" style={css("font-size:8px; margin-right:5px;")} />
            {v.aiModeLabel}
          </div>
        </div>
      </div>
      <div>
        <div style={css("display:flex; align-items:center; gap:7px; margin-bottom:12px; flex-wrap:wrap;")}>
          {(v.varTabs ?? []).map((t: any, tI: number) => (
            <Fragment key={tI}>
              <button type="button" onClick={t.go} style={css(`display:flex; align-items:center; gap:7px; padding:8px 13px; border-radius:9px; font-size:12.5px; font-family:inherit; font-weight:${t.weight}; cursor:pointer; border:1px solid ${t.border}; background:${t.bg}; color:${t.fg};`)}>
                <i className={t.icon} />
                {t.name}
              </button>
            </Fragment>
          ))}
        </div>
        {v.studioNotice && (
          <div role="status" style={css(`display:flex; align-items:flex-start; gap:8px; padding:10px 13px; border-radius:9px; font-size:12.5px; line-height:1.5; margin-bottom:12px; ${NOTICE[v.studioNotice.tone] ?? NOTICE.ok}`)}>
            <i className="ph ph-info" style={css("margin-top:2px;")} />
            <span style={css("flex:1;")}>{v.studioNotice.text}</span>
            <button type="button" aria-label="Dismiss" onClick={v.dismissNotice} style={css("border:none; background:none; color:inherit; cursor:pointer;")}><i className="ph ph-x" /></button>
          </div>
        )}
        <div style={css("background:var(--surface); border:1px solid var(--border); border-radius:12px; box-shadow:var(--shadow-sm); overflow:hidden;")}>
          <div style={css("display:flex; align-items:center; justify-content:space-between; padding:13px 18px; border-bottom:1px solid var(--border); background:var(--surface-2);")}>
            <div style={css("display:flex; align-items:center; gap:9px;")}>
              <i className={av.icon} style={css(`font-size:18px; color:${av.color};`)} />
              <span style={css("font-weight:600; font-size:14px;")}>
                {av.name}{" variation"}
              </span>
              <span style={css("font-family:'Geist Mono',monospace; font-size:10px; color:var(--muted); background:var(--surface); border:1px solid var(--border); padding:2px 7px; border-radius:5px;")}>
                {av.account}
              </span>
            </div>
            <div style={css("display:flex; gap:5px;")}>
              {(v.rewriteActions ?? []).map((a: any, aI: number) => (
                <Fragment key={aI}>
                  <button type="button" className="dc-h3" title={a.label} aria-label={a.label} onClick={a.run} disabled={v.generating && a.label !== "Edit"} style={css(`width:30px; height:30px; border-radius:7px; border:1px solid ${a.active ? "var(--accent-border)" : "var(--border)"}; background:${a.active ? "var(--accent-soft)" : "var(--surface)"}; display:flex; align-items:center; justify-content:center; cursor:pointer; color:${a.active ? "var(--accent-ink)" : "var(--text-2)"};`)}>
                    <i className={a.icon} style={css("font-size:15px;")} />
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
          {" "}
          <div style={css("padding:18px;")}>
            <div style={css("font-size:10.5px; font-family:'Geist Mono',monospace; letter-spacing:0.1em; color:var(--faint); margin-bottom:6px;")}>
              HEADLINE
            </div>
            {" "}
            {edit ? (
              <input aria-label="Headline" value={av.headline} onChange={(e) => v.setVarField("headline", e.target.value)} style={{ ...field, fontSize: 15, fontWeight: 600, marginBottom: 14 }} />
            ) : (
              <div style={css("font-size:16px; font-weight:600; letter-spacing:-0.01em; margin-bottom:14px;")}>
                {av.headline}
              </div>
            )}
            {" "}
            <div style={css("font-size:10.5px; font-family:'Geist Mono',monospace; letter-spacing:0.1em; color:var(--faint); margin-bottom:6px;")}>
              CAPTION
            </div>
            {" "}
            {edit ? (
              <textarea aria-label="Caption" rows={8} value={av.caption} onChange={(e) => v.setVarField("caption", e.target.value)} style={{ ...area, fontSize: 13.5, padding: "13px 15px" }} />
            ) : (
              <div onDoubleClick={v.rewriteActions[4].run} style={css("font-size:13.5px; line-height:1.65; color:var(--text-2); background:var(--surface-2); border:1px solid var(--border); border-radius:9px; padding:13px 15px; white-space:pre-wrap;")}>
                {av.caption}
              </div>
            )}
            {" "}
            <div style={css("display:flex; align-items:center; gap:14px; margin:10px 2px 16px; font-size:11.5px; color:var(--muted);")}>
              <span>
                <i className="ph ph-text-aa" />
                {" "}{av.chars}{" chars"}
              </span>
              <span style={css(`color:${av.limitColor};`)}>
                <i className="ph ph-gauge" />
                {" limit "}{av.limit}
              </span>
              <span>
                <i className="ph ph-hash" />
                {" "}{av.tagCount}{" hashtags"}
              </span>
            </div>
            {" "}
            <div style={css("font-size:10.5px; font-family:'Geist Mono',monospace; letter-spacing:0.1em; color:var(--faint); margin-bottom:7px;")}>
              HASHTAGS
            </div>
            {" "}
            {edit && (
              <input aria-label="Hashtags" defaultValue={av.tagText} key={av.platform} onBlur={(e) => v.setVarField("tags", e.target.value)} placeholder="#ai #wordpress" style={{ ...field, marginBottom: 8 }} />
            )}
            <div style={css("display:flex; flex-wrap:wrap; gap:6px; margin-bottom:16px;")}>
              {(av.tags ?? []).map((tag: any, tagI: number) => (
                <Fragment key={tagI}>
                  <span style={css("font-size:11.5px; color:var(--accent-ink); background:var(--accent-soft); border:1px solid var(--accent-border); padding:3px 9px; border-radius:6px;")}>
                    {tag}
                  </span>
                </Fragment>
              ))}
            </div>
            {" "}
            <div className="om-stack" style={css("display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;")}>
              <div style={css("border:1px solid var(--border); border-radius:10px; overflow:hidden;")}>
                <div style={css("height:120px; background:repeating-linear-gradient(45deg,var(--surface-2),var(--surface-2) 10px,var(--surface-3) 10px,var(--surface-3) 20px); display:flex; align-items:center; justify-content:center;")}>
                  <span style={css("font-family:'Geist Mono',monospace; font-size:11px; color:var(--muted);")}>
                    {av.imgSize}
                  </span>
                </div>
                {" "}
                <div style={css("padding:9px 12px; font-size:11px; color:var(--muted); display:flex; justify-content:space-between;")}>
                  <span>
                    AI image · attached
                  </span>
                  <button type="button" onClick={v.editImage} style={css("color:var(--accent-ink); cursor:pointer; border:none; background:none; font:inherit; padding:0;")}>
                    Edit →
                  </button>
                </div>
              </div>
              <div style={css("display:flex; flex-direction:column; gap:8px;")}>
                <div style={css("font-size:10.5px; font-family:'Geist Mono',monospace; letter-spacing:0.1em; color:var(--faint);")}>
                  CALL TO ACTION
                </div>
                {edit ? (
                  <input aria-label="Call to action" value={av.cta} onChange={(e) => v.setVarField("cta", e.target.value)} style={field} />
                ) : (
                  <div style={css("font-size:12.5px; border:1px solid var(--border); border-radius:8px; padding:8px 11px; background:var(--surface-2);")}>
                    {av.cta}
                  </div>
                )}
                <div style={css("font-size:10.5px; font-family:'Geist Mono',monospace; letter-spacing:0.1em; color:var(--faint);")}>
                  IMAGE ALT TEXT
                </div>
                {edit ? (
                  <textarea aria-label="Image alt text" rows={2} value={av.alt} onChange={(e) => v.setVarField("alt", e.target.value)} style={area} />
                ) : (
                  <div style={css("font-size:12px; border:1px solid var(--border); border-radius:8px; padding:8px 11px; background:var(--surface-2); color:var(--text-2); line-height:1.4;")}>
                    {av.alt}
                  </div>
                )}
              </div>
            </div>
            {" "}
            <div style={css("display:flex; align-items:center; gap:10px; padding-top:14px; border-top:1px solid var(--border); flex-wrap:wrap;")}>
              <div style={css("display:flex; align-items:center; gap:7px; font-size:12px; color:var(--muted); flex-wrap:wrap;")}>
                <i className="ph ph-calendar-dots" />
                <input type="date" aria-label="Schedule date" value={v.sched.date} onChange={(e) => v.setSchedField("date", e.target.value)} style={{ ...field, width: "auto", padding: "6px 8px" }} />
                <input type="time" aria-label="Schedule time" value={v.sched.time} onChange={(e) => v.setSchedField("time", e.target.value)} style={{ ...field, width: "auto", padding: "6px 8px" }} />
                <span>{v.sched.tz}</span>
              </div>
              <div style={css("flex:1;")} />
              <button onClick={v.saveDraft} style={css("font-size:12.5px; background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:8px 13px; cursor:pointer; color:var(--text);")} type="button">
                Save draft
              </button>
              <button onClick={v.addToCalendar} style={css("font-size:12.5px; background:var(--accent); border:none; border-radius:8px; padding:8px 14px; cursor:pointer; color:#fff; font-weight:500; display:flex; align-items:center; gap:6px;")} type="button">
                <i className="ph ph-calendar-plus" />
                Add to calendar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
