/* PASCA Klickdummy – Rolle Lehrkraft: Erstkorrektur, Zweitkorrektur, Endbeurteilung */
(function () {
  "use strict";
  const PX = window.PX; const { esc, icon, $, $$ } = PX; const O = () => PX.ops;
  const need = ["lk"];
  const me = () => PX.me();
  const kmTitle = (km, stage) => (stage === "ek" ? `${km.name} · ${PX.orgShort(km.school)}` : `Kursmappe ${km.id.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase()} (anonymisiert)`);
  const mTitle = (m, stage) => (stage === "ek" ? `${m.last}, ${m.first}` : PX.pseudo(m));
  const stageEnd = (ex, st) => (st === "ek" ? ex.ekEnd : st === "zk" ? ex.zkEnd : ex.ebEnd);
  const relevant = (km, st) => (st === "eb" ? PX.activeMappen(km).filter((m) => m.ebRequired) : PX.activeMappen(km));

  // ---------- Meine Korrekturen ----------
  PX.route(/^korr$/, () => ({ title: "Meine Korrekturen", shell: "staff", need, render: () => {
    const p = me(); const as = PX.assignments(p.id);
    const notes = PX.S.notes.filter((n) => n.to === p.id).slice(0, 5);
    const card = ({ km, stage }) => {
      const ex = PX.exam(km.exam); const open = PX.stageOpen(km, stage); const ss = PX.stageState(km, stage); const rel = relevant(km, stage);
      const fin = rel.filter((m) => m.corr[stage]?.state === "fertig").length; const end = stageEnd(ex, stage); const left = PX.daysBetween(PX.S.now, end);
      const status = ss.lkDone ? (ss.sltOk ? ["abgeschlossen", "dark"] : ["Abschluss bestätigt – Schulleitung prüft", "green"]) : open ? [fin ? "in Bearbeitung" : "bereit", fin ? "yellowb" : "cyan"] : stage === "eb" && km.stages.zk.sltOk ? ["ab " + PX.fmtD(ex.ebStart), "gray"] : ["noch nicht freigegeben", "gray"];
      return `<div class="kcard ${PX.stageColor[stage]} ${open && !ss.lkDone ? "" : "muted-card"}"><div class="row between"><span class="badge ${PX.stageColor[stage]}">${PX.STAGE[stage]}</span>${PX.badge(status[0], status[1])}</div>
        <h3>${esc(kmTitle(km, stage))}</h3><div class="small muted">${esc(PX.examLabel(ex))}</div>
        <div class="row mt-s" style="gap:16px"><span class="small">${icon("files")} ${stage === "eb" ? `${rel.length} Pflichtmappe(n) von ${PX.activeMappen(km).length}` : `${PX.activeMappen(km).length} Mappen`}</span><span class="small ${open && !ss.lkDone && left <= 2 ? "warntext" : ""}">${icon("clock")} Frist ${PX.fmtD(end)}</span></div>
        ${open ? `<div class="mt-s">${PX.progress(fin, rel.length)} <span class="xs">${fin}/${rel.length} korrigiert</span></div>` : ""}
        <div class="mt"><a class="btn ${open && !ss.lkDone ? "primary" : ""} sm" href="#/korr/km/${km.id}/${stage}" ${open || ss.lkDone ? "" : 'aria-disabled="true"'}>${icon("folder-open")} ${open ? "Kursmappe öffnen" : "Details"}</a></div></div>`;
    };
    return `${PX.pagehead("Meine Korrekturen", `${esc(PX.name(p))} · ${esc(PX.orgName(p.org))}`)}
      ${as.length ? ["ek", "zk", "eb"].map((st) => { const l = as.filter((a) => a.stage === st); return l.length ? `<h2 class="mt">${PX.STAGE[st]}</h2><div class="kgrid2">${l.map(card).join("")}</div>` : ""; }).join("") : PX.empty("Ihnen sind derzeit keine Korrekturen zugewiesen. Die Zuweisung erfolgt über die Korrekturgruppen und die Bestätigung Ihrer Schulleitung.", "notebook-pen")}
      ${notes.length ? `<h2 class="mt-l">Benachrichtigungen</h2><div class="card">${notes.map((n) => `<div class="noterow ${n.read ? "" : "unread"}">${icon("bell")}<div><div>${esc(n.text)}</div><div class="xs muted">${esc(n.at)}</div></div></div>`).join("")}</div>` : ""}`;
  } }));

  // ---------- Kursmappe (Korrektor) ----------
  PX.route(/^korr\/km\/([^/]+)\/(ek|zk|eb)$/, (mm) => ({ title: "Kursmappe", shell: "staff", need, render: () => {
    const km = PX.km(mm[1]); const st = mm[2]; if (!km) return PX.empty("Nicht gefunden");
    if (!PX.assignments(me().id).some((a) => a.km.id === km.id && a.stage === st)) return `<div class="notice warn">${icon("lock")}<div>Diese Kursmappe ist Ihnen nicht zugewiesen.</div></div>`;
    const ex = PX.exam(km.exam); const r = PX.raster(ex); const open = PX.stageOpen(km, st); const ss = PX.stageState(km, st);
    const list = PX.activeMappen(km); const rel = relevant(km, st);
    const allDone = rel.every((m) => m.corr[st]?.state === "fertig");
    const mine = ss.lkDone && ss.lkDone;
    const iDone = km.stages[st].lkDone.includes(me().id);
    const g = PX.groupOf(km);
    const anon = st !== "ek";
    return `${PX.pagehead(kmTitle(km, st), `${esc(PX.examLabel(ex))} · ${PX.STAGE[st]} · Frist ${PX.fmtD(stageEnd(ex, st))}`, `<a class="btn" href="#/korr">${icon("arrow-left")} Meine Korrekturen</a>`)}
      ${!open ? `<div class="notice ${st === "eb" && km.stages.zk.sltOk ? "warn" : "info"}">${icon("lock")}<div>${st === "eb" && km.stages.zk.sltOk ? `<b>Die Endbeurteilung ist erst ab ${PX.fmtDW(ex.ebStart)} möglich.</b><br><span class="small">So beginnt die Endbeurteilung landesweit gleichzeitig, nachdem alle Zweitkorrekturen abgeschlossen sind. Stellen Sie die Demo-Zeit oben rechts auf „Beginn Endbeurteilung“.</span>` : "Die Unterlagen sind für diese Korrekturstufe noch nicht freigegeben."}</div></div>` : ""}
      <div class="grid3"><div class="card pad"><h3>${icon("book-text")} Bewertungsgrundlagen</h3>${PX.examPassed(ex) ? `<button class="doclink" data-ewh>${icon("file-text")} Erwartungshorizont${ex.ewh ? "" : " (noch nicht hochgeladen)"}</button><button class="doclink" data-raster>${icon("table")} Bewertungsraster</button>${ex.guideline ? `<button class="doclink" data-kr>${icon("book-text")} ${esc(PX.byId("guidelines", ex.guideline).name)}</button>` : ""}<div class="signs mini mt-s">${PX.signsFor(ex.subject).map((z) => `<span class="sign static" title="${esc(z.meaning)}">${esc(z.code)}</span>`).join("")}</div>` : `<p class="small muted">${icon("eye-off")} Sichtbar nach Ende der Prüfungszeit.</p>`}</div>
        <div class="card pad"><h3>${icon("info")} Ablauf</h3><p class="small">${st === "ek" ? "Unterlagen sichten (Vollständigkeit, Lesbarkeit), korrigieren, Raster ausfüllen, personenbezogene Daten schwärzen. Mehrere Erstkorrektor:innen können parallel verschiedene Mappen bearbeiten." : st === "zk" ? `Anonymisierte Ansicht: Kopfzeile und Deckblatt sind ausgeblendet. Korrekturzeichen der Erstkorrektur sind sichtbar; wie viele eigene Zeichen Sie setzen, entscheiden Sie. Punkte und Gutachten der Erstkorrektur sind nicht sichtbar. Hinweise der Erstkorrektur werden angezeigt.` : `Pflichtmappen (Abweichung > 3 NP${PX.examForm(ex) === "AG" ? ", Stichprobe 2 je Kurs" : ""}) sind hervorgehoben. Sie sehen Berichte und Raster der Erst- und Zweitkorrektur und können weitere Mappen freiwillig korrigieren.`}</p></div>
        <div class="card pad"><h3>${icon("clipboard-check")} Abschluss</h3>${iDone ? `<p class="small">${icon("circle-check")} Sie haben den Abschluss am ${PX.fmtD(km.stages[st].at || PX.S.now)} bestätigt.${ss.sltOk ? " Die Schulleitung hat bestätigt." : " Die Schulleitung wurde informiert."}</p>` : `<p class="small">${rel.filter((m) => m.corr[st]?.state === "fertig").length} von ${rel.length} ${st === "eb" ? "Pflichtmappen" : "Mappen"} korrigiert.</p>
          <button class="btn primary" id="confkm" ${open && allDone ? "" : "disabled"}>${icon("check")} Kursmappenabschluss bestätigen</button>${st === "eb" && !rel.length ? `<div class="xs muted mt-s">Keine Pflichtmappe – Abschluss ohne Korrektur möglich.</div>` : ""}`}</div></div>
      ${lwCard(km, r, st)}
      ${open && !iDone ? `<div class="row between mt"><div class="row"><label class="small">Aufgabenweise korrigieren:</label><select class="select sm" id="taskfocus"><option value="">alle Aufgaben</option>${(r ? PX.leaves(r).filter((t) => PX.partOf(r, t).scoring !== "extern") : []).map((t) => `<option value="${t.id}" ${PX.ui.taskFocus === t.id ? "selected" : ""}>${esc(t.no)} ${esc(t.title)}</option>`).join("")}</select></div>
        <button class="btn ghost sm" id="autoall" title="Nur im Klickdummy">${icon("zap")} Demo-Abkürzung: übrige ${st === "eb" ? "Pflicht-" : ""}Mappen automatisch korrigieren</button></div>` : ""}
      <div class="tablewrap mt"><table class="tbl"><thead><tr><th>${anon ? "Mappe" : "Prüfling"}</th>${st === "eb" ? "<th>Endbeurteilung</th><th>EK</th><th>ZK</th>" : ""}<th>Nachteilsausgleich</th><th>Seiten</th><th>Status</th>${st === "ek" || iDone ? "<th>Ergebnis</th>" : ""}<th></th></tr></thead><tbody>
      ${list.map((m) => { const c = m.corr[st]; const lockOther = m.lock && m.lock.pid !== me().id; const req = st === "eb" ? m.ebRequired : true; const stt = c?.state || "offen";
        return `<tr class="${st === "eb" && req ? "hl" : ""} ${st === "eb" && !req ? "dimsoft" : ""}"><td><b>${esc(mTitle(m, st))}</b>${anon ? "" : `<div class="xs muted">${esc(m.nr)}</div>`}</td>
        ${st === "eb" ? `<td>${req === "stichprobe" ? PX.badge("Stichprobe (2 je Kurs)", "brown") : req ? PX.badge("verpflichtend · Abweichung " + PX.fmtNP(m.diff) + " NP", "brown") : PX.badge("freiwillig", "gray")}</td><td>${PX.fmtNP(m.corr.ek?.np)}</td><td>${PX.fmtNP(m.corr.zk?.np)}</td>` : ""}
        <td class="small">${m.nta ? `${icon("scale")} ${esc(m.nta)}` : "–"}</td><td>${PX.pagesOf(m).filter((p) => !anon || p.kind !== "deckblatt").length}</td>
        <td>${lockOther ? PX.badge("gesperrt – " + PX.name(m.lock.pid), "red") : stt === "fertig" ? PX.badge("korrigiert", "green") : stt === "in_bearbeitung" ? PX.badge("in Bearbeitung", "yellowb") : PX.badge("offen", "gray")}</td>
        ${st === "ek" || iDone ? `<td>${c?.np != null ? `<b>${PX.fmtNP(c.np)} NP</b>` : "–"}</td>` : ""}
        <td class="nowrap"><a class="btn sm ${open && stt !== "fertig" && req ? "primary" : ""}" href="#/korr/m/${m.id}/${st}" ${open ? "" : 'aria-disabled="true" tabindex="-1"'}>${icon(stt === "fertig" || !open || iDone ? "eye" : "pen-line")} ${stt === "fertig" || iDone ? "Ansehen" : stt === "in_bearbeitung" ? "Fortsetzen" : "Korrigieren"}</a></td></tr>`; }).join("")}</tbody></table></div>
      ${st === "ek" && PX.mappenOf(km).some((m) => m.absent) ? `<p class="xs muted mt-s">${PX.mappenOf(km).filter((m) => m.absent).map((m) => `${esc(m.first)} ${esc(m.last)}`).join(", ")}: nicht teilgenommen – keine Korrektur vorgesehen.</p>` : ""}
      ${st === "ek" ? `<div class="notice info mt">${icon("scan")}<div class="small">Unterlagen nicht korrigierbar (Seite fehlt, unleserlich)? Fordern Sie einen Nachscan direkt beim Scan-Operator Ihrer Schule an (${esc(PX.scoOf(km.school).map(PX.name).join(", "))}) – diese Anforderung ist nicht systemgestützt.</div></div>` : ""}`;
  }, mount: (r) => {
    const km = PX.km(mm[1]); const st = mm[2]; if (!km) return; const ex = PX.exam(km.exam);
    $$("[data-lw]", r).forEach((sel) => (sel.onchange = () => { const rr = PX.raster(ex); const g = rr.groups.find((x) => x.id === sel.dataset.lw); const vals = $$(`[data-lw="${g.id}"]`, r).map((x) => x.value); O().setLehrerwahl(km.id, g.id, [...new Set(vals)].slice(0, g.pick)); PX.commit(); PX.toast("Lehrerwahl festgelegt", "Gilt für alle Mappen dieser Kursmappe."); }));
    const tf = $("#taskfocus", r); if (tf) tf.onchange = () => { PX.ui.taskFocus = tf.value; };
    const au = $("#autoall", r); if (au) au.onclick = async () => { const todo = relevant(km, st).filter((m) => m.corr[st]?.state !== "fertig" && !(m.lock && m.lock.pid !== me().id)); if (!todo.length) return PX.toast("Nichts zu tun", "", "info"); if (await PX.confirm("Demo-Abkürzung", `${todo.length} Mappe(n) werden mit plausiblen Beispielbewertungen automatisch korrigiert. Diese Funktion gibt es nur im Klickdummy.`, "Automatisch korrigieren")) { todo.forEach((m) => O().autoCorrect(m.id, st, me().id)); PX.commit(); PX.toast("Demo-Korrektur abgeschlossen", `${todo.length} Mappe(n)`); } };
    const cf = $("#confkm", r); if (cf) cf.onclick = async () => { if (await PX.confirm("Kursmappenabschluss bestätigen?", `Alle ${st === "eb" ? "Pflichtmappen" : "digitalen Mappen"} sind vollständig bewertet. Nach Ihrer Bestätigung und der Bestätigung durch die Schulleitung ${st === "ek" ? "beginnt die Zweitkorrektur" : st === "zk" ? "werden Abweichungen berechnet und die Endbeurteilung ausgelöst" : "steht die Endnote fest"}.`, "Abschluss bestätigen")) { O().confirmKM(km.id, st, me().id); km.stages[st].at = PX.S.now; PX.commit(); PX.toast("Abschluss bestätigt", "Die Schulleitung wurde benachrichtigt."); } };
    $$("[data-ewh]", r).forEach((b) => (b.onclick = () => PX.showEWH(ex)));
    $$("[data-raster]", r).forEach((b) => (b.onclick = () => PX.modal({ title: "Bewertungsraster", size: "wide", body: PX.rasterPreview(PX.raster(ex)) })));
    $$("[data-kr]", r).forEach((b) => (b.onclick = () => PX.modal({ title: PX.byId("guidelines", ex.guideline).name, body: `<div class="docpreview"><h3>Korrekturrichtlinie</h3><p>1. Fehler werden mit den Korrekturzeichen des Fachs am Rand markiert (Erstkorrektur rot rechts, Zweitkorrektur grün links, Endbeurteilung braun links).</p><p>2. Schwerwiegende und gehäufte Verstöße gegen die sprachliche Richtigkeit oder die äußere Form führen zu einem Abzug von bis zu zwei Notenpunkten.</p><p>3. Inhaltlich richtige alternative Lösungen sind gleichwertig zu bewerten.</p><p class="xs muted">Simuliertes Dokument (${esc(PX.byId("guidelines", ex.guideline).file)})</p></div>` })));
  } }));

  function lwCard(km, r, st) {
    const gs = (r?.groups || []).filter((g) => g.chooser === "lehrer"); if (!gs.length) return "";
    const locked = st !== "ek" || PX.activeMappen(km).some((x) => x.corr.ek?.state === "fertig") || km.stages.ek.lkDone.length;
    const nm = (id) => r.nodes.find((n) => n.id === id);
    return `<div class="card pad mt"><h3>${icon("users")} Lehrerwahl ${PX.badge(st === "ek" ? "durch die Erstkorrektur je Kursmappe" : "festgelegt durch die Erstkorrektur", "purple")}</h3>
      <div class="row wrap" style="gap:18px">${gs.map((g) => { const ch = PX.choiceOf(r, g, null, km); return `<div class="field"><label class="lbl">${esc(g.label)}</label>${Array.from({ length: g.pick }, (_, i) => `<select class="select sm" data-lw="${g.id}" ${locked ? "disabled" : ""}><option value="">– wählen –</option>${g.options.map((id) => `<option value="${id}" ${ch[i] === id ? "selected" : ""}>${esc(nm(id)?.no)} ${esc(nm(id)?.title || "")}</option>`).join("")}</select>`).join("")}</div>`; }).join("")}</div>
      <div class="xs muted">${st === "ek" ? (locked ? "Festgelegt – Änderungen sind nach Abschluss der ersten Mappe nicht mehr möglich." : "Die gewählten Aufgaben gelten für alle Prüflinge des Kurses. Die Festlegung ist je Prüfung (Haupt-/Nachtermin) getrennt.") : "Für Sie sichtbar, nicht änderbar."}</div></div>`;
  }

  PX.showEWH = function (ex) {
    const r = PX.raster(ex);
    if (!ex.ewh) return PX.toast("Kein Erwartungshorizont", "Für diese Prüfung liegt (noch) kein Erwartungshorizont vor. Eine Korrektur ohne Erwartungshorizont ist zulässig.", "info");
    const tops = r.nodes.filter((n) => !n.parent && PX.partOf(r, n)?.scoring !== "extern");
    PX.modal({ title: "Erwartungshorizont", size: "wide", icon: "file-text", body: `<div class="docpreview"><div class="xs muted">${esc(ex.ewh.file)} · hochgeladen ${PX.fmtD(ex.ewh.date)}</div>${tops.map((t) => `<div class="horizont-row"><div><b>${esc(t.no)} ${esc(t.title)}</b><p class="small">Erwartet wird eine fachlich korrekte, strukturierte Darstellung mit Fachbegriffen; alternative richtige Lösungen sind gleichwertig.</p></div><div><b>${PX.partOf(r, t).scoring === "np" ? "NP" : PX.partOf(r, t).scoring === "fehler" ? "Fehlerzahl" : PX.nodeMax(r, t) + " BE"}</b></div></div>`).join("")}</div>` });
  };

  // ---------- Testkorrektur (jedes Bewertungsraster im Korrekturmodus ausprobieren) ----------
  PX.route(/^korr\/test\/([^/]+)$/, (mm) => ({ title: "Testkorrektur", shell: "staff", need: ["lk", "ibbw"], render: () => {
    const r = PX.byId("rasters", mm[1]); if (!r) return PX.empty("Raster nicht gefunden");
    const km = PX.sandboxFor(r.id); const ex = PX.exam(km.exam); const list = PX.mappenOf(km);
    const cell = (m, st) => { const c = m.corr[st]; return `<td>${c?.state === "fertig" ? `<b>${PX.fmtNP(c.np)} NP</b>` : c?.state === "in_bearbeitung" ? PX.badge("in Bearbeitung", "yellowb") : "–"} <a class="btn sm" href="#/korr/m/${m.id}/${st}">${icon(c?.state === "fertig" ? "eye" : "pen-line")} ${PX.STAGE_SHORT[st]}</a></td>`; };
    return `${PX.pagehead("Testkorrektur: " + r.name, `${esc(PX.subj(r.subject)?.name || "")} · Sandbox – Ergebnisse fließen in kein Verfahren ein`, `<button class="btn" id="sbreset">${icon("rotate-ccw")} Zurücksetzen</button>`)}
      <div class="notice info">${icon("flask-conical")}<div class="small">Die Testkursmappe enthält drei Beispielarbeiten. Probieren Sie Erstkorrektur, Zweitkorrektur (anonymisiert) und Endbeurteilung mit genau diesem Raster aus – inklusive Wahlregeln, Lehrerwahl, Korrekturzeichen, Gutachten und Notenberechnung.</div></div>
      <div class="grid2"><div class="card pad"><h3>${icon("sliders-horizontal")} Einstellungen der Prüfung (Test)</h3>
        <div class="small">${icon("signature")} ${PX.examSigns(ex).length} Korrekturzeichen${Object.keys(ex.partSigns || {}).some((k) => ex.partSigns[k]?.length) ? " · eigene Zeichensätze je Prüfungsteil" : ""}</div></div>
        <div class="card pad"><h3>${icon("zap")} Abkürzungen</h3><p class="small">Erzeugt plausible Beispielbewertungen, um z. B. direkt die Endbeurteilung mit Vorkorrekturen anzusehen.</p><div class="row"><button class="btn sm" data-auto="ek">EK automatisch</button><button class="btn sm" data-auto="zk">ZK automatisch</button></div></div></div>
      <div class="tablewrap mt"><table class="tbl"><thead><tr><th>Arbeit</th><th>Erstkorrektur</th><th>Zweitkorrektur</th><th>Endbeurteilung</th><th>Endnote</th></tr></thead><tbody>
      ${list.map((m) => { const f = m.corr.ek?.np != null && m.corr.zk?.np != null ? PX.finalNP(m, r) : null; return `<tr><td><b>${esc(m.last)}, ${esc(m.first)}</b><div class="xs muted">${esc(m.nr)}</div></td>${cell(m, "ek")}${cell(m, "zk")}${cell(m, "eb")}<td>${f ? `<b>${PX.fmtNP(f.np ?? f.base)} NP</b><div class="xs muted">${esc(f.src)}${f.pending ? " · ausstehend: " + esc(f.pending) : ""}</div>` : "–"}</td></tr>`; }).join("")}</tbody></table></div>
      <div class="mt">${PX.rasterPreview(r)}</div>`;
  }, mount: (root) => {
    const r = PX.byId("rasters", mm[1]); if (!r) return; const km = PX.sandboxFor(r.id); const ex = PX.exam(km.exam); PX.save();
    $$("[data-auto]", root).forEach((b) => (b.onclick = () => { const st = b.dataset.auto; PX.mappenOf(km).forEach((m) => { if (st === "zk" && m.corr.ek?.state !== "fertig") O().autoCorrect(m.id, "ek", me().id); O().autoCorrect(m.id, st, me().id); }); PX.commit(); PX.toast("Beispielbewertungen erzeugt", PX.STAGE[st]); }));
    $("#sbreset", root).onclick = () => { PX.sandboxFor(r.id, true); PX.commit(); PX.toast("Testkursmappe zurückgesetzt", ""); };
  } }));

  // ---------- Korrekturmodus ----------
  const K = { tool: "sign", sign: null, part: null, page: 0, sel: null, undo: [], tab: "bew", zoom: 1, mid: null, gsec: 0, suggest: true, recent: [], bcat: "" };
  PX.route(/^korr\/m\/([^/]+)\/(ek|zk|eb)$/, (mm) => {
    const m = PX.mappe(mm[1]); const st = mm[2];
    if (K.mid !== mm[1] + st) { Object.assign(K, { page: 0, sel: null, undo: [], tab: "bew", mid: mm[1] + st, gsec: 0 }); }
    const sb = !!(m && PX.km(m.km)?.sandbox);
    return { title: sb ? "Testkorrektur" : "Korrektur", shell: "staff", need: sb ? ["lk", "ibbw"] : need, render: () => renderMode(m, st), mount: (r) => mountMode(r, m, st) };
  });
  const hasAccess = (km, st) => km?.sandbox || PX.assignments(me().id).some((a) => a.km.id === km.id && a.stage === st);
  function canEdit(m, st) {
    const km = PX.km(m.km); const c = m.corr[st];
    if (!hasAccess(km, st)) return false;
    if (!km.sandbox && (!PX.stageOpen(km, st) || km.stages[st].lkDone.includes(me().id))) return false;
    if (m.lock && m.lock.pid !== me().id) return false;
    return c?.state !== "fertig";
  }
  const signById = (id) => PX.S.signs.find((z) => z.id === id) || null;
  function visibleMarks(m, st, ex) {
    const out = [];
    const add = (s) => (m.corr[s]?.marks || []).forEach((k) => out.push({ ...k, stage: s, meaning: k.text || signById(k.sign)?.meaning || "" }));
    if (st === "ek") add("ek");
    if (st === "zk") { add("ek"); add("zk"); }
    if (st === "eb") { add("ek"); add("zk"); add("eb"); }
    return out;
  }
  const korrParts = (r) => r.parts.filter((p) => p.scoring !== "extern");
  function renderMode(m, st) {
    if (!m) return PX.empty("Mappe nicht gefunden");
    const km = PX.km(m.km); const ex = PX.exam(km.exam); const r = PX.raster(ex);
    if (!hasAccess(km, st)) return `<div class="notice warn">${icon("lock")}<div>Kein Zugriff auf diese Mappe.</div></div>`;
    const anon = st !== "ek";
    const pages = PX.pagesOf(m).filter((p) => !anon || p.kind !== "deckblatt");
    if (K.page >= pages.length) K.page = 0;
    const page = pages[K.page];
    if (st !== "ek" && K.tool === "redact") K.tool = "sign";
    const edit = canEdit(m, st); const c = PX.corr(m, st);
    const lockOther = m.lock && m.lock.pid !== me().id;
    const list = PX.activeMappen(km); const idx = list.findIndex((x) => x.id === m.id);
    const prev = list[idx - 1], next = list[idx + 1];
    const kp = korrParts(r); if (!K.part || !kp.some((p) => p.id === K.part)) K.part = kp[0]?.id || null;
    const signs = PX.examSigns(ex, K.part);
    if (!K.sign || !signs.some((z) => z.id === K.sign)) K.sign = signs[0]?.id || null;
    const curSign = signById(K.sign);
    const red = (m.corr.ek?.redactions || []).map((x) => ({ ...x }));
    const notes = (c.notes || []).filter((n) => n.by === me().id);
    const selMark = c.marks.find((x) => x.id === K.sel);
    const lehrerLocked = PX.activeMappen(km).some((x) => x.id !== m.id && x.corr.ek?.state === "fertig");
    const sideTabs = [["bew", "Bewertung"], ...(r.gutachten?.on ? [["gut", "Gutachten"]] : []), ["hin", "Hinweise"], ...(st === "eb" ? [["vor", "Vorkorrekturen"]] : [])];
    const back = km.sandbox ? `#/korr/test/${r.id}` : `#/korr/km/${km.id}/${st}`;
    const hintEK = m.corr.ek?.hint;
    const toolBtn = (t, ic, label, title) => `<button class="tool ${K.tool === t ? "on" : ""}" data-tool="${t}" title="${title}">${icon(ic)}${label ? " " + label : ""}</button>`;
    return `<div class="kmode-bar"><a class="btn sm" href="${back}">${icon("arrow-left")} ${km.sandbox ? "Testkorrektur" : "Kursmappe"}</a>
      <button class="iconbtn boxed" ${prev ? `data-goto="${prev.id}"` : "disabled"} aria-label="Vorherige Mappe">${icon("chevron-left")}</button><b class="mtitle">${esc(mTitle(m, st))}</b><button class="iconbtn boxed" ${next ? `data-goto="${next.id}"` : "disabled"} aria-label="Nächste Mappe">${icon("chevron-right")}</button>
      <span class="badge ${PX.stageColor[st]}">${PX.STAGE[st]}</span>${km.sandbox ? PX.badge("Test", "purple") : ""}${st === "eb" ? (m.ebRequired === "stichprobe" ? PX.badge("Stichprobe", "brown") : m.ebRequired ? PX.badge("Pflichtmappe", "brown") : PX.badge("freiwillig", "gray")) : ""}
      <span class="grow"></span>${lockOther ? PX.badge("gesperrt: in Bearbeitung durch " + PX.name(m.lock.pid) + " – Lesemodus", "red") : edit ? `<span class="xs muted">${icon("lock")} für andere gesperrt · ${icon("save")} automatisch gespeichert</span>` : PX.badge(c.state === "fertig" ? "korrigiert – Lesemodus" : "Lesemodus", "gray")}
      ${edit ? `<button class="btn sm" id="undo" ${K.undo.length ? "" : "disabled"}>${icon("undo-2")} Rückgängig</button>` : ""}</div>
      ${m.nta ? `<div class="notice peach">${icon("scale")}<div class="small"><b>Nachteilsausgleich:</b> ${esc(m.nta)}</div></div>` : ""}
      ${st !== "ek" && hintEK ? `<div class="notice info">${icon("message-square")}<div class="small"><b>Hinweis der Erstkorrektur (anonym):</b> ${esc(hintEK)}</div></div>` : ""}
      <div class="kwrap">
        <aside class="thumbs">${pages.map((p, i) => `<button class="thumb ${i === K.page ? "on" : ""}" data-pg="${i}"><span class="tn">${i + 1}</span>${PX.pageHtml(m, p, { small: true, anon })}<span class="xs">${p.kind === "deckblatt" ? "Deckblatt" : p.kind === "konzept" ? "Konzept" : "Blatt " + p.n}</span></button>${st === "ek" && edit && p.kind !== "deckblatt" && !km.sandbox ? `<div class="thumbact"><button class="iconbtn sm" data-trot="${p.id}" title="Seite drehen">${icon("rotate-cw")}</button><button class="iconbtn sm" data-tmv="${p.id}|-1" title="nach vorn">${icon("chevron-up")}</button><button class="iconbtn sm" data-tmv="${p.id}|1" title="nach hinten">${icon("chevron-down")}</button></div>` : ""}`).join("")}</aside>
        <section class="kdoc2">
          ${edit ? `<div class="ktools2"><div class="toolrow">${toolBtn("select", "mouse-pointer-2", "", "Auswählen / Löschen")}${toolBtn("sign", "stamp", "Zeichen", "Korrekturzeichen setzen")}${toolBtn("line", "underline", "Unterstreichen", "Textstelle unterstreichen – Zeichen wird vorgeschlagen")}${toolBtn("pen", "pen-tool", "Stift", "Freihand markieren – Zeichen wird vorgeschlagen")}${toolBtn("text", "message-square", "", "Randbemerkung")}${st === "ek" ? toolBtn("redact", "square", "Schwärzen", "Personenbezogene Daten schwärzen") : ""}${toolBtn("note", "sticky-note", "Notiz", "Private Notiz")}
              ${kp.length > 1 ? `<span class="sepv"></span><label class="xs muted" for="kpart">Prüfungsteil</label><select class="select sm" id="kpart" style="width:auto">${kp.map((p) => `<option value="${p.id}" ${K.part === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>` : ""}</div>
            <div class="toolrow signrow">${signs.map((z) => `<button class="sign ${K.sign === z.id && K.tool !== "select" ? "on " + st : ""}" data-sign="${z.id}" title="${esc(z.meaning)}${z.weight != null ? ` · Gewicht ${PX.fmtNP(z.weight)}` : ""}${z.count ? " · Anzahl wird abgefragt" : ""}">${esc(z.code)}${z.weight ? `<sub>${z.weight === 0.25 ? "¼" : z.weight === 0.5 ? "½" : PX.fmtNP(z.weight)}</sub>` : z.count ? "<sub>n</sub>" : ""}</button>`).join("")}</div>
            <div class="row between"><div class="xs muted">${selMark && (selMark.kind === "line" || selMark.kind === "pen") ? `Markierung ausgewählt – Zeichen in der Leiste anklicken, um es zuzuordnen, oder Entf zum Löschen.` : K.tool === "sign" ? `Klicken Sie auf die Seite, um „${esc(curSign?.code || "")}“ (${esc(curSign?.meaning || "")}) zu setzen.` : K.tool === "line" ? "Mit gedrückter Maustaste unter der Textstelle entlangziehen. Anschließend wird ein Korrekturzeichen vorgeschlagen." : K.tool === "pen" ? "Freihand markieren (z. B. einkreisen). Anschließend wird ein Korrekturzeichen vorgeschlagen." : K.tool === "redact" ? "Rechteck über personenbezogene Daten ziehen. Für Zweitkorrektur und Endbeurteilung nicht mehr lesbar." : K.tool === "note" ? "Notiz an eine Position setzen – nur für Sie sichtbar, nicht in Berichten oder Einsichtnahme. Keine personenbezogenen Daten oder Punkte." : K.tool === "text" ? "Klicken Sie auf die Seite und geben Sie eine Randbemerkung ein." : "Markierung anklicken und mit Entf löschen."}</div>
              ${K.tool === "line" || K.tool === "pen" ? `<label class="xs nowrap"><input type="checkbox" id="ksug" ${K.suggest ? "checked" : ""}> Zeichen vorschlagen</label>` : ""}</div></div>` : ""}
          <div class="kpaper2" style="--z:${K.zoom}"><div class="zoombar"><button class="iconbtn" id="kzo">${icon("zoom-out")}</button><span class="xs">${Math.round(K.zoom * 100)} %</span><button class="iconbtn" id="kzi">${icon("zoom-in")}</button></div>
            <div class="pagehost ${edit ? "tool-" + K.tool : ""}" id="host">${page ? PX.pageHtml(m, page, { anon, marks: visibleMarks(m, st, ex), red, notes, sel: K.sel }) : PX.empty("Keine Seiten")}</div></div>
          <div class="legend xs">${st === "zk" ? `<span class="mk ek">f</span> Erstkorrektur (Punkte verborgen)` : ""} ${st === "eb" ? `<span class="mk ek">f</span> Erstkorrektur <span class="mk zk">f</span> Zweitkorrektur` : ""} <span class="mk ${st}">f</span> Ihre Zeichen${PX.markErrors(c) ? ` · Fehlerzahl aus Zeichen: <b>${PX.fmtNP(PX.markErrors(c))}</b>` : ""}</div>
        </section>
        <aside class="kside2"><div class="tabs small">${sideTabs.map(([k, l]) => `<button class="${K.tab === k ? "active" : ""}" data-tab="${k}">${l}</button>`).join("")}</div>
          ${K.tab === "bew" ? `<div class="sec scoring">${PX.scoringHtml(r, c, km, { edit, lehrerEdit: edit && st === "ek" && !lehrerLocked, ekView: st === "ek", m, extEdit: edit && st === "ek", stage: st, focus: PX.ui.taskFocus, markCount: PX.markErrors(c) })}
            ${st === "ek" && (r.groups || []).some((g) => g.chooser === "lehrer") ? `<div class="xs muted mt-s">${icon("info")} Die Lehrerwahl gilt für alle Mappen der Kursmappe${lehrerLocked ? " und ist festgelegt, da bereits Mappen abgeschlossen sind" : ""}. Sie ist für Zweitkorrektur, Endbeurteilung und Statistik sichtbar.</div>` : ""}
            ${r.formPdf ? `<div class="formpdf mt"><b class="small">${icon("file-up")} Formblatt (PDF)</b>${c.formPdf ? `<div class="small">${icon("file-check")} ${esc(c.formPdf.file)} ${edit ? `<button class="link xs" id="fprm">entfernen</button>` : ""}</div>` : edit ? `<div class="row mt-s"><button class="btn sm" id="fpup">${icon("upload")} Ausgefülltes Formblatt hochladen</button></div><div class="xs muted">Pflicht für dieses Fach. Die Bewertung erfolgt zusätzlich im Raster.</div>` : `<div class="xs muted">nicht hochgeladen</div>`}</div>` : ""}
            ${edit ? `<button class="btn primary block mt" id="finish">${icon("check")} Korrektur dieser Mappe abschließen</button>` : c.state === "fertig" && (km.sandbox || (PX.stageOpen(km, st) && !km.stages[st].lkDone.includes(me().id))) && !lockOther ? `<button class="btn block mt" id="reopen">${icon("pencil")} Wieder öffnen</button>` : ""}
            ${c.state === "fertig" && !km.sandbox ? `<button class="btn block mt-s" id="report">${icon("file-text")} ${PX.STAGE[st]}sbericht</button>` : ""}</div>`
          : K.tab === "gut" ? gutHtml(r, c, st, edit)
          : K.tab === "hin" ? `<div class="sec"><h4>Bewertungsgrundlagen</h4><button class="doclink" data-ewh>${icon("file-text")} Erwartungshorizont</button>${ex.guideline ? `<div class="small">${icon("book-text")} ${esc(PX.byId("guidelines", ex.guideline)?.name || "")}</div>` : ""}
              <h4 class="mt">Nachteilsausgleich</h4><p class="small">${m.nta ? esc(m.nta) : "keiner"}</p>
              ${st === "ek" ? `<h4 class="mt">Hinweis an die Zweitkorrektur</h4><textarea class="input" id="hint" rows="3" placeholder="z. B. „Seite 3 schwer lesbar“, „Lösungsweg auf dem Konzeptblatt fortgesetzt“" ${edit ? "" : "disabled"}>${esc(c.hint || "")}</textarea><div class="xs muted">Wird der Zweitkorrektur anonym angezeigt – keine Punkte oder Noten.</div>` : hintEK ? `<h4 class="mt">Hinweis der Erstkorrektur</h4><p class="small">${esc(hintEK)}</p>` : ""}
              ${st === "eb" && m.corr.zk?.hint ? `<h4 class="mt">Hinweis der Zweitkorrektur</h4><p class="small">${esc(m.corr.zk.hint)}</p>` : ""}
              ${st === "zk" ? `<h4 class="mt">Hinweis an die Endbeurteilung</h4><textarea class="input" id="hint" rows="2" ${edit ? "" : "disabled"}>${esc(c.hint || "")}</textarea>` : ""}
              <h4 class="mt">Notizen (nur für Sie)</h4>${notes.length ? notes.map((n) => `<div class="small noteitem">✎ ${esc(n.text)} <button class="link xs" data-delnote="${n.id}">löschen</button></div>`).join("") : `<p class="small muted">Keine Notizen.</p>`}
              ${st === "ek" ? `<h4 class="mt">Zusatzdokumente</h4><p class="small muted">${ex.zusatz ? "Upload erlaubt." : "Für diese Prüfung nicht vorgesehen."}</p><h4 class="mt">Schwärzungen</h4><p class="small">${(c.redactions || []).length} Bereich(e) geschwärzt ${(c.redactions || []).length ? `<button class="link xs" id="clrred">alle entfernen</button>` : ""}</p>` : ""}</div>`
          : vorHtml(m, r, km)}
        </aside></div>`;
  }
  function gutHtml(r, c, st, edit) {
    const G = r.gutachten; const secs = G.sections?.length ? G.sections : ["Gutachten"]; if (K.gsec >= secs.length) K.gsec = 0;
    const cats = [...new Set((G.bausteine || []).map((b) => b.cat))];
    const bs = (G.bausteine || []).filter((b) => !K.bcat || b.cat === K.bcat);
    return `<div class="sec"><div class="xs muted">${icon("eye-off")} ${st === "ek" ? "Ihr Gutachten ist für die Zweitkorrektur nicht sichtbar. Die Endbeurteilung sieht die Gutachten von Erst- und Zweitkorrektur." : st === "zk" ? "Das Gutachten der Erstkorrektur ist für Sie nicht sichtbar." : "Gutachten der Vorkorrekturen: Reiter „Vorkorrekturen“."}</div>
      ${secs.map((sname, i) => `<div class="gsec ${K.gsec === i ? "on" : ""}"><label class="lbl" for="gs${i}">${esc(sname)}${G.required ? " *" : ""}</label><textarea class="input" id="gs${i}" data-gs="${i}" rows="${secs.length > 1 ? 4 : 9}" ${edit ? "" : "disabled"}>${esc(c.gutachten?.[sname] || "")}</textarea></div>`).join("")}
      ${edit && (G.bausteine || []).length ? `<h4 class="mt">${icon("blocks")} Textbausteine <span class="xs muted">landesweit einheitlich · Einfügen in „${esc(secs[K.gsec])}“</span></h4>
        ${cats.length > 1 ? `<select class="select sm" id="bcat"><option value="">alle Kategorien</option>${cats.map((x) => `<option ${K.bcat === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>` : ""}
        <div class="bausteine">${bs.map((b) => `<button class="baustein" data-bst="${b.id}"><span class="xs muted">${esc(b.cat)}</span>${esc(b.text)}</button>`).join("")}</div>` : ""}
      <div class="xs muted mt-s">Revisionssicher gespeichert, Bestandteil der digitalen Mappe.</div></div>`;
  }
  function vorHtml(m, r, km) {
    const E = PX.evaluate(r, m.corr.ek, km, m), Z = PX.evaluate(r, m.corr.zk, km, m);
    const act = PX.activeLeaves(r, m.corr.ek, km).filter((l) => PX.partOf(r, l).scoring !== "extern");
    const v = (c, id) => { const x = c?.be?.[id]; return x === "nb" ? "n. b." : x ?? "–"; };
    return `<div class="sec"><p class="small">${m.ebRequired === "stichprobe" ? "Stichprobe (2 Prüfungen je Kurs, zufällig)" : `Abweichung EK/ZK: <b>${PX.fmtNP(m.diff)} NP</b>${m.ebRequired ? " → Endbeurteilung verpflichtend" : ""}`}</p>
      <table class="rtable"><thead><tr><th>Aufgabe</th><th class="num">EK</th><th class="num">ZK</th></tr></thead><tbody>${act.map((l) => `<tr><td>${esc(l.no)}</td><td class="num">${v(m.corr.ek, l.id)}</td><td class="num">${v(m.corr.zk, l.id)}</td></tr>`).join("")}
      ${r.parts.length > 1 ? E.parts.filter((p) => p.scoring !== "extern").map((p, i) => `<tr class="sumrow"><td>${esc(p.name)}</td><td class="num">${PX.fmtNP(p.np)}</td><td class="num">${PX.fmtNP(Z.parts[i]?.np)}</td></tr>`).join("") : ""}
      <tr class="sumrow"><td>Notenpunkte</td><td class="num"><b>${PX.fmtNP(m.corr.ek?.np)}</b></td><td class="num"><b>${PX.fmtNP(m.corr.zk?.np)}</b></td></tr></tbody></table>
      ${(r.groups || []).filter((g) => g.chooser === "lehrer").length ? `<div class="xs mt-s">${icon("users")} Lehrerwahl: ${(r.groups || []).filter((g) => g.chooser === "lehrer").map((g) => PX.choiceOf(r, g, null, km).map((id) => r.nodes.find((n) => n.id === id)?.no).join(", ")).join(" · ")}</div>` : ""}
      ${r.gutachten?.on ? ["ek", "zk"].map((s) => `<h4 class="mt">Gutachten ${PX.STAGE_SHORT[s]}</h4><p class="small pre">${esc(PX.gutachtenText(m.corr[s]) || "–")}</p>`).join("") : ""}
      ${r.formPdf ? `<div class="small mt-s">${["ek", "zk"].map((s) => `${icon("file-text")} Formblatt ${PX.STAGE_SHORT[s]}: ${esc(m.corr[s]?.formPdf?.file || "–")}`).join("<br>")}</div>` : ""}
      ${km.sandbox ? "" : `<div class="row mt"><button class="btn sm" data-rep="ek">${icon("file-text")} EK-Bericht</button><button class="btn sm" data-rep="zk">${icon("file-text")} ZK-Bericht</button></div>`}</div>`;
  }
  function pushUndo(c) { K.undo.push(JSON.stringify(c)); if (K.undo.length > 30) K.undo.shift(); }
  // Zeichen-Auswahl nach Unterstreichung / Stift (Vorschlag: zuletzt verwendete und gewähltes Zeichen)
  function signModal(ex, partId, onPick) {
    const all = PX.examSigns(ex, partId);
    const sug = [...new Set([K.sign, ...K.recent])].map(signById).filter((z) => z && all.includes(z)).slice(0, 4);
    const cats = [...new Set(all.map((z) => z.cat))];
    PX.modal({ title: "Korrekturzeichen zuordnen", size: "narrow", icon: "stamp", body: `<p class="xs muted">Vorschlag für die markierte Stelle – oder ohne Zeichen übernehmen und später separat setzen.</p>
      <div class="lbl">Vorgeschlagen</div><div class="signs">${sug.map((z) => `<button class="sign big" data-pick="${z.id}" title="${esc(z.meaning)}">${esc(z.code)} <span class="xs">${esc(z.meaning)}</span></button>`).join("")}</div>
      ${cats.map((ct) => `<div class="lbl mt-s">${esc(ct)}</div><div class="signs">${all.filter((z) => z.cat === ct).map((z) => `<button class="sign" data-pick="${z.id}" title="${esc(z.meaning)}">${esc(z.code)}</button>`).join("")}</div>`).join("")}`,
      foot: `<button class="btn" data-none>Ohne Zeichen</button><button class="btn" data-close>Markierung verwerfen</button>`,
      onMount: (md, close) => { $$("[data-pick]", md).forEach((b) => (b.onclick = () => { close(); onPick(b.dataset.pick); })); $("[data-none]", md).onclick = () => { close(); onPick(null); }; } });
  }
  function countModal(z, cb) {
    PX.modal({ title: `${z.code} – ${z.meaning}`, size: "narrow", body: `<label class="lbl" for="cnt">Anzahl angerechneter Fehler</label><input class="input" id="cnt" type="number" min="0" step="0.25" value="1">`, foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Setzen</button>`, onMount: (md, close) => { $("#cnt", md).focus(); $("[data-ok]", md).onclick = () => { const v = Math.max(0, Math.round(+$("#cnt", md).value * 4) / 4); close(); cb(v); }; } });
  }
  function mountMode(root, m, st) {
    if (!m) return;
    const km = PX.km(m.km); const ex = PX.exam(km.exam); const anon = st !== "ek"; const r = PX.raster(ex);
    const edit = canEdit(m, st);
    if (edit && (!m.lock || m.lock.pid !== me().id)) { O().lock(m.id, st, me().id); PX.save(); }
    const c = PX.corr(m, st); const snap = JSON.stringify(c);
    const pages = PX.pagesOf(m).filter((p) => !anon || p.kind !== "deckblatt");
    const page = pages[K.page];
    const save = () => { PX.save(); PX.rerender(); PX.guide && PX.guide.check(); };
    const who = st === "ek" ? m.nr : PX.pseudo(m);
    $$("[data-goto]", root).forEach((b) => (b.onclick = () => PX.go(`#/korr/m/${b.dataset.goto}/${st}`)));
    $$("[data-pg]", root).forEach((b) => (b.onclick = () => { K.page = +b.dataset.pg; K.sel = null; PX.rerender(); }));
    $$("[data-tab]", root).forEach((b) => (b.onclick = () => { K.tab = b.dataset.tab; PX.rerender(); }));
    $$("[data-tool]", root).forEach((b) => (b.onclick = () => { K.tool = b.dataset.tool; K.sel = null; PX.rerender(); }));
    const kpart = $("#kpart", root); if (kpart) kpart.onchange = () => { K.part = kpart.value; PX.rerender(); };
    const ksug = $("#ksug", root); if (ksug) ksug.onchange = () => { K.suggest = ksug.checked; };
    $("#kzi", root).onclick = () => { K.zoom = Math.min(1.8, K.zoom + 0.15); PX.rerender(); }; $("#kzo", root).onclick = () => { K.zoom = Math.max(0.7, K.zoom - 0.15); PX.rerender(); };
    $$("[data-ewh]", root).forEach((b) => (b.onclick = () => (PX.examPassed(ex) || km.sandbox ? PX.showEWH(ex) : PX.toast("Noch nicht sichtbar", "", "info"))));
    $$("[data-rep]", root).forEach((b) => (b.onclick = () => window.open(location.href.split("#")[0] + `#/druck/bericht/${b.dataset.rep}/${m.id}`, "_blank")));
    const rep = $("#report", root); if (rep) rep.onclick = () => window.open(location.href.split("#")[0] + `#/druck/bericht/${st}/${m.id}`, "_blank");
    $$("[data-trot]", root).forEach((b) => (b.onclick = () => { O().rotate(m.scan, [b.dataset.trot], 90); save(); }));
    $$("[data-tmv]", root).forEach((b) => (b.onclick = () => { const [pid, d] = b.dataset.tmv.split("|"); O().movePage(m.scan, pid, +d); save(); }));
    $$("[data-delnote]", root).forEach((b) => (b.onclick = () => { pushUndo(c); c.notes = c.notes.filter((n) => n.id !== b.dataset.delnote); PX.audit("Notiz gelöscht", who); save(); }));
    const bc = $("#bcat", root); if (bc) bc.onchange = () => { K.bcat = bc.value; PX.rerender(); };
    const clr = $("#clrred", root); if (clr) clr.onclick = () => { pushUndo(c); c.redactions = []; save(); };
    if (!edit) return;
    // Bewertung (Raster)
    const sc = $(".scoring", root);
    if (sc) PX.bindScoring(sc, r, c, km, (msg) => {
      K.undo.push(snap);
      if (msg?.lehrer) PX.audit("Lehrerwahl festgelegt", PX.kmLabel(km), `${msg.lehrer.label}: ${PX.choiceOf(r, msg.lehrer, c, km).map((id) => r.nodes.find((n) => n.id === id)?.no).join(", ")} – gilt für alle Mappen der Kursmappe`);
      if (msg?.extern) PX.audit("Notenpunkte nicht korrekturrelevanter Teil eingetragen", `${m.first} ${m.last}`, JSON.stringify(m.extern));
      save();
      if (msg?.focusNext) setTimeout(() => { const all = $$("[data-v]"); const i = all.findIndex((x) => x.dataset.v === msg.focusNext); const n = all.slice(i + 1).find((x) => !x.disabled); n && n.focus(); }, 0);
    }, { m, markCount: PX.markErrors(c) });
    const fu = $("#fpup", root); if (fu) fu.onclick = () => { pushUndo(c); c.formPdf = { file: `Formblatt_${PX.subj(ex.subject)?.short}_${st === "ek" ? m.nr : PX.pseudo(m).replace(" ", "")}.pdf`, at: PX.S.now }; PX.audit("Formblatt (PDF) hochgeladen", who, c.formPdf.file); save(); };
    const fr = $("#fprm", root); if (fr) fr.onclick = () => { pushUndo(c); c.formPdf = null; save(); };
    $$("[data-gs]", root).forEach((t) => { t.onfocus = () => { if (K.gsec !== +t.dataset.gs) { K.gsec = +t.dataset.gs; $$(".gsec", root).forEach((g, i) => g.classList.toggle("on", i === K.gsec)); } }; t.onchange = () => { const secs = r.gutachten.sections?.length ? r.gutachten.sections : ["Gutachten"]; c.gutachten = c.gutachten && typeof c.gutachten === "object" ? c.gutachten : {}; c.gutachten[secs[+t.dataset.gs]] = t.value; PX.save(); }; });
    $$("[data-bst]", root).forEach((b) => (b.onclick = () => { const bs = r.gutachten.bausteine.find((x) => x.id === b.dataset.bst); const secs = r.gutachten.sections?.length ? r.gutachten.sections : ["Gutachten"]; const k = secs[K.gsec]; pushUndo(c); c.gutachten = c.gutachten && typeof c.gutachten === "object" ? c.gutachten : {}; c.gutachten[k] = ((c.gutachten[k] || "").trim() + " " + bs.text).trim(); c.bausteine = [...(c.bausteine || []), bs.id]; save(); }));
    const hi = $("#hint", root); if (hi) hi.onchange = () => { if (/\d+\s*(BE|NP|Punkte)/i.test(hi.value)) { PX.toast("Nicht zulässig", "Der Hinweis darf keine Bewertungsangaben enthalten.", "warn"); hi.value = c.hint || ""; return; } c.hint = hi.value.trim(); PX.audit(st === "ek" ? "Hinweis an Zweitkorrektur erfasst" : "Hinweis an Endbeurteilung erfasst", who); PX.save(); };
    const un = $("#undo", root); if (un) un.onclick = () => { const s = K.undo.pop(); if (s) { m.corr[st] = JSON.parse(s); save(); } };
    const fi = $("#finish", root); if (fi) fi.onclick = async () => {
      const res = PX.evaluate(r, c, km, m);
      if (!res.complete) return PX.toast("Bewertung unvollständig", res.missing.join(" · "), "warn");
      const ok = await PX.confirm("Korrektur dieser Mappe abschließen?", `${esc(mTitle(m, st))}: ${PX.fmtNP(res.np)} Notenpunkte${res.hasExtern ? " (schriftlicher Teil)" : ""}. ${st === "ek" && !(c.redactions || []).length && !km.sandbox ? "Hinweis: Es wurden keine Bereiche geschwärzt." : ""} Die Mappe wird entsperrt.`, "Abschließen");
      if (!ok) return; const out = O().finishMappe(m.id, st); if (!out.ok) return PX.toast("Abschluss nicht möglich", out.msg, "warn");
      PX.save(); PX.toast("Mappe korrigiert", `${PX.fmtNP(out.np)} NP${km.sandbox ? "" : ` – ${PX.STAGE[st]}sbericht erzeugt`}`);
      const list = PX.activeMappen(km).filter((x) => (st !== "eb" || x.ebRequired || km.sandbox) && x.corr[st]?.state !== "fertig" && !(x.lock && x.lock.pid !== me().id));
      if (list.length) PX.go(`#/korr/m/${list[0].id}/${st}`); else PX.go(km.sandbox ? `#/korr/test/${r.id}` : `#/korr/km/${km.id}/${st}`);
    };
    const ro = $("#reopen", root); if (ro) ro.onclick = () => { O().reopenMappe(m.id, st); save(); };
    // Zeichenleiste: Zeichen wählen oder ausgewählter Markierung zuordnen
    const useSign = (id) => { K.recent = [id, ...K.recent.filter((x) => x !== id)].slice(0, 5); };
    const withCount = (z, mark, done) => { if (z?.count) countModal(z, (v) => { mark.count = v; done(); }); else done(); };
    $$("[data-sign]", root).forEach((b) => (b.onclick = () => {
      const sel = c.marks.find((x) => x.id === K.sel);
      if (sel && (sel.kind === "line" || sel.kind === "pen")) { const z = signById(b.dataset.sign); pushUndo(c); sel.sign = z.id; sel.code = z.code; useSign(z.id); withCount(z, sel, save); return; }
      K.tool = "sign"; K.sign = b.dataset.sign; PX.rerender();
    }));
    // Klicks auf die Seite
    const host = $("#host", root); const sheet = host && host.querySelector(".sheet"); if (!sheet || !page) return;
    const pos = (e) => { const b = sheet.getBoundingClientRect(); return { x: Math.round(((e.clientX - b.left) / b.width) * 1000) / 10, y: Math.round(((e.clientY - b.top) / b.height) * 1000) / 10 }; };
    const addMark = (mk) => { const z = signById(mk.sign); pushUndo(c); c.marks.push(Object.assign({ id: PX.uid("k"), page: page.id, part: K.part }, mk)); if (z) useSign(z.id); save(); };
    sheet.addEventListener("click", (e) => {
      if (K.tool === "line" || K.tool === "pen" || K.tool === "redact") return;
      const mk = e.target.closest("[data-mk]");
      if (mk) {
        const own = c.marks.find((x) => x.id === mk.dataset.mk); if (own) { K.sel = own.id; PX.rerender(); return; }
        return;
      }
      if (e.target.closest("[data-nt]")) { const n = c.notes.find((x) => x.id === e.target.closest("[data-nt]").dataset.nt); n && PX.toast("Notiz", esc(n.text), "info"); return; }
      const p = pos(e);
      if (K.tool === "sign") { const z = signById(K.sign); if (!z) return; const mark = { kind: "sign", x: p.x, y: p.y, sign: z.id, code: z.code }; withCount(z, mark, () => addMark(mark)); }
      if (K.tool === "text") textDialog("Randbemerkung", "", (t) => addMark({ kind: "sign", x: p.x, y: p.y, code: "»", text: t }));
      if (K.tool === "note") textDialog("Private Notiz", "Keine personenbezogenen Daten und keine Punktangaben.", (t) => { if (/\d+\s*(BE|NP|Punkte)/i.test(t)) return PX.toast("Nicht zulässig", "Notizen dürfen keine Bewertungsangaben enthalten.", "warn"); pushUndo(c); c.notes.push({ id: PX.uid("n"), page: page.id, x: p.x, y: p.y, text: t, by: me().id }); PX.audit("Notiz erstellt", who, "Inhalt nur für Verfasser:in sichtbar"); save(); });
      if (K.tool === "select") { K.sel = null; PX.rerender(); }
    });
    // Unterstreichen und Stift: Markierung zeichnen, danach Zeichen vorschlagen
    if (K.tool === "line" || K.tool === "pen") {
      let start = null, pts = [], ghost = null;
      const svgNS = "http://www.w3.org/2000/svg";
      sheet.addEventListener("mousedown", (e) => { e.preventDefault(); start = pos(e); pts = [[start.x, start.y]];
        let svg = sheet.querySelector(".mksvg"); if (!svg) { svg = document.createElementNS(svgNS, "svg"); svg.setAttribute("class", "mksvg"); svg.setAttribute("viewBox", "0 0 100 100"); svg.setAttribute("preserveAspectRatio", "none"); sheet.querySelector(".overlay").appendChild(svg); }
        ghost = document.createElementNS(svgNS, K.tool === "line" ? "line" : "polyline"); ghost.setAttribute("class", (K.tool === "line" ? "ul " : "pen ") + st); svg.appendChild(ghost); });
      sheet.addEventListener("mousemove", (e) => { if (!start) return; const p = pos(e);
        if (K.tool === "line") { ghost.setAttribute("x1", start.x); ghost.setAttribute("y1", start.y); ghost.setAttribute("x2", p.x); ghost.setAttribute("y2", start.y); }
        else { const l = pts[pts.length - 1]; if (Math.hypot(p.x - l[0], p.y - l[1]) > 0.6) pts.push([p.x, p.y]); ghost.setAttribute("points", pts.map((q) => q.join(",")).join(" ")); } });
      window.addEventListener("mouseup", function up(e) {
        window.removeEventListener("mouseup", up); if (!start) return; const p = pos(e); const s0 = start; start = null;
        const mark = K.tool === "line" ? { kind: "line", x1: Math.min(s0.x, p.x), x2: Math.max(s0.x, p.x), y: s0.y } : { kind: "pen", pts: pts.length > 1 ? pts : [[s0.x, s0.y], [p.x, p.y]] };
        if ((mark.kind === "line" && mark.x2 - mark.x1 < 2) || (mark.kind === "pen" && pts.length < 3)) { PX.rerender(); return; }
        const finish = (signId) => { const z = signById(signId); if (z) { mark.sign = z.id; mark.code = z.code; } withCount(z, mark, () => addMark(mark)); };
        if (K.suggest) signModal(ex, K.part, finish); else finish(K.sign);
      });
    }
    if (K.tool === "redact") {
      let start = null, box = null;
      sheet.addEventListener("mousedown", (e) => { e.preventDefault(); start = pos(e); box = document.createElement("span"); box.className = "redact drawing"; sheet.querySelector(".overlay").appendChild(box); });
      sheet.addEventListener("mousemove", (e) => { if (!start) return; const p = pos(e); Object.assign(box.style, { left: Math.min(start.x, p.x) + "%", top: Math.min(start.y, p.y) + "%", width: Math.abs(p.x - start.x) + "%", height: Math.abs(p.y - start.y) + "%" }); });
      window.addEventListener("mouseup", function up(e) { window.removeEventListener("mouseup", up); if (!start) return; const p = pos(e); const w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y); if (w > 2 && h > 1) { pushUndo(c); c.redactions = c.redactions || []; c.redactions.push({ id: PX.uid("r"), page: page.id, x: Math.min(start.x, p.x), y: Math.min(start.y, p.y), w, h }); PX.audit("Personenbezogene Daten geschwärzt", m.nr, "Seite " + (K.page + 1)); } start = null; save(); });
    }
    document.onkeydown = (e) => { if (!/^#\/korr\/m\//.test(location.hash)) return; if ((e.key === "Delete" || e.key === "Backspace") && K.sel && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { pushUndo(c); c.marks = c.marks.filter((x) => x.id !== K.sel); K.sel = null; save(); } };
  }
  function textDialog(title, hint, cb) {
    PX.modal({ title, size: "narrow", body: `${hint ? `<p class="xs muted">${esc(hint)}</p>` : ""}<textarea class="input" id="tx" rows="3"></textarea>`, foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Übernehmen</button>`, onMount: (m, close) => { $("#tx", m).focus(); $("[data-ok]", m).onclick = () => { const t = $("#tx", m).value.trim(); if (!t) return; close(); cb(t); }; } });
  }
})();
