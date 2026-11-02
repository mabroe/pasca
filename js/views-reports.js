/* PASCA Klickdummy – Berichte, Druckansichten, Service Center (Audit, Archiv) */
(function () {
  "use strict";
  const PX = window.PX; const { esc, icon, $, $$ } = PX; const O = () => PX.ops;

  // ---------- Berichte (RP, KM) ----------
  const P = { year: "2027", subject: "vbwl", type: "HT", school: "", kind: "schule" };
  const KINDS = [["schule", "Schulbericht", "school"], ["analyse", "Analysebericht", "chart-column"], ["aggregiert", "Aggregierter Bericht", "layers"], ["status", "Korrekturstatus", "gauge"], ["kurs", "Kursweise Berichte (EK/ZK/EB)", "files"]];
  const scopeSchools = () => { const r = PX.role(); return PX.schools().filter((s) => r === "km" || r === "svc" || s.rp === PX.me()?.org); };
  const anonym = () => PX.role() === "km";
  const sName = (id, i) => (anonym() ? "Schule " + String.fromCharCode(65 + i) : PX.orgName(id));
  function data() {
    const ex = PX.S.exams.find((e) => String(e.year) === P.year && e.subject === P.subject && e.type === P.type);
    const ss = scopeSchools().filter((s) => !P.school || s.id === P.school);
    const kms = ex ? PX.S.kms.filter((k) => k.exam === ex.id && ss.some((s) => s.id === k.school)) : [];
    const done = kms.filter((k) => k.stages.eb.sltOk);
    const ms = done.flatMap((k) => PX.activeMappen(k));
    return { ex, ss, kms, done, ms };
  }
  const bars = (rows, max = 1, fmt = (v) => Math.round(v * 100) + " %") => `<div class="hbars">${rows.map(([l, a, b]) => `<div class="hb"><span class="small">${esc(l)}</span><span class="hbt"><i class="a" style="width:${(a / max) * 100}%"></i>${b != null ? `<i class="b" style="width:${(b / max) * 100}%"></i>` : ""}</span><span class="xs">${fmt(a)}${b != null ? " / " + fmt(b) : ""}</span></div>`).join("")}</div>`;
  const avg = (a) => (a.length ? PX.sum(a) / a.length : 0);
  const fnp = (m) => m.final?.np ?? m.final?.base ?? 0;
  const leafMax = (r, l) => { const p = PX.partOf(r, l); return p.scoring === "np" ? 15 : p.scoring === "be" || p.scoring === "pct" ? +l.be : null; };
  const evalLeaves = (r) => PX.leaves(r).filter((l) => leafMax(r, l));
  const fmtV = (v) => (v === "nb" ? "n. b." : v == null ? "–" : PX.fmtNP(v));
  // Tabelle der bewerteten Aufgaben (Einsichtnahme, Berichte)
  PX.leafTable = (r, x, stages, opts = {}) => {
    const km = PX.km(x.km); const base = x.corr[stages[0]];
    const act = PX.activeLeaves(r, base, km).filter((l) => PX.partOf(r, l).scoring !== "extern");
    return `<table class="tbl compact ${opts.cls || ""}"><thead><tr><th>Aufgabe</th><th class="num">max.</th>${stages.map((s) => `<th class="num">${PX.STAGE_SHORT[s]}</th>`).join("")}</tr></thead><tbody>${act.map((l) => `<tr><td>${esc(l.no)} ${esc(l.title || "")}</td><td class="num">${PX.partOf(r, l).scoring === "fehler" ? "Fehler" : leafMax(r, l) ?? ""}</td>${stages.map((s) => `<td class="num">${fmtV(x.corr[s]?.be?.[l.id])}</td>`).join("")}</tr>`).join("")}
      ${r.parts.length > 1 ? r.parts.map((p) => `<tr class="sumrow"><td>${esc(p.name)}</td><td></td>${stages.map((s) => { const e = PX.evaluate(r, x.corr[s], km, x); const pr = e.parts.find((q) => q.id === p.id); return `<td class="num">${p.scoring === "extern" ? fmtV(x.extern?.[p.id]) : PX.fmtNP(pr?.np)} NP</td>`; }).join("")}</tr>`).join("") : ""}
      <tr class="sumrow"><td>Notenpunkte</td><td></td>${stages.map((s) => `<td class="num"><b>${PX.fmtNP(x.corr[s]?.np)}</b></td>`).join("")}</tr></tbody></table>`;
  };
  const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(".", ",");

  function reportBody() {
    const { ex, ss, kms, done, ms } = data();
    if (!ex) return PX.empty("Für diese Parameter gibt es keine Prüfung.", "search");
    const r = PX.raster(ex);
    if (P.kind === "status") return `<div class="tablewrap"><table class="tbl"><thead><tr><th>Schule</th><th>Kursmappen</th><th>Arbeiten</th><th>Phase</th></tr></thead><tbody>${ss.map((s, i) => { const ks = kms.filter((k) => k.school === s.id); return `<tr><td>${esc(sName(s.id, i))}</td><td>${ks.length}</td><td>${PX.sum(ks.map((k) => PX.activeMappen(k).length))}</td><td>${ks.map((k) => PX.badge(PX.phase(k).label, PX.phase(k).kind)).join(" ") || "–"}</td></tr>`; }).join("")}</tbody></table></div>`;
    if (P.kind === "kurs") return kms.length ? `<p class="small muted">Berichte je digitaler Mappe; Zugriff nur im Rahmen der Berechtigung (Ergebnisse erst nach Abschluss).</p><div class="tablewrap"><table class="tbl compact"><thead><tr><th>Kursmappe</th><th>Mappe</th><th>Berichte</th></tr></thead><tbody>${kms.flatMap((k) => PX.activeMappen(k).map((m) => `<tr><td>${esc(PX.kmLabel(k))}</td><td>${esc(PX.pseudo(m))}</td><td>${["ek", "zk", "eb"].filter((s) => m.corr[s]?.state === "fertig" && k.stages[s].sltOk).map((s) => `<button class="btn xs" data-rep="${s}|${m.id}">${PX.STAGE_SHORT[s]}-Bericht</button>`).join(" ") || `<span class="xs muted">noch keine</span>`}</td></tr>`)).join("")}</tbody></table></div>` : PX.empty("Keine Kursmappen.", "files");
    if (!ms.length) return `<div class="notice info">${icon("hourglass")}<div>Für die gewählten Parameter liegen noch keine abgeschlossenen Ergebnisse vor. Verfügbar ist bereits der <button class="link" data-kind="status">Korrekturstatus</button>.</div></div>`;
    const tasks = evalLeaves(r);
    const taskAvg = (list, t) => { const v = list.filter((m) => PX.activeSet(r, m.corr.ek, PX.km(m.km)).has(t.id)).map((m) => m.corr.ek?.be?.[t.id]).filter((x) => x !== undefined && x !== "").map((x) => (x === "nb" ? 0 : +x) / leafMax(r, t)); return v.length ? avg(v) : null; };
    const dist = Array.from({ length: 16 }, (_, i) => ms.filter((m) => fnp(m) === i).length);
    if (P.kind === "schule") {
      const rows = tasks.map((t) => [`${t.no} ${t.title || ""}`, taskAvg(ms, t), PX.LAND(t.id)]).filter((x) => x[1] != null);
      return `<div class="statgrid"><div class="stat"><div class="v">${ms.length}</div><div class="small muted">Arbeiten</div></div><div class="stat"><div class="v">${f1(avg(ms.map(fnp)))}</div><div class="small muted">Ø Endnote (NP)</div></div><div class="stat"><div class="v">8,1</div><div class="small muted">Ø Land (Vergleich, Demo)</div></div><div class="stat"><div class="v">${ms.filter((m) => fnp(m) < 5).length}</div><div class="small muted">unter 5 NP</div></div></div>
        <h3 class="mt">Ergebnisse je (Teil-)Aufgabe im Vergleich zum Landesdurchschnitt</h3><div class="legend xs"><span class="sw a"></span> ${P.school ? esc(sName(P.school, scopeSchools().findIndex((s) => s.id === P.school))) : "Auswahl"} <span class="sw b"></span> Land</div>${bars(rows)}
        <h3 class="mt">Notenverteilung (Endnote)</h3>${histo(dist)}`;
    }
    if (P.kind === "analyse") {
      const diffs = ms.map((m) => Math.round((m.corr.ek?.np ?? 0) - (m.corr.zk?.np ?? 0)));
      const dh = Array.from({ length: 11 }, (_, i) => diffs.filter((d) => d === i - 5 || (i === 0 && d < -5) || (i === 10 && d > 5)).length);
      const mx = Math.max(1, ...dh);
      return `<div class="statgrid"><div class="stat"><div class="v">${f1(avg(diffs.map(Math.abs)))}</div><div class="small muted">Ø |EK − ZK| (NP)</div></div><div class="stat"><div class="v">${ms.filter((m) => m.ebRequired).length}</div><div class="small muted">Endbeurteilungen (> 3 NP${ms.some((m) => m.ebRequired === "stichprobe") ? " + Stichprobe" : ""})</div></div><div class="stat"><div class="v">${f1((ms.filter((m) => m.ebRequired).length / ms.length) * 100)} %</div><div class="small muted">EB-Quote</div></div><div class="stat"><div class="v">${f1(avg(ms.map((m) => m.corr.ek.np)))} / ${f1(avg(ms.map((m) => m.corr.zk.np)))}</div><div class="small muted">Ø EK / Ø ZK</div></div></div>
        <h3 class="mt">Abweichungsstatistik EK − ZK (Notenpunkte)</h3><div class="vbars">${dh.map((n, i) => `<div class="vb ${Math.abs(i - 5) > 3 ? "warn" : ""}"><i style="height:${(n / mx) * 100}%"></i><b>${n || ""}</b><span>${i === 0 ? "≤−5" : i === 10 ? "≥5" : i - 5 > 0 ? "+" + (i - 5) : i - 5}</span></div>`).join("")}</div><p class="xs muted">Rot: Abweichung > 3 NP – Endbeurteilung ausgelöst.</p>
        <h3 class="mt">Bearbeitungsquote der Wahlaufgaben</h3>${(r.groups || []).length ? bars(r.groups.flatMap((g) => g.options.map((id) => [`${r.nodes.find((n) => n.id === id)?.no} (${g.chooser === "lehrer" ? "Lehrerwahl" : "Schülerwahl"})`, ms.filter((m) => PX.choiceOf(r, g, m.corr.ek, PX.km(m.km)).includes(id)).length / ms.length, null]))) : `<p class="small muted">Keine Wahlaufgaben.</p>`}
        <h3 class="mt">Schwierigste Teilaufgaben (Ø Lösungsquote)</h3>${bars(tasks.map((t) => [`${t.no} ${t.title || ""}`, taskAvg(ms, t)]).filter((x) => x[1] != null).sort((a, b) => a[1] - b[1]).slice(0, 4))}`;
    }
    if (P.kind === "aggregiert") return `<div class="tablewrap"><table class="tbl"><thead><tr><th>Schule</th><th class="num">Arbeiten</th><th class="num">Ø EK</th><th class="num">Ø ZK</th><th class="num">Ø Endnote</th><th class="num">EB</th><th class="num">unter 5 NP</th></tr></thead><tbody>${ss.map((s, i) => { const l = ms.filter((m) => PX.km(m.km).school === s.id); return l.length ? `<tr><td>${esc(sName(s.id, i))}</td><td class="num">${l.length}</td><td class="num">${f1(avg(l.map((m) => m.corr.ek.np)))}</td><td class="num">${f1(avg(l.map((m) => m.corr.zk.np)))}</td><td class="num"><b>${f1(avg(l.map(fnp)))}</b></td><td class="num">${l.filter((m) => m.ebRequired).length}</td><td class="num">${l.filter((m) => fnp(m) < 5).length}</td></tr>` : `<tr class="dim"><td>${esc(sName(s.id, i))}</td><td colspan="6" class="small">noch nicht abgeschlossen</td></tr>`; }).join("")}<tr class="sumrow"><td>Gesamt</td><td class="num">${ms.length}</td><td class="num">${f1(avg(ms.map((m) => m.corr.ek.np)))}</td><td class="num">${f1(avg(ms.map((m) => m.corr.zk.np)))}</td><td class="num"><b>${f1(avg(ms.map(fnp)))}</b></td><td class="num">${ms.filter((m) => m.ebRequired).length}</td><td class="num">${ms.filter((m) => fnp(m) < 5).length}</td></tr></tbody></table></div>`;
    return "";
  }
  function histo(dist) { const mx = Math.max(1, ...dist); return `<div class="vbars">${dist.map((n, i) => `<div class="vb ${i < 5 ? "warn" : ""}"><i style="height:${(n / mx) * 100}%"></i><b>${n || ""}</b><span>${i}</span></div>`).join("")}</div>`; }

  PX.route(/^berichte$/, () => ({ title: "Berichte", shell: "staff", need: ["rp", "km"], render: () => {
    const years = [...new Set(PX.S.exams.map((e) => String(e.year)))];
    return `${PX.pagehead("Berichte", PX.role() === "km" ? "Landesweit · anonymisiert und aggregiert" : esc(PX.orgName(PX.me().org)), `<button class="btn" id="pdf">${icon("printer")} PDF (Druck)</button><button class="btn" id="csv">${icon("download")} CSV</button>${PX.role() === "rp" || PX.role() === "km" ? `<button class="btn" id="raw">${icon("database")} Rohdaten exportieren</button>` : ""}`)}
      <div class="card pad paramcard"><div class="params"><label>Abiturjahr<select class="select" data-p="year">${years.map((y) => `<option ${P.year === y ? "selected" : ""}>${y}</option>`).join("")}</select></label>
        <label>Prüfungsfach<select class="select" data-p="subject">${PX.S.subjects.map((s) => `<option value="${s.id}" ${P.subject === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></label>
        <label>Prüfung<select class="select" data-p="type">${Object.entries(PX.TYPE).map(([k, v]) => `<option value="${k}" ${P.type === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        <label>Schule<select class="select" data-p="school"><option value="">alle (${scopeSchools().length})</option>${scopeSchools().map((s, i) => `<option value="${s.id}" ${P.school === s.id ? "selected" : ""}>${esc(sName(s.id, i))}</option>`).join("")}</select></label></div>
        <div class="kindtabs">${KINDS.map(([k, l, ic]) => `<button class="${P.kind === k ? "active" : ""}" data-kind="${k}">${icon(ic)} ${l}</button>`).join("")}</div></div>
      <div class="card pad mt report" id="rep"><div class="rephead"><b>${esc(KINDS.find((k) => k[0] === P.kind)[1])}</b><span class="small muted">Abitur ${esc(P.year)} · ${esc(PX.subj(P.subject)?.name)} · ${PX.TYPE[P.type]} · ${P.school ? esc(sName(P.school, scopeSchools().findIndex((s) => s.id === P.school))) : "alle Schulen"} · erstellt ${PX.fmtD(PX.S.now)}</span></div>${reportBody()}</div>`;
  }, mount: (r) => {
    $$("[data-p]", r).forEach((s) => (s.onchange = () => { P[s.dataset.p] = s.value; PX.rerender(); }));
    $$("[data-kind]", r).forEach((b) => (b.onclick = () => { P.kind = b.dataset.kind; PX.rerender(); }));
    $$("[data-rep]", r).forEach((b) => (b.onclick = () => { const [s, id] = b.dataset.rep.split("|"); window.open(location.href.split("#")[0] + `#/druck/bericht/${s}/${id}`, "_blank"); }));
    $("#pdf", r).onclick = () => { PX.audit("Bericht exportiert (PDF)", KINDS.find((k) => k[0] === P.kind)[1], `${P.year} ${P.subject} ${P.type}`); PX.save(); document.body.classList.add("printreport"); window.print(); setTimeout(() => document.body.classList.remove("printreport"), 500); };
    $("#csv", r).onclick = () => { const { ms } = data(); PX.audit("Bericht exportiert (CSV)", KINDS.find((k) => k[0] === P.kind)[1]); PX.save(); PX.download(`bericht_${P.kind}_${P.year}_${P.subject}.csv`, PX.csv([["schule", "kurs", "mappe", "ek_np", "zk_np", "eb_np", "endnote"], ...ms.map((m) => { const k = PX.km(m.km); const i = scopeSchools().findIndex((s) => s.id === k.school); return [sName(k.school, i), anonym() ? "" : k.name, PX.pseudo(m), m.corr.ek.np, m.corr.zk.np, m.corr.eb?.state === "fertig" ? m.corr.eb.np : "", m.final?.np ?? ""]; })])); };
    const raw = $("#raw", r); if (raw) raw.onclick = async () => { if (!(await PX.confirm("Rohdaten exportieren?", "Der Rohdatenexport (alle Bewertungseinheiten je Teilaufgabe, pseudonymisiert) erfordert gesonderte Benutzerrechte und wird protokolliert.", "Exportieren"))) return; const { ex, ms } = data(); const rr = PX.raster(ex); PX.audit("Rohdaten exportiert", `${P.year} ${P.subject} ${P.type}`, `${ms.length} Datensätze`); PX.save(); PX.download(`rohdaten_${P.year}_${P.subject}_${P.type}.csv`, PX.csv([["pseudonym", "schule", ...evalLeaves(rr).map((t) => "ek_" + t.no), ...(rr.groups || []).map((g) => "wahl_" + g.id), "ek_np", "zk_np", "eb_np", "endnote"], ...ms.map((m) => [PX.hash(m.id).toString(36).slice(2, 10), anonym() ? "" : PX.orgShort(PX.km(m.km).school), ...evalLeaves(rr).map((t) => m.corr.ek.be[t.id] ?? ""), ...(rr.groups || []).map((g) => PX.choiceOf(rr, g, m.corr.ek, PX.km(m.km)).map((id) => rr.nodes.find((n) => n.id === id)?.no).join("+")), m.corr.ek.np, m.corr.zk.np, m.corr.eb?.np ?? "", m.final?.np ?? ""])])); };
  } }));

  // ---------- Druckansichten ----------
  const printShell = (title, body) => ({ title, render: () => `<div class="printpage"><div class="printbar noprint"><b>${esc(title)}</b><span class="grow"></span><button class="btn primary" onclick="window.print()">${icon("printer")} Drucken / als PDF speichern</button><button class="btn" onclick="window.close()">Schließen</button></div>${body()}</div>` });
  PX.route(/^druck\/deckblaetter\/([^/]+)$/, (m) => printShell("Deckblätter", () => { const k = PX.km(m[1]); if (!k) return ""; return PX.activeMappen(k).map((x) => `<div class="printsheet">${PX.pageHtml(x, { id: "cv", kind: "deckblatt", n: 0, rot: 0 })}</div>`).join(""); }));
  PX.route(/^druck\/einsicht\/([^/]+)$/, (m) => printShell("Einsichtnahme", () => {
    const x = PX.mappe(m[1]); if (!x) return ""; const k = PX.km(x.km); const ex = PX.exam(k.exam); const r = PX.raster(ex);
    const marks = []; ["ek", "zk", "eb"].forEach((s) => (x.corr[s]?.marks || []).forEach((mk) => marks.push({ ...mk, stage: s })));
    const red = x.corr.ek?.redactions || [];
    return `<div class="printsheet doc"><h1>Einsichtnahme in die Prüfungsunterlagen</h1><p>${esc(x.first)} ${esc(x.last)} (${esc(x.nr)}) · ${esc(PX.examLabel(ex))} · ${esc(PX.orgName(k.school))}</p>
      ${PX.leafTable(r, x, ["ek", "zk", ...(x.corr.eb?.state === "fertig" ? ["eb"] : [])])}
      <p><b>Endnote: ${PX.fmtNP(x.final?.np)} Notenpunkte</b> (${esc(x.final?.src || "")}${x.final?.pending ? " – ausstehend: " + esc(x.final.pending) : ""})</p>${r.gutachten?.on ? ["ek", "zk", "eb"].filter((s) => x.corr[s]?.state === "fertig" && PX.gutachtenText(x.corr[s])).map((s) => `<h3>Gutachten ${PX.STAGE[s]}</h3><p class="pre small">${esc(PX.gutachtenText(x.corr[s]))}</p>`).join("") : ""}<p class="xs">Private Notizen der Korrektor:innen werden nicht ausgegeben. Erstellt am ${PX.fmtD(PX.S.now)}.</p></div>
      ${PX.pagesOf(x).map((p) => `<div class="printsheet">${PX.pageHtml(x, p, { marks, red })}</div>`).join("")}`;
  }));
  PX.route(/^druck\/bericht\/(ek|zk|eb)\/([^/]+)$/, (m) => printShell(PX.STAGE[m[1]] + "sbericht", () => {
    const st = m[1]; const x = PX.mappe(m[2]); if (!x) return ""; const k = PX.km(x.km); const ex = PX.exam(k.exam); const r = PX.raster(ex); const c = x.corr[st];
    if (!c || c.state !== "fertig") return PX.empty("Bericht noch nicht verfügbar.");
    const res = PX.evaluate(r, c, k, x);
    const showDiff = st === "zk" && k.stages.zk.sltOk;
    return `<div class="printsheet doc"><div class="row between"><h1>${PX.STAGE[st]}sbericht</h1>${PX.mark(36)}</div><p>${st === "ek" ? `${esc(x.first)} ${esc(x.last)} (${esc(x.nr)})` : esc(PX.pseudo(x))} · ${esc(PX.examLabel(ex))}</p>
      ${PX.kv([["Kursmappe", esc(st === "ek" ? PX.kmLabel(k) : "anonymisiert")], ["Korrigiert von", st === "ek" ? esc(PX.name(c.by)) : "Lehrkraft der " + PX.STAGE[st] + " (anonymisiert)"], ["Abgeschlossen am", PX.fmtD(c.at)], ["Wahl", esc((r.groups || []).map((g) => PX.choiceOf(r, g, c, k).map((id) => r.nodes.find((n) => n.id === id)?.no).join(", ")).filter(Boolean).join(" · ") || "–")], ["Korrekturzeichen gesetzt", String((c.marks || []).length)], ...(st === "ek" ? [["Geschwärzte Bereiche", String((c.redactions || []).length)]] : [])])}
      <div class="mt">${PX.leafTable(r, x, showDiff ? ["zk", "ek"] : [st])}</div>
      <p>${r.combine === "sum" ? `Summe ${res.sum} / ${res.max} BE${res.bonus ? ` (inkl. ${res.bonus} Zusatz-BE)` : ""} · ` : ""}vor Abzug ${PX.fmtNP(res.npRaw)} NP · Abzug: ${c.abzug || 0} NP · <b>Ergebnis: ${PX.fmtNP(c.np)} Notenpunkte</b>${res.hasExtern ? " (schriftlicher Teil)" : ""}${showDiff ? ` · Abweichung zur EK: <b>${PX.fmtNP(x.diff)} NP</b>${x.ebRequired ? " → Endbeurteilung" : ""}` : ""}</p>
      ${PX.gutachtenText(c) ? `<h3>Textliches Gutachten</h3><p class="pre">${esc(PX.gutachtenText(c))}</p>` : ""}${c.formPdf ? `<p class="small">${icon("file-text")} Formblatt: ${esc(c.formPdf.file)}</p>` : ""}${st === "ek" && c.hint ? `<p class="small">Hinweis an die Zweitkorrektur: ${esc(c.hint)}</p>` : ""}${st === "eb" ? `<p class="small">Diese Bewertung ist die endgültige Bewertung der schriftlichen Prüfung.</p>` : ""}</div>`;
  }));

  // ---------- Service Center: Audit-Log ----------
  const AF = { q: "", type: "", who: "", sel: [] };
  PX.route(/^svc\/audit$/, () => ({ title: "Audit-Log", shell: "staff", need: ["svc"], render: () => {
    const types = [...new Set(PX.S.audit.map((a) => a.action))].sort();
    const list = PX.S.audit.filter((a) => (!AF.type || a.action === AF.type) && (!AF.who || a.who === AF.who) && (!AF.q || `${a.action} ${a.object} ${a.detail} ${PX.name(a.who)}`.toLowerCase().includes(AF.q.toLowerCase())));
    return `${PX.pagehead("Audit-Log", "Revisionssicheres Ereignisprotokoll – chronologisch, neueste zuerst", `<button class="btn" id="exsel">${icon("download")} Markierte exportieren (${AF.sel.length})</button><button class="btn primary" id="exall">${icon("download")} Gefilterte Einträge exportieren</button>`)}
      <div class="filterbar"><div class="search"><input class="input" id="aq" placeholder="Freitextsuche" value="${esc(AF.q)}">${icon("search")}</div><select class="select" id="at"><option value="">Alle Ereignistypen</option>${types.map((t) => `<option ${AF.type === t ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>
        <select class="select" id="aw"><option value="">Alle Personen</option>${[...new Set(PX.S.audit.map((a) => a.who))].map((w) => `<option value="${esc(w)}" ${AF.who === w ? "selected" : ""}>${esc(w === "system" ? "System" : PX.name(w))}</option>`).join("")}</select>${AF.q || AF.type || AF.who ? `<button class="btn ghost sm" id="ar">${icon("x")} Zurücksetzen</button>` : ""}<span class="small muted">${list.length} von ${PX.S.audit.length} Einträgen</span></div>
      ${list.length ? `<div class="tablewrap"><table class="tbl compact"><thead><tr><th></th><th>Zeitpunkt</th><th>Person</th><th>Rolle</th><th>Ereignis</th><th>Objekt</th><th>Details</th></tr></thead><tbody>${list.slice(0, 300).map((a) => `<tr data-det="${a.id}" class="clickrow"><td><input type="checkbox" data-asel="${a.id}" ${AF.sel.includes(a.id) ? "checked" : ""}></td><td class="nowrap">${esc(a.at)}</td><td>${esc(a.who === "system" ? "System" : PX.name(a.who))}</td><td class="xs">${esc(PX.ROLES[a.role]?.short || a.role)}</td><td><b class="small">${esc(a.action)}</b></td><td class="small">${esc(a.object)}</td><td class="xs muted">${esc(a.detail)}</td></tr>`).join("")}</tbody></table></div>` : PX.empty("Keine Einträge für diese Filter.", "search")}`;
  }, mount: (r) => {
    const q = $("#aq", r); q.oninput = PX.debounce(() => { AF.q = q.value; PX.rerender(); const i = $("#aq"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250);
    $("#at", r).onchange = (e) => { AF.type = e.target.value; PX.rerender(); }; $("#aw", r).onchange = (e) => { AF.who = e.target.value; PX.rerender(); };
    const ar = $("#ar", r); if (ar) ar.onclick = () => { AF.q = AF.type = AF.who = ""; PX.rerender(); };
    $$("[data-asel]", r).forEach((c) => { c.onclick = (e) => e.stopPropagation(); c.onchange = () => { AF.sel = $$("[data-asel]:checked", r).map((x) => x.dataset.asel); $("#exsel", r).innerHTML = `${icon("download")} Markierte exportieren (${AF.sel.length})`; }; });
    $$("[data-det]", r).forEach((tr) => (tr.onclick = () => { const a = PX.S.audit.find((x) => x.id === tr.dataset.det); PX.modal({ title: "Audit-Eintrag", icon: "history", body: PX.kv([["Zeitpunkt", esc(a.at)], ["Person", esc(a.who === "system" ? "System" : PX.name(a.who))], ["Rolle", esc(PX.ROLES[a.role]?.label || a.role)], ["Ereignis", esc(a.action)], ["Objekt", esc(a.object)], ["Details", esc(a.detail || "–")], ["Ereignis-ID", esc(a.id)]]) }); }));
    const exp = (rows, name) => { PX.download(name, PX.csv([["zeitpunkt", "person", "rolle", "ereignis", "objekt", "details"], ...rows.map((a) => [a.at, a.who === "system" ? "System" : PX.name(a.who), a.role, a.action, a.object, a.detail])])); PX.audit("Audit-Log exportiert", name, `${rows.length} Einträge`); PX.save(); };
    $("#exall", r).onclick = () => exp(PX.S.audit.filter((a) => (!AF.type || a.action === AF.type) && (!AF.who || a.who === AF.who) && (!AF.q || `${a.action} ${a.object} ${a.detail}`.toLowerCase().includes(AF.q.toLowerCase()))), "audit_log.csv");
    $("#exsel", r).onclick = () => (AF.sel.length ? exp(PX.S.audit.filter((a) => AF.sel.includes(a.id)), "audit_log_auswahl.csv") : PX.toast("Keine Einträge markiert", "", "info"));
  } }));

  // ---------- Service Center: Archiv ----------
  PX.route(/^svc\/archiv$/, () => ({ title: "Archiv", shell: "staff", need: ["svc"], render: () => {
    const due = PX.S.archive.filter((a) => a.deleteAt <= PX.S.now);
    return `${PX.pagehead("Archiv und Aufbewahrungsfristen", "Revisionssichere Archivierung, automatische Löschung nach 5 Jahren", `<button class="btn ${due.length ? "primary" : ""}" id="del" ${due.length ? "" : "disabled"}>${icon("trash-2")} Löschlauf ausführen (${due.length} fällig)</button>`)}
      <div class="notice info">${icon("info")}<div class="small">Korrigierte Prüfungen werden nach Abschluss zentral archiviert und stehen berechtigten Personen zur Einsicht zur Verfügung. Die Aufbewahrung beträgt insgesamt 5 Jahre; danach werden die digitalen Prüfungsunterlagen gelöscht. Stellen Sie die Demo-Zeit auf den 01.08.2027, um eine fällige Löschung zu sehen.</div></div>
      <div class="tablewrap mt"><table class="tbl"><thead><tr><th>Archiv</th><th>Mappen</th><th>Archiviert</th><th>Löschung</th><th>Status</th></tr></thead><tbody>${PX.S.archive.map((a) => `<tr><td><b>${esc(a.label)}</b></td><td>${a.count}</td><td>${PX.fmtD(a.at)}</td><td>${PX.fmtD(a.deleteAt)}</td><td>${a.deleteAt <= PX.S.now ? PX.badge("Löschung fällig", "red") : PX.badge("aufbewahrt", "green")}</td></tr>`).join("")}</tbody></table></div>
      ${PX.S.deletedArchives.length ? `<h2 class="mt-l">Löschprotokoll</h2><div class="tablewrap"><table class="tbl compact"><tbody>${PX.S.deletedArchives.map((a) => `<tr><td>${esc(a.label)}</td><td>${a.count} Mappen</td><td>gelöscht am ${PX.fmtD(a.deletedAt)}</td></tr>`).join("")}</tbody></table></div>` : ""}`;
  }, mount: (r) => { const d = $("#del", r); if (d) d.onclick = async () => { if (await PX.confirm("Löschlauf ausführen?", "Alle Archive mit abgelaufener Aufbewahrungsfrist werden unwiderruflich gelöscht. Der Vorgang wird protokolliert.", "Löschen", true)) { const n = O().runDeletion(); PX.commit(); PX.toast("Löschlauf abgeschlossen", `${n} Archiv(e) gelöscht`); } }; } }));
})();
