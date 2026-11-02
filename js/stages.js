/* PASCA Klickdummy – Szenario-Stufen
   Jede Klickstrecke kann mit dem passenden Ausgangszustand gestartet werden. Die Stufen spulen den
   Prozess mit denselben Fachoperationen vor, die auch die Oberfläche nutzt. */
(function () {
  "use strict";
  const PX = window.PX; const O = () => PX.ops;
  PX.mainExam = () => PX.S.exams.find((e) => e.subject === "vbwl" && e.type === "HT" && e.year === 2027) || null;
  const as = (pid, fn) => { const prev = PX._actor; PX._actor = pid; try { fn(); } finally { PX._actor = prev; } };
  const sltFor = (school) => PX.sltOf(school)[0]?.id;

  const STAGES = [
    ["basis", "Stammdaten, Bewertungsraster des Vorjahres", () => {}],
    ["pruefung", "Prüfung VBWL 2027 angelegt (Haupt-, Nach-, Nachnachtermin)", () => as("r.albrecht", () => {
      const r = O().duplicateRaster("rs-vbwl-26", "VBWL – Haupttermin 2027", 2027); O().releaseRaster(r.id);
      O().createExams({ subject: "vbwl", raster: r.id, guideline: "kr-allg", zusatz: false, terms: [
        { type: "HT", date: "2027-04-20", time: "08:30", end: "13:00", ekEnd: "2027-05-07", zkEnd: "2027-05-21", ebStart: "2027-05-25", ebEnd: "2027-06-04" },
        { type: "NT", date: "2027-05-11", time: "08:30", end: "13:00", ekEnd: "2027-05-26", zkEnd: "2027-06-09", ebStart: "2027-06-11", ebEnd: "2027-06-18" },
        { type: "NNT", date: "2027-06-08", time: "08:30", end: "13:00", ekEnd: "2027-06-18", zkEnd: "2027-06-29", ebStart: "2027-07-01", ebEnd: "2027-07-07" },
      ] });
    })],
    ["import", "Daten importiert (ASV), Kursmappen freigegeben", () => {
      const ex = PX.mainExam();
      PX.schools().filter((s) => PX.ASV[s.id]).forEach((s) => as(sltFor(s.id), () => {
        O().importData(s.id, ex.id, "ASV");
        const key = s.id + "|" + ex.id; const imp = PX.S.imports[key];
        (imp?.unresolved || []).forEach((u, i) => O().resolveRecord(key, i, PX.S.kms.find((k) => k.school === s.id && k.exam === ex.id && k.name === "WG13b").id));
        PX.S.kms.filter((k) => k.school === s.id && k.exam === ex.id).forEach((k) => O().releaseKM(k.id));
      }));
    }],
    ["gruppen", "Korrekturgruppen gebildet, freigegeben und von den Schulen bestätigt", () => {
      const ex = PX.mainExam();
      as("k.oberle", () => { O().poolRelease("rpk"); O().buildGroups("rpk", ex.id); O().releaseGroups("rpk", ex.id); });
      PX.S.groups.filter((g) => g.exam === ex.id).forEach((g) => {
        as(sltFor(g.ek.school), () => O().confirmAssignment(g.id, "ek"));
        as(sltFor(g.zk.school), () => O().confirmAssignment(g.id, "zk"));
        as(sltFor(g.eb.school), () => O().confirmAssignment(g.id, "eb"));
      });
    }],
    ["pruefungstag", "Prüfungstag vorbereitet und durchgeführt", () => {
      const ex = PX.mainExam(); PX.S.now = ex.date;
      as("r.albrecht", () => O().uploadEWH(ex.id));
      PX.S.kms.filter((k) => k.exam === ex.id).forEach((k) => as(sltFor(k.school), () => O().genCovers(k.id)));
      const mia = PX.S.mappen.find((m) => m.student === "afs-0416"); const eli = PX.S.mappen.find((m) => m.student === "afs-0417");
      as("m.haldenwang", () => { O().setNTA(mia.id, "Zeitverlängerung um 25 % (Bescheid vom 12.02.2027)"); O().markAbsent(eli.id, "entschuldigt"); O().registerNT(eli.id); });
    }],
    ["scan", "Prüfungsunterlagen eingescannt, geprüft und zur Korrektur freigegeben", () => {
      PX.S.now = PX.addDays(PX.mainExam().date, 1);
      PX.schools().forEach((s) => as(PX.scoOf(s.id)[0]?.id || sltFor(s.id), () => {
        const files = PX.scanStack(s.id); if (!files.length) return;
        O().upload(s.id, files); O().autoAssign(s.id);
        PX.S.scans.filter((x) => x.school === s.id).forEach((x) => {
          if (x.status === "nicht_zugeordnet") O().manualAssign(x.id, x.target);
          const rot = x.pages.filter((p) => p.rot).map((p) => p.id); if (rot.length) O().rotate(x.id, rot, 180);
          if (x.issues.includes("dpi") || x.issues.includes("pages")) O().rescan(x.id);
        });
        O().releaseScans(s.id);
      }));
    }],
    ["ek", "Erstkorrektur abgeschlossen und bestätigt", () => {
      const ex = PX.mainExam(); PX.S.now = PX.addDays(ex.ekEnd, -2);
      PX.S.kms.filter((k) => k.exam === ex.id).forEach((k) => { const g = PX.groupOf(k);
        PX.activeMappen(k).forEach((m) => as(g.ek.teachers[0], () => O().autoCorrect(m.id, "ek", g.ek.teachers[0])));
        g.ek.teachers.forEach((t) => as(t, () => O().confirmKM(k.id, "ek", t)));
        as(sltFor(k.school), () => O().sltConfirm(k.id, "ek")); });
    }],
    ["zk", "Zweitkorrektur abgeschlossen; Abweichungen berechnet", () => {
      const ex = PX.mainExam(); PX.S.now = PX.addDays(ex.zkEnd, -2);
      PX.S.kms.filter((k) => k.exam === ex.id).forEach((k) => { const g = PX.groupOf(k);
        PX.activeMappen(k).forEach((m) => as(g.zk.teacher, () => O().autoCorrect(m.id, "zk", g.zk.teacher)));
        as(g.zk.teacher, () => O().confirmKM(k.id, "zk", g.zk.teacher));
        as(sltFor(g.zk.school), () => O().sltConfirm(k.id, "zk")); });
    }],
    ["eb", "Endbeurteilung abgeschlossen; Endnoten berechnet", () => {
      const ex = PX.mainExam(); PX.S.now = PX.addDays(ex.ebStart, 2);
      PX.S.kms.filter((k) => k.exam === ex.id).forEach((k) => { const g = PX.groupOf(k);
        PX.activeMappen(k).filter((m) => m.ebRequired).forEach((m) => as(g.eb.teacher, () => O().autoCorrect(m.id, "eb", g.eb.teacher)));
        as(g.eb.teacher, () => O().confirmKM(k.id, "eb", g.eb.teacher));
        as(sltFor(g.eb.school), () => O().sltConfirm(k.id, "eb")); });
    }],
    ["ergebnis", "Ergebnisse an ASV übergeben, Kursmappen archiviert", () => {
      const ex = PX.mainExam(); PX.S.now = PX.addDays(ex.ebEnd, 3);
      PX.schools().filter((s) => s.id !== "afs").forEach((s) => as(sltFor(s.id), () => O().exportASV(s.id, ex.id)));
    }],
    ["abschluss", "Alle Schulen exportiert; Einsichtnahme an der AFS erfolgt", () => {
      const ex = PX.mainExam();
      as("m.haldenwang", () => { O().exportASV("afs", ex.id); O().einsicht(PX.S.mappen.find((m) => m.student === "afs-0413").id); });
    }],
  ];
  PX.stages = {
    list: STAGES.map(([id, label]) => ({ id, label })),
    index: (id) => STAGES.findIndex((s) => s[0] === id),
    to(id) { const n = this.index(id); for (let i = 0; i <= n; i++) STAGES[i][2](); PX.S.stage = id; },
  };
})();
