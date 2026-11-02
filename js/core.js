/* PASCA Klickdummy – Kern: Zustand, UI-Helfer, Router
   Läuft ohne Server (file://) und auf GitHub Pages. Alle Daten liegen im localStorage dieses Browsers. */
(function () {
  "use strict";
  const PX = (window.PX = window.PX || {});
  const KEY = "pasca.v1";

  // ---------- Helfer ----------
  PX.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  PX.icon = (name, cls = "") => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${(window.ICONS || {})[name] || ""}</svg>`;
  PX.$ = (sel, root = document) => root.querySelector(sel);
  PX.$$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  PX.uid = (p = "") => p + Math.random().toString(36).slice(2, 8);
  PX.clone = (o) => JSON.parse(JSON.stringify(o));
  const pad = (n) => String(n).padStart(2, "0");
  PX.d = (iso) => { if (!iso) return null; const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
  PX.iso = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  PX.addDays = (iso, n) => { const t = PX.d(iso); t.setDate(t.getDate() + n); return PX.iso(t); };
  PX.fmtD = (iso) => { if (!iso) return "–"; const t = PX.d(iso); return `${pad(t.getDate())}.${pad(t.getMonth() + 1)}.${t.getFullYear()}`; };
  PX.fmtDW = (iso) => { if (!iso) return "–"; const t = PX.d(iso); return t.toLocaleDateString("de-DE", { weekday: "short" }) + " " + PX.fmtD(iso); };
  PX.daysBetween = (a, b) => Math.round((PX.d(b) - PX.d(a)) / 86400000);
  PX.stamp = () => { const t = new Date(); return `${PX.fmtD(PX.S.now)} ${pad(t.getHours())}:${pad(t.getMinutes())}`; };
  PX.debounce = (fn, ms = 80) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  PX.sum = (a) => a.reduce((x, y) => x + (+y || 0), 0);
  PX.plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  // ---------- Zustand ----------
  PX.load = function () {
    try { const raw = localStorage.getItem(KEY); if (raw) { PX.S = JSON.parse(raw); if (PX.S && PX.S.v === PX.DATA_VERSION) return; } } catch (e) { /* neu anlegen */ }
    PX.S = PX.seed();
    PX.save();
  };
  PX.save = function () { try { localStorage.setItem(KEY, JSON.stringify(PX.S)); } catch (e) { console.warn("Speichern fehlgeschlagen", e); } };
  PX.commit = function () { PX.save(); PX.rerender(); if (PX.guide) PX.guide.check(); };
  PX.reset = function (stage) { PX.S = PX.seed(); if (stage && PX.stages) PX.stages.to(stage); PX.save(); };

  // Sitzung (wer ist angemeldet)
  const SKEY = "pasca.session";
  PX.session = {
    get() { try { return JSON.parse(localStorage.getItem(SKEY)) || {}; } catch { return {}; } },
    set(v) { localStorage.setItem(SKEY, JSON.stringify(v)); },
    clear() { localStorage.removeItem(SKEY); },
  };
  PX.me = () => { const s = PX.session.get(); return s.person ? PX.byId("persons", s.person) : null; };
  PX.role = () => PX.session.get().role || "";
  PX.login = (role, person) => { PX.session.set({ role, person }); };
  PX.actorId = () => PX._actor || PX.me()?.id || "";

  PX.byId = (col, id) => (PX.S[col] || []).find((x) => x.id === id) || null;
  PX.name = (p) => { if (typeof p === "string") p = PX.byId("persons", p); return p ? `${p.title ? p.title + " " : ""}${p.first} ${p.last}` : "–"; };
  PX.org = (id) => PX.byId("orgs", id);
  PX.orgShort = (id) => PX.org(id)?.short || "–";
  PX.orgName = (id) => PX.org(id)?.name || "–";

  // ---------- Protokollierung & Benachrichtigung ----------
  PX.audit = function (action, object, detail, who) {
    const me = who !== undefined ? who : PX.actorId() || "system";
    PX.S.audit.unshift({ id: PX.uid("a"), at: PX.stamp(), who: me, role: PX.role() || "system", action, object, detail: detail || "" });
  };
  PX.notify = function (to, text, link) {
    (Array.isArray(to) ? to : [to]).filter(Boolean).forEach((pid) => PX.S.notes.unshift({ id: PX.uid("n"), to: pid, at: PX.stamp(), text, link: link || "", read: false }));
  };

  // ---------- UI-Bausteine ----------
  let toastBox;
  PX.toast = function (title, text = "", kind = "success") {
    if (!toastBox) { toastBox = document.createElement("div"); toastBox.className = "toasts"; document.body.appendChild(toastBox); }
    const el = document.createElement("div");
    el.className = `toast ${kind}`;
    const ic = kind === "error" || kind === "warn" ? "triangle-alert" : kind === "info" ? "info" : "circle-check";
    el.innerHTML = `${PX.icon(ic, "lead")}<div><b>${PX.esc(title)}</b>${text ? `<span class="small">${text}</span>` : ""}</div><button class="x" aria-label="Schließen">${PX.icon("x")}</button>`;
    el.querySelector(".x").onclick = () => el.remove();
    toastBox.appendChild(el);
    setTimeout(() => el.remove(), kind === "error" || kind === "warn" ? 7000 : 4200);
  };

  PX.modal = function ({ title, body, foot = "", size = "", onMount, icon: ic }) {
    const back = document.createElement("div");
    back.className = "backdrop";
    back.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true" tabindex="-1"><div class="modal-h">${ic ? PX.icon(ic, "lg") : ""}<h2>${PX.esc(title)}</h2><button class="iconbtn" data-x aria-label="Schließen">${PX.icon("x")}</button></div><div class="modal-b">${body}</div>${foot ? `<div class="modal-f">${foot}</div>` : ""}</div>`;
    document.body.appendChild(back);
    const close = () => { back.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    back.addEventListener("mousedown", (e) => { if (e.target === back) close(); });
    back.querySelector("[data-x]").onclick = close;
    back.querySelectorAll("[data-close]").forEach((b) => (b.onclick = close));
    const m = back.querySelector(".modal");
    m.focus();
    onMount && onMount(m, close);
    return close;
  };

  PX.confirm = function (title, text, ok = "Bestätigen", danger = false) {
    return new Promise((res) => {
      let done = false;
      const close = PX.modal({
        title, size: "narrow", icon: danger ? "triangle-alert" : "circle-question-mark",
        body: `<p style="margin:0">${text}</p>`,
        foot: `<button class="btn" data-no>Abbrechen</button><button class="btn primary ${danger ? "dangerfill" : ""}" data-ok>${PX.esc(ok)}</button>`,
        onMount: (m, c) => { m.querySelector("[data-ok]").onclick = () => { done = true; c(); res(true); }; m.querySelector("[data-no]").onclick = () => { c(); res(false); }; },
      });
      const obs = new MutationObserver(() => { if (!document.body.contains(document.querySelector(".backdrop")) && !done) { res(false); obs.disconnect(); } });
      obs.observe(document.body, { childList: true });
    });
  };

  PX.download = function (filename, content, type = "text/csv;charset=utf-8") {
    const blob = new Blob([type.startsWith("text/csv") ? "﻿" + content : content], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  };
  PX.csv = (rows) => rows.map((r) => r.map((c) => { const s = String(c ?? ""); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(";")).join("\r\n");

  PX.badge = (text, kind = "gray") => `<span class="badge ${kind}">${PX.esc(text)}</span>`;
  PX.empty = (text, ic = "inbox") => `<div class="empty">${PX.icon(ic)}<div>${text}</div></div>`;
  PX.kv = (pairs) => `<dl class="kv">${pairs.map(([k, v]) => `<dt>${PX.esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
  PX.steps = (items, cur) => `<ol class="stepper">${items.map((t, i) => `<li class="${i < cur ? "done" : i === cur ? "cur" : ""}"><span>${i < cur ? PX.icon("check") : i + 1}</span>${PX.esc(t)}</li>`).join("")}</ol>`;
  PX.progress = (done, total) => { const p = total ? Math.round((done / total) * 100) : 0; return `<span class="bar"><i style="width:${p}%"></i></span>`; };

  // ---------- Router ----------
  const routes = [];
  PX.route = (re, fn) => routes.push([re, fn]);
  PX.go = (h) => { if (location.hash === h) PX.render(); else location.hash = h; };
  let current = null;
  const parse = () => { const raw = location.hash.replace(/^#\/?/, ""); const [path, qs] = raw.split("?"); return { path: path.replace(/\/$/, ""), q: Object.fromEntries(new URLSearchParams(qs || "")) }; };
  PX.q = () => parse().q;

  PX.render = function (keepScroll = false) {
    const y = window.scrollY;
    const { path, q } = parse();
    let view = null;
    for (const [re, fn] of routes) { const m = path.match(re); if (m) { view = fn(m, q); break; } }
    if (!view) view = { title: "Nicht gefunden", shell: "staff", render: () => PX.empty("Diese Seite gibt es nicht. <a href='#/'>Zur Startseite</a>", "circle-help") };
    if (view.redirect) { location.replace(view.redirect); return; }
    if (view.need && !view.need.includes(PX.role())) {
      view = { title: "Kein Zugriff", shell: "staff", render: () => `<div class="notice warn">${PX.icon("lock")}<div><b>Kein Zugriff in dieser Rolle.</b><br>Die Ansicht gehört zu einer anderen Rolle. Der Datenraum ist berechtigungsbezogen eingegrenzt (Lastenheft 3.3). <a href="#/">Rolle wechseln</a></div></div>` };
    }
    current = view;
    if (PX.guide) PX.guide.visit(location.hash.split("?")[0]);
    PX.draw();
    if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
  };
  PX.draw = function () {
    const v = current; if (!v) return;
    const root = document.getElementById("app");
    document.title = (v.title ? v.title + " – " : "") + "PASCA Klickdummy";
    root.innerHTML = v.shell === "staff" ? PX.shell(v) : v.shell === "plain" ? PX.plainShell(v) : v.render();
    PX.bindShell && PX.bindShell(root);
    const main = PX.$("#main") || root;
    v.mount && v.mount(main);
    PX.guide && PX.guide.paint();
  };
  // Nach Datenänderung: Ansicht neu zeichnen, Scrollposition halten
  PX.rerender = function () { if (!current) return; const y = window.scrollY; const main = PX.$("#main"); if (main && current.shell) { main.innerHTML = current.render(); current.mount && current.mount(main); PX.paintChrome && PX.paintChrome(); } else PX.draw(); window.scrollTo(0, y); PX.guide && PX.guide.paint(); };
  window.addEventListener("hashchange", () => PX.render());
})();
