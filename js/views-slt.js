/* PASCA Klickdummy – Rolle Schulleitungsteam */
(function () {
  "use strict";
  const PX = window.PX; const { esc, icon, $, $$ } = PX; const O = () => PX.ops;
  const need = ["slt"];
  const school = () => PX.me()?.org;
  PX.ui = PX.ui || {};
  const curExam = () => PX.exam(PX.ui.exam) || PX.mainExam() || PX.S.exams.find((e) => e.status === "angelegt");
  const examSelect = () => { const ex = curExam(); const list = PX.S.exams.filter((e) => e.status === "angelegt"); return list.length ? `<label class="examsel">${icon("clipboard-list")}<select class="select" id="exsel">${list.map((e) => `<option value="${e.id}" ${ex && e.id === ex.id ? "selected" : ""}>${esc(PX.examLabel(e))} · ${PX.fmtD(e.date)}</option>`).join("")}</select></label>` : ""; };
  const bindExam = (r) => { const s = $("#exsel", r); if (s) s.onchange = () => { PX.ui.exam = s.value; PX.rerender(); }; };
  const myKms = (ex) => PX.S.kms.filter((k) => k.school === school() && (!ex || k.exam === ex.id));
  const subjTeachers = (subject) => PX.S.persons.filter((p) => p.org === school() && p.roles.includes("lk") && (p.subjects || []).includes(subject));

  // ---------- Übersicht ----------
  PX.route(/^slt$/, () => ({ title: "Übersicht", shell: "staff", need, render: () => {
    const ex = curExam(); const org = PX.org(school());
    if (!ex) return PX.pagehead("Übersicht", esc(org.name)) + PX.empty("Es sind noch keine Prüfungen angelegt. Das IBBW informiert Sie, sobald Prüfungen vorliegen.", "calendar");
    const kms = myKms(ex); const imp = PX.S.imports[school() + "|" + ex.id];
    const groups = PX.S.groups.filter((g) => g.exam === ex.id);
    const rpRel = PX.S.rp[org.rp]?.released;
    const todo = [];
    if (!imp) todo.push(["upload", "Prüfungsdaten importieren (ASV oder CSV)", "#/slt/import"]);
    if (imp && imp.unresolved.some((u) => !u.done)) todo.push(["circle-alert", `${imp.unresolved.filter((u) => !u.done).length} ungeklärte(n) Datensatz/Datensätze zuordnen`, "#/slt/import"]);
    if (kms.some((k) => k.status !== "freigegeben")) todo.push(["folder-check", `${kms.filter((k) => k.status !== "freigegeben").length} Kursmappe(n) prüfen und freigeben`, "#/slt/kursmappen"]);
    if (rpRel) { const open = groups.filter((g) => (g.ek.school === school() && !g.ek.confirmed) || (g.zk.school === school() && !g.zk.confirmed) || (g.eb.school === school() && !g.eb.confirmed)).length; if (open) todo.push(["user-check", `${open} Korrekturzuweisung(en) bestätigen`, "#/slt/korrektoren"]); }
    if (kms.some((k) => k.status === "freigegeben" && !k.covers)) todo.push(["printer", "Deckblätter für den Prüfungstag erzeugen", "#/slt/pruefungstag"]);
    const confirmNeeded = standRows(ex).filter((r) => r.canConfirm).length; if (confirmNeeded) todo.push(["clipboard-check", `${confirmNeeded} Korrekturabschluss/-abschlüsse bestätigen`, "#/slt/stand"]);
    if (kms.some((k) => k.stages.eb.sltOk && !k.exported)) todo.push(["file-check", "Prüfungsergebnisse für ASV exportieren", "#/slt/ergebnisse"]);
    const warn = PX.S.notes.filter((n) => n.to === PX.me().id && !n.read && /Frist/.test(n.text));
    return `${PX.pagehead("Übersicht", esc(org.name) + ", " + esc(org.city), examSelect())}
      ${warn.map((n) => `<div class="notice warn">${icon("alarm-clock")}<div><b>Fristhinweis</b><br>${esc(n.text)}</div></div>`).join("")}
      <div class="statgrid"><div class="stat"><div class="v">${kms.length}</div><div class="small muted">Kursmappen</div></div><div class="stat"><div class="v">${PX.sum(kms.map((k) => PX.activeMappen(k).length))}</div><div class="small muted">Prüflinge (teilnehmend)</div></div>
      <div class="stat"><div class="v">${groups.filter((g) => g.zk.school === school()).length}</div><div class="small muted">Zweitkorrekturen für andere Schulen</div></div><div class="stat"><div class="v">${groups.filter((g) => g.eb.school === school()).length}</div><div class="small muted">Endbeurteilungen</div></div></div>
      <div class="grid2 mt"><div class="card pad"><h3>${icon("list-checks")} Nächste Schritte</h3>${todo.length ? `<ul class="todo">${todo.map(([ic, t, h]) => `<li><a href="${h}">${icon(ic)} ${esc(t)} ${icon("chevron-right")}</a></li>`).join("")}</ul>` : `<p class="small muted">${icon("circle-check")} Derzeit sind keine Aufgaben offen.</p>`}</div>
      <div class="card pad"><h3>${icon("calendar-range")} Termine ${esc(PX.subj(ex.subject).short)}</h3><div class="timeline">${[["Prüfung", ex.date], ["Ende Erstkorrektur", ex.ekEnd], ["Ende Zweitkorrektur", ex.zkEnd], ["Beginn Endbeurteilung", ex.ebStart], ["Ende Endbeurteilung", ex.ebEnd]].map(([l, d]) => `<div class="${d <= PX.S.now ? "past" : ""}"><b>${PX.fmtD(d)}</b><span>${l}</span></div>`).join("")}</div></div></div>
      ${kms.length ? `<h2 class="mt-l">Kursmappen der Schule</h2>${kmTable(kms)}` : ""}`;
  }, mount: bindExam }));
  function kmTable(kms) {
    return `<div class="tablewrap"><table class="tbl"><thead><tr><th>Kursmappe</th><th>Kurslehrkraft</th><th>Prüflinge</th><th>Phase</th><th>Fortschritt</th></tr></thead><tbody>${kms.map((k) => { const p = PX.phase(k); return `<tr><td><a href="#/slt/kursmappe/${k.id}"><b>${esc(k.name)}</b></a><div class="xs muted">${esc(k.course)}</div></td><td>${k.teachers.map(PX.name).map(esc).join(", ")}</td><td>${PX.activeMappen(k).length}${PX.mappenOf(k).length !== PX.activeMappen(k).length ? ` <span class="xs muted">(+${PX.mappenOf(k).length - PX.activeMappen(k).length} n. t.)</span>` : ""}</td><td>${PX.badge(p.label, p.kind)}</td><td style="min-width:260px">${PX.phaseBar(k)}</td></tr>`; }).join("")}</tbody></table></div>`;
  }

  // ---------- Datenimport ----------
  let showData = false, dataQ = "";
  PX.route(/^slt\/import$/, () => ({ title: "Datenimport", shell: "staff", need, render: () => {
    const ex = curExam(); if (!ex) return PX.needExam();
    const key = school() + "|" + ex.id; const imp = PX.S.imports[key]; const kms = myKms(ex);
    const anyReleased = kms.some((k) => k.status === "freigegeben");
    return `${PX.pagehead("Datenimport", "Kurs-, Lehrkraft- und Prüflingsdaten für eine konkrete Prüfung", examSelect())}
      <div class="grid2"><div class="card pad importcard"><div class="rico">${icon("database", "lg")}</div><h3>Aus ASV-BW importieren</h3><p class="small muted">Übernahme der Kurse, Lehrkräfte und Prüflinge über den ASV-Webservice. ASV ist Single Point of Truth – Änderungen erfolgen in ASV und werden erneut importiert.</p>
        <button class="btn primary" id="asv" ${anyReleased ? "disabled" : ""}>${icon("download")} Daten aus ASV importieren</button></div>
        <div class="card pad importcard"><div class="rico">${icon("file-spreadsheet", "lg")}</div><h3>CSV-Datei hochladen</h3><p class="small muted">Alternative, falls die ASV-Schnittstelle nicht verfügbar ist oder Prüflinge anderer Schulen teilnehmen. Es liegt immer nur eine CSV-Datei vor; ein neuer Upload ersetzt die vorherige.</p>
        <div class="dropzone sm" id="dz">${icon("upload")} <span>CSV hierher ziehen oder <u>auswählen</u></span><input type="file" accept=".csv,text/csv" id="csvf"></div><button class="link xs mt-s" id="csvtpl">${icon("download")} CSV-Vorlage herunterladen</button></div></div>
      ${anyReleased ? `<div class="notice info mt">${icon("lock")}<div class="small">Mindestens eine Kursmappe ist bereits freigegeben. Ein erneuter Import, der freigegebene Kursmappen betrifft, erfordert einen gesonderten Freigabeschritt.</div></div>` : ""}
      ${imp ? `<div class="card pad mt"><div class="row between"><h3>${icon("circle-check")} Verarbeitungsergebnis</h3>${PX.badge(imp.source === "ASV" ? "Quelle: ASV" : "Quelle: CSV", imp.source === "ASV" ? "cyan" : "purple")}</div>
        ${PX.kv([["Importiert am", PX.fmtD(imp.at)], ["Datei / Quelle", esc(imp.file)], ["Kursmappen erzeugt", String(kms.length)], ["Digitale Mappen Prüfling", String(PX.sum(kms.map((k) => PX.mappenOf(k).length)))], ["Abgleich Lehrkräfte mit GeDAB", `${icon("check")} keine Abweichungen`]])}
        ${imp.unresolved.length ? `<h4 class="mt">${icon("circle-alert")} Ungeklärte Datensätze</h4><div class="tablewrap"><table class="tbl"><thead><tr><th>Prüfling</th><th>Kurs laut Import</th><th>Grund</th><th>Zuordnung</th></tr></thead><tbody>${imp.unresolved.map((u, i) => `<tr><td>${esc(u.student.first)} ${esc(u.student.last)} <span class="xs muted">${esc(u.student.id.toUpperCase())}</span></td><td>${esc(u.course)}</td><td class="small">${esc(u.reason)}</td><td>${u.done ? `${PX.badge("zugeordnet → " + PX.km(u.done)?.name, "green")}` : `<div class="row"><select class="select" data-res="${i}"><option value="">Kursmappe wählen …</option>${kms.map((k) => `<option value="${k.id}">${esc(k.name)}</option>`).join("")}</select><button class="btn sm" data-resok="${i}">Zuordnen</button></div>`}</td></tr>`).join("")}</tbody></table></div>
          <p class="xs muted mt-s">Nicht eindeutig zuordenbare Datensätze führen nicht zu einer verbindlichen Zuordnung. Die Zuordnung wird erst mit der Freigabe der Kursmappe verbindlich.</p>` : ""}
        <div class="row mt"><a class="btn primary" href="#/slt/kursmappen">${icon("folder-open")} Zu den Kursmappen</a><button class="btn" id="showdata">${icon(showData ? "eye-off" : "eye")} Importierte Daten ${showData ? "ausblenden" : "anzeigen"}</button></div></div>
        ${showData ? importedData(ex, kms) : ""}` : ""}`;
  }, mount: (r) => {
    bindExam(r); const ex = curExam(); if (!ex) return;
    const key = school() + "|" + ex.id;
    const run = async (src) => { if (PX.S.imports[key] && !(await PX.confirm("Daten erneut importieren?", "Die bestehenden Importdaten dieser Prüfung werden ersetzt. Differenz- und Konsistenzprüfung: keine Konflikte mit freigegebenen Kursmappen.", "Ersetzen"))) return; importAnim(src, () => { const res = O().importData(school(), ex.id, src); if (res) { PX.commit(); PX.toast("Import abgeschlossen", `${res.courses} Kursmappe(n), ${res.students} Datensätze${res.unresolved.length ? `, ${res.unresolved.length} ungeklärt` : ""}`); } }); };
    const a = $("#asv", r); if (a) a.onclick = () => run("ASV");
    const f = $("#csvf", r); if (f) f.onchange = () => { const x = f.files[0]; if (!x) return; if (!/\.csv$/i.test(x.name)) return PX.toast("Format nicht unterstützt", "Bitte eine CSV-Datei hochladen (Trennzeichen „;“, UTF-8).", "error"); run("CSV"); };
    $("#csvtpl", r).onclick = () => PX.download("pasca_import_vorlage.csv", PX.csv([["schulnummer", "kurs_id", "kursname", "pruefungsfach", "lehrkraft_id", "pruefling_id", "vorname", "nachname"], ["AFS", "AFS-WG13a", "WG13a", "VBWL", "j.kroeger", "AFS-0412", "Lea", "Hoffmann"]]));
    $$("[data-resok]", r).forEach((b) => (b.onclick = () => { const i = +b.dataset.resok; const sel = $(`[data-res="${i}"]`, r).value; if (!sel) return PX.toast("Bitte Kursmappe wählen", "", "warn"); O().resolveRecord(key, i, sel); PX.commit(); PX.toast("Datensatz zugeordnet", "Digitale Mappe Prüfling angelegt."); }));
    const sd = $("#showdata", r); if (sd) sd.onclick = () => { showData = !showData; PX.rerender(); };
    const q = $("#dq", r); if (q) q.oninput = PX.debounce(() => { dataQ = q.value; PX.rerender(); const i = $("#dq"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250);
  } }));
  function importAnim(src, done) {
    const close = PX.modal({ title: src === "ASV" ? "Import aus ASV-BW" : "CSV-Import", icon: "database", body: `<div class="progress-steps">${["Verbindung / Datei prüfen (Format, Codierung, Schema)", "Kurs-, Lehrkraft- und Prüflingsdaten verarbeiten", "Kursmappen und digitale Mappen erzeugen", "Abgleich Lehrkräfte mit GeDAB-Stammdaten"].map((t, i) => `<div data-ps="${i}">${icon("circle")} ${t}</div>`).join("")}</div><div class="bigbar mt"><i id="pb"></i></div>` });
    let i = 0; const tick = () => { const el = document.querySelector(`[data-ps="${i}"]`); if (el) { el.innerHTML = el.innerHTML.replace(/<svg[\s\S]*?<\/svg>/, icon("circle-check")); el.classList.add("ok"); } i++; const pb = document.getElementById("pb"); if (pb) pb.style.width = (i * 25) + "%"; if (i < 4) setTimeout(tick, 280); else setTimeout(() => { close(); done(); }, 300); };
    setTimeout(tick, 250);
  }
  function importedData(ex, kms) {
    const rows = kms.flatMap((k) => PX.mappenOf(k).map((m) => ({ k, m }))).filter(({ k, m }) => !dataQ || `${k.name} ${m.first} ${m.last} ${m.nr} ${k.teachers.map(PX.name).join(" ")}`.toLowerCase().includes(dataQ.toLowerCase()));
    return `<div class="card pad mt"><div class="row between"><h3>${icon("table")} Importierte Daten</h3><div class="search" style="width:280px"><input class="input" id="dq" placeholder="Freitextsuche" value="${esc(dataQ)}">${icon("search")}</div></div>
      <div class="tablewrap mt-s"><table class="tbl compact"><thead><tr><th>Kurs</th><th>Lehrkraft</th><th>Prüflings-ID</th><th>Name</th><th>Quelle</th></tr></thead><tbody>${rows.map(({ k, m }) => `<tr><td>${esc(k.course)}</td><td>${k.teachers.map(PX.name).map(esc).join(", ")}</td><td>${esc(m.nr)}</td><td>${esc(m.last)}, ${esc(m.first)}</td><td>${PX.badge(PX.S.imports[school() + "|" + ex.id].source, "gray")}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">Keine Treffer</td></tr>`}</tbody></table></div><p class="xs muted mt-s">Importierte Schüler- und Lehrerdaten sind nicht editierbar.</p></div>`;
  }

  // ---------- Kursmappen ----------
  PX.route(/^slt\/kursmappen$/, () => ({ title: "Kursmappen", shell: "staff", need, render: () => {
    const ex = curExam(); if (!ex) return PX.needExam(); const kms = myKms(ex);
    return `${PX.pagehead("Kursmappen", "Prüfen, korrigieren und freigeben", examSelect() + `<button class="btn" id="newkm">${icon("plus")} Kursmappe manuell anlegen</button>`)}
      ${kms.length ? `<div class="kmgrid">${kms.map((k) => { const p = PX.phase(k); const act = PX.activeMappen(k); return `<div class="kmcard ${k.status === "freigegeben" ? "ok" : ""}"><div class="row between"><div><h3>${icon("folder")} ${esc(k.name)}</h3><div class="xs muted">${esc(k.course)} · ${esc(PX.subj(ex.subject).name)}</div></div>${PX.badge(k.status === "freigegeben" ? "freigegeben" : "nicht freigegeben", k.status === "freigegeben" ? "green" : "yellowb")}</div>
        ${PX.kv([["Kurslehrkraft (EK)", k.teachers.map(PX.name).map(esc).join(", ") || `<span class="badge red">fehlt</span>`], ["Prüflinge", `${act.length} digitale Mappen`], ["Phase", PX.badge(p.label, p.kind)]])}
        <div class="row mt-s"><a class="btn sm" href="#/slt/kursmappe/${k.id}">${icon("folder-open")} Öffnen</a>${k.status !== "freigegeben" ? `<button class="btn sm primary" data-rel="${k.id}">${icon("check")} Freigeben</button>` : ""}</div></div>`; }).join("")}</div>
        ${kms.some((k) => k.status !== "freigegeben") ? `<div class="row mt"><button class="btn primary" id="relall">${icon("folder-check")} Alle Kursmappen freigeben</button><span class="small muted">Erst mit der Freigabe werden die Zuordnungen verbindlich und die Korrekturgruppenbildung kann beginnen.</span></div>` : `<div class="notice success mt">${icon("circle-check")}<div>Alle Kursmappen sind freigegeben. Das Regierungspräsidium bildet die Korrekturgruppen.</div></div>`}`
        : PX.empty(`Noch keine Kursmappen. <a href="#/slt/import">Daten importieren</a>`, "folder")}`;
  }, mount: (r) => {
    bindExam(r); const ex = curExam(); if (!ex) return;
    const rel = async (ids) => { const bad = ids.map(PX.km).filter((k) => !k.teachers.length || !PX.mappenOf(k).length); if (bad.length) return PX.toast("Freigabe nicht möglich", `${bad.map((k) => k.name).join(", ")}: Lehrkraft oder Prüflinge fehlen.`, "warn"); const imp = PX.S.imports[school() + "|" + ex.id]; if (imp && imp.unresolved.some((u) => !u.done) && !(await PX.confirm("Ungeklärte Datensätze vorhanden", "Es gibt noch ungeklärte Datensätze. Trotzdem freigeben?", "Trotzdem freigeben"))) return; if (!(await PX.confirm("Kursmappen freigeben?", `${ids.length} Kursmappe(n) mit allen digitalen Mappen werden verbindlich freigegeben.`, "Freigeben"))) return; ids.forEach((id) => O().releaseKM(id)); PX.commit(); PX.toast("Kursmappen freigegeben", ids.map((id) => PX.km(id).name).join(", ")); };
    $$("[data-rel]", r).forEach((b) => (b.onclick = () => rel([b.dataset.rel])));
    const ra = $("#relall", r); if (ra) ra.onclick = () => rel(myKms(ex).filter((k) => k.status !== "freigegeben").map((k) => k.id));
    $("#newkm", r).onclick = () => PX.modal({ title: "Kursmappe manuell anlegen", icon: "folder", body: `<div class="notice info">${icon("info")}<div class="small">Notlösung, wenn eine Kursmappe nicht aus den Importdaten erzeugt werden konnte. Lehrkräfte und Prüflinge stammen ausschließlich aus den Importdaten.</div></div><div class="field mt"><label class="lbl">Name der Kursmappe (eindeutig) *</label><input class="input" id="kn"></div>`, foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Anlegen</button>`,
      onMount: (m, close) => { $("[data-ok]", m).onclick = () => { const n = $("#kn", m).value.trim(); if (!n) return; if (myKms(ex).some((k) => k.name === n)) return PX.toast("Name bereits vergeben", "Kursmappennamen müssen eindeutig sein.", "warn"); const km = { id: PX.uid("km-"), exam: ex.id, school: school(), course: "manuell", name: n, teachers: [], status: "entwurf", scanReleased: false, covers: false, exported: false, stages: { ek: { lkDone: [], sltOk: false }, zk: { lkDone: [], sltOk: false }, eb: { lkDone: [], sltOk: false } } }; PX.S.kms.push(km); PX.audit("Kursmappe manuell angelegt", n); close(); PX.commit(); PX.go("#/slt/kursmappe/" + km.id); }; } });
  } }));

  PX.route(/^slt\/kursmappe\/([^/]+)$/, (m) => ({ title: "Kursmappe", shell: "staff", need, render: () => {
    const k = PX.km(m[1]); if (!k || k.school !== school()) return PX.empty("Kursmappe nicht gefunden");
    const ex = PX.exam(k.exam); const locked = k.status === "freigegeben"; const all = PX.mappenOf(k);
    const g = PX.groupOf(k); const done = k.stages.eb.sltOk;
    return `${PX.pagehead("Kursmappe " + k.name, `${esc(PX.examLabel(ex))} · ${esc(k.course)}`, `<a class="btn" href="#/slt/kursmappen">${icon("arrow-left")} Alle Kursmappen</a>${!locked ? `<button class="btn" id="rename">${icon("pencil")} Umbenennen</button><button class="btn danger" id="delkm">${icon("trash-2")}</button><button class="btn primary" id="rel1">${icon("check")} Freigeben</button>` : ""}`)}
      ${PX.phaseBar(k)}
      <div class="grid2 mt"><div class="card pad"><h3>${icon("users")} Lehrkräfte (Erstkorrektur)</h3>
        ${k.teachers.length ? `<ul class="plain">${k.teachers.map((t) => `<li class="row between"><span>${icon("user")} ${esc(PX.name(t))}</span>${locked ? "" : `<button class="btn xs" data-rmt="${t}">Zuordnung entfernen</button>`}</li>`).join("")}</ul>` : `<p class="small" style="color:var(--red)">Keine Lehrkraft zugeordnet.</p>`}
        ${locked ? `<p class="xs muted">Freigegeben – Änderungen der Erstkorrektur erfolgen unter „Korrektor:innen“.</p>` : `<div class="row mt-s"><select class="select" id="addt">${subjTeachers(ex.subject).filter((p) => !k.teachers.includes(p.id)).map((p) => `<option value="${p.id}">${esc(PX.name(p))}</option>`).join("")}</select><button class="btn sm" id="addtb">${icon("user-round-plus")} Lehrkraft zufügen</button></div><p class="xs muted mt-s">Auswahl nur aus den importierten Lehrkräften.</p>`}</div>
      <div class="card pad"><h3>${icon("network")} Korrekturgruppe</h3>${g && PX.S.rp[PX.org(k.school).rp]?.released ? PX.kv([["Erstkorrektur", `${esc(PX.orgShort(g.ek.school))} · ${g.ek.teachers.map(PX.name).map(esc).join(", ")}`], ["Zweitkorrektur", `${esc(PX.orgName(g.zk.school))}${g.zk.confirmed ? "" : " <span class='xs muted'>(Lehrkraft wird von der Schule bestimmt)</span>"}`], ["Endbeurteilung", `${esc(PX.orgName(g.eb.school))}`]]) + `<p class="xs muted">Namen der Zweit- und Endbeurteiler:innen anderer Schulen werden nicht angezeigt.</p>` : `<p class="small muted">Wird nach der Freigabe aller Kursmappen vom Regierungspräsidium gebildet.</p>`}</div></div>
      <h2 class="mt-l">Digitale Mappen Prüfling (${all.length})</h2>
      <div class="tablewrap"><table class="tbl"><thead><tr><th>Prüflings-ID</th><th>Name</th><th>Nachteilsausgleich</th><th>Teilnahme</th><th>Scan</th>${done ? "<th>Endnote</th>" : ""}${locked ? "" : "<th></th>"}</tr></thead><tbody>
      ${all.map((x) => `<tr class="${x.absent ? "dim" : ""}"><td>${esc(x.nr)}</td><td>${esc(x.last)}, ${esc(x.first)}</td><td class="small">${x.nta ? esc(x.nta) : "–"}</td><td>${x.absent ? PX.badge("nicht teilgenommen (" + x.absent + ")", "red") : PX.badge("teilnehmend", "gray")}${x.nachtermin ? `<div class="xs muted">Nachtermin: ${esc(PX.exam(x.nachtermin) ? PX.fmtD(PX.exam(x.nachtermin).date) : "vorgemerkt")}</div>` : ""}</td><td>${x.scan ? PX.badge("eingescannt", "cyan") : "–"}</td>${done ? `<td><b>${x.final?.np != null ? PX.fmtNP(x.final.np) + " NP" : "–"}</b></td>` : ""}${locked ? "" : `<td><button class="btn xs" data-rmm="${x.id}">Zuordnung entfernen</button></td>`}</tr>`).join("")}</tbody></table></div>`;
  }, mount: (r) => {
    const k = PX.km(m[1]); if (!k) return;
    const b = (s, fn) => { const x = $(s, r); if (x) x.onclick = fn; };
    b("#addtb", () => { const v = $("#addt", r).value; if (!v) return; O().addTeacher(k.id, v); PX.commit(); });
    $$("[data-rmt]", r).forEach((x) => (x.onclick = async () => { if (await PX.confirm("Zuordnung entfernen?", `${esc(PX.name(x.dataset.rmt))} wird aus der Kursmappe entfernt. Die Lehrkraftdaten selbst bleiben erhalten.`, "Entfernen", true)) { O().removeTeacher(k.id, x.dataset.rmt); PX.commit(); } }));
    $$("[data-rmm]", r).forEach((x) => (x.onclick = async () => { const mm = PX.mappe(x.dataset.rmm); if (await PX.confirm("Prüfling aus der Kursmappe entfernen?", `Die Zuordnung von ${esc(mm.first)} ${esc(mm.last)} wird gelöst. Die Schülerdaten bleiben erhalten.`, "Entfernen", true)) { PX.S.mappen = PX.S.mappen.filter((y) => y !== mm); PX.audit("Prüfling-Zuordnung entfernt", `${mm.first} ${mm.last}`, PX.kmLabel(k)); PX.commit(); } }));
    b("#rel1", async () => { if (!k.teachers.length) return PX.toast("Lehrkraft fehlt", "", "warn"); if (await PX.confirm("Kursmappe freigeben?", "Die Zuordnungen werden verbindlich.", "Freigeben")) { O().releaseKM(k.id); PX.commit(); } });
    b("#rename", () => PX.modal({ title: "Kursmappe umbenennen", body: `<input class="input" id="kn" value="${esc(k.name)}">`, foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Speichern</button>`, onMount: (mm, close) => { $("[data-ok]", mm).onclick = () => { const n = $("#kn", mm).value.trim(); if (myKms(PX.exam(k.exam)).some((x) => x !== k && x.name === n)) return PX.toast("Name bereits vergeben", "", "warn"); PX.audit("Kursmappe umbenannt", k.name, "→ " + n); k.name = n; close(); PX.commit(); }; } }));
    b("#delkm", async () => { if (PX.mappenOf(k).length) return PX.toast("Löschen nicht möglich", "Eine Kursmappe kann nur gelöscht werden, wenn sie keine digitalen Mappen enthält.", "warn"); if (await PX.confirm("Kursmappe löschen?", esc(k.name), "Löschen", true)) { PX.S.kms = PX.S.kms.filter((x) => x !== k); PX.audit("Kursmappe gelöscht", k.name); PX.commit(); PX.go("#/slt/kursmappen"); } });
  } }));

  // ---------- Prüfungstag ----------
  PX.route(/^slt\/pruefungstag$/, () => ({ title: "Prüfungstag", shell: "staff", need, render: () => {
    const ex = curExam(); if (!ex) return PX.needExam(); const kms = myKms(ex).filter((k) => k.status === "freigegeben");
    const day = PX.S.now === ex.date ? "heute" : PX.S.now < ex.date ? `in ${PX.daysBetween(PX.S.now, ex.date)} Tagen` : "durchgeführt";
    return `${PX.pagehead("Vorbereitung Prüfungstag", `${esc(PX.examLabel(ex))} · ${PX.fmtDW(ex.date)} (${day})`, examSelect())}
      ${!kms.length ? PX.empty("Keine freigegebenen Kursmappen.", "folder") : `
      <div class="notice info">${icon("info")}<div class="small">Deckblätter werden systemseitig erzeugt und schon im Vorfeld ausgedruckt und den Prüfungsunterlagen beigelegt – sie enthalten keine Angabe zur Teilnahme. Ob ein Prüfling teilgenommen hat, wird erst während bzw. nach der Prüfung erfasst. Der Barcode enthält Prüfungs-ID, Kurs-ID und Prüflings-ID; die Merkmale stehen zusätzlich lesbar auf dem Deckblatt. Nachteilsausgleiche können bis unmittelbar vor Beginn der Prüfung erfasst werden.</div></div>
      ${kms.map((k) => `<div class="card pad mt"><div class="row between"><h3>${icon("folder")} ${esc(k.name)} <span class="muted small">· ${PX.activeMappen(k).length} teilnehmend</span></h3><div class="row">${k.covers ? PX.badge("Deckblätter erzeugt " + PX.fmtD(k.coversAt), "green") : ""}<button class="btn sm ${k.covers ? "" : "primary"}" data-cov="${k.id}">${icon("printer")} Deckblätter ${k.covers ? "erneut drucken" : "erzeugen"}</button></div></div>
        <div class="tablewrap mt-s"><table class="tbl compact"><thead><tr><th>Prüfling</th><th>Nachteilsausgleich</th><th>Teilnahme</th><th>Nachtermin</th></tr></thead><tbody>
        ${PX.mappenOf(k).map((x) => `<tr><td>${esc(x.last)}, ${esc(x.first)} <span class="xs muted">${esc(x.nr)}</span></td>
          <td>${x.nta ? `<span class="small">${esc(x.nta)}</span> ` : ""}<button class="btn xs" data-nta="${x.id}" ${PX.S.now > ex.date ? "disabled title='Nur bis zum Beginn der Prüfung'" : ""}>${icon(x.nta ? "pencil" : "plus")} ${x.nta ? "" : "erfassen"}</button></td>
          <td><select class="select sm" data-abs="${x.id}" ${PX.S.now < ex.date ? `disabled title="Erst ab Beginn der Prüfung"` : ""}><option value="">${PX.S.now < ex.date ? "offen – ab Prüfungsbeginn" : "teilgenommen"}</option><option value="entschuldigt" ${x.absent === "entschuldigt" ? "selected" : ""}>nicht teilgenommen – entschuldigt</option><option value="unentschuldigt" ${x.absent === "unentschuldigt" ? "selected" : ""}>nicht teilgenommen – unentschuldigt</option></select></td>
          <td>${x.absent === "entschuldigt" ? (x.nachtermin ? PX.badge("angemeldet: " + (PX.exam(x.nachtermin) ? PX.fmtD(PX.exam(x.nachtermin).date) : "vorgemerkt"), "green") : `<button class="btn xs primary" data-nt="${x.id}">${icon("calendar-plus")} Für Nachtermin anmelden</button>`) : x.absent ? `<span class="xs muted">kein Anspruch</span>` : "–"}</td></tr>`).join("")}</tbody></table></div></div>`).join("")}
      <p class="xs muted mt">Nicht teilnehmende Prüflinge werden als „nicht teilgenommen“ markiert und nicht in die Korrektur überführt.</p>`}`;
  }, mount: (r) => {
    bindExam(r);
    $$("[data-cov]", r).forEach((b) => (b.onclick = () => { O().genCovers(b.dataset.cov); PX.save(); window.open(location.href.split("#")[0] + "#/druck/deckblaetter/" + b.dataset.cov, "_blank"); PX.commit(); PX.toast("Deckblätter erzeugt", "Druckansicht in neuem Tab geöffnet."); }));
    $$("[data-nta]", r).forEach((b) => (b.onclick = () => { const x = PX.mappe(b.dataset.nta); PX.modal({ title: "Nachteilsausgleich", icon: "scale", body: `<p class="small">${esc(x.first)} ${esc(x.last)} (${esc(x.nr)})</p><label class="lbl">Beschreibung (Freitext) *</label><textarea class="input" id="nt">${esc(x.nta)}</textarea><p class="xs muted mt-s">Für die korrigierenden Lehrkräfte und das Regierungspräsidium sichtbar.</p>`, foot: `${x.nta ? `<button class="btn danger" data-rm>Entfernen</button>` : ""}<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Speichern</button>`,
      onMount: (m, close) => { $("[data-ok]", m).onclick = () => { const t = $("#nt", m).value.trim(); if (!t) return; O().setNTA(x.id, t); close(); PX.commit(); }; const rm = $("[data-rm]", m); if (rm) rm.onclick = () => { O().setNTA(x.id, ""); close(); PX.commit(); }; } }); }));
    $$("[data-abs]", r).forEach((s) => (s.onchange = () => { const x = PX.mappe(s.dataset.abs); if (x.scan) { s.value = x.absent; return PX.toast("Nicht möglich", "Für diesen Prüfling liegt bereits ein Scan vor.", "warn"); } O().markAbsent(x.id, s.value); if (!s.value) x.nachtermin = ""; PX.commit(); }));
    $$("[data-nt]", r).forEach((b) => (b.onclick = () => { O().registerNT(b.dataset.nt); PX.commit(); PX.toast("Für Nachtermin angemeldet", "Ein neuer Prüfungsvorgang wird eingerichtet."); }));
  } }));

  // ---------- Korrektor:innen ----------
  PX.route(/^slt\/korrektoren$/, () => ({ title: "Korrektor:innen", shell: "staff", need, render: () => {
    const ex = curExam(); if (!ex) return PX.needExam(); const org = PX.org(school());
    const rel = PX.S.rp[org.rp]?.released;
    if (!rel) return `${PX.pagehead("Korrektor:innen", "Zuweisung der korrigierenden Lehrkräfte", examSelect())}<div class="notice info">${icon("hourglass")}<div>Die Korrekturgruppen werden vom ${esc(PX.orgName(org.rp))} gebildet und freigegeben. Danach bestimmen Sie hier die Lehrkräfte Ihrer Schule.</div></div>`;
    const gs = PX.S.groups.filter((g) => g.exam === ex.id);
    const own = gs.filter((g) => g.ek.school === school());
    const zk = gs.filter((g) => g.zk.school === school()); const eb = gs.filter((g) => g.eb.school === school());
    const cands = subjTeachers(ex.subject);
    const ebCands = PX.S.persons.filter((p) => p.org === school() && p.ebCap && (p.subjects || []).includes(ex.subject));
    const load = (pid) => PX.teacherLoad(pid, ex.id);
    const row = (g, stage) => { const k = PX.km(g.km); const opts = stage === "eb" ? ebCands : cands; const s = g[stage]; const sug = s.suggest && !opts.some((p) => p.id === s.suggest) ? [PX.byId("persons", s.suggest)] : [];
      return `<tr><td><b>${esc(PX.kmPseudo(k))}</b><div class="xs muted">${PX.activeMappen(k).length} Teilnehmende · Herkunftsschule pseudonymisiert</div></td>
      <td>${s.confirmed ? `<b>${esc(PX.name(s.teacher))}</b> ${PX.badge("zugeordnet", "green")}` : `<select class="select" data-pick="${g.id}|${stage}"><option value="">– Lehrkraft wählen –</option>${[...opts, ...sug].map((p) => `<option value="${p.id}" ${p.id === (s.teacher || s.suggest) ? "selected" : ""}>${esc(PX.name(p))} · bisher ${Math.round(load(p.id))} Arbeiten${p.id === s.suggest ? " (RP-Pool)" : ""}</option>`).join("")}</select>`}${s.unavailable ? `<div class="xs" style="color:var(--red)">${icon("circle-alert")} an RP gemeldet</div>` : ""}</td>
      <td class="nowrap">${s.confirmed ? `<button class="btn xs" data-change="${g.id}|${stage}">Ändern</button>` : `<button class="btn sm primary" data-ok="${g.id}|${stage}">${icon("check")} Zuordnen</button> <button class="btn xs ghost" data-na="${g.id}|${stage}">nicht besetzbar</button>`}</td></tr>`; };
    const sec = (title, sub, list, stage) => list.length ? `<h2 class="mt-l">${esc(title)} <span class="muted small">· ${list.length} Kurs(e), ${PX.sum(list.map((g) => PX.activeMappen(PX.km(g.km)).length))} Arbeiten</span></h2><p class="small muted">${sub}</p><div class="tablewrap"><table class="tbl"><thead><tr><th>Kurs</th><th>Korrigierende Lehrkraft</th><th></th></tr></thead><tbody>${list.map((g) => row(g, stage)).join("")}</tbody></table></div>` : "";
    const team = [...new Set([...cands, ...ebCands])];
    return `${PX.pagehead("Korrektor:innen", "Kurse den Fachlehrkräften zuordnen", examSelect())}
      <div class="notice info">${icon("info")}<div class="small">Das Regierungspräsidium hat Ihrer Schule Kurse anderer Schulen für Zweitkorrektur und Endbeurteilung zugewiesen – immer ganze Kurse, pseudonymisiert ohne Herkunftsschule. Sie fügen jeden Kurs einer Fachlehrkraft hinzu; eine Lehrkraft kann mehrere Kurse (auch verschiedener Schulen) erhalten. Kann ein Kurs nicht besetzt werden, melden Sie dies dem Regierungspräsidium.</div></div>
      <h2 class="mt-l">Erstkorrektur – eigene Kursmappen</h2><div class="tablewrap"><table class="tbl"><thead><tr><th>Kursmappe</th><th>Kurslehrkraft</th><th>Status</th><th></th></tr></thead><tbody>${own.map((g) => `<tr><td><b>${esc(PX.km(g.km).name)}</b></td><td>${g.ek.teachers.map(PX.name).map(esc).join(", ")}</td><td>${g.ek.confirmed ? PX.badge("bestätigt", "green") : PX.badge("offen", "yellowb")}</td><td class="nowrap">${g.ek.confirmed ? `<button class="btn xs" data-subst="${g.id}">Ersatzlehrkraft</button>` : `<button class="btn sm primary" data-ok="${g.id}|ek">${icon("check")} Bestätigen</button> <button class="btn xs" data-subst="${g.id}">Ersatzlehrkraft</button>`}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">Keine</td></tr>`}</tbody></table></div>
      ${sec("Zweitkorrektur – zugewiesene Kurse", "Pseudonymisierte Korrektur: Weder Schule noch Lehrkraft der Erstkorrektur sind erkennbar.", zk, "zk")}
      ${sec("Endbeurteilung – zugewiesene Kurse", "Nur Lehrkräfte mit gemeldeter EB-Kapazität. Schulen von Erst- und Zweitkorrektur sind nicht erkennbar.", eb, "eb")}
      ${team.length ? `<h3 class="mt-l">Belastung Ihrer Fachlehrkräfte (${esc(PX.examShort(ex))})</h3><div class="loadchart">${team.map((p) => `<div class="lrow"><span class="small">${esc(PX.name(p))}</span><span class="lbar"><i class="ek" style="width:${Math.min(100, load(p.id) * 4)}%"></i></span><b class="small">${Math.round(load(p.id))}</b></div>`).join("")}</div>` : ""}
      ${[...own.map((g) => g.ek.confirmed), ...zk.map((g) => g.zk.confirmed), ...eb.map((g) => g.eb.confirmed)].every(Boolean) ? `<div class="notice success mt">${icon("circle-check")}<div>Alle Kurse Ihrer Schule sind Lehrkräften zugeordnet.</div></div>` : ""}`;
  }, mount: (r) => {
    bindExam(r);
    $$("[data-ok]", r).forEach((b) => (b.onclick = () => { const [gid, st] = b.dataset.ok.split("|"); const sel = $(`[data-pick="${gid}|${st}"]`, r); if (st !== "ek" && !sel?.value) return PX.toast("Lehrkraft wählen", "Bitte den Kurs einer Fachlehrkraft zuordnen.", "warn"); O().confirmAssignment(gid, st, sel ? sel.value : null); PX.commit(); PX.toast(st === "ek" ? "Erstkorrektur bestätigt" : "Kurs zugeordnet", st === "ek" ? "" : `${PX.STAGE[st]}: ${esc(PX.name(PX.byId("groups", gid)[st].teacher))} – Benachrichtigung versendet`); }));
    $$("[data-change]", r).forEach((b) => (b.onclick = () => { const [gid, st] = b.dataset.change.split("|"); PX.byId("groups", gid)[st].confirmed = false; PX.audit("Zuordnung zur Änderung geöffnet", PX.kmPseudo(PX.byId("groups", gid).km), PX.STAGE[st]); PX.commit(); }));
    $$("[data-na]", r).forEach((b) => (b.onclick = async () => { const [gid, st] = b.dataset.na.split("|"); if (await PX.confirm("Nicht besetzbar melden?", "Das Regierungspräsidium wird informiert und ordnet den Kurs ggf. einer anderen Schule zu.", "Melden")) { O().reportUnavailable(gid, st); PX.commit(); } }));
    $$("[data-subst]", r).forEach((b) => (b.onclick = () => { const g = PX.byId("groups", b.dataset.subst); const k = PX.km(g.km); const opts = subjTeachers(PX.exam(k.exam).subject); PX.modal({ title: "Ersatzlehrkraft für die Erstkorrektur", icon: "user-cog", body: `<p class="small">Bei Ausfall der Kurslehrkraft bestimmt das Schulleitungsteam eine geeignete Ersatzlehrkraft.</p><select class="select" id="sl">${opts.map((p) => `<option value="${p.id}">${esc(PX.name(p))}</option>`).join("")}</select>`, foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok2>Übernehmen</button>`, onMount: (m, close) => { $("[data-ok2]", m).onclick = () => { const v = $("#sl", m).value; const before = g.ek.teachers.map(PX.name).join(", "); g.ek.teachers = [v]; k.teachers = [v]; g.ek.confirmed = true; g.log.push({ at: PX.stamp(), who: PX.actorId(), text: `EK: ${before} → ${PX.name(v)} (Ersatz)` }); PX.audit("Ersatzlehrkraft Erstkorrektur", PX.kmLabel(k), `${before} → ${PX.name(v)}`); PX.notify(v, `Sie übernehmen die Erstkorrektur der Kursmappe ${PX.kmLabel(k)}.`, "#/korr"); close(); PX.commit(); }; } }); }));
  } }));

  // ---------- Korrekturstand ----------
  function standRows(ex) {
    const rows = [];
    PX.S.kms.filter((k) => !ex || k.exam === ex.id).forEach((k) => {
      const g = PX.groupOf(k); if (!g) return;
      ["ek", "zk", "eb"].forEach((st) => {
        const sch = st === "ek" ? k.school : g[st].school; if (sch !== school()) return;
        const ss = PX.stageState(k, st); const open = PX.stageOpen(k, st);
        const list = PX.activeMappen(k); const relevant = st === "eb" ? list.filter((x) => x.ebRequired) : list;
        const fin = relevant.filter((x) => x.corr[st]?.state === "fertig").length;
        rows.push({ k, st, ss, open, fin, total: relevant.length, canConfirm: open && ss.lkDone && !ss.sltOk });
      });
    });
    return rows;
  }
  PX.route(/^slt\/stand$/, () => ({ title: "Korrekturstand", shell: "staff", need, render: () => {
    const ex = curExam(); if (!ex) return PX.needExam(); const rows = standRows(ex);
    return `${PX.pagehead("Korrekturstand", "Formaler Fortgang der Korrektur – Ergebnisse erst nach Abschluss", examSelect())}
      ${rows.length ? `<div class="tablewrap"><table class="tbl"><thead><tr><th>Kursmappe</th><th>Stufe</th><th>Korrigierende Lehrkraft</th><th>Fortschritt</th><th>Frist</th><th>Lehrkraft</th><th>Schulleitung</th><th></th></tr></thead><tbody>
      ${rows.map(({ k, st, ss, open, fin, total, canConfirm }) => { const end = st === "ek" ? ex.ekEnd : st === "zk" ? ex.zkEnd : ex.ebEnd; const left = PX.daysBetween(PX.S.now, end); return `<tr><td><b>${esc(st === "ek" ? k.name : PX.kmPseudo(k))}</b>${st === "ek" ? ` <span class="muted">· ${esc(PX.orgShort(k.school))}</span>` : ""}</td><td>${PX.badge(PX.STAGE[st], PX.stageColor[st])}</td><td class="small">${ss.teachers.map(PX.name).map(esc).join(", ")}</td>
        <td>${open ? `${PX.progress(fin, total)} <span class="xs">${fin}/${total}${st === "eb" ? " Pflicht" : ""}</span>` : `<span class="xs muted">${st === "eb" && k.stages.zk.sltOk ? "ab " + PX.fmtD(ex.ebStart) : "noch nicht freigegeben"}</span>`}</td>
        <td class="nowrap small ${open && !ss.sltOk && left <= 2 ? "warntext" : ""}">${PX.fmtD(end)}${open && !ss.sltOk ? `<div class="xs">${left >= 0 ? "noch " + left + " Tage" : "überschritten"}</div>` : ""}</td>
        <td>${ss.lkDone ? PX.badge("abgeschlossen", "green") : open ? PX.badge("in Arbeit", "gray") : "–"}</td><td>${ss.sltOk ? PX.badge("bestätigt", "green") : canConfirm ? PX.badge("zu bestätigen", "yellowb") : "–"}</td>
        <td class="nowrap">${canConfirm ? `<button class="btn sm primary" data-conf="${k.id}|${st}">${icon("check")} Abschluss bestätigen</button> <button class="btn xs" data-ret="${k.id}|${st}">Zurückverfügen</button>` : ""}</td></tr>`; }).join("")}</tbody></table></div>`
      : PX.empty("Noch keine Korrekturen für Ihre Schule.", "gauge")}
      <div class="notice info mt">${icon("info")}<div class="small">Erst wenn Lehrkraft und Schulleitung den Abschluss bestätigt haben, wird die nächste Korrekturstufe freigegeben. Nach der Zweitkorrektur berechnet das System die Abweichungen und löst die Endbeurteilung aus (> 3 Notenpunkte). Zwei Tage vor Fristende erhält die Schulleitung eine Benachrichtigung.</div></div>`;
  }, mount: (r) => {
    bindExam(r);
    $$("[data-conf]", r).forEach((b) => (b.onclick = async () => { const [kid, st] = b.dataset.conf.split("|"); const k = PX.km(kid); if (await PX.confirm(`Abschluss ${PX.STAGE[st]} bestätigen?`, `${esc(st === "ek" ? k.name + " (" + PX.orgName(k.school) + ")" : PX.kmPseudo(k))}. ${st === "ek" ? "Danach erhält die Zweitkorrektur Zugriff (anonymisiert)." : st === "zk" ? "Danach werden die Abweichungen berechnet und die Endbeurteilung ausgelöst." : "Danach gilt die Kursmappe als vollständig korrigiert und wird archiviert."}`, "Bestätigen")) { O().sltConfirm(kid, st); PX.commit(); PX.toast("Abschluss bestätigt", `${PX.STAGE[st]} · ${esc(st === "ek" ? k.name : PX.kmPseudo(k))}`); } }));
    $$("[data-ret]", r).forEach((b) => (b.onclick = async () => { const [kid, st] = b.dataset.ret.split("|"); const k = PX.km(kid); const t = PX.stageState(k, st).teachers[0]; if (await PX.confirm("Korrektur zurückverfügen?", `Die ${PX.STAGE[st]} geht an ${esc(PX.name(t))} zurück; der Abschluss muss danach wiederholt werden.`, "Zurückverfügen", true)) { O().sltReturn(kid, st, t); PX.commit(); } }));
  } }));

  // ---------- Ergebnisse ----------
  PX.route(/^slt\/ergebnisse$/, () => ({ title: "Ergebnisse", shell: "staff", need, render: () => {
    const ex = curExam(); if (!ex) return PX.needExam(); const kms = myKms(ex);
    const done = kms.filter((k) => k.stages.eb.sltOk);
    const allDone = kms.length && done.length === kms.length;
    return `${PX.pagehead("Prüfungsergebnisse", "Export für ASV, Einsichtnahme", examSelect())}
      ${!done.length ? PX.empty("Es liegen noch keine abgeschlossenen Kursmappen vor. Ergebnisse sind erst nach Abschluss der Endbeurteilung sichtbar.", "lock") : `
      ${done.map((k) => { const list = PX.activeMappen(k); const avg = (PX.sum(list.map((x) => x.final?.np ?? x.final?.base)) / list.length).toFixed(1); const rr = PX.raster(ex); const ext = rr.parts.filter((p) => p.scoring === "extern"); return `<div class="card pad mt"><div class="row between"><h3>${icon("folder-check")} ${esc(k.name)} <span class="muted small">· Ø ${avg.replace(".", ",")} NP</span></h3>${k.exported ? PX.badge("an ASV übergeben am " + PX.fmtD(k.exported), "dark") : PX.badge("Export ausstehend", "yellowb")}</div>
        <div class="tablewrap mt-s"><table class="tbl compact"><thead><tr><th>Prüfling</th><th>EK</th><th>ZK</th><th>Abw.</th><th>EB</th>${ext.map((p) => `<th>${esc(p.name.replace(/^Teil [IV]+ – /, ""))}</th>`).join("")}<th>Endnote</th><th>Ermittlung</th><th>Einsichtnahme</th></tr></thead><tbody>
        ${list.map((x) => `<tr><td>${esc(x.last)}, ${esc(x.first)} <span class="xs muted">${esc(x.nr)}</span></td><td>${PX.fmtNP(x.corr.ek?.np)}</td><td>${PX.fmtNP(x.corr.zk?.np)}</td><td>${PX.fmtNP(x.diff)}${x.ebRequired === "stichprobe" ? " " + PX.badge("Stichprobe", "brown") : x.ebRequired ? " " + icon("triangle-alert") : ""}</td><td>${x.corr.eb?.state === "fertig" ? PX.fmtNP(x.corr.eb.np) : "–"}</td>${ext.map((p) => `<td><input class="input sm num" type="number" min="0" max="15" data-ext="${x.id}|${p.id}" value="${x.extern?.[p.id] ?? ""}" ${k.exported ? "disabled" : ""} aria-label="${esc(p.name)}"></td>`).join("")}<td><b>${x.final?.np != null ? PX.fmtNP(x.final.np) + " NP" : x.final?.pending ? PX.badge("ausstehend", "yellowb") : "–"}</b></td><td class="xs">${esc(x.final?.src || "")}${x.final?.pending ? `<br>fehlt: ${esc(x.final.pending)}` : ""}</td>
          <td><button class="btn xs" data-ein="${x.id}" ${allDone ? "" : "disabled title='Erst nach Abschluss aller Prüfungen'"}>${icon("printer")} PDF erzeugen</button>${PX.S.einsicht.some((e) => e.mappe === x.id) ? " " + PX.badge("erzeugt", "green") : ""}</td></tr>`).join("")}
        ${PX.mappenOf(k).filter((x) => x.absent).map((x) => `<tr class="dim"><td>${esc(x.last)}, ${esc(x.first)}</td><td colspan="7" class="small">nicht teilgenommen (${esc(x.absent)})${x.nachtermin ? " · Nachtermin " + PX.fmtD(PX.exam(x.nachtermin)?.date) : ""}</td></tr>`).join("")}</tbody></table></div></div>`; }).join("")}
      ${PX.raster(ex).parts.some((p) => p.scoring === "extern") ? `<div class="notice info mt">${icon("info")}<div class="small">Nicht korrekturrelevante Prüfungsteile (z. B. Kommunikationsprüfung) werden mit Notenpunkten eingetragen – durch die Erstkorrektur oder hier durch das Schulleitungsteam, auch nach Abschluss der Korrektur. Die Endnote wird dann automatisch berechnet.</div></div>` : ""}
      <div class="row mt"><button class="btn primary" id="asvx" ${done.every((k) => k.exported) ? "disabled" : ""}>${icon("send")} Ergebnisse für ASV exportieren</button><button class="btn" id="csvx">${icon("download")} CSV herunterladen</button><span class="small muted">Der Import in ASV erfolgt außerhalb von PASCA.</span></div>
      ${!allDone ? `<div class="notice info mt">${icon("info")}<div class="small">Einsichtnahme ist erst nach Abschluss aller Prüfungen möglich (${done.length} von ${kms.length} Kursmappen abgeschlossen).</div></div>` : ""}`}`;
  }, mount: (r) => {
    bindExam(r); const ex = curExam(); if (!ex) return;
    const rows = () => [["schulnummer", "kurs_id", "pruefling_id", "nachname", "vorname", "pruefung", "termin", "ek_np", "zk_np", "eb_np", "endnote_np"], ...myKms(ex).filter((k) => k.stages.eb.sltOk).flatMap((k) => PX.activeMappen(k).map((x) => [PX.orgShort(k.school), k.course, x.nr, x.last, x.first, PX.subj(ex.subject).short, ex.type, x.corr.ek?.np, x.corr.zk?.np, x.corr.eb?.state === "fertig" ? x.corr.eb.np : "", x.final?.np ?? ""]))];
    const a = $("#asvx", r); if (a) a.onclick = async () => { if (await PX.confirm("Ergebnisse exportieren?", "Die Endnoten der abgeschlossenen Kursmappen werden für den ASV-Import bereitgestellt.", "Exportieren")) { O().exportASV(school(), ex.id); PX.download(`asv_ergebnisse_${school()}_${PX.subj(ex.subject).short}_${ex.type}.csv`, PX.csv(rows())); PX.commit(); PX.toast("Export erstellt", "CSV-Datei für den ASV-Import heruntergeladen."); } };
    const c = $("#csvx", r); if (c) c.onclick = () => PX.download(`ergebnisse_${school()}.csv`, PX.csv(rows()));
    $$("[data-ext]", r).forEach((i) => (i.onchange = () => { const [mid, pid] = i.dataset.ext.split("|"); O().setExtern(mid, pid, i.value); PX.commit(); }));
    $$("[data-ein]", r).forEach((b) => (b.onclick = () => { O().einsicht(b.dataset.ein); PX.save(); window.open(location.href.split("#")[0] + "#/druck/einsicht/" + b.dataset.ein, "_blank"); PX.commit(); }));
  } }));
  PX.sltStandRows = standRows;
})();
