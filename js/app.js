/* PASCA Klickdummy – Shell, Rollen, Startseite */
(function () {
  "use strict";
  const PX = window.PX; const { esc, icon } = PX;

  PX.mark = (size = 44) => `<svg class="exmark" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><rect x="2" y="2" width="44" height="44" rx="11" fill="#1d1d1b"/><path d="M11 17v-4.5a1.5 1.5 0 0 1 1.5-1.5H17M31 11h4.5a1.5 1.5 0 0 1 1.5 1.5V17M37 31v4.5a1.5 1.5 0 0 1-1.5 1.5H31M17 37h-4.5a1.5 1.5 0 0 1-1.5-1.5V31" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><rect x="16" y="17" width="11" height="3" rx="1.5" fill="#fff"/><rect x="16" y="23" width="7" height="3" rx="1.5" fill="#fff" opacity=".6"/><path d="M21.5 30.5l4 4 8-10" fill="none" stroke="#ffff00" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  PX.brand = () => `<a class="brand" href="#/" aria-label="PASCA – Startseite">${PX.mark(46)}<span class="wm">PASCA<small>Digitale Korrektur von Abiturprüfungen</small></span></a>`;

  // ---------- Rollen ----------
  PX.ROLES = {
    ibbw: { label: "Prüfungserstellung (IBBW)", short: "IBBW", icon: "pencil-ruler", group: "Land", home: "#/ibbw", persons: ["r.albrecht", "o.mertens"],
      tasks: ["Prüfungsfächer, Korrekturzeichensätze und Korrekturrichtlinien verwalten", "Bewertungsraster mit Pflicht-/Wahlaufgaben, BE und Regeln anlegen, duplizieren, freigeben", "Prüfungen mit Haupt-, Nach- und Nachnachtermin und Korrekturzeiträumen anlegen", "Erwartungshorizont am Prüfungstag hochladen, ersetzen oder löschen"],
      rights: ["Bewertungsgrundlagen bis Prüfungsende nur für die anlegende Person sowie Referats- und Abteilungsleitung", "Keine Einsicht in personenbezogene Prüfungsunterlagen"],
      awf: "AWF-004 bis AWF-058", process: ["Prüfung anlegen"],
      nav: [["#/ibbw", "layout-dashboard", "Übersicht"], ["#/ibbw/pruefungen", "clipboard-list", "Prüfungen"], ["#/ibbw/kalender", "calendar-range", "Korrekturkalender"], ["#/ibbw/faecher", "book-open", "Prüfungsfächer"], ["#/ibbw/raster", "table", "Bewertungsraster"], ["#/ibbw/regeln", "sigma", "Regeln"], ["#/ibbw/zeichen", "pen-line", "Korrekturzeichen"], ["#/ibbw/richtlinien", "book-text", "Richtlinien"]] },
    svc: { label: "Service Center Schule (IBBW)", short: "Service Center", icon: "shield-check", group: "Land", home: "#/svc/audit", persons: ["t.wendling"],
      tasks: ["Audit-Log einsehen, filtern, durchsuchen und exportieren", "Archiv und Aufbewahrungsfristen überwachen (5 Jahre), Löschlauf", "Support für Schulen und Regierungspräsidien"],
      rights: ["Lesezugriff auf das revisionssichere Ereignisprotokoll", "Sensible Daten im Audit-Log teilweise pseudonymisiert"], awf: "AWF-125 bis AWF-127", process: ["Berichtswesen", "Prüfungsergebnisse verwalten"],
      nav: [["#/svc/audit", "history", "Audit-Log"], ["#/svc/archiv", "archive", "Archiv"]] },
    km: { label: "Kultusministerium – Auswertung", short: "KM", icon: "landmark", group: "Land", home: "#/berichte", persons: ["s.lorenz"],
      tasks: ["Parametrisierte Berichte landesweit abrufen (Abiturjahr, Fach, Prüfung, Schule)", "Aggregierte und anonymisierte Auswertungen, Rohdatenexport"],
      rights: ["Nur anonymisierte bzw. aggregierte Ergebnisse"], awf: "AWF-121 bis AWF-124", process: ["Berichtswesen"],
      nav: [["#/berichte", "chart-column", "Berichte"]] },
    rp: { label: "Regierungspräsidium – Schulaufsicht", short: "RP", icon: "building", group: "Schulaufsicht", home: "#/rp", persons: ["k.oberle"],
      tasks: ["RP-weiten fächerspezifischen Pool verwalten und freigeben", "Korrekturgruppen automatisch bilden, prüfen, anpassen und freigeben", "Korrekturfortschritt und Endbeurteilungen im Bezirk überwachen", "Berichte abrufen, Einsichtnahmen begleiten, Bemerkungen (z. B. Nachteilsausgleich) einsehen"],
      rights: ["Zuständigkeit auf den eigenen Regierungsbezirk begrenzt", "Kann jederzeit manuell in Zuweisungen eingreifen – alle Änderungen werden protokolliert"], awf: "AWF-071 bis AWF-085, AWF-121 bis AWF-124", process: ["Korrekturgruppen bilden", "Berichtswesen"],
      nav: [["#/rp", "layout-dashboard", "Übersicht"], ["#/rp/pool", "users-round", "RP-Pool"], ["#/rp/gruppen", "network", "Korrekturgruppen"], ["#/rp/stand", "gauge", "Korrekturstand"], ["#/berichte", "chart-column", "Berichte"], ["#/rp/archiv", "archive", "Einsicht & Archiv"]] },
    slt: { label: "Schulleitungsteam", short: "SLT", icon: "building-2", group: "Schule", home: "#/slt", persons: ["m.haldenwang", "u.fender", "b.kolb", "c.vogt", "r.seiler"],
      tasks: ["Prüfungsdaten aus ASV oder per CSV importieren, Kursmappen prüfen und freigeben", "Korrigierende Lehrkräfte der eigenen Schule bestimmen und bestätigen", "Prüfungstag vorbereiten: Deckblätter, Nachteilsausgleich, Nicht-Teilnahme, Nachtermin", "Abschluss der Korrekturstufen bestätigen oder zurückverfügen", "Ergebnisse für ASV exportieren, Einsichtnahme als PDF bereitstellen"],
      rights: ["Nur Daten der eigenen Schule", "Während der Korrektur nur formaler Fortgang, Inhalte erst nach Abschluss"], awf: "AWF-059 bis AWF-070, AWF-081 bis AWF-086, AWF-108 bis AWF-120", process: ["Zuordnung Lehrkräfte und Prüflinge", "Vorbereitung Prüfungstag", "Korrektur abschließen", "Prüfungsergebnisse verwalten"],
      nav: [["#/slt", "layout-dashboard", "Übersicht"], ["#/slt/import", "upload", "Datenimport"], ["#/slt/kursmappen", "folder-open", "Kursmappen"], ["#/slt/pruefungstag", "calendar-clock", "Prüfungstag"], ["#/slt/korrektoren", "user-check", "Korrektor:innen"], ["#/slt/stand", "gauge", "Korrekturstand"], ["#/slt/ergebnisse", "file-check", "Ergebnisse"]] },
    sco: { label: "Scan-Operator", short: "Scan", icon: "scan", group: "Schule", home: "#/scan", persons: ["p.sommer", "j.keil"],
      tasks: ["Prüfungsunterlagen kursweise einscannen (systemseitig) oder lokal scannen und hochladen", "Qualität prüfen: Vollständigkeit, Seitenzahl, Lesbarkeit, Auflösung; Seiten drehen und sortieren", "Zuordnung per Barcode prüfen, nicht erkannte Dateien manuell zuordnen", "Vollständige Kursmappen zur Korrektur freigeben, Upload-Protokoll"],
      rights: ["Keine inhaltliche Prüfung, keine Einsicht in Bewertungen", "Nur Kursmappen der eigenen Schule"], awf: "AWF-087 bis AWF-094", process: ["Digitalisieren und Freigeben"],
      nav: [["#/scan", "scan", "Scan-Eingang"], ["#/scan/kursmappen", "folder-check", "Kursmappen"], ["#/scan/protokoll", "scroll-text", "Upload-Protokoll"]] },
    lk: { label: "Lehrkraft (Korrektur)", short: "Korrektur", icon: "file-pen-line", group: "Korrektur", home: "#/korr", persons: [],
      tasks: [], rights: [], awf: "AWF-095 bis AWF-107", process: ["Korrektur durchführen", "Korrektur abschließen"],
      nav: [["#/korr", "notebook-pen", "Meine Korrekturen"]] },
  };
  // Drei Korrekturstufen als eigene Rollenkarten (technisch dieselbe Rolle „Lehrkraft“, Stufe ergibt sich aus der Korrekturgruppe)
  PX.CARDS = [
    { key: "ibbw" }, { key: "svc" }, { key: "km" }, { key: "rp" }, { key: "slt" }, { key: "sco" },
    { key: "lk", stage: "ek", label: "Erstkorrektur", icon: "file-pen-line", color: "red", persons: ["j.kroeger", "f.brandt", "t.hahn", "d.reuter"],
      tasks: ["Zugewiesene Kursmappen im Dashboard, Korrekturzeitraum mit Frist", "Unterlagen sichten, Seiten drehen/sortieren, Nachscan beim Scan-Operator anfordern", "Korrekturzeichen (rot, rechts), Bewertungsraster, ggf. Gutachten, private Notizen", "Personenbezogene Daten schwärzen, Kursmappenabschluss bestätigen"],
      rights: ["Sieht Namen der eigenen Prüflinge und Nachteilsausgleich", "Bewertungsgrundlagen erst nach Prüfungsende"] },
    { key: "lk", stage: "zk", label: "Zweitkorrektur", icon: "file-pen-line", color: "green", persons: ["d.reuter", "j.kroeger", "f.brandt", "n.engel"],
      tasks: ["Anonymisierte Mappen einer anderen Schule (Kopfzeile, Deckblatt ausgeblendet)", "Korrekturzeichen der Erstkorrektur sichtbar – Punkte und Raster der EK verborgen", "Eigene Bewertung im Raster (grün, links), Kursmappenabschluss bestätigen"],
      rights: ["Keine Rückschlüsse auf Prüflinge oder Erstkorrektur-Bewertung", "Nachteilsausgleich einsehbar"] },
    { key: "lk", stage: "eb", label: "Endbeurteilung", icon: "scale", color: "brown", persons: ["h.saalfeld", "i.brecht", "m.ruf"],
      tasks: ["Start erst ab festgelegtem Termin (alle ZK im Land abgeschlossen)", "Pflichtmappen (Abweichung > 3 NP bzw. Stichprobe) hervorgehoben, weitere Mappen freiwillig", "Einsicht in Berichte und Raster von EK und ZK; Bewertung bestimmt die Endnote"],
      rights: ["Anonymisierte Ansicht", "Abschluss auch ohne Korrektur möglich, wenn keine Pflichtmappe vorliegt"] },
  ];
  PX.roleLabel = () => { const s = PX.session.get(); return s.stage ? PX.STAGE[s.stage] : PX.ROLES[s.role]?.label || ""; };

  // ---------- Shell ----------
  const MILESTONES = () => { const ex = PX.mainExam(); if (!ex) return [["2027-01-18", "Planungsphase"]]; return [["2027-01-18", "Planungsphase"], [PX.addDays(ex.date, -1), "Vortag der Prüfung"], [ex.date, "Prüfungstag " + PX.subj(ex.subject).short], [PX.addDays(ex.date, 1), "Digitalisierung"], [PX.addDays(ex.ekEnd, -2), "Frist EK in 2 Tagen"], [PX.addDays(ex.zkEnd, -2), "Frist ZK in 2 Tagen"], [ex.ebStart, "Beginn Endbeurteilung"], [PX.addDays(ex.ebEnd, 3), "Nach der Korrektur"], ["2027-08-01", "Aufbewahrungsende Abitur 2022"]]; };
  function topbar() {
    const me = PX.me(); const unread = me ? PX.S.notes.filter((n) => n.to === me.id && !n.read).length : 0;
    return `<header class="topbar">${PX.brand()}
      <div class="row tb-right">
        <div class="pop"><button class="demotime" data-time title="Demo-Zeit: simuliertes Datum">${icon("calendar-range")}<span><small>Demo-Zeit</small>${PX.fmtDW(PX.S.now)}</span>${icon("chevron-down")}</button>
          <div class="menu hidden" data-timemenu><div class="hd">Simuliertes Datum setzen</div>${MILESTONES().map(([d, l]) => `<button data-settime="${d}">${icon(d === PX.S.now ? "circle-dot" : "circle")}<span>${PX.fmtD(d)}<br><small class="muted">${esc(l)}</small></span></button>`).join("")}<div class="sep"></div><button data-plusday>${icon("plus")} einen Tag weiter</button></div></div>
        ${me ? `<div class="pop"><button class="iconbtn bell" data-bell aria-label="Benachrichtigungen">${icon("bell", "lg")}${unread ? `<i>${unread}</i>` : ""}</button><div class="menu notes hidden" data-notes>${notesHtml(me)}</div></div>` : ""}
        <div class="usermenu pop"><button data-usermenu>${icon("circle-user", "lg")}<span class="nm">${me ? esc(PX.name(me)) : "Gast"}<small>${esc(PX.roleLabel())}${me ? " · " + esc(PX.orgShort(me.org)) : ""}</small></span>${icon("chevron-down")}</button>
          <div class="menu hidden" data-umenu><button data-rolecard>${icon("contact")} Meine Rollenkarte</button><a href="#/">${icon("users")} Rolle / Person wechseln</a><a href="#/prozess">${icon("workflow")} Prozesslandkarte</a><div class="sep"></div><button data-reset>${icon("rotate-ccw")} Demo zurücksetzen</button></div></div>
      </div></header>`;
  }
  function notesHtml(me) {
    const ns = PX.S.notes.filter((n) => n.to === me.id).slice(0, 12);
    return `<div class="hd">Benachrichtigungen</div>${ns.length ? ns.map((n) => `<a href="${n.link || "#"}" data-note="${n.id}" class="${n.read ? "" : "unread"}"><span>${esc(n.text)}<br><small class="muted">${esc(n.at)}</small></span></a>`).join("") : `<div class="small muted" style="padding:8px 12px">Keine Benachrichtigungen</div>`}`;
  }
  PX.shell = function (v) {
    const R = PX.ROLES[PX.role()] || { nav: [] };
    const h = location.hash.split("?")[0];
    const act = (href) => h === href || (href.length > 4 && h.startsWith(href + "/")) || (href === "#/korr" && h.startsWith("#/korr"));
    return `<a class="skiplink" href="#main">Zum Inhalt springen</a>${topbar()}
      <div class="shell"><aside class="rail"><nav aria-label="Hauptnavigation">${R.nav.map(([href, ic, l]) => `<a href="${href}" class="${act(href) ? "active" : ""}"><span class="pill">${icon(ic, "lg")}</span>${esc(l)}</a>`).join("")}</nav>
      <div class="railfoot"><a href="#/">${icon("users")}<span>Rolle wechseln</span></a></div></aside>
      <main id="main" class="main">${v.render()}</main></div>`;
  };
  PX.plainShell = (v) => `${topbar()}<main id="main" class="main plain">${v.render()}</main>`;
  PX.paintChrome = function () { const tb = PX.$(".topbar"); if (tb && !document.querySelector(".pop .menu:not(.hidden)")) { tb.outerHTML = topbar(); bindTop(document); } };
  function bindTop(root) {
    const toggle = (btnSel, menuSel) => { const b = PX.$(btnSel, root); if (!b) return; b.onclick = (e) => { e.stopPropagation(); const m = b.parentElement.querySelector(menuSel); const was = m.classList.contains("hidden"); PX.$$(".pop .menu").forEach((x) => x.classList.add("hidden")); if (was) m.classList.remove("hidden"); }; };
    toggle("[data-time]", "[data-timemenu]"); toggle("[data-bell]", "[data-notes]"); toggle("[data-usermenu]", "[data-umenu]");
    PX.$$("[data-settime]", root).forEach((b) => (b.onclick = () => { PX.setNow(b.dataset.settime); PX.commit(); PX.toast("Demo-Zeit gesetzt", PX.fmtDW(PX.S.now), "info"); }));
    const pd = PX.$("[data-plusday]", root); if (pd) pd.onclick = () => { PX.setNow(PX.addDays(PX.S.now, 1)); PX.commit(); };
    PX.$$("[data-note]", root).forEach((a) => (a.onclick = () => { const n = PX.S.notes.find((x) => x.id === a.dataset.note); if (n) n.read = true; PX.save(); }));
    const rc = PX.$("[data-rolecard]", root); if (rc) rc.onclick = () => { const s = PX.session.get(); const c = PX.CARDS.find((x) => x.key === s.role && (!x.stage || x.stage === s.stage)) || PX.CARDS.find((x) => x.key === s.role); c && PX.roleCard(c); };
    const rs = PX.$("[data-reset]", root); if (rs) rs.onclick = async () => { if (await PX.confirm("Demo zurücksetzen?", "Alle Änderungen in diesem Browser werden verworfen. Laufende Klickstrecken werden beendet.", "Zurücksetzen", true)) { PX.reset(); PX.guide && PX.guide.stop(true); PX.save(); PX.go("#/"); PX.toast("Demo zurückgesetzt", "Ausgangszustand: Planungsphase"); } };
  }
  PX.bindShell = function (root) { bindTop(root); };
  document.addEventListener("click", (e) => { if (!e.target.closest(".pop")) PX.$$(".pop .menu").forEach((x) => x.classList.add("hidden")); });

  // ---------- Rollenkarte ----------
  PX.cardData = (c) => { const R = PX.ROLES[c.key]; return { label: c.label ? "Lehrkraft – " + c.label : R.label, icon: c.icon || R.icon, tasks: c.tasks || R.tasks, rights: c.rights || R.rights, persons: c.persons || R.persons, awf: R.awf, process: R.process, group: R.group }; };
  PX.roleCard = function (c) {
    const d = PX.cardData(c);
    const guides = (PX.GUIDES || []).filter((g) => g.steps().some((s) => s.as && s.as.role === c.key && (!c.stage || !s.as.stage || s.as.stage === c.stage)));
    PX.modal({ title: "Rollenkarte: " + d.label, size: "wide", icon: d.icon,
      body: `<div class="rcard"><div class="rcard-head ${c.color || ""}"><div class="rico">${icon(d.icon, "xl")}</div><div><div class="xs muted bold">${esc(d.group)}</div><h3>${esc(d.label)}</h3><div class="small">Anwendungsfälle laut Lastenheft: <b>${esc(d.awf)}</b></div></div></div>
        <div class="grid2 mt"><div><h4>${icon("list-checks")} Aufgaben im Verfahren</h4><ul class="tight">${d.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
        <div><h4>${icon("lock")} Rechte und Sichtbarkeit</h4><ul class="tight">${d.rights.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <h4 class="mt">${icon("workflow")} Teilprozesse</h4><div class="row wrap" style="gap:6px">${d.process.map((p) => PX.badge(p, "gray")).join("")}</div></div></div>
        <h4 class="mt">${icon("users")} Demo-Personen</h4><div class="row wrap" style="gap:8px">${d.persons.map((p) => `<button class="btn sm" data-as="${p}">${icon("log-in")} ${esc(PX.name(p))} <span class="muted">· ${esc(PX.orgShort(PX.byId("persons", p).org))}</span></button>`).join("")}</div>
        ${guides.length ? `<h4 class="mt">${icon("route")} Klickstrecken mit dieser Rolle</h4><div class="row wrap" style="gap:8px">${guides.map((g) => `<button class="btn sm ghost" data-guide="${g.id}">${icon(g.icon)} ${esc(g.title)}</button>`).join("")}</div>` : ""}</div>`,
      foot: `<button class="btn" data-print>${icon("printer")} Drucken</button><button class="btn primary" data-close>Schließen</button>`,
      onMount: (m, close) => {
        PX.$$("[data-as]", m).forEach((b) => (b.onclick = () => { close(); enterAs(c, b.dataset.as); }));
        PX.$$("[data-guide]", m).forEach((b) => (b.onclick = () => { close(); PX.guide.start(b.dataset.guide); }));
        PX.$("[data-print]", m).onclick = () => window.print();
      } });
  };
  function enterAs(c, pid) { PX.session.set({ role: c.key, person: pid, stage: c.stage || "" }); PX.go(PX.ROLES[c.key].home); PX.toast("Angemeldet", `${PX.name(pid)} · ${c.label ? "Lehrkraft – " + c.label : PX.ROLES[c.key].label}`, "info"); }
  PX.enterAs = (role, pid, stage) => enterAs(PX.CARDS.find((c) => c.key === role && (!stage || c.stage === stage)) || { key: role }, pid);

  // ---------- Prozesslandkarte ----------
  PX.PROCESS = [
    { id: "p1", t: "Prüfung anlegen", r: "IBBW", g: "k1", ic: "pencil-ruler" },
    { id: "p2", t: "Zuordnung Lehrkräfte und Prüflinge", r: "Schulleitungsteam", g: "k2", ic: "upload" },
    { id: "p3", t: "Korrekturgruppen bilden und Korrektur zuweisen", r: "RP · Schulleitungsteam", g: "k3", ic: "network" },
    { id: "p4", t: "Vorbereitung Prüfungstag", r: "Schulleitungsteam", g: "k4", ic: "calendar-clock" },
    { id: "p5", t: "Digitalisieren und Freigeben", r: "Scan-Operator", g: "k5", ic: "scan" },
    { id: "p6", t: "Korrektur durchführen", r: "Lehrkräfte EK · ZK · EB", g: "k6", ic: "file-pen-line" },
    { id: "p7", t: "Korrektur abschließen", r: "Lehrkräfte · Schulleitungsteam", g: "k6", ic: "clipboard-check" },
    { id: "p8", t: "Prüfungsergebnisse verwalten", r: "Schulleitungsteam", g: "k7", ic: "file-check" },
    { id: "p9", t: "Berichtswesen", r: "RP · KM · IBBW", g: "k8", ic: "chart-column" },
  ];
  const processMap = () => `<div class="pmap">${PX.PROCESS.map((p, i) => `<button class="pstep" data-guide="${p.g}" title="Klickstrecke starten"><span class="pn">${i + 1}</span>${icon(p.ic, "lg")}<b>${esc(p.t)}</b><small>${esc(p.r)}</small></button>`).join(`<span class="parrow">${icon("chevron-right")}</span>`)}</div>`;

  // ---------- Startseite ----------
  function startView() {
    const groups = ["Land", "Schulaufsicht", "Schule", "Korrektur"];
    const card = (c, i) => { const d = PX.cardData(c); return `<div class="rolecard ${c.color || ""}"><div class="row between"><div class="rico">${icon(d.icon, "lg")}</div><button class="link small" data-card="${i}">${icon("contact")} Rollenkarte</button></div><h3>${esc(d.label)}</h3>
      <ul>${d.tasks.slice(0, 3).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      <label class="lbl mt-s" for="p${i}">Person</label><select class="select" id="p${i}">${d.persons.map((p) => `<option value="${p}">${esc(PX.name(p))} (${esc(PX.orgShort(PX.byId("persons", p).org))})</option>`).join("")}</select>
      <button class="btn primary" data-enter="${i}">${icon("arrow-right")} Anmelden</button></div>`; };
    return { title: "Rollenwahl", render: () => `<div class="start"><header class="topbar">${PX.brand()}<span class="bold hide-s">Klickdummy · Lastenheft Stand 23.10.2026</span></header>
      <div class="wrap">
        <h1>Anmelden als …</h1>
        <p class="lead mt">Klickdummy zum Lastenheft PASCA. Er bildet den Gesamtprozess der digitalen Korrektur ab – vom Anlegen der Prüfung bis zu Berichten und Archivierung. Alle Personen, Schulen und Prüflinge sind fiktiv; die Daten liegen nur in diesem Browser. Oben rechts stellen Sie die <b>Demo-Zeit</b>, damit Fristen und zeitabhängige Regeln greifen.</p>
        ${PX.guide ? PX.guide.picker() : ""}
        <h2 class="rolesec">${icon("workflow")} Prozesslandkarte</h2>
        <p class="small muted">Neun Teilprozesse laut Lastenheft 3.2.1 – ein Klick startet die passende Klickstrecke.</p>
        ${processMap()}
        ${groups.map((gr) => `<h2 class="rolesec">${icon(gr === "Land" ? "landmark" : gr === "Schulaufsicht" ? "building" : gr === "Schule" ? "school" : "file-pen-line")} ${esc(gr)}</h2>
          <div class="rolegrid">${PX.CARDS.map((c, i) => [c, i]).filter(([c]) => PX.cardData(c).group === gr).map(([c, i]) => card(c, i)).join("")}</div>`).join("")}
        <div class="demo-strip"><button class="btn" data-allcards>${icon("printer")} Alle Rollenkarten drucken</button><button class="btn ghost" data-reset2>${icon("rotate-ccw")} Demo zurücksetzen</button><span class="small muted">Version ${PX.VERSION} · Datenstand: ${PX.fmtDW(PX.S.now)}${PX.S.stage ? " · Stufe „" + esc(PX.stages.list.find((s) => s.id === PX.S.stage)?.label || "") + "“" : ""}</span></div>
      </div></div>`,
      mount: (root) => {
        PX.$$("[data-enter]", root).forEach((b) => (b.onclick = () => { const c = PX.CARDS[+b.dataset.enter]; enterAs(c, PX.$("#p" + b.dataset.enter).value); }));
        PX.$$("[data-card]", root).forEach((b) => (b.onclick = () => PX.roleCard(PX.CARDS[+b.dataset.card])));
        PX.$$(".pstep", root).forEach((b) => (b.onclick = () => PX.guide.start(b.dataset.guide)));
        PX.$("[data-allcards]", root).onclick = () => PX.go("#/rollenkarten");
        PX.$("[data-reset2]", root).onclick = async () => { if (await PX.confirm("Demo zurücksetzen?", "Alle Änderungen in diesem Browser werden verworfen.", "Zurücksetzen", true)) { PX.reset(); PX.guide.stop(true); PX.save(); PX.render(); } };
        PX.guide && PX.guide.bindPicker(root);
      } };
  }
  PX.route(/^$/, () => startView());
  PX.route(/^prozess$/, () => ({ title: "Prozesslandkarte", shell: "plain", render: () => `<div class="pagehead"><div><h1>Prozesslandkarte</h1><div class="sub">Hauptprozess der digitalen Korrektur (Lastenheft 3.2.1)</div></div></div>${processMap()}
    <div class="card pad mt"><h3>Status der Demo-Prüfung</h3>${PX.mainExam() ? `<p class="small">${esc(PX.examLabel(PX.mainExam()))}</p>${statusTable()}` : `<p class="small muted">Die Prüfung VBWL 2027 ist noch nicht angelegt.</p>`}</div>`, mount: (r) => PX.$$(".pstep", r).forEach((b) => (b.onclick = () => PX.guide.start(b.dataset.guide))) }));
  function statusTable() { return `<div class="tablewrap mt-s"><table class="tbl compact"><thead><tr><th>Kursmappe</th><th>Schule</th><th>Mappen</th><th>Phase</th></tr></thead><tbody>${PX.S.kms.filter((k) => k.exam === PX.mainExam().id).map((k) => { const p = PX.phase(k); return `<tr><td>${esc(k.name)}</td><td>${esc(PX.orgName(k.school))}</td><td>${PX.activeMappen(k).length}</td><td>${PX.badge(p.label, p.kind)}</td></tr>`; }).join("")}</tbody></table></div>`; }
  PX.route(/^rollenkarten$/, () => ({ title: "Rollenkarten", render: () => `<div class="printcards"><div class="row between noprint" style="padding:16px"><a class="btn" href="#/">${icon("arrow-left")} Zurück</a><button class="btn primary" onclick="window.print()">${icon("printer")} Drucken</button></div>
    ${PX.CARDS.map((c) => { const d = PX.cardData(c); return `<section class="pcard ${c.color || ""}"><header><div class="rico">${icon(d.icon, "lg")}</div><div><small>${esc(d.group)} · ${esc(d.awf)}</small><h2>${esc(d.label)}</h2></div><span class="pbrand">${PX.mark(30)} PASCA</span></header>
      <div class="grid2"><div><h4>Aufgaben</h4><ul>${d.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div><div><h4>Rechte und Sichtbarkeit</h4><ul>${d.rights.map((t) => `<li>${esc(t)}</li>`).join("")}</ul><h4>Teilprozesse</h4><p>${d.process.map(esc).join(" · ")}</p><h4>Demo-Personen</h4><p>${d.persons.map((p) => esc(PX.name(p)) + " (" + esc(PX.orgShort(PX.byId("persons", p).org)) + ")").join(", ")}</p></div></div></section>`; }).join("")}</div>` }));

  // ---------- Gemeinsame Bausteine für Ansichten ----------
  PX.pagehead = (title, sub, actions = "") => `<div class="pagehead"><div><h1>${esc(title)}</h1>${sub ? `<div class="sub">${sub}</div>` : ""}</div><div class="row wrap">${actions}</div></div>`;
  PX.needExam = () => (PX.mainExam() ? "" : `<div class="notice warn">${icon("info")}<div><b>Die Prüfung „VBWL – Haupttermin 2027“ ist noch nicht angelegt.</b><br>Starten Sie die Klickstrecke „Prüfung anlegen“ oder einen späteren Ausgangszustand.</div></div>`);
  PX.phaseBar = (km) => { const p = PX.phase(km); return `<div class="phasebar">${PX.PHASES.map((l, i) => `<span class="${i < p.step ? "done" : i === p.step ? "cur" : ""}">${esc(l)}</span>`).join("")}</div>`; };
  PX.stageColor = { ek: "red", zk: "green", eb: "brown" };

  PX.VERSION = "1.0";
  PX.start = function () { PX.load(); PX.render(); };
})();
