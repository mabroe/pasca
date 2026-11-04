/* PASCA Klickdummy – Demodaten (alle Namen fiktiv)
   Szenario: Abitur 2027 am Wirtschaftsgymnasium, Prüfungsfach „Volks- und Betriebswirtschaftslehre“ (VBWL),
   Regierungsbezirk Karlsruhe. Hauptfall: Kurs WG13a der Ahornfeld-Schule Mannheim (AFS). */
(function () {
  "use strict";
  const PX = window.PX;
  PX.DATA_VERSION = 9;

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
    { id: "vbwl", name: "Volks- und Betriebswirtschaftslehre", short: "VBWL", form: "Berufliches Gymnasium (WG)", prio: "normal", active: true },
    { id: "de", name: "Deutsch", short: "D", form: "Berufliches Gymnasium", prio: "normal", active: true },
    { id: "ma", name: "Mathematik", short: "M", form: "Berufliches Gymnasium", prio: "normal", active: true },
    { id: "en", name: "Englisch", short: "E", form: "Berufliches Gymnasium", prio: "normal", active: true },
    { id: "gmt", name: "Gestaltungs- und Medientechnik", short: "GMT", form: "Berufliches Gymnasium (TG)", prio: "hoch", active: true },
    { id: "inf", name: "Informatik", short: "Inf", form: "Berufliches Gymnasium (TG)", prio: "normal", active: true },
    { id: "la", name: "Latein", short: "L", form: "Allgemeinbildendes Gymnasium", prio: "hoch", active: true },
    { id: "bk", name: "Bildende Kunst", short: "BK", form: "Allgemeinbildendes Gymnasium", prio: "normal", active: true },
    { id: "ph-ag", name: "Physik", short: "Ph", form: "Allgemeinbildendes Gymnasium", prio: "normal", active: true },
    { id: "gr", name: "Griechisch", short: "Gr", form: "Allgemeinbildendes Gymnasium", prio: "hoch", active: true },
  ];

  // Korrekturzeichen (nach den Korrektur- und Bewertungshinweisen); ein Zeichen kann mehreren Prüfungsfächern zugeordnet sein.
  // weight = Fehlergewicht (z. B. Alte Sprachen), count = Anzahl wird beim Setzen abgefragt (Lücke, Fehlernest)
  const AF23 = ["vbwl", "ma", "inf", "gmt"];
  const Z = (id, code, meaning, cat, subjects, extra) => Object.assign({ id, code, meaning, cat, subjects }, extra || {});
  const SIGNS = [
    Z("z-a", "A", "Ausdruck", "Sprachlich-formal", ["de", "en", "vbwl", "ma", "inf", "gmt", "bk"]),
    Z("z-gr", "Gr", "Grammatik", "Sprachlich-formal", ["de", "en", "vbwl", "inf", "gmt", "bk"]),
    Z("z-r", "R", "Rechtschreibung", "Sprachlich-formal", ["de", "en", "vbwl", "ma", "inf", "gmt", "bk"]),
    Z("z-z", "Z", "Zeichensetzung", "Sprachlich-formal", ["de", "en", "vbwl", "inf", "gmt", "bk"]),
    Z("z-sb", "Sb", "Satzbau", "Sprachlich-formal", ["de", "en"]),
    Z("z-st", "St", "Stil", "Sprachlich-formal", ["de", "en"]),
    Z("z-fo", "F", "Formaler Fehler / Form", "Sprachlich-formal", ["de", "vbwl", "gmt", "bk"]),
    Z("z-gl", "Gl", "Gliederungsfehler", "Sprachlich-formal", ["vbwl", "inf", "gmt"]),
    Z("z-fa", "(A)", "Flüchtigkeits-/Folgefehler Ausdruck", "Sprache", ["en"]),
    Z("z-fgr", "(Gr)", "Flüchtigkeits-/Folgefehler Grammatik", "Sprache", ["en"]),
    Z("z-fr", "(R)", "Flüchtigkeits-/Folgefehler Rechtschreibung", "Sprache", ["en"]),
    Z("z-zits", "Zit(S)", "fehlerhafte Zitierweise", "Sprache", ["en"]),
    Z("z-i", "I", "Inhalt / sachlich nicht korrekt", "Inhalt", ["de", "en", "vbwl", "inf", "gmt", "bk"]),
    Z("z-log", "Log", "Logik", "Inhalt", ["de", "vbwl", "inf", "bk"]),
    Z("z-th", "Th", "Thema / Aufgabenstellung verfehlt", "Inhalt", ["de", "vbwl", "bk"]),
    Z("z-bg", "Bg", "fehlende/falsche Begründung", "Inhalt", ["de", "en", "vbwl", "inf", "bk"]),
    Z("z-zs", "Zs", "Zusammenhang", "Inhalt", ["de", "en", "vbwl", "bk"]),
    Z("z-w", "W", "Wiederholung", "Inhalt", ["de", "en", "vbwl"]),
    Z("z-bl", "Bl", "fehlender Beleg / fehlerhaftes Zitat", "Inhalt", ["de"]),
    Z("z-bsp", "Bsp", "Beispiel", "Inhalt", ["de", "vbwl"]),
    Z("z-def", "Def", "Definition", "Inhalt", ["de", "vbwl", "ma", "inf"]),
    Z("z-str", "Str", "fehlende Struktur", "Inhalt", ["en"]),
    Z("z-v", "V", "fehlender Inhalt", "Inhalt", ["en"]),
    Z("z-ziti", "Zit(I)", "ungeeignetes Zitat", "Inhalt", ["en"]),
    Z("z-rr", "r", "richtiges Teilergebnis", "Allgemein", AF23),
    Z("z-f", "f", "falsches Teilergebnis", "Allgemein", AF23),
    Z("z-rk", "(r)", "mit Fehler richtig weitergerechnet", "Allgemein", AF23),
    Z("z-ug", "ug", "ungenau", "Allgemein", AF23),
    Z("z-ul", "ul", "unleserlich", "Allgemein", AF23),
    Z("z-uv", "uv", "unvollständig", "Allgemein", AF23),
    Z("z-fs", "Fs", "Fachsprache", "Inhalt", AF23),
    Z("z-bz", "Bz", "fehlender, falscher Bezug", "Inhalt", AF23),
    Z("z-lue", "Lü", "Lücke", "Inhalt", AF23),
    Z("z-ff", "Ff", "Folgefehler", "Inhalt", [...AF23, "la"], { weight: 0 }),
    Z("z-wf", "Wf", "wiederholt vorkommender Fehler", "Inhalt", [...AF23, "la"], { weight: 0 }),
    Z("z-df", "DF", "Denkfehler (mind. 50 % der BE des Lösungsteils abziehen)", "Inhalt", AF23),
    Z("z-uef", "ÜF", "Übertragungsfehler", "Inhalt", AF23),
    Z("z-rf", "RF", "Rechenfehler", "Inhalt", AF23),
    Z("z-gf", "GF", "grafischer Fehler", "Inhalt", AF23),
    Z("z-m", "M", "falsche/fehlende Maßeinheit", "Inhalt", AF23),
    Z("z-vz", "VZ", "Vorzeichenfehler", "Inhalt", AF23),
    Z("z-ru", "Ru", "Rest unbrauchbar", "Inhalt", AF23),
    Z("z-la-a", "A", "Ausdrucksfehler (¼ Fehler)", "Übersetzung", ["la", "gr"], { weight: 0.25 }),
    Z("z-la-s", "S", "leichter Syntaxfehler (½ Fehler)", "Übersetzung", ["la", "gr"], { weight: 0.5 }),
    Z("z-la-f", "F", "Formfehler (½ Fehler)", "Übersetzung", ["la", "gr"], { weight: 0.5 }),
    Z("z-la-k", "K", "Konstruktionsfehler (1 Fehler)", "Übersetzung", ["la", "gr"], { weight: 1 }),
    Z("z-la-v", "V", "Vokabelfehler (1 Fehler)", "Übersetzung", ["la", "gr"], { weight: 1 }),
    Z("z-la-bez", "Bez", "Wort-/Satzbeziehung (1 Fehler)", "Übersetzung", ["la", "gr"], { weight: 1 }),
    Z("z-la-lue", "[ ]", "Lücke – Anzahl angerechneter Fehler", "Übersetzung", ["la", "gr"], { count: true }),
    Z("z-la-fn", "( )", "Fehlernest – Anzahl angerechneter Fehler", "Übersetzung", ["la", "gr"], { count: true }),
    Z("z-se", "s. E.", "siehe Entwurf (Konzeptblatt gewertet)", "Allgemein", ["de", "en", "vbwl", "ma", "inf", "gmt", "la", "bk"]),
  ];

  // Regeln (Rundung, Gesamtnote) – Notenschlüssel stehen als Tabellen in PX.KEYS (raster.js)
  const RULES = [
    { id: "rd-auf", kind: "rundung", name: "Ø Erst-/Zweitkorrektur auf volle Notenpunkte aufrunden", def: "ceil", note: "Standardregel" },
    { id: "rd-ceil1", kind: "rundung", name: "Zwischenergebnis auf eine Nachkommastelle aufrunden (Fremdsprachen BG)", def: "ceil1", note: "Berechnungstabelle Fremdsprachen BG" },
    { id: "rd-kfm", kind: "rundung", name: "Kaufmännisch auf ganze Notenpunkte", def: "round", note: "u. a. Alte Sprachen, Fremdsprachen AG" },
    { id: "gn-std", kind: "gesamtnote", name: "Endnote: Endbeurteilung, sonst Ø EK/ZK", def: "eb_or_avg", note: "Endbeurteilung bei > 3 NP Abweichung, AG zusätzlich Stichprobe 2 je Kurs" },
    { id: "gn-fs", kind: "gesamtnote", name: "Moderne Fremdsprachen: Hörverstehen 20 % · Lesen und Schreiben 55 % · Kommunikationsprüfung 25 %", def: "weighted", note: "Teil II: Inhalt 40 % / Sprache 60 %, Kappung bei ungenügend" },
    { id: "gn-mean", kind: "gesamtnote", name: "Alte Sprachen: Mittelwert Übersetzung und Interpretation", def: "mean", note: "kaufmännisch gerundet" },
  ];

  // ---------- Bewertungsraster ----------
  const node = (part, id, no, title, be, parent, extra) => Object.assign({ id, part, parent: parent || null, no, title, be: be ?? null }, extra || {});
  const BAUSTEINE_DE = [
    { cat: "sehr gut (15–13)", text: "Die Arbeit erfasst die Aufgabe präzise und entwickelt das Thema besonders ergiebig." },
    { cat: "sehr gut (15–13)", text: "Die inhaltsbezogene Formbetrachtung ist überzeugend gelungen; Urteile sind selbstständig und differenziert." },
    { cat: "gut (12–10)", text: "Die Probleme des Themas sind erfasst; es werden mehr als die naheliegenden Gesichtspunkte erörtert." },
    { cat: "gut (12–10)", text: "Die Darstellung ist sicher, die Gedankenführung schlüssig." },
    { cat: "befriedigend (9–7)", text: "Die Aufgabe ist im Wesentlichen verstanden; die Ausführungen bleiben stellenweise an der Oberfläche." },
    { cat: "befriedigend (9–7)", text: "Der Text ist in Grundzügen erschlossen, die Deutung jedoch nicht durchgängig belegt." },
    { cat: "ausreichend (6–4)", text: "Die Arbeit zeigt Ansätze einer Erschließung, weist aber deutliche inhaltliche Lücken auf." },
    { cat: "mangelhaft (3–1)", text: "Die Aufgabenstellung wird nur in Teilen erfasst; die Gedankenführung ist kaum nachvollziehbar." },
    { cat: "Sprache", text: "Die sprachliche Gestaltung ist sicher, der Ausdruck treffend und differenziert." },
    { cat: "Sprache", text: "Gehäufte Verstöße gegen die sprachliche Richtigkeit beeinträchtigen die Lesbarkeit." },
  ].map((b, i) => ({ id: "b" + i, ...b }));
  const BAUSTEINE_BK = [
    { cat: "Arbeitsauftrag", text: "Die Bildanalyse ist strukturiert und fachsprachlich sicher." },
    { cat: "Arbeitsauftrag", text: "Formale und inhaltliche Aspekte werden überzeugend aufeinander bezogen." },
    { cat: "Arbeitsauftrag", text: "Die Beschreibung bleibt überwiegend additiv; Deutungsansätze sind nur in Ansätzen erkennbar." },
    { cat: "Gestaltung", text: "Die gestalterische Lösung ist eigenständig und handwerklich sorgfältig umgesetzt." },
    { cat: "Gestaltung", text: "Die praktische Arbeit setzt die Aufgabenstellung nur teilweise um." },
  ].map((b, i) => ({ id: "k" + i, ...b }));
  function vbwl(id, name, year, status) {
    const { raster: r } = PX.buildRaster(PX.rowsFromSheet(PX.SAMPLE_VBWL), { id, name, subject: "vbwl", year, status, form: "BG" });
    r.nodes.forEach((n) => { if (PX.VBWL_TITLES[n.no]) n.title = PX.VBWL_TITLES[n.no]; });
    r.parts[0].name = "Teil 1 – BWL/RW"; r.parts[1].name = "Teil 2 – VWL";
    r.groups[0].label = "Teil 1: 2 aus 3"; r.groups[1].label = "Teil 2: 2 aus 3";
    return r;
  }
  const RASTERS = () => [
    vbwl("rs-vbwl-26", "VBWL – Haupttermin 2026", 2026, "freigegeben"),
    { id: "rs-de-27", name: "Deutsch BG – Haupttermin 2027", subject: "de", year: 2027, form: "BG", status: "freigegeben", combine: "weighted", round: { stage: "round", final: "ceil" }, abzugMax: 2,
      parts: [{ id: "p1", name: "Aufsatz", scoring: "np", weight: 100 }],
      nodes: [node("p1", "d1", "1", "Interpretation literarischer Texte"), node("p1", "d2", "2", "Lyrik / Kurzprosa"), node("p1", "d2a", "2a", "Gedichtinterpretation / -vergleich", null, "d2"), node("p1", "d2b", "2b", "Interpretation eines Kurzprosatextes", null, "d2"), node("p1", "d3", "3", "Texterörterung (mit Berufsweltbezug)"), node("p1", "d4", "4", "Textanalyse")],
      groups: [{ id: "gd", label: "Aufgabenwahl: 1 aus 4", options: ["d1", "d2", "d3", "d4"], pick: 1, chooser: "schueler" }, { id: "gd2", label: "Aufgabe 2: a oder b", options: ["d2a", "d2b"], pick: 1, chooser: "schueler" }],
      gutachten: { on: true, required: true, sections: ["Begründung der Note"], bausteine: BAUSTEINE_DE }, formPdf: false, caps: [] },
    { id: "rs-ma-27", name: "Mathematik BG – Haupttermin 2027", subject: "ma", year: 2027, form: "BG", status: "freigegeben", combine: "sum", key: "bg100", round: { stage: "round", final: "ceil" }, abzugMax: 2, bonus: { on: true, max: 7 }, beHalf: true,
      parts: [{ id: "pa", name: "Teil A", scoring: "be" }, { id: "pb", name: "Teil B", scoring: "be" }],
      nodes: [node("pa", "a1", "A1", "Pflichtteil (ohne Hilfsmittel)"), node("pa", "a11", "A1.1", "Ableitung", 5, "a1"), node("pa", "a12", "A1.2", "Integral", 5, "a1"), node("pa", "a13", "A1.3", "Vektoren", 5, "a1"), node("pa", "a14", "A1.4", "Wahrscheinlichkeit", 5, "a1"),
        node("pa", "a2", "A2", "Schüler-Wahlteil"), node("pa", "a2x", "A2-W", "Zwei Wahlaufgaben", null, "a2"), node("pa", "w1", "W1", "Sachgebiet 1, Aufgabe 1", 10, "a2x"), node("pa", "w2", "W2", "Sachgebiet 1, Aufgabe 2", 10, "a2x"), node("pa", "w3", "W3", "Sachgebiet 2, Aufgabe 1", 10, "a2x"), node("pa", "w4", "W4", "Sachgebiet 2, Aufgabe 2", 10, "a2x"), node("pa", "pla", "PLA", "Problemlöseaufgabe (verbleibendes Sachgebiet)", 20, "a2"),
        node("pb", "b1", "B I", "Analysis"), node("pb", "b11", "B I.1", "Analysis Aufgabe 1", 20, "b1"), node("pb", "b12", "B I.2", "Analysis Aufgabe 2", 20, "b1"),
        node("pb", "b2", "B II", "Analytische Geometrie"), node("pb", "b21", "B II.1", "Geometrie Aufgabe 1", 20, "b2"), node("pb", "b22", "B II.2", "Geometrie Aufgabe 2", 20, "b2"),
        node("pb", "b3", "B III", "Stochastik"), node("pb", "b31", "B III.1", "Stochastik Aufgabe 1", 20, "b3"), node("pb", "b32", "B III.2", "Stochastik Aufgabe 2", 20, "b3")],
      groups: [{ id: "gma2", label: "Wahlteil: zwei Aufgaben oder PLA", options: ["a2x", "pla"], pick: 1, chooser: "schueler" }, { id: "gma2x", label: "2 aus 4 Wahlaufgaben", options: ["w1", "w2", "w3", "w4"], pick: 2, chooser: "schueler" },
        { id: "gb1", label: "Analysis", options: ["b11", "b12"], pick: 1, chooser: "lehrer" }, { id: "gb2", label: "Analytische Geometrie", options: ["b21", "b22"], pick: 1, chooser: "lehrer" }, { id: "gb3", label: "Stochastik", options: ["b31", "b32"], pick: 1, chooser: "lehrer" }],
      gutachten: { on: false, sections: ["Gutachten"], bausteine: [] }, formPdf: false, caps: [] },
    { id: "rs-en-27", name: "Englisch BG – Haupttermin 2027", subject: "en", year: 2027, form: "BG", status: "freigegeben", combine: "weighted", round: { stage: "ceil1", final: "none", withExtern: "round" }, abzugMax: 0,
      parts: [{ id: "hv", name: "Teil I – Hörverstehen", scoring: "pct", weight: 20, key: "pct" }, { id: "t2", name: "Teil II – Lesen und Schreiben", scoring: "np", weight: 55 }, { id: "kp", name: "Teil III – Kommunikationsprüfung", scoring: "extern", weight: 25 }],
      nodes: [node("hv", "hv1", "HV 1", "Mehrfachwahlaufgaben", 8), node("hv", "hv2", "HV 2", "Zuordnungsaufgaben", 10), node("hv", "hv3", "HV 3", "Kurzantworten", 12),
        node("t2", "inh", "Inhalt", "Inhaltliche Leistung", null, null, { weight: 0.4 }),
        node("t2", "sa", "Satz A", "Aufgabensatz A", null, "inh"), node("t2", "sa1", "A1", "Leseverstehen", null, "sa", { weight: 0.3 }), node("t2", "sa2", "A2", "Textanalyse", null, "sa", { weight: 0.3 }), node("t2", "sa3", "A3", "Erörterung / kreatives Schreiben", null, "sa", { weight: 0.4 }), node("t2", "sa3a", "A3a", "Erörterung", null, "sa3"), node("t2", "sa3b", "A3b", "Kreative Schreibaufgabe", null, "sa3"),
        node("t2", "sb", "Satz B", "Aufgabensatz B", null, "inh"), node("t2", "sb1", "B1", "Leseverstehen", null, "sb", { weight: 0.3 }), node("t2", "sb2", "B2", "Textanalyse", null, "sb", { weight: 0.3 }), node("t2", "sb3", "B3", "Erörterung / kreatives Schreiben", null, "sb", { weight: 0.4 }), node("t2", "sb3a", "B3a", "Erörterung", null, "sb3"), node("t2", "sb3b", "B3b", "Kreative Schreibaufgabe", null, "sb3"),
        node("t2", "spr", "Sprache", "Sprachliche Leistung (gesamter Teil II)", null, null, { weight: 0.6 })],
      groups: [{ id: "gsatz", label: "Aufgabensatz A oder B", options: ["sa", "sb"], pick: 1, chooser: "schueler" }, { id: "ga3", label: "Aufgabe A3: a oder b", options: ["sa3a", "sa3b"], pick: 1, chooser: "schueler" }, { id: "gb3x", label: "Aufgabe B3: a oder b", options: ["sb3a", "sb3b"], pick: 1, chooser: "schueler" }],
      caps: [{ part: "t2", nodes: ["inh", "spr"], below: 1, max: 3, label: "Inhalt oder Sprache ungenügend → Teil II höchstens 3 NP" }],
      gutachten: { on: false, sections: ["Gutachten"], bausteine: [] }, formPdf: false },
    { id: "rs-gmt-27", name: "GMT – Haupttermin 2027", subject: "gmt", year: 2027, form: "BG", status: "freigegeben", combine: "sum", key: "bg120", round: { stage: "round", final: "ceil" }, abzugMax: 2, bonus: { on: true, max: 8 },
      parts: [{ id: "p1", name: "Prüfung", scoring: "be" }],
      nodes: [node("p1", "g1", "1", "Pflichtaufgabe Mediengestaltung"), node("p1", "g11", "1.1", "Konzeption", 20, "g1"), node("p1", "g12", "1.2", "Umsetzung", 20, "g1"), node("p1", "g2", "2", "Pflichtaufgabe Produktgestaltung"), node("p1", "g21", "2.1", "Entwurf", 20, "g2"), node("p1", "g22", "2.2", "Technische Zeichnung", 20, "g2"), node("p1", "g3", "3", "Wahlaufgabe Produktgestaltung", 40), node("p1", "g4", "4", "Wahlaufgabe Mediengestaltung", 40)],
      groups: [{ id: "gg", label: "Wahlaufgabe 3 oder 4", options: ["g3", "g4"], pick: 1, chooser: "schueler" }],
      gutachten: { on: false, sections: ["Gutachten"], bausteine: [] }, formPdf: true, caps: [] },
    { id: "rs-la-27", name: "Latein AG – Haupttermin 2027", subject: "la", year: 2027, form: "AG", status: "freigegeben", combine: "mean", round: { stage: "round", final: "ceil" }, abzugMax: 2,
      parts: [{ id: "ue", name: "Übersetzung", scoring: "fehler", key: "fs-la", weight: 50 }, { id: "in", name: "Interpretation", scoring: "be", key: "ag60", weight: 50 }],
      nodes: [node("ue", "ue1", "Ü", "Fehlerzahl der Übersetzung"), node("in", "i1", "I 1", "Inhaltserschließung", 20), node("in", "i2", "I 2", "Stilistische Analyse", 20), node("in", "i3", "I 3", "Rezeption / Vergleich", 20)],
      groups: [], gutachten: { on: false, sections: ["Gutachten"], bausteine: [] }, formPdf: false, caps: [] },
    { id: "rs-ph-27", name: "Physik AG – Haupttermin 2027 (Entwurf)", subject: "ph-ag", year: 2027, form: "AG", status: "entwurf", combine: "sum", key: "ag80", round: { stage: "round", final: "ceil" }, abzugMax: 2, bonus: { on: true, max: 0 },
      parts: [{ id: "p1", name: "Prüfung", scoring: "be" }],
      nodes: [node("p1", "f1", "1", "Mechanik", 40), node("p1", "f2", "2", "Elektrodynamik", 40), node("p1", "f3", "3", "Quantenphysik", 40)],
      groups: [], gutachten: { on: false, sections: ["Gutachten"], bausteine: [] }, formPdf: false, caps: [] },
    { id: "rs-bk-27", name: "Bildende Kunst AG – Haupttermin 2027", subject: "bk", year: 2027, form: "AG", status: "freigegeben", combine: "weighted", round: { stage: "round", final: "ceil" }, abzugMax: 2,
      parts: [{ id: "p1", name: "Prüfung", scoring: "np", weight: 100 }],
      nodes: [node("p1", "k1", "I", "Aufgabe I – Bildanalyse und Gestaltung"), node("p1", "k2", "II", "Aufgabe II – Architektur"), node("p1", "k3", "III", "Aufgabe III – Werkvergleich")],
      groups: [{ id: "gk", label: "1 aus 3 Aufgaben", options: ["k1", "k2", "k3"], pick: 1, chooser: "schueler" }],
      gutachten: { on: true, required: true, sections: ["Arbeitsauftrag 1", "Arbeitsauftrag 2", "Arbeitsauftrag 3", "Gesamturteil"], bausteine: BAUSTEINE_BK }, formPdf: false, caps: [] },
  ];

  // Globaler Korrekturkalender je Abiturjahr, Schulform und Terminart
  const CAL = (form, type, ekEnd, zkEnd, ebStart, ebEnd) => ({ id: `cal-2027-${form}-${type}`, year: 2027, form, type, ekEnd, zkEnd, ebStart, ebEnd });
  const CALENDARS = [
    CAL("BG", "HT", "2027-05-07", "2027-05-21", "2027-05-25", "2027-06-04"), CAL("BG", "NT", "2027-05-26", "2027-06-09", "2027-06-11", "2027-06-18"), CAL("BG", "NNT", "2027-06-18", "2027-06-29", "2027-07-01", "2027-07-07"),
    CAL("AG", "HT", "2027-05-05", "2027-05-19", "2027-05-21", "2027-06-02"), CAL("AG", "NT", "2027-05-28", "2027-06-11", "2027-06-14", "2027-06-21"), CAL("AG", "NNT", "2027-06-21", "2027-07-01", "2027-07-05", "2027-07-09"),
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
  PX.LAND = (id) => 0.52 + PX.hash("land" + id) * 0.18;

  PX.seed = function () {
    const st = {
      v: PX.DATA_VERSION,
      now: "2027-01-18",
      orgs: PX.clone(ORGS), persons: PX.clone(PERSONS), subjects: PX.clone(SUBJECTS), signs: PX.clone(SIGNS),
      rules: PX.clone(RULES), rasters: RASTERS(), guidelines: PX.clone(GUIDELINES), calendars: PX.clone(CALENDARS),
      exams: [
        { id: "ex-de-ht", subject: "de", type: "HT", year: 2027, date: "2027-04-15", time: "08:30", end: "13:30", raster: "rs-de-27", guideline: "kr-de", status: "angelegt", creator: "r.albrecht" },
        { id: "ex-ma-ht", subject: "ma", type: "HT", year: 2027, date: "2027-04-22", time: "08:30", end: "13:00", raster: "rs-ma-27", guideline: "kr-allg", status: "angelegt", creator: "o.mertens" },
        { id: "ex-en-ht", subject: "en", type: "HT", year: 2027, date: "2027-04-27", time: "08:30", end: "13:00", raster: "rs-en-27", guideline: "kr-fs", status: "angelegt", creator: "o.mertens" },
        { id: "ex-gmt-ht", subject: "gmt", type: "HT", year: 2027, date: "2027-04-23", time: "08:30", end: "14:30", raster: "rs-gmt-27", guideline: "kr-allg", status: "angelegt", creator: "o.mertens", zusatz: true },
        { id: "ex-la-ht", subject: "la", type: "HT", year: 2027, date: "2027-04-13", time: "08:30", end: "12:30", raster: "rs-la-27", guideline: "", status: "angelegt", creator: "o.mertens" },
        { id: "ex-bk-ht", subject: "bk", type: "HT", year: 2027, date: "2027-04-16", time: "08:30", end: "13:30", raster: "rs-bk-27", guideline: "", status: "angelegt", creator: "o.mertens" },
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
    st.exams.forEach((e) => PX.initExam(e, st));
    return st;
  };
})();
