/** Minimal standalone HTML pages for login and OAuth consent (rendered outside the app shell). */
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function page(title: string, body: string, status = 200): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · OmniPost AI</title><meta name="robots" content="noindex">
<style>
:root{--bg:#f6f7f5;--card:#fff;--text:#16181a;--muted:#62676c;--border:#e3e5e2;--accent:#1f8a5b;--err:#c0392b}
@media (prefers-color-scheme:dark){:root{--bg:#0f1112;--card:#17191b;--text:#eceeec;--muted:#9aa09c;--border:#2a2d2f;--accent:#3fbf86;--err:#ff7b6b}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;padding:16px}
.card{width:100%;max-width:400px;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:28px}
h1{font-size:19px;margin:0 0 6px}p{color:var(--muted);margin:0 0 18px;font-size:14px}label{font-size:13px;font-weight:500;display:block;margin-bottom:6px}
input[type=password]{width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:9px;background:transparent;color:var(--text);font-size:15px}
.row{display:flex;gap:10px;margin-top:18px}button{flex:1;padding:10px;border-radius:9px;border:1px solid var(--border);background:transparent;color:var(--text);font-size:14px;cursor:pointer}
button.primary{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}.err{color:var(--err);font-size:13px;margin-top:10px}
.who{font-weight:600;color:var(--text)}ul{margin:0 0 4px;padding-left:18px;color:var(--muted);font-size:13.5px}
</style></head><body><main class="card">${body}</main></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "DENY" } });
}
