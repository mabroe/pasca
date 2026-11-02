/* PASCA Klickdummy – Fachlogik und Fachoperationen
   Alle UI-Aktionen und das „Vorspulen“ der Klickstrecken nutzen dieselben Operationen. */
(function () {
  "use strict";
  const PX = window.PX;
  const S = () => PX.S;

  // ---------- Nachschlagen ----------
  PX.TYPE = { HT: "Haupttermin", NT: "Nachtermin", NNT: "Nachnachtermin" };
  PX.STAGE = { ek: "Erstkorrektur", zk: "Zweitkorrektur", eb: "Endbeurteilung" };
  PX.STAGE_SHORT = { ek: "EK", zk: "ZK", eb: "EB" };
  PX.subj = (id) => PX.byId("subjects", id);
  const sbx = (col, id) => (S().sandbox?.[col] || []).find((x) => x.id === id) || null;
  PX.exam = (id) => PX.byId("exams", id) || sbx("exams", id);
  PX.km = (id) => PX.byId("kms", id) || sbx("kms", id);
  PX.mappe = (id) => PX.byId("mappen", id) || sbx("mappen", id);
  PX.examLabel = (ex) => { if (typeof ex === "string") ex = PX.exam(ex); if (!ex) return "–"; const s = PX.subj(ex.subject); return `${s ? s.name : ex.subject} · ${PX.TYPE[ex.type]} ${ex.year}`; };
  PX.examShort = (ex) => { if (typeof ex === "string") ex = PX.exam(ex); if (!ex) return "–"; const s = PX.subj(ex.subject); return `${s ? s.short : ex.subject} ${ex.type} ${ex.year}`; };
  PX.raster = (ex) => PX.byId("rasters", (typeof ex === "string" ? PX.exam(ex) : ex)?.raster);
  PX.signsFor = (subject) => S().signs.filter((z) => z.subjects.includes(subject));
  PX.kmLabel = (km) => { if (typeof km === "string") km = PX.km(km); return km ? `${km.name} · ${PX.orgShort(km.school)}` : "–"; };
  PX.mappenOf = (km) => (String(km.id || km).startsWith("sbx-") ? S().sandbox?.mappen || [] : S().mappen).filter((m) => m.km === (km.id || km)).sort((a, b) => a.nr.localeCompare(b.nr));
  PX.activeMappen = (km) => PX.mappenOf(km).filter((m) => !m.absent);
  PX.groupOf = (km) => S().groups.find((g) => g.km === (km.id || km)) || null;
  PX.schools = () => S().orgs.filter((o) => o.kind === "schule");
  PX.sltOf = (school) => S().persons.filter((p) => p.org === school && p.roles.includes("slt"));
  PX.scoOf = (school) => S().persons.filter((p) => p.org === school && p.roles.includes("sco"));
  PX.dist = (a, b) => {
    const A = PX.org(a)?.geo, B = PX.org(b)?.geo; if (!A || !B) return 999;
    const t = (x) => (x * Math.PI) / 180, R = 6371;
    const q = Math.sin(t(B[0] - A[0]) / 2) ** 2 + Math.cos(t(A[0])) * Math.cos(t(B[0])) * Math.sin(t(B[1] - A[1]) / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(q)));
  };
  PX.examPassed = (ex) => !!ex && S().now >= ex.date; // Prüfung durchgeführt → Bewertungsgrundlagen für Schulen sichtbar
  PX.pseudo = (m) => { const list = PX.activeMappen(PX.km(m.km)); const i = list.findIndex((x) => x.id === m.id); return "Mappe " + String(i + 1).padStart(2, "0"); };
  PX.hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967295; };

  // ---------- Korrekturkalender ----------
  PX.CAL_FIELDS = [["ekEnd", "Ende Erstkorrektur"], ["zkEnd", "Ende Zweitkorrektur"], ["ebStart", "Beginn Endbeurteilung"], ["ebEnd", "Ende Endbeurteilung"]];
  PX.calendarFor = (form, type, year) => S().calendars.find((c) => c.form === form && c.type === type && c.year === year) || null;
  PX.examForm = (ex) => PX.schulform(ex.subject);
  // Prüfung mit Korrekturkalender verknüpfen und Voreinstellungen ergänzen
  PX.initExam = function (e, st) {
    st = st || S();
    const subj = st.subjects.find((x) => x.id === e.subject); const form = /allgemein/i.test(subj?.form || "") ? "AG" : "BG";
    const cal = st.calendars.find((c) => c.form === form && c.type === e.type && c.year === e.year);
    if (cal && !e.ekEnd) { e.cal = cal.id; PX.CAL_FIELDS.forEach(([f]) => (e[f] = cal[f])); }
    if (!e.partSigns) e.partSigns = {};
    if (!e.signset) e.signset = st.signs.filter((z) => z.subjects.includes(e.subject)).map((z) => z.id);
    return e;
  };
  // Zeichen einer Prüfung (optional je Prüfungsteil eingeschränkt)
  PX.examSigns = (ex, partId) => { const set = ex.partSigns?.[partId]?.length ? ex.partSigns[partId] : ex.signset || []; return S().signs.filter((z) => set.includes(z.id)); };

  // ---------- Status einer Kursmappe ----------
  PX.stageState = (km, stage) => {
    const st = km.stages[stage];
    const g = PX.groupOf(km);
    const teachers = stage === "ek" ? (g?.ek.teachers || km.teachers) : g?.[stage]?.teacher ? [g[stage].teacher] : [];
    const lkDone = teachers.length > 0 && teachers.every((t) => st.lkDone.includes(t));
    return { ...st, teachers, lkDone };
  };
  PX.stageOpen = (km, stage) => {
    const ex = PX.exam(km.exam);
    if (stage === "ek") return !!km.scanReleased;
    if (stage === "zk") return !!km.stages.ek.sltOk;
    if (stage === "eb") return !!km.stages.zk.sltOk && S().now >= ex.ebStart;
    return false;
  };
  PX.phase = (km) => {
    const g = PX.groupOf(km);
    const rp = S().rp[PX.org(km.school)?.rp] || {};
    if (km.status !== "freigegeben") return { key: "import", label: "Zuordnung prüfen", kind: "yellowb", step: 0 };
    if (!g || !rp.released) return { key: "gruppen", label: "Korrekturgruppe offen", kind: "gray", step: 1 };
    if (!km.scanReleased) return { key: "scan", label: "Digitalisierung", kind: "cyan", step: 2 };
    if (!km.stages.ek.sltOk) return { key: "ek", label: "Erstkorrektur", kind: "red", step: 3 };
    if (!km.stages.zk.sltOk) return { key: "zk", label: "Zweitkorrektur", kind: "green", step: 4 };
    if (!km.stages.eb.sltOk) return { key: "eb", label: "Endbeurteilung", kind: "brown", step: 5 };
    if (!km.exported) return { key: "ergebnis", label: "Ergebnisse liegen vor", kind: "lime", step: 6 };
    return { key: "archiv", label: "Exportiert · archiviert", kind: "dark", step: 7 };
  };
  PX.PHASES = ["Import", "Korrekturgruppe", "Digitalisierung", "Erstkorrektur", "Zweitkorrektur", "Endbeurteilung", "Ergebnis", "Archiv"];

  // Korrekturaufträge einer Person
  PX.assignments = (pid) => {
    const out = [];
    S().kms.forEach((km) => {
      const g = PX.groupOf(km); const rp = S().rp[PX.org(km.school)?.rp] || {};
      if (!g || !rp.released) return;
      if (g.ek.teachers.includes(pid)) out.push({ km, stage: "ek" });
      if (g.zk.teacher === pid && g.zk.confirmed) out.push({ km, stage: "zk" });
      if (g.eb.teacher === pid && g.eb.confirmed) out.push({ km, stage: "eb" });
    });
    return out;
  };

  // ---------- Testkorrektur (Sandbox je Bewertungsraster) ----------
  // Erzeugt eine Test-Kursmappe mit drei Beispielarbeiten, um jedes Raster im echten Korrekturmodus auszuprobieren.
  PX.sandboxFor = function (rasterId, reset) {
    const r = PX.byId("rasters", rasterId); if (!r) return null;
    S().sandbox = S().sandbox || { exams: [], kms: [], mappen: [] }; const sb = S().sandbox;
    const exId = "sbx-ex-" + r.id, kmId = "sbx-km-" + r.id;
    if (reset) { sb.mappen = sb.mappen.filter((m) => m.km !== kmId); sb.kms = sb.kms.filter((k) => k.id !== kmId); sb.exams = sb.exams.filter((e) => e.id !== exId); }
    let km = sb.kms.find((k) => k.id === kmId);
    if (!km) {
      const real = S().exams.find((e) => e.raster === r.id);
      const ex = PX.initExam({ id: exId, subject: r.subject, type: "HT", year: r.year || 2027, date: "2027-04-20", raster: r.id, guideline: real?.guideline || "", status: "test", sandbox: true, ewh: { file: "Erwartungshorizont_Test.pdf", date: S().now }, partSigns: PX.clone(real?.partSigns || {}), signset: real?.signset ? [...real.signset] : undefined });
      ex.ekEnd = ex.zkEnd = ex.ebStart = ex.ebEnd = "2099-12-31"; sb.exams.push(ex);
      km = { id: kmId, exam: exId, school: "afs", course: "TEST-" + (PX.subj(r.subject)?.short || ""), name: "Testkursmappe", teachers: [], status: "freigegeben", scanReleased: true, sandbox: true, stages: { ek: { lkDone: [], sltOk: true }, zk: { lkDone: [], sltOk: true }, eb: { lkDone: [], sltOk: false } } };
      sb.kms.push(km);
      [["T01", "Anna", "Beispiel"], ["T02", "Ben", "Muster"], ["T03", "Cem", "Probe"]].forEach(([nr, first, last], i) => {
        const id = `sbx-${r.id}-${i + 1}`; const n = 3 + i % 2;
        const pages = [{ id: id + "-p0", kind: "deckblatt", n: 0, rot: 0 }]; for (let j = 1; j <= n; j++) pages.push({ id: id + "-p" + j, kind: "blatt", n: j, rot: 0 }); pages.push({ id: id + "-pk", kind: "konzept", n: n + 1, rot: 0, konzeptBy: "farbe" });
        sb.mappen.push({ id, km: kmId, student: "sbx-" + nr + r.id, first, last, nr: "TEST-" + nr, nta: "", absent: "", pages, corr: {}, lock: null, ebRequired: i === 2 ? "abweichung" : "", diff: null, final: null, sandbox: true });
      });
    }
    return km;
  };

  // ---------- Prüfung anlegen ----------
  PX.ops = {};
  const O = PX.ops;
  O.createExams = function (d) {
    // d: { subject, terms:[{type,date,time,end,ekEnd,zkEnd,ebStart,ebEnd}], raster, guideline, zusatz }
    const created = [];
    d.terms.forEach((t) => {
      const cal = PX.calendarFor(PX.schulform(d.subject), t.type, +t.date.slice(0, 4));
      const own = t.own || !cal;
      const ex = { id: PX.uid("ex-"), subject: d.subject, type: t.type, year: +t.date.slice(0, 4), date: t.date, time: t.time || "08:30", end: t.end || "13:00", cal: own ? null : cal.id, ekEnd: own ? t.ekEnd : cal.ekEnd, zkEnd: own ? t.zkEnd : cal.zkEnd, ebStart: own ? t.ebStart : cal.ebStart, ebEnd: own ? t.ebEnd : cal.ebEnd, raster: d.raster, guideline: d.guideline || "", ewh: null, zusatz: !!d.zusatz, status: "angelegt", creator: PX.actorId() || "r.albrecht", signset: d.signset || PX.signsFor(d.subject).map((z) => z.id), partSigns: PX.clone(d.partSigns || {}) };
      S().exams.push(ex); created.push(ex);
      PX.audit("Prüfung angelegt", PX.examLabel(ex), `Termin ${PX.fmtD(ex.date)}, ${ex.cal ? "Korrekturkalender übernommen" : "eigene Korrekturzeiträume"}: EK bis ${PX.fmtD(ex.ekEnd)}, ZK bis ${PX.fmtD(ex.zkEnd)}, EB ${PX.fmtD(ex.ebStart)}–${PX.fmtD(ex.ebEnd)}`);
    });
    PX.notify(S().persons.filter((p) => p.roles.includes("slt")).map((p) => p.id), `Neue Prüfung angelegt: ${PX.examLabel(created[0])}. Sie können mit der Prüfungsvorbereitung (Datenimport) beginnen.`, "#/slt/import");
    return created;
  };
  O.uploadEWH = function (examId, file) {
    const ex = PX.exam(examId); ex.ewh = { file: file || `Erwartungshorizont_${PX.subj(ex.subject).short}_${ex.type}_${ex.year}.pdf`, date: S().now };
    PX.audit("Erwartungshorizont hochgeladen", PX.examLabel(ex), ex.ewh.file);
    if (PX.examPassed(ex)) PX.notify(correctorsOfExam(examId), `Der Erwartungshorizont für ${PX.examLabel(ex)} wurde geändert.`);
  };
  function correctorsOfExam(examId) { const ids = new Set(); S().kms.filter((k) => k.exam === examId).forEach((k) => { const g = PX.groupOf(k); if (g) { g.ek.teachers.forEach((t) => ids.add(t)); g.zk.teacher && ids.add(g.zk.teacher); g.eb.teacher && ids.add(g.eb.teacher); } }); return [...ids]; }
  O.duplicateRaster = function (id, name, year) {
    const r = PX.clone(PX.byId("rasters", id)); r.id = PX.uid("rs-"); r.name = name; r.year = year || r.year + 1; r.status = "entwurf";
    S().rasters.push(r); PX.audit("Bewertungsraster dupliziert", name, "Vorlage: " + PX.byId("rasters", id).name); return r;
  };
  O.saveCalendar = function (id, vals) {
    const c = PX.byId("calendars", id); Object.assign(c, vals);
    const linked = S().exams.filter((e) => e.cal === id);
    linked.forEach((e) => PX.CAL_FIELDS.forEach(([f]) => (e[f] = c[f])));
    PX.audit("Korrekturkalender geändert", `${c.form} · ${PX.TYPE[c.type]} ${c.year}`, `EK bis ${PX.fmtD(c.ekEnd)}, ZK bis ${PX.fmtD(c.zkEnd)}, EB ${PX.fmtD(c.ebStart)}–${PX.fmtD(c.ebEnd)}; ${linked.length} verknüpfte Prüfung(en) aktualisiert`);
    return linked.length;
  };
  O.detachCalendar = function (examId, vals) { const e = PX.exam(examId); e.cal = null; Object.assign(e, vals || {}); PX.audit("Abweichende Korrekturzeiträume festgelegt", PX.examLabel(e), "Verknüpfung zum Korrekturkalender gelöst"); };
  O.attachCalendar = function (examId) { const e = PX.exam(examId); const c = PX.calendarFor(PX.schulform(e.subject), e.type, e.year); if (!c) return false; e.cal = c.id; PX.CAL_FIELDS.forEach(([f]) => (e[f] = c[f])); PX.audit("Korrekturkalender übernommen", PX.examLabel(e), `${c.form} · ${PX.TYPE[c.type]}`); return true; };
  O.releaseRaster = function (id) { const r = PX.byId("rasters", id); r.status = "freigegeben"; PX.audit("Bewertungsraster freigegeben", r.name); };

  // ---------- Datenimport (ASV/CSV) ----------
  O.importData = function (school, examId, source = "ASV") {
    const ex = PX.exam(examId); const asv = PX.ASV[school]; if (!asv) return null;
    const key = school + "|" + examId;
    // Ersetzen: bestehende, nicht freigegebene Kursmappen der Schule für diese Prüfung entfernen
    const old = S().kms.filter((k) => k.school === school && k.exam === examId);
    if (old.some((k) => k.status === "freigegeben")) { PX.toast("Import nicht übernommen", "Bereits freigegebene Kursmappen sind betroffen – gesonderter Freigabeschritt erforderlich.", "warn"); return null; }
    S().mappen = S().mappen.filter((m) => !old.some((k) => k.id === m.km));
    S().kms = S().kms.filter((k) => !old.includes(k));
    const courses = asv.courses.filter((c) => c.subject === ex.subject);
    courses.forEach((c) => {
      const km = { id: "km-" + c.id.toLowerCase() + "-" + ex.type.toLowerCase(), exam: examId, school, course: c.id, name: c.name, teachers: [...c.teachers], status: "entwurf", scanReleased: false, covers: false, exported: false, stages: { ek: { lkDone: [], sltOk: false }, zk: { lkDone: [], sltOk: false }, eb: { lkDone: [], sltOk: false } } };
      S().kms.push(km);
      c.students.forEach((s) => S().mappen.push(newMappe(km, s)));
    });
    const unresolved = (asv.unresolved || []).filter((u) => u.subject === ex.subject).map((u) => ({ ...u, done: false }));
    S().imports[key] = { source, at: S().now, file: source === "CSV" ? `pasca_import_${school}.csv` : "ASV-Webservice", courses: courses.length, students: PX.sum(courses.map((c) => c.students.length)) + unresolved.length, unresolved };
    PX.audit(`${source}-Daten importiert`, `${PX.orgShort(school)} · ${PX.examLabel(ex)}`, `${courses.length} Kursmappen, ${S().imports[key].students} Datensätze, ${unresolved.length} ungeklärt`);
    return S().imports[key];
  };
  function newMappe(km, s) {
    return { id: "m-" + s.id + "-" + km.exam.slice(-6), km: km.id, student: s.id, first: s.first, last: s.last, nr: s.id.toUpperCase(), nta: "", absent: "", nachtermin: "", scan: null, corr: {}, lock: null, ebRequired: "", final: null };
  }
  O.resolveRecord = function (key, idx, kmId) {
    const imp = S().imports[key]; const u = imp.unresolved[idx]; const km = PX.km(kmId);
    S().mappen.push(newMappe(km, u.student)); u.done = kmId;
    PX.audit("Ungeklärten Datensatz zugeordnet", `${u.student.first} ${u.student.last}`, `→ Kursmappe ${PX.kmLabel(km)}`);
  };
  O.addTeacher = function (kmId, pid) { const km = PX.km(kmId); if (!km.teachers.includes(pid)) km.teachers.push(pid); PX.audit("Lehrkraft der Kursmappe zugeordnet", PX.kmLabel(km), PX.name(pid)); };
  O.removeTeacher = function (kmId, pid) { const km = PX.km(kmId); km.teachers = km.teachers.filter((t) => t !== pid); PX.audit("Lehrkraft-Zuordnung entfernt", PX.kmLabel(km), PX.name(pid)); };
  O.releaseKM = function (kmId) {
    const km = PX.km(kmId); km.status = "freigegeben"; km.releasedAt = S().now;
    PX.audit("Kursmappe freigegeben", PX.kmLabel(km), `${PX.mappenOf(km).length} digitale Mappen Prüfling`);
  };

  // ---------- RP-weiter Pool ----------
  O.poolAdd = function (rp, pid, subject) { S().rp[rp].pool.entries.push({ id: PX.uid("pe"), pid, subject, locked: false, added: S().now }); S().rp[rp].pool.released = false; PX.audit("Pool-Eintrag hinzugefügt", PX.byId("orgs", rp).name, `${PX.name(pid)} (${PX.subj(subject)?.name})`); };
  O.poolRemove = function (rp, id) { const p = S().rp[rp].pool; const e = p.entries.find((x) => x.id === id); p.entries = p.entries.filter((x) => x.id !== id); PX.audit("Pool-Eintrag entfernt", PX.byId("orgs", rp).name, PX.name(e?.pid)); };
  O.poolLock = function (rp, id) { const e = S().rp[rp].pool.entries.find((x) => x.id === id); e.locked = !e.locked; PX.audit(e.locked ? "Pool-Eintrag gesperrt" : "Pool-Eintrag entsperrt", PX.byId("orgs", rp).name, PX.name(e.pid)); };
  O.poolRelease = function (rp) { S().rp[rp].pool.released = true; PX.audit("RP-weiten Pool freigegeben", PX.byId("orgs", rp).name, `${S().rp[rp].pool.entries.length} Einträge`); };

  // ---------- Korrekturgruppen (Algorithmus nach den Kriterien für ZK und EB) ----------
  O.buildGroups = function (rp, examId) {
    const ex = PX.exam(examId);
    const schools = PX.schools().filter((o) => o.rp === rp);
    const kms = S().kms.filter((k) => k.exam === examId && schools.some((s) => s.id === k.school) && k.status === "freigegeben");
    const pool = S().rp[rp].pool.released ? S().rp[rp].pool.entries.filter((e) => !e.locked && e.subject === ex.subject) : [];
    // Belastung je Lehrkraft = Erstkorrekturen + Zweitkorrekturen (Arbeiten)
    const load = {}, zkCount = {}, ebLoad = {};
    kms.forEach((k) => k.teachers.forEach((t) => (load[t] = (load[t] || 0) + PX.activeMappen(k).length / k.teachers.length)));
    const courseTeachers = (school) => [...new Set(S().kms.filter((k) => k.exam === examId && k.school === school).flatMap((k) => k.teachers))];
    const prev = S().groups.filter((g) => kms.some((k) => k.id === g.km));
    S().groups = S().groups.filter((g) => !prev.includes(g));
    const order = [...kms].sort((a, b) => PX.activeMappen(b).length - PX.activeMappen(a).length || a.id.localeCompare(b.id));
    order.forEach((km) => {
      const n = PX.activeMappen(km).length;
      const cand = [];
      schools.filter((s) => s.id !== km.school && !s.exclude && PX.dist(s.id, km.school) >= 50).forEach((s) => courseTeachers(s.id).forEach((t) => cand.push({ t, school: s.id, d: PX.dist(s.id, km.school) })));
      let why = "";
      if (!cand.length) { pool.forEach((e) => { const p = PX.byId("persons", e.pid); cand.push({ t: e.pid, school: p.org, d: PX.dist(p.org, km.school), pool: true }); }); why = "Keine geeignete Schule im Bezirk – Zuordnung aus dem RP-weiten Pool. "; }
      cand.sort((a, b) => (load[a.t] || 0) - (load[b.t] || 0) || (zkCount[a.t] || 0) - (zkCount[b.t] || 0) || b.d - a.d);
      const zk = cand[0];
      if (zk) { load[zk.t] = (load[zk.t] || 0) + n; zkCount[zk.t] = (zkCount[zk.t] || 0) + 1; }
      // Endbeurteilung: andere Schule als EK und ZK, ≥ 50 km zu beiden, Belastung nach Kapazität
      const ebC = S().persons.filter((p) => p.ebCap && (p.subjects || []).includes(ex.subject) && PX.org(p.org)?.rp === rp && !PX.org(p.org).exclude && p.org !== km.school && p.org !== zk?.school && PX.dist(p.org, km.school) >= 50 && PX.dist(p.org, zk?.school) >= 50)
        .sort((a, b) => (ebLoad[a.id] || 0) / a.ebCap - (ebLoad[b.id] || 0) / b.ebCap);
      const eb = ebC[0];
      if (eb) ebLoad[eb.id] = (ebLoad[eb.id] || 0) + 1;
      S().groups.push({
        id: "g-" + km.id, km: km.id, exam: examId,
        ek: { school: km.school, teachers: [...km.teachers], confirmed: false },
        zk: zk ? { school: zk.school, proposed: zk.t, teacher: zk.t, confirmed: false, pool: !!zk.pool } : { school: "", proposed: "", teacher: "", confirmed: false },
        eb: eb ? { school: eb.org, proposed: eb.id, teacher: eb.id, confirmed: false } : { school: "", proposed: "", teacher: "", confirmed: false },
        why: {
          zk: zk ? `${why}${PX.orgShort(zk.school)}: Entfernung ${zk.d} km (≥ 50 km), nicht auf der Ausschlussliste, Kurslehrkraft im Fach; Belastung danach ${Math.round(load[zk.t])} Arbeiten (EK + ZK).` : "Keine Zuordnung möglich – bitte manuell zuweisen.",
          eb: eb ? `${PX.orgShort(eb.org)}: andere Schule als EK und ZK, ${PX.dist(eb.org, km.school)} km zur EK-Schule, ${PX.dist(eb.org, zk?.school)} km zur ZK-Schule; Kapazität ${Math.round(eb.ebCap * 100)} %.` : "Keine Endbeurteilung möglich – bitte manuell zuweisen.",
        },
        log: [],
      });
    });
    S().rp[rp].built = true; S().rp[rp].builtAt = S().now;
    PX.audit("Korrekturgruppen automatisch gebildet", `${PX.byId("orgs", rp).name} · ${PX.examLabel(ex)}`, `${order.length} Kursmappen${pool.length ? ", Pool berücksichtigt" : ""}`);
  };
  O.editGroup = function (gid, stage, school, teacher, reason) {
    const g = PX.byId("groups", gid);
    const before = `${PX.orgShort(g[stage].school)} / ${PX.name(g[stage].teacher)}`;
    g[stage].school = school; g[stage].teacher = teacher; g[stage].proposed = teacher; g[stage].confirmed = false; g[stage].manual = true;
    g.log.push({ at: PX.stamp(), who: PX.actorId(), text: `${PX.STAGE[stage]}: ${before} → ${PX.orgShort(school)} / ${PX.name(teacher)} (${reason})` });
    PX.audit("Korrekturgruppe bearbeitet", PX.kmLabel(g.km), `${PX.STAGE[stage]}: ${before} → ${PX.orgShort(school)} / ${PX.name(teacher)}; Grund: ${reason}`);
  };
  O.releaseGroups = function (rp, examId) {
    S().rp[rp].released = true; S().rp[rp].releasedAt = S().now;
    const gs = S().groups.filter((g) => g.exam === examId);
    const schools = new Set(gs.flatMap((g) => [g.ek.school, g.zk.school, g.eb.school]).filter(Boolean));
    schools.forEach((s) => PX.notify(PX.sltOf(s).map((p) => p.id), `Die Korrekturgruppen für ${PX.examLabel(examId)} wurden freigegeben. Bitte bestimmen bzw. bestätigen Sie die korrigierenden Lehrkräfte Ihrer Schule.`, "#/slt/korrektoren"));
    PX.audit("Korrekturgruppen freigegeben", `${PX.byId("orgs", rp).name} · ${PX.examLabel(examId)}`, `${gs.length} Korrekturgruppen verbindlich`);
  };
  O.confirmAssignment = function (gid, stage, pid) {
    const g = PX.byId("groups", gid);
    if (stage === "ek") { g.ek.confirmed = true; PX.audit("Erstkorrektur bestätigt", PX.kmLabel(g.km), g.ek.teachers.map(PX.name).join(", ")); return; }
    const changed = pid && pid !== g[stage].teacher;
    if (pid) g[stage].teacher = pid;
    g[stage].confirmed = true;
    if (changed) g.log.push({ at: PX.stamp(), who: PX.actorId(), text: `${PX.STAGE[stage]}: Schulleitung bestimmt ${PX.name(pid)} statt Vorschlag ${PX.name(g[stage].proposed)}` });
    PX.audit(`${PX.STAGE[stage]} – Lehrkraft bestimmt`, PX.kmLabel(g.km), `${PX.name(g[stage].teacher)}${changed ? " (abweichend vom Systemvorschlag)" : " (Systemvorschlag übernommen)"}`);
    PX.notify(g[stage].teacher, `Sie sind für die ${PX.STAGE[stage]} der Kursmappe ${PX.kmLabel(g.km)} (${PX.examLabel(g.exam)}) vorgesehen.`, "#/korr");
  };
  O.reportUnavailable = function (gid, stage, note) {
    const g = PX.byId("groups", gid); g[stage].unavailable = note || "keine geeignete Lehrkraft verfügbar";
    PX.notify(S().persons.filter((p) => p.roles.includes("rp")).map((p) => p.id), `Rückmeldung ${PX.orgShort(g[stage].school)}: ${PX.STAGE[stage]} für ${PX.kmLabel(g.km)} nicht besetzbar.`, "#/rp/gruppen");
    PX.audit("Korrekturstufe nicht besetzbar gemeldet", PX.kmLabel(g.km), `${PX.STAGE[stage]}: ${g[stage].unavailable}`);
  };
  PX.groupComplete = (g) => g && g.ek.confirmed && g.zk.confirmed && g.eb.confirmed;

  // ---------- Prüfungstag ----------
  O.setNTA = function (mid, text) { const m = PX.mappe(mid); m.nta = text; PX.audit(text ? "Nachteilsausgleich erfasst" : "Nachteilsausgleich entfernt", `${m.first} ${m.last}`, text); };
  O.genCovers = function (kmId) { const km = PX.km(kmId); km.covers = true; km.coversAt = S().now; PX.audit("Deckblätter erzeugt", PX.kmLabel(km), `${PX.activeMappen(km).length} Deckblätter mit Barcode`); };
  O.markAbsent = function (mid, kind) { const m = PX.mappe(mid); m.absent = kind; PX.audit(kind ? "Nicht-Teilnahme erfasst" : "Nicht-Teilnahme zurückgenommen", `${m.first} ${m.last}`, kind ? (kind === "entschuldigt" ? "entschuldigt" : "unentschuldigt") : ""); };
  O.registerNT = function (mid) {
    const m = PX.mappe(mid); const km = PX.km(m.km); const ex = PX.exam(km.exam);
    const nt = S().exams.find((e) => e.subject === ex.subject && e.year === ex.year && e.type === (ex.type === "HT" ? "NT" : "NNT"));
    m.nachtermin = nt ? nt.id : "vorgemerkt";
    PX.audit("Für Nachtermin angemeldet", `${m.first} ${m.last}`, nt ? `${PX.examLabel(nt)} am ${PX.fmtD(nt.date)}` : "Nachtermin vorgemerkt");
  };

  // ---------- Digitalisierung ----------
  // Simulierter Scanstapel einer Schule (eine PDF je Prüfling, inkl. Deckblatt und Konzeptblätter)
  PX.scanStack = function (school) {
    const kms = S().kms.filter((k) => k.school === school && k.status === "freigegeben" && !k.scanReleased);
    const files = [];
    let n = S().scans.filter((s) => s.school === school).length;
    kms.forEach((km) => PX.activeMappen(km).filter((m) => !m.scan && !S().scans.some((s) => s.mappe === m.id || s.target === m.id)).forEach((m) => {
      n++;
      const sheets = 3 + Math.floor(PX.hash(m.id) * 3);
      const pages = [{ id: PX.uid("p"), kind: "deckblatt", n: 0, rot: 0 }];
      for (let i = 1; i <= sheets; i++) pages.push({ id: PX.uid("p"), kind: "blatt", n: i, rot: 0 });
      pages.push({ id: PX.uid("p"), kind: "konzept", n: sheets + 1, rot: 0, konzeptBy: "farbe" });
      const f = { id: PX.uid("s"), school, file: `Scan_${S().now}_${String(n).padStart(4, "0")}.pdf`, target: m.id, km: km.id, pages, dpi: 300, declared: sheets + 1, barcode: true, issues: [] };
      // Demo-Auffälligkeiten an der AFS
      if (m.student === "afs-0415") { f.barcode = false; f.issues.push("barcode"); }
      if (m.student === "afs-0414") { f.pages[3].rot = 180; f.issues.push("rot"); }
      if (m.student === "afs-0422") { f.dpi = 150; f.issues.push("dpi"); }
      if (m.student === "afs-0416") { f.pages.splice(2, 1); f.issues.push("pages"); }
      if (m.student === "afs-0421") { const k = f.pages[f.pages.length - 1]; k.kind = "blatt"; k.unsure = true; delete k.konzeptBy; f.issues.push("konzept"); }
      files.push(f);
    }));
    return files;
  };
  O.upload = function (school, files, mode = "Upload") {
    files.forEach((f) => {
      S().scans.push({ ...f, status: "hochgeladen", mode, at: PX.stamp(), mappe: null });
      S().uploadLog.unshift({ at: PX.stamp(), school, who: PX.actorId() || "p.sommer", text: `${f.file} hochgeladen (${f.pages.length} Seiten, ${f.dpi} dpi)${mode === "Scanner" ? " – direkt vom Scanner, ohne Zwischenspeicherung" : ""}` });
    });
    PX.audit(mode === "Scanner" ? "Systemseitiger Scan übertragen" : "Scandateien hochgeladen", PX.orgShort(school), `${files.length} PDF-Dateien`);
  };
  PX.qc = (s) => {
    const out = [];
    if (s.issues.includes("dpi")) out.push({ k: "dpi", block: true, text: `Auflösung ${s.dpi} dpi unter Mindestwert 300 dpi` });
    if (s.issues.includes("pages")) out.push({ k: "pages", block: true, text: `Deckblatt nennt ${s.declared} Blätter, erkannt ${s.pages.filter((p) => p.kind !== "deckblatt").length}` });
    if (s.issues.includes("rot") && s.pages.some((p) => p.rot)) out.push({ k: "rot", block: false, text: "Seite vermutlich gedreht eingescannt" });
    if (s.issues.includes("konzept") && s.pages.some((p) => p.unsure && p.kind !== "konzept" && p.konzeptBy !== "manuell")) out.push({ k: "konzept", block: false, text: "Farbmarkierung Konzeptpapier auf der letzten Seite unsicher – bitte prüfen" });
    if (s.issues.includes("barcode") && !s.mappe) out.push({ k: "barcode", block: true, text: "Barcode auf dem Deckblatt nicht lesbar" });
    return out;
  };
  O.autoAssign = function (school) {
    let ok = 0, fail = 0;
    S().scans.filter((s) => s.school === school && s.status === "hochgeladen").forEach((s) => {
      if (s.barcode) { s.mappe = s.target; s.status = "zugeordnet"; PX.mappe(s.target).scan = s.id; ok++; } else { s.status = "nicht_zugeordnet"; fail++; }
    });
    S().uploadLog.unshift({ at: PX.stamp(), school, who: PX.actorId(), text: `Automatische Zuordnung per Barcode: ${ok} zugeordnet, ${fail} nicht zugeordnet` });
    PX.audit("Automatische Zuordnung (Barcode)", PX.orgShort(school), `${ok} zugeordnet, ${fail} nicht zugeordnet`);
    return { ok, fail };
  };
  O.manualAssign = function (scanId, mid) {
    const s = PX.byId("scans", scanId); const m = PX.mappe(mid);
    s.mappe = mid; s.status = "zugeordnet"; s.manual = true; m.scan = s.id; s.issues = s.issues.filter((i) => i !== "barcode");
    S().uploadLog.unshift({ at: PX.stamp(), school: s.school, who: PX.actorId(), text: `${s.file} manuell zugeordnet → ${m.nr} (Kurs ${PX.km(m.km).course})` });
    PX.audit("Scandatei manuell zugeordnet", s.file, `Prüflings-ID ${m.nr}, Kurs-ID ${PX.km(m.km).course}`);
  };
  O.rotate = function (scanId, pageIds, delta) {
    const s = PX.byId("scans", scanId);
    s.pages.filter((p) => pageIds.includes(p.id)).forEach((p) => (p.rot = (((p.rot + delta) % 360) + 360) % 360));
    if (!s.pages.some((p) => p.rot)) s.issues = s.issues.filter((i) => i !== "rot");
    PX.audit("Seite gedreht", s.file, `${pageIds.length} Seite(n) um ${delta > 0 ? "+" : ""}${delta}°`);
  };
  O.movePage = function (scanId, pageId, dir) {
    const s = PX.byId("scans", scanId); const i = s.pages.findIndex((p) => p.id === pageId); const j = i + dir;
    if (j < 1 || j >= s.pages.length) return; [s.pages[i], s.pages[j]] = [s.pages[j], s.pages[i]];
    PX.audit("Seitenreihenfolge geändert", s.file, `Seite ${i + 1} → ${j + 1}`);
  };
  O.rescan = function (scanId) {
    const s = PX.byId("scans", scanId);
    if (s.issues.includes("dpi")) { s.dpi = 300; s.issues = s.issues.filter((i) => i !== "dpi"); S().uploadLog.unshift({ at: PX.stamp(), school: s.school, who: PX.actorId(), text: `${s.file} neu gescannt und ersetzt (300 dpi)` }); PX.audit("Scandatei ersetzt", s.file, "Neuscan, 300 dpi – ersetzte Datei protokolliert, keine Versionierung"); }
    if (s.issues.includes("pages")) { s.pages.splice(2, 0, { id: PX.uid("p"), kind: "blatt", n: 2, rot: 0 }); s.issues = s.issues.filter((i) => i !== "pages"); S().uploadLog.unshift({ at: PX.stamp(), school: s.school, who: PX.actorId(), text: `${s.file}: fehlendes Blatt 2 nachgescannt und ergänzt (Zuordnung über Seiten-Barcode)` }); PX.audit("Seite nachgescannt", s.file, "Blatt 2 ergänzt"); }
  };
  // Konzeptpapier: per Farbmarkierung des landeseinheitlichen Papiers erkannt, beim Scannen manuell korrigierbar
  O.toggleKonzept = function (scanId, pageId) {
    const s = PX.byId("scans", scanId); const p = s.pages.find((x) => x.id === pageId);
    p.kind = p.kind === "konzept" ? "blatt" : "konzept"; p.konzeptBy = "manuell";
    let n = 0; s.pages.forEach((x) => { if (x.kind !== "deckblatt") x.n = ++n; });
    PX.audit(p.kind === "konzept" ? "Seite als Konzeptpapier gekennzeichnet" : "Kennzeichnung Konzeptpapier entfernt", s.file, "manuell beim Scannen");
  };
  O.deleteScan = function (scanId) { const s = PX.byId("scans", scanId); if (s.mappe) PX.mappe(s.mappe).scan = null; S().scans = S().scans.filter((x) => x.id !== scanId); PX.audit("Scandatei gelöscht", s.file); };
  PX.kmScanState = (km) => {
    const act = PX.activeMappen(km);
    const assigned = act.filter((m) => m.scan);
    const blocking = assigned.filter((m) => PX.qc(PX.byId("scans", m.scan)).some((q) => q.block));
    return { expected: act.length, assigned: assigned.length, blocking: blocking.length, complete: act.length > 0 && assigned.length === act.length && !blocking.length };
  };
  O.releaseScans = function (school) {
    const kms = S().kms.filter((k) => k.school === school && k.status === "freigegeben" && !k.scanReleased && PX.kmScanState(k).complete);
    kms.forEach((km) => {
      km.scanReleased = true; km.scanReleasedAt = S().now;
      PX.activeMappen(km).forEach((m) => { const s = PX.byId("scans", m.scan); s.status = "freigegeben"; });
      const g = PX.groupOf(km);
      PX.notify(g ? g.ek.teachers : km.teachers, `Die Prüfungsunterlagen der Kursmappe ${PX.kmLabel(km)} sind zur Erstkorrektur freigegeben. (E-Mail versendet)`, "#/korr");
      S().uploadLog.unshift({ at: PX.stamp(), school, who: PX.actorId(), text: `Kursmappe ${km.name}: ${PX.activeMappen(km).length} digitale Mappen zur Korrektur freigegeben` });
    });
    PX.audit("Prüfungsunterlagen zur Korrektur freigegeben", PX.orgShort(school), kms.map((k) => k.name).join(", "));
    return kms;
  };

  // ---------- Korrektur ----------
  PX.corr = (m, stage) => { if (!m.corr[stage]) m.corr[stage] = { state: "offen", be: {}, wahl: {}, marks: [], redactions: [], notes: [], gutachten: {}, bausteine: [], hint: "", formPdf: null, abzug: 0, bonus: 0, np: null, by: "", page: 0 };
    const c = m.corr[stage]; if (Array.isArray(c.wahl)) c.wahl = {}; if (typeof c.gutachten === "string") c.gutachten = c.gutachten ? { "Gutachten": c.gutachten } : {}; return m.corr[stage]; };
  PX.gutachtenText = (c) => Object.entries(c?.gutachten || {}).filter(([, v]) => v && v.trim()).map(([k, v]) => `${k}: ${v}`).join("\n");
  // Fehlerzahl aus den gesetzten gewichteten Zeichen (z. B. Alte Sprachen)
  PX.markErrors = (c) => PX.sum((c?.marks || []).map((k) => { const z = S().signs.find((x) => x.id === k.sign); if (!z) return 0; return z.count ? +k.count || 0 : +z.weight || 0; }));
  O.lock = function (mid, stage, pid) { const m = PX.mappe(mid); if (m.lock && m.lock.pid !== pid) return false; m.lock = { pid, stage, at: PX.stamp() }; const c = PX.corr(m, stage); if (c.state === "offen") { c.state = "in_bearbeitung"; c.by = pid; } return true; };
  O.unlock = function (mid) { const m = PX.mappe(mid); m.lock = null; };
  O.finishMappe = function (mid, stage) {
    const m = PX.mappe(mid); const km = PX.km(m.km); const ex = PX.exam(km.exam); const r = PX.raster(ex); const c = PX.corr(m, stage);
    const res = PX.evaluate(r, c, km, m);
    if (!res.complete) return { ok: false, msg: "Bitte alle Aufgaben bewerten (oder als „nicht bearbeitet“ markieren) und die Wahl festlegen: " + res.missing.join(" · ") };
    if (r.gutachten?.on && r.gutachten.required && !PX.gutachtenText(c).trim()) return { ok: false, msg: "Für dieses Prüfungsfach ist ein textliches Gutachten erforderlich." };
    if (r.formPdf && !c.formPdf) return { ok: false, msg: "Für dieses Prüfungsfach ist das ausgefüllte Formblatt (PDF) hochzuladen." };
    c.np = res.np; c.state = "fertig"; c.at = S().now; c.by = c.by || PX.actorId(); m.lock = null;
    PX.audit(`${PX.STAGE[stage]} einer Mappe abgeschlossen`, stage === "ek" ? `${m.first} ${m.last}` : PX.pseudo(m), `${r.combine === "sum" ? `${res.sum}/${res.max} BE → ` : ""}${PX.fmtNP(res.np)} NP (${PX.STAGE[stage]}bericht erzeugt)`);
    return { ok: true, np: res.np };
  };
  O.reopenMappe = function (mid, stage) { const c = PX.corr(PX.mappe(mid), stage); c.state = "in_bearbeitung"; c.np = null; PX.audit("Korrektur einer Mappe wieder geöffnet", PX.mappe(mid).nr, PX.STAGE[stage]); };
  // Demo-Automatik: plausible Bewertung erzeugen (für die nicht von Hand korrigierten Mappen)
  O.autoCorrect = function (mid, stage, pid) {
    const m = PX.mappe(mid); const km = PX.km(m.km); const r = PX.raster(PX.exam(km.exam)); const c = PX.corr(m, stage);
    if (c.state === "fertig") return;
    const ability = 0.38 + PX.hash(m.student) * 0.55;
    const off = stage === "ek" ? 0 : stage === "zk" ? (m.student === "afs-0413" || m.student === "kts-2204" ? -0.27 : -0.03 + PX.hash(m.student + "z") * 0.05) : -0.12;
    c.wahl = PX.paperChoice(m, r);
    if (stage === "ek" && (r.groups || []).some((g) => g.chooser === "lehrer")) { km.lehrerwahl = Object.assign(PX.paperLehrerwahl(km, r), km.lehrerwahl || {}); }
    PX.activeLeaves(r, c, km).forEach((l) => {
      const p = PX.partOf(r, l); if (p.scoring === "extern") return;
      const v = Math.max(0, Math.min(1, ability + off + (PX.hash(m.student + l.id + stage) - 0.5) * 0.2));
      c.be[l.id] = p.scoring === "np" ? Math.round(v * 15) : p.scoring === "fehler" ? Math.round((1 - v) * 14 * 4) / 4 : Math.round(v * l.be);
    });
    if (!c.marks.length) { const pg = PX.pagesOf(m).filter((p) => p.kind === "blatt"); const z = PX.examSigns(PX.exam(km.exam)); const pick = (i) => z[Math.floor(PX.hash(m.id + stage + i) * z.length)];
      const X = stage === "ek" ? 84 : stage === "zk" ? 8 : 14, dy = stage === "ek" ? 0 : stage === "zk" ? 2 : 4;
      if (pg.length && z.length) c.marks = [{ id: PX.uid("k"), kind: "sign", page: pg[0].id, x: X, y: 30 + dy, sign: pick(1).id, code: pick(1).code }, { id: PX.uid("k"), kind: "line", page: pg[0].id, x1: 18, x2: 62, y: 44 + dy, sign: pick(2).id, code: pick(2).code }, { id: PX.uid("k"), kind: "sign", page: (pg[1] || pg[0]).id, x: X, y: 40 + dy, sign: pick(3).id, code: pick(3).code }]; }
    if (r.gutachten?.on) { c.gutachten = {}; r.gutachten.sections.forEach((sec, i) => { const b = r.gutachten.bausteine?.[Math.floor(PX.hash(m.id + stage + i) * (r.gutachten.bausteine.length || 1))]; c.gutachten[sec] = b ? b.text : "Die Arbeit zeigt insgesamt solide Kenntnisse. (Demo-Gutachten)"; }); }
    if (r.formPdf) c.formPdf = { file: `Formblatt_${m.nr}.pdf`, at: S().now };
    c.by = pid; c.state = "in_bearbeitung";
    O.finishMappe(mid, stage);
  };
  // Lehrerwahl (z. B. Mathematik Teil B): je Kursmappe durch die Erstkorrektur festgelegt
  O.setLehrerwahl = function (kmId, gid, opts) {
    const km = PX.km(kmId); const r = PX.raster(km.exam); const g = r.groups.find((x) => x.id === gid);
    km.lehrerwahl = km.lehrerwahl || {}; km.lehrerwahl[gid] = opts;
    PX.audit("Lehrerwahl festgelegt", PX.kmLabel(km), `${g.label}: ${opts.map((id) => r.nodes.find((n) => n.id === id)?.no).join(", ")} – gilt für alle Mappen der Kursmappe`);
  };
  // Nicht korrekturrelevante Teile (z. B. Kommunikationsprüfung) – auch nach Abschluss möglich
  O.setExtern = function (mid, partId, v) {
    const m = PX.mappe(mid); const km = PX.km(m.km); const r = PX.raster(km.exam); const p = r.parts.find((x) => x.id === partId);
    m.extern = m.extern || {}; m.extern[partId] = v === "" || v == null ? "" : Math.max(0, Math.min(15, Math.round(+v)));
    if (m.final) { const f = PX.finalNP(m, r); m.final = f ? { np: f.np, src: f.src, pending: f.pending } : m.final; }
    PX.audit(`${p.name}: Notenpunkte eingetragen`, `${m.first} ${m.last}`, `${m.extern[partId]} NP`);
  };
  O.confirmKM = function (kmId, stage, pid) {
    const km = PX.km(kmId); const st = km.stages[stage];
    if (!st.lkDone.includes(pid)) st.lkDone.push(pid);
    PX.audit(`Kursmappenabschluss ${PX.STAGE[stage]} bestätigt (Lehrkraft)`, PX.kmLabel(km), PX.name(pid));
    const ss = PX.stageState(km, stage);
    if (ss.lkDone) { const school = stage === "ek" ? km.school : PX.groupOf(km)[stage].school; PX.notify(PX.sltOf(school).map((p) => p.id), `${PX.STAGE[stage]} der Kursmappe ${PX.kmLabel(km)} abgeschlossen – bitte Abschluss bestätigen.`, "#/slt/stand"); }
  };
  O.sltConfirm = function (kmId, stage) {
    const km = PX.km(kmId); const st = km.stages[stage]; st.sltOk = true; st.sltBy = PX.actorId(); st.at = S().now;
    PX.audit(`Abschluss ${PX.STAGE[stage]} durch Schulleitung bestätigt`, PX.kmLabel(km), "");
    const g = PX.groupOf(km);
    if (stage === "ek") PX.notify(g.zk.teacher, `Die Kursmappe ${PX.kmLabel(km)} ist zur Zweitkorrektur freigegeben (anonymisiert). (E-Mail versendet)`, "#/korr");
    if (stage === "zk") { O.computeEB(kmId); PX.notify(g.eb.teacher, `Endbeurteilung für ${PX.kmLabel(km)}: ${PX.activeMappen(km).filter((m) => m.ebRequired).length} Mappe(n) verpflichtend. Beginn ab ${PX.fmtD(PX.exam(km.exam).ebStart)}. (E-Mail versendet)`, "#/korr"); }
    if (stage === "eb") O.finalize(kmId);
  };
  O.sltReturn = function (kmId, stage, pid) {
    const km = PX.km(kmId); km.stages[stage].lkDone = km.stages[stage].lkDone.filter((x) => x !== pid);
    PX.notify(pid, `Die Schulleitung hat die ${PX.STAGE[stage]} der Kursmappe ${PX.kmLabel(km)} an Sie zurückverfügt.`, "#/korr");
    PX.audit(`${PX.STAGE[stage]} zurückverfügt`, PX.kmLabel(km), PX.name(pid));
  };
  O.computeEB = function (kmId) {
    const km = PX.km(kmId); const list = PX.activeMappen(km);
    list.forEach((m) => { const d = Math.abs((m.corr.ek?.np ?? 0) - (m.corr.zk?.np ?? 0)); m.diff = Math.round(d * 10) / 10; m.ebRequired = d > 3 ? "abweichung" : ""; });
    let stich = [];
    if (PX.examForm(PX.exam(km.exam)) === "AG") {
      // Allgemeinbildendes Gymnasium: zusätzlich Stichprobe von 2 Prüfungen je Kurs (zufällig)
      stich = list.filter((m) => !m.ebRequired).sort((a, b) => PX.hash(km.id + a.id + "sp") - PX.hash(km.id + b.id + "sp")).slice(0, 2);
      stich.forEach((m) => (m.ebRequired = "stichprobe"));
    }
    PX.audit("Abweichungen EK/ZK berechnet", PX.kmLabel(km), `${list.filter((m) => m.ebRequired === "abweichung").length} Mappe(n) mit Abweichung > 3 NP${stich.length ? `, Stichprobe: ${stich.length} Mappe(n) zufällig gezogen` : ""}`);
  };
  O.finalize = function (kmId) {
    const km = PX.km(kmId); const r = PX.raster(km.exam);
    PX.activeMappen(km).forEach((m) => { const f = PX.finalNP(m, r); m.final = f ? { np: f.np, src: f.src, pending: f.pending, base: f.base } : null; });
    km.finalAt = S().now;
    const y = PX.exam(km.exam).year;
    S().archive.unshift({ id: "ar-" + km.id, km: km.id, year: y, label: `Abitur ${y} · ${PX.examShort(km.exam)} · ${PX.kmLabel(km)}`, school: km.school, count: PX.activeMappen(km).length, at: S().now, deleteAt: `${y + 5}-07-31` });
    PX.notify(PX.sltOf(km.school).map((p) => p.id), `Die Korrektur der Kursmappe ${PX.kmLabel(km)} ist vollständig abgeschlossen. Ergebnisse können exportiert werden.`, "#/slt/ergebnisse");
    PX.audit("Kursmappe vollständig korrigiert und archiviert", PX.kmLabel(km), `Aufbewahrung bis ${PX.fmtD(y + 5 + "-07-31")} (5 Jahre)`);
  };
  O.exportASV = function (school, examId) {
    const kms = S().kms.filter((k) => k.school === school && k.exam === examId && k.stages.eb.sltOk);
    kms.forEach((k) => (k.exported = S().now));
    S().asvExports.unshift({ id: PX.uid("x"), school, exam: examId, at: S().now, kms: kms.map((k) => k.id) });
    PX.audit("Prüfungsergebnisse für ASV exportiert", `${PX.orgShort(school)} · ${PX.examLabel(examId)}`, `${PX.sum(kms.map((k) => PX.activeMappen(k).length))} Ergebnisdatensätze`);
    return kms;
  };
  O.einsicht = function (mid, by) {
    const m = PX.mappe(mid); S().einsicht.unshift({ id: PX.uid("e"), mappe: mid, at: S().now, by: by || PX.actorId() });
    PX.audit("Einsichtnahme: PDF erzeugt", `${m.first} ${m.last}`, "Korrigierte Unterlagen ohne Notizen");
  };
  O.runDeletion = function () {
    const due = S().archive.filter((a) => a.deleteAt <= S().now);
    due.forEach((a) => { S().deletedArchives.unshift({ ...a, deletedAt: S().now }); PX.audit("Archiv gelöscht (Aufbewahrungsfrist abgelaufen)", a.label, `${a.count} Mappen`); });
    S().archive = S().archive.filter((a) => a.deleteAt > S().now);
    return due.length;
  };
  PX.setNow = function (iso) { PX.audit("Demo-Zeit geändert", "Simulation", `${PX.fmtD(PX.S.now)} → ${PX.fmtD(iso)}`); PX.S.now = iso; deadlineWarnings(); };
  function deadlineWarnings() {
    // Zwei Tage vor Fristende: Hinweis an die Schulleitung, wenn eine Korrektur noch offen ist
    S().kms.forEach((km) => {
      const ex = PX.exam(km.exam); const ph = PX.phase(km); if (!["ek", "zk", "eb"].includes(ph.key)) return;
      const end = ph.key === "ek" ? ex.ekEnd : ph.key === "zk" ? ex.zkEnd : ex.ebEnd;
      const left = PX.daysBetween(S().now, end);
      const school = ph.key === "ek" ? km.school : PX.groupOf(km)?.[ph.key]?.school;
      if (left <= 2 && left >= 0 && !km["warn_" + ph.key]) { km["warn_" + ph.key] = true; PX.notify(PX.sltOf(school).map((p) => p.id), `Frist ${PX.STAGE[ph.key]} endet am ${PX.fmtD(end)} – Kursmappe ${PX.kmLabel(km)} ist noch nicht abgeschlossen. (E-Mail versendet)`, "#/slt/stand"); }
    });
  }
})();
