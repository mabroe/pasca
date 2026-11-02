# PASCA – Klickdummy „Digitale Korrektur von Abiturprüfungen“

Interaktiver Klickdummy zum Lastenheft PASCA (Stand 23.10.2026). Designsystem und Bedienprinzip
(Rollenwahl, Rollenkarten, Klickstrecken mit Leitfaden) sind vom Exam-Klickdummy übernommen (Landesstyle).

> Nur für Demonstrationszwecke. Alle Personen, Schulen und Prüflinge sind fiktiv.

## Start

- **Lokal:** `index.html` per Doppelklick im Browser öffnen (Chrome/Edge/Firefox). Kein Server, keine Installation.
- **GitHub Pages:** Repository anlegen, pushen, *Settings › Pages › Source: GitHub Actions* – der Workflow
  `.github/workflows/pages.yml` veröffentlicht die Seite.

Die Daten liegen im `localStorage` des Browsers. „Demo zurücksetzen“ (Startseite oder Benutzermenü) stellt den Ausgangszustand her.

## Szenario

Abitur 2027, Prüfungsfach Volks- und Betriebswirtschaftslehre (Wirtschaftsgymnasium), Regierungsbezirk Karlsruhe.
Hauptfall: Kurs **WG13a** der Ahornfeld-Schule Mannheim (AFS). Weitere Schulen: Birkental-Schule Pforzheim,
Kastanien-Schule Karlsruhe, Eichenhain-Schule Mosbach, Freie Waldorfschule Hohenwart (Ausschlussliste),
Lindenweg-Schule Freiburg (RP-Pool).

**Demo-Zeit:** Oben rechts wird das simulierte Datum gesetzt (Prüfungstag, Fristwarnung, Beginn Endbeurteilung,
Ablauf der Aufbewahrungsfrist). Zeitabhängige Regeln greifen danach.

## Rollen (Rollenkarten)

| Rolle | Demo-Person | Kernaufgaben |
|---|---|---|
| Prüfungserstellung (IBBW) | Dr. Ruth Albrecht | Prüfungsfächer, Korrekturzeichen, Richtlinien, Bewertungsraster, Regeln, Prüfung anlegen, Erwartungshorizont |
| Service Center Schule (IBBW) | Tobias Wendling | Audit-Log, Archiv, Löschlauf |
| Kultusministerium | Sabine Lorenz | Anonymisierte, aggregierte Berichte, Rohdaten |
| Regierungspräsidium | Karin Oberle | RP-Pool, Korrekturgruppen bilden/anpassen/freigeben, Korrekturstand, Berichte, Einsicht |
| Schulleitungsteam | Markus Haldenwang (AFS) u. a. | ASV/CSV-Import, Kursmappen, Prüfungstag, Korrektor:innen bestätigen, Abschlüsse, ASV-Export, Einsicht |
| Scan-Operator | Petra Sommer (AFS) | Upload/systemseitiger Scan, Qualitätsprüfung, Zuordnung, Drehen, Nachscan, Freigabe |
| Erstkorrektur | Jana Kröger (AFS) | Korrektur, Raster, Schwärzen, Notizen, Abschluss |
| Zweitkorrektur | Daniel Reuter (BTS) | anonymisierte Korrektur ohne EK-Punkte |
| Endbeurteilung | Dr. Henrike Saalfeld (ESG) | Pflichtmappen > 3 NP, Einsicht in EK/ZK |

Druckbare Rollenkarten: Startseite › „Alle Rollenkarten drucken“.

## Klickstrecken

1. Prüfung anlegen · 2. Prüfungsdaten importieren · 3. Korrekturgruppen bilden und zuteilen · 4. Prüfungstag vorbereiten ·
5. Einscannen und freigeben · 6. Prüfungskorrektur EK · ZK · EB · 7. Ergebnisse, Einsicht, ASV-Export ·
8. Berichte und Archivierung · Gesamtprozess.

Jede Klickstrecke kann mit passendem Ausgangszustand gestartet werden (Szenario-Stufen in `js/stages.js`).
Der Fortschritt wird aus den Daten erkannt.

## Aufbau

| Datei | Inhalt |
|---|---|
| `js/core.js` | Zustand, UI-Helfer, Router |
| `js/data.js` | Demodaten, ASV-Datenbestand |
| `js/ops.js` | Fachlogik: Notenschlüssel, Korrekturgruppen-Algorithmus (50 km, Ausschlussliste, Belastung EK+ZK, EB-Kapazität), Abweichungsregel, Archiv |
| `js/stages.js` | Szenario-Stufen zum Vorspulen |
| `js/pages.js` | Simulierte Scanseiten (Deckblatt mit Barcode, Handschrift) |
| `js/views-*.js` | Ansichten je Rolle |
| `js/guide.js` | Klickstrecken |
| `css/base.css` | Designsystem aus dem Exam-Klickdummy |
| `css/pasca.css` | PASCA-Ergänzungen |

## Vereinfachungen gegenüber dem Lastenheft

- Anmeldung über IDAM/2FA wird durch die Rollenwahl ersetzt.
- Scans, PDFs und Erwartungshorizont sind simuliert; „PDF“ = Druckansicht des Browsers.
- „Demo-Abkürzung“ korrigiert übrige Mappen automatisch, damit Klickstrecken kurz bleiben.
- Nachscan-Anforderung der Erstkorrektur ist (wie im Lastenheft) nicht systemgestützt.

## Neu in Version 1.0 (02.11.2026)

- **Korrekturkalender** (IBBW → Korrekturkalender): globale Korrekturzeiträume je Abiturjahr, Schulform (BG/AG) und Terminart. Prüfungen übernehmen sie bei der Anlage und bleiben verknüpft; einzelne Prüfungen können abweichend festgelegt werden.
- **Prüfungsanlage**: Auswahl der Korrekturzeichen je Prüfung und je Prüfungsteil.
- **Bewertungsraster v2**: Prüfungsteile mit eigener Bewertungsart (BE, Notenpunkte, Prozent, Fehlerzahl, nicht korrekturrelevant), Aufgabenbaum beliebiger Tiefe, Wahlregeln „k aus n“ (Schüler- oder Lehrerwahl, verschachtelt), Kombination und Rundung je Fach, Kappung, Zusatz-BE, halbe BE, Gutachten mit Gliederung und landesweiten Textbausteinen, Formblatt-PDF. Editor mit Prüfung und Testrechnung.
- **Excel-Import** der Aufgabenstruktur (Format der übergebenen Datei) inkl. Vorlage und Beispiel.
- **Testkorrektur**: jedes Raster im echten Korrekturmodus ausprobieren (Bewertungsraster → Test).
- **Korrekturmodus**: Unterstreichen und Stift mit Zeichenvorschlag, gewichtete Zeichen und Zeichen mit Anzahl (Fehlerzahl aus Zeichen), Prüfungsteil-Auswahl, „nicht bearbeitet“, Lehrerwahl je Kursmappe, Hinweis der EK an die ZK, Gutachten aus Bausteinen (für die ZK nicht sichtbar), Formblatt-Upload, Kommunikationsprüfung als Notenpunkte (auch nach Abschluss durch die Schulleitung).
- **Endbeurteilung AG**: zusätzlich Stichprobe von 2 Prüfungen je Kurs.
- **Konzeptpapier**: Erkennung über die Farbmarkierung, beim Scannen umkennzeichenbar.
- Neue Klickstrecke 9 „Bewertungsraster und Korrekturfunktionen“; Beispielraster für VBWL, Deutsch, Mathematik, Englisch, GMT, Latein und Bildende Kunst.

## Neu in Version 1.1 (02.11.2026)

- **Randkorrektur wie im Mockup Prüfungsplattform**: Korrekturzeichen stehen am Rand, ohne Rahmen, die Schülerschrift bleibt sichtbar – EK rechts rot, ZK links grün, EB links außen braun; mehrere Zeichen einer Zeile kommagetrennt. Klick auf ein Randzeichen zeigt die markierte Stelle.
- **Unterstreichungen** einfach, doppelt, gekringelt (automatisch gerade gezogen, an der Zeile ausgerichtet) und **vertikaler Randstrich**; Radierer, Tastenkürzel (S, Z, U, V, P, E, Entf).
- **Stift (Tablet)**: Gesten für Linien, handschriftliche Korrekturzeichen werden erkannt und an den Rand gesetzt; nur die zugelassenen Zeichen der Prüfung, bei Unsicherheit Rückfrage, sonst erneut schreiben.
- **Sprungmarken** je Teilaufgabe: entstehen automatisch beim Eintragen der Punkte (Seite und Zeile), per Lesezeichen im Bewertungsbereich setzen/springen, Auswahlliste über dem Dokument.
- **Zusatz-BE** für besonders gute Lösungen nur nach Freischaltung im Raster mit Angabe der BE; erweiterte **Plausibilitätsprüfungen** (z. B. Notenschlüssel 80 BE bei 120 erreichbaren BE) im Raster und bei der Prüfungsanlage.
- **Prüfungstermine** mit Beginn und Dauer (Ende wird berechnet); **Erwartungshorizont** bei der Anlage verschlüsselt hinterlegt, automatische Entschlüsselung mit Prüfungsbeginn.
- **Deckblätter** vorab drucken; **Teilnahme** erst ab Prüfungsbeginn erfassbar.
- **Korrekturgruppen**: Das RP ordnet Kurse (ungeteilt) Schulen zu – nach Kursen und Teilnehmenden je Schule; die Schulleitungen fügen die Kurse ihren Fachlehrkräften hinzu. ZK/EB arbeiten pseudonymisiert ohne Herkunftsschule.
- Bewertungsraster sind landesweit einheitlich; Testkorrektur nur für das IBBW.
