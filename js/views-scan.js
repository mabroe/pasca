/* PASCA Klickdummy – Rolle Scan-Operator */
(function () {
  "use strict";
  const PX = window.PX; const { esc, icon, $, $$ } = PX; const O = () => PX.ops;
  const need = ["sco"];
  const school = () => PX.me()?.org;
  const myScans = () => PX.S.scans.filter((s) => s.school === school());
  const QCB = (s) => { const q = PX.qc(s); return q.length ? q.map((x) => `<span class="badge ${x.block ? "red" : "yellowb"}" title="${esc(x.text)}">${icon(x.k === "barcode" ? "barcode" : x.k === "rot" ? "rotate-cw" : x.k === "pages" ? "file-warning" : "scan")} ${esc(x.k === "dpi" ? "Auflösung" : x.k === "pages" ? "Seitenzahl" : x.k === "rot" ? "Drehung" : "Barcode")}</span>`).join(" ") : PX.badge("in Ordnung", "green"); };
  let mode = "lokal";

  PX.route(/^scan$/, () => ({ title: "Scan-Eingang", shell: "staff", need, render: () => {
    const org = PX.org(school()); const kms = PX.S.kms.filter((k) => k.school === school() && k.status === "freigegeben");
    const open = kms.filter((k) => !k.scanReleased); const stack = PX.scanStack(school());
    const files = myScans().filter((s) => s.status !== "freigegeben");
    const unassigned = files.filter((s) => s.status === "nicht_zugeordnet"); const fresh = files.filter((s) => s.status === "hochgeladen");
    return `${PX.pagehead("Scan-Eingang", `${esc(org.name)} · Digitalisierung der Prüfungsunterlagen`, `<a class="btn" href="#/scan/kursmappen">${icon("folder-check")} Vollständigkeit & Freigabe</a>`)}
      ${!kms.length ? `<div class="notice info">${icon("info")}<div>Es liegen noch keine freigegebenen Kursmappen vor. Das Schulleitungsteam importiert die Daten und gibt die Kursmappen frei.</div></div>` : ""}
      ${kms.length && PX.S.now < (PX.exam(kms[0].exam)?.date || "") ? `<div class="notice info">${icon("clock")}<div>Die Prüfung findet am ${PX.fmtDW(PX.exam(kms[0].exam).date)} statt. Eingescannt wird nach Abschluss der Prüfung (Demo-Zeit oben rechts).</div></div>` : ""}
      ${open.length ? `<div class="tabs small"><button class="${mode === "lokal" ? "active" : ""}" data-mode="lokal">${icon("upload")} Lokaler Scan mit Upload</button><button class="${mode === "system" ? "active" : ""}" data-mode="system">${icon("printer")} Systemseitiger Scan</button></div>
      ${mode === "lokal" ? `<div class="card pad"><div class="dropzone" id="dz">${icon("file-up", "xl")}<b>Scandateien (PDF) hierher ziehen</b><span class="small muted">Massen-Upload: je Prüfling eine mehrseitige PDF inkl. Deckblatt und Konzeptblättern · Mindestauflösung 300 dpi</span><button class="btn primary mt-s" id="pick">${icon("folder-open")} Dateien auswählen</button></div>
        <p class="xs muted mt-s">${icon("info")} Die Scandateien liegen nur kurzfristig im Verwaltungsnetz der Schule und sollten nach dem Upload gelöscht werden. Dateinamen sind nicht vorgegeben – die Zuordnung erfolgt über den Barcode des Deckblatts.</p></div>`
        : `<div class="card pad scanner"><div class="row"><div class="rico">${icon("printer", "lg")}</div><div class="grow"><b>Netzwerkscanner „Verwaltung 1. OG“</b><div class="small muted">Verbunden · gesicherte Übertragung direkt an PASCA, keine lokale Zwischenspeicherung · Farbe, 300 dpi, Duplex</div></div>${PX.badge("bereit", "green")}</div>
        <div class="row mt"><button class="btn primary" id="scanstart" ${stack.length ? "" : "disabled"}>${icon("scan")} Scan starten (${stack.length} Prüfungsunterlagen im Einzug)</button><span class="xs muted">Der Stapel enthält alle Unterlagen der Kursmappen ${open.map((k) => esc(k.name)).join(", ")}.</span></div></div>`}` : kms.length ? `<div class="notice success">${icon("circle-check")}<div>Alle Kursmappen sind zur Korrektur freigegeben.</div></div>` : ""}
      ${fresh.length ? `<div class="notice info mt">${icon("barcode")}<div class="grow"><b>${fresh.length} Datei(en) hochgeladen, noch nicht zugeordnet.</b><br><span class="small">Das System liest die Barcodes der Deckblätter und ordnet die Dateien den digitalen Mappen zu.</span></div><button class="btn primary" id="auto">${icon("zap")} Automatische Zuordnung starten</button></div>` : ""}
      ${unassigned.length ? `<div class="notice warn mt">${icon("circle-alert")}<div><b>Nicht zugeordnet (${unassigned.length})</b><br><span class="small">Barcode nicht lesbar oder keine eindeutige Zuordnung möglich. Öffnen Sie die Datei und ordnen Sie sie anhand der lesbaren IDs auf dem Deckblatt zu.</span></div></div>` : ""}
      ${files.length ? `<h2 class="mt-l">Hochgeladene Scandateien (${files.length})</h2><div class="tablewrap"><table class="tbl"><thead><tr><th>Datei</th><th>Seiten</th><th>Auflösung</th><th>Automatische Prüfung</th><th>Zuordnung</th><th></th></tr></thead><tbody>
        ${files.map((s) => { const m = s.mappe ? PX.mappe(s.mappe) : null; return `<tr class="${s.status === "nicht_zugeordnet" ? "warnrow" : ""}"><td><b>${esc(s.file)}</b><div class="xs muted">${esc(s.mode)} · ${esc(s.at)}</div></td><td>${s.pages.length}</td><td>${s.dpi} dpi</td><td>${QCB(s)}</td>
          <td>${m ? `${esc(PX.km(m.km).name)} · ${esc(m.last)}, ${esc(m.first)}${s.manual ? ` ${PX.badge("manuell", "purple")}` : ""}` : s.status === "nicht_zugeordnet" ? PX.badge("nicht zugeordnet", "red") : `<span class="muted small">wartet</span>`}</td>
          <td class="nowrap"><a class="btn sm" href="#/scan/datei/${s.id}">${icon("eye")} Prüfen</a> <button class="iconbtn" data-del="${s.id}" aria-label="Löschen">${icon("trash-2")}</button></td></tr>`; }).join("")}</tbody></table></div>` : ""}`;
  }, mount: (r) => {
    $$("[data-mode]", r).forEach((b) => (b.onclick = () => { mode = b.dataset.mode; PX.rerender(); }));
    const pick = $("#pick", r); if (pick) pick.onclick = () => pickDialog();
    const dz = $("#dz", r); if (dz) { dz.ondragover = (e) => { e.preventDefault(); dz.classList.add("over"); }; dz.ondragleave = () => dz.classList.remove("over"); dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove("over"); pickDialog(); }; }
    const ss = $("#scanstart", r); if (ss) ss.onclick = () => scannerRun();
    const au = $("#auto", r); if (au) au.onclick = () => { const res = O().autoAssign(school()); PX.commit(); PX.toast("Automatische Zuordnung abgeschlossen", `${res.ok} zugeordnet, ${res.fail} nicht zugeordnet`, res.fail ? "warn" : "success"); };
    $$("[data-del]", r).forEach((b) => (b.onclick = async () => { const s = PX.byId("scans", b.dataset.del); if (await PX.confirm("Scandatei löschen?", `„${esc(s.file)}“ wird gelöscht. Die zugehörige digitale Mappe ist danach wieder ohne Scan.`, "Löschen", true)) { O().deleteScan(s.id); PX.commit(); } }));
  } }));

  function pickDialog() {
    const stack = PX.scanStack(school());
    if (!stack.length) return PX.toast("Keine neuen Scandateien", "Für alle Prüflinge liegen bereits Scans vor.", "info");
    PX.modal({ title: "Dateien auswählen", icon: "folder-open", size: "wide",
      body: `<div class="filebrowser"><div class="fb-path">${icon("hard-drive")} \\\\verwaltung\\scans\\${esc(PX.S.now)}\\</div><table class="tbl compact"><thead><tr><th><input type="checkbox" id="fa" checked></th><th>Name</th><th>Größe</th><th>Typ</th></tr></thead><tbody>${stack.map((f) => `<tr><td><input type="checkbox" data-f="${f.id}" checked></td><td>${icon("file-text")} ${esc(f.file)}</td><td>${(f.pages.length * (f.dpi === 300 ? 1.9 : 0.7)).toFixed(1).replace(".", ",")} MB</td><td>PDF</td></tr>`).join("")}</tbody></table></div>`,
      foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>${icon("upload")} Hochladen</button>`,
      onMount: (m, close) => { $("#fa", m).onchange = (e) => $$("[data-f]", m).forEach((c) => (c.checked = e.target.checked)); $("[data-ok]", m).onclick = () => { const ids = $$("[data-f]:checked", m).map((c) => c.dataset.f); close(); uploadAnim(stack.filter((f) => ids.includes(f.id)), "Upload"); }; } });
  }
  function uploadAnim(files, modeLabel) {
    if (!files.length) return;
    const close = PX.modal({ title: modeLabel === "Scanner" ? "Scan läuft" : "Upload läuft", icon: modeLabel === "Scanner" ? "scan" : "upload", size: "wide", body: `<p class="small muted" id="upsum">0 von ${files.length} Dateien</p><div class="uplist">${files.map((f, i) => `<div class="uprow" data-u="${i}"><span>${icon("file-text")} ${esc(f.file)}</span><span class="bar"><i></i></span><span class="xs st">wartet</span></div>`).join("")}</div>` });
    let i = 0;
    const step = () => {
      const row = document.querySelector(`[data-u="${i}"]`); if (!row) { close(); return; }
      row.querySelector(".bar i").style.width = "100%"; const f = files[i];
      row.querySelector(".st").innerHTML = f.dpi < 300 ? `<span style="color:var(--red)">${icon("triangle-alert")} ${f.dpi} dpi</span>` : `${icon("check")} ${f.pages.length} S.`;
      i++; const sum = document.getElementById("upsum"); if (sum) sum.textContent = `${i} von ${files.length} Dateien · Metadaten geprüft (Auflösung, Seitenzahl, Farbinformation)`;
      if (i < files.length) setTimeout(step, 120); else setTimeout(() => { close(); O().upload(school(), files, modeLabel); PX.commit(); PX.toast(modeLabel === "Scanner" ? "Scan übertragen" : "Upload abgeschlossen", `${files.length} Dateien gespeichert. ${files.filter((f) => f.issues.some((x) => x !== "barcode" && x !== "rot")).length} mit Qualitätshinweis.`); }, 400);
    };
    setTimeout(step, 300);
  }
  function scannerRun() { const files = PX.scanStack(school()); uploadAnim(files, "Scanner"); }

  // ---------- Prüfansicht einer Scandatei ----------
  let view = { sel: [], zoom: 1, contrast: 100, bright: 100, detail: null };
  PX.route(/^scan\/datei\/([^/]+)$/, (mm) => ({ title: "Scandatei prüfen", shell: "staff", need, render: () => {
    const s = PX.byId("scans", mm[1]); if (!s) return PX.empty("Datei nicht gefunden");
    const m = s.mappe ? PX.mappe(s.mappe) : null; const target = PX.mappe(s.target); const qc = PX.qc(s);
    const fake = target; // für die Darstellung: Inhalt der Datei
    const ro = s.status === "freigegeben";
    const pageView = view.detail ? s.pages.find((p) => p.id === view.detail) : null;
    return `${PX.pagehead(s.file, `${s.pages.length} Seiten · ${s.dpi} dpi · ${m ? `zugeordnet: ${esc(PX.km(m.km).name)} · ${esc(m.last)}, ${esc(m.first)} (${esc(m.nr)})` : "nicht zugeordnet"}`, `<a class="btn" href="#/scan">${icon("arrow-left")} Scan-Eingang</a>`)}
      ${qc.map((q) => `<div class="notice ${q.block ? "warn" : "peach"}">${icon(q.block ? "circle-alert" : "info")}<div class="grow"><b>${esc(q.text)}</b>${q.k === "dpi" ? "<br><span class='small'>Bitte die Prüfungsunterlage erneut einscannen; die neue Datei ersetzt die bestehende (ohne Versionierung, protokolliert).</span>" : q.k === "pages" ? "<br><span class='small'>Fehlende Seite nachscannen – die Seite wird über den Seiten-Barcode automatisch ergänzt.</span>" : q.k === "rot" ? "<br><span class='small'>Seite markieren und drehen.</span>" : ""}</div>${q.k === "dpi" || q.k === "pages" ? `<button class="btn sm primary" data-rescan>${icon("scan")} ${q.k === "dpi" ? "Neu scannen und ersetzen" : "Fehlende Seite nachscannen"}</button>` : ""}</div>`).join("")}
      ${!m ? assignPanel(s, target) : ""}
      <div class="notice info small">${icon("sticky-note")}<div class="xs">Konzeptpapier wird über die Farbmarkierung des landeseinheitlich bedruckten Papiers erkannt und gesondert gekennzeichnet. Bei falscher Erkennung die Seite per ${icon("sticky-note")} umkennzeichnen.</div></div>
      <div class="viewer-tools"><div class="row wrap">${ro ? PX.badge("zur Korrektur freigegeben – nur Ansicht", "dark") : `<span class="small muted">${view.sel.length} Seite(n) markiert</span><button class="btn sm" data-rot="-90" ${view.sel.length ? "" : "disabled"}>${icon("rotate-ccw")} −90°</button><button class="btn sm" data-rot="90" ${view.sel.length ? "" : "disabled"}>${icon("rotate-cw")} +90°</button>`}</div>
        <div class="row wrap"><label class="xs">Kontrast <input type="range" min="60" max="160" value="${view.contrast}" id="ct"></label><label class="xs">Helligkeit <input type="range" min="60" max="140" value="${view.bright}" id="br"></label><button class="iconbtn" id="zo" aria-label="Verkleinern">${icon("zoom-out")}</button><span class="xs">${Math.round(view.zoom * 100)} %</span><button class="iconbtn" id="zi" aria-label="Vergrößern">${icon("zoom-in")}</button>${pageView ? `<button class="btn sm" id="grid">${icon("layout-dashboard")} Rasteransicht</button>` : ""}</div></div>
      <div class="pagegrid ${pageView ? "detail" : ""}" style="--z:${view.zoom};filter:contrast(${view.contrast}%) brightness(${view.bright}%)">
        ${(pageView ? [pageView] : s.pages).map((p) => { const i = s.pages.indexOf(p); return `<div class="pcell ${view.sel.includes(p.id) ? "sel" : ""}"><div class="pcell-h"><label class="checkbox xs"><input type="checkbox" data-sel="${p.id}" ${view.sel.includes(p.id) ? "checked" : ""} ${ro ? "disabled" : ""}> Seite ${i + 1} · ${p.kind === "deckblatt" ? "Deckblatt" : p.kind === "konzept" ? "Konzeptpapier" : "Blatt " + p.n}</label>${p.kind === "konzept" ? PX.badge(p.konzeptBy === "manuell" ? "manuell" : "Farbe erkannt", "yellowb") : p.unsure ? PX.badge("Farbe unsicher", "red") : ""}<span class="row" style="gap:2px">${ro || p.kind === "deckblatt" ? "" : `<button class="iconbtn sm" data-konz="${p.id}" title="${p.kind === "konzept" ? "Kennzeichnung Konzeptpapier aufheben" : "als Konzeptpapier kennzeichnen"}">${icon("sticky-note")}</button>`}${ro || i === 0 ? "" : `<button class="iconbtn sm" data-mv="${p.id}|-1" title="nach vorn" ${i <= 1 ? "disabled" : ""}>${icon("chevron-left")}</button><button class="iconbtn sm" data-mv="${p.id}|1" title="nach hinten" ${i >= s.pages.length - 1 ? "disabled" : ""}>${icon("chevron-right")}</button>`}<button class="iconbtn sm" data-zoom="${p.id}" title="Lupe / Einzelansicht">${icon("search")}</button></span></div>${PX.pageHtml(fake, p, { small: !pageView, dpi: s.dpi })}</div>`; }).join("")}</div>`;
  }, mount: (r) => {
    const s = PX.byId("scans", mm[1]); if (!s) return;
    $$("[data-sel]", r).forEach((c) => (c.onchange = () => { view.sel = $$("[data-sel]:checked", r).map((x) => x.dataset.sel); PX.rerender(); }));
    $$("[data-rot]", r).forEach((b) => (b.onclick = () => { O().rotate(s.id, view.sel, +b.dataset.rot); PX.commit(); PX.toast("Seite gedreht", `${view.sel.length} Seite(n) um ${b.dataset.rot}°`); }));
    $$("[data-konz]", r).forEach((b) => (b.onclick = () => { O().toggleKonzept(s.id, b.dataset.konz); PX.commit(); }));
    $$("[data-mv]", r).forEach((b) => (b.onclick = () => { const [pid, d] = b.dataset.mv.split("|"); O().movePage(s.id, pid, +d); PX.commit(); }));
    $$("[data-zoom]", r).forEach((b) => (b.onclick = () => { view.detail = view.detail === b.dataset.zoom ? null : b.dataset.zoom; view.zoom = view.detail ? 1.3 : 1; PX.rerender(); }));
    const g = $("#grid", r); if (g) g.onclick = () => { view.detail = null; view.zoom = 1; PX.rerender(); };
    $("#zi", r).onclick = () => { view.zoom = Math.min(2.2, view.zoom + 0.2); PX.rerender(); }; $("#zo", r).onclick = () => { view.zoom = Math.max(0.6, view.zoom - 0.2); PX.rerender(); };
    $("#ct", r).oninput = (e) => { view.contrast = +e.target.value; $(".pagegrid", r).style.filter = `contrast(${view.contrast}%) brightness(${view.bright}%)`; };
    $("#br", r).oninput = (e) => { view.bright = +e.target.value; $(".pagegrid", r).style.filter = `contrast(${view.contrast}%) brightness(${view.bright}%)`; };
    $$("[data-rescan]", r).forEach((b) => (b.onclick = () => { const close = PX.modal({ title: "Nachscan", icon: "scan", body: `<p class="small">Unterlage in den Einzug legen … Scan wird übertragen.</p><div class="bigbar"><i id="pb2"></i></div>` }); setTimeout(() => { const pb = document.getElementById("pb2"); if (pb) pb.style.width = "100%"; }, 60); setTimeout(() => { close(); O().rescan(s.id); PX.commit(); PX.toast("Nachscan übernommen", "Die Datei wurde ergänzt bzw. ersetzt; der Vorgang ist protokolliert."); }, 900); }));
    const as = $("#asg", r); if (as) as.onclick = () => {
      const kmId = $("#akm", r).value; const mid = $("#amp", r).value; const idIn = $("#aid", r).value.trim().toUpperCase();
      if (!kmId || !mid) return PX.toast("Bitte Kursmappe und Prüfling wählen", "", "warn");
      const m = PX.mappe(mid); const target = PX.mappe(s.target);
      if (idIn !== target.nr) return PX.toast("Prüflings-ID nicht eindeutig", "Bitte die Prüflings-ID vom Deckblatt übernehmen.", "warn");
      if (m.id !== target.id) return PX.toast("Widerspruch erkannt", `Die Prüflings-ID ${esc(idIn)} gehört nicht zu ${esc(m.last)}, ${esc(m.first)}. Mehrdeutige Zuordnungen dürfen nicht frei aufgelöst werden.`, "error");
      if (m.scan) return PX.toast("Bereits belegt", "Für diesen Prüfling liegt bereits eine Scandatei vor.", "warn");
      O().manualAssign(s.id, mid); PX.commit(); PX.toast("Manuell zugeordnet", `${esc(m.nr)} – revisionssicher protokolliert`);
    };
    const akm = $("#akm", r); if (akm) akm.onchange = () => { const k = PX.km(akm.value); $("#amp", r).innerHTML = `<option value="">Prüfling wählen …</option>` + (k ? PX.activeMappen(k).filter((x) => !x.scan).map((x) => `<option value="${x.id}">${esc(x.last)}, ${esc(x.first)} (${esc(x.nr)})</option>`).join("") : ""); };
  }, unmount: () => {} }));
  window.addEventListener("hashchange", () => { if (!/scan\/datei/.test(location.hash)) view = { sel: [], zoom: 1, contrast: 100, bright: 100, detail: null }; });

  function assignPanel(s, target) {
    const kms = PX.S.kms.filter((k) => k.school === school() && k.status === "freigegeben" && !k.scanReleased);
    return `<div class="card pad assign"><div class="grid2"><div><h3>${icon("barcode")} Manuelle Zuordnung</h3><p class="small muted">Deckblatt und lesbare Identifikationsmerkmale sind gleichzeitig sichtbar. Die Zuordnung darf nur bestätigt werden, wenn Prüflings-ID und Kurs-ID eindeutig bestimmbar sind und die Plausibilitätsprüfung keinen Widerspruch ergibt.</p>
      <div class="field"><label class="lbl" for="akm">Kursmappe (Kurs-ID laut Deckblatt)</label><select class="select" id="akm"><option value="">Kursmappe wählen …</option>${kms.map((k) => `<option value="${k.id}">${esc(k.name)} (${esc(k.course)})</option>`).join("")}</select></div>
      <div class="field"><label class="lbl" for="amp">Digitale Mappe Prüfling</label><select class="select" id="amp"><option value="">zuerst Kursmappe wählen</option></select></div>
      <div class="field"><label class="lbl" for="aid">Prüflings-ID vom Deckblatt übernehmen *</label><input class="input" id="aid" placeholder="z. B. AFS-0412"></div>
      <button class="btn primary" id="asg">${icon("check")} Zuordnung bestätigen</button></div>
      <div><div class="xs muted mb">Deckblatt dieser Datei</div>${PX.pageHtml(target, s.pages[0], { small: true })}</div></div></div>`;
  }

  // ---------- Kursmappen: Vollständigkeit & Freigabe ----------
  PX.route(/^scan\/kursmappen$/, () => ({ title: "Kursmappen", shell: "staff", need, render: () => {
    const kms = PX.S.kms.filter((k) => k.school === school() && k.status === "freigegeben");
    const ready = kms.filter((k) => !k.scanReleased && PX.kmScanState(k).complete);
    return `${PX.pagehead("Vollständigkeit und Freigabe", "Abgleich eingescannter Unterlagen mit den erwarteten Prüfungsteilnehmenden")}
      ${kms.length ? kms.map((k) => { const st = PX.kmScanState(k); return `<div class="card pad mt"><div class="row between"><h3>${icon(k.scanReleased ? "folder-check" : "folder")} ${esc(k.name)} <span class="muted small">· ${esc(PX.examShort(k.exam))}</span></h3>
        ${k.scanReleased ? PX.badge("zur Korrektur freigegeben " + PX.fmtD(k.scanReleasedAt), "dark") : st.complete ? PX.badge("vollständig", "green") : PX.badge(`${st.assigned}/${st.expected} zugeordnet${st.blocking ? `, ${st.blocking} mit Mangel` : ""}`, "yellowb")}</div>
        <div class="minigrid mt-s">${PX.mappenOf(k).map((x) => { const sc = x.scan ? PX.byId("scans", x.scan) : null; const q = sc ? PX.qc(sc) : []; const cls = x.absent ? "abs" : !sc ? "miss" : q.some((y) => y.block) ? "bad" : "ok"; return `<a class="mcell ${cls}" ${sc ? `href="#/scan/datei/${sc.id}"` : ""}><b>${esc(x.last)}, ${esc(x.first)}</b><span class="xs">${x.absent ? "nicht teilgenommen" : !sc ? "Scan fehlt" : `${sc.pages.length} Seiten${q.length ? " · " + q.map((y) => y.k).join(", ") : ""}`}</span></a>`; }).join("")}</div></div>`; }).join("")
        + `<div class="row mt"><button class="btn primary" id="rel" ${ready.length ? "" : "disabled"}>${icon("send")} Vollständige Kursmappen zur Korrektur freigeben (${ready.length})</button><span class="small muted">Die Erstkorrektor:innen werden automatisch benachrichtigt.</span></div>`
        : PX.empty("Keine Kursmappen vorhanden.", "folder")}`;
  }, mount: (r) => {
    const b = $("#rel", r); if (b) b.onclick = async () => { const ready = PX.S.kms.filter((k) => k.school === school() && k.status === "freigegeben" && !k.scanReleased && PX.kmScanState(k).complete); if (await PX.confirm("Zur Korrektur freigeben?", `Die Freigabe umfasst alle digitalen Mappen in ${ready.map((k) => esc(k.name)).join(", ")}. Danach können keine Scandateien mehr gelöscht werden; Nachscans erfolgen nur auf Anforderung der Erstkorrektur.`, "Freigeben")) { const kms = O().releaseScans(school()); PX.commit(); PX.toast("Zur Korrektur freigegeben", `${kms.length} Kursmappe(n) – Upload-Protokoll erzeugt`); } };
  } }));

  PX.route(/^scan\/protokoll$/, () => ({ title: "Upload-Protokoll", shell: "staff", need, render: () => { const log = PX.S.uploadLog.filter((l) => l.school === school());
    return `${PX.pagehead("Upload-Protokoll", "Lückenlose Dokumentation der Digitalisierung", `<button class="btn" id="dl">${icon("download")} Als CSV herunterladen</button>`)}${log.length ? `<div class="tablewrap"><table class="tbl"><thead><tr><th>Zeitpunkt</th><th>Benutzer</th><th>Ereignis</th></tr></thead><tbody>${log.map((l) => `<tr><td class="nowrap">${esc(l.at)}</td><td>${esc(PX.name(l.who))}</td><td>${esc(l.text)}</td></tr>`).join("")}</tbody></table></div>` : PX.empty("Noch keine Einträge.", "scroll-text")}`; },
    mount: (r) => { $("#dl", r).onclick = () => PX.download("upload_protokoll.csv", PX.csv([["zeit", "benutzer", "ereignis"], ...PX.S.uploadLog.filter((l) => l.school === school()).map((l) => [l.at, PX.name(l.who), l.text])])); } }));
})();
