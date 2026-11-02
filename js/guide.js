/* PASCA Klickdummy – Klickstrecken (Leitfaden) je Workflow
   Fortschritt wird aus den Daten erkannt; jede Klickstrecke kann mit passendem Ausgangszustand starten. */
(function () {
  "use strict";
  const PX = window.PX; const { esc, icon, $, $$ } = PX;
  const KEY = "pasca.guide";
  const st = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } };
  const save = (v) => (v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY));
  const ex = () => PX.mainExam();
  const M = (sid) => PX.S.mappen.find((m) => m.student === sid && m.km.endsWith("-ht"));
  const KM = (name, school = "afs") => PX.S.kms.find((k) => k.school === school && k.name === name && k.exam === ex()?.id);
  const G = (kmName, school = "afs") => { const k = KM(kmName, school); return k ? PX.groupOf(k) : null; };
  const visited = (h) => !!(st()?.visited || []).some((v) => v === h || v.startsWith(h + "?") || v.startsWith(h + "/"));
  const audit = (a) => PX.S.audit.some((x) => x.action === a);
  const as = (role, person, stage) => ({ role, person, stage });
  const IB = as("ibbw", "r.albrecht"), SL = as("slt", "m.haldenwang"), SC = as("sco", "p.sommer"), RP = as("rp", "k.oberle");
  const simulate = (fn) => { const prev = PX._actor; try { fn(); } finally { PX._actor = prev; } };

  const K1 = () => [
    { title: "Prüfungsfächer und Korrekturzeichensatz prüfen", text: "Als Dr. Ruth Albrecht (IBBW) die Prüfungsfächer öffnen. Jedes Fach braucht einen Korrekturzeichensatz – sonst kann keine Prüfung angelegt werden. Fächer für berufliche und allgemeinbildende Gymnasien sind getrennt.", as: IB, go: "#/ibbw/faecher", done: () => visited("#/ibbw/faecher") },
    { title: "Korrekturzeichen ansehen", text: "Unter „Korrekturzeichen“ sehen Sie Zeichen, Bedeutung und Fachzuordnung. Legen Sie optional ein Zeichen an (z. B. „Fb – Fachbegriff“).", optional: true, as: IB, go: "#/ibbw/zeichen", done: () => visited("#/ibbw/zeichen") },
    { title: "Korrekturkalender prüfen", text: "Unter „Korrekturkalender“ sind die Korrekturzeiträume für Haupt-, Nach- und Nachnachtermin global festgelegt – getrennt für berufliche und allgemeinbildende Gymnasien. Neue Prüfungen übernehmen sie automatisch.", optional: true, as: IB, go: "#/ibbw/kalender", done: () => visited("#/ibbw/kalender") },
    { title: "Bewertungsraster aus dem Vorjahr duplizieren", text: "Unter „Bewertungsraster“ bei „VBWL – Haupttermin 2026“ auf „Duplizieren“ klicken und als „VBWL – Haupttermin 2027“ speichern.", as: IB, go: "#/ibbw/raster", done: () => PX.S.rasters.some((r) => r.subject === "vbwl" && r.year === 2027) },
    { title: "Raster prüfen und freigeben", text: "Aufgabenbaum (A1 → A1.1 → A1.1.1), Wahlregeln (Teil 1 und Teil 2: je 2 aus 3), Notenschlüssel (120 BE) und Rundung prüfen, rechts in der Testrechnung ausprobieren, dann „Freigeben“. Nur freigegebene Raster stehen in der Prüfungsanlage zur Auswahl.", as: IB, go: () => { const r = PX.S.rasters.find((x) => x.subject === "vbwl" && x.year === 2027); return r ? "#/ibbw/raster/" + r.id : "#/ibbw/raster"; }, done: () => PX.S.rasters.some((r) => r.subject === "vbwl" && r.year === 2027 && r.status === "freigegeben") },
    { title: "Prüfung mit Terminen und Korrekturzeiträumen anlegen", text: "„Prüfung anlegen“: Fach VBWL, Haupt-, Nach- und Nachnachtermin (mit „Demo-Werte einsetzen“ geht es schneller). Die Korrekturzeiträume kommen aus dem Korrekturkalender. Raster 2027, Korrekturrichtlinie, Zweitkorrektur-Modus und Korrekturzeichen wählen, prüfen und speichern.", as: IB, go: "#/ibbw/pruefung/neu", done: () => !!ex() && ex().status === "angelegt" },
    { title: "Sichtbarkeit prüfen", text: "Als Schulleitung der AFS sehen Sie Termine und Korrekturzeiträume (Übersicht), aber noch keine Bewertungsgrundlagen. Danach „Erledigt“ klicken.", manual: "k1vis", as: SL, go: "#/slt" },
  ];
  const K2 = () => [
    { title: "Benachrichtigung lesen und Daten aus ASV importieren", text: "Als Markus Haldenwang (Schulleitungsteam AFS) unter „Datenimport“ „Daten aus ASV importieren“ wählen. Das System erzeugt je Kurs eine Kursmappe und je Prüfling eine digitale Mappe.", as: SL, go: "#/slt/import", done: () => !!PX.S.imports["afs|" + ex()?.id] },
    { title: "Ungeklärten Datensatz zuordnen", text: "Ben Kaya ist einem unbekannten Kurs „WG13c“ zugeordnet. Ordnen Sie ihn der Kursmappe WG13b zu.", as: SL, go: "#/slt/import", done: () => !!PX.S.imports["afs|" + ex()?.id]?.unresolved.every((u) => u.done) },
    { title: "Importierte Daten und Kursmappe prüfen", text: "„Importierte Daten anzeigen“ oder eine Kursmappe öffnen: Lehrkraft und Prüflinge kontrollieren. Importdaten sind nicht editierbar, nur die Zuordnung.", optional: true, as: SL, go: "#/slt/kursmappen", done: () => visited("#/slt/kursmappe") },
    { title: "Kursmappen freigeben", text: "„Alle Kursmappen freigeben“ – erst damit werden die Zuordnungen verbindlich.", as: SL, go: "#/slt/kursmappen", done: () => { const k = PX.S.kms.filter((x) => x.school === "afs" && x.exam === ex()?.id); return k.length > 0 && k.every((x) => x.status === "freigegeben"); } },
    { title: "Übrige Schulen des Bezirks (Simulation)", text: "Die vier anderen Schulen im RP Karlsruhe importieren und geben frei. Klicken Sie auf „Simulieren“.", as: RP, go: "#/rp", action: { label: "Simulieren", run: () => { const e = ex(); PX.schools().filter((s) => s.id !== "afs" && PX.ASV[s.id]).forEach((s) => { const sl = PX.sltOf(s.id)[0].id; PX._actor = sl; PX.ops.importData(s.id, e.id, "ASV"); PX.S.kms.filter((k) => k.school === s.id && k.exam === e.id).forEach((k) => PX.ops.releaseKM(k.id)); PX._actor = null; }); } }, done: () => { const k = PX.S.kms.filter((x) => x.exam === ex()?.id); return k.length >= 7 && k.every((x) => x.status === "freigegeben"); } },
  ];
  const K3 = () => [
    { title: "Datenstand der Schulen prüfen", text: "Als Karin Oberle (RP Karlsruhe) die Übersicht öffnen: Alle Schulen haben importiert und freigegeben. Die Waldorfschule steht auf der Ausschlussliste (keine ZK/EB).", as: RP, go: "#/rp", done: () => visited("#/rp") },
    { title: "RP-weiten Pool freigeben", text: "Unter „RP-Pool“ ist z. B. Anna Wiegand (Freiburg) für VBWL hinterlegt – für seltene Fächer. Pool freigeben, damit die Gruppenbildung ihn nutzen kann.", as: RP, go: "#/rp/pool", done: () => PX.S.rp.rpk.pool.released },
    { title: "Korrekturgruppen automatisch bilden", text: "„Korrekturgruppen automatisch bilden“: Der Algorithmus berücksichtigt 50-km-Regel, Ausschlussliste, gleichmäßige Belastung (EK + ZK) und EB-Kapazitäten.", as: RP, go: "#/rp/gruppen", done: () => PX.S.rp.rpk.built },
    { title: "Begründungen und Belastung prüfen, ggf. eingreifen", text: "Je Gruppe sehen Sie die Begründung; unten die Belastung je Lehrkraft. Optional eine Gruppe „Bearbeiten“ – die Auswirkungen werden vor dem Speichern angezeigt und protokolliert.", optional: true, as: RP, go: "#/rp/gruppen", done: () => PX.S.groups.some((g) => g.log.length) },
    { title: "Korrekturgruppen freigeben", text: "„Korrekturgruppen freigeben“ – alle Gruppen des Jahrgangs werden gemeinsam verbindlich; die Schulen werden informiert.", as: RP, go: "#/rp/gruppen", done: () => PX.S.rp.rpk.released },
    { title: "AFS: Zuweisungen bestätigen", text: "Als Markus Haldenwang (AFS) unter „Korrektor:innen“ die Erstkorrektur der eigenen Kursmappen und die der AFS zugewiesenen Zweitkorrekturen bestätigen (Vorschlag übernehmen oder andere Lehrkraft wählen).", as: SL, go: "#/slt/korrektoren", done: () => PX.S.groups.filter((g) => g.exam === ex()?.id).every((g) => ["ek", "zk", "eb"].every((s) => (s === "ek" ? g.ek.school : g[s].school) !== "afs" || g[s].confirmed)) },
    { title: "BTS: Zweitkorrektur für WG13a bestimmen", text: "Als Ulrike Fender (Birkental-Schule) die Zweitkorrektur der AFS-Kursmappe WG13a bestätigen (Vorschlag: Daniel Reuter).", as: as("slt", "u.fender"), go: "#/slt/korrektoren", done: () => !!G("WG13a")?.zk.confirmed },
    { title: "ESG: Endbeurteilung bestimmen", text: "Als Bernd Kolb (Eichenhain-Schule) die Endbeurteilung für WG13a bestätigen (Vorschlag: Dr. Henrike Saalfeld).", as: as("slt", "b.kolb"), go: "#/slt/korrektoren", done: () => !!G("WG13a")?.eb.confirmed },
    { title: "Übrige Bestätigungen (Simulation)", text: "Die restlichen Schulen bestätigen ihre Zuweisungen.", as: RP, go: "#/rp/gruppen", action: { label: "Simulieren", run: () => PX.S.groups.filter((g) => g.exam === ex()?.id).forEach((g) => ["ek", "zk", "eb"].forEach((s) => { if (!g[s].confirmed) { const sch = s === "ek" ? g.ek.school : g[s].school; PX._actor = PX.sltOf(sch)[0]?.id; PX.ops.confirmAssignment(g.id, s); PX._actor = null; } })) }, done: () => PX.S.groups.filter((g) => g.exam === ex()?.id).every(PX.groupComplete) },
  ];
  const K4 = () => [
    { title: "Nachteilsausgleich erfassen", text: "Als Markus Haldenwang unter „Prüfungstag“ für Mia Richter (WG13a) einen Nachteilsausgleich erfassen, z. B. „Zeitverlängerung um 25 %“.", as: SL, go: "#/slt/pruefungstag", done: () => !!M("afs-0416")?.nta },
    { title: "Deckblätter erzeugen und drucken", text: "Für WG13a und WG13b „Deckblätter erzeugen“ – die Druckansicht öffnet sich in einem neuen Tab (Barcode mit Prüfungs-, Kurs- und Prüflings-ID).", as: SL, go: "#/slt/pruefungstag", done: () => PX.S.kms.filter((k) => k.school === "afs" && k.exam === ex()?.id).every((k) => k.covers) },
    { title: "Demo-Zeit auf den Prüfungstag stellen", text: "Oben rechts „Demo-Zeit“ → „Prüfungstag VBWL“ (20.04.2027).", as: SL, go: "#/slt/pruefungstag", done: () => PX.S.now >= (ex()?.date || "9") },
    { title: "Erwartungshorizont hochladen", text: "Als Dr. Ruth Albrecht (IBBW) in der Prüfung unter „Bewertungsgrundlagen“ den Erwartungshorizont (PDF) hochladen – frühestens ab Prüfungsbeginn.", as: IB, go: () => "#/ibbw/pruefung/" + ex()?.id + "?tab=grundlagen", done: () => !!ex()?.ewh },
    { title: "Nicht-Teilnahme erfassen", text: "Als Markus Haldenwang: Elias Krämer hat entschuldigt gefehlt (Attest). Teilnahme auf „nicht teilgenommen – entschuldigt“ setzen.", as: SL, go: "#/slt/pruefungstag", done: () => M("afs-0417")?.absent === "entschuldigt" },
    { title: "Für den Nachtermin anmelden", text: "Elias Krämer „Für Nachtermin anmelden“ – seine Mappe wird nicht korrigiert, für den Nachtermin wird ein neuer Prüfungsvorgang eingerichtet.", as: SL, go: "#/slt/pruefungstag", done: () => !!M("afs-0417")?.nachtermin },
  ];
  const afsScans = () => PX.S.scans.filter((s) => s.school === "afs");
  const K5 = () => [
    { title: "Prüfungsunterlagen einscannen bzw. hochladen", text: "Als Petra Sommer (Scan-Operator AFS) im „Scan-Eingang“ entweder „Lokaler Scan mit Upload“ → „Dateien auswählen“ oder „Systemseitiger Scan“ → „Scan starten“. Die Metadaten (Auflösung, Seitenzahl) werden automatisch geprüft.", as: SC, go: "#/scan", done: () => afsScans().length >= 10 },
    { title: "Automatische Zuordnung per Barcode", text: "„Automatische Zuordnung starten“. Eine Datei kann nicht zugeordnet werden (Barcode unleserlich).", as: SC, go: "#/scan", done: () => afsScans().length >= 10 && !afsScans().some((s) => s.status === "hochgeladen") },
    { title: "Nicht zugeordnete Datei manuell zuordnen", text: "Datei mit Status „nicht zugeordnet“ öffnen („Prüfen“). Deckblatt lesen, Kursmappe WG13a und Prüfling wählen, Prüflings-ID (AFS-0415) übernehmen, bestätigen.", as: SC, go: "#/scan", done: () => { const s = afsScans().find((x) => x.target === M("afs-0415")?.id); return !!s && !!s.mappe; } },
    { title: "Gedrehte Seite korrigieren", text: "Die Datei von Emilia Schulz hat eine Seite, die auf dem Kopf steht. Öffnen, Seite markieren und zweimal um +90° drehen.", as: SC, go: () => { const s = afsScans().find((x) => x.target === M("afs-0414")?.id); return s ? "#/scan/datei/" + s.id : "#/scan"; }, done: () => { const s = afsScans().find((x) => x.target === M("afs-0414")?.id); return !!s && !s.pages.some((p) => p.rot); } },
    { title: "Qualitätsmängel durch Nachscan beheben", text: "Luis Neumann: Auflösung 150 dpi → „Neu scannen und ersetzen“. Mia Richter: ein Blatt fehlt → „Fehlende Seite nachscannen“.", as: SC, go: "#/scan/kursmappen", done: () => afsScans().length >= 10 && !afsScans().some((s) => PX.qc(s).some((q) => q.block)) },
    { title: "Vollständigkeit prüfen und zur Korrektur freigeben", text: "Unter „Kursmappen“ sind alle Mappen grün. „Vollständige Kursmappen zur Korrektur freigeben“ – die Erstkorrektor:innen werden benachrichtigt.", as: SC, go: "#/scan/kursmappen", done: () => PX.S.kms.filter((k) => k.school === "afs" && k.exam === ex()?.id).every((k) => k.scanReleased) },
    { title: "Upload-Protokoll ansehen", text: "Alle Schritte (Upload, Zuordnung, Nachscan, Freigabe) sind lückenlos dokumentiert.", optional: true, as: SC, go: "#/scan/protokoll", done: () => visited("#/scan/protokoll") },
  ];
  const wg = () => KM("WG13a");
  const K6 = () => { const k = wg(); const kid = k?.id || "x"; const lea = M("afs-0412"); return [
    { title: "Erstkorrektur: Kursmappe öffnen", text: "Als Jana Kröger (Erstkorrektur) „Meine Korrekturen“ → Kursmappe WG13a öffnen. Hier finden Sie Erwartungshorizont, Raster und Korrekturzeichen.", as: as("lk", "j.kroeger", "ek"), go: `#/korr/km/${kid}/ek`, done: () => visited(`#/korr/km/${kid}/ek`) },
    { title: "Mappe Lea Hoffmann korrigieren", text: "„Korrigieren“: Korrekturzeichen setzen (Werkzeug „Zeichen“) oder eine Stelle unterstreichen – dann wird ein Zeichen vorgeschlagen (mind. 2 Markierungen). Rechts je Teil die bearbeiteten Wahlaufgaben (2 aus 3) festlegen und alle BE eintragen; nicht bearbeitete Teilaufgaben mit „n. b.“ markieren.", as: as("lk", "j.kroeger", "ek"), go: `#/korr/m/${lea?.id}/ek`, done: () => { const c = lea?.corr.ek; return !!c && c.marks.length >= 2 && PX.evaluate(PX.raster(ex()), c, PX.km(lea.km), lea).complete; } },
    { title: "Personenbezogene Daten schwärzen", text: "Auf Blatt 1 steht der Name der Schülerin. Werkzeug „Schwärzen“ wählen und ein Rechteck darüber ziehen – für ZK und EB ist er dann nicht lesbar.", as: as("lk", "j.kroeger", "ek"), go: `#/korr/m/${lea?.id}/ek`, done: () => (lea?.corr.ek?.redactions || []).length > 0 },
    { title: "Private Notiz setzen", text: "Werkzeug „Notiz“: Die Notiz sieht nur die Verfasserin – nicht in Berichten oder bei der Einsichtnahme.", optional: true, as: as("lk", "j.kroeger", "ek"), go: `#/korr/m/${lea?.id}/ek`, done: () => (lea?.corr.ek?.notes || []).length > 0 },
    { title: "Mappe abschließen", text: "„Korrektur dieser Mappe abschließen“ – das System berechnet die Notenpunkte und erzeugt den Erstkorrekturbericht.", as: as("lk", "j.kroeger", "ek"), go: `#/korr/m/${lea?.id}/ek`, done: () => lea?.corr.ek?.state === "fertig" },
    { title: "Übrige Mappen (Demo-Abkürzung)", text: "Zurück zur Kursmappe und „Demo-Abkürzung: übrige Mappen automatisch korrigieren“ – oder weitere Mappen selbst korrigieren.", as: as("lk", "j.kroeger", "ek"), go: `#/korr/km/${kid}/ek`, done: () => !!k && PX.activeMappen(k).every((m) => m.corr.ek?.state === "fertig") },
    { title: "Kursmappenabschluss bestätigen (EK)", text: "„Kursmappenabschluss bestätigen“ – nur möglich, wenn alle Mappen vollständig bewertet sind.", as: as("lk", "j.kroeger", "ek"), go: `#/korr/km/${kid}/ek`, done: () => !!k?.stages.ek.lkDone.includes("j.kroeger") },
    { title: "Schulleitung bestätigt die Erstkorrektur", text: "Als Markus Haldenwang unter „Korrekturstand“ „Abschluss bestätigen“. Danach erhält die Zweitkorrektur Zugriff.", as: SL, go: "#/slt/stand", done: () => !!k?.stages.ek.sltOk },
    { title: "Zweitkorrektur: anonymisierte Mappe korrigieren", text: "Als Daniel Reuter (BTS) die Kursmappe öffnen und „Mappe 01“ korrigieren: Kopfzeile und Deckblatt sind ausgeblendet, der Name geschwärzt. Die roten Zeichen der Erstkorrektur sind sichtbar, Punkte und Gutachten nicht; in dieser Prüfung setzt die Zweitkorrektur alle Korrekturzeichen erneut; ein Hinweis der Erstkorrektur wird angezeigt. Eigene Zeichen erscheinen grün.", as: as("lk", "d.reuter", "zk"), go: `#/korr/km/${kid}/zk`, done: () => !!k && PX.activeMappen(k).some((m) => m.corr.zk?.state === "fertig") },
    { title: "Zweitkorrektur abschließen", text: "Übrige Mappen (Demo-Abkürzung) und „Kursmappenabschluss bestätigen“.", as: as("lk", "d.reuter", "zk"), go: `#/korr/km/${kid}/zk`, done: () => !!k?.stages.zk.lkDone.includes("d.reuter") },
    { title: "BTS bestätigt – Abweichungen werden berechnet", text: "Als Ulrike Fender (BTS) unter „Korrekturstand“ den Abschluss der Zweitkorrektur bestätigen. Das System berechnet die Abweichungen und löst die Endbeurteilung aus (> 3 NP).", as: as("slt", "u.fender"), go: "#/slt/stand", done: () => !!k?.stages.zk.sltOk },
    { title: "Demo-Zeit auf Beginn der Endbeurteilung stellen", text: "Die Endbeurteilung ist erst ab dem festgelegten Termin möglich. Oben rechts „Demo-Zeit“ → „Beginn Endbeurteilung“.", as: as("lk", "h.saalfeld", "eb"), go: `#/korr/km/${kid}/eb`, done: () => PX.S.now >= (ex()?.ebStart || "9") },
    { title: "Endbeurteilung der Pflichtmappe", text: "Als Dr. Henrike Saalfeld (ESG): Die Pflichtmappe ist hervorgehoben (Abweichung > 3 NP). Rechts unter „Vorkorrekturen“ sehen Sie Raster und Berichte von EK und ZK. Bewerten und abschließen.", as: as("lk", "h.saalfeld", "eb"), go: `#/korr/km/${kid}/eb`, done: () => !!k && k.stages.zk.sltOk && PX.activeMappen(k).filter((m) => m.ebRequired).every((m) => m.corr.eb?.state === "fertig") },
    { title: "Kursmappenabschluss bestätigen (EB)", text: "„Kursmappenabschluss bestätigen“.", as: as("lk", "h.saalfeld", "eb"), go: `#/korr/km/${kid}/eb`, done: () => !!k?.stages.eb.lkDone.includes("h.saalfeld") },
    { title: "ESG bestätigt – Endnoten stehen fest", text: "Als Bernd Kolb (ESG) „Abschluss bestätigen“. Die Endnote ergibt sich aus der Endbeurteilung bzw. dem aufgerundeten Durchschnitt von EK und ZK; die Kursmappe wird archiviert.", as: as("slt", "b.kolb"), go: "#/slt/stand", done: () => !!k?.stages.eb.sltOk },
  ]; };
  const K7 = () => [
    { title: "Ergebnisse einsehen", text: "Als Markus Haldenwang „Ergebnisse“ öffnen: EK, ZK, Abweichung, EB und Endnote je Prüfling; nicht teilnehmende Prüflinge mit Nachtermin.", as: SL, go: "#/slt/ergebnisse", done: () => visited("#/slt/ergebnisse") },
    { title: "Ergebnisse für ASV exportieren", text: "„Ergebnisse für ASV exportieren“ – die CSV-Datei wird heruntergeladen; der Import in ASV erfolgt außerhalb von PASCA.", as: SL, go: "#/slt/ergebnisse", done: () => PX.S.kms.filter((k) => k.school === "afs" && k.exam === ex()?.id).every((k) => k.exported) },
    { title: "Einsichtnahme: PDF erzeugen", text: "Noah Becker möchte Einsicht nehmen: „PDF erzeugen“. Die Druckansicht enthält alle Korrekturzeichen und Bewertungen – aber keine privaten Notizen.", as: SL, go: "#/slt/ergebnisse", done: () => PX.S.einsicht.some((e) => e.mappe === M("afs-0413")?.id) },
    { title: "Schulaufsicht: Lesezugriff im Archiv", text: "Als Karin Oberle (RP) unter „Einsicht & Archiv“ die archivierten Kursmappen ansehen (z. B. bei Widerspruch).", as: RP, go: "#/rp/archiv", done: () => visited("#/rp/archiv") },
  ];
  const K8 = () => [
    { title: "Schulbericht abrufen", text: "Als Karin Oberle (RP) „Berichte“ öffnen, Schule „Ahornfeld-Schule“ wählen: Ergebnisse je Teilaufgabe im Vergleich zum Landesdurchschnitt und Notenverteilung.", as: RP, go: "#/berichte", done: () => visited("#/berichte") },
    { title: "Analysebericht und aggregierter Bericht", text: "Berichtsart „Analysebericht“ (Abweichungsstatistik EK/ZK, EB-Quote) und „Aggregierter Bericht“ (je Schule) ansehen, dann „Erledigt“.", manual: "k8ana", as: RP, go: "#/berichte" },
    { title: "Bericht exportieren", text: "„PDF (Druck)“ oder „CSV“ – der Export wird protokolliert.", as: RP, go: "#/berichte", done: () => audit("Bericht exportiert (PDF)") || audit("Bericht exportiert (CSV)") },
    { title: "Kultusministerium: anonymisierte Auswertung", text: "Als Sabine Lorenz (KM) die Berichte öffnen: Schulen erscheinen anonymisiert. Optional „Rohdaten exportieren“ (gesonderte Rechte).", as: as("km", "s.lorenz"), go: "#/berichte", done: () => visited("#/berichte") && PX.role() === "km" || audit("Rohdaten exportiert") },
    { title: "Audit-Log filtern und exportieren", text: "Als Tobias Wendling (Service Center) das Audit-Log öffnen, z. B. nach „Korrekturgruppen freigegeben“ filtern und exportieren.", as: as("svc", "t.wendling"), go: "#/svc/audit", done: () => audit("Audit-Log exportiert") },
    { title: "Aufbewahrungsfrist: Löschlauf", text: "Demo-Zeit auf „Aufbewahrungsende Abitur 2022“ (01.08.2027) stellen, dann unter „Archiv“ den Löschlauf ausführen.", as: as("svc", "t.wendling"), go: "#/svc/archiv", done: () => PX.S.deletedArchives.length > 0 },
  ];
  const SB = (rid) => PX.S.sandbox?.mappen?.filter((m) => m.km === "sbx-km-" + rid) || [];
  const K9 = () => [
    { title: "Raster aus Excel importieren", text: "Als Dr. Ruth Albrecht (IBBW) „Bewertungsraster“ → „Aus Excel importieren“. „Beispiel Aufgabenstruktur VBWL laden“ (oder eigene Datei bzw. Vorlage): Aufgabenbaum und Wahlgruppen werden erzeugt und geprüft. „Als Entwurf anlegen“.", as: IB, go: "#/ibbw/raster-import", done: () => audit("Bewertungsraster aus Excel importiert") },
    { title: "Mathematik: Raster und Testrechnung", text: "Das Mathematik-Raster zeigt verschachtelte Wahlregeln (zwei Wahlaufgaben oder Problemlöseaufgabe), Lehrerwahl in Teil B, halbe BE und Zusatz-BE. Rechts in der Testrechnung Werte eintragen, dann „Erledigt“.", manual: "k9ma", as: IB, go: "#/ibbw/raster/rs-ma-27" },
    { title: "Testkorrektur Mathematik: Lehrerwahl", text: "„Im Korrekturmodus testen“ → Arbeit 1 „EK“. Im Bereich Teil B die Lehrerwahl (je Sachgebiet eine Aufgabe) festlegen – sie gilt für alle Arbeiten der Kursmappe und ist für ZK und EB sichtbar.", as: IB, go: "#/korr/test/rs-ma-27", done: () => Object.keys(PX.S.sandbox?.kms?.find((k) => k.id === "sbx-km-rs-ma-27")?.lehrerwahl || {}).length > 0 },
    { title: "Latein: gewichtete Zeichen und Fehlerzahl", text: "Testkorrektur Latein → Arbeit 1 „EK“. Zeichen wie A (¼), S/F (½), K/V (1) setzen, „[ ]“ fragt die Anzahl ab. In der Bewertung „aus Zeichen“ übernimmt die Fehlerzahl; die Fehler-Noten-Skala ergibt die Note der Übersetzung.", as: IB, go: "#/korr/test/rs-la-27", done: () => SB("rs-la-27").some((m) => (m.corr.ek?.marks || []).some((k) => /^z-la-/.test(k.sign || ""))) },
    { title: "Unterstreichen mit Zeichenvorschlag", text: "Werkzeug „Unterstreichen“ (oder „Stift“) wählen und unter einer Textzeile entlangziehen – das Fenster schlägt ein Korrekturzeichen vor. „Ohne Zeichen“ ist auch möglich; das Zeichen lässt sich später zuordnen.", as: IB, go: "#/korr/test/rs-la-27", done: () => Object.values(PX.S.sandbox?.mappen || []).some((m) => Object.values(m.corr || {}).some((c) => (c.marks || []).some((k) => k.kind === "line" || k.kind === "pen"))) },
    { title: "Deutsch: Gutachten aus Bausteinen", text: "Testkorrektur Deutsch → Reiter „Gutachten“: landesweit einheitliche Textbausteine anklicken, um das Gutachten zusammenzusetzen, und bei Bedarf ergänzen.", as: IB, go: "#/korr/test/rs-de-27", done: () => SB("rs-de-27").some((m) => (m.corr.ek?.bausteine || []).length > 0) },
    { title: "Englisch: Teilnoten, Kappung und Kommunikationsprüfung", text: "Testkorrektur Englisch: Hörverstehen (Prozent), Teil II mit Inhalt 40 % / Sprache 60 % und Kappung bei „ungenügend“. Die Notenpunkte der Kommunikationsprüfung trägt die Erstkorrektur ein – auch nach Abschluss möglich.", as: IB, go: "#/korr/test/rs-en-27", done: () => SB("rs-en-27").some((m) => m.extern?.kp !== undefined && m.extern?.kp !== "") },
    { title: "Zweitkorrektur markiert Abweichungen", text: "In der Latein-Prüfung ist eingestellt, dass die Zweitkorrektur nur Abweichungen markiert. Zuerst „EK automatisch“, dann eine Arbeit als „ZK“ öffnen: EK-Zeichen sind sichtbar; mit „Auswählen“ ein EK-Zeichen anklicken, um es als abweichend zu kennzeichnen.", optional: true, as: IB, go: "#/korr/test/rs-la-27", done: () => SB("rs-la-27").some((m) => (m.corr.zk?.disputed || []).length || (m.corr.zk?.marks || []).some((k) => k.dev)) },
  ];
  PX.GUIDES = [
    { id: "k1", title: "Prüfung anlegen", icon: "pencil-ruler", group: "Vorbereitung", pre: "basis", roles: "IBBW", steps: K1, desc: "Prüfungsfach, Korrekturzeichensatz, Bewertungsraster duplizieren und freigeben, Prüfung mit Terminen und Korrekturzeiträumen anlegen." },
    { id: "k2", title: "Prüfungsdaten importieren", icon: "upload", group: "Vorbereitung", pre: "pruefung", roles: "Schulleitungsteam", steps: K2, desc: "ASV-Import, ungeklärte Datensätze, Kursmappen prüfen und freigeben." },
    { id: "k3", title: "Korrekturgruppen bilden und zuteilen", icon: "network", group: "Vorbereitung", pre: "import", roles: "RP · Schulleitungsteams", steps: K3, desc: "Pool, automatische Bildung nach den Kriterien, Eingriff, Freigabe, Bestätigung durch die Schulen." },
    { id: "k4", title: "Prüfungstag vorbereiten", icon: "calendar-clock", group: "Durchführung", pre: "gruppen", roles: "Schulleitungsteam · IBBW", steps: K4, desc: "Nachteilsausgleich, Deckblätter, Erwartungshorizont, Nicht-Teilnahme und Nachtermin." },
    { id: "k5", title: "Einscannen und freigeben", icon: "scan", group: "Durchführung", pre: "pruefungstag", roles: "Scan-Operator", steps: K5, desc: "Upload oder systemseitiger Scan, Qualitätsprüfung, Barcode-Zuordnung, Drehen, Nachscan, Freigabe." },
    { id: "k6", title: "Prüfungskorrektur EK · ZK · EB", icon: "file-pen-line", group: "Korrektur", pre: "scan", roles: "Lehrkräfte · Schulleitungsteams", steps: K6, desc: "Erstkorrektur mit Schwärzung, anonyme Zweitkorrektur, Abweichungsregel, Endbeurteilung, Abschlüsse." },
    { id: "k7", title: "Ergebnisse, Einsicht, ASV-Export", icon: "file-check", group: "Abschluss", pre: "eb", roles: "Schulleitungsteam · RP", steps: K7, desc: "Endnoten, Export für ASV, Einsichtnahme als PDF." },
    { id: "k9", title: "Bewertungsraster und Korrekturfunktionen", icon: "table", group: "Vorbereitung", pre: "basis", roles: "IBBW · Lehrkräfte", steps: K9, desc: "Excel-Import, Aufgabenbaum, Schüler- und Lehrerwahl, gewichtete Zeichen, Unterstreichen mit Vorschlag, Gutachten-Bausteine, Teilnoten und Kommunikationsprüfung – in der Testkorrektur." },
    { id: "k8", title: "Berichte und Archivierung", icon: "chart-column", group: "Abschluss", pre: "ergebnis", roles: "RP · KM · Service Center", steps: K8, desc: "Parametrisierte Berichte, Export, Audit-Log, Löschung nach Aufbewahrungsfrist." },
  ];
  const ALL = () => PX.GUIDES.filter((g) => g.id !== "gesamt" && g.id !== "k9").flatMap((g) => g.steps().map((s) => ({ ...s, title: s.title, chapter: g.title })));
  PX.GUIDES.push({ id: "gesamt", title: "Gesamtprozess (alle Klickstrecken)", icon: "workflow", group: "Gesamt", pre: "basis", roles: "alle Rollen", steps: ALL, desc: "Der komplette Prozess am Stück – von der Prüfungsanlage bis zur Löschung nach Ablauf der Aufbewahrungsfrist." });
  const byId = (id) => PX.GUIDES.find((g) => g.id === id);

  // ---------- Steuerung ----------
  function stepState(g, s) {
    const steps = g.steps();
    const done = steps.map((x) => (x.manual ? !!s.manual?.[x.manual] : (() => { try { return !!x.done(); } catch { return false; } })()));
    const cur = steps.findIndex((x, i) => !done[i] && !x.optional);
    return { steps, done, cur, finished: cur === -1 };
  }
  PX.guide = {
    status() { const s = st(); if (!s) return null; const g = byId(s.id); if (!g) return null; const x = stepState(g, s); return { g, ...x, paused: s.paused }; },
    start(id) {
      const g = byId(id); if (!g) return;
      const stage = PX.stages.list.find((x) => x.id === g.pre);
      PX.modal({ title: "Klickstrecke: " + g.title, icon: g.icon, size: "wide",
        body: `<p>${esc(g.desc)}</p><p class="small"><b>Rollen:</b> ${esc(g.roles)} · <b>${g.steps().length} Schritte</b></p>
          <div class="choice"><label class="radio card pad"><input type="radio" name="pre" value="reset" checked><div><b>Mit passendem Ausgangszustand starten (empfohlen)</b><div class="small muted">Die Demo wird zurückgesetzt und bis „${esc(stage.label)}“ vorgespult.</div></div></label>
          <label class="radio card pad"><input type="radio" name="pre" value="keep"><div><b>Mit dem aktuellen Datenstand fortfahren</b><div class="small muted">Sinnvoll, wenn Sie die vorherige Klickstrecke gerade abgeschlossen haben.</div></div></label></div>`,
        foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-go>${icon("play")} Klickstrecke starten</button>`,
        onMount: (m, close) => { $("[data-go]", m).onclick = () => { const mode = $("input[name=pre]:checked", m).value; close(); if (mode === "reset") { PX.reset(g.pre); PX.toast("Ausgangszustand hergestellt", stage.label, "info"); } save({ id, paused: false, manual: {}, visited: [], open: true }); PX.save(); this.goStep(); }; } });
    },
    goStep(i) {
      const x = this.status(); if (!x) return; const idx = i ?? x.cur; const s = x.steps[idx]; if (!s) return;
      if (s.as) PX.session.set({ role: s.as.role, person: s.as.person, stage: s.as.stage || "" });
      const go = typeof s.go === "function" ? s.go() : s.go;
      if (go) PX.go(go); else PX.render();
    },
    stop(silent) { save(null); this.paint(); if (!silent) PX.toast("Klickstrecke beendet", "", "info"); },
    visit(h) { const s = st(); if (!s) return; s.visited = s.visited || []; if (!s.visited.includes(h)) { s.visited.push(h); save(s); } },
    check() { this.paint(); },
    paint() {
      let el = document.getElementById("guidepanel"); const x = this.status();
      if (!x || x.paused || !location.hash || location.hash === "#/" || /#\/druck\//.test(location.hash)) { if (el) el.remove(); document.body.classList.remove("guide-on", "guide-open"); return; }
      if (!el) { el = document.createElement("aside"); el.id = "guidepanel"; el.className = "guidepanel"; document.body.appendChild(el); }
      const s = st(); const open = s.open !== false; const n = x.steps.length; const d = x.done.filter(Boolean).length;
      const cur = x.cur; const me = PX.session.get();
      el.className = "guidepanel" + (open ? "" : " closed");
      el.innerHTML = `<button class="gp-head" data-gtoggle>${icon("route")}<span class="grow"><b>${esc(x.g.title)}</b><small>${x.finished ? "abgeschlossen" : `Schritt ${cur + 1} von ${n}`}</small></span>${icon(open ? "chevron-down" : "chevron-up")}</button><div class="gp-bar"><i style="width:${(d / n) * 100}%"></i></div>
        ${open ? `<ol class="gp-steps">${x.steps.map((st2, i) => { const isCur = i === cur; const pend = !x.done[i] && st2.optional && (cur === -1 || i < cur); if (!s.list && !isCur && !pend) return ""; const asOther = st2.as && (st2.as.person !== me.person || st2.as.role !== me.role); return `<li class="${x.done[i] ? "done" : isCur ? "cur" : ""}"><div class="gp-row"><span class="gp-ico">${x.done[i] ? icon("check") : i + 1}</span><div class="grow">${st2.chapter && (i === 0 || x.steps[i - 1].chapter !== st2.chapter) ? `<div class="xs muted bold">${esc(st2.chapter)}</div>` : ""}<b>${esc(st2.title)}</b>${st2.optional ? ` <span class="xs muted">(optional)</span>` : ""}</div></div>
          ${isCur || (!x.done[i] && st2.optional && (cur === -1 || i < cur)) ? `${isCur ? `<p>${esc(st2.text)}</p>` : ""}<div class="row wrap">${st2.as || st2.go ? `<button class="btn xs ${isCur ? "primary" : ""}" data-gstep="${i}">${icon(asOther ? "log-in" : "arrow-right")} ${asOther ? "Als " + esc(PX.name(st2.as.person)) + " hingehen" : "Hingehen"}</button>` : ""}${st2.action ? `<button class="btn xs primary" data-gact="${i}">${icon("zap")} ${esc(st2.action.label)}</button>` : ""}${st2.manual ? `<button class="btn xs" data-gman="${st2.manual}">${icon("check")} Erledigt</button>` : ""}</div>` : ""}</li>`; }).join("")}</ol>
        <div class="gp-foot row between">${x.finished ? `<span class="small">${icon("circle-check")} Alle Schritte erledigt.</span>` : `<button class="btn xs ghost" data-glist>${icon("list")} ${s.list ? "Nur aktuellen Schritt" : "Alle " + n + " Schritte"}</button>`}<span class="row"><button class="btn xs ghost" data-gpause>${icon("pause")} Pausieren</button><button class="btn xs ghost" data-gstop>${icon("x")} Beenden</button></span></div>` : ""}`;
      document.body.classList.add("guide-on"); document.body.classList.toggle("guide-open", open);
      const gl = el.querySelector("[data-glist]"); if (gl) gl.onclick = () => { const s2 = st(); s2.list = !s2.list; save(s2); this.paint(); };
      el.querySelector("[data-gtoggle]").onclick = () => { const s2 = st(); s2.open = !open; save(s2); this.paint(); };
      $$("[data-gstep]", el).forEach((b) => (b.onclick = () => this.goStep(+b.dataset.gstep)));
      $$("[data-gact]", el).forEach((b) => (b.onclick = () => { const s2 = x.steps[+b.dataset.gact]; if (s2.as) PX.session.set({ role: s2.as.role, person: s2.as.person, stage: s2.as.stage || "" }); s2.action.run(); PX.save(); PX.toast("Simulation ausgeführt", esc(s2.title), "info"); PX.render(true); }));
      $$("[data-gman]", el).forEach((b) => (b.onclick = () => { const s2 = st(); s2.manual = s2.manual || {}; s2.manual[b.dataset.gman] = true; save(s2); this.paint(); }));
      const ps = el.querySelector("[data-gpause]"); if (ps) ps.onclick = () => { const s2 = st(); s2.paused = true; save(s2); this.paint(); PX.toast("Klickstrecke pausiert", "Fortsetzen über die Startseite.", "info"); };
      const sp = el.querySelector("[data-gstop]"); if (sp) sp.onclick = () => this.stop();
      if (x.finished && !s.cheered) { s.cheered = true; save(s); PX.toast("Klickstrecke abgeschlossen", esc(x.g.title)); }
    },
    picker() {
      const x = this.status();
      const groups = [...new Set(PX.GUIDES.map((g) => g.group))];
      return `<div class="guidepick"><div class="gp-intro"><b>${icon("route")} Klickstrecken</b><span class="small muted">Für jeden Workflow eine geführte Klickstrecke: meldet die passende Person an, führt Schritt für Schritt und erkennt den Fortschritt aus den Daten. Jede Strecke kann mit passendem Ausgangszustand einzeln gestartet werden.</span></div>
        ${x ? `<div class="gresume"><div class="grow"><b>${esc(x.g.title)}</b> ${x.paused ? "pausiert" : "läuft"} · ${x.done.filter(Boolean).length} von ${x.steps.length} Schritten</div><button class="btn primary sm" data-gresume>${icon("arrow-right")} Fortsetzen</button><button class="btn ghost sm" data-goff>${icon("x")} Beenden</button></div>` : ""}
        <div class="gcards">${groups.map((gr) => PX.GUIDES.filter((g) => g.group === gr).map((g, i) => `<button class="gcard ${x && x.g.id === g.id ? "on" : ""}" data-gstart="${g.id}"><span class="gnum">${g.id === "gesamt" ? icon("workflow") : g.id.slice(1)}</span><span><b>${esc(g.title)}</b><small>${esc(g.roles)} · ${g.steps().length} Schritte</small></span></button>`).join("")).join("")}</div></div>`;
    },
    bindPicker(root) {
      $$("[data-gstart]", root).forEach((b) => (b.onclick = () => this.start(b.dataset.gstart)));
      const r = $("[data-gresume]", root); if (r) r.onclick = () => { const s = st(); s.paused = false; s.open = true; save(s); this.goStep(); };
      const o = $("[data-goff]", root); if (o) o.onclick = () => { this.stop(); PX.render(); };
    },
  };
  window.addEventListener("hashchange", () => PX.guide.visit(location.hash.split("?")[0]));
})();
