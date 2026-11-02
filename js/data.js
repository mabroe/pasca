/* PASCA Klickdummy – Demodaten (alle Namen fiktiv)
   Szenario: Abitur 2027 am Wirtschaftsgymnasium, Prüfungsfach „Volks- und Betriebswirtschaftslehre“ (VBWL),
   Regierungsbezirk Karlsruhe. Hauptfall: Kurs WG13a der Ahornfeld-Schule Mannheim (AFS). */
(function () {
  "use strict";
  const PX = window.PX;
  PX.DATA_VERSION = 7;

  // Schulen und Behörden (Koordinaten für das 50-km-Kriterium, Luftlinie)
  const ORGS = [
    { id: "km", short: "KM", name: "Ministerium für Kultus, Jugend und Sport", kind: "land" },
    { id: "ibbw", short: "IBBW", name: "Institut für Bildungsanalysen Baden-Württemberg", kind: "land" },
    { id: "rpk", short: "RP KA", name: "Regierungspräsidium Karlsruhe", kind: "rp" },
    { id: "rps", short: "RP S", name: "Regierungspräsidium Stuttgart", kind: "rp" },
    { id: "rpf", short: "RP FR", name: "Regierungspräsidium Freiburg", kind: "rp" },
    { id: "afs", short: "AFS", name: "Ahornfeld-Schule", city: "Mannheim", kind: "schule", rp: "rpk", art: "Berufliche Schule", form: "Berufliches Gymnasium", traeger: "öffentlich", geo: [49.4875, 8.466] },
    { id: "bts", short: "BTS", name: "Birkental-Schule", city: "Pforzheim", kind: "schule", rp: "rpk", art: "Berufliche Schule", form: "Berufliches Gymnasium", traeger: "öffentlich", geo: [48.8922, 8.6946] },
    { id: "kts", short: "KTS", name: "Kastanien-Schule", city: "Karlsruhe", kind: "schule", rp: "rpk", art: "Berufliche Schule", form: "Berufliches Gymnasium", traeger: "öffentlich", geo: [49.0069, 8.4037] },
    { id: "esg", short: "ESG", name: "Eichenhain-Schule", city: "Mosbach", kind: "schule", rp: "rpk", art: "Berufliche Schule", form: "Berufliches Gymnasium", traeger: "öffentlich", geo: [49.3529, 9.145] },
    { id: "wsh", short: "WSH", name: "Freie Waldorfschule Hohenwart", city: "Pforzheim", kind: "schule", rp: "rpk", art: "Waldorfschule", form: "Berufliches Gymnasium", traeger: "Waldorfschule (frei)", geo: [48.8606, 8.727], exclude: true },
    { id: "lws", short: "LWS", name: "Lindenweg-Schule", city: "Freiburg", kind: "schule", rp: "rpf", art: "Berufliche Schule", form: "Berufliches Gymnasium", traeger: "öffentlich", geo: [47.999, 7.8421] },
  ];

  const PERSONS = [
    { id: "r.albrecht", title: "Dr.", first: "Ruth", last: "Albrecht", org: "ibbw", roles: ["ibbw"], fn: "Referat Zentrale Prüfungen, Prüfungserstellung VBWL" },
    { id: "o.mertens", first: "Oliver", last: "Mertens", org: "ibbw", roles: ["ibbw"], fn: "Referatsleitung Zentrale Prüfungen" },
    { id: "t.wendling", first: "Tobias", last: "Wendling", org: "ibbw", roles: ["svc"], fn: "Service Center Schule" },
    { id: "s.lorenz", first: "Sabine", last: "Lorenz", org: "km", roles: ["km"], fn: "Referat 44, Abitur Berufliche Gymnasien" },
    { id: "k.oberle", first: "Karin", last: "Oberle", org: "rpk", roles: ["rp"], fn: "Schulaufsicht Berufliche Gymnasien" },
    { id: "m.haldenwang", first: "Markus", last: "Haldenwang", org: "afs", roles: ["slt"], fn: "Stellv. Schulleiter" },
    { id: "i.brecht", first: "Ines", last: "Brecht", org: "afs", roles: ["slt", "lk"], fn: "Abteilungsleiterin BG", subjects: ["vbwl"], ebCap: 1 },
    { id: "p.sommer", first: "Petra", last: "Sommer", org: "afs", roles: ["sco"], fn: "Verwaltung, Scan-Operator" },
    { id: "j.kroeger", first: "Jana", last: "Kröger", org: "afs", roles: ["lk"], subjects: ["vbwl", "de"] },
    { id: "f.brandt", first: "Felix", last: "Brandt", org: "afs", roles: ["lk"], subjects: ["vbwl"] },
    { id: "m.yilmaz", first: "Miriam", last: "Yilmaz", org: "afs", roles: ["lk"], subjects: ["vbwl", "en"] },
    { id: "u.fender", first: "Ulrike", last: "Fender", org: "bts", roles: ["slt"], fn: "Schulleiterin" },
    { id: "m.ruf", title: "Dr.", first: "Martin", last: "Ruf", org: "bts", roles: ["slt", "lk"], fn: "Abteilungsleiter BG", subjects: ["vbwl"], ebCap: 1 },
    { id: "j.keil", first: "Jonas", last: "Keil", org: "bts", roles: ["sco"], fn: "Scan-Operator" },
    { id: "d.reuter", first: "Daniel", last: "Reuter", org: "bts", roles: ["lk"], subjects: ["vbwl"] },
    { id: "s.lang", first: "Sophie", last: "Lang", org: "bts", roles: ["lk"], subjects: ["vbwl", "ma"] },
    { id: "c.vogt", first: "Clara", last: "Vogt", org: "kts", roles: ["slt"], fn: "Stellv. Schulleiterin" },
    { id: "t.hahn", first: "Tim", last: "Hahn", org: "kts", roles: ["lk"], subjects: ["vbwl"], ebCap: 0.5, fn: "Fachberater VBWL" },
    { id: "n.engel", first: "Nadine", last: "Engel", org: "kts", roles: ["lk"], subjects: ["vbwl"] },
    { id: "b.kolb", first: "Bernd", last: "Kolb", org: "esg", roles: ["slt"], fn: "Schulleiter" },
    { id: "h.saalfeld", title: "Dr.", first: "Henrike", last: "Saalfeld", org: "esg", roles: ["lk"], subjects: ["vbwl"], ebCap: 1, fn: "Abteilungsleiterin BG" },
    { id: "l.pohl", first: "Lukas", last: "Pohl", org: "esg", roles: ["lk"], subjects: ["vbwl"] },
    { id: "r.seiler", first: "Rainer", last: "Seiler", org: "wsh", roles: ["slt"], fn: "Schulleitung" },
    { id: "w.kranz", first: "Wolf", last: "Kranz", org: "wsh", roles: ["lk"], subjects: ["vbwl"] },
    { id: "a.wiegand", first: "Anna", last: "Wiegand", org: "lws", roles: ["lk"], subjects: ["vbwl", "gr"], fn: "Fachberaterin (RP Freiburg)" },
    { id: "g.thiel", first: "Gregor", last: "Thiel", org: "lws", roles: ["lk"], subjects: ["gr", "de"] },
  ];

  const SUBJECTS = [
    { id: "vbwl", name: "Volks- und Betriebswirtschaftslehre", short: "VBWL", form: "Berufliches Gymnasium (WG)", prio: "normal", active: true, gutachten: false },
    { id: "de", name: "Deutsch", short: "D", form: "Berufliches Gymnasium", prio: "normal", active: true, gutachten: true },
    { id: "ma", name: "Mathematik", short: "M", form: "Berufliches Gymnasium", prio: "normal", active: true, gutachten: false },
    { id: "en", name: "Englisch", short: "E", form: "Berufliches Gymnasium", prio: "normal", active: true, gutachten: false },
    { id: "inf", name: "Informatik", short: "Inf", form: "Berufliches Gymnasium (TG)", prio: "normal", active: true, gutachten: false },
    { id: "ph-ag", name: "Physik", short: "Ph", form: "Allgemeinbildendes Gymnasium", prio: "normal", active: true, gutachten: false },
    { id: "gr", name: "Griechisch", short: "Gr", form: "Allgemeinbildendes Gymnasium", prio: "hoch", active: true, gutachten: true },
  ];

  // Korrekturzeichen: ein Zeichen kann mehreren Prüfungsfächern zugeordnet sein
  const SIGNS = [
    { id: "z-r", code: "R", meaning: "Rechtschreibfehler", cat: "Sprachliche Richtigkeit", subjects: ["de", "en", "vbwl", "gr"] },
    { id: "z-z", code: "Z", meaning: "Zeichensetzungsfehler", cat: "Sprachliche Richtigkeit", subjects: ["de", "vbwl"] },
    { id: "z-gr", code: "Gr", meaning: "Grammatikfehler", cat: "Sprachliche Richtigkeit", subjects: ["de", "en", "gr"] },
    { id: "z-a", code: "A", meaning: "Ausdruck", cat: "Sprachliche Richtigkeit", subjects: ["de", "en", "vbwl"] },
    { id: "z-sb", code: "Sb", meaning: "Satzbau", cat: "Sprachliche Richtigkeit", subjects: ["de", "en"] },
    { id: "z-f", code: "f", meaning: "fachlich falsch", cat: "Inhalt", subjects: ["vbwl", "ma", "inf", "ph-ag", "de"] },
    { id: "z-ff", code: "Ff", meaning: "Folgefehler", cat: "Inhalt", subjects: ["vbwl", "ma", "inf", "ph-ag"] },
    { id: "z-ok", code: "✓", meaning: "richtig / gelungen", cat: "Inhalt", subjects: ["vbwl", "ma", "inf", "ph-ag", "de", "en", "gr"] },
    { id: "z-okk", code: "✓✓", meaning: "besonders gelungen", cat: "Inhalt", subjects: ["vbwl", "de", "en"] },
    { id: "z-l", code: "L", meaning: "Lücke / Teilaspekt fehlt", cat: "Inhalt", subjects: ["vbwl", "de", "inf"] },
    { id: "z-u", code: "?", meaning: "unklar / nicht nachvollziehbar", cat: "Inhalt", subjects: ["vbwl", "ma", "de", "en", "inf"] },
    { id: "z-fb", code: "Fb", meaning: "Fachbegriff fehlt oder falsch", cat: "Inhalt", subjects: ["vbwl", "inf"] },
    { id: "z-re", code: "Re", meaning: "Rechenfehler", cat: "Inhalt", subjects: ["ma", "vbwl", "ph-ag"] },
    { id: "z-bz", code: "Bz", meaning: "Bezugsfehler", cat: "Sprachliche Richtigkeit", subjects: ["de", "gr"] },
  ];

  // Regeln (Notenschlüssel, Rundung, Gesamtnote)
  const NS_ABI = [[95, 15], [90, 14], [85, 13], [80, 12], [75, 11], [70, 10], [65, 9], [60, 8], [55, 7], [50, 6], [45, 5], [40, 4], [33, 3], [27, 2], [20, 1], [0, 0]];
  const RULES = [
    { id: "ns-abi", kind: "notenschluessel", name: "Notenschlüssel Abitur BG (Prozent → Notenpunkte)", def: NS_ABI, note: "Beispielwerte für den Klickdummy" },
    { id: "rd-auf", kind: "rundung", name: "Durchschnitt Erst-/Zweitkorrektur auf volle Notenpunkte aufrunden", def: "ceil", note: "Lastenheft 3.2.8" },
    { id: "gn-std", kind: "gesamtnote", name: "Endnote: Endbeurteilung, sonst Ø EK/ZK", def: "eb_or_avg", note: "Endbeurteilung bei > 3 NP Abweichung" },
    { id: "gn-fs", kind: "gesamtnote", name: "Moderne Fremdsprachen: schriftlicher Teil 70 % · Hörverstehen 10 % · Kommunikationsprüfung 20 %", def: "weighted", note: "Kommunikationsprüfung nicht korrekturrelevant" },
  ];

  // Bewertungsraster (Aufgaben: Pflicht/Wahl, BE, Gewichtung)
  const vbwlTasks = () => [
    { id: "t11", no: "1.1", title: "Marktgleichgewicht und Preisbildung analysieren", kind: "pflicht", be: 10 },
    { id: "t12", no: "1.2", title: "Staatliche Preiseingriffe beurteilen", kind: "pflicht", be: 12 },
    { id: "t13", no: "1.3", title: "Kosten- und Erlösrechnung durchführen", kind: "pflicht", be: 13 },
    { id: "t2a1", no: "2A.1", title: "Finanzierungsalternativen vergleichen", kind: "wahl", group: "2A", be: 15 },
    { id: "t2a2", no: "2A.2", title: "Kreditentscheidung begründen", kind: "wahl", group: "2A", be: 15 },
    { id: "t2b1", no: "2B.1", title: "Marketing-Mix entwickeln", kind: "wahl", group: "2B", be: 15 },
    { id: "t2b2", no: "2B.2", title: "Absatzkennzahlen interpretieren", kind: "wahl", group: "2B", be: 15 },
    { id: "t31", no: "3.1", title: "Konjunkturindikatoren auswerten", kind: "pflicht", be: 15 },
    { id: "t32", no: "3.2", title: "Geldpolitik der EZB erörtern", kind: "pflicht", be: 20 },
  ];
  const RASTERS = [
    { id: "rs-vbwl-26", name: "VBWL – Haupttermin 2026", subject: "vbwl", year: 2026, status: "freigegeben", mode: "be", tasks: vbwlTasks(), wahl: [{ groups: ["2A", "2B"], pick: 1, label: "Aufgabe 2: 1 aus 2" }], gutachten: false, rules: ["ns-abi", "rd-auf", "gn-std"], bonusMax: 0, parts: [] },
    { id: "rs-de-27", name: "Deutsch – Haupttermin 2027", subject: "de", year: 2027, status: "freigegeben", mode: "np", tasks: [{ id: "d1", no: "I–III", title: "Gewählte Aufgabe (Gesamturteil)", kind: "wahl", group: "I", be: 15 }], wahl: [{ groups: ["I"], pick: 1, label: "1 aus 3 Aufgabenformaten" }], gutachten: true, rules: ["gn-std"], parts: [] },
    { id: "rs-ma-27", name: "Mathematik – Haupttermin 2027", subject: "ma", year: 2027, status: "freigegeben", mode: "be", tasks: [{ id: "m1", no: "A", title: "Pflichtteil ohne Hilfsmittel", kind: "pflicht", be: 30 }, { id: "m2", no: "B1", title: "Analysis", kind: "pflicht", be: 35 }, { id: "m3", no: "B2", title: "Stochastik / Geometrie", kind: "pflicht", be: 35 }], wahl: [], gutachten: false, rules: ["ns-abi", "rd-auf", "gn-std"], parts: [] },
    { id: "rs-en-27", name: "Englisch – Haupttermin 2027 (Entwurf)", subject: "en", year: 2027, status: "entwurf", mode: "be", tasks: [{ id: "e1", no: "A", title: "Reading / Mediation", kind: "pflicht", be: 40 }, { id: "e2", no: "B", title: "Composition", kind: "pflicht", be: 60 }], wahl: [], gutachten: false, rules: ["ns-abi", "gn-fs"], parts: [{ name: "Hörverstehen", weight: 10, korr: true }, { name: "Kommunikationsprüfung", weight: 20, korr: false }] },
  ];

  const GUIDELINES = [
    { id: "kr-allg", name: "Korrekturrichtlinie Berufliches Gymnasium – allgemein", file: "Korrekturrichtlinie_BG_allgemein.pdf", date: "2026-11-02" },
    { id: "kr-de", name: "Korrekturrichtlinie Deutsch (Sprachrichtigkeit)", file: "Korrekturrichtlinie_Deutsch.pdf", date: "2026-11-02" },
    { id: "kr-fs", name: "Korrekturrichtlinie Moderne Fremdsprachen", file: "Korrekturrichtlinie_Fremdsprachen.pdf", date: "2026-11-05" },
  ];

  // ASV-Datenbestand der Schulen (Single Point of Truth); wird pro Prüfung importiert
  const S = (id, first, last) => ({ id, first, last });
  PX.ASV = {
    afs: {
      courses: [
        { id: "AFS-WG13a", name: "WG13a", subject: "vbwl", teachers: ["j.kroeger"], students: [S("afs-0412", "Lea", "Hoffmann"), S("afs-0413", "Noah", "Becker"), S("afs-0414", "Emilia", "Schulz"), S("afs-0415", "Paul", "Wagner"), S("afs-0416", "Mia", "Richter"), S("afs-0417", "Elias", "Krämer")] },
        { id: "AFS-WG13b", name: "WG13b", subject: "vbwl", teachers: ["f.brandt"], students: [S("afs-0421", "Hanna", "Schäfer"), S("afs-0422", "Luis", "Neumann"), S("afs-0423", "Sofia", "Wolf"), S("afs-0424", "Jonas", "Zimmermann")] },
        { id: "AFS-D13", name: "D13 (Deutsch)", subject: "de", teachers: ["j.kroeger"], students: [S("afs-0412", "Lea", "Hoffmann")] },
      ],
      // Datensatz mit unbekannter Kurs-ID → „ungeklärt“
      unresolved: [{ student: S("afs-0425", "Ben", "Kaya"), course: "AFS-WG13c", subject: "vbwl", reason: "Kurs „WG13c“ in den Importdaten nicht vorhanden" }],
    },
    bts: { courses: [{ id: "BTS-WG13", name: "WG13", subject: "vbwl", teachers: ["d.reuter"], students: [S("bts-1101", "Amelie", "Frank"), S("bts-1102", "Leon", "Graf"), S("bts-1103", "Clara", "Busch"), S("bts-1104", "Finn", "Arnold")] }] },
    kts: { courses: [
      { id: "KTS-WG13-1", name: "WG13-1", subject: "vbwl", teachers: ["t.hahn"], students: [S("kts-2201", "Lina", "Roth"), S("kts-2202", "Ben", "Beck"), S("kts-2203", "Marie", "Lorenz"), S("kts-2204", "Tom", "Haas"), S("kts-2205", "Ella", "Kuhn"), S("kts-2206", "Max", "Pfeiffer")] },
      { id: "KTS-WG13-2", name: "WG13-2", subject: "vbwl", teachers: ["n.engel"], students: [S("kts-2211", "Ida", "Sauer"), S("kts-2212", "Jan", "Vogel"), S("kts-2213", "Lia", "Jung"), S("kts-2214", "Anton", "Brandl"), S("kts-2215", "Nele", "Seitz")] },
    ] },
    esg: { courses: [{ id: "ESG-WG13", name: "WG13", subject: "vbwl", teachers: ["l.pohl"], students: [S("esg-3301", "Maja", "Fuchs"), S("esg-3302", "Erik", "Ludwig"), S("esg-3303", "Pia", "Schmitt"), S("esg-3304", "Jakob", "Weiß"), S("esg-3305", "Romy", "Kraus")] }] },
    wsh: { courses: [{ id: "WSH-12", name: "Klasse 13", subject: "vbwl", teachers: ["w.kranz"], students: [S("wsh-4401", "Ronja", "Linde"), S("wsh-4402", "Matti", "Eber"), S("wsh-4403", "Selma", "Grün"), S("wsh-4404", "Jaro", "Falk")] }] },
  };

  // Landesdurchschnitt je Teilaufgabe (Anteil der erreichbaren BE) – für Schul- und Analyseberichte
  PX.LAND = { t11: 0.68, t12: 0.61, t13: 0.57, t2a1: 0.64, t2a2: 0.59, t2b1: 0.66, t2b2: 0.55, t31: 0.62, t32: 0.53 };
  PX.NS_ABI = NS_ABI;

  PX.seed = function () {
    const st = {
      v: PX.DATA_VERSION,
      now: "2027-01-18",
      orgs: PX.clone(ORGS), persons: PX.clone(PERSONS), subjects: PX.clone(SUBJECTS), signs: PX.clone(SIGNS),
      rules: PX.clone(RULES), rasters: PX.clone(RASTERS), guidelines: PX.clone(GUIDELINES),
      exams: [
        { id: "ex-de-ht", subject: "de", type: "HT", year: 2027, date: "2027-04-15", time: "08:30", end: "13:30", ekEnd: "2027-05-03", zkEnd: "2027-05-18", ebStart: "2027-05-20", ebEnd: "2027-06-01", raster: "rs-de-27", guideline: "kr-de", ewh: null, zusatz: false, status: "angelegt", creator: "r.albrecht" },
        { id: "ex-ma-ht", subject: "ma", type: "HT", year: 2027, date: "2027-04-22", time: "08:30", end: "13:00", ekEnd: "2027-05-10", zkEnd: "2027-05-24", ebStart: "2027-05-26", ebEnd: "2027-06-07", raster: "rs-ma-27", guideline: "kr-allg", ewh: null, zusatz: false, status: "angelegt", creator: "o.mertens" },
        { id: "ex-en-ht", subject: "en", type: "HT", year: 2027, date: "2027-04-27", time: "08:30", end: "13:00", ekEnd: "", zkEnd: "", ebStart: "", ebEnd: "", raster: "rs-en-27", guideline: "kr-fs", ewh: null, zusatz: false, status: "entwurf", creator: "o.mertens" },
      ],
      imports: {}, kms: [], mappen: [], groups: [],
      rp: { rpk: { pool: { released: false, entries: [{ id: "pe1", pid: "a.wiegand", subject: "vbwl", locked: false, added: "2026-12-01" }, { id: "pe2", pid: "g.thiel", subject: "gr", locked: false, added: "2026-12-01" }] }, built: false, released: false } },
      scans: [], uploadLog: [], audit: [], notes: [],
      archive: [
        { id: "ar-22a", year: 2022, label: "Abitur 2022 · VBWL · alle Kursmappen RP KA", school: "–", count: 412, at: "2022-07-08", deleteAt: "2027-07-31" },
        { id: "ar-23a", year: 2023, label: "Abitur 2023 · VBWL · alle Kursmappen RP KA", school: "–", count: 398, at: "2023-07-07", deleteAt: "2028-07-31" },
        { id: "ar-26a", year: 2026, label: "Abitur 2026 · VBWL · alle Kursmappen RP KA", school: "–", count: 405, at: "2026-07-10", deleteAt: "2031-07-31" },
      ],
      einsicht: [], asvExports: [], deletedArchives: [],
    };
    st.audit.push({ id: "a0", at: "02.11.2026 09:12", who: "o.mertens", role: "ibbw", action: "Korrekturrichtlinie angelegt", object: "Korrekturrichtlinie BG – allgemein", detail: "PDF hochgeladen" });
    st.audit.push({ id: "a1", at: "01.12.2026 10:40", who: "k.oberle", role: "rp", action: "RP-weiten Pool angelegt", object: "Pool RP Karlsruhe", detail: "2 Einträge aus dem IDAM" });
    st.audit.reverse();
    return st;
  };
})();
