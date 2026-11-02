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
        <div class="card pad"><h3>${icon("info")} Ablauf</h3><p class="small">${st === "ek" ? "Unterlagen sichten (Vollständigkeit, Lesbarkeit), korrigieren, Raster ausfüllen, personenbezogene Daten schwärzen. Mehrere Erstkorrektor:innen können parallel verschiedene Mappen bearbeiten." : st === "zk" ? "Anonymisierte Ansicht: Kopfzeile und Deckblatt sind ausgeblendet. Korrekturzeichen der Erstkorrektur sind sichtbar, deren Punkte und Raster nicht." : "Pflichtmappen (Abweichung > 3 NP) sind hervorgehoben. Sie sehen Berichte und Raster der Erst- und Zweitkorrektur und können weitere Mappen freiwillig korrigieren."}</p></div>
        <div class="card pad"><h3>${icon("clipboard-check")} Abschluss</h3>${iDone ? `<p class="small">${icon("circle-check")} Sie haben den Abschluss am ${PX.fmtD(km.stages[st].at || PX.S.now)} bestätigt.${ss.sltOk ? " Die Schulleitung hat bestätigt." : " Die Schulleitung wurde informiert."}</p>` : `<p class="small">${rel.filter((m) => m.corr[st]?.state === "fertig").length} von ${rel.length} ${st === "eb" ? "Pflichtmappen" : "Mappen"} korrigiert.</p>
          <button class="btn primary" id="confkm" ${open && allDone ? "" : "disabled"}>${icon("check")} Kursmappenabschluss bestätigen</button>${st === "eb" && !rel.length ? `<div class="xs muted mt-s">Keine Pflichtmappe – Abschluss ohne Korrektur möglich.</div>` : ""}`}</div></div>
      ${open && !iDone ? `<div class="row between mt"><div class="row"><label class="small">Aufgabenweise korrigieren:</label><select class="select sm" id="taskfocus"><option value="">alle Aufgaben</option>${(r?.tasks || []).map((t) => `<option value="${t.id}" ${PX.ui.taskFocus === t.id ? "selected" : ""}>${esc(t.no)} ${esc(t.title)}</option>`).join("")}</select></div>
        <button class="btn ghost sm" id="autoall" title="Nur im Klickdummy">${icon("zap")} Demo-Abkürzung: übrige ${st === "eb" ? "Pflicht-" : ""}Mappen automatisch korrigieren</button></div>` : ""}
      <div class="tablewrap mt"><table class="tbl"><thead><tr><th>${anon ? "Mappe" : "Prüfling"}</th>${st === "eb" ? "<th>Endbeurteilung</th><th>EK</th><th>ZK</th>" : ""}<th>Nachteilsausgleich</th><th>Seiten</th><th>Status</th>${st === "ek" || iDone ? "<th>Ergebnis</th>" : ""}<th></th></tr></thead><tbody>
      ${list.map((m) => { const c = m.corr[st]; const lockOther = m.lock && m.lock.pid !== me().id; const req = st === "eb" ? m.ebRequired : true; const stt = c?.state || "offen";
        return `<tr class="${st === "eb" && req ? "hl" : ""} ${st === "eb" && !req ? "dimsoft" : ""}"><td><b>${esc(mTitle(m, st))}</b>${anon ? "" : `<div class="xs muted">${esc(m.nr)}</div>`}</td>
        ${st === "eb" ? `<td>${req ? PX.badge("verpflichtend · Abweichung " + m.diff + " NP", "brown") : PX.badge("freiwillig", "gray")}</td><td>${m.corr.ek?.np ?? "–"}</td><td>${m.corr.zk?.np ?? "–"}</td>` : ""}
        <td class="small">${m.nta ? `${icon("scale")} ${esc(m.nta)}` : "–"}</td><td>${PX.pagesOf(m).filter((p) => !anon || p.kind !== "deckblatt").length}</td>
        <td>${lockOther ? PX.badge("gesperrt – " + PX.name(m.lock.pid), "red") : stt === "fertig" ? PX.badge("korrigiert", "green") : stt === "in_bearbeitung" ? PX.badge("in Bearbeitung", "yellowb") : PX.badge("offen", "gray")}</td>
        ${st === "ek" || iDone ? `<td>${c?.np != null ? `<b>${c.np} NP</b>` : "–"}</td>` : ""}
        <td class="nowrap"><a class="btn sm ${open && stt !== "fertig" && req ? "primary" : ""}" href="#/korr/m/${m.id}/${st}" ${open ? "" : 'aria-disabled="true" tabindex="-1"'}>${icon(stt === "fertig" || !open || iDone ? "eye" : "pen-line")} ${stt === "fertig" || iDone ? "Ansehen" : stt === "in_bearbeitung" ? "Fortsetzen" : "Korrigieren"}</a></td></tr>`; }).join("")}</tbody></table></div>
      ${st === "ek" && PX.mappenOf(km).some((m) => m.absent) ? `<p class="xs muted mt-s">${PX.mappenOf(km).filter((m) => m.absent).map((m) => `${esc(m.first)} ${esc(m.last)}`).join(", ")}: nicht teilgenommen – keine Korrektur vorgesehen.</p>` : ""}
      ${st === "ek" ? `<div class="notice info mt">${icon("scan")}<div class="small">Unterlagen nicht korrigierbar (Seite fehlt, unleserlich)? Fordern Sie einen Nachscan direkt beim Scan-Operator Ihrer Schule an (${esc(PX.scoOf(km.school).map(PX.name).join(", "))}) – diese Anforderung ist nicht systemgestützt.</div></div>` : ""}`;
  }, mount: (r) => {
    const km = PX.km(mm[1]); const st = mm[2]; if (!km) return; const ex = PX.exam(km.exam);
    const tf = $("#taskfocus", r); if (tf) tf.onchange = () => { PX.ui.taskFocus = tf.value; };
    const au = $("#autoall", r); if (au) au.onclick = async () => { const todo = relevant(km, st).filter((m) => m.corr[st]?.state !== "fertig" && !(m.lock && m.lock.pid !== me().id)); if (!todo.length) return PX.toast("Nichts zu tun", "", "info"); if (await PX.confirm("Demo-Abkürzung", `${todo.length} Mappe(n) werden mit plausiblen Beispielbewertungen automatisch korrigiert. Diese Funktion gibt es nur im Klickdummy.`, "Automatisch korrigieren")) { todo.forEach((m) => O().autoCorrect(m.id, st, me().id)); PX.commit(); PX.toast("Demo-Korrektur abgeschlossen", `${todo.length} Mappe(n)`); } };
    const cf = $("#confkm", r); if (cf) cf.onclick = async () => { if (await PX.confirm("Kursmappenabschluss bestätigen?", `Alle ${st === "eb" ? "Pflichtmappen" : "digitalen Mappen"} sind vollständig bewertet. Nach Ihrer Bestätigung und der Bestätigung durch die Schulleitung ${st === "ek" ? "beginnt die Zweitkorrektur" : st === "zk" ? "werden Abweichungen berechnet und die Endbeurteilung ausgelöst" : "steht die Endnote fest"}.`, "Abschluss bestätigen")) { O().confirmKM(km.id, st, me().id); km.stages[st].at = PX.S.now; PX.commit(); PX.toast("Abschluss bestätigt", "Die Schulleitung wurde benachrichtigt."); } };
    $$("[data-ewh]", r).forEach((b) => (b.onclick = () => PX.showEWH(ex)));
    $$("[data-raster]", r).forEach((b) => (b.onclick = () => PX.modal({ title: "Bewertungsraster", size: "wide", body: PX.rasterPreview(PX.raster(ex)) })));
    $$("[data-kr]", r).forEach((b) => (b.onclick = () => PX.modal({ title: PX.byId("guidelines", ex.guideline).name, body: `<div class="docpreview"><h3>Korrekturrichtlinie</h3><p>1. Fehler werden mit den Korrekturzeichen des Fachs am Rand markiert (Erstkorrektur rot rechts, Zweitkorrektur grün links, Endbeurteilung braun links).</p><p>2. Schwerwiegende und gehäufte Verstöße gegen die sprachliche Richtigkeit oder die äußere Form führen zu einem Abzug von bis zu zwei Notenpunkten.</p><p>3. Inhaltlich richtige alternative Lösungen sind gleichwertig zu bewerten.</p><p class="xs muted">Simuliertes Dokument (${esc(PX.byId("guidelines", ex.guideline).file)})</p></div>` })));
  } }));

  PX.showEWH = function (ex) {
    const r = PX.raster(ex);
    if (!ex.ewh) return PX.toast("Kein Erwartungshorizont", "Für diese Prüfung liegt (noch) kein Erwartungshorizont vor. Eine Korrektur ohne Erwartungshorizont ist zulässig.", "info");
    PX.modal({ title: "Erwartungshorizont", size: "wide", icon: "file-text", body: `<div class="docpreview"><div class="xs muted">${esc(ex.ewh.file)} · hochgeladen ${PX.fmtD(ex.ewh.date)}</div>${r.tasks.map((t) => `<div class="horizont-row"><div><b>${esc(t.no)} ${esc(t.title)}</b><p class="small">Erwartet wird eine fachlich korrekte, strukturierte Darstellung mit Fachbegriffen; alternative richtige Lösungen sind gleichwertig.</p></div><div><b>${t.be} BE</b></div></div>`).join("")}</div>` });
  };

  // ---------- Korrekturmodus ----------
  const K = { tool: "sign", sign: "✓", page: 0, sel: null, undo: [], tab: "bew", zoom: 1, mid: null, text: "" };
  const STAGE_OF = { ek: "ek", zk: "zk", eb: "eb" };
  PX.route(/^korr\/m\/([^/]+)\/(ek|zk|eb)$/, (mm) => {
    const m = PX.mappe(mm[1]); const st = mm[2];
    if (K.mid !== mm[1]) { Object.assign(K, { page: 0, sel: null, undo: [], tab: "bew", mid: mm[1], tool: "sign" }); }
    return { title: "Korrektur", shell: "staff", need, render: () => renderMode(m, st), mount: (r) => mountMode(r, m, st) };
  });
  function canEdit(m, st) {
    const km = PX.km(m.km); const c = m.corr[st];
    if (!PX.assignments(me().id).some((a) => a.km.id === km.id && a.stage === st)) return false;
    if (!PX.stageOpen(km, st) || km.stages[st].lkDone.includes(me().id)) return false;
    if (m.lock && m.lock.pid !== me().id) return false;
    return c?.state !== "fertig";
  }
  function visibleMarks(m, st) {
    const out = [];
    const add = (s) => (m.corr[s]?.marks || []).forEach((k) => out.push({ ...k, stage: s, meaning: (PX.S.signs.find((z) => z.code === k.code) || {}).meaning }));
    if (st === "ek") add("ek"); if (st === "zk") { add("ek"); add("zk"); } if (st === "eb") { add("ek"); add("zk"); add("eb"); }
    return out;
  }
  function renderMode(m, st) {
    if (!m) return PX.empty("Mappe nicht gefunden");
    const km = PX.km(m.km); const ex = PX.exam(km.exam); const r = PX.raster(ex);
    if (!PX.assignments(me().id).some((a) => a.km.id === km.id && a.stage === st)) return `<div class="notice warn">${icon("lock")}<div>Kein Zugriff auf diese Mappe.</div></div>`;
    const anon = st !== "ek";
    const pages = PX.pagesOf(m).filter((p) => !anon || p.kind !== "deckblatt");
    if (K.page >= pages.length) K.page = 0;
    const page = pages[K.page];
    const edit = canEdit(m, st); const c = PX.corr(m, st);
    const lockOther = m.lock && m.lock.pid !== me().id;
    const list = PX.activeMappen(km); const idx = list.findIndex((x) => x.id === m.id);
    const prev = list[idx - 1], next = list[idx + 1];
    const signs = PX.signsFor(ex.subject);
    const res = PX.result(c, r);
    const red = (m.corr.ek?.redactions || []).map((x) => ({ ...x }));
    const notes = (c.notes || []).filter((n) => n.by === me().id);
    const focus = PX.ui.taskFocus;
    const sideTabs = [["bew", "Bewertung"], ...(r.gutachten ? [["gut", "Gutachten"]] : []), ["hin", "Hinweise"], ...(st === "eb" ? [["vor", "Vorkorrekturen"]] : [])];
    return `<div class="kmode-bar"><a class="btn sm" href="#/korr/km/${km.id}/${st}">${icon("arrow-left")} Kursmappe</a>
      <button class="iconbtn boxed" ${prev ? `data-goto="${prev.id}"` : "disabled"} aria-label="Vorherige Mappe">${icon("chevron-left")}</button><b class="mtitle">${esc(mTitle(m, st))}</b><button class="iconbtn boxed" ${next ? `data-goto="${next.id}"` : "disabled"} aria-label="Nächste Mappe">${icon("chevron-right")}</button>
      <span class="badge ${PX.stageColor[st]}">${PX.STAGE[st]}</span>${st === "eb" ? (m.ebRequired ? PX.badge("Pflichtmappe", "brown") : PX.badge("freiwillig", "gray")) : ""}
      <span class="grow"></span>${lockOther ? PX.badge("gesperrt: in Bearbeitung durch " + PX.name(m.lock.pid) + " – Lesemodus", "red") : edit ? `<span class="xs muted">${icon("lock")} für andere gesperrt · ${icon("save")} automatisch gespeichert</span>` : PX.badge(c.state === "fertig" ? "korrigiert – Lesemodus" : "Lesemodus", "gray")}
      ${edit ? `<button class="btn sm" id="undo" ${K.undo.length ? "" : "disabled"}>${icon("undo-2")} Rückgängig</button>` : ""}</div>
      ${m.nta ? `<div class="notice peach">${icon("scale")}<div class="small"><b>Nachteilsausgleich:</b> ${esc(m.nta)}</div></div>` : ""}
      <div class="kwrap">
        <aside class="thumbs">${pages.map((p, i) => `<button class="thumb ${i === K.page ? "on" : ""}" data-pg="${i}"><span class="tn">${i + 1}</span>${PX.pageHtml(m, p, { small: true, anon })}<span class="xs">${p.kind === "deckblatt" ? "Deckblatt" : p.kind === "konzept" ? "Konzept" : "Blatt " + p.n}</span></button>${st === "ek" && edit && p.kind !== "deckblatt" ? `<div class="thumbact"><button class="iconbtn sm" data-trot="${p.id}" title="Seite drehen">${icon("rotate-cw")}</button><button class="iconbtn sm" data-tmv="${p.id}|-1" title="nach vorn">${icon("chevron-up")}</button><button class="iconbtn sm" data-tmv="${p.id}|1" title="nach hinten">${icon("chevron-down")}</button></div>` : ""}`).join("")}</aside>
        <section class="kdoc2">
          ${edit ? `<div class="ktools2"><div class="toolrow"><button class="tool ${K.tool === "select" ? "on" : ""}" data-tool="select" title="Auswählen / Löschen">${icon("mouse-pointer-2")}</button><button class="tool ${K.tool === "text" ? "on" : ""}" data-tool="text" title="Randbemerkung">${icon("message-square")}</button>${st === "ek" ? `<button class="tool ${K.tool === "redact" ? "on" : ""}" data-tool="redact" title="Personenbezogene Daten schwärzen">${icon("square")} Schwärzen</button>` : ""}<button class="tool ${K.tool === "note" ? "on" : ""}" data-tool="note" title="Private Notiz">${icon("sticky-note")} Notiz</button><span class="sepv"></span>
            ${signs.map((z) => `<button class="sign ${K.tool === "sign" && K.sign === z.code ? "on " + st : ""}" data-sign="${esc(z.code)}" title="${esc(z.meaning)}">${esc(z.code)}</button>`).join("")}</div>
            <div class="xs muted">${K.tool === "sign" ? `Klicken Sie auf die Seite, um „${esc(K.sign)}“ (${esc((signs.find((z) => z.code === K.sign) || {}).meaning || "")}) zu setzen.` : K.tool === "redact" ? "Rechteck über personenbezogene Daten ziehen. Für Zweitkorrektur und Endbeurteilung nicht mehr lesbar." : K.tool === "note" ? "Notiz an eine Position setzen – nur für Sie sichtbar, nicht in Berichten oder Einsichtnahme. Keine personenbezogenen Daten oder Punkte." : K.tool === "text" ? "Klicken Sie auf die Seite und geben Sie eine Randbemerkung ein." : "Markierung anklicken und mit Entf löschen."}</div></div>` : ""}
          <div class="kpaper2" style="--z:${K.zoom}"><div class="zoombar"><button class="iconbtn" id="kzo">${icon("zoom-out")}</button><span class="xs">${Math.round(K.zoom * 100)} %</span><button class="iconbtn" id="kzi">${icon("zoom-in")}</button></div>
            <div class="pagehost ${edit ? "tool-" + K.tool : ""}" id="host">${page ? PX.pageHtml(m, page, { anon, marks: visibleMarks(m, st), red, notes, sel: K.sel }) : PX.empty("Keine Seiten")}</div></div>
          ${anon ? `<div class="legend xs">${st !== "ek" ? `<span class="mk ek">f</span> Erstkorrektur${st === "zk" ? " (Punkte verborgen)" : ""}` : ""} ${st === "eb" ? `<span class="mk zk">f</span> Zweitkorrektur` : ""} <span class="mk ${st}">f</span> Ihre Zeichen</div>` : ""}
        </section>
        <aside class="kside2"><div class="tabs small">${sideTabs.map(([k, l]) => `<button class="${K.tab === k ? "active" : ""}" data-tab="${k}">${l}</button>`).join("")}</div>
          ${K.tab === "bew" ? `<div class="sec">${(r.wahl || []).map((w, wi) => `<div class="wahl"><b class="small">${icon("shuffle")} ${esc(w.label)}</b><div class="row mt-s">${w.groups.map((g) => `<label class="radio"><input type="radio" name="w${wi}" value="${g}" ${c.wahl.includes(g) ? "checked" : ""} ${edit ? "" : "disabled"}> Aufgabe ${esc(g)}</label>`).join("")}</div></div>`).join("")}
            <table class="rtable"><thead><tr><th>Aufgabe</th><th class="num">max.</th><th class="num">${r.mode === "np" ? "NP" : "BE"}</th></tr></thead><tbody>
            ${PX.chosenTasks(r, c).map((t) => `<tr class="${focus === t.id ? "focus" : ""}"><td><b>${esc(t.no)}</b> <span class="small">${esc(t.title)}</span></td><td class="num">${t.be}</td><td class="num"><input class="input sm num" type="number" min="0" max="${t.be}" data-be="${t.id}" value="${c.be[t.id] ?? ""}" ${edit ? "" : "disabled"}></td></tr>`).join("")}
            </tbody></table>
            ${r.mode !== "np" ? `<div class="ptotal row between"><span>Summe</span><span>${res.sum} / ${res.max} BE (${Math.round(res.pct || 0)} %)</span></div>
            <div class="row between small mt-s"><span>Notenschlüssel</span><b>${res.npRaw ?? "–"} NP</b></div>` : ""}
            <div class="row between small mt-s"><label for="abz">Abzug Sprachrichtigkeit/Form</label><select class="select sm" id="abz" style="width:90px" ${edit ? "" : "disabled"}>${[0, 1, 2].map((v) => `<option value="${v}" ${+c.abzug === v ? "selected" : ""}>−${v} NP</option>`).join("")}</select></div>
            <div class="npbig ${st}"><span>Notenpunkte</span><b>${res.np ?? "–"}</b></div>
            ${!res.complete ? `<div class="xs muted">${icon("info")} Alle Aufgaben bewerten${(r.wahl || []).length ? " und Wahlaufgabe festlegen" : ""}, dann berechnet das System die Notenpunkte.</div>` : ""}
            ${edit ? `<button class="btn primary block mt" id="finish" ${res.complete ? "" : "disabled"}>${icon("check")} Korrektur dieser Mappe abschließen</button>` : c.state === "fertig" && PX.stageOpen(PX.km(m.km), st) && !PX.km(m.km).stages[st].lkDone.includes(me().id) && !lockOther ? `<button class="btn block mt" id="reopen">${icon("pencil")} Wieder öffnen</button>` : ""}
            ${c.state === "fertig" ? `<button class="btn block mt-s" id="report">${icon("file-text")} ${PX.STAGE[st]}sbericht</button>` : ""}</div>`
          : K.tab === "gut" ? `<div class="sec"><label class="lbl">Textliches Gutachten</label><textarea class="input" id="gut" rows="12" ${edit ? "" : "disabled"}>${esc(c.gutachten)}</textarea><div class="xs muted mt-s">Revisionssicher gespeichert, Bestandteil der digitalen Mappe.</div></div>`
          : K.tab === "hin" ? `<div class="sec"><h4>Bewertungsgrundlagen</h4><button class="doclink" data-ewh>${icon("file-text")} Erwartungshorizont</button>${ex.guideline ? `<div class="small">${icon("book-text")} ${esc(PX.byId("guidelines", ex.guideline).name)}</div>` : ""}
              <h4 class="mt">Nachteilsausgleich</h4><p class="small">${m.nta ? esc(m.nta) : "keiner"}</p>
              <h4 class="mt">Notizen (nur für Sie)</h4>${notes.length ? notes.map((n) => `<div class="small noteitem">✎ ${esc(n.text)} <button class="link xs" data-delnote="${n.id}">löschen</button></div>`).join("") : `<p class="small muted">Keine Notizen.</p>`}
              ${st === "ek" ? `<h4 class="mt">Zusatzdokumente</h4><p class="small muted">${ex.zusatz ? "Upload erlaubt." : "Für diese Prüfung nicht vorgesehen."}</p><h4 class="mt">Schwärzungen</h4><p class="small">${(c.redactions || []).length} Bereich(e) geschwärzt ${(c.redactions || []).length ? `<button class="link xs" id="clrred">alle entfernen</button>` : ""}</p>` : ""}</div>`
          : vorHtml(m, r)}
        </aside></div>`;
  }
  function vorHtml(m, r) {
    const tab = (s) => { const c = m.corr[s]; const res = PX.result(c, r); return `<h4 class="mt">${PX.STAGE[s]} <span class="badge ${PX.stageColor[s]}">${c?.np ?? "–"} NP</span></h4><table class="rtable">${PX.chosenTasks(r, c).map((t) => `<tr><td>${esc(t.no)}</td><td class="num">${c?.be?.[t.id] ?? "–"} / ${t.be}</td></tr>`).join("")}<tr><td>Summe</td><td class="num"><b>${res.sum}</b></td></tr></table>`; };
    return `<div class="sec"><p class="small">Abweichung EK/ZK: <b>${m.diff ?? "–"} NP</b>${m.ebRequired ? " → Endbeurteilung verpflichtend" : ""}</p>${tab("ek")}${tab("zk")}<div class="row mt"><button class="btn sm" data-rep="ek">${icon("file-text")} EK-Bericht</button><button class="btn sm" data-rep="zk">${icon("file-text")} ZK-Bericht</button></div></div>`;
  }
  function pushUndo(c) { K.undo.push(JSON.stringify(c)); if (K.undo.length > 30) K.undo.shift(); }
  function mountMode(root, m, st) {
    if (!m) return;
    const km = PX.km(m.km); const ex = PX.exam(km.exam); const anon = st !== "ek";
    const edit = canEdit(m, st);
    if (edit && (!m.lock || m.lock.pid !== me().id)) { O().lock(m.id, st, me().id); PX.save(); }
    const c = PX.corr(m, st);
    const pages = PX.pagesOf(m).filter((p) => !anon || p.kind !== "deckblatt");
    const page = pages[K.page];
    const save = () => { PX.save(); PX.rerender(); PX.guide && PX.guide.check(); };
    $$("[data-goto]", root).forEach((b) => (b.onclick = () => PX.go(`#/korr/m/${b.dataset.goto}/${st}`)));
    $$("[data-pg]", root).forEach((b) => (b.onclick = () => { K.page = +b.dataset.pg; K.sel = null; PX.rerender(); }));
    $$("[data-tab]", root).forEach((b) => (b.onclick = () => { K.tab = b.dataset.tab; PX.rerender(); }));
    $$("[data-tool]", root).forEach((b) => (b.onclick = () => { K.tool = b.dataset.tool; PX.rerender(); }));
    $$("[data-sign]", root).forEach((b) => (b.onclick = () => { K.tool = "sign"; K.sign = b.dataset.sign; PX.rerender(); }));
    $("#kzi", root).onclick = () => { K.zoom = Math.min(1.8, K.zoom + 0.15); PX.rerender(); }; $("#kzo", root).onclick = () => { K.zoom = Math.max(0.7, K.zoom - 0.15); PX.rerender(); };
    $$("[data-ewh]", root).forEach((b) => (b.onclick = () => (PX.examPassed(ex) ? PX.showEWH(ex) : PX.toast("Noch nicht sichtbar", "", "info"))));
    $$("[data-rep]", root).forEach((b) => (b.onclick = () => window.open(location.href.split("#")[0] + `#/druck/bericht/${b.dataset.rep}/${m.id}`, "_blank")));
    const rep = $("#report", root); if (rep) rep.onclick = () => window.open(location.href.split("#")[0] + `#/druck/bericht/${st}/${m.id}`, "_blank");
    $$("[data-trot]", root).forEach((b) => (b.onclick = () => { O().rotate(m.scan, [b.dataset.trot], 90); save(); }));
    $$("[data-tmv]", root).forEach((b) => (b.onclick = () => { const [pid, d] = b.dataset.tmv.split("|"); O().movePage(m.scan, pid, +d); save(); }));
    $$("[data-delnote]", root).forEach((b) => (b.onclick = () => { pushUndo(c); c.notes = c.notes.filter((n) => n.id !== b.dataset.delnote); PX.audit("Notiz gelöscht", st === "ek" ? m.nr : PX.pseudo(m)); save(); }));
    const clr = $("#clrred", root); if (clr) clr.onclick = () => { pushUndo(c); c.redactions = []; save(); };
    if (!edit) return;
    // Bewertung
    $$("[data-be]", root).forEach((i) => (i.onchange = () => { const t = PX.raster(ex).tasks.find((x) => x.id === i.dataset.be); let v = i.value === "" ? "" : Math.max(0, Math.min(t.be, Math.round(+i.value))); pushUndo(c); if (v === "") delete c.be[t.id]; else c.be[t.id] = v; save(); setTimeout(() => { const n = $$("[data-be]")[$$("[data-be]").findIndex((x) => x.dataset.be === t.id) + 1]; n && n.focus(); }, 0); }));
    $$("input[type=radio][name^=w]", root).forEach((i) => (i.onchange = () => { pushUndo(c); const w = PX.raster(ex).wahl[+i.name.slice(1)]; c.wahl = c.wahl.filter((g) => !w.groups.includes(g)).concat(i.value); save(); }));
    const ab = $("#abz", root); if (ab) ab.onchange = () => { pushUndo(c); c.abzug = +ab.value; save(); };
    const gt = $("#gut", root); if (gt) gt.onchange = () => { c.gutachten = gt.value; PX.save(); };
    const un = $("#undo", root); if (un) un.onclick = () => { const s = K.undo.pop(); if (s) { m.corr[st] = JSON.parse(s); save(); } };
    const fi = $("#finish", root); if (fi) fi.onclick = async () => {
      const ok = await PX.confirm("Korrektur dieser Mappe abschließen?", `${esc(mTitle(m, st))}: ${PX.result(c, PX.raster(ex)).np} Notenpunkte. ${st === "ek" && !(c.redactions || []).length ? "Hinweis: Es wurden keine Bereiche geschwärzt." : ""} Die Mappe wird entsperrt.`, "Abschließen");
      if (!ok) return; const res = O().finishMappe(m.id, st); if (!res.ok) return PX.toast("Abschluss nicht möglich", res.msg, "warn");
      PX.save(); PX.toast("Mappe korrigiert", `${res.np} NP – ${PX.STAGE[st]}sbericht erzeugt`);
      const list = PX.activeMappen(km).filter((x) => (st !== "eb" || x.ebRequired) && x.corr[st]?.state !== "fertig" && !(x.lock && x.lock.pid !== me().id));
      if (list.length) PX.go(`#/korr/m/${list[0].id}/${st}`); else PX.go(`#/korr/km/${km.id}/${st}`);
    };
    const ro = $("#reopen", root); if (ro) ro.onclick = () => { O().reopenMappe(m.id, st); save(); };
    // Klicks auf die Seite
    const host = $("#host", root); const sheet = host && host.querySelector(".sheet"); if (!sheet || !page) return;
    const pos = (e) => { const b = sheet.getBoundingClientRect(); return { x: Math.round(((e.clientX - b.left) / b.width) * 1000) / 10, y: Math.round(((e.clientY - b.top) / b.height) * 1000) / 10 }; };
    sheet.addEventListener("click", (e) => {
      const mk = e.target.closest("[data-mk]");
      if (mk) { const own = c.marks.find((x) => x.id === mk.dataset.mk); if (own) { K.sel = own.id; PX.rerender(); } return; }
      if (e.target.closest("[data-nt]")) { const n = c.notes.find((x) => x.id === e.target.closest("[data-nt]").dataset.nt); n && PX.toast("Notiz", esc(n.text), "info"); return; }
      const p = pos(e);
      if (K.tool === "sign") { pushUndo(c); c.marks.push({ id: PX.uid("k"), page: page.id, x: p.x, y: p.y, code: K.sign }); save(); }
      if (K.tool === "text") textDialog("Randbemerkung", "", (t) => { pushUndo(c); c.marks.push({ id: PX.uid("k"), page: page.id, x: p.x, y: p.y, code: "»", text: t }); save(); });
      if (K.tool === "note") textDialog("Private Notiz", "Keine personenbezogenen Daten und keine Punktangaben.", (t) => { if (/\d+\s*(BE|NP|Punkte)/i.test(t)) return PX.toast("Nicht zulässig", "Notizen dürfen keine Bewertungsangaben enthalten.", "warn"); pushUndo(c); c.notes.push({ id: PX.uid("n"), page: page.id, x: p.x, y: p.y, text: t, by: me().id }); PX.audit("Notiz erstellt", st === "ek" ? m.nr : PX.pseudo(m), "Inhalt nur für Verfasser:in sichtbar"); save(); });
      if (K.tool === "select") { K.sel = null; PX.rerender(); }
    });
    if (K.tool === "redact") {
      let start = null, box = null;
      sheet.addEventListener("mousedown", (e) => { e.preventDefault(); start = pos(e); box = document.createElement("span"); box.className = "redact drawing"; sheet.querySelector(".overlay").appendChild(box); });
      sheet.addEventListener("mousemove", (e) => { if (!start) return; const p = pos(e); Object.assign(box.style, { left: Math.min(start.x, p.x) + "%", top: Math.min(start.y, p.y) + "%", width: Math.abs(p.x - start.x) + "%", height: Math.abs(p.y - start.y) + "%" }); });
      window.addEventListener("mouseup", function up(e) { window.removeEventListener("mouseup", up); if (!start) return; const p = pos(e); const w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y); if (w > 2 && h > 1) { pushUndo(c); c.redactions = c.redactions || []; c.redactions.push({ id: PX.uid("r"), page: page.id, x: Math.min(start.x, p.x), y: Math.min(start.y, p.y), w, h }); PX.audit("Personenbezogene Daten geschwärzt", m.nr, "Seite " + (K.page + 1)); } start = null; save(); }, { once: false });
    }
    document.onkeydown = (e) => { if (!/^#\/korr\/m\//.test(location.hash)) return; if ((e.key === "Delete" || e.key === "Backspace") && K.sel && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { pushUndo(c); c.marks = c.marks.filter((x) => x.id !== K.sel); K.sel = null; save(); } };
  }
  function textDialog(title, hint, cb) {
    PX.modal({ title, size: "narrow", body: `${hint ? `<p class="xs muted">${esc(hint)}</p>` : ""}<textarea class="input" id="tx" rows="3"></textarea>`, foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Übernehmen</button>`, onMount: (m, close) => { $("#tx", m).focus(); $("[data-ok]", m).onclick = () => { const t = $("#tx", m).value.trim(); if (!t) return; close(); cb(t); }; } });
  }
})();
