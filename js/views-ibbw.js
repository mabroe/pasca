/* PASCA Klickdummy – Rolle Prüfungserstellung (IBBW) */
(function () {
  "use strict";
  const PX = window.PX; const { esc, icon, $, $$ } = PX; const O = () => PX.ops;
  const need = ["ibbw"];

  // ---------- Übersicht ----------
  PX.route(/^ibbw$/, () => ({ title: "Übersicht", shell: "staff", need, render: () => {
    const ex = PX.S.exams.filter((e) => e.year === 2027);
    const missing = ex.filter((e) => e.status === "angelegt" && !e.ewh && e.date <= PX.S.now);
    return `${PX.pagehead("Prüfungserstellung", "Abitur 2027 · Berufliche Gymnasien", `<a class="btn primary" href="#/ibbw/pruefung/neu">${icon("plus")} Prüfung anlegen</a>`)}
      <div class="statgrid"><div class="stat"><div class="v">${ex.filter((e) => e.status === "angelegt").length}</div><div class="small muted">Prüfungen angelegt</div></div>
      <div class="stat"><div class="v">${ex.filter((e) => e.status === "entwurf").length}</div><div class="small muted">Entwürfe</div></div>
      <div class="stat"><div class="v">${PX.S.rasters.filter((r) => r.status === "freigegeben").length}/${PX.S.rasters.length}</div><div class="small muted">Bewertungsraster freigegeben</div></div>
      <div class="stat"><div class="v">${PX.S.signs.length}</div><div class="small muted">Korrekturzeichen</div></div></div>
      ${missing.length ? `<div class="notice warn mt">${icon("triangle-alert")}<div><b>Erwartungshorizont fehlt</b><br>${missing.map((e) => `<a href="#/ibbw/pruefung/${e.id}?tab=grundlagen">${esc(PX.examLabel(e))}</a>`).join(", ")} – muss vor Beginn der Korrektur vorliegen.</div></div>` : ""}
      <h2 class="mt-l">Prüfungskalender 2027</h2>${examTable(ex.sort((a, b) => a.date.localeCompare(b.date)))}
      <div class="notice info mt">${icon("lock")}<div class="small">Bewertungsraster, Erwartungshorizont und Korrekturrichtlinie sind bis zum Ende der offiziellen Prüfungszeit nur für die anlegende Person sowie die zugehörige Referats- und Abteilungsleitung sichtbar. Prüfungsfach, Termin, Terminart und Korrekturzeiträume sehen die Schulen ab Anlage.</div></div>`;
  } }));

  function examTable(list) {
    if (!list.length) return PX.empty("Keine Prüfungen gefunden");
    return `<div class="tablewrap"><table class="tbl"><thead><tr><th>Prüfungsfach</th><th>Terminart</th><th>Termin</th><th>Korrekturzeiträume</th><th>Bewertungsraster</th><th>Erwartungshorizont</th><th>Status</th><th></th></tr></thead><tbody>
      ${list.map((e) => { const s = PX.subj(e.subject); const r = PX.byId("rasters", e.raster); return `<tr><td><b>${esc(s.name)}</b><div class="xs muted">${esc(s.form)}</div></td><td>${esc(PX.TYPE[e.type])}</td><td class="nowrap">${PX.fmtDW(e.date)}<div class="xs muted">${esc(e.time || "")}–${esc(e.end || "")} Uhr</div></td>
      <td class="xs">${e.ekEnd ? `EK bis ${PX.fmtD(e.ekEnd)}<br>ZK bis ${PX.fmtD(e.zkEnd)}<br>EB ${PX.fmtD(e.ebStart)}–${PX.fmtD(e.ebEnd)}` : `<span class="muted">fehlt</span>`}</td>
      <td class="small">${r ? esc(r.name) : `<span class="muted">–</span>`}</td><td class="small">${e.ewh ? `${icon("file-check")} ${PX.fmtD(e.ewh.date)}` : `<span class="muted">noch nicht</span>`}</td>
      <td>${e.status === "angelegt" ? PX.badge("angelegt", "green") : PX.badge("Entwurf", "yellowb")}</td><td><a class="btn sm" href="#/ibbw/pruefung/${e.id}">Öffnen</a></td></tr>`; }).join("")}</tbody></table></div>`;
  }

  // ---------- Prüfungsansicht ----------
  let filt = { q: "", subject: "", type: "", status: "" };
  PX.route(/^ibbw\/pruefungen$/, () => ({ title: "Prüfungen", shell: "staff", need, render: () => {
    let list = PX.S.exams.slice().sort((a, b) => a.date.localeCompare(b.date));
    if (filt.subject) list = list.filter((e) => e.subject === filt.subject);
    if (filt.type) list = list.filter((e) => e.type === filt.type);
    if (filt.status) list = list.filter((e) => e.status === filt.status);
    if (filt.q) list = list.filter((e) => PX.examLabel(e).toLowerCase().includes(filt.q.toLowerCase()) || PX.fmtD(e.date).includes(filt.q));
    return `${PX.pagehead("Prüfungen", "Alle Prüfungen und Prüfungstermine", `<a class="btn primary" href="#/ibbw/pruefung/neu">${icon("plus")} Prüfung anlegen</a>`)}
      <div class="filterbar"><div class="search"><input class="input" id="fq" placeholder="Suchen (Fach, Datum)" value="${esc(filt.q)}">${icon("search")}</div>
      <select class="select" id="fs"><option value="">Alle Prüfungsfächer</option>${PX.S.subjects.map((s) => `<option value="${s.id}" ${filt.subject === s.id ? "selected" : ""}>${esc(s.name)} (${esc(s.form)})</option>`).join("")}</select>
      <select class="select" id="ft"><option value="">Alle Terminarten</option>${Object.entries(PX.TYPE).map(([k, v]) => `<option value="${k}" ${filt.type === k ? "selected" : ""}>${v}</option>`).join("")}</select>
      <select class="select" id="fst"><option value="">Alle Status</option><option value="angelegt" ${filt.status === "angelegt" ? "selected" : ""}>angelegt</option><option value="entwurf" ${filt.status === "entwurf" ? "selected" : ""}>Entwurf</option></select>
      ${Object.values(filt).some(Boolean) ? `<button class="btn ghost sm" id="freset">${icon("x")} Filter zurücksetzen</button>` : ""}</div>
      ${list.length ? examTable(list) : PX.empty("Keine passenden Prüfungen gefunden", "search")}`;
  }, mount: (r) => {
    const upd = () => { filt = { q: $("#fq", r).value, subject: $("#fs", r).value, type: $("#ft", r).value, status: $("#fst", r).value }; PX.rerender(); };
    $("#fq", r).oninput = PX.debounce(() => { upd(); const i = $("#fq"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300);
    ["#fs", "#ft", "#fst"].forEach((s) => ($(s, r).onchange = upd));
    const fr = $("#freset", r); if (fr) fr.onclick = () => { filt = { q: "", subject: "", type: "", status: "" }; PX.rerender(); };
  } }));

  // ---------- Assistent „Prüfung anlegen“ ----------
  let wiz = null;
  const blankWiz = () => ({ step: 0, subject: "", terms: { HT: { on: true, date: "", time: "08:30", end: "13:00", ekEnd: "", zkEnd: "", ebStart: "", ebEnd: "" }, NT: { on: true, date: "", time: "08:30", end: "13:00", ekEnd: "", zkEnd: "", ebStart: "", ebEnd: "" }, NNT: { on: true, date: "", time: "08:30", end: "13:00", ekEnd: "", zkEnd: "", ebStart: "", ebEnd: "" } }, raster: "", guideline: "", zusatz: false });
  const STEPS = ["Prüfungsfach", "Prüfungstermine", "Korrekturzeiträume", "Bewertungsgrundlagen", "Prüfen und speichern"];
  function termErrors(t) {
    const e = [];
    if (!t.date) e.push("Prüfungstermin fehlt");
    if (!t.ekEnd || !t.zkEnd || !t.ebStart || !t.ebEnd) e.push("Korrekturzeiträume unvollständig");
    else { if (t.ekEnd <= t.date) e.push("Ende EK muss nach dem Prüfungstag liegen"); if (t.zkEnd <= t.ekEnd) e.push("Ende ZK muss nach Ende EK liegen"); if (t.ebStart <= t.zkEnd) e.push("Beginn EB muss nach Ende ZK liegen"); if (t.ebEnd <= t.ebStart) e.push("Ende EB muss nach Beginn EB liegen"); }
    return e;
  }
  PX.route(/^ibbw\/pruefung\/neu$/, () => { if (!wiz) wiz = blankWiz(); return { title: "Prüfung anlegen", shell: "staff", need, render: () => {
    if (!wiz) wiz = blankWiz();
    const s = PX.subj(wiz.subject); const w = wiz;
    let body = "";
    if (w.step === 0) {
      body = `<div class="field"><label class="lbl" for="w-sub">Prüfungsfach *</label><select class="select" id="w-sub"><option value="">Bitte wählen …</option>${PX.S.subjects.filter((x) => x.active).map((x) => `<option value="${x.id}" ${w.subject === x.id ? "selected" : ""}>${esc(x.name)} – ${esc(x.form)}</option>`).join("")}</select>
        <div class="xs muted mt-s">Prüfungsfächer für berufliche und allgemeinbildende Gymnasien werden unterschieden. Fehlt ein Fach, legen Sie es unter <a href="#/ibbw/faecher">Prüfungsfächer</a> an.</div></div>
        ${s ? `<div class="card soft pad"><h3>${icon("pen-line")} Korrekturzeichensatz „${esc(s.name)}“</h3><p class="small muted">Die Prüfung übernimmt den zum Zeitpunkt der Freigabe gültigen Zeichensatz des Prüfungsfachs.</p><div class="signs">${PX.signsFor(s.id).map((z) => `<span class="sign static" title="${esc(z.meaning)}">${esc(z.code)}</span>`).join("")}</div>
          <p class="small mt-s">Textliches Gutachten: <b>${s.gutachten ? "ja" : "nein"}</b> · Priorität Korrekturgruppenbildung: <b>${esc(s.prio)}</b></p></div>` : ""}`;
    }
    if (w.step === 1) body = `<p class="small muted">Für jede Terminart wird eine eigene Prüfung angelegt. Gepflegt wird nur der Tag der schriftlichen Prüfung.</p>
      <div class="tablewrap"><table class="tbl"><thead><tr><th>Terminart</th><th>Datum *</th><th>Beginn</th><th>Ende (offizielle Prüfungszeit)</th></tr></thead><tbody>
      ${Object.entries(w.terms).map(([k, t]) => `<tr><td><label class="checkbox"><input type="checkbox" data-on="${k}" ${t.on ? "checked" : ""} ${k === "HT" ? "disabled" : ""}> ${PX.TYPE[k]}</label></td><td><input type="date" class="input" data-f="${k}.date" value="${t.date}" ${t.on ? "" : "disabled"}></td><td><input type="time" class="input" data-f="${k}.time" value="${t.time}" ${t.on ? "" : "disabled"}></td><td><input type="time" class="input" data-f="${k}.end" value="${t.end}" ${t.on ? "" : "disabled"}></td></tr>`).join("")}</tbody></table></div>`;
    if (w.step === 2) body = `<p class="small muted">Der Prüfungstag ist Startdatum der Erstkorrektur; die Korrektur beginnt erst mit der Freigabe durch den Scan-Operator. Die Reihenfolge der Phasen wird geprüft.</p>
      <div class="tablewrap"><table class="tbl"><thead><tr><th>Terminart</th><th>Prüfung</th><th>Ende Erstkorrektur *</th><th>Ende Zweitkorrektur *</th><th>Beginn Endbeurteilung *</th><th>Ende Endbeurteilung *</th></tr></thead><tbody>
      ${Object.entries(w.terms).filter(([, t]) => t.on).map(([k, t]) => { const er = termErrors(t); return `<tr><td>${PX.TYPE[k]}</td><td class="nowrap">${PX.fmtD(t.date)}</td>${["ekEnd", "zkEnd", "ebStart", "ebEnd"].map((f) => `<td><input type="date" class="input" data-f="${k}.${f}" value="${t[f]}"></td>`).join("")}</tr>${er.length && t.ekEnd ? `<tr><td colspan="6"><span class="xs" style="color:var(--red)">${icon("circle-alert")} ${er.map(esc).join(" · ")}</span></td></tr>` : ""}`; }).join("")}</tbody></table></div>
      <div class="notice info mt">${icon("info")}<div class="small">Beginn Endbeurteilung: Erst ab diesem Datum ist die Endbeurteilung möglich – auch wenn einzelne Kurse früher fertig sind. So beginnt die EB landesweit gleichzeitig.</div></div>`;
    if (w.step === 3) {
      const rs = PX.S.rasters.filter((r) => r.subject === w.subject);
      body = `<div class="grid2"><div><div class="field"><label class="lbl" for="w-ras">Bewertungsraster *</label><select class="select" id="w-ras"><option value="">Bitte wählen …</option>${rs.map((r) => `<option value="${r.id}" ${w.raster === r.id ? "selected" : ""} ${r.status !== "freigegeben" ? "disabled" : ""}>${esc(r.name)}${r.status !== "freigegeben" ? " (nicht freigegeben)" : ""}</option>`).join("")}</select>
        <div class="xs muted mt-s">Nur freigegebene Raster des gewählten Fachs. Pro Prüfung genau ein Raster.</div>
        ${rs.some((r) => r.year < 2027) ? `<button class="btn sm mt-s" id="w-dup">${icon("copy")} Raster aus dem Vorjahr duplizieren</button>` : ""}</div>
        <div class="field"><label class="lbl" for="w-kr">Korrekturrichtlinie (optional)</label><select class="select" id="w-kr"><option value="">keine</option>${PX.S.guidelines.map((g) => `<option value="${g.id}" ${w.guideline === g.id ? "selected" : ""}>${esc(g.name)}</option>`).join("")}</select></div>
        <div class="field row"><label class="toggle"><input type="checkbox" id="w-zus" ${w.zusatz ? "checked" : ""}><span></span></label><div><b>Zusatzdateien durch Erstkorrektur erlauben</b><div class="xs muted">Standard: deaktiviert (nur in Ausnahmefällen, z. B. CAD-Dateien)</div></div></div></div>
        <div>${w.raster ? rasterPreview(PX.byId("rasters", w.raster)) : `<div class="card soft pad small muted">${icon("table")} Vorschau des Bewertungsrasters erscheint nach der Auswahl.</div>`}
        <div class="notice info mt">${icon("file-up")}<div class="small"><b>Erwartungshorizont</b> wird in der Regel am Prüfungstag hochgeladen (frühestens ab Beginn der Prüfung) – über die Prüfungsdetails.</div></div></div></div>`;
    }
    if (w.step === 4) {
      const errs = Object.entries(w.terms).filter(([, t]) => t.on).flatMap(([k, t]) => termErrors(t).map((e) => PX.TYPE[k] + ": " + e));
      if (!w.raster) errs.push("Bewertungsraster fehlt");
      body = `${PX.kv([["Prüfungsfach", esc(s?.name || "–") + " – " + esc(s?.form || "")], ["Korrekturzeichensatz", PX.signsFor(w.subject).map((z) => esc(z.code)).join(" ")], ["Bewertungsraster", esc(PX.byId("rasters", w.raster)?.name || "–")], ["Korrekturrichtlinie", esc(PX.byId("guidelines", w.guideline)?.name || "keine")], ["Zusatzdateien", w.zusatz ? "erlaubt" : "nicht erlaubt"]])}
        <div class="tablewrap mt"><table class="tbl compact"><thead><tr><th>Terminart</th><th>Prüfung</th><th>EK bis</th><th>ZK bis</th><th>EB von – bis</th></tr></thead><tbody>${Object.entries(w.terms).filter(([, t]) => t.on).map(([k, t]) => `<tr><td>${PX.TYPE[k]}</td><td>${PX.fmtDW(t.date)} ${esc(t.time)}–${esc(t.end)}</td><td>${PX.fmtD(t.ekEnd)}</td><td>${PX.fmtD(t.zkEnd)}</td><td>${PX.fmtD(t.ebStart)} – ${PX.fmtD(t.ebEnd)}</td></tr>`).join("")}</tbody></table></div>
        ${errs.length ? `<div class="notice warn mt">${icon("circle-alert")}<div><b>Pflichtangaben unvollständig</b><br>${errs.map(esc).join("<br>")}<br><span class="small">Sie können die Prüfung als Entwurf speichern und später vervollständigen.</span></div></div>` : `<div class="notice success mt">${icon("circle-check")}<div>Alle Pflichtangaben sind vollständig. Nach dem Speichern erhalten die Schulleitungsteams eine Information.</div></div>`}`;
    }
    return `${PX.pagehead("Prüfung anlegen", "Assistent · " + STEPS[w.step], `<button class="btn ghost" id="w-demo" title="Termine des Demo-Szenarios eintragen">${icon("zap")} Demo-Werte einsetzen</button><button class="btn" id="w-cancel">${icon("x")} Abbrechen</button>`)}
      ${PX.steps(STEPS, w.step)}<div class="card pad mt">${body}</div>
      <div class="row between mt"><button class="btn" id="w-back" ${w.step === 0 ? "disabled" : ""}>${icon("arrow-left")} Zurück</button>
      <div class="row">${w.step === 4 ? `<button class="btn" id="w-draft">${icon("save")} Als Entwurf speichern</button><button class="btn primary" id="w-save">${icon("check")} Prüfung speichern</button>` : `<button class="btn primary" id="w-next">Weiter ${icon("arrow-right")}</button>`}</div></div>`;
  }, mount: (r) => {
    if (!wiz) wiz = blankWiz(); const w = wiz;
    $$("[data-f]", r).forEach((i) => (i.onchange = () => { const [k, f] = i.dataset.f.split("."); w.terms[k][f] = i.value; if (w.step === 2) PX.rerender(); }));
    $$("[data-on]", r).forEach((i) => (i.onchange = () => { w.terms[i.dataset.on].on = i.checked; PX.rerender(); }));
    const sub = $("#w-sub", r); if (sub) sub.onchange = () => { w.subject = sub.value; w.raster = ""; PX.rerender(); };
    const ras = $("#w-ras", r); if (ras) ras.onchange = () => { w.raster = ras.value; PX.rerender(); };
    const kr = $("#w-kr", r); if (kr) kr.onchange = () => (w.guideline = kr.value);
    const zus = $("#w-zus", r); if (zus) zus.onchange = () => (w.zusatz = zus.checked);
    const dup = $("#w-dup", r); if (dup) dup.onclick = () => dupDialog(PX.S.rasters.filter((x) => x.subject === w.subject && x.year < 2027).sort((a, b) => b.year - a.year)[0], (nr) => { w.raster = ""; PX.toast("Raster dupliziert", `„${nr.name}“ als Entwurf angelegt. Bitte prüfen und freigeben – danach steht es hier zur Auswahl.`, "info"); PX.go("#/ibbw/raster/" + nr.id + "?back=wiz"); });
    $("#w-back", r).onclick = () => { w.step--; PX.rerender(); };
    const nx = $("#w-next", r); if (nx) nx.onclick = () => {
      if (w.step === 0 && !w.subject) return PX.toast("Prüfungsfach fehlt", "Bitte ein Prüfungsfach wählen.", "warn");
      if (w.step === 0 && !PX.signsFor(w.subject).length) return PX.toast("Kein Korrekturzeichensatz", "Dem Prüfungsfach ist kein Korrekturzeichensatz zugeordnet.", "warn");
      if (w.step === 1 && Object.values(w.terms).some((t) => t.on && !t.date)) return PX.toast("Prüfungstermin fehlt", "Bitte für jede gewählte Terminart ein Datum eintragen.", "warn");
      w.step++; PX.rerender(); };
    $("#w-cancel", r).onclick = async () => { if (await PX.confirm("Eingaben verwerfen?", "Die Prüfungsanlage wird abgebrochen. Nicht gespeicherte Eingaben gehen verloren.", "Verwerfen", true)) { wiz = null; PX.go("#/ibbw/pruefungen"); } };
    $("#w-demo", r).onclick = () => { w.subject = w.subject || "vbwl"; Object.assign(w.terms.HT, { date: "2027-04-20", ekEnd: "2027-05-07", zkEnd: "2027-05-21", ebStart: "2027-05-25", ebEnd: "2027-06-04" }); Object.assign(w.terms.NT, { date: "2027-05-11", ekEnd: "2027-05-26", zkEnd: "2027-06-09", ebStart: "2027-06-11", ebEnd: "2027-06-18" }); Object.assign(w.terms.NNT, { date: "2027-06-08", ekEnd: "2027-06-18", zkEnd: "2027-06-29", ebStart: "2027-07-01", ebEnd: "2027-07-07" }); w.guideline = w.guideline || "kr-allg"; PX.rerender(); PX.toast("Demo-Werte eingesetzt", "Termine und Korrekturzeiträume des Szenarios", "info"); };
    const save = (draft) => {
      const terms = Object.entries(w.terms).filter(([, t]) => t.on).map(([type, t]) => ({ type, ...t }));
      const errs = terms.flatMap(termErrors); if (!w.raster) errs.push("Raster");
      if (!draft && errs.length) return PX.toast("Speichern nicht möglich", "Pflichtangaben unvollständig – als Entwurf speichern?", "warn");
      const created = O().createExams({ subject: w.subject, raster: w.raster, guideline: w.guideline, zusatz: w.zusatz, terms });
      if (draft || errs.length) created.forEach((e) => (e.status = "entwurf"));
      wiz = null; PX.save(); PX.toast(draft ? "Entwurf gespeichert" : "Prüfung gespeichert", `${created.length} Prüfung(en) für ${esc(PX.subj(created[0].subject).name)} angelegt.`); PX.go("#/ibbw/pruefung/" + created[0].id);
    };
    const sv = $("#w-save", r); if (sv) sv.onclick = () => save(false);
    const dr = $("#w-draft", r); if (dr) dr.onclick = () => save(true);
  } }; });
  PX.resetWizard = () => (wiz = null);

  function rasterPreview(r) {
    if (!r) return "";
    return `<div class="card pad"><h3>${icon("table")} ${esc(r.name)}</h3><div class="xs muted">${r.mode === "np" ? "Direkte Vergabe von Notenpunkten" : `max. ${PX.maxBE(r)} Bewertungseinheiten`} · Gutachten: ${r.gutachten ? "aktiv" : "inaktiv"} · ${PX.badge(r.status, r.status === "freigegeben" ? "green" : "yellowb")}</div>
      <table class="tbl compact mt-s"><tbody>${r.tasks.map((t) => `<tr><td>${esc(t.no)}</td><td>${esc(t.title)}</td><td>${t.kind === "wahl" ? PX.badge("Wahl " + t.group, "purple") : PX.badge("Pflicht", "gray")}</td><td class="num">${t.be}</td></tr>`).join("")}</tbody></table>
      ${(r.wahl || []).map((w) => `<div class="xs mt-s">${icon("shuffle")} ${esc(w.label)}</div>`).join("")}
      <div class="xs mt-s">${icon("sigma")} Regeln: ${r.rules.map((id) => esc(PX.byId("rules", id)?.name)).join(" · ")}</div></div>`;
  }
  PX.rasterPreview = rasterPreview;
  function dupDialog(src, after) {
    PX.modal({ title: "Bewertungsraster duplizieren", icon: "copy", body: `<p class="small">Vorlage: <b>${esc(src.name)}</b>. Die Kopie ist ein eigenständiges Raster im Status „Entwurf“.</p><label class="lbl" for="dn">Neuer Titel *</label><input class="input" id="dn" value="${esc(src.name.replace(String(src.year), String(src.year + 1)))}">`,
      foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>${icon("copy")} Duplizieren</button>`,
      onMount: (m, close) => { $("[data-ok]", m).onclick = () => { const n = $("#dn", m).value.trim(); if (!n) return; if (PX.S.rasters.some((x) => x.name === n)) return PX.toast("Name bereits vergeben", "", "warn"); const nr = O().duplicateRaster(src.id, n, src.year + 1); PX.save(); close(); after(nr); }; } });
  }

  // ---------- Prüfungsdetails ----------
  PX.route(/^ibbw\/pruefung\/([^/]+)$/, (m, q) => ({ title: "Prüfung", shell: "staff", need, render: () => {
    const e = PX.exam(m[1]); if (!e) return PX.empty("Prüfung nicht gefunden");
    const tab = q.tab || "stamm"; const r = PX.byId("rasters", e.raster); const kms = PX.S.kms.filter((k) => k.exam === e.id);
    const tabs = [["stamm", "Stammdaten"], ["grundlagen", "Bewertungsgrundlagen"], ["schulen", `Kursmappen (${kms.length})`]];
    let body = "";
    if (tab === "stamm") body = `<div class="card pad"><div class="grid2"><div>${PX.kv([["Prüfungsfach", esc(PX.subj(e.subject).name) + "<br><span class='xs muted'>" + esc(PX.subj(e.subject).form) + "</span>"], ["Terminart", PX.TYPE[e.type]], ["Prüfungstermin", `${PX.fmtDW(e.date)}, ${esc(e.time)}–${esc(e.end)} Uhr`], ["Status", e.status === "angelegt" ? PX.badge("angelegt", "green") : PX.badge("Entwurf", "yellowb")], ["Angelegt von", esc(PX.name(e.creator))]])}</div>
      <div><h3>Korrekturzeiträume</h3><div class="timeline">${[["Prüfung / Start EK", e.date], ["Ende Erstkorrektur", e.ekEnd], ["Ende Zweitkorrektur", e.zkEnd], ["Beginn Endbeurteilung", e.ebStart], ["Ende Endbeurteilung", e.ebEnd]].map(([l, d]) => `<div class="${d && d <= PX.S.now ? "past" : ""}"><b>${PX.fmtD(d)}</b><span>${l}</span></div>`).join("")}</div>
      <button class="btn sm mt" id="editdates">${icon("calendar-range")} Korrekturzeiträume bearbeiten</button></div></div></div>
      <div class="row mt"><button class="btn danger" id="delex">${icon("trash-2")} Prüfung löschen</button>${e.status === "entwurf" ? `<button class="btn primary" id="finex">${icon("check")} Entwurf vervollständigen und speichern</button>` : ""}</div>`;
    if (tab === "grundlagen") {
      const started = e.date + "T" + e.time <= PX.S.now + "T23:59";
      body = `<div class="grid2"><div>${r ? rasterPreview(r) : PX.empty("Kein Bewertungsraster zugeordnet")}
        <div class="card pad mt"><h3>${icon("book-text")} Korrekturrichtlinie</h3><p class="small">${e.guideline ? esc(PX.byId("guidelines", e.guideline).name) + ` <button class="link small" id="rmkr">Zuordnung entfernen</button>` : "keine zugeordnet (zulässig)"}</p></div></div>
        <div><div class="card pad"><h3>${icon("file-up")} Erwartungshorizont</h3>
        ${e.ewh ? `<div class="filechip">${icon("file-text")} <b>${esc(e.ewh.file)}</b><span class="xs muted">hochgeladen am ${PX.fmtD(e.ewh.date)}</span></div><div class="row mt-s"><button class="btn sm" id="ewh">${icon("upload")} Ersetzen</button><button class="btn sm danger" id="ewhdel">${icon("trash-2")} Löschen</button></div>`
          : `<p class="small muted">Noch kein Erwartungshorizont. Upload als PDF frühestens ab Beginn der Prüfung (${PX.fmtDW(e.date)}, ${esc(e.time)} Uhr).</p><button class="btn primary sm" id="ewh" ${started ? "" : "disabled"}>${icon("upload")} PDF hochladen</button>${started ? "" : `<div class="xs muted mt-s">${icon("clock")} Demo-Zeit auf den Prüfungstag stellen (oben rechts).</div>`}`}
        <div class="notice info mt">${icon("eye-off")}<div class="xs">Für Schulleitungsteams und Korrektor:innen sichtbar ab Ende der Prüfungszeit (${PX.fmtD(e.date)}, ${esc(e.end)} Uhr). Änderungen nach der Prüfung werden den Korrektor:innen als Systemnachricht mitgeteilt.</div></div></div>
        <div class="card pad mt"><h3>${icon("pen-line")} Korrekturzeichensatz</h3><div class="signs">${(e.signset || PX.signsFor(e.subject).map((z) => z.code)).map((c) => `<span class="sign static">${esc(c)}</span>`).join("")}</div><div class="xs muted mt-s">Übernommen aus dem Prüfungsfach zum Zeitpunkt der Freigabe.</div></div></div></div>`;
    }
    if (tab === "schulen") body = kms.length ? `<div class="tablewrap"><table class="tbl"><thead><tr><th>Schule</th><th>Kursmappe</th><th>Prüflinge</th><th>Phase</th></tr></thead><tbody>${kms.map((k) => { const p = PX.phase(k); return `<tr><td>${esc(PX.orgName(k.school))}</td><td>${esc(k.name)}</td><td>${PX.activeMappen(k).length}</td><td>${PX.badge(p.label, p.kind)}</td></tr>`; }).join("")}</tbody></table></div><p class="xs muted mt-s">Das IBBW sieht nur den formalen Stand – keine personenbezogenen Daten.</p>` : PX.empty("Die Schulen haben noch keine Daten importiert.", "folder");
    return `${PX.pagehead(PX.examLabel(e), PX.subj(e.subject).form, `<a class="btn" href="#/ibbw/pruefungen">${icon("arrow-left")} Alle Prüfungen</a>`)}
      <div class="tabs">${tabs.map(([k, l]) => `<a href="#/ibbw/pruefung/${e.id}?tab=${k}" class="${tab === k ? "active" : ""}">${l}</a>`).join("")}</div>${body}`;
  }, mount: (root) => {
    const e = PX.exam(m[1]); if (!e) return;
    const b = (id, fn) => { const x = $(id, root); if (x) x.onclick = fn; };
    b("#ewh", () => PX.modal({ title: "Erwartungshorizont hochladen", icon: "file-up", body: `<div class="dropzone" id="dz">${icon("upload", "xl")}<b>PDF-Datei hierher ziehen</b><span class="small muted">oder auswählen – nur PDF</span><input type="file" accept="application/pdf" id="fi"></div><p class="xs muted mt">Ein vorhandener Erwartungshorizont wird überschrieben.</p>`,
      foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-demo>${icon("file-text")} Demo-PDF verwenden</button>`,
      onMount: (mm, close) => { const fi = $("#fi", mm); fi.onchange = () => { const f = fi.files[0]; if (!f) return; if (!/\.pdf$/i.test(f.name)) return PX.toast("Kein PDF", "Es können nur PDF-Dateien hochgeladen werden. Der bisherige Erwartungshorizont bleibt erhalten.", "error"); O().uploadEWH(e.id, f.name); close(); PX.commit(); PX.toast("Erwartungshorizont hochgeladen", esc(f.name)); }; $("[data-demo]", mm).onclick = () => { O().uploadEWH(e.id); close(); PX.commit(); PX.toast("Erwartungshorizont hochgeladen", esc(e.ewh.file)); }; } }));
    b("#ewhdel", async () => { if (await PX.confirm("Erwartungshorizont löschen?", "Die Prüfung hat danach keinen Erwartungshorizont. Zugewiesene Korrektor:innen erhalten eine Systemnachricht.", "Löschen", true)) { PX.audit("Erwartungshorizont gelöscht", PX.examLabel(e)); e.ewh = null; PX.commit(); } });
    b("#rmkr", async () => { if (await PX.confirm("Zuordnung entfernen?", "Die Korrekturrichtlinie wird nicht gelöscht, nur von dieser Prüfung gelöst.", "Entfernen")) { e.guideline = ""; PX.audit("Korrekturrichtlinie entfernt", PX.examLabel(e)); PX.commit(); } });
    b("#delex", async () => { const used = PX.S.kms.some((k) => k.exam === e.id); if (used) return PX.toast("Löschen nicht möglich", "Für diese Prüfung liegen bereits Kursmappen vor.", "warn"); if (await PX.confirm("Prüfung löschen?", `„${esc(PX.examLabel(e))}“ wird unwiderruflich gelöscht.`, "Löschen", true)) { PX.S.exams = PX.S.exams.filter((x) => x.id !== e.id); PX.audit("Prüfung gelöscht", PX.examLabel(e)); PX.commit(); PX.go("#/ibbw/pruefungen"); } });
    b("#finex", () => { if (termErrors(e).length || !e.raster) return PX.toast("Noch unvollständig", termErrors(e).join(", ") || "Bewertungsraster fehlt", "warn"); e.status = "angelegt"; PX.audit("Prüfung vervollständigt", PX.examLabel(e)); PX.commit(); });
    b("#editdates", () => PX.modal({ title: "Korrekturzeiträume bearbeiten", icon: "calendar-range", body: `${[["ekEnd", "Ende Erstkorrektur"], ["zkEnd", "Ende Zweitkorrektur"], ["ebStart", "Beginn Endbeurteilung"], ["ebEnd", "Ende Endbeurteilung"]].map(([f, l]) => `<div class="field"><label class="lbl">${l}</label><input type="date" class="input" data-k="${f}" value="${e[f]}"></div>`).join("")}<div id="derr" class="xs" style="color:var(--red)"></div>`,
      foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Speichern</button>`,
      onMount: (mm, close) => { $("[data-ok]", mm).onclick = () => { const t = { ...e }; $$("[data-k]", mm).forEach((i) => (t[i.dataset.k] = i.value)); const er = termErrors(t); if (er.length) { $("#derr", mm).textContent = er.join(" · "); return; } Object.assign(e, t); PX.audit("Korrekturzeiträume geändert", PX.examLabel(e)); close(); PX.commit(); }; } }));
  } }));

  // ---------- Prüfungsfächer ----------
  PX.route(/^ibbw\/faecher$/, () => ({ title: "Prüfungsfächer", shell: "staff", need, render: () => `${PX.pagehead("Prüfungsfächer", "Fachliche Vorgaben je Unterrichtsfach und Schulform", `<button class="btn primary" id="addsub">${icon("plus")} Prüfungsfach hinzufügen</button>`)}
    <div class="tablewrap"><table class="tbl"><thead><tr><th>Prüfungsfach</th><th>Schulform</th><th>Korrekturzeichensatz</th><th>Gutachten</th><th>Priorität Gruppenbildung</th><th>Aktiv</th><th></th></tr></thead><tbody>
    ${PX.S.subjects.map((s) => `<tr><td><b>${esc(s.name)}</b> <span class="muted">(${esc(s.short)})</span></td><td class="small">${esc(s.form)}</td><td>${PX.signsFor(s.id).length ? `<span class="signs mini">${PX.signsFor(s.id).slice(0, 7).map((z) => `<span class="sign static">${esc(z.code)}</span>`).join("")}${PX.signsFor(s.id).length > 7 ? "…" : ""}</span>` : `<span class="badge red">fehlt</span>`}</td><td>${s.gutachten ? "ja" : "nein"}</td><td>${s.prio === "hoch" ? PX.badge("hoch", "red") : "normal"}</td>
    <td><label class="toggle"><input type="checkbox" data-act="${s.id}" ${s.active ? "checked" : ""}><span></span></label></td><td class="nowrap"><button class="btn sm" data-edit="${s.id}">Bearbeiten</button> <button class="iconbtn" data-del="${s.id}" aria-label="Löschen">${icon("trash-2")}</button></td></tr>`).join("")}</tbody></table></div>
    <p class="xs muted mt-s">Prüfungsfächer mit hoher Priorität werden bei der Korrekturgruppenbildung zuerst zugewiesen (wenige Korrektor:innen). Gelöschte Fächer mit bestehenden Prüfungen werden nur inaktiv gesetzt.</p>`,
  mount: (r) => {
    const dlg = (s) => PX.modal({ title: s ? "Prüfungsfach bearbeiten" : "Prüfungsfach hinzufügen", icon: "book-open", body: `<div class="field"><label class="lbl">Name *</label><input class="input" id="sn" value="${esc(s?.name || "")}"></div><div class="grid2"><div class="field"><label class="lbl">Kürzel *</label><input class="input" id="ss" value="${esc(s?.short || "")}"></div><div class="field"><label class="lbl">Schulform *</label><select class="select" id="sf">${["Berufliches Gymnasium", "Berufliches Gymnasium (WG)", "Berufliches Gymnasium (TG)", "Allgemeinbildendes Gymnasium"].map((f) => `<option ${s?.form === f ? "selected" : ""}>${f}</option>`).join("")}</select></div></div>
      <div class="grid2"><div class="field"><label class="lbl">Priorität Korrekturgruppenbildung</label><select class="select" id="sp"><option value="normal">normal</option><option value="hoch" ${s?.prio === "hoch" ? "selected" : ""}>hoch (seltenes Fach)</option></select></div><div class="field"><label class="checkbox mt"><input type="checkbox" id="sg" ${s?.gutachten ? "checked" : ""}> Textliches Gutachten erforderlich</label></div></div>
      <p class="xs muted">Den Korrekturzeichensatz pflegen Sie unter <a href="#/ibbw/zeichen">Korrekturzeichen</a>. Ohne Zeichensatz kann keine Prüfung angelegt werden.</p>`,
      foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Speichern</button>`,
      onMount: (m, close) => { $("[data-ok]", m).onclick = () => { const v = { name: $("#sn", m).value.trim(), short: $("#ss", m).value.trim(), form: $("#sf", m).value, prio: $("#sp", m).value, gutachten: $("#sg", m).checked }; if (!v.name || !v.short) return PX.toast("Pflichtfelder fehlen", "", "warn"); if (s) { Object.assign(s, v); PX.audit("Prüfungsfach bearbeitet", v.name); } else { PX.S.subjects.push({ id: PX.uid("f-"), active: true, ...v }); PX.audit("Prüfungsfach angelegt", v.name); } close(); PX.commit(); PX.toast("Gespeichert", esc(v.name)); }; } });
    $("#addsub", r).onclick = () => dlg(null);
    $$("[data-edit]", r).forEach((b) => (b.onclick = () => dlg(PX.subj(b.dataset.edit))));
    $$("[data-act]", r).forEach((i) => (i.onchange = () => { const s = PX.subj(i.dataset.act); s.active = i.checked; PX.audit(i.checked ? "Prüfungsfach aktiviert" : "Prüfungsfach deaktiviert", s.name); PX.commit(); }));
    $$("[data-del]", r).forEach((b) => (b.onclick = async () => { const s = PX.subj(b.dataset.del); const used = PX.S.exams.some((e) => e.subject === s.id); if (await PX.confirm("Prüfungsfach löschen?", used ? `Für „${esc(s.name)}“ existieren Prüfungen. Das Fach wird nicht gelöscht, sondern inaktiv gesetzt.` : `„${esc(s.name)}“ wird gelöscht.`, used ? "Inaktiv setzen" : "Löschen", true)) { if (used) s.active = false; else PX.S.subjects = PX.S.subjects.filter((x) => x !== s); PX.audit(used ? "Prüfungsfach inaktiv gesetzt" : "Prüfungsfach gelöscht", s.name); PX.commit(); } }));
  } }));

  // ---------- Bewertungsraster ----------
  PX.route(/^ibbw\/raster$/, () => ({ title: "Bewertungsraster", shell: "staff", need, render: () => `${PX.pagehead("Bewertungsraster", "Pflicht- und Wahlaufgaben, Bewertungseinheiten, Regeln", `<button class="btn primary" id="newr">${icon("plus")} Bewertungsraster anlegen</button>`)}
    <div class="tablewrap"><table class="tbl"><thead><tr><th><input type="checkbox" id="rall"></th><th>Bewertungsraster</th><th>Prüfungsfach</th><th>Aufgaben</th><th>Max.</th><th>Gutachten</th><th>Status</th><th></th></tr></thead><tbody>
    ${PX.S.rasters.map((r) => `<tr><td>${r.status !== "freigegeben" ? `<input type="checkbox" data-sel="${r.id}">` : ""}</td><td><b>${esc(r.name)}</b></td><td>${esc(PX.subj(r.subject)?.name)}</td><td>${r.tasks.length}</td><td>${r.mode === "np" ? "15 NP" : PX.maxBE(r) + " BE"}</td><td>${r.gutachten ? "aktiv" : "–"}</td><td>${PX.badge(r.status === "freigegeben" ? "freigegeben" : "in Bearbeitung", r.status === "freigegeben" ? "green" : "yellowb")}</td>
    <td class="nowrap"><a class="btn sm" href="#/ibbw/raster/${r.id}">Öffnen</a> <button class="btn sm" data-dup="${r.id}">${icon("copy")} Duplizieren</button> <button class="iconbtn" data-del="${r.id}" aria-label="Löschen">${icon("trash-2")}</button></td></tr>`).join("")}</tbody></table></div>
    <div class="row mt"><button class="btn" id="relsel">${icon("badge-check")} Ausgewählte freigeben</button><span class="xs muted">Freigegebene Raster stehen in der Prüfungsanlage zur Auswahl.</span></div>`,
  mount: (r) => {
    $("#newr", r).onclick = () => { const nr = { id: PX.uid("rs-"), name: "Neues Bewertungsraster", subject: "vbwl", year: 2027, status: "entwurf", mode: "be", tasks: [{ id: PX.uid("t"), no: "1", title: "", kind: "pflicht", be: 10 }], wahl: [], gutachten: false, rules: [], parts: [] }; PX.S.rasters.push(nr); PX.save(); PX.go("#/ibbw/raster/" + nr.id); };
    $$("[data-dup]", r).forEach((b) => (b.onclick = () => dupDialog(PX.byId("rasters", b.dataset.dup), (nr) => { PX.commit(); PX.go("#/ibbw/raster/" + nr.id); })));
    $$("[data-del]", r).forEach((b) => (b.onclick = async () => { const ra = PX.byId("rasters", b.dataset.del); if (PX.S.exams.some((e) => e.raster === ra.id)) return PX.toast("Löschen nicht möglich", "Das Raster ist einer Prüfung zugeordnet.", "warn"); if (await PX.confirm("Bewertungsraster löschen?", `„${esc(ra.name)}“ wird dauerhaft gelöscht.`, "Ja, löschen", true)) { PX.S.rasters = PX.S.rasters.filter((x) => x !== ra); PX.audit("Bewertungsraster gelöscht", ra.name); PX.commit(); } }));
    $("#rall", r).onchange = (e) => $$("[data-sel]", r).forEach((c) => (c.checked = e.target.checked));
    $("#relsel", r).onclick = async () => { const ids = $$("[data-sel]:checked", r).map((c) => c.dataset.sel); if (!ids.length) return PX.toast("Nichts ausgewählt", "", "info"); if (await PX.confirm("Bewertungsraster freigeben?", `${ids.length} Raster gelten danach als vollständig und können Prüfungen zugeordnet werden.`, "Freigeben")) { ids.forEach((id) => O().releaseRaster(id)); PX.commit(); } };
  } }));

  PX.route(/^ibbw\/raster\/([^/]+)$/, (m, q) => ({ title: "Bewertungsraster", shell: "staff", need, render: () => {
    const r = PX.byId("rasters", m[1]); if (!r) return PX.empty("Raster nicht gefunden");
    const ro = r.status === "freigegeben";
    const groups = [...new Set(r.tasks.filter((t) => t.kind === "wahl").map((t) => t.group))];
    return `${PX.pagehead(r.name, `${esc(PX.subj(r.subject)?.name)} · ${ro ? "freigegeben (schreibgeschützt)" : "in Bearbeitung – Änderungen werden automatisch zwischengespeichert"}`, `<a class="btn" href="${q.back === "wiz" ? "#/ibbw/pruefung/neu" : "#/ibbw/raster"}">${icon("arrow-left")} ${q.back === "wiz" ? "Zurück zur Prüfungsanlage" : "Alle Raster"}</a>${ro ? "" : `<button class="btn primary" id="rel">${icon("badge-check")} Freigeben</button>`}`)}
      <div class="grid2 wide-left"><div class="card pad"><div class="grid2"><div class="field"><label class="lbl">Titel *</label><input class="input" id="rn" value="${esc(r.name)}" ${ro ? "disabled" : ""}></div><div class="field"><label class="lbl">Prüfungsfach *</label><select class="select" id="rsub" ${ro ? "disabled" : ""}>${PX.S.subjects.map((s) => `<option value="${s.id}" ${s.id === r.subject ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></div></div>
        <div class="field"><label class="lbl">Bewertung</label><div class="segmented"><button data-mode="be" class="${r.mode === "be" ? "active" : ""}" ${ro ? "disabled" : ""}>Bewertungseinheiten</button><button data-mode="np" class="${r.mode === "np" ? "active" : ""}" ${ro ? "disabled" : ""}>Notenpunkte (Gesamturteil)</button></div></div>
        <h3 class="mt">Wahl- und Pflichtaufgaben</h3>
        <div class="tablewrap"><table class="tbl compact"><thead><tr><th>Nr.</th><th>Aufgabe</th><th>Art</th><th>Wahlgruppe</th><th>${r.mode === "np" ? "max. NP" : "BE"}</th><th></th></tr></thead><tbody>
        ${r.tasks.map((t) => `<tr><td style="width:70px"><input class="input" data-t="${t.id}.no" value="${esc(t.no)}" ${ro ? "disabled" : ""}></td><td><input class="input" data-t="${t.id}.title" value="${esc(t.title)}" placeholder="Bezeichnung" ${ro ? "disabled" : ""}></td>
          <td><select class="select" data-t="${t.id}.kind" ${ro ? "disabled" : ""}><option value="pflicht">Pflicht</option><option value="wahl" ${t.kind === "wahl" ? "selected" : ""}>Wahl</option></select></td><td style="width:90px">${t.kind === "wahl" ? `<input class="input" data-t="${t.id}.group" value="${esc(t.group || "")}" ${ro ? "disabled" : ""}>` : "–"}</td>
          <td style="width:80px"><input class="input ${t.be < 0 || t.be === "" ? "err" : ""}" type="number" min="0" data-t="${t.id}.be" value="${t.be}" ${ro ? "disabled" : ""}></td><td>${ro ? "" : `<button class="iconbtn" data-rm="${t.id}" aria-label="Aufgabe löschen">${icon("trash-2")}</button>`}</td></tr>`).join("")}</tbody></table></div>
        ${ro ? "" : `<button class="btn sm mt-s" id="addt">${icon("plus")} Aufgabe hinzufügen</button>`}
        ${groups.length ? `<div class="card soft pad mt"><b>${icon("shuffle")} Kombination der Wahlaufgaben</b><div class="row mt-s">Der Prüfling bearbeitet <input class="input" type="number" min="1" max="${groups.length}" style="width:70px" id="pick" value="${r.wahl[0]?.pick || 1}" ${ro ? "disabled" : ""}> aus ${groups.length} Wahlgruppen (${groups.map(esc).join(", ")}).</div></div>` : ""}
        <div class="ptotal">Erreichbar: ${r.mode === "np" ? "15 Notenpunkte" : PX.maxBE(r) + " Bewertungseinheiten"}</div></div>
      <div><div class="card pad"><h3>${icon("notebook-pen")} Textliches Gutachten</h3><label class="row mt-s"><span class="toggle"><input type="checkbox" id="gut" ${r.gutachten ? "checked" : ""} ${ro ? "disabled" : ""}><span></span></span>${r.gutachten ? "aktiviert" : "deaktiviert (Standard)"}</label></div>
        <div class="card pad mt"><h3>${icon("sigma")} Regeln zuordnen *</h3><p class="xs muted">Mindestens eine Regel bzw. ein Regelwerk.</p>${PX.S.rules.map((x) => `<label class="checkbox mt-s"><input type="checkbox" data-rule="${x.id}" ${r.rules.includes(x.id) ? "checked" : ""} ${ro ? "disabled" : ""}> <span class="small">${esc(x.name)} ${PX.badge(x.kind, "gray")}</span></label>`).join("")}</div>
        <div class="card pad mt"><h3>${icon("layers")} Prüfungsbestandteile</h3>${r.parts.length ? `<table class="tbl compact">${r.parts.map((p) => `<tr><td>${esc(p.name)}</td><td>${p.weight} %</td><td>${p.korr ? "korrekturrelevant" : PX.badge("nicht korrekturrelevant", "yellowb")}</td></tr>`).join("")}</table><p class="xs muted mt-s">Nicht korrekturrelevante Bestandteile (z. B. Kommunikationsprüfung) trägt die Erstkorrektur oder Schulleitung als Notenpunkte nach.</p>` : `<p class="small muted">Nur schriftlicher Teil.</p>`}</div></div></div>`;
  }, mount: (root) => {
    const r = PX.byId("rasters", m[1]); if (!r || r.status === "freigegeben") return;
    const autosave = () => { PX.save(); };
    $("#rn", root).onchange = (e) => { r.name = e.target.value; autosave(); };
    $("#rsub", root).onchange = (e) => { r.subject = e.target.value; autosave(); };
    $$("[data-mode]", root).forEach((b) => (b.onclick = () => { r.mode = b.dataset.mode; autosave(); PX.rerender(); }));
    $$("[data-t]", root).forEach((i) => (i.onchange = () => { const [id, f] = i.dataset.t.split("."); const t = r.tasks.find((x) => x.id === id); t[f] = f === "be" ? (i.value === "" ? "" : +i.value) : i.value; if (f === "kind" && i.value === "wahl" && !t.group) t.group = "W1"; syncWahl(r); autosave(); PX.rerender(); }));
    $$("[data-rm]", root).forEach((b) => (b.onclick = () => { r.tasks = r.tasks.filter((t) => t.id !== b.dataset.rm); syncWahl(r); autosave(); PX.rerender(); }));
    const at = $("#addt", root); if (at) at.onclick = () => { r.tasks.push({ id: PX.uid("t"), no: String(r.tasks.length + 1), title: "", kind: "pflicht", be: 0 }); autosave(); PX.rerender(); };
    const pk = $("#pick", root); if (pk) pk.onchange = () => { syncWahl(r, +pk.value); autosave(); PX.rerender(); };
    $("#gut", root).onchange = (e) => { r.gutachten = e.target.checked; autosave(); PX.rerender(); };
    $$("[data-rule]", root).forEach((c) => (c.onchange = () => { r.rules = $$("[data-rule]:checked", root).map((x) => x.dataset.rule); autosave(); }));
    $("#rel", root).onclick = async () => {
      const errs = []; if (!r.rules.length) errs.push("mindestens eine Regel zuordnen"); if (r.tasks.some((t) => t.be === "" || t.be < 0)) errs.push("Bewertungseinheiten ≥ 0 eintragen"); if (r.tasks.some((t) => !t.title)) errs.push("alle Aufgaben bezeichnen");
      if (errs.length) return PX.toast("Freigabe nicht möglich", "Bitte " + errs.join(", ") + ".", "warn");
      if (await PX.confirm("Bewertungsraster freigeben?", "Das Raster gilt danach als vollständig und kann Prüfungen zugeordnet werden.", "Freigeben")) { O().releaseRaster(r.id); PX.commit(); PX.toast("Bewertungsraster freigegeben", esc(r.name)); if (PX.q().back === "wiz") PX.go("#/ibbw/pruefung/neu"); }
    };
  } }));
  function syncWahl(r, pick) { const gs = [...new Set(r.tasks.filter((t) => t.kind === "wahl").map((t) => t.group))]; r.wahl = gs.length ? [{ groups: gs, pick: Math.min(pick || r.wahl[0]?.pick || 1, gs.length), label: `${pick || r.wahl[0]?.pick || 1} aus ${gs.length} Wahlgruppen` }] : []; }

  // ---------- Regeln ----------
  const KIND = { notenschluessel: "Notenschlüssel", rundung: "Rundungsregel", gesamtnote: "Regel zur Ermittlung der Gesamtnote" };
  PX.route(/^ibbw\/regeln$/, () => ({ title: "Regeln", shell: "staff", need, render: () => `${PX.pagehead("Regeln verwalten", "Rundungsregeln, Notenschlüssel und Regeln zur Gesamtnote", `<button class="btn primary" id="addrule">${icon("plus")} Regel anlegen</button>`)}
    ${Object.entries(KIND).map(([k, l]) => `<h2 class="mt">${esc(l)}</h2><div class="tablewrap"><table class="tbl"><tbody>${PX.S.rules.filter((x) => x.kind === k).map((x) => `<tr><td><b>${esc(x.name)}</b><div class="xs muted">${esc(x.note || "")}</div></td><td class="small">${k === "notenschluessel" ? `<div class="nskey">${x.def.map(([p, n]) => `<span><b>${n}</b>≥${p}%</span>`).join("")}</div>` : esc(x.def)}</td><td class="nowrap"><button class="iconbtn" data-delr="${x.id}" aria-label="Löschen">${icon("trash-2")}</button></td></tr>`).join("") || `<tr><td class="muted">Keine Regeln</td></tr>`}</tbody></table></div>`).join("")}`,
  mount: (r) => {
    $("#addrule", r).onclick = () => PX.modal({ title: "Regel anlegen", icon: "sigma", body: `<div class="field"><label class="lbl">Art der Regel *</label><select class="select" id="rk">${Object.entries(KIND).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></div><div class="field"><label class="lbl">Bezeichnung *</label><input class="input" id="rnm"></div><div class="field"><label class="lbl">Definition</label><input class="input" id="rdef" placeholder="z. B. ceil · eb_or_avg · Schwellen in %"></div>`,
      foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Speichern</button>`, onMount: (m, close) => { $("[data-ok]", m).onclick = () => { const n = $("#rnm", m).value.trim(); if (!n) return; const k = $("#rk", m).value; PX.S.rules.push({ id: PX.uid("r-"), kind: k, name: n, def: k === "notenschluessel" ? PX.NS_ABI : $("#rdef", m).value || "–", note: "neu angelegt" }); PX.audit("Regel angelegt", n, KIND[k]); close(); PX.commit(); }; } });
    $$("[data-delr]", r).forEach((b) => (b.onclick = async () => { const x = PX.byId("rules", b.dataset.delr); if (PX.S.rasters.some((ra) => ra.rules.includes(x.id))) return PX.toast("Regel wird verwendet", "Die Regel ist einem Bewertungsraster zugeordnet.", "warn"); if (await PX.confirm("Regel löschen?", esc(x.name), "Löschen", true)) { PX.S.rules = PX.S.rules.filter((y) => y !== x); PX.audit("Regel gelöscht", x.name); PX.commit(); } }));
  } }));

  // ---------- Korrekturzeichen ----------
  let zf = "";
  PX.route(/^ibbw\/zeichen$/, () => ({ title: "Korrekturzeichen", shell: "staff", need, render: () => {
    const list = PX.S.signs.filter((z) => !zf || z.subjects.includes(zf));
    return `${PX.pagehead("Korrekturzeichensatz verwalten", "Zeichen aus dem einheitlichen Zeichensatz, Bedeutung, Zuordnung zu Prüfungsfächern", `<button class="btn primary" id="addz">${icon("plus")} Korrekturzeichen anlegen</button>`)}
      <div class="filterbar"><select class="select" id="zf"><option value="">Alle Prüfungsfächer</option>${PX.S.subjects.map((s) => `<option value="${s.id}" ${zf === s.id ? "selected" : ""}>${esc(s.name)} (${esc(s.form)})</option>`).join("")}</select></div>
      <div class="tablewrap"><table class="tbl"><thead><tr><th>Zeichen</th><th>Bedeutung</th><th>Kategorie</th><th>Prüfungsfächer</th><th></th></tr></thead><tbody>
      ${list.map((z) => `<tr><td><span class="sign static">${esc(z.code)}</span></td><td>${esc(z.meaning)}</td><td class="small">${esc(z.cat)}</td><td class="small">${z.subjects.map((s) => esc(PX.subj(s)?.short)).join(", ")}</td><td class="nowrap"><button class="btn sm" data-ez="${z.id}">Bearbeiten</button> <button class="iconbtn" data-dz="${z.id}" aria-label="Löschen">${icon("trash-2")}</button></td></tr>`).join("")}</tbody></table></div>`;
  }, mount: (r) => {
    $("#zf", r).onchange = (e) => { zf = e.target.value; PX.rerender(); };
    const dlg = (z) => PX.modal({ title: z ? "Korrekturzeichen bearbeiten" : "Korrekturzeichen anlegen", icon: "pen-line", body: `<div class="grid2"><div class="field"><label class="lbl">Zeichen (aus dem Zeichensatz) *</label><input class="input" id="zc" maxlength="3" value="${esc(z?.code || "")}"></div><div class="field"><label class="lbl">Kategorie</label><select class="select" id="zk">${["Sprachliche Richtigkeit", "Inhalt", "Darstellung"].map((c) => `<option ${z?.cat === c ? "selected" : ""}>${c}</option>`).join("")}</select></div></div>
      <div class="field"><label class="lbl">Bedeutung *</label><input class="input" id="zm" value="${esc(z?.meaning || "")}"></div><label class="lbl">Prüfungsfächer *</label><div class="checkgrid">${PX.S.subjects.map((s) => `<label class="checkbox"><input type="checkbox" data-zs="${s.id}" ${z?.subjects.includes(s.id) ? "checked" : ""}> ${esc(s.name)} <span class="xs muted">${esc(s.form)}</span></label>`).join("")}</div>
      ${z ? `<div class="notice warn mt">${icon("triangle-alert")}<div class="small">Änderungen wirken sich sofort auf alle Prüfungen aus, in denen das Zeichen eingesetzt wird.</div></div>` : ""}`,
      foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Speichern</button>`,
      onMount: (m, close) => { $("[data-ok]", m).onclick = async () => { const v = { code: $("#zc", m).value.trim(), meaning: $("#zm", m).value.trim(), cat: $("#zk", m).value, subjects: $$("[data-zs]:checked", m).map((c) => c.dataset.zs) }; if (!v.code || !v.meaning || !v.subjects.length) return PX.toast("Pflichtangaben fehlen", "Zeichen, Bedeutung und mindestens ein Prüfungsfach", "warn"); if (z && !(await PX.confirm("Änderung übernehmen?", "Die Änderung wirkt sich auf künftige Korrekturen aus.", "Übernehmen"))) return; if (z) Object.assign(z, v); else PX.S.signs.push({ id: PX.uid("z-"), ...v }); PX.audit(z ? "Korrekturzeichen bearbeitet" : "Korrekturzeichen angelegt", v.code, v.meaning); close(); PX.commit(); }; } });
    $("#addz", r).onclick = () => dlg(null);
    $$("[data-ez]", r).forEach((b) => (b.onclick = () => dlg(PX.byId("signs", b.dataset.ez))));
    $$("[data-dz]", r).forEach((b) => (b.onclick = async () => { const z = PX.byId("signs", b.dataset.dz); const used = PX.S.mappen.some((mm) => Object.values(mm.corr).some((c) => c.state === "in_bearbeitung" && c.marks.some((k) => k.code === z.code))); if (used) return PX.toast("Löschen nicht möglich", "Das Zeichen wird in einer laufenden Korrektur verwendet.", "warn"); if (await PX.confirm("Korrekturzeichen löschen?", `„${esc(z.code)}“ (${esc(z.meaning)}) wird unwiderruflich gelöscht.`, "Löschen", true)) { PX.S.signs = PX.S.signs.filter((x) => x !== z); PX.audit("Korrekturzeichen gelöscht", z.code); PX.commit(); } }));
  } }));

  // ---------- Korrekturrichtlinien ----------
  PX.route(/^ibbw\/richtlinien$/, () => ({ title: "Korrekturrichtlinien", shell: "staff", need, render: () => `${PX.pagehead("Korrekturrichtlinien verwalten", "PDF-Dokumente, die Prüfungen zugeordnet werden können", `<button class="btn primary" id="addg">${icon("plus")} Korrekturrichtlinie anlegen</button>`)}
    <div class="tablewrap"><table class="tbl"><thead><tr><th>Name</th><th>Dokument</th><th>Verwendet in</th><th></th></tr></thead><tbody>${PX.S.guidelines.map((g) => `<tr><td><b>${esc(g.name)}</b></td><td><span class="doclink">${icon("file-text")} ${esc(g.file)}</span><div class="xs muted">${PX.fmtD(g.date)}</div></td><td class="small">${PX.S.exams.filter((e) => e.guideline === g.id).map((e) => esc(PX.examShort(e))).join(", ") || "–"}</td><td class="nowrap"><button class="btn sm" data-rn="${g.id}">Umbenennen</button> <button class="iconbtn" data-dg="${g.id}" aria-label="Löschen">${icon("trash-2")}</button></td></tr>`).join("")}</tbody></table></div>`,
  mount: (r) => {
    $("#addg", r).onclick = () => PX.modal({ title: "Korrekturrichtlinie anlegen", icon: "book-text", body: `<div class="field"><label class="lbl">Name (eindeutig) *</label><input class="input" id="gn"></div><div class="field"><label class="lbl">PDF-Dokument *</label><input type="file" accept="application/pdf" class="input" id="gf"></div>`, foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Speichern</button>`,
      onMount: (m, close) => { $("[data-ok]", m).onclick = () => { const n = $("#gn", m).value.trim(); const f = $("#gf", m).files[0]; if (!n) return PX.toast("Name fehlt", "", "warn"); if (PX.S.guidelines.some((g) => g.name === n)) return PX.toast("Name bereits vergeben", "", "warn"); if (f && !/\.pdf$/i.test(f.name)) return PX.toast("Kein PDF", "", "error"); PX.S.guidelines.push({ id: PX.uid("kr-"), name: n, file: f ? f.name : n.replace(/\s+/g, "_") + ".pdf", date: PX.S.now }); PX.audit("Korrekturrichtlinie angelegt", n); close(); PX.commit(); }; } });
    $$("[data-rn]", r).forEach((b) => (b.onclick = () => { const g = PX.byId("guidelines", b.dataset.rn); PX.modal({ title: "Umbenennen", body: `<input class="input" id="gn" value="${esc(g.name)}">`, foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Speichern</button>`, onMount: (m, close) => { $("[data-ok]", m).onclick = () => { const n = $("#gn", m).value.trim(); if (PX.S.guidelines.some((x) => x !== g && x.name === n)) return PX.toast("Name bereits vergeben", "", "warn"); PX.audit("Korrekturrichtlinie umbenannt", g.name, "→ " + n); g.name = n; close(); PX.commit(); }; } }); }));
    $$("[data-dg]", r).forEach((b) => (b.onclick = async () => { const g = PX.byId("guidelines", b.dataset.dg); if (await PX.confirm("Korrekturrichtlinie löschen?", `„${esc(g.name)}“ wird unwiderruflich gelöscht.`, "Löschen", true)) { PX.S.guidelines = PX.S.guidelines.filter((x) => x !== g); PX.S.exams.forEach((e) => { if (e.guideline === g.id) e.guideline = ""; }); PX.audit("Korrekturrichtlinie gelöscht", g.name); PX.commit(); } }));
  } }));
})();
