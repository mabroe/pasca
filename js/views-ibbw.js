/* PASCA Klickdummy – Rolle Prüfungserstellung (IBBW) */
(function () {
  "use strict";
  const PX = window.PX; const { esc, icon, $, $$ } = PX; const O = () => PX.ops;
  const need = ["ibbw"];
  const formLabel = (f) => (f === "AG" ? "Allgemeinbildende Gymnasien" : "Berufliche Gymnasien");

  // ---------- Übersicht ----------
  PX.route(/^ibbw$/, () => ({ title: "Übersicht", shell: "staff", need, render: () => {
    const ex = PX.S.exams.filter((e) => e.year === 2027);
    const missing = ex.filter((e) => e.status === "angelegt" && !e.ewh);
    return `${PX.pagehead("Prüfungserstellung", "Abitur 2027 · Berufliche und allgemeinbildende Gymnasien", `<a class="btn" href="#/ibbw/kalender">${icon("calendar-range")} Korrekturkalender</a><a class="btn primary" href="#/ibbw/pruefung/neu">${icon("plus")} Prüfung anlegen</a>`)}
      <div class="statgrid"><div class="stat"><div class="v">${ex.filter((e) => e.status === "angelegt").length}</div><div class="small muted">Prüfungen angelegt</div></div>
      <div class="stat"><div class="v">${ex.filter((e) => e.cal).length}/${ex.length}</div><div class="small muted">mit Korrekturkalender verknüpft</div></div>
      <div class="stat"><div class="v">${PX.S.rasters.filter((r) => r.status === "freigegeben").length}/${PX.S.rasters.length}</div><div class="small muted">Bewertungsraster freigegeben</div></div>
      <div class="stat"><div class="v">${PX.S.signs.length}</div><div class="small muted">Korrekturzeichen</div></div></div>
      ${missing.length ? `<div class="notice warn mt">${icon("triangle-alert")}<div><b>Erwartungshorizont fehlt</b><br>${missing.map((e) => `<a href="#/ibbw/pruefung/${e.id}?tab=grundlagen">${esc(PX.examLabel(e))}</a>`).join(", ")} – muss verschlüsselt hinterlegt werden (Entschlüsselung automatisch zu Prüfungsbeginn).</div></div>` : ""}
      <h2 class="mt-l">Prüfungskalender 2027</h2>${examTable(ex.sort((a, b) => a.date.localeCompare(b.date)))}
      <div class="notice info mt">${icon("lock")}<div class="small">Bewertungsraster, Erwartungshorizont und Korrekturrichtlinie sind bis zum Ende der offiziellen Prüfungszeit nur für die anlegende Person sowie die zugehörige Referats- und Abteilungsleitung sichtbar. Prüfungsfach, Termin, Terminart und Korrekturzeiträume sehen die Schulen ab Anlage.</div></div>`;
  } }));

  function examTable(list) {
    if (!list.length) return PX.empty("Keine Prüfungen gefunden");
    return `<div class="tablewrap"><table class="tbl"><thead><tr><th>Prüfungsfach</th><th>Terminart</th><th>Termin</th><th>Korrekturzeiträume</th><th>Bewertungsraster</th><th>Erwartungshorizont</th><th>Status</th><th></th></tr></thead><tbody>
      ${list.map((e) => { const s = PX.subj(e.subject); const r = PX.byId("rasters", e.raster); return `<tr><td><b>${esc(s.name)}</b><div class="xs muted">${esc(s.form)}</div></td><td>${esc(PX.TYPE[e.type])}</td><td class="nowrap">${PX.fmtDW(e.date)}<div class="xs muted">${esc(e.time || "")} Uhr · ${e.duration || PX.durOf(e.time, e.end)} Min. (bis ${esc(e.end || "")})</div></td>
      <td class="xs">${e.ekEnd ? `EK bis ${PX.fmtD(e.ekEnd)}<br>ZK bis ${PX.fmtD(e.zkEnd)}<br>EB ${PX.fmtD(e.ebStart)}–${PX.fmtD(e.ebEnd)}<br>${e.cal ? PX.badge("Kalender " + PX.examForm(e), "cyan") : PX.badge("abweichend", "yellowb")}` : `<span class="muted">fehlt</span>`}</td>
      <td class="small">${r ? esc(r.name) : `<span class="muted">–</span>`}</td><td class="small">${e.ewh ? `${icon(PX.ewhOpen(e) ? "file-check" : "lock-keyhole")} ${PX.ewhOpen(e) ? "entschlüsselt" : "verschlüsselt"}` : `<span class="warntext">fehlt</span>`}</td>
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
  const blankTerm = () => ({ on: true, date: "", time: "08:30", dur: 270, ewh: "", own: false, ekEnd: "", zkEnd: "", ebStart: "", ebEnd: "" });
  const blankWiz = () => ({ step: 0, subject: "", terms: { HT: blankTerm(), NT: blankTerm(), NNT: blankTerm() }, raster: "", guideline: "", zusatz: false, signset: null, partSigns: {} });
  const STEPS = ["Prüfungsfach", "Prüfungstermine", "Korrekturzeiträume", "Bewertung und Korrekturzeichen", "Prüfen und speichern"];
  // Effektive Zeiträume: aus dem Korrekturkalender (Schulform, Terminart, Jahr) oder abweichend
  const calOf = (subject, type, date) => (date ? PX.calendarFor(PX.schulform(subject), type, +date.slice(0, 4)) : null);
  const effTerm = (subject, type, t) => { const c = calOf(subject, type, t.date); return !t.own && c ? { ...t, ekEnd: c.ekEnd, zkEnd: c.zkEnd, ebStart: c.ebStart, ebEnd: c.ebEnd, cal: c } : { ...t, cal: null }; };
  function termErrors(t) {
    const e = [];
    if (!t.date) e.push("Prüfungstermin fehlt");
    if (!t.ekEnd || !t.zkEnd || !t.ebStart || !t.ebEnd) e.push("Korrekturzeiträume unvollständig");
    else { if (t.ekEnd <= t.date) e.push("Ende EK muss nach dem Prüfungstag liegen"); if (t.zkEnd <= t.ekEnd) e.push("Ende ZK muss nach Ende EK liegen"); if (t.ebStart <= t.zkEnd) e.push("Beginn EB muss nach Ende ZK liegen"); if (t.ebEnd <= t.ebStart) e.push("Ende EB muss nach Beginn EB liegen"); }
    return e;
  }
  PX.termErrors = termErrors;
  // Plausibilitätsprüfung einer Prüfungskonfiguration (Anlage und Details)
  PX.examChecks = function (d) {
    const out = []; const E = (t) => out.push({ level: "error", text: t }); const W = (t) => out.push({ level: "warn", text: t });
    const R = PX.byId("rasters", d.raster);
    if (!d.subject) E("Prüfungsfach fehlt");
    if (!R) E("Bewertungsraster fehlt");
    else {
      if (R.subject !== d.subject) E(`Bewertungsraster „${R.name}“ gehört nicht zum Prüfungsfach`);
      if (R.status !== "freigegeben") E(`Bewertungsraster „${R.name}“ ist nicht freigegeben`);
      PX.rasterIssues(R).filter((x) => x.level !== "ok").forEach((x) => (x.level === "error" ? E : W)("Raster: " + x.text));
      if (R.form && PX.schulform(d.subject) !== R.form) E(`Raster ist für ${R.form}, das Fach für ${PX.schulform(d.subject)}`);
      const sg = (d.signset || []).map((id) => PX.byId("signs", id)).filter(Boolean);
      R.parts.filter((p) => p.scoring === "fehler").forEach((p) => { const set = d.partSigns?.[p.id]?.length ? d.partSigns[p.id].map((id) => PX.byId("signs", id)) : sg; if (!set.some((z) => z && (z.weight || z.count))) W(`${p.name}: Fehlerzahl ohne gewichtete Korrekturzeichen – die Fehlerzahl kann nicht aus den Zeichen ermittelt werden`); });
    }
    if (!(d.signset || []).length) E("Keine Korrekturzeichen ausgewählt");
    const terms = d.terms || []; const ord = ["HT", "NT", "NNT"];
    terms.forEach((t) => {
      const L = PX.TYPE[t.type] + ": ";
      termErrors(t).forEach((x) => E(L + x));
      const dur = +(t.dur ?? t.duration); if (!(dur > 0)) E(L + "Dauer fehlt"); else { if (dur < 60 || dur > 420) W(L + `ungewöhnliche Dauer (${dur} Minuten)`); if (PX.endTime(t.time, dur) > "18:00" || PX.endTime(t.time, dur) < String(t.time)) W(L + "Prüfung endet nach 18:00 Uhr"); }
      if (!t.ewh) E(L + "Erwartungshorizont fehlt (muss bei der Anlage verschlüsselt hinterlegt werden)");
      if (t.date && new Date(t.date).getDay() % 6 === 0) W(L + "Prüfungstermin liegt auf einem Wochenende");
    });
    terms.forEach((t) => { const prev = terms.find((x) => ord.indexOf(x.type) === ord.indexOf(t.type) - 1); if (prev && t.date && prev.date && t.date <= prev.date) E(`${PX.TYPE[t.type]} muss nach dem ${PX.TYPE[prev.type]} liegen`); });
    return out;
  };
  // Zeichen der Prüfung und Zeichensatz je Prüfungsteil (wird auch in den Prüfungsdetails verwendet)
  function signsEditor(subject, signset, partSigns, raster, ro) {
    const all = PX.signsFor(subject); const kp = raster ? raster.parts.filter((p) => p.scoring !== "extern") : [];
    const cats = [...new Set(all.map((z) => z.cat))];
    const zlabel = (z) => `${esc(z.code)}${z.weight ? `<sub>${PX.fmtNP(z.weight)}</sub>` : z.count ? "<sub>n</sub>" : ""}`;
    return `<div class="lbl">Korrekturzeichen dieser Prüfung</div><p class="xs muted">Vorauswahl: alle Zeichen des Prüfungsfachs. Gewichtete Zeichen (z. B. ¼, ½, 1 Fehler) und Zeichen mit Anzahl werden für die Fehlerzahl herangezogen.</p>
      ${cats.map((ct) => `<div class="xs muted mt-s">${esc(ct)}</div><div class="signs pick">${all.filter((z) => z.cat === ct).map((z) => `<label class="sign ${signset.includes(z.id) ? "on ek" : ""}" title="${esc(z.meaning)}"><input type="checkbox" data-zset="${z.id}" ${signset.includes(z.id) ? "checked" : ""} ${ro ? "disabled" : ""}>${zlabel(z)}</label>`).join("")}</div>`).join("")}
      ${kp.length > 1 ? `<div class="lbl mt">Zeichensatz je Prüfungsteil</div><p class="xs muted">Ohne Auswahl gelten im Prüfungsteil alle Zeichen der Prüfung. In der Korrektur wählt die Lehrkraft den Prüfungsteil, die Zeichenleiste passt sich an.</p>
        ${kp.map((p) => { const sel = partSigns[p.id] || []; return `<div class="partsigns"><b class="small">${esc(p.name)}</b> <span class="xs muted">${sel.length ? sel.length + " Zeichen" : "alle Zeichen"}</span><div class="signs pick">${all.filter((z) => signset.includes(z.id)).map((z) => `<label class="sign ${sel.includes(z.id) ? "on zk" : ""}" title="${esc(z.meaning)}"><input type="checkbox" data-pset="${p.id}|${z.id}" ${sel.includes(z.id) ? "checked" : ""} ${ro ? "disabled" : ""}>${zlabel(z)}</label>`).join("")}</div></div>`; }).join("")}` : ""}`;
  }
  function bindSigns(root, holder, rerender) {
    $$("[data-zset]", root).forEach((i) => (i.onchange = () => { holder.signset = i.checked ? [...new Set([...holder.signset, i.dataset.zset])] : holder.signset.filter((x) => x !== i.dataset.zset); Object.keys(holder.partSigns || {}).forEach((k) => (holder.partSigns[k] = holder.partSigns[k].filter((x) => holder.signset.includes(x)))); rerender(); }));
    $$("[data-pset]", root).forEach((i) => (i.onchange = () => { const [p, z] = i.dataset.pset.split("|"); holder.partSigns = holder.partSigns || {}; const cur = holder.partSigns[p] || []; holder.partSigns[p] = i.checked ? [...cur, z] : cur.filter((x) => x !== z); rerender(); }));
  }

  PX.route(/^ibbw\/pruefung\/neu$/, () => { if (!wiz) wiz = blankWiz(); return { title: "Prüfung anlegen", shell: "staff", need, render: () => {
    if (!wiz) wiz = blankWiz();
    const s = PX.subj(wiz.subject); const w = wiz;
    if (s && !w.signset) w.signset = PX.signsFor(s.id).map((z) => z.id);
    const form = s ? PX.schulform(s.id) : null;
    let body = "";
    if (w.step === 0) {
      body = `<div class="field"><label class="lbl" for="w-sub">Prüfungsfach *</label><select class="select" id="w-sub"><option value="">Bitte wählen …</option>${["BG", "AG"].map((f) => `<optgroup label="${formLabel(f)}">${PX.S.subjects.filter((x) => x.active && PX.schulform(x.id) === f).map((x) => `<option value="${x.id}" ${w.subject === x.id ? "selected" : ""}>${esc(x.name)} – ${esc(x.form)}</option>`).join("")}</optgroup>`).join("")}</select>
        <div class="xs muted mt-s">Prüfungsfächer für berufliche und allgemeinbildende Gymnasien werden unterschieden; davon hängt auch der Korrekturkalender ab. Fehlt ein Fach, legen Sie es unter <a href="#/ibbw/faecher">Prüfungsfächer</a> an.</div></div>
        ${s ? `<div class="card soft pad"><h3>${icon("pen-line")} Korrekturzeichensatz „${esc(s.name)}“</h3><p class="small muted">Die Auswahl für diese Prüfung (und je Prüfungsteil) treffen Sie in Schritt 4.</p><div class="signs">${PX.signsFor(s.id).map((z) => `<span class="sign static" title="${esc(z.meaning)}">${esc(z.code)}</span>`).join("")}</div>
          <p class="small mt-s">Schulform: <b>${formLabel(form)}</b> · Priorität Korrekturgruppenbildung: <b>${esc(s.prio)}</b></p></div>` : ""}`;
    }
    if (w.step === 1) body = `<p class="small muted">Für jede Terminart wird eine eigene Prüfung angelegt. Gepflegt wird nur der Tag der schriftlichen Prüfung.</p>
      <div class="tablewrap"><table class="tbl"><thead><tr><th>Terminart</th><th>Datum *</th><th>Beginn *</th><th>Dauer (Minuten) *</th><th>Ende (berechnet)</th></tr></thead><tbody>
      ${Object.entries(w.terms).map(([k, t]) => `<tr><td><label class="checkbox"><input type="checkbox" data-on="${k}" ${t.on ? "checked" : ""} ${k === "HT" ? "disabled" : ""}> ${PX.TYPE[k]}</label></td><td><input type="date" class="input" data-f="${k}.date" value="${t.date}" ${t.on ? "" : "disabled"}></td><td><input type="time" class="input" data-f="${k}.time" value="${t.time}" ${t.on ? "" : "disabled"}></td><td><input type="number" min="30" max="480" step="5" class="input" style="width:110px" data-f="${k}.dur" value="${t.dur}" ${t.on ? "" : "disabled"}></td><td class="nowrap"><b>${t.on ? PX.endTime(t.time, t.dur) + " Uhr" : "–"}</b></td></tr>`).join("")}</tbody></table></div>
      <p class="xs muted mt-s">Die offizielle Prüfungszeit endet mit Beginn + Dauer; Nachteilsausgleiche (Zeitverlängerung) werden je Prüfling erfasst.</p>`;
    if (w.step === 2) body = `<p class="small muted">Die Korrekturzeiträume werden aus dem globalen <a href="#/ibbw/kalender">Korrekturkalender</a> (${formLabel(form)}) übernommen und bleiben mit ihm verknüpft: Ändert sich der Kalender, ändern sich alle verknüpften Prüfungen. Nur in Ausnahmefällen legen Sie abweichende Zeiträume fest.</p>
      <div class="tablewrap"><table class="tbl"><thead><tr><th>Terminart</th><th>Prüfung</th><th>Quelle</th><th>Ende Erstkorrektur</th><th>Ende Zweitkorrektur</th><th>Beginn Endbeurteilung</th><th>Ende Endbeurteilung</th></tr></thead><tbody>
      ${Object.entries(w.terms).filter(([, t]) => t.on).map(([k, t]) => { const e = effTerm(w.subject, k, t); const er = termErrors(e); const cal = calOf(w.subject, k, t.date);
        return `<tr><td>${PX.TYPE[k]}</td><td class="nowrap">${PX.fmtD(t.date)}</td><td><label class="checkbox small"><input type="checkbox" data-own="${k}" ${t.own || !cal ? "checked" : ""} ${cal ? "" : "disabled"}> abweichend</label>${cal ? (t.own ? "" : `<div class="xs">${PX.badge("Kalender " + cal.form + " " + cal.type, "cyan")}</div>`) : `<div class="xs warntext">kein Kalender für ${form} ${k} ${t.date.slice(0, 4)}</div>`}</td>
        ${PX.CAL_FIELDS.map(([f]) => `<td>${e.cal ? `<b class="small">${PX.fmtD(e[f])}</b>` : `<input type="date" class="input" data-f="${k}.${f}" value="${t[f]}">`}</td>`).join("")}</tr>${er.length && (e.cal || t.ekEnd) ? `<tr><td colspan="7"><span class="xs" style="color:var(--red)">${icon("circle-alert")} ${er.map(esc).join(" · ")}</span></td></tr>` : ""}`; }).join("")}</tbody></table></div>
      <div class="notice info mt">${icon("info")}<div class="small">Beginn Endbeurteilung: Erst ab diesem Datum ist die Endbeurteilung möglich – auch wenn einzelne Kurse früher fertig sind. So beginnt die EB landesweit gleichzeitig.</div></div>`;
    if (w.step === 3) {
      const rs = PX.S.rasters.filter((r) => r.subject === w.subject); const R = PX.byId("rasters", w.raster);
      body = `<div class="grid2"><div><div class="field"><label class="lbl" for="w-ras">Bewertungsraster *</label><select class="select" id="w-ras"><option value="">Bitte wählen …</option>${rs.map((r) => `<option value="${r.id}" ${w.raster === r.id ? "selected" : ""} ${r.status !== "freigegeben" ? "disabled" : ""}>${esc(r.name)}${r.status !== "freigegeben" ? " (nicht freigegeben)" : ""}</option>`).join("")}</select>
        <div class="xs muted mt-s">Nur freigegebene Raster des gewählten Fachs. Pro Prüfung genau ein Raster.</div>
        <div class="row mt-s">${rs.some((r) => r.year < 2027) ? `<button class="btn sm" id="w-dup">${icon("copy")} Raster aus dem Vorjahr duplizieren</button>` : ""}<a class="btn sm" href="#/ibbw/raster-import">${icon("file-spreadsheet")} Raster aus Excel importieren</a></div></div>
        <div class="field"><label class="lbl" for="w-kr">Korrekturrichtlinie (optional)</label><select class="select" id="w-kr"><option value="">keine</option>${PX.S.guidelines.map((g) => `<option value="${g.id}" ${w.guideline === g.id ? "selected" : ""}>${esc(g.name)}</option>`).join("")}</select></div>
        <div class="field row"><label class="toggle"><input type="checkbox" id="w-zus" ${w.zusatz ? "checked" : ""}><span></span></label><div><b>Zusatzdateien durch Erstkorrektur erlauben</b><div class="xs muted">Standard: deaktiviert (nur in Ausnahmefällen, z. B. CAD-Dateien)</div></div></div>
        <div class="card soft pad">${signsEditor(w.subject, w.signset || [], w.partSigns, R)}</div></div>
        <div>${R ? PX.rasterPreview(R) : `<div class="card soft pad small muted">${icon("table")} Vorschau des Bewertungsrasters erscheint nach der Auswahl.</div>`}
        <div class="card pad mt"><h3>${icon("lock-keyhole")} Erwartungshorizont je Termin *</h3><p class="xs muted">Wird bereits jetzt hinterlegt, sofort verschlüsselt gespeichert und erst mit Beginn der jeweiligen Prüfung automatisch entschlüsselt. Bis dahin kann ihn niemand öffnen – auch nicht das IBBW.</p>
          ${Object.entries(w.terms).filter(([, t]) => t.on).map(([k, t]) => `<div class="row between mt-s"><span class="small"><b>${PX.TYPE[k]}</b>${t.date ? " · " + PX.fmtD(t.date) : ""}</span>${t.ewh ? `<span class="filechip">${icon("lock-keyhole")} ${esc(t.ewh)} <button class="link xs" data-ewhrm="${k}">entfernen</button></span>` : `<span class="row"><label class="btn sm">${icon("upload")} PDF wählen<input type="file" accept="application/pdf" hidden data-ewhf="${k}"></label><button class="btn sm ghost" data-ewhdemo="${k}">Demo-PDF</button></span>`}</div>`).join("")}</div></div></div>`;
    }
    if (w.step === 4) {
      const terms = Object.entries(w.terms).filter(([, t]) => t.on).map(([k, t]) => [k, effTerm(w.subject, k, t)]);
      const chk = PX.examChecks({ subject: w.subject, raster: w.raster, signset: w.signset || [], partSigns: w.partSigns, terms: terms.map(([k, t]) => ({ type: k, ...t })) });
      const errs = chk.filter((x) => x.level === "error").map((x) => x.text); const warns = chk.filter((x) => x.level === "warn").map((x) => x.text);
      const R = PX.byId("rasters", w.raster);
      body = `${PX.kv([["Prüfungsfach", esc(s?.name || "–") + " – " + esc(s?.form || "")], ["Korrekturzeichen", (w.signset || []).map((id) => esc(PX.byId("signs", id)?.code)).join(" ") + (Object.values(w.partSigns).some((x) => x.length) ? `<br><span class="xs muted">eigene Zeichensätze: ${Object.entries(w.partSigns).filter(([, x]) => x.length).map(([p, x]) => esc(R?.parts.find((q) => q.id === p)?.name || p) + " (" + x.length + ")").join(", ")}</span>` : "")], ["Bewertungsraster", esc(R?.name || "–")], ["Korrekturrichtlinie", esc(PX.byId("guidelines", w.guideline)?.name || "keine")], ["Zusatzdateien", w.zusatz ? "erlaubt" : "nicht erlaubt"], ["Zusatz-BE", R?.bonus?.on ? `bis ${R.bonus.max} BE für besonders gute Lösungen (im Raster freigeschaltet)` : "nicht vorgesehen"]])}
        <div class="tablewrap mt"><table class="tbl compact"><thead><tr><th>Terminart</th><th>Prüfung</th><th>Erwartungshorizont</th><th>Quelle</th><th>EK bis</th><th>ZK bis</th><th>EB von – bis</th></tr></thead><tbody>${terms.map(([k, t]) => `<tr><td>${PX.TYPE[k]}</td><td>${PX.fmtDW(t.date)} ${esc(t.time)} Uhr · ${t.dur} Min. (bis ${PX.endTime(t.time, t.dur)})</td><td class="small">${t.ewh ? icon("lock-keyhole") + " verschlüsselt" : `<span class="warntext">fehlt</span>`}</td><td>${t.cal ? PX.badge("Kalender", "cyan") : PX.badge("abweichend", "yellowb")}</td><td>${PX.fmtD(t.ekEnd)}</td><td>${PX.fmtD(t.zkEnd)}</td><td>${PX.fmtD(t.ebStart)} – ${PX.fmtD(t.ebEnd)}</td></tr>`).join("")}</tbody></table></div>
        ${warns.length ? `<div class="notice peach mt">${icon("triangle-alert")}<div><b>Hinweise der Plausibilitätsprüfung</b><br>${warns.map(esc).join("<br>")}</div></div>` : ""}
        ${errs.length ? `<div class="notice warn mt">${icon("circle-alert")}<div><b>Fehlerhafte oder unvollständige Konfiguration</b><br>${errs.map(esc).join("<br>")}<br><span class="small">Sie können die Prüfung als Entwurf speichern und später vervollständigen.</span></div></div>` : `<div class="notice success mt">${icon("circle-check")}<div>Alle Pflichtangaben sind vollständig. Nach dem Speichern erhalten die Schulleitungsteams eine Information.</div></div>`}`;
    }
    return `${PX.pagehead("Prüfung anlegen", "Assistent · " + STEPS[w.step], `<button class="btn ghost" id="w-demo" title="Termine des Demo-Szenarios eintragen">${icon("zap")} Demo-Werte einsetzen</button><button class="btn" id="w-cancel">${icon("x")} Abbrechen</button>`)}
      ${PX.steps(STEPS, w.step)}<div class="card pad mt">${body}</div>
      <div class="row between mt"><button class="btn" id="w-back" ${w.step === 0 ? "disabled" : ""}>${icon("arrow-left")} Zurück</button>
      <div class="row">${w.step === 4 ? `<button class="btn" id="w-draft">${icon("save")} Als Entwurf speichern</button><button class="btn primary" id="w-save">${icon("check")} Prüfung speichern</button>` : `<button class="btn primary" id="w-next">Weiter ${icon("arrow-right")}</button>`}</div></div>`;
  }, mount: (r) => {
    if (!wiz) wiz = blankWiz(); const w = wiz;
    $$("[data-f]", r).forEach((i) => (i.onchange = () => { const [k, f] = i.dataset.f.split("."); w.terms[k][f] = f === "dur" ? Math.max(0, +i.value || 0) : i.value; if (w.step === 2 || w.step === 1) PX.rerender(); }));
    $$("[data-on]", r).forEach((i) => (i.onchange = () => { w.terms[i.dataset.on].on = i.checked; PX.rerender(); }));
    $$("[data-own]", r).forEach((i) => (i.onchange = () => { const t = w.terms[i.dataset.own]; t.own = i.checked; if (t.own) { const c = calOf(w.subject, i.dataset.own, t.date); if (c) PX.CAL_FIELDS.forEach(([f]) => (t[f] = t[f] || c[f])); } PX.rerender(); }));
    const sn = (k) => `Erwartungshorizont_${PX.subj(w.subject)?.short || "Fach"}_${k}_${(w.terms[k].date || "2027").slice(0, 4)}.pdf`;
    $$("[data-ewhf]", r).forEach((i) => (i.onchange = () => { const f = i.files[0]; if (!f) return; if (!/\.pdf$/i.test(f.name)) return PX.toast("Kein PDF", "Es können nur PDF-Dateien hinterlegt werden.", "error"); w.terms[i.dataset.ewhf].ewh = f.name; PX.rerender(); PX.toast("Verschlüsselt hinterlegt", f.name); }));
    $$("[data-ewhdemo]", r).forEach((b) => (b.onclick = () => { w.terms[b.dataset.ewhdemo].ewh = sn(b.dataset.ewhdemo); PX.rerender(); }));
    $$("[data-ewhrm]", r).forEach((b) => (b.onclick = () => { w.terms[b.dataset.ewhrm].ewh = ""; PX.rerender(); }));
    const sub = $("#w-sub", r); if (sub) sub.onchange = () => { w.subject = sub.value; w.raster = ""; w.signset = null; w.partSigns = {}; PX.rerender(); };
    const ras = $("#w-ras", r); if (ras) ras.onchange = () => { w.raster = ras.value; w.partSigns = {}; PX.rerender(); };
    const kr = $("#w-kr", r); if (kr) kr.onchange = () => (w.guideline = kr.value);
    const zus = $("#w-zus", r); if (zus) zus.onchange = () => (w.zusatz = zus.checked);
    bindSigns(r, w, () => PX.rerender());
    const dup = $("#w-dup", r); if (dup) dup.onclick = () => dupDialog(PX.S.rasters.filter((x) => x.subject === w.subject && x.year < 2027).sort((a, b) => b.year - a.year)[0], (nr) => { w.raster = ""; PX.toast("Raster dupliziert", `„${nr.name}“ als Entwurf angelegt. Bitte prüfen und freigeben – danach steht es hier zur Auswahl.`, "info"); PX.go("#/ibbw/raster/" + nr.id + "?back=wiz"); });
    $("#w-back", r).onclick = () => { w.step--; PX.rerender(); };
    const nx = $("#w-next", r); if (nx) nx.onclick = () => {
      if (w.step === 0 && !w.subject) return PX.toast("Prüfungsfach fehlt", "Bitte ein Prüfungsfach wählen.", "warn");
      if (w.step === 0 && !PX.signsFor(w.subject).length) return PX.toast("Kein Korrekturzeichensatz", "Dem Prüfungsfach ist kein Korrekturzeichensatz zugeordnet.", "warn");
      if (w.step === 1 && Object.values(w.terms).some((t) => t.on && !t.date)) return PX.toast("Prüfungstermin fehlt", "Bitte für jede gewählte Terminart ein Datum eintragen.", "warn");
      w.step++; PX.rerender(); };
    $("#w-cancel", r).onclick = async () => { if (await PX.confirm("Eingaben verwerfen?", "Die Prüfungsanlage wird abgebrochen. Nicht gespeicherte Eingaben gehen verloren.", "Verwerfen", true)) { wiz = null; PX.go("#/ibbw/pruefungen"); } };
    $("#w-demo", r).onclick = () => { if (!w.subject) { w.subject = "vbwl"; w.signset = null; } Object.assign(w.terms.HT, { date: "2027-04-20", dur: 270, own: false }); Object.assign(w.terms.NT, { date: "2027-05-11", dur: 270, own: false }); Object.assign(w.terms.NNT, { date: "2027-06-08", dur: 270, own: false }); w.guideline = w.guideline || "kr-allg"; ["HT", "NT", "NNT"].forEach((k) => (w.terms[k].ewh = w.terms[k].ewh || `Erwartungshorizont_${PX.subj(w.subject)?.short}_${k}_2027.pdf`)); PX.rerender(); PX.toast("Demo-Werte eingesetzt", "Prüfungstermine des Szenarios; Korrekturzeiträume aus dem Korrekturkalender", "info"); };
    const save = (draft) => {
      const terms = Object.entries(w.terms).filter(([, t]) => t.on).map(([type, t]) => { const e = effTerm(w.subject, type, t); return { type, ...t, own: !e.cal, ekEnd: e.ekEnd, zkEnd: e.zkEnd, ebStart: e.ebStart, ebEnd: e.ebEnd }; });
      const errs = PX.examChecks({ subject: w.subject, raster: w.raster, signset: w.signset || [], partSigns: w.partSigns, terms }).filter((x) => x.level === "error");
      if (!draft && errs.length) return PX.toast("Speichern nicht möglich", "Pflichtangaben unvollständig – als Entwurf speichern?", "warn");
      const created = O().createExams({ subject: w.subject, raster: w.raster, guideline: w.guideline, zusatz: w.zusatz, signset: w.signset, partSigns: w.partSigns, terms });
      if (draft || errs.length) created.forEach((e) => (e.status = "entwurf"));
      wiz = null; PX.save(); PX.toast(draft ? "Entwurf gespeichert" : "Prüfung gespeichert", `${created.length} Prüfung(en) für ${esc(PX.subj(created[0].subject).name)} angelegt.`); PX.go("#/ibbw/pruefung/" + created[0].id);
    };
    const sv = $("#w-save", r); if (sv) sv.onclick = () => save(false);
    const dr = $("#w-draft", r); if (dr) dr.onclick = () => save(true);
  } }; });
  PX.resetWizard = () => (wiz = null);

  function dupDialog(src, after) {
    PX.modal({ title: "Bewertungsraster duplizieren", icon: "copy", body: `<p class="small">Vorlage: <b>${esc(src.name)}</b>. Die Kopie ist ein eigenständiges Raster im Status „Entwurf“.</p><label class="lbl" for="dn">Neuer Titel *</label><input class="input" id="dn" value="${esc(src.name.replace(String(src.year), String(src.year + 1)))}">`,
      foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>${icon("copy")} Duplizieren</button>`,
      onMount: (m, close) => { $("[data-ok]", m).onclick = () => { const n = $("#dn", m).value.trim(); if (!n) return; if (PX.S.rasters.some((x) => x.name === n)) return PX.toast("Name bereits vergeben", "", "warn"); const nr = O().duplicateRaster(src.id, n, src.year + 1); PX.save(); close(); after(nr); }; } });
  }

  // ---------- Prüfungsdetails ----------
  PX.route(/^ibbw\/pruefung\/([^/]+)$/, (m, q) => ({ title: "Prüfung", shell: "staff", need, render: () => {
    const e = PX.exam(m[1]); if (!e) return PX.empty("Prüfung nicht gefunden");
    const tab = q.tab || "stamm"; const r = PX.byId("rasters", e.raster); const kms = PX.S.kms.filter((k) => k.exam === e.id);
    const cal = e.cal ? PX.byId("calendars", e.cal) : PX.calendarFor(PX.examForm(e), e.type, e.year);
    const tabs = [["stamm", "Stammdaten"], ["grundlagen", "Bewertungsgrundlagen"], ["schulen", `Kursmappen (${kms.length})`]];
    const started = PX.S.now >= e.date;
    let body = "";
    if (tab === "stamm") body = `<div class="card pad"><div class="grid2"><div>${PX.kv([["Prüfungsfach", esc(PX.subj(e.subject).name) + "<br><span class='xs muted'>" + esc(PX.subj(e.subject).form) + "</span>"], ["Terminart", PX.TYPE[e.type]], ["Prüfungstermin", `${PX.fmtDW(e.date)}, ${esc(e.time)} Uhr · Dauer ${e.duration || PX.durOf(e.time, e.end)} Minuten (Ende ${esc(e.end)} Uhr) ${PX.S.now < e.date ? `<button class="link xs" id="editdur">ändern</button>` : ""}`], ["Plausibilität", (() => { const ch = PX.examChecks({ subject: e.subject, raster: e.raster, signset: e.signset, partSigns: e.partSigns, terms: [{ type: e.type, date: e.date, time: e.time, dur: e.duration, ewh: e.ewh?.file, ekEnd: e.ekEnd, zkEnd: e.zkEnd, ebStart: e.ebStart, ebEnd: e.ebEnd }] }); return ch.length ? ch.map((x) => `<div class="xs issue ${x.level}">${icon(x.level === "error" ? "circle-x" : "triangle-alert")} ${esc(x.text)}</div>`).join("") : `<span class="xs issue ok">${icon("circle-check")} keine Auffälligkeiten</span>`; })()], ["Status", e.status === "angelegt" ? PX.badge("angelegt", "green") : PX.badge("Entwurf", "yellowb")], ["Angelegt von", esc(PX.name(e.creator))]])}</div>
      <div><h3>Korrekturzeiträume ${e.cal ? PX.badge("aus Korrekturkalender " + cal.form + " · " + PX.TYPE[cal.type], "cyan") : PX.badge("abweichend festgelegt", "yellowb")}</h3><div class="timeline">${[["Prüfung / Start EK", e.date], ["Ende Erstkorrektur", e.ekEnd], ["Ende Zweitkorrektur", e.zkEnd], ["Beginn Endbeurteilung", e.ebStart], ["Ende Endbeurteilung", e.ebEnd]].map(([l, d]) => `<div class="${d && d <= PX.S.now ? "past" : ""}"><b>${PX.fmtD(d)}</b><span>${l}</span></div>`).join("")}</div>
      <div class="row mt">${e.cal ? `<a class="btn sm" href="#/ibbw/kalender">${icon("calendar-range")} Kalender öffnen</a><button class="btn sm" id="editdates">${icon("pencil")} Abweichend festlegen</button>` : `<button class="btn sm" id="editdates">${icon("calendar-range")} Zeiträume bearbeiten</button>${cal ? `<button class="btn sm" id="attach">${icon("link")} Kalender wieder übernehmen</button>` : ""}`}</div></div></div></div>
      <div class="row mt"><button class="btn danger" id="delex">${icon("trash-2")} Prüfung löschen</button>${e.status === "entwurf" ? `<button class="btn primary" id="finex">${icon("check")} Entwurf vervollständigen und speichern</button>` : ""}</div>`;
    if (tab === "grundlagen") {
      body = `<div class="grid2"><div>${r ? PX.rasterPreview(r) + `<div class="row mt-s"><a class="btn sm" href="#/korr/test/${r.id}">${icon("flask-conical")} Testkorrektur mit diesem Raster</a></div>` : PX.empty("Kein Bewertungsraster zugeordnet")}
        <div class="card pad mt"><h3>${icon("book-text")} Korrekturrichtlinie</h3><p class="small">${e.guideline ? esc(PX.byId("guidelines", e.guideline).name) + ` <button class="link small" id="rmkr">Zuordnung entfernen</button>` : "keine zugeordnet (zulässig)"}</p></div></div>
        <div><div class="card pad"><h3>${icon("lock-keyhole")} Erwartungshorizont</h3>
        ${e.ewh ? `<div class="filechip">${icon(PX.ewhOpen(e) ? "file-text" : "lock-keyhole")} <b>${esc(e.ewh.file)}</b><span class="xs muted">hinterlegt am ${PX.fmtD(e.ewh.date)}</span></div><div class="small mt-s">${PX.ewhOpen(e) ? PX.badge("entschlüsselt", "green") : PX.badge("verschlüsselt", "dark")} ${esc(PX.ewhState(e))}</div>
          ${PX.ewhOpen(e) ? `<div class="row mt-s"><button class="btn sm" id="ewhview">${icon("eye")} Ansehen</button><button class="btn sm" id="ewh">${icon("upload")} Ersetzen</button></div>` : `<div class="row mt-s"><button class="btn sm" id="ewh">${icon("upload")} Ersetzen</button><button class="btn sm danger" id="ewhdel">${icon("trash-2")} Löschen</button></div><p class="xs muted mt-s">${icon("lock")} Bis zum Prüfungsbeginn kann den Erwartungshorizont niemand öffnen – auch nicht das IBBW. Ersetzen ist möglich; die neue Datei wird ebenfalls verschlüsselt.</p>`}`
          : `<div class="notice warn">${icon("triangle-alert")}<div class="small">Kein Erwartungshorizont hinterlegt. Er muss bei der Anlage verschlüsselt hinterlegt werden.</div></div><button class="btn primary sm mt-s" id="ewh">${icon("upload")} PDF verschlüsselt hinterlegen</button>`}
        <div class="notice info mt">${icon("eye-off")}<div class="xs">Automatische Entschlüsselung mit Prüfungsbeginn (${PX.fmtD(e.date)}, ${esc(e.time)} Uhr). Für Schulleitungsteams und Korrektor:innen sichtbar ab Ende der Prüfungszeit (${esc(e.end)} Uhr). Änderungen nach der Prüfung werden den Korrektor:innen als Systemnachricht mitgeteilt.</div></div></div>
        <div class="card pad mt"><h3>${icon("pen-line")} Korrekturzeichen</h3>${signsEditor(e.subject, e.signset || [], e.partSigns || {}, r, started)}<div class="xs muted mt-s">${started ? icon("lock") + " Nach dem Prüfungstag nicht mehr änderbar." : "Änderungen werden sofort gespeichert und protokolliert."}</div></div></div></div>`;
    }
    if (tab === "schulen") body = kms.length ? `<div class="tablewrap"><table class="tbl"><thead><tr><th>Schule</th><th>Kursmappe</th><th>Prüflinge</th><th>Phase</th></tr></thead><tbody>${kms.map((k) => { const p = PX.phase(k); return `<tr><td>${esc(PX.orgName(k.school))}</td><td>${esc(k.name)}</td><td>${PX.activeMappen(k).length}</td><td>${PX.badge(p.label, p.kind)}</td></tr>`; }).join("")}</tbody></table></div><p class="xs muted mt-s">Das IBBW sieht nur den formalen Stand – keine personenbezogenen Daten.</p>` : PX.empty("Die Schulen haben noch keine Daten importiert.", "folder");
    return `${PX.pagehead(PX.examLabel(e), PX.subj(e.subject).form, `<a class="btn" href="#/ibbw/pruefungen">${icon("arrow-left")} Alle Prüfungen</a>`)}
      <div class="tabs">${tabs.map(([k, l]) => `<a href="#/ibbw/pruefung/${e.id}?tab=${k}" class="${tab === k ? "active" : ""}">${l}</a>`).join("")}</div>${body}`;
  }, mount: (root) => {
    const e = PX.exam(m[1]); if (!e) return;
    const b = (id, fn) => { const x = $(id, root); if (x) x.onclick = fn; };
    if (PX.S.now < e.date) {
      bindSigns(root, e, () => { PX.audit("Korrekturzeichen der Prüfung geändert", PX.examLabel(e), `${e.signset.length} Zeichen`); PX.commit(); });
    }
    b("#ewh", () => PX.modal({ title: "Erwartungshorizont verschlüsselt hinterlegen", icon: "lock-keyhole", body: `<div class="dropzone" id="dz">${icon("upload", "xl")}<b>PDF-Datei hierher ziehen</b><span class="small muted">oder auswählen – nur PDF</span><input type="file" accept="application/pdf" id="fi"></div><p class="xs muted mt">Ein vorhandener Erwartungshorizont wird überschrieben.</p>`,
      foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-demo>${icon("file-text")} Demo-PDF verwenden</button>`,
      onMount: (mm, close) => { const fi = $("#fi", mm); fi.onchange = () => { const f = fi.files[0]; if (!f) return; if (!/\.pdf$/i.test(f.name)) return PX.toast("Kein PDF", "Es können nur PDF-Dateien hochgeladen werden. Der bisherige Erwartungshorizont bleibt erhalten.", "error"); O().uploadEWH(e.id, f.name); close(); PX.commit(); PX.toast("Erwartungshorizont hochgeladen", esc(f.name)); }; $("[data-demo]", mm).onclick = () => { O().uploadEWH(e.id); close(); PX.commit(); PX.toast("Erwartungshorizont hochgeladen", esc(e.ewh.file)); }; } }));
    b("#ewhdel", async () => { if (await PX.confirm("Erwartungshorizont löschen?", "Die Prüfung hat danach keinen Erwartungshorizont.", "Löschen", true)) { O().removeEWH(e.id); PX.commit(); } });
    b("#ewhview", () => PX.showEWH(e));
    b("#editdur", () => PX.modal({ title: "Beginn und Dauer", icon: "clock", body: `<div class="grid2"><div class="field"><label class="lbl">Beginn</label><input type="time" class="input" id="dt" value="${e.time}"></div><div class="field"><label class="lbl">Dauer (Minuten)</label><input type="number" class="input" id="dd" min="30" max="480" step="5" value="${e.duration}"></div></div>`, foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Speichern</button>`, onMount: (mm, close) => { $("[data-ok]", mm).onclick = () => { const d = +$("#dd", mm).value; if (!(d > 0)) return; e.time = $("#dt", mm).value; e.duration = d; e.end = PX.endTime(e.time, d); PX.audit("Prüfungszeit geändert", PX.examLabel(e), `${e.time} Uhr, ${d} Minuten (Ende ${e.end})`); close(); PX.commit(); }; } }));
    b("#rmkr", async () => { if (await PX.confirm("Zuordnung entfernen?", "Die Korrekturrichtlinie wird nicht gelöscht, nur von dieser Prüfung gelöst.", "Entfernen")) { e.guideline = ""; PX.audit("Korrekturrichtlinie entfernt", PX.examLabel(e)); PX.commit(); } });
    b("#delex", async () => { const used = PX.S.kms.some((k) => k.exam === e.id); if (used) return PX.toast("Löschen nicht möglich", "Für diese Prüfung liegen bereits Kursmappen vor.", "warn"); if (await PX.confirm("Prüfung löschen?", `„${esc(PX.examLabel(e))}“ wird unwiderruflich gelöscht.`, "Löschen", true)) { PX.S.exams = PX.S.exams.filter((x) => x.id !== e.id); PX.audit("Prüfung gelöscht", PX.examLabel(e)); PX.commit(); PX.go("#/ibbw/pruefungen"); } });
    b("#finex", () => { if (termErrors(e).length || !e.raster) return PX.toast("Noch unvollständig", termErrors(e).join(", ") || "Bewertungsraster fehlt", "warn"); e.status = "angelegt"; PX.audit("Prüfung vervollständigt", PX.examLabel(e)); PX.commit(); });
    b("#attach", () => { O().attachCalendar(e.id); PX.commit(); PX.toast("Korrekturkalender übernommen", ""); });
    b("#editdates", () => PX.modal({ title: e.cal ? "Abweichende Korrekturzeiträume" : "Korrekturzeiträume bearbeiten", icon: "calendar-range", body: `${e.cal ? `<div class="notice warn">${icon("triangle-alert")}<div class="small">Die Prüfung wird vom Korrekturkalender gelöst. Spätere Kalenderänderungen wirken sich dann nicht mehr aus.</div></div>` : ""}${PX.CAL_FIELDS.map(([f, l]) => `<div class="field"><label class="lbl">${l}</label><input type="date" class="input" data-k="${f}" value="${e[f]}"></div>`).join("")}<div id="derr" class="xs" style="color:var(--red)"></div>`,
      foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Speichern</button>`,
      onMount: (mm, close) => { $("[data-ok]", mm).onclick = () => { const t = { ...e }; $$("[data-k]", mm).forEach((i) => (t[i.dataset.k] = i.value)); const er = termErrors(t); if (er.length) { $("#derr", mm).textContent = er.join(" · "); return; } const vals = {}; PX.CAL_FIELDS.forEach(([f]) => (vals[f] = t[f])); if (e.cal) O().detachCalendar(e.id, vals); else { Object.assign(e, vals); PX.audit("Korrekturzeiträume geändert", PX.examLabel(e)); } close(); PX.commit(); }; } }));
  } }));

  // ---------- Korrekturkalender (global je Schulform und Terminart) ----------
  let calYear = 2027;
  PX.route(/^ibbw\/kalender$/, () => ({ title: "Korrekturkalender", shell: "staff", need, render: () => {
    const years = [...new Set(PX.S.calendars.map((c) => c.year))].sort();
    const rows = (f) => PX.S.calendars.filter((c) => c.form === f && c.year === calYear).sort((a, b) => ["HT", "NT", "NNT"].indexOf(a.type) - ["HT", "NT", "NNT"].indexOf(b.type));
    const linked = (c) => PX.S.exams.filter((e) => e.cal === c.id);
    return `${PX.pagehead("Korrekturkalender", "Globale Korrekturzeiträume je Abiturjahr, Schulform und Terminart – werden von den Prüfungen übernommen", `<select class="select" id="cy" style="width:auto">${years.map((y) => `<option ${y === calYear ? "selected" : ""}>${y}</option>`).join("")}</select><button class="btn" id="cnext">${icon("calendar-plus")} Kalender ${Math.max(...years) + 1} anlegen</button>`)}
      <div class="notice info">${icon("link")}<div class="small">Prüfungen übernehmen bei der Anlage die Zeiträume ihrer Schulform und Terminart und bleiben verknüpft. Änderungen hier aktualisieren alle verknüpften Prüfungen (protokolliert). Einzelne Prüfungen können in den Prüfungsdetails abweichend festgelegt werden.</div></div>
      ${["BG", "AG"].map((f) => `<h2 class="mt">${formLabel(f)}</h2><div class="tablewrap"><table class="tbl"><thead><tr><th>Terminart</th>${PX.CAL_FIELDS.map(([, l]) => `<th>${l}</th>`).join("")}<th>Verknüpfte Prüfungen</th><th></th></tr></thead><tbody>
        ${rows(f).map((c) => `<tr><td><b>${PX.TYPE[c.type]}</b></td>${PX.CAL_FIELDS.map(([k]) => `<td><input type="date" class="input" data-cal="${c.id}|${k}" value="${c[k]}"></td>`).join("")}<td class="small">${linked(c).map((e) => esc(PX.subj(e.subject)?.short)).join(", ") || "–"}</td><td><button class="btn sm" data-csave="${c.id}">${icon("save")} Speichern</button></td></tr>`).join("") || `<tr><td colspan="7" class="muted">Kein Kalender für ${calYear}</td></tr>`}</tbody></table></div>`).join("")}`;
  }, mount: (r) => {
    $("#cy", r).onchange = (e) => { calYear = +e.target.value; PX.rerender(); };
    $$("[data-csave]", r).forEach((b) => (b.onclick = async () => {
      const id = b.dataset.csave; const c = PX.byId("calendars", id); const v = {}; $$(`[data-cal^="${id}|"]`, r).forEach((i) => (v[i.dataset.cal.split("|")[1]] = i.value));
      const er = termErrors({ date: PX.S.exams.filter((e) => e.cal === id).map((e) => e.date).sort()[0] || "2000-01-01", ...v }); if (er.length) return PX.toast("Reihenfolge prüfen", er.join(" · "), "warn");
      const n = PX.S.exams.filter((e) => e.cal === id).length;
      if (n && !(await PX.confirm("Korrekturkalender ändern?", `${n} verknüpfte Prüfung(en) übernehmen die neuen Zeiträume. Bereits informierte Schulen sehen die Änderung sofort.`, "Übernehmen"))) return;
      O().saveCalendar(id, v); PX.commit(); PX.toast("Korrekturkalender gespeichert", `${c.form} · ${PX.TYPE[c.type]} · ${n} Prüfung(en) aktualisiert`);
    }));
    $("#cnext", r).onclick = () => { const y = Math.max(...PX.S.calendars.map((c) => c.year)); PX.S.calendars.filter((c) => c.year === y).forEach((c) => { const n = { ...c, id: c.id.replace(String(y), String(y + 1)), year: y + 1 }; PX.CAL_FIELDS.forEach(([f]) => (n[f] = PX.addDays(c[f], 364))); PX.S.calendars.push(n); }); calYear = y + 1; PX.audit("Korrekturkalender angelegt", `Abiturjahr ${y + 1}`, "aus dem Vorjahr übernommen (+52 Wochen)"); PX.commit(); };
  } }));

  // ---------- Prüfungsfächer ----------
  PX.route(/^ibbw\/faecher$/, () => ({ title: "Prüfungsfächer", shell: "staff", need, render: () => `${PX.pagehead("Prüfungsfächer", "Fachliche Vorgaben je Unterrichtsfach und Schulform", `<button class="btn primary" id="addsub">${icon("plus")} Prüfungsfach hinzufügen</button>`)}
    ${["BG", "AG"].map((f) => `<h2 class="mt">${formLabel(f)}</h2><div class="tablewrap"><table class="tbl"><thead><tr><th>Prüfungsfach</th><th>Schulform</th><th>Korrekturzeichensatz</th><th>Bewertungsraster</th><th>Priorität Gruppenbildung</th><th>Aktiv</th><th></th></tr></thead><tbody>
    ${PX.S.subjects.filter((s) => PX.schulform(s.id) === f).map((s) => `<tr><td><b>${esc(s.name)}</b> <span class="muted">(${esc(s.short)})</span></td><td class="small">${esc(s.form)}</td><td>${PX.signsFor(s.id).length ? `<span class="signs mini">${PX.signsFor(s.id).slice(0, 7).map((z) => `<span class="sign static">${esc(z.code)}</span>`).join("")}${PX.signsFor(s.id).length > 7 ? "…" : ""}</span>` : `<span class="badge red">fehlt</span>`}</td><td class="small">${PX.S.rasters.filter((r) => r.subject === s.id).length || "–"}</td><td>${s.prio === "hoch" ? PX.badge("hoch", "red") : "normal"}</td>
    <td><label class="toggle"><input type="checkbox" data-act="${s.id}" ${s.active ? "checked" : ""}><span></span></label></td><td class="nowrap"><button class="btn sm" data-edit="${s.id}">Bearbeiten</button> <button class="iconbtn" data-del="${s.id}" aria-label="Löschen">${icon("trash-2")}</button></td></tr>`).join("")}</tbody></table></div>`).join("")}
    <p class="xs muted mt-s">Prüfungsfächer mit hoher Priorität werden bei der Korrekturgruppenbildung zuerst zugewiesen (wenige Korrektor:innen). Gelöschte Fächer mit bestehenden Prüfungen werden nur inaktiv gesetzt. Gutachten, Gliederung und Bausteine werden im Bewertungsraster festgelegt.</p>`,
  mount: (r) => {
    const dlg = (s) => PX.modal({ title: s ? "Prüfungsfach bearbeiten" : "Prüfungsfach hinzufügen", icon: "book-open", body: `<div class="field"><label class="lbl">Name *</label><input class="input" id="sn" value="${esc(s?.name || "")}"></div><div class="grid2"><div class="field"><label class="lbl">Kürzel *</label><input class="input" id="ss" value="${esc(s?.short || "")}"></div><div class="field"><label class="lbl">Schulform *</label><select class="select" id="sf">${["Berufliches Gymnasium", "Berufliches Gymnasium (WG)", "Berufliches Gymnasium (TG)", "Allgemeinbildendes Gymnasium"].map((f) => `<option ${s?.form === f ? "selected" : ""}>${f}</option>`).join("")}</select></div></div>
      <div class="field"><label class="lbl">Priorität Korrekturgruppenbildung</label><select class="select" id="sp"><option value="normal">normal</option><option value="hoch" ${s?.prio === "hoch" ? "selected" : ""}>hoch (seltenes Fach)</option></select></div>
      <p class="xs muted">Den Korrekturzeichensatz pflegen Sie unter <a href="#/ibbw/zeichen">Korrekturzeichen</a>. Ohne Zeichensatz kann keine Prüfung angelegt werden.</p>`,
      foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Speichern</button>`,
      onMount: (m, close) => { $("[data-ok]", m).onclick = () => { const v = { name: $("#sn", m).value.trim(), short: $("#ss", m).value.trim(), form: $("#sf", m).value, prio: $("#sp", m).value }; if (!v.name || !v.short) return PX.toast("Pflichtfelder fehlen", "", "warn"); if (s) { Object.assign(s, v); PX.audit("Prüfungsfach bearbeitet", v.name); } else { PX.S.subjects.push({ id: PX.uid("f-"), active: true, ...v }); PX.audit("Prüfungsfach angelegt", v.name); } close(); PX.commit(); PX.toast("Gespeichert", esc(v.name)); }; } });
    $("#addsub", r).onclick = () => dlg(null);
    $$("[data-edit]", r).forEach((b) => (b.onclick = () => dlg(PX.subj(b.dataset.edit))));
    $$("[data-act]", r).forEach((i) => (i.onchange = () => { const s = PX.subj(i.dataset.act); s.active = i.checked; PX.audit(i.checked ? "Prüfungsfach aktiviert" : "Prüfungsfach deaktiviert", s.name); PX.commit(); }));
    $$("[data-del]", r).forEach((b) => (b.onclick = async () => { const s = PX.subj(b.dataset.del); const used = PX.S.exams.some((e) => e.subject === s.id); if (await PX.confirm("Prüfungsfach löschen?", used ? `Für „${esc(s.name)}“ existieren Prüfungen. Das Fach wird nicht gelöscht, sondern inaktiv gesetzt.` : `„${esc(s.name)}“ wird gelöscht.`, used ? "Inaktiv setzen" : "Löschen", true)) { if (used) s.active = false; else PX.S.subjects = PX.S.subjects.filter((x) => x !== s); PX.audit(used ? "Prüfungsfach inaktiv gesetzt" : "Prüfungsfach gelöscht", s.name); PX.commit(); } }));
  } }));

  // ---------- Bewertungsraster: Liste ----------
  const rasterMax = (r) => (r.combine === "sum" ? PX.maxBE(r) + " BE" : r.parts.map((p) => PX.SCORING_SHORT[p.scoring]).join(" + ") + " → NP");
  PX.route(/^ibbw\/raster$/, () => ({ title: "Bewertungsraster", shell: "staff", need, render: () => `${PX.pagehead("Bewertungsraster", "Prüfungsteile, Aufgabenbaum, Wahlregeln, Notenberechnung und Gutachten", `<a class="btn" href="#/ibbw/raster-import">${icon("file-spreadsheet")} Aus Excel importieren</a><button class="btn primary" id="newr">${icon("plus")} Bewertungsraster anlegen</button>`)}
    <div class="tablewrap"><table class="tbl"><thead><tr><th><input type="checkbox" id="rall"></th><th>Bewertungsraster</th><th>Prüfungsfach</th><th>Aufbau</th><th>Bewertung</th><th>Besonderheiten</th><th>Status</th><th></th></tr></thead><tbody>
    ${PX.S.rasters.map((r) => { const lg = (r.groups || []).some((g) => g.chooser === "lehrer"); const sp = [lg ? "Lehrerwahl" : "", (r.groups || []).some((g) => g.chooser !== "lehrer") ? "Schülerwahl" : "", r.parts.some((p) => p.scoring === "extern") ? "nicht korrekturrelevanter Teil" : "", r.parts.some((p) => p.scoring === "fehler") ? "Fehlerzahl" : "", (r.caps || []).length ? "Kappung" : "", r.gutachten?.on ? "Gutachten" + (r.gutachten.sections?.length > 1 ? " (gegliedert)" : "") : "", r.formPdf ? "Formblatt-PDF" : ""].filter(Boolean);
      return `<tr><td>${r.status !== "freigegeben" ? `<input type="checkbox" data-sel="${r.id}">` : ""}</td><td><b>${esc(r.name)}</b></td><td>${esc(PX.subj(r.subject)?.name)}<div class="xs muted">${esc(r.form || PX.schulform(r.subject))}</div></td><td class="small">${r.parts.length} Teil(e) · ${PX.leaves(r).length} Bewertungsfelder</td><td class="small">${esc(rasterMax(r))}</td><td class="xs">${sp.map((x) => PX.badge(x, "gray")).join(" ")}</td><td>${PX.badge(r.status === "freigegeben" ? "freigegeben" : "in Bearbeitung", r.status === "freigegeben" ? "green" : "yellowb")}</td>
      <td class="nowrap"><a class="btn sm" href="#/ibbw/raster/${r.id}">Öffnen</a> <a class="btn sm" href="#/korr/test/${r.id}" title="Im Korrekturmodus ausprobieren">${icon("flask-conical")} Test</a> <button class="btn sm" data-dup="${r.id}">${icon("copy")}</button> <button class="iconbtn" data-del="${r.id}" aria-label="Löschen">${icon("trash-2")}</button></td></tr>`; }).join("")}</tbody></table></div>
    <div class="row mt"><button class="btn" id="relsel">${icon("badge-check")} Ausgewählte freigeben</button><span class="xs muted">Freigegebene Raster stehen in der Prüfungsanlage zur Auswahl.</span></div>`,
  mount: (r) => {
    $("#newr", r).onclick = () => { const nr = { id: PX.uid("rs-"), name: "Neues Bewertungsraster", subject: "vbwl", year: 2027, form: "BG", status: "entwurf", combine: "sum", key: "bg100", round: { stage: "round", final: "ceil", withExtern: "round" }, abzugMax: 2, bonus: { max: 0 }, parts: [{ id: "p1", name: "Prüfung", scoring: "be", weight: 100 }], nodes: [{ id: PX.uid("n-"), part: "p1", parent: null, no: "1", title: "", be: 10 }], groups: [], caps: [], gutachten: { on: false, required: false, sections: ["Gutachten"], bausteine: [] }, formPdf: false }; PX.S.rasters.push(nr); PX.audit("Bewertungsraster angelegt", nr.name); PX.save(); PX.go("#/ibbw/raster/" + nr.id); };
    $$("[data-dup]", r).forEach((b) => (b.onclick = () => dupDialog(PX.byId("rasters", b.dataset.dup), (nr) => { PX.commit(); PX.go("#/ibbw/raster/" + nr.id); })));
    $$("[data-del]", r).forEach((b) => (b.onclick = async () => { const ra = PX.byId("rasters", b.dataset.del); if (PX.S.exams.some((e) => e.raster === ra.id)) return PX.toast("Löschen nicht möglich", "Das Raster ist einer Prüfung zugeordnet.", "warn"); if (await PX.confirm("Bewertungsraster löschen?", `„${esc(ra.name)}“ wird dauerhaft gelöscht.`, "Ja, löschen", true)) { PX.S.rasters = PX.S.rasters.filter((x) => x !== ra); PX.audit("Bewertungsraster gelöscht", ra.name); PX.commit(); } }));
    $("#rall", r).onchange = (e) => $$("[data-sel]", r).forEach((c) => (c.checked = e.target.checked));
    $("#relsel", r).onclick = async () => { const ids = $$("[data-sel]:checked", r).map((c) => c.dataset.sel); if (!ids.length) return PX.toast("Nichts ausgewählt", "", "info"); const bad = ids.filter((id) => PX.rasterIssues(PX.byId("rasters", id)).some((x) => x.level === "error")); if (bad.length) return PX.toast("Freigabe nicht möglich", `${bad.length} Raster haben noch Fehler – bitte öffnen und prüfen.`, "warn"); if (await PX.confirm("Bewertungsraster freigeben?", `${ids.length} Raster gelten danach als vollständig und können Prüfungen zugeordnet werden.`, "Freigeben")) { ids.forEach((id) => O().releaseRaster(id)); PX.commit(); } };
  } }));

  // Prüfung eines Rasters (Freigabevoraussetzungen)
  PX.rasterIssues = function (r) {
    const out = []; const E = (t) => out.push({ level: "error", text: t }); const W = (t) => out.push({ level: "warn", text: t });
    if (!r.parts.length) E("mindestens einen Prüfungsteil anlegen");
    r.parts.forEach((p) => {
      const ls = PX.leaves(r).filter((l) => l.part === p.id);
      if (p.scoring !== "extern" && !ls.length) E(`${p.name}: keine Aufgaben`);
      if (p.scoring === "be" || p.scoring === "pct") ls.forEach((l) => { if (l.be == null || l.be === "" || +l.be <= 0) E(`${p.name} · ${l.no || "?"}: BE fehlen`); });
      if ((p.scoring === "fehler" || p.scoring === "pct") && !p.key) E(`${p.name}: Skala / Notenschlüssel zuordnen`);
      if (p.scoring === "be" && r.combine !== "sum" && !p.key) E(`${p.name}: Notenschlüssel zuordnen`);
    });
    r.nodes.forEach((n) => { if (!String(n.no || "").trim()) E("Aufgabe ohne Nummer"); });
    (r.groups || []).forEach((g) => { if (g.options.length < 2) W(`${g.label}: weniger als zwei Optionen`); if (g.pick < 1 || g.pick > g.options.length) E(`${g.label}: Anzahl „${g.pick} aus ${g.options.length}“ ungültig`); });
    if (r.combine === "sum") {
      const k = PX.KEYS[r.key]; if (!k) E("Notenschlüssel für die Gesamtsumme zuordnen"); else if (k.max !== PX.maxBE(r)) E(`Notenschlüssel passt nicht: ${k.name} (${k.max} BE), erreichbar sind ${PX.maxBE(r)} BE`);
      r.parts.filter((p) => !["be", "extern"].includes(p.scoring)).forEach((p) => E(`${p.name}: Bewertungsart „${PX.SCORING_SHORT[p.scoring]}“ kann nicht zur BE-Summe addiert werden – Kombination „gewichten“ oder „Mittelwert“ wählen`));
      if (r.form && k && !String(r.key).startsWith(r.form.toLowerCase())) W(`Notenschlüssel „${k.name}“ gehört nicht zur Schulform ${r.form}`);
    }
    r.parts.filter((p) => p.scoring === "be" && r.combine !== "sum" && p.key).forEach((p) => { const k = PX.KEYS[p.key]; if (k && k.max !== PX.partMax(r, p)) E(`${p.name}: Notenschlüssel ${k.max} BE, erreichbar sind ${PX.partMax(r, p)} BE`); });
    if (r.bonus?.on) { if (!(+r.bonus.max > 0)) E("Zusatz-BE freigeschaltet, aber keine BE angegeben"); if (r.combine !== "sum") E("Zusatz-BE sind nur bei einer BE-Summe möglich"); else if (+r.bonus.max > 0.15 * PX.maxBE(r)) W(`Zusatz-BE (${r.bonus.max}) sind mehr als 15 % der erreichbaren BE`); }
    if (r.combine === "weighted") r.parts.forEach((p) => { if (!(+p.weight > 0)) E(`${p.name}: Gewicht 0 %`); });
    (r.caps || []).forEach((cp) => { if (!r.parts.some((p) => p.id === cp.part) || cp.nodes.some((id) => !r.nodes.some((n) => n.id === id))) E(`Kappung „${cp.label}“ verweist auf nicht vorhandene Aufgaben`); if (cp.max > 15 || cp.max < 0) E(`Kappung „${cp.label}“: ungültiger Höchstwert`); });
    (r.groups || []).forEach((g) => { const ms = new Set(g.options.map((id) => { const n = r.nodes.find((x) => x.id === id); return n ? PX.nodeMax(r, n) : 0; })); const p = PX.partOf(r, r.nodes.find((x) => x.id === g.options[0]) || {}); if (p && p.scoring !== "np" && ms.size > 1) W(`${g.label}: Optionen mit unterschiedlichen BE (${[...ms].join(" / ")}) – Maximum hängt von der Wahl ab`); if (g.options.some((id) => !r.nodes.some((n) => n.id === id))) E(`${g.label}: verweist auf gelöschte Aufgaben`); });
    if (r.gutachten?.on && (r.gutachten.bausteine || []).some((b) => !String(b.text || "").trim())) W("Gutachten: leere Textbausteine");
    if (r.combine === "weighted") { const s = PX.sum(r.parts.map((p) => +p.weight || 0)); if (Math.abs(s - 100) > 0.01) E(`Gewichte der Prüfungsteile ergeben ${PX.fmtNP(s)} % statt 100 %`); }
    r.parts.filter((p) => p.scoring === "np").forEach((p) => { const check = (pid) => { const ks = PX.kids(r, pid, p.id).filter((k) => !PX.groupOfNode(r, k.id)); if (ks.length > 1 && ks.some((k) => k.weight != null)) { const s = PX.sum(ks.map((k) => +(k.weight ?? 0))); if (Math.abs(s - 1) > 0.01) W(`${p.name}${pid ? " · " + r.nodes.find((x) => x.id === pid)?.no : ""}: Gewichte ergeben ${PX.fmtNP(s * 100)} %`); } ks.forEach((k) => check(k.id)); }; check(null); });
    if (r.gutachten?.on && !(r.gutachten.sections || []).length) E("Gutachten: mindestens einen Gliederungspunkt anlegen");
    if (!out.some((x) => x.level === "error")) out.push({ level: "ok", text: "Raster vollständig" });
    return out;
  };
  const issueList = (list) => list.map((x) => `<div class="xs issue ${x.level}">${icon(x.level === "error" ? "circle-x" : x.level === "warn" ? "triangle-alert" : "circle-check")} ${esc(x.text)}</div>`).join("");

  // ---------- Excel-Import (Format „Aufgabenstruktur“) ----------
  let IM = null;
  PX.route(/^ibbw\/raster-import$/, () => ({ title: "Raster importieren", shell: "staff", need, render: () => {
    let res = null;
    if (IM?.aoa) res = PX.buildRaster(PX.rowsFromSheet(IM.aoa), { name: IM.name, subject: IM.subject, year: +IM.year, form: PX.schulform(IM.subject) });
    const head = IM?.aoa ? IM.aoa.find((row) => row.some((v) => /^aufgabe/i.test(String(v || "").trim()))) || IM.aoa[0] : null;
    return `${PX.pagehead("Bewertungsraster aus Excel importieren", "Aufgabenstruktur einlesen – Aufgabenbaum, Pflicht- und Wahlaufgaben und Wahlgruppen werden automatisch erzeugt", `<a class="btn" href="#/ibbw/raster">${icon("arrow-left")} Alle Raster</a>`)}
      <div class="grid2"><div class="card pad"><h3>${icon("file-spreadsheet")} 1 · Datei wählen</h3>
        <div class="dropzone">${icon("upload", "xl")}<b>Excel-Datei (.xlsx) hierher ziehen</b><span class="small muted">oder auswählen</span><input type="file" accept=".xlsx,.xls,.csv" id="xf"></div>
        <div class="row mt"><button class="btn sm" id="xsample">${icon("table")} Beispiel „Aufgabenstruktur VBWL“ laden</button><button class="btn sm" id="xtpl">${icon("download")} Vorlage herunterladen</button></div>
        ${IM?.file ? `<div class="filechip mt">${icon("file-check")} <b>${esc(IM.file)}</b><span class="xs muted">${IM.aoa.length} Zeilen</span></div>` : ""}</div>
        <div class="card pad"><h3>${icon("info")} Aufbau der Tabelle</h3><table class="tbl compact"><tbody>
          <tr><td><b>Teil</b></td><td class="small">Prüfungsteil – gilt bis zum nächsten Eintrag (z. B. „Teil 1“, „Teil 2“)</td></tr>
          <tr><td><b>Aufgaben</b></td><td class="small">Nummer mit Punkten: A1 → A1.1 → A1.1.1 ergibt den Aufgabenbaum</td></tr>
          <tr><td><b>BE</b></td><td class="small">an den untersten Teilaufgaben; Angaben an übergeordneten Aufgaben werden als Summe geprüft</td></tr>
          <tr><td><b>Pflichtaufgabe</b></td><td class="small">markiert: muss bearbeitet werden (nicht Teil einer Wahl)</td></tr>
          <tr><td><b>Gruppe · Anzahl · Max BE</b></td><td class="small">Wahlgruppe: Prüfling bearbeitet „Anzahl“ Aufgaben der Gruppe; Max BE wird geprüft</td></tr>
          <tr><td><b>Validierung</b></td><td class="small muted">wird derzeit ignoriert (Bedeutung offen)</td></tr></tbody></table></div></div>
      ${IM?.aoa ? `<div class="card pad mt"><h3>${icon("settings")} 2 · Angaben zum Raster</h3><div class="grid3"><div class="field"><label class="lbl">Titel *</label><input class="input" id="xn" value="${esc(IM.name)}"></div><div class="field"><label class="lbl">Prüfungsfach *</label><select class="select" id="xs">${PX.S.subjects.map((s) => `<option value="${s.id}" ${s.id === IM.subject ? "selected" : ""}>${esc(s.name)} (${PX.schulform(s.id)})</option>`).join("")}</select></div><div class="field"><label class="lbl">Abiturjahr</label><input class="input" id="xy" type="number" value="${esc(IM.year)}"></div></div></div>
        <div class="grid2 mt"><div class="card pad"><h3>${icon("clipboard-check")} 3 · Prüfung der Daten</h3>${issueList(res.report)}
          <details class="mt"><summary class="small">Eingelesene Zeilen anzeigen</summary><div class="tablewrap mt-s" style="max-height:340px;overflow:auto"><table class="tbl compact"><thead><tr>${(head || []).map((h) => `<th>${esc(h ?? "")}</th>`).join("")}</tr></thead><tbody>${IM.aoa.slice(IM.aoa.indexOf(head) + 1).map((row) => `<tr>${(head || []).map((_, i) => `<td class="xs">${esc(row[i] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details></div>
          <div>${PX.rasterPreview(res.raster)}</div></div>
        <div class="row mt"><button class="btn primary" id="xgo" ${res.report.some((x) => x.level === "error") ? "disabled" : ""}>${icon("check")} Als Entwurf anlegen und im Editor öffnen</button><span class="xs muted">Titel der Aufgaben, Gutachten und Notenberechnung ergänzen Sie anschließend im Editor.</span></div>` : ""}`;
  }, mount: (r) => {
    const load = (aoa, file) => { IM = { aoa, file, name: IM?.name || "Importiertes Raster – " + file.replace(/\.[^.]+$/, ""), subject: IM?.subject || "vbwl", year: IM?.year || 2027 }; PX.rerender(); };
    $("#xf", r).onchange = (e) => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { const wb = XLSX.read(new Uint8Array(rd.result), { type: "array" }); const ws = wb.Sheets[wb.SheetNames[0]]; load(XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }), f.name); } catch (err) { PX.toast("Datei nicht lesbar", String(err.message || err), "error"); } }; rd.readAsArrayBuffer(f); };
    $("#xsample", r).onclick = () => { IM = { name: "VBWL – Haupttermin 2027 (Import)", subject: "vbwl", year: 2027 }; load(PX.clone(PX.SAMPLE_VBWL), "Aufgabenstruktur.xlsx"); };
    $("#xtpl", r).onclick = () => { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Teil", "Aufgaben", "BE", "Validierung", "Pflichtaufgabe", "Gruppe", "Anzahl Aufgaben je Gruppe", "Max BE je Gruppe", "Titel"], ...PX.SAMPLE_VBWL.slice(1).map((x) => [...x, PX.VBWL_TITLES[x[1]] || ""])]), "Aufgabenstruktur"); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Hinweise"], ["Spalte Teil: Name des Prüfungsteils, gilt bis zum nächsten Eintrag."], ["Spalte Aufgaben: Nummern mit Punkten bilden den Aufgabenbaum (A1, A1.1, A1.1.1)."], ["Spalte BE: an den untersten Teilaufgaben."], ["Pflichtaufgabe: x = muss bearbeitet werden."], ["Gruppe / Anzahl / Max BE: Wahlgruppe – Anzahl der zu bearbeitenden Aufgaben."], ["Titel (optional): Bezeichnung der Aufgabe."]]), "Hinweise"); XLSX.writeFile(wb, "PASCA_Vorlage_Bewertungsraster.xlsx"); };
    const bind = (id, k) => { const x = $(id, r); if (x) x.onchange = () => { IM[k] = x.value; PX.rerender(); }; };
    bind("#xn", "name"); bind("#xs", "subject"); bind("#xy", "year");
    const go = $("#xgo", r); if (go) go.onclick = () => { const { raster } = PX.buildRaster(PX.rowsFromSheet(IM.aoa), { name: IM.name, subject: IM.subject, year: +IM.year, form: PX.schulform(IM.subject) }); raster.status = "entwurf"; PX.S.rasters.push(raster); PX.audit("Bewertungsraster aus Excel importiert", raster.name, `${IM.file}: ${raster.parts.length} Teile, ${raster.nodes.length} Aufgaben, ${raster.groups.length} Wahlgruppen`); IM = null; PX.save(); PX.go("#/ibbw/raster/" + raster.id); PX.toast("Raster angelegt", "Bitte Bezeichnungen, Notenberechnung und Gutachten prüfen und freigeben."); };
  } }));

  // ---------- Bewertungsraster: Editor mit Aufgabenbaum und Testrechnung ----------
  const TEST = {};
  const testOf = (r) => (TEST[r.id] = TEST[r.id] || { c: { be: {}, wahl: {}, abzug: 0, bonus: 0 }, km: { lehrerwahl: {} }, m: { extern: {} } });
  const opt = (obj, cur) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === cur ? "selected" : ""}>${esc(v)}</option>`).join("");
  const keyOpts = (cur, kinds) => `<option value="">–</option>` + Object.entries(PX.KEYS).filter(([, k]) => kinds.includes(k.kind)).map(([id, k]) => `<option value="${id}" ${id === cur ? "selected" : ""}>${esc(k.name)}</option>`).join("");
  function nodesEd(r, parentId, p, d, ro) {
    return PX.kids(r, parentId, p.id).map((n) => {
      const leaf = PX.isLeaf(r, n); const g = PX.groupOfNode(r, n.id); const dis = ro ? "disabled" : "";
      const val = p.scoring === "np" ? `<input class="input sm num" type="number" step="0.05" min="0" max="1" data-n="${n.id}|weight" value="${n.weight ?? ""}" placeholder="Gew." title="Gewicht innerhalb der Ebene (0–1)" ${dis}>` : p.scoring === "fehler" || p.scoring === "extern" ? "" : leaf ? `<input class="input sm num ${!(+n.be > 0) ? "err" : ""}" type="number" min="0" step="${r.beHalf ? 0.5 : 1}" data-n="${n.id}|be" value="${n.be ?? ""}" ${dis}><span class="xs muted">BE</span>` : `<span class="xs muted nowrap">Σ ${PX.nodeMax(r, n)} BE</span>`;
      return `<div class="ned d${d}" style="--d:${d}"><input class="input sm" style="width:84px" data-n="${n.id}|no" value="${esc(n.no)}" ${dis}><input class="input sm grow" data-n="${n.id}|title" value="${esc(n.title || "")}" placeholder="Bezeichnung" ${dis}>${val}
        ${g ? PX.badge((g.chooser === "lehrer" ? "Lehrerwahl" : "Wahl") + " " + g.pick + "/" + g.options.length, g.chooser === "lehrer" ? "purple" : "cyan") : `<label class="xs nowrap" title="Pflichtaufgabe: muss bearbeitet werden"><input type="checkbox" data-n="${n.id}|pflicht" ${n.pflicht ? "checked" : ""} ${dis}> Pflicht</label>`}
        ${ro ? "" : `<button class="iconbtn sm" data-addsub="${n.id}" title="Teilaufgabe hinzufügen">${icon("plus")}</button><button class="iconbtn sm" data-rmn="${n.id}" title="Löschen">${icon("trash-2")}</button>`}</div>${nodesEd(r, n.id, p, d + 1, ro)}`;
    }).join("");
  }
  PX.route(/^ibbw\/raster\/([^/]+)$/, (m, q) => ({ title: "Bewertungsraster", shell: "staff", need, render: () => {
    const r = PX.byId("rasters", m[1]); if (!r) return PX.empty("Raster nicht gefunden");
    const ro = r.status === "freigegeben"; const dis = ro ? "disabled" : "";
    const T = testOf(r); const iss = PX.rasterIssues(r); const hasExt = r.parts.some((p) => p.scoring === "extern");
    const G = r.gutachten || (r.gutachten = { on: false, sections: ["Gutachten"], bausteine: [] });
    return `${PX.pagehead(r.name, `${esc(PX.subj(r.subject)?.name)} · ${ro ? "freigegeben (schreibgeschützt)" : "in Bearbeitung – Änderungen werden automatisch zwischengespeichert"}`, `<a class="btn" href="${q.back === "wiz" ? "#/ibbw/pruefung/neu" : "#/ibbw/raster"}">${icon("arrow-left")} ${q.back === "wiz" ? "Zurück zur Prüfungsanlage" : "Alle Raster"}</a><a class="btn" href="#/korr/test/${r.id}">${icon("flask-conical")} Im Korrekturmodus testen</a>${ro ? "" : `<button class="btn primary" id="rel">${icon("badge-check")} Freigeben</button>`}`)}
      <div class="grid2 wide-left"><div>
        <div class="card pad"><div class="grid3"><div class="field"><label class="lbl">Titel *</label><input class="input" id="rn" value="${esc(r.name)}" ${dis}></div><div class="field"><label class="lbl">Prüfungsfach *</label><select class="select" id="rsub" ${dis}>${PX.S.subjects.map((s) => `<option value="${s.id}" ${s.id === r.subject ? "selected" : ""}>${esc(s.name)} (${PX.schulform(s.id)})</option>`).join("")}</select></div><div class="field"><label class="lbl">Abiturjahr</label><input class="input" type="number" id="ry" value="${r.year}" ${dis}></div></div></div>
        <div class="card pad mt"><h3>${icon("layers")} Prüfungsteile</h3><p class="xs muted">Jeder Teil hat eine eigene Bewertungsart. Nicht korrekturrelevante Teile (z. B. Kommunikationsprüfung) werden nur mit Notenpunkten nachgetragen.</p>
          <div class="tablewrap"><table class="tbl compact"><thead><tr><th>Bezeichnung</th><th>Bewertungsart</th>${r.combine !== "sum" ? "<th>Gewicht %</th>" : ""}<th>Notenschlüssel / Skala</th><th></th></tr></thead><tbody>
          ${r.parts.map((p) => `<tr><td><input class="input sm" data-p="${p.id}|name" value="${esc(p.name)}" ${dis}></td><td><select class="select sm" data-p="${p.id}|scoring" ${dis}>${opt(PX.SCORING, p.scoring)}</select></td>${r.combine !== "sum" ? `<td><input class="input sm num" type="number" min="0" max="100" data-p="${p.id}|weight" value="${p.weight ?? ""}" ${dis}></td>` : ""}<td>${p.scoring === "np" || p.scoring === "extern" || (p.scoring === "be" && r.combine === "sum") ? `<span class="xs muted">${p.scoring === "be" ? "Gesamtsumme (unten)" : "–"}</span>` : `<select class="select sm" data-p="${p.id}|key" ${dis}>${keyOpts(p.key, p.scoring === "fehler" ? ["fehler"] : p.scoring === "pct" ? ["pct"] : ["be"])}</select>`}</td><td>${ro || r.parts.length < 2 ? "" : `<button class="iconbtn" data-rmp="${p.id}" aria-label="Teil löschen">${icon("trash-2")}</button>`}</td></tr>`).join("")}</tbody></table></div>
          ${ro ? "" : `<button class="btn sm mt-s" id="addp">${icon("plus")} Prüfungsteil hinzufügen</button>`}</div>
        <div class="card pad mt"><h3>${icon("list-tree")} Aufgabenbaum</h3><p class="xs muted">Beliebige Tiefe (z. B. A1 → A1.1 → A1.1.1). Bewertet wird an den untersten Teilaufgaben; übergeordnete Aufgaben summieren${r.parts.some((p) => p.scoring === "np") ? " bzw. gewichten" : ""}.</p>
          ${r.parts.filter((p) => p.scoring !== "extern").map((p) => `<div class="ptree"><div class="row between"><b class="small">${esc(p.name)}</b><span class="xs muted">${PX.SCORING_SHORT[p.scoring]}${p.scoring === "be" || p.scoring === "pct" ? " · max. " + PX.partMax(r, p) + " BE" : ""}</span></div>${nodesEd(r, null, p, 0, ro)}${ro ? "" : `<button class="btn sm ghost" data-addtop="${p.id}">${icon("plus")} Aufgabe</button>`}</div>`).join("")}</div>
        <div class="card pad mt"><h3>${icon("shuffle")} Wahlregeln</h3><p class="xs muted">„k aus n“ zwischen Aufgaben derselben Ebene. Schülerwahl legt die Korrektur je Arbeit fest; Lehrerwahl legt die Erstkorrektur einmal je Kursmappe fest (je Prüfung, z. B. Haupt- und Nachtermin getrennt). Verschachtelung ist möglich (z. B. „zwei Wahlaufgaben oder PLA“).</p>
          ${(r.groups || []).length ? `<table class="tbl compact"><thead><tr><th>Bezeichnung</th><th>Optionen</th><th>Anzahl</th><th>Wer wählt?</th><th></th></tr></thead><tbody>${r.groups.map((g) => `<tr><td><input class="input sm" data-g="${g.id}|label" value="${esc(g.label)}" ${dis}></td><td class="small">${g.options.map((id) => esc(r.nodes.find((n) => n.id === id)?.no || "?")).join(", ")}</td><td><input class="input sm num" type="number" min="1" max="${g.options.length}" data-g="${g.id}|pick" value="${g.pick}" ${dis}> <span class="xs muted">aus ${g.options.length}</span></td><td><select class="select sm" data-g="${g.id}|chooser" ${dis}><option value="schueler">Schüler:in</option><option value="lehrer" ${g.chooser === "lehrer" ? "selected" : ""}>Lehrkraft (je Kurs)</option></select></td><td>${ro ? "" : `<button class="iconbtn" data-rmg="${g.id}" aria-label="Wahlregel löschen">${icon("trash-2")}</button>`}</td></tr>`).join("")}</tbody></table>` : `<p class="small muted">Keine Wahlregeln – alle Aufgaben sind zu bearbeiten.</p>`}
          ${ro ? "" : `<button class="btn sm mt-s" id="addg">${icon("plus")} Wahlregel anlegen</button>`}</div>
        <div class="card pad mt"><h3>${icon("calculator")} Notenberechnung und Rundung</h3><div class="grid2">
          <div class="field"><label class="lbl">Kombination der Teile</label><select class="select" id="rcomb" ${dis}>${opt(PX.COMBINE, r.combine)}</select></div>
          ${r.combine === "sum" ? `<div class="field"><label class="lbl">Notenschlüssel (Gesamtsumme ${PX.maxBE(r)} BE)</label><select class="select" id="rkey" ${dis}>${keyOpts(r.key, ["be"])}</select></div>` : "<div></div>"}
          <div class="field"><label class="lbl">Rundung der Note je Korrektur</label><select class="select" id="rst" ${dis}>${opt(PX.ROUND, r.round?.stage || "round")}</select></div>
          <div class="field"><label class="lbl">Rundung Ø Erst-/Zweitkorrektur</label><select class="select" id="rfi" ${dis}>${opt(PX.ROUND, r.round?.final || "ceil")}</select></div>
          ${hasExt ? `<div class="field"><label class="lbl">Rundung nach Einrechnung nicht korrekturrelevanter Teile</label><select class="select" id="rwe" ${dis}>${opt(PX.ROUND, r.round?.withExtern || "round")}</select></div>` : ""}
          <div class="field"><label class="lbl">Abzug Sprachrichtigkeit / Form (max.)</label><select class="select" id="rabz" ${dis}>${[0, 1, 2].map((v) => `<option value="${v}" ${(r.abzugMax ?? 2) === v ? "selected" : ""}>${v} NP</option>`).join("")}</select></div>
          <div class="field"><label class="checkbox"><input type="checkbox" id="rbonon" ${r.bonus?.on ? "checked" : ""} ${dis || (r.combine !== "sum" ? "disabled" : "")}> Zusatz-BE für besonders gute Lösungen freischalten</label>${r.bonus?.on ? `<div class="row mt-s"><label class="small" for="rbon">bis zu</label><input class="input sm num" style="width:80px" type="number" min="1" id="rbon" value="${r.bonus?.max || 0}" ${dis}><span class="small">BE (zusätzlich zum Abzug für Sprachrichtigkeit/Form)</span></div>` : `<div class="xs muted">${r.combine === "sum" ? "Standard: nicht freigeschaltet" : "nur bei BE-Summe möglich"}</div>`}</div>
          ${r.combine === "sum" ? `<div class="field"><label class="checkbox mt"><input type="checkbox" id="rhalf" ${r.beHalf ? "checked" : ""} ${dis}> halbe BE bei Teilaufgaben, Summe aufrunden</label></div>` : ""}</div>
          <h4 class="mt">Kappungen</h4>${(r.caps || []).map((cp, i) => `<div class="small row">${icon("triangle-alert")} ${esc(cp.label)} ${ro ? "" : `<button class="link xs" data-rmcap="${i}">entfernen</button>`}</div>`).join("") || `<p class="xs muted">keine</p>`}
          ${ro ? "" : `<button class="btn sm mt-s" id="addcap">${icon("plus")} Kappung anlegen</button>`}</div>
      </div><div>
        <div class="card pad"><h3>${icon("clipboard-check")} Prüfung</h3>${issueList(iss)}</div>
        <div class="card pad mt sticky-test"><div class="row between"><h3>${icon("calculator")} Testrechnung</h3><button class="link xs" id="treset">zurücksetzen</button></div><p class="xs muted">Werte eintragen und Notenpunkte prüfen – wird nicht gespeichert.</p>
          <div class="scoring" id="tscore">${PX.scoringHtml(r, T.c, T.km, { edit: true, lehrerEdit: true, ekView: true, extEdit: true, m: T.m, markCount: 0 })}</div>
          ${hasExt ? `<div class="small mt-s">Endnote inkl. nicht korrekturrelevanter Teile (bei gleicher EK/ZK): <b>${(() => { const ev = PX.evaluate(r, T.c, T.km, T.m); if (ev.np == null) return "–"; const f = PX.finalNP({ corr: { ek: { np: ev.np }, zk: { np: ev.np } }, extern: T.m.extern }, r); return f?.np != null ? PX.fmtNP(f.np) + " NP" : "Teil fehlt"; })()}</b></div>` : ""}</div>
        <div class="card pad mt"><h3>${icon("notebook-pen")} Gutachten</h3><label class="row mt-s"><span class="toggle"><input type="checkbox" id="gon" ${G.on ? "checked" : ""} ${dis}><span></span></span>${G.on ? "aktiviert" : "deaktiviert"}</label>
          ${G.on ? `<label class="checkbox mt-s"><input type="checkbox" id="greq" ${G.required ? "checked" : ""} ${dis}> Pflicht für den Abschluss einer Mappe</label>
          <div class="field mt-s"><label class="lbl">Gliederung (ein Punkt je Zeile, z. B. je Arbeitsauftrag)</label><textarea class="input" id="gsecs" rows="${Math.max(2, G.sections.length)}" ${dis}>${esc((G.sections || []).join("\n"))}</textarea></div>
          <h4>Textbausteine <span class="xs muted">landesweit einheitlich</span></h4>
          <div class="bst-ed">${(G.bausteine || []).map((b, i) => `<div class="row"><input class="input sm" style="width:130px" data-bk="${i}|cat" value="${esc(b.cat)}" ${dis}><input class="input sm grow" data-bk="${i}|text" value="${esc(b.text)}" ${dis}>${ro ? "" : `<button class="iconbtn sm" data-rmb="${i}">${icon("trash-2")}</button>`}</div>`).join("")}</div>
          ${ro ? "" : `<button class="btn sm mt-s" id="addb">${icon("plus")} Baustein</button>`}
          <p class="xs muted mt-s">Sichtbarkeit: Das Gutachten der Erstkorrektur ist für die Zweitkorrektur nicht sichtbar; die Endbeurteilung sieht beide.</p>` : ""}</div>
        <div class="card pad mt"><h3>${icon("file-up")} Formblatt (PDF)</h3><label class="row mt-s"><span class="toggle"><input type="checkbox" id="fpdf" ${r.formPdf ? "checked" : ""} ${dis}><span></span></span>${r.formPdf ? "Upload des ausgefüllten Formblatts erforderlich" : "nicht erforderlich"}</label><p class="xs muted">z. B. Gestaltungs- und Medientechnik: Das ausgefüllte Formblatt wird je Korrektur hochgeladen; die Bewertung ist zusätzlich im Raster abgebildet.</p></div>
      </div></div>`;
  }, mount: (root) => {
    const r = PX.byId("rasters", m[1]); if (!r) return;
    const T = testOf(r);
    const ts = $("#tscore", root); if (ts) PX.bindScoring(ts, r, T.c, T.km, () => PX.rerender(), { m: T.m });
    $("#treset", root).onclick = () => { delete TEST[r.id]; PX.rerender(); };
    if (r.status === "freigegeben") return;
    const ch = () => { PX.save(); PX.rerender(); };
    const on = (id, fn) => { const x = $(id, root); if (x) x.onchange = (e) => { fn(e.target); ch(); }; };
    on("#rn", (x) => (r.name = x.value)); on("#rsub", (x) => { r.subject = x.value; r.form = PX.schulform(x.value); }); on("#ry", (x) => (r.year = +x.value));
    on("#rcomb", (x) => { r.combine = x.value; if (x.value === "weighted" && PX.sum(r.parts.map((p) => +p.weight || 0)) === 0) r.parts.forEach((p) => (p.weight = Math.round(100 / r.parts.length))); });
    on("#rkey", (x) => (r.key = x.value)); r.round = r.round || {};
    on("#rst", (x) => (r.round.stage = x.value)); on("#rfi", (x) => (r.round.final = x.value)); on("#rwe", (x) => (r.round.withExtern = x.value));
    on("#rabz", (x) => (r.abzugMax = +x.value)); on("#rbon", (x) => (r.bonus = { ...(r.bonus || {}), max: Math.max(0, +x.value || 0) })); on("#rbonon", (x) => (r.bonus = { on: x.checked, max: r.bonus?.max || (x.checked ? 5 : 0) })); on("#rhalf", (x) => (r.beHalf = x.checked));
    $$("[data-p]", root).forEach((i) => (i.onchange = () => { const [id, f] = i.dataset.p.split("|"); const p = r.parts.find((x) => x.id === id); p[f] = f === "weight" ? +i.value : i.value; ch(); }));
    $$("[data-rmp]", root).forEach((b) => (b.onclick = async () => { const p = r.parts.find((x) => x.id === b.dataset.rmp); if (!(await PX.confirm("Prüfungsteil löschen?", `„${esc(p.name)}“ mit allen Aufgaben wird entfernt.`, "Löschen", true))) return; const ids = new Set(r.nodes.filter((n) => n.part === p.id).map((n) => n.id)); r.nodes = r.nodes.filter((n) => !ids.has(n.id)); r.groups = r.groups.filter((g) => !g.options.some((o) => ids.has(o))); r.parts = r.parts.filter((x) => x !== p); ch(); }));
    const ap = $("#addp", root); if (ap) ap.onclick = () => { const id = "p" + Date.now().toString(36); r.parts.push({ id, name: "Teil " + (r.parts.length + 1), scoring: "be", weight: 0 }); r.nodes.push({ id: PX.uid("n-"), part: id, parent: null, no: "1", title: "", be: 10 }); ch(); };
    $$("[data-n]", root).forEach((i) => (i.onchange = () => { const [id, f] = i.dataset.n.split("|"); const n = r.nodes.find((x) => x.id === id); n[f] = f === "pflicht" ? i.checked : f === "be" || f === "weight" ? (i.value === "" ? null : +i.value) : i.value; ch(); }));
    $$("[data-addtop]", root).forEach((b) => (b.onclick = () => { const p = b.dataset.addtop; const tops = PX.kids(r, null, p); r.nodes.push({ id: PX.uid("n-"), part: p, parent: null, no: String(tops.length + 1), title: "", be: PX.partOf(r, { part: p })?.scoring === "be" ? 10 : null }); ch(); }));
    $$("[data-addsub]", root).forEach((b) => (b.onclick = () => { const n = r.nodes.find((x) => x.id === b.dataset.addsub); const k = PX.kids(r, n.id); const be = PX.isLeaf(r, n) ? n.be : null; r.nodes.splice(r.nodes.indexOf(n) + 1 + k.length, 0, { id: PX.uid("n-"), part: n.part, parent: n.id, no: `${n.no}.${k.length + 1}`, title: "", be: be ?? (PX.partOf(r, n).scoring === "be" ? 5 : null) }); n.be = null; ch(); }));
    $$("[data-rmn]", root).forEach((b) => (b.onclick = () => { const del = new Set([b.dataset.rmn]); let grow = true; while (grow) { grow = false; r.nodes.forEach((n) => { if (n.parent && del.has(n.parent) && !del.has(n.id)) { del.add(n.id); grow = true; } }); } r.nodes = r.nodes.filter((n) => !del.has(n.id)); r.groups.forEach((g) => (g.options = g.options.filter((o) => !del.has(o)))); r.groups = r.groups.filter((g) => g.options.length); ch(); }));
    $$("[data-g]", root).forEach((i) => (i.onchange = () => { const [id, f] = i.dataset.g.split("|"); const g = r.groups.find((x) => x.id === id); g[f] = f === "pick" ? Math.max(1, Math.min(g.options.length, +i.value || 1)) : i.value; ch(); }));
    $$("[data-rmg]", root).forEach((b) => (b.onclick = () => { r.groups = r.groups.filter((g) => g.id !== b.dataset.rmg); ch(); }));
    const ag = $("#addg", root); if (ag) ag.onclick = () => {
      // Elternebene wählen, dann Optionen derselben Ebene
      const levels = [...r.parts.filter((p) => p.scoring !== "extern").map((p) => ({ key: "P|" + p.id, label: p.name + " – oberste Ebene", kids: PX.kids(r, null, p.id) })), ...r.nodes.filter((n) => !PX.isLeaf(r, n)).map((n) => ({ key: "N|" + n.id, label: `${n.no} ${n.title || ""} – Teilaufgaben`, kids: PX.kids(r, n.id) }))].filter((l) => l.kids.filter((k) => !PX.groupOfNode(r, k.id)).length >= 2);
      if (!levels.length) return PX.toast("Keine Ebene verfügbar", "Es gibt keine Ebene mit mindestens zwei Aufgaben ohne Wahlregel.", "info");
      PX.modal({ title: "Wahlregel anlegen", icon: "shuffle", body: `<div class="field"><label class="lbl">Ebene</label><select class="select" id="glev">${levels.map((l, i) => `<option value="${i}">${esc(l.label)}</option>`).join("")}</select></div><div id="gopts"></div><div class="grid2"><div class="field"><label class="lbl">Anzahl zu bearbeiten</label><input class="input" id="gpick" type="number" min="1" value="1"></div><div class="field"><label class="lbl">Wer wählt?</label><select class="select" id="gch"><option value="schueler">Schüler:in (je Arbeit)</option><option value="lehrer">Lehrkraft (je Kurs)</option></select></div></div>`,
        foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Anlegen</button>`,
        onMount: (md, close) => { const fill = () => { const l = levels[+$("#glev", md).value]; $("#gopts", md).innerHTML = `<label class="lbl">Optionen</label><div class="checkgrid">${l.kids.filter((k) => !PX.groupOfNode(r, k.id)).map((k) => `<label class="checkbox"><input type="checkbox" data-go="${k.id}" checked> ${esc(k.no)} ${esc(k.title || "")}</label>`).join("")}</div>`; }; fill(); $("#glev", md).onchange = fill;
          $("[data-ok]", md).onclick = () => { const o = $$("[data-go]:checked", md).map((x) => x.dataset.go); if (o.length < 2) return PX.toast("Mindestens zwei Optionen", "", "warn"); const pick = Math.max(1, Math.min(o.length - 1, +$("#gpick", md).value || 1)); const ch2 = $("#gch", md).value; r.groups.push({ id: PX.uid("g-"), label: `${pick} aus ${o.length}: ${o.map((id) => r.nodes.find((n) => n.id === id)?.no).join(", ")}`, options: o, pick, chooser: ch2 }); close(); ch(); }; } });
    };
    const ac = $("#addcap", root); if (ac) ac.onclick = () => { const p = r.parts.find((x) => x.scoring === "np") || r.parts[0]; const tops = PX.kids(r, null, p.id); PX.modal({ title: "Kappung anlegen", icon: "triangle-alert", body: `<p class="small">Wenn eine der gewählten Teilnoten unter dem Schwellenwert liegt, ist die Note des Prüfungsteils „${esc(p.name)}“ begrenzt.</p><div class="checkgrid">${tops.map((n) => `<label class="checkbox"><input type="checkbox" data-cn="${n.id}"> ${esc(n.no)} ${esc(n.title || "")}</label>`).join("")}</div><div class="grid2"><div class="field"><label class="lbl">wenn unter (NP)</label><input class="input" id="cb" type="number" value="1"></div><div class="field"><label class="lbl">dann höchstens (NP)</label><input class="input" id="cm" type="number" value="3"></div></div>`, foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Anlegen</button>`, onMount: (md, close) => { $("[data-ok]", md).onclick = () => { const ns = $$("[data-cn]:checked", md).map((x) => x.dataset.cn); if (!ns.length) return; const below = +$("#cb", md).value, max = +$("#cm", md).value; r.caps = r.caps || []; r.caps.push({ part: p.id, nodes: ns, below, max, label: `${ns.map((id) => r.nodes.find((n) => n.id === id)?.no).join(" oder ")} unter ${below} NP → ${p.name} höchstens ${max} NP` }); close(); ch(); }; } }); };
    $$("[data-rmcap]", root).forEach((b) => (b.onclick = () => { r.caps.splice(+b.dataset.rmcap, 1); ch(); }));
    const G = r.gutachten;
    on("#gon", (x) => (G.on = x.checked)); on("#greq", (x) => (G.required = x.checked)); on("#gsecs", (x) => (G.sections = x.value.split("\n").map((s) => s.trim()).filter(Boolean))); on("#fpdf", (x) => (r.formPdf = x.checked));
    $$("[data-bk]", root).forEach((i) => (i.onchange = () => { const [ix, f] = i.dataset.bk.split("|"); G.bausteine[+ix][f] = i.value; PX.save(); }));
    $$("[data-rmb]", root).forEach((b) => (b.onclick = () => { G.bausteine.splice(+b.dataset.rmb, 1); ch(); }));
    const ab = $("#addb", root); if (ab) ab.onclick = () => { G.bausteine = G.bausteine || []; G.bausteine.push({ id: PX.uid("b"), cat: "allgemein", text: "" }); ch(); };
    $("#rel", root).onclick = async () => {
      const errs = PX.rasterIssues(r).filter((x) => x.level === "error");
      if (errs.length) return PX.toast("Freigabe nicht möglich", errs.map((x) => x.text).join(" · "), "warn");
      if (await PX.confirm("Bewertungsraster freigeben?", "Das Raster gilt danach als vollständig und kann Prüfungen zugeordnet werden.", "Freigeben")) { O().releaseRaster(r.id); PX.commit(); PX.toast("Bewertungsraster freigegeben", esc(r.name)); if (PX.q().back === "wiz") PX.go("#/ibbw/pruefung/neu"); }
    };
  } }));

  // ---------- Regeln, Notenschlüssel, Skalen ----------
  const KIND = { rundung: "Rundungsregel", gesamtnote: "Regel zur Ermittlung der Gesamtnote" };
  PX.route(/^ibbw\/regeln$/, () => ({ title: "Regeln", shell: "staff", need, render: () => `${PX.pagehead("Regeln verwalten", "Notenschlüssel und Skalen, Rundungsregeln, Regeln zur Gesamtnote", `<button class="btn primary" id="addrule">${icon("plus")} Regel anlegen</button>`)}
    <h2 class="mt">Notenschlüssel und Skalen</h2><p class="xs muted">Werden im Bewertungsraster der Gesamtsumme oder einzelnen Prüfungsteilen zugeordnet. Fehler-Noten-Skalen (Alte Sprachen) werden je Prüfung beigegeben.</p>
    <div class="tablewrap"><table class="tbl"><tbody>${Object.entries(PX.KEYS).map(([id, k]) => `<tr><td style="width:240px"><b>${esc(k.name)}</b><div class="xs muted">${k.kind === "be" ? "BE → NP" : k.kind === "pct" ? "Prozent → NP" : "Fehlerzahl → NP"} · verwendet in ${PX.S.rasters.filter((r) => r.key === id || r.parts.some((p) => p.key === id)).length} Raster(n)</div></td><td>${PX.keyTable(id)}</td></tr>`).join("")}</tbody></table></div>
    <h2 class="mt">Rundungsarten</h2><div class="tablewrap"><table class="tbl compact"><tbody>${Object.entries(PX.ROUND).map(([k, v]) => `<tr><td><b>${esc(v)}</b></td><td class="small">${PX.S.rasters.filter((r) => r.round && Object.values(r.round).includes(k)).map((r) => esc(PX.subj(r.subject)?.short)).filter((x, i, a) => a.indexOf(x) === i).join(", ") || "–"}</td></tr>`).join("")}</tbody></table></div><p class="xs muted mt-s">Die Rundung ist je Fach unterschiedlich und wird im Bewertungsraster festgelegt (je Korrektur, Ø Erst-/Zweitkorrektur, nach Einrechnung nicht korrekturrelevanter Teile).</p>
    ${Object.entries(KIND).map(([k, l]) => `<h2 class="mt">${esc(l)}</h2><div class="tablewrap"><table class="tbl"><tbody>${PX.S.rules.filter((x) => x.kind === k).map((x) => `<tr><td><b>${esc(x.name)}</b><div class="xs muted">${esc(x.note || "")}</div></td><td class="small">${esc(x.def)}</td><td class="nowrap"><button class="iconbtn" data-delr="${x.id}" aria-label="Löschen">${icon("trash-2")}</button></td></tr>`).join("") || `<tr><td class="muted">Keine Regeln</td></tr>`}</tbody></table></div>`).join("")}`,
  mount: (r) => {
    $("#addrule", r).onclick = () => PX.modal({ title: "Regel anlegen", icon: "sigma", body: `<div class="field"><label class="lbl">Art der Regel *</label><select class="select" id="rk">${Object.entries(KIND).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></div><div class="field"><label class="lbl">Bezeichnung *</label><input class="input" id="rnm"></div><div class="field"><label class="lbl">Definition</label><input class="input" id="rdef" placeholder="z. B. ceil · eb_or_avg"></div>`,
      foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Speichern</button>`, onMount: (m, close) => { $("[data-ok]", m).onclick = () => { const n = $("#rnm", m).value.trim(); if (!n) return; const k = $("#rk", m).value; PX.S.rules.push({ id: PX.uid("r-"), kind: k, name: n, def: $("#rdef", m).value || "–", note: "neu angelegt" }); PX.audit("Regel angelegt", n, KIND[k]); close(); PX.commit(); }; } });
    $$("[data-delr]", r).forEach((b) => (b.onclick = async () => { const x = PX.byId("rules", b.dataset.delr); if (await PX.confirm("Regel löschen?", esc(x.name), "Löschen", true)) { PX.S.rules = PX.S.rules.filter((y) => y !== x); PX.audit("Regel gelöscht", x.name); PX.commit(); } }));
  } }));

  // ---------- Korrekturzeichen ----------
  let zf = "";
  PX.route(/^ibbw\/zeichen$/, () => ({ title: "Korrekturzeichen", shell: "staff", need, render: () => {
    const list = PX.S.signs.filter((z) => !zf || z.subjects.includes(zf));
    return `${PX.pagehead("Korrekturzeichensatz verwalten", "Zeichen aus dem einheitlichen Zeichensatz, Bedeutung, Gewicht, Zuordnung zu Prüfungsfächern", `<button class="btn primary" id="addz">${icon("plus")} Korrekturzeichen anlegen</button>`)}
      <div class="filterbar"><select class="select" id="zf"><option value="">Alle Prüfungsfächer</option>${PX.S.subjects.map((s) => `<option value="${s.id}" ${zf === s.id ? "selected" : ""}>${esc(s.name)} (${esc(s.form)})</option>`).join("")}</select></div>
      <div class="tablewrap"><table class="tbl"><thead><tr><th>Zeichen</th><th>Bedeutung</th><th>Kategorie</th><th>Fehlergewicht</th><th>Prüfungsfächer</th><th></th></tr></thead><tbody>
      ${list.map((z) => `<tr><td><span class="sign static">${esc(z.code)}</span></td><td>${esc(z.meaning)}</td><td class="small">${esc(z.cat)}</td><td class="small">${z.count ? "Anzahl je Markierung" : z.weight != null ? PX.fmtNP(z.weight) + " Fehler" : "–"}</td><td class="small">${z.subjects.map((s) => esc(PX.subj(s)?.short)).join(", ")}</td><td class="nowrap"><button class="btn sm" data-ez="${z.id}">Bearbeiten</button> <button class="iconbtn" data-dz="${z.id}" aria-label="Löschen">${icon("trash-2")}</button></td></tr>`).join("")}</tbody></table></div>`;
  }, mount: (r) => {
    $("#zf", r).onchange = (e) => { zf = e.target.value; PX.rerender(); };
    const cats = [...new Set(PX.S.signs.map((z) => z.cat))];
    const dlg = (z) => PX.modal({ title: z ? "Korrekturzeichen bearbeiten" : "Korrekturzeichen anlegen", icon: "pen-line", body: `<div class="grid2"><div class="field"><label class="lbl">Zeichen (aus dem Zeichensatz) *</label><input class="input" id="zc" maxlength="6" value="${esc(z?.code || "")}"></div><div class="field"><label class="lbl">Kategorie</label><select class="select" id="zk">${cats.map((c) => `<option ${z?.cat === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div></div>
      <div class="field"><label class="lbl">Bedeutung *</label><input class="input" id="zm" value="${esc(z?.meaning || "")}"></div>
      <div class="grid2"><div class="field"><label class="lbl">Fehlergewicht (optional)</label><input class="input" id="zw" type="number" step="0.25" min="0" value="${z?.weight ?? ""}" placeholder="z. B. 0,5"><div class="xs muted">für Fächer mit Fehlerzahl (z. B. Alte Sprachen)</div></div><div class="field"><label class="checkbox mt"><input type="checkbox" id="zn" ${z?.count ? "checked" : ""}> Anzahl beim Setzen abfragen (z. B. Lücke)</label></div></div>
      <label class="lbl">Prüfungsfächer *</label><div class="checkgrid">${PX.S.subjects.map((s) => `<label class="checkbox"><input type="checkbox" data-zs="${s.id}" ${z?.subjects.includes(s.id) ? "checked" : ""}> ${esc(s.name)} <span class="xs muted">${esc(s.form)}</span></label>`).join("")}</div>
      ${z ? `<div class="notice warn mt">${icon("triangle-alert")}<div class="small">Änderungen wirken sich sofort auf alle Prüfungen aus, in denen das Zeichen eingesetzt wird.</div></div>` : ""}`,
      foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Speichern</button>`,
      onMount: (m, close) => { $("[data-ok]", m).onclick = async () => { const wv = $("#zw", m).value; const v = { code: $("#zc", m).value.trim(), meaning: $("#zm", m).value.trim(), cat: $("#zk", m).value, subjects: $$("[data-zs]:checked", m).map((c) => c.dataset.zs), weight: wv === "" ? undefined : +wv, count: $("#zn", m).checked || undefined }; if (!v.code || !v.meaning || !v.subjects.length) return PX.toast("Pflichtangaben fehlen", "Zeichen, Bedeutung und mindestens ein Prüfungsfach", "warn"); if (z && !(await PX.confirm("Änderung übernehmen?", "Die Änderung wirkt sich auf künftige Korrekturen aus.", "Übernehmen"))) return; if (z) Object.assign(z, v); else { const nz = { id: PX.uid("z-"), ...v }; PX.S.signs.push(nz); PX.S.exams.filter((e) => v.subjects.includes(e.subject) && PX.S.now < e.date).forEach((e) => e.signset.push(nz.id)); } PX.audit(z ? "Korrekturzeichen bearbeitet" : "Korrekturzeichen angelegt", v.code, v.meaning); close(); PX.commit(); }; } });
    $("#addz", r).onclick = () => dlg(null);
    $$("[data-ez]", r).forEach((b) => (b.onclick = () => dlg(PX.byId("signs", b.dataset.ez))));
    $$("[data-dz]", r).forEach((b) => (b.onclick = async () => { const z = PX.byId("signs", b.dataset.dz); const used = PX.S.mappen.some((mm) => Object.values(mm.corr).some((c) => c.state === "in_bearbeitung" && c.marks.some((k) => k.sign === z.id))); if (used) return PX.toast("Löschen nicht möglich", "Das Zeichen wird in einer laufenden Korrektur verwendet.", "warn"); if (await PX.confirm("Korrekturzeichen löschen?", `„${esc(z.code)}“ (${esc(z.meaning)}) wird unwiderruflich gelöscht.`, "Löschen", true)) { PX.S.signs = PX.S.signs.filter((x) => x !== z); PX.audit("Korrekturzeichen gelöscht", z.code); PX.commit(); } }));
  } }));

  // ---------- Korrekturrichtlinien ----------
  PX.route(/^ibbw\/richtlinien$/, () => ({ title: "Korrekturrichtlinien", shell: "staff", need, render: () => `${PX.pagehead("Korrekturrichtlinien verwalten", "PDF-Dokumente, die Prüfungen zugeordnet werden können", `<button class="btn primary" id="addg">${icon("plus")} Korrekturrichtlinie anlegen</button>`)}
    <div class="tablewrap"><table class="tbl"><thead><tr><th>Name</th><th>Dokument</th><th>Verwendet in</th><th></th></tr></thead><tbody>${PX.S.guidelines.map((g) => `<tr><td><b>${esc(g.name)}</b></td><td><span class="doclink">${icon("file-text")} ${esc(g.file)}</span><div class="xs muted">${PX.fmtD(g.date)}</div></td><td class="small">${PX.S.exams.filter((e) => e.guideline === g.id).map((e) => esc(PX.examShort(e))).join(", ") || "–"}</td><td class="nowrap"><button class="btn sm" data-rn="${g.id}">Umbenennen</button> <button class="iconbtn" data-dg="${g.id}" aria-label="Löschen">${icon("trash-2")}</button></td></tr>`).join("")}</tbody></table></div>`,
  mount: (r) => {
    $("#addg", r).onclick = () => PX.modal({ title: "Korrekturrichtlinie anlegen", icon: "book-text", body: `<div class="field"><label class="lbl">Name (eindeutig) *</label><input class="input" id="gn"></div><div class="field"><label class="lbl">PDF-Dokument *</label><input type="file" accept="application/pdf" class="input" id="gf"></div>`, foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Speichern</button>`,
      onMount: (m, close) => { $("[data-ok]", m).onclick = () => { const n = $("#gn", m).value.trim(); const f = $("#gf", m).files[0]; if (!n) return PX.toast("Name fehlt", "", "warn"); if (PX.S.guidelines.some((g) => g.name === n)) return PX.toast("Name bereits vergeben", "", "warn"); if (f && !/\.pdf$/i.test(f.name)) return PX.toast("Kein PDF", "", "error"); PX.S.guidelines.push({ id: PX.uid("kr-"), name: n, file: f ? f.name : n.replace(/\s+/g, "_") + ".pdf", date: PX.S.now }); PX.audit("Korrekturrichtlinie angelegt", n); close(); PX.commit(); }; } });
    $$("[data-rn]", r).forEach((b) => (b.onclick = () => { const g = PX.byId("guidelines", b.dataset.rn); PX.modal({ title: "Umbenennen", body: `<input class="input" id="gn" value="${esc(g.name)}">`, foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Speichern</button>`, onMount: (m, close) => { $("[data-ok]", m).onclick = () => { const n = $("#gn", m).value.trim(); if (PX.S.guidelines.some((x) => x !== g && x.name === n)) return PX.toast("Name bereits vergeben", "", "warn"); PX.audit("Korrekturrichtlinie umbenannt", g.name, "→ " + n); g.name = n; close(); PX.commit(); }; } }); }));
    $$("[data-dg]", r).forEach((b) => (b.onclick = async () => { const g = PX.byId("guidelines", b.dataset.dg); if (await PX.confirm("Korrekturrichtlinie löschen?", `„${esc(g.name)}“ wird unwiderruflich gelöscht.`, "Löschen", true)) { PX.S.guidelines = PX.S.guidelines.filter((x) => x !== g); PX.S.exams.forEach((e) => { if (e.guideline === g.id) e.guideline = ""; }); PX.audit("Korrekturrichtlinie gelöscht", g.name); PX.commit(); } }));
  } }));})();
