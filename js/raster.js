/* PASCA Klickdummy – Bewertungsraster v2
   Modell: Prüfungsteile (eigene Bewertungsart, Gewicht, Notenschlüssel) · Aufgabenbaum (beliebige Tiefe, BE an den Blättern)
   · Wahlgruppen (k aus n, Schüler- oder Lehrerwahl, auch verschachtelt) · Kombination der Teile · Rundung je Fach
   · Kappung · Zusatz-BE · Abzug · Gutachten mit Gliederung und Bausteinen · Formblatt-PDF. */
(function () {
  "use strict";
  const PX = window.PX; const { esc, icon, $, $$ } = PX;

  PX.SCORING = { be: "Bewertungseinheiten → Notenschlüssel", np: "Notenpunkte (gewichtet)", pct: "BE → Prozent → Notenpunkte", fehler: "Fehlerzahl → Fehler-Noten-Skala", extern: "nicht korrekturrelevant (NP werden nachgetragen)" };
  PX.SCORING_SHORT = { be: "BE", np: "NP", pct: "BE / %", fehler: "Fehler", extern: "extern" };
  PX.COMBINE = { sum: "BE aller Teile addieren, dann Notenschlüssel", weighted: "Notenpunkte der Teile gewichten", mean: "Mittelwert der Teilnoten" };
  PX.ROUND = { none: "nicht runden", round: "kaufmännisch auf ganze NP", ceil: "auf ganze NP aufrunden", ceil1: "auf eine Nachkommastelle aufrunden", round1: "kaufmännisch auf eine Nachkommastelle" };
  PX.roundBy = (v, mode) => {
    if (v == null || isNaN(v)) return v;
    const e = 1e-9;
    if (mode === "round") return Math.round(v + e);
    if (mode === "ceil") return Math.ceil(v - e);
    if (mode === "ceil1") return Math.ceil(v * 10 - e) / 10;
    if (mode === "round1") return Math.round(v * 10 + e) / 10;
    return v;
  };
  PX.fmtNP = (v) => (v == null || v === "" ? "–" : String(Math.round(v * 100) / 100).replace(".", ","));

  // ---------- Notenschlüssel / Skalen ----------
  const desc = (mins) => mins.map((m, i) => [m, 15 - i]).concat([[0, 0]]);
  PX.KEYS = {
    bg80: { name: "BG · 80-BE-Tabelle", kind: "be", max: 80, def: desc([76, 72, 68, 64, 60, 56, 52, 48, 44, 40, 36, 32, 27, 22, 16]) },
    bg90: { name: "BG · 90-BE-Tabelle", kind: "be", max: 90, def: desc([86, 81, 77, 72, 68, 63, 59, 54, 50, 45, 41, 36, 30, 24, 18]) },
    bg100: { name: "BG · 100-BE-Tabelle", kind: "be", max: 100, def: desc([95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 33, 27, 20]) },
    bg120: { name: "BG · 120-BE-Tabelle", kind: "be", max: 120, def: desc([114, 108, 102, 96, 90, 84, 78, 72, 66, 60, 54, 48, 40, 32, 24]) },
    ag60: { name: "AG · 60-BE-Tabelle", kind: "be", max: 60, def: desc([57, 54, 51, 48, 45, 42, 39, 36, 33, 30, 27, 24, 20, 16, 12]) },
    ag80: { name: "AG · 80-BE-Tabelle", kind: "be", max: 80, def: desc([76, 72, 68, 64, 60, 56, 52, 48, 44, 40, 36, 32, 27, 22, 16]) },
    ag100: { name: "AG · 100-BE-Tabelle", kind: "be", max: 100, def: desc([95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 33, 27, 20]) },
    ag120: { name: "AG · 120-BE-Tabelle", kind: "be", max: 120, def: desc([114, 108, 102, 96, 90, 84, 78, 72, 66, 60, 54, 48, 40, 32, 24]) },
    pct: { name: "Prozenttabelle Hörverstehen", kind: "pct", max: 100, def: desc([95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 33, 27, 20]) },
    "fs-la": { name: "Fehler-Noten-Skala Latein (Beispiel, je Prüfung beigegeben)", kind: "fehler", def: [[1, 15], [1.5, 14], [2, 13], [2.5, 12], [3, 11], [3.5, 10], [4, 9], [5, 8], [5.5, 7], [6.5, 6], [7.5, 5], [8.5, 4], [9.5, 3], [11, 2], [12.5, 1], [999, 0]] },
  };
  PX.keyLookup = (keyId, v) => {
    const k = PX.KEYS[keyId]; if (!k || v == null) return null;
    if (k.kind === "fehler") { for (const [maxE, np] of k.def) if (v <= maxE + 1e-9) return np; return 0; }
    for (const [min, np] of k.def) if (v >= min - 1e-9) return np;
    return 0;
  };
  PX.keyTable = (keyId) => { const k = PX.KEYS[keyId]; if (!k) return ""; return `<div class="nskey">${k.def.filter((x) => x[0] < 999).map(([t, np]) => `<span><b>${np}</b>${k.kind === "fehler" ? "≤" + PX.fmtNP(t) + " F" : "≥" + t + (k.kind === "pct" ? "%" : "")}</span>`).join("")}</div>`; };

  // ---------- Struktur ----------
  PX.kids = (r, parentId, partId) => r.nodes.filter((n) => (n.parent || null) === (parentId || null) && (parentId || n.part === partId));
  PX.isLeaf = (r, n) => !r.nodes.some((x) => x.parent === n.id);
  PX.leaves = (r) => r.nodes.filter((n) => PX.isLeaf(r, n));
  PX.groupOfNode = (r, id) => (r.groups || []).find((g) => g.options.includes(id)) || null;
  PX.partOf = (r, n) => r.parts.find((p) => p.id === n.part);
  PX.schulform = (subjectId) => (/allgemein/i.test(PX.subj(subjectId)?.form || "") ? "AG" : "BG");

  // Gewählte Optionen einer Gruppe: Schülerwahl in der Korrektur, Lehrerwahl je Kursmappe
  PX.choiceOf = (r, g, c, km) => (g.chooser === "lehrer" ? km?.lehrerwahl?.[g.id] : c?.wahl?.[g.id]) || [];
  PX.activeSet = (r, c, km) => {
    const act = new Set();
    const walk = (n) => {
      const g = PX.groupOfNode(r, n.id);
      if (g && !PX.choiceOf(r, g, c, km).includes(n.id)) return;
      act.add(n.id); PX.kids(r, n.id).forEach(walk);
    };
    r.parts.forEach((p) => PX.kids(r, null, p.id).forEach(walk));
    return act;
  };
  PX.activeLeaves = (r, c, km) => { const a = PX.activeSet(r, c, km); return PX.leaves(r).filter((n) => a.has(n.id)); };
  // Erreichbares Maximum (BE) eines Knotens / Teils unter Berücksichtigung der Wahlregeln
  PX.nodeMax = (r, n) => {
    if (PX.isLeaf(r, n)) return +n.be || 0;
    return childrenMax(r, PX.kids(r, n.id));
  };
  function childrenMax(r, kids) {
    let s = 0; const seen = new Set();
    kids.forEach((k) => { const g = PX.groupOfNode(r, k.id); if (!g) s += PX.nodeMax(r, k); else if (!seen.has(g.id)) { seen.add(g.id); const opts = g.options.map((id) => PX.nodeMax(r, r.nodes.find((x) => x.id === id) || {})).sort((a, b) => b - a); s += PX.sum(opts.slice(0, g.pick)); } });
    return s;
  }
  PX.partMax = (r, p) => childrenMax(r, PX.kids(r, null, p.id));
  PX.maxBE = (r) => PX.sum(r.parts.filter((p) => p.scoring === "be").map((p) => PX.partMax(r, p)));

  // ---------- Berechnung ----------
  const num = (v) => (v === "nb" ? 0 : v === "" || v == null ? null : +v);
  PX.evaluate = function (r, c, km, m) {
    c = c || {}; const out = { parts: [], missing: [], complete: true };
    if (!r) return { ...out, complete: false, np: null };
    const act = PX.activeSet(r, c, km);
    // Wahlregeln prüfen (nur Gruppen, deren Optionen erreichbar sind)
    (r.groups || []).forEach((g) => { const parentOk = g.options.some((id) => { const n = r.nodes.find((x) => x.id === id); return n && (!n.parent || act.has(n.parent)); }); if (!parentOk) return; const ch = PX.choiceOf(r, g, c, km).filter((id) => g.options.includes(id)); if (ch.length !== g.pick) { out.complete = false; out.missing.push(g.chooser === "lehrer" ? `Lehrerwahl „${g.label}“ festlegen` : `Wahl „${g.label}“ festlegen`); } });
    const val = (n, p) => {
      if (PX.isLeaf(r, n)) return num(c.be?.[n.id]);
      const ks = PX.kids(r, n.id).filter((k) => act.has(k.id));
      if (p.scoring === "np") { let sw = 0, s = 0, miss = false; ks.forEach((k) => { const v = val(k, p); const w = +(k.weight ?? 1); if (v == null) miss = true; else { s += v * w; sw += w; } }); return miss || !sw ? null : s / sw; }
      let s = 0, miss = false; ks.forEach((k) => { const v = val(k, p); if (v == null) miss = true; else s += v; }); return miss ? null : s;
    };
    out.val = (id) => { const n = r.nodes.find((x) => x.id === id); return n ? val(n, PX.partOf(r, n)) : null; };
    r.parts.forEach((p) => {
      const tops = PX.kids(r, null, p.id).filter((k) => act.has(k.id));
      const res = { id: p.id, name: p.name, scoring: p.scoring, weight: +p.weight || 0, np: null, sum: null, max: null, complete: true };
      if (p.scoring === "extern") { const v = m?.extern?.[p.id]; res.np = v === "" || v == null ? null : +v; res.complete = res.np != null; out.parts.push(res); return; }
      const leaves = PX.leaves(r).filter((l) => l.part === p.id && act.has(l.id));
      if (leaves.some((l) => num(c.be?.[l.id]) == null)) { res.complete = false; out.complete = false; out.missing.push(`${p.name}: Bewertung unvollständig`); }
      if (p.scoring === "be" || p.scoring === "pct") {
        res.sum = PX.sum(leaves.map((l) => num(c.be?.[l.id]) || 0)); res.max = PX.partMax(r, p);
        if (r.beHalf) res.sum = Math.ceil(res.sum - 1e-9);
        if (p.scoring === "pct") { res.pct = res.max ? (res.sum / res.max) * 100 : 0; res.np = PX.keyLookup(p.key, res.pct); }
        else res.np = PX.keyLookup(p.key || r.key, res.sum);
      } else if (p.scoring === "np") {
        let sw = 0, s = 0; tops.forEach((k) => { const v = val(k, p); if (v != null) { const w = +(k.weight ?? 1); s += v * w; sw += w; } }); res.np = sw ? s / sw : null;
      } else if (p.scoring === "fehler") { res.sum = PX.sum(leaves.map((l) => num(c.be?.[l.id]) || 0)); res.np = PX.keyLookup(p.key, res.sum); }
      // Kappung (z. B. Inhalt oder Sprache ungenügend → höchstens 3 NP)
      (r.caps || []).filter((cp) => cp.part === p.id).forEach((cp) => { const hit = cp.nodes.some((id) => { const v = out.val(id); return v != null && PX.roundBy(v, "round") < (cp.below ?? 1); }); if (hit && res.np != null && res.np > cp.max) { res.np = cp.max; res.capped = cp.label || `höchstens ${cp.max} NP`; } });
      out.parts.push(res);
    });
    const korr = out.parts.filter((p) => p.scoring !== "extern");
    if (r.combine === "sum") {
      out.max = PX.sum(korr.map((p) => p.max || 0));
      const bonus = r.bonus?.on ? Math.max(0, Math.min(+c.bonus || 0, r.bonus?.max || 0)) : 0;
      out.sumRaw = PX.sum(korr.map((p) => p.sum || 0)); out.bonus = bonus;
      out.sum = Math.min(out.max, out.sumRaw + bonus); out.pct = out.max ? (out.sum / out.max) * 100 : 0;
      out.npRaw = PX.keyLookup(r.key, out.sum);
    } else {
      const ws = r.combine === "mean" ? korr.map(() => 1) : korr.map((p) => p.weight || 1);
      const ok = korr.every((p) => p.np != null);
      out.npRaw = ok ? PX.sum(korr.map((p, i) => p.np * ws[i])) / PX.sum(ws) : null;
      out.sum = out.npRaw; out.max = 15;
    }
    if (out.npRaw != null) out.npRaw = PX.roundBy(out.npRaw, r.round?.stage || "round");
    const abz = Math.min(+c.abzug || 0, r.abzugMax ?? 2);
    out.np = out.complete && out.npRaw != null ? Math.max(0, PX.roundBy(out.npRaw - abz, r.round?.stage || "round")) : null;
    out.hasExtern = out.parts.some((p) => p.scoring === "extern");
    return out;
  };
  PX.result = (c, r, km, m) => PX.evaluate(r, c, km, m);

  // Endnote: Endbeurteilung, sonst Ø EK/ZK (Rundung je Fach); nicht korrekturrelevante Teile werden gewichtet ergänzt
  PX.finalNP = function (m, r) {
    let base, src;
    if (m.corr.eb?.state === "fertig") { base = m.corr.eb.np; src = "Endbeurteilung"; }
    else if (m.corr.ek?.np != null && m.corr.zk?.np != null) { base = PX.roundBy((m.corr.ek.np + m.corr.zk.np) / 2, r.round?.final || "ceil"); src = `Ø EK/ZK (${PX.ROUND[r.round?.final || "ceil"]})`; }
    else return null;
    const ext = r.parts.filter((p) => p.scoring === "extern");
    if (!ext.length) return { np: base, src };
    const korrW = PX.sum(r.parts.filter((p) => p.scoring !== "extern").map((p) => +p.weight || 0));
    if (ext.some((p) => m.extern?.[p.id] == null || m.extern?.[p.id] === "")) return { np: null, base, src, pending: ext.map((p) => p.name).join(", ") };
    const v = (base * korrW + PX.sum(ext.map((p) => (+m.extern[p.id]) * (+p.weight || 0)))) / (korrW + PX.sum(ext.map((p) => +p.weight || 0)));
    return { np: PX.roundBy(v, r.round?.withExtern || "round"), base, src: src + " + " + ext.map((p) => p.name).join(", ") };
  };

  // ---------- Darstellung: Bewertungsbereich (Korrektur und Testrechnung) ----------
  // opts: { edit, lehrerEdit, ekView, m, focus }
  PX.scoringHtml = function (r, c, km, opts = {}) {
    const res = PX.evaluate(r, c, km, opts.m); const act = PX.activeSet(r, c, km);
    const dis = opts.edit ? "" : "disabled";
    const nodeRow = (n, p, depth) => {
      const leaf = PX.isLeaf(r, n); const on = act.has(n.id);
      if (!leaf) {
        const v = res.val(n.id); const mx = p.scoring === "np" ? null : PX.nodeMax(r, n);
        return `<div class="rnode d${depth} ${on ? "" : "off"}"><div class="rn-h"><b>${esc(n.no)}</b> <span class="small">${esc(n.title || "")}</span><span class="grow"></span>${n.weight != null && p.scoring === "np" ? `<span class="xs muted">Gew. ${PX.fmtNP(n.weight * 100)} %</span>` : ""}<span class="xs">${on ? (p.scoring === "np" ? PX.fmtNP(v) + " NP" : `${v ?? "–"} / ${mx}`) : ""}</span></div>${on ? children(n.id, p, depth + 1) : ""}</div>`;
      }
      const v = c.be?.[n.id]; const nb = v === "nb";
      const max = p.scoring === "np" ? 15 : p.scoring === "fehler" ? null : +n.be;
      return `<div class="rleaf d${depth} ${on ? "" : "off"} ${opts.focus === n.id ? "focus" : ""}"><span class="no">${esc(n.no)}</span><span class="tt small">${esc(n.title || "")}${n.weight != null && p.scoring === "np" ? ` <span class="xs muted">(${PX.fmtNP(n.weight * 100)} %)</span>` : ""}</span>
        ${on ? `<span class="mx xs muted">${max != null ? "max " + max : "Fehler"}</span><input class="input sm num" type="number" step="${p.scoring === "fehler" || n.half ? "0.25" : "1"}" min="0" ${max != null ? `max="${max}"` : ""} data-v="${n.id}" value="${nb ? "" : v ?? ""}" ${dis || (nb ? "disabled" : "")} aria-label="${esc(n.no)}">
        ${p.scoring !== "np" && p.scoring !== "fehler" ? `<label class="nb" title="nicht bearbeitet"><input type="checkbox" data-nb="${n.id}" ${nb ? "checked" : ""} ${dis}>n. b.</label>` : ""}
        ${opts.anchors ? (() => { const an = opts.anchors[n.id]; const here = an && an.page === opts.page; return `<button class="anc ${an ? "on" : ""} ${here ? "here" : ""}" data-anc="${n.id}" title="${an ? (here ? "Sprungmarke auf dieser Seite" + (opts.anchorEdit ? " – klicken: an der letzten Markierung neu setzen" : "") : "Zur Sprungmarke springen") : opts.anchorEdit ? "Sprungmarke auf dieser Seite setzen" : "keine Sprungmarke"}">${icon("bookmark")}${an ? " S. " + opts.pageNo(an.page) : ""}</button>`; })() : ""}
        ${p.scoring === "fehler" && opts.markCount != null ? `<button class="link xs" data-fromsigns="${n.id}" ${dis}>aus Zeichen: ${PX.fmtNP(opts.markCount)}</button>` : ""}` : ""}</div>`;
    };
    const children = (parentId, p, depth) => {
      const ks = parentId ? PX.kids(r, parentId) : PX.kids(r, null, p.id); const done = new Set(); let h = "";
      ks.forEach((k) => {
        const g = PX.groupOfNode(r, k.id);
        if (!g) { h += nodeRow(k, p, depth); return; }
        if (done.has(g.id)) return; done.add(g.id);
        const ch = PX.choiceOf(r, g, c, km); const canPick = g.chooser === "lehrer" ? opts.lehrerEdit : opts.edit;
        h += `<div class="rgroup ${g.chooser}"><div class="rg-h">${icon("shuffle")} <b class="small">${esc(g.label)}</b> <span class="xs muted">${g.pick} aus ${g.options.length}</span> ${g.chooser === "lehrer" ? PX.badge("Lehrerwahl · gilt für die Kursmappe", "purple") : PX.badge("Schülerwahl", "gray")}</div>
          <div class="rg-opts">${g.options.map((id) => { const o = r.nodes.find((x) => x.id === id); return `<label class="${g.pick === 1 ? "radio" : "checkbox"} small"><input type="${g.pick === 1 ? "radio" : "checkbox"}" name="g-${g.id}" data-g="${g.id}" value="${id}" ${ch.includes(id) ? "checked" : ""} ${canPick ? "" : "disabled"}> ${esc(o?.no || id)}</label>`; }).join("")}</div>
          ${g.options.map((id) => { const o = r.nodes.find((x) => x.id === id); return o && ch.includes(id) ? nodeRow(o, p, depth) : ""; }).join("")}</div>`;
      });
      return h;
    };
    const partsHtml = r.parts.map((p) => {
      const pr = res.parts.find((x) => x.id === p.id);
      if (p.scoring === "extern") return opts.ekView ? `<div class="rpart ext"><div class="rp-h"><b>${esc(p.name)}</b> <span class="xs muted">${p.weight} % · nicht korrekturrelevant</span></div><div class="rleaf"><span class="tt small">Notenpunkte (kann auch nach Abschluss eingetragen werden)</span><input class="input sm num" type="number" min="0" max="15" data-ext="${p.id}" value="${opts.m?.extern?.[p.id] ?? ""}" ${opts.extEdit ? "" : "disabled"}></div></div>` : `<div class="rpart ext"><div class="rp-h"><b>${esc(p.name)}</b> <span class="xs muted">${p.weight} % · nicht korrekturrelevant – kein Einblick</span></div></div>`;
      return `<div class="rpart"><div class="rp-h"><b>${esc(p.name)}</b><span class="xs muted">${PX.SCORING_SHORT[p.scoring]}${r.combine !== "sum" ? " · " + (r.combine === "mean" ? "Mittelwert" : p.weight + " %") : ""}</span><span class="grow"></span><span class="xs">${p.scoring === "be" || p.scoring === "pct" ? `${pr.sum} / ${pr.max} BE` : p.scoring === "fehler" ? `${PX.fmtNP(pr.sum)} Fehler` : ""}${r.combine !== "sum" ? ` → <b>${PX.fmtNP(pr.np)} NP</b>` : ""}</span></div>
        ${pr.capped ? `<div class="xs warntext">${icon("triangle-alert")} Kappung: ${esc(pr.capped)}</div>` : ""}${children(null, p, 0)}</div>`;
    }).join("");
    const totals = `<div class="rtotal">${r.combine === "sum" ? `<div class="row between small"><span>Summe</span><span>${res.sumRaw ?? 0} / ${res.max} BE</span></div>
      ${r.bonus?.on && r.bonus?.max ? `<div class="row between small mt-s"><label for="bonus">Zusatz-BE für besonders gute Lösungen (max. ${r.bonus.max})</label><input class="input sm num" type="number" min="0" max="${r.bonus.max}" id="bonus" value="${c.bonus || 0}" ${dis}></div>` : ""}
      <div class="row between small mt-s"><span>${esc(PX.KEYS[r.key]?.name || "Notenschlüssel")}</span><b>${res.sum ?? 0} BE → ${res.npRaw ?? "–"} NP</b></div>`
      : `<div class="row between small"><span>${r.combine === "mean" ? "Mittelwert der Teilnoten" : "Gewichtete Teilnoten"} (${esc(PX.ROUND[r.round?.stage || "round"])})</span><b>${PX.fmtNP(res.npRaw)} NP</b></div>`}
      <div class="row between small mt-s"><label for="abz">Abzug Sprachrichtigkeit/Form</label><select class="select sm" id="abz" style="width:90px" ${dis}>${[0, 1, 2].slice(0, (r.abzugMax ?? 2) + 1).map((v) => `<option value="${v}" ${+c.abzug === v ? "selected" : ""}>−${v} NP</option>`).join("")}</select></div>
      <div class="npbig ${opts.stage || "ek"}"><span>Notenpunkte${res.hasExtern ? "<br><small class='xs'>schriftlicher Teil (Zwischenergebnis)</small>" : ""}</span><b>${PX.fmtNP(res.np)}</b></div>
      ${res.missing.length ? `<div class="xs muted">${icon("info")} ${res.missing.map(esc).join(" · ")}</div>` : ""}</div>`;
    return partsHtml + totals;
  };
  PX.bindScoring = function (root, r, c, km, onChange, opts = {}) {
    const fire = (msg) => onChange && onChange(msg);
    $$("[data-v]", root).forEach((i) => (i.onchange = () => {
      const n = r.nodes.find((x) => x.id === i.dataset.v); const p = PX.partOf(r, n);
      let v = i.value === "" ? "" : +i.value;
      if (v !== "") { const step = p.scoring === "fehler" || n.half ? 0.25 : 1; v = Math.round(v / step) * step; const max = p.scoring === "np" ? 15 : p.scoring === "fehler" ? 999 : +n.be; v = Math.max(0, Math.min(max, v)); }
      c.be = c.be || {}; if (v === "") delete c.be[n.id]; else c.be[n.id] = v; fire({ focusNext: n.id });
    }));
    $$("[data-nb]", root).forEach((i) => (i.onchange = () => { c.be = c.be || {}; if (i.checked) c.be[i.dataset.nb] = "nb"; else delete c.be[i.dataset.nb]; fire(); }));
    $$("[data-g]", root).forEach((i) => (i.onchange = () => {
      const g = r.groups.find((x) => x.id === i.dataset.g);
      const store = g.chooser === "lehrer" ? (km.lehrerwahl = km.lehrerwahl || {}) : (c.wahl = c.wahl && !Array.isArray(c.wahl) ? c.wahl : {});
      let cur = (store[g.id] || []).filter((id) => g.options.includes(id));
      if (g.pick === 1) cur = [i.value]; else cur = i.checked ? [...new Set([...cur, i.value])].slice(-g.pick) : cur.filter((x) => x !== i.value);
      store[g.id] = cur; fire({ lehrer: g.chooser === "lehrer" ? g : null });
    }));
    const b = $("#bonus", root); if (b) b.onchange = () => { c.bonus = Math.max(0, Math.min(+b.value || 0, r.bonus.max)); fire(); };
    const a = $("#abz", root); if (a) a.onchange = () => { c.abzug = +a.value; fire(); };
    $$("[data-ext]", root).forEach((i) => (i.onchange = () => { opts.m.extern = opts.m.extern || {}; opts.m.extern[i.dataset.ext] = i.value === "" ? "" : Math.max(0, Math.min(15, Math.round(+i.value))); fire({ extern: true }); }));
    $$("[data-fromsigns]", root).forEach((x) => (x.onclick = () => { c.be = c.be || {}; c.be[x.dataset.fromsigns] = opts.markCount; fire(); }));
  };

  // Kurzübersicht (Vorschau)
  PX.rasterPreview = function (r) {
    if (!r) return "";
    const tree = (pid, partId, d) => PX.kids(r, pid, partId).map((n) => { const g = PX.groupOfNode(r, n.id); const p = PX.partOf(r, n); return `<tr class="d${d}"><td style="padding-left:${8 + d * 16}px">${esc(n.no)}</td><td>${esc(n.title || "")}</td><td>${g ? PX.badge((g.chooser === "lehrer" ? "Lehrerwahl " : "Wahl ") + g.label, g.chooser === "lehrer" ? "purple" : "cyan") : n.pflicht ? PX.badge("Pflicht", "gray") : ""}</td><td class="num">${PX.isLeaf(r, n) ? (p.scoring === "np" ? "≤15 NP" : p.scoring === "fehler" ? "Fehler" : n.be) : p.scoring === "np" ? "" : PX.nodeMax(r, n)}${n.weight != null && p.scoring === "np" ? ` <span class="xs muted">${PX.fmtNP(n.weight * 100)} %</span>` : ""}</td></tr>` + tree(n.id, null, d + 1); }).join("");
    return `<div class="card pad"><h3>${icon("table")} ${esc(r.name)}</h3><div class="xs muted">${esc(PX.COMBINE[r.combine])} · Rundung: ${esc(PX.ROUND[r.round?.stage || "round"])} · ${PX.badge(r.status, r.status === "freigegeben" ? "green" : "yellowb")}</div>
      ${r.parts.map((p) => `<h4 class="mt">${esc(p.name)} <span class="xs muted">${esc(PX.SCORING[p.scoring])}${r.combine !== "sum" ? " · " + p.weight + " %" : ""}${p.key ? " · " + esc(PX.KEYS[p.key]?.name) : ""}</span></h4>${p.scoring === "extern" ? "" : `<table class="tbl compact"><tbody>${tree(null, p.id, 0)}</tbody></table>`}`).join("")}
      ${r.combine === "sum" ? `<div class="xs mt-s">${icon("sigma")} max. ${PX.maxBE(r)} BE · ${esc(PX.KEYS[r.key]?.name || "")}${r.bonus?.on ? ` · Zusatz-BE bis ${r.bonus.max}` : ""}</div>` : ""}
      ${(r.caps || []).map((cp) => `<div class="xs">${icon("triangle-alert")} ${esc(cp.label)}</div>`).join("")}
      <div class="xs">${icon("notebook-pen")} Gutachten: ${r.gutachten?.on ? `aktiv${r.gutachten.sections?.length > 1 ? " · gegliedert: " + r.gutachten.sections.map(esc).join(", ") : ""} · ${r.gutachten.bausteine?.length || 0} Bausteine` : "inaktiv"}${r.formPdf ? ` · ${icon("file-up")} Formblatt (PDF) erforderlich` : ""}</div></div>`;
  };

  // ---------- Aufbau aus Zeilen (Seed und Excel-Import) ----------
  // rows: [{ teil, no, title, be, pflicht, group, pick, groupMax }]
  PX.buildRaster = function (rows, base) {
    const r = Object.assign({ id: PX.uid("rs-"), status: "entwurf", combine: "sum", key: "bg120", round: { stage: "round", final: "ceil", withExtern: "round" }, abzugMax: 2, bonus: { on: false, max: 0 }, gutachten: { on: false, sections: ["Gutachten"], bausteine: [] }, formPdf: false, caps: [] }, base || {});
    r.parts = []; r.nodes = []; r.groups = []; const report = [];
    let teil = null;
    rows.forEach((row) => {
      if (row.teil) teil = String(row.teil).trim();
      if (!row.no) return;
      const no = String(row.no).trim();
      let part = r.parts.find((p) => p.name === (teil || "Prüfung"));
      if (!part) { part = { id: "p" + (r.parts.length + 1), name: teil || "Prüfung", scoring: "be", weight: 0 }; r.parts.push(part); }
      const segs = no.split("."); let parent = null;
      for (let i = segs.length - 1; i > 0 && !parent; i--) { const pn = segs.slice(0, i).join("."); parent = r.nodes.find((n) => n.no === pn && n.part === part.id) || null; }
      r.nodes.push({ id: "n-" + no.replace(/[^A-Za-z0-9]/g, "_") + "-" + part.id, part: part.id, parent: parent ? parent.id : null, no, title: row.title || "", be: row.be === "" || row.be == null || isNaN(+row.be) ? null : +row.be, pflicht: !!row.pflicht, _given: row.given ?? null, _group: row.group, _pick: row.pick, _gmax: row.groupMax });
    });
    // Wahlgruppen aus den Kopfzeilen (oberste Ebene, nicht Pflicht)
    r.parts.forEach((p) => {
      const tops = r.nodes.filter((n) => n.part === p.id && !n.parent && !n.pflicht && n._group != null && n._group !== "");
      const byG = {}; tops.forEach((n) => (byG[n._group] = byG[n._group] || []).push(n));
      Object.entries(byG).forEach(([gk, ns]) => { const pick = +ns[0]._pick || ns.length; if (pick < ns.length) r.groups.push({ id: "g-" + p.id + "-" + gk, label: `${p.name}: ${pick} aus ${ns.length}`, options: ns.map((n) => n.id), pick, chooser: "schueler", _gmax: +ns[0]._gmax || null }); });
    });
    // Validierung
    r.nodes.forEach((n) => { if (PX.isLeaf(r, n) && (n.be == null)) report.push({ level: "error", text: `${n.no}: keine BE angegeben` }); });
    r.nodes.filter((n) => !PX.isLeaf(r, n)).forEach((n) => { const s = PX.nodeMax(r, n); if (n._given != null && n._given !== s) report.push({ level: "warn", text: `${n.no}: Summe der Teilaufgaben ${s} BE ≠ angegeben ${n._given} BE` }); else report.push({ level: "ok", text: `${n.no}: ${s} BE (Summe der Teilaufgaben)` }); });
    r.groups.forEach((g) => { const mx = g.pick * Math.max(...g.options.map((id) => PX.nodeMax(r, r.nodes.find((x) => x.id === id)))); if (g._gmax && g._gmax !== mx) report.push({ level: "warn", text: `${g.label}: max. BE ${mx} ≠ angegeben ${g._gmax}` }); else report.push({ level: "ok", text: `${g.label}: max. ${mx} BE` }); const sizes = new Set(g.options.map((id) => PX.nodeMax(r, r.nodes.find((x) => x.id === id)))); if (sizes.size > 1) report.push({ level: "warn", text: `${g.label}: Wahlaufgaben haben unterschiedliche BE (${[...sizes].join(" / ")})` }); });
    const total = PX.maxBE(r);
    const keyId = Object.keys(PX.KEYS).find((k) => PX.KEYS[k].kind === "be" && PX.KEYS[k].max === total && k.startsWith((base?.form || "BG").toLowerCase()));
    if (keyId) { r.key = keyId; report.push({ level: "ok", text: `Gesamt ${total} BE → ${PX.KEYS[keyId].name}` }); } else report.push({ level: "warn", text: `Gesamt ${total} BE – kein passender Notenschlüssel, bitte zuordnen` });
    r.nodes.forEach((n) => { delete n._group; delete n._pick; delete n._gmax; delete n._given; });
    r.groups.forEach((g) => delete g._gmax);
    return { raster: r, report };
  };

  // Excel (Format „Aufgabenstruktur“): Spalten Teil | Aufgaben | BE | Validierung | Pflichtaufgabe | Gruppe | Anzahl Aufgaben je Gruppe | Max BE je Gruppe
  PX.rowsFromSheet = function (aoa) {
    const hi = aoa.findIndex((row) => row.some((v) => /^aufgabe/i.test(String(v || "").trim())));
    const head = (aoa[hi] || []).map((v) => String(v || "").toLowerCase());
    const col = (re, d) => { const i = head.findIndex((h) => re.test(h)); return i >= 0 ? i : d; };
    const cA = col(/^aufgabe/, 1), cB = col(/^be$/, 2), cP = col(/pflicht/, 4), cG = col(/^gruppe/, 5), cN = col(/anzahl|abzahl/, 6), cM = col(/max/, 7), cT = col(/titel|bezeich/, -1);
    const rows = [];
    aoa.slice(hi + 1).forEach((row) => {
      const teil = row[0];
      const no = row[cA];
      rows.push({ teil: teil && String(teil).trim() ? String(teil).trim().replace(/\s+/g, " ").replace(/^Teil(\d)/i, "Teil $1") : null, no: no != null && String(no).trim() ? String(no).trim() : null, title: cT >= 0 ? row[cT] : "", be: row[cB], given: typeof row[cB] === "number" ? row[cB] : null, pflicht: !!(row[cP] && String(row[cP]).trim() && !/^(nein|0|false)$/i.test(String(row[cP]).trim())), group: row[cG], pick: row[cN], groupMax: row[cM] });
    });
    // BE nur an Blättern: Werte von Zwischenknoten als „angegeben“ zur Validierung
    return rows;
  };
  // Beispieldaten: Aufgabenstruktur VBWL (aus der übergebenen Excel-Datei)
  PX.SAMPLE_VBWL = (() => {
    const T1 = [["A1", null], ["A1.1"], ["A1.1.1", 4], ["A1.1.2", 6], ["A1.1.3", 3], ["A1.1.4", 10], ["A1.2"], ["A1.2.1", 4], ["A1.2.2", 4], ["A1.3"], ["A1.3.1", 4], ["A1.3.2", 5], ["A2"], ["A2.1"], ["A2.1.1", 6], ["A2.1.2", 6], ["A2.1.3", 10], ["A2.1.4", 6], ["A2.2"], ["A2.2.1", 2], ["A2.2.2", 10], ["A3"], ["A3.1", 3], ["A3.2", 2], ["A3.3"], ["A3.3.1", 5], ["A3.3.2", 4], ["A3.3.3", 5], ["A3.3.4", 4], ["A3.3.5", 5], ["A3.4", 12]];
    const T2 = [["A4"], ["A4.1"], ["A4.1.1", 3], ["A4.1.2", 4], ["A4.1.3", 3], ["A4.2"], ["A4.2.1", 3], ["A4.2.2", 4], ["A4.2.3", 3], ["A5"], ["A5.1"], ["A5.1.1", 4], ["A5.1.2", 3], ["A5.1.3", 4], ["A5.1.4", 4], ["A5.2", 5], ["A6"], ["A6.1"], ["A6.1.1", 3], ["A6.1.2", 3], ["A6.1.3", 3], ["A6.2", 4], ["A6.3", 3], ["A6.4", 4]];
    const head = [null, "Aufgaben", "BE", "Validierung", "Pflichtaufgabe", "Gruppe", "Abzahl Aufgaben je Gruppe", "Max BE je Gruppe"];
    const aoa = [head];
    T1.forEach(([no, be], i) => aoa.push([i === 0 ? "Teil1" : null, no, be ?? null, null, null, 1, 2, 80]));
    T2.forEach(([no, be], i) => aoa.push([i === 0 ? "Teil 2" : null, no, be ?? null, null, null, 2, 2, 40]));
    return aoa;
  })();
  PX.VBWL_TITLES = { A1: "Beschaffung und Investitionsentscheidung", A2: "Finanzierung und Jahresabschluss der AG", A3: "Absatzmarketing und Kostenrechnung", A4: "Preisbildung auf Märkten", A5: "Konjunktur und Geldpolitik", A6: "Arbeitsmarkt- und Umweltpolitik" };
})();
