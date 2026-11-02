/* PASCA Klickdummy – Darstellung eingescannter Prüfungsseiten (simuliert, „handschriftlich“) */
(function () {
  "use strict";
  const PX = window.PX; const { esc } = PX;

  const TEXT = {
    t11: ["Im Marktgleichgewicht stimmen angebotene und nachgefragte Menge überein.", "Gleichgewichtspreis: 4,00 €, Gleichgewichtsmenge 1.200 Stück.", "Liegt der Preis darüber, entsteht ein Angebotsüberhang;", "die Anbieter senken den Preis, bis der Markt geräumt ist.", "Die Konsumentenrente ist die Fläche oberhalb des Preises."],
    t12: ["Ein Höchstpreis unter dem Gleichgewichtspreis führt", "zu einem Nachfrageüberhang (Knappheit).", "Folgen: Schwarzmärkte, Rationierung, Warteschlangen.", "Ziel ist Schutz der Verbraucher, aber das Angebot sinkt.", "Beurteilung: kurzfristig sozial, langfristig ineffizient."],
    t13: ["Deckungsbeitrag je Stück = 42 € − 24 € = 18 €", "Gewinnschwelle = Fixkosten : DB = 120.000 € : 18 €", "= 6.667 Stück (aufgerundet)", "Bei 8.000 Stück: Gewinn = 8.000 · 18 € − 120.000 €", "= 24.000 €  → Zusatzauftrag annehmen, da DB > 0"],
    t2a1: ["Eigenfinanzierung: keine Zinsen, aber Mitspracherechte.", "Darlehen: feste Laufzeit, Zins 4,2 % p. a., Sicherheiten nötig.", "Leasing schont die Liquidität, ist aber insgesamt teurer.", "Vergleich der Gesamtkosten über 5 Jahre (siehe Tabelle)."],
    t2a2: ["Ich empfehle das Annuitätendarlehen, weil die Belastung", "gleichbleibt und die Planung erleichtert wird.", "Die Bonität des Unternehmens ist gut (EK-Quote 38 %)."],
    t2b1: ["Produktpolitik: nachhaltige Verpackung, neue Variante.", "Preispolitik: Penetrationsstrategie im ersten Jahr.", "Kommunikation: Social-Media-Kampagne, Influencer.", "Distribution: Online-Shop zusätzlich zum Einzelhandel."],
    t2b2: ["Marktanteil = 12 Mio. € : 80 Mio. € = 15 %", "Der Umsatz stieg um 8 %, der Markt nur um 3 %.", "Relativer Marktanteil > 1 → Marktführer im Segment."],
    t31: ["Frühindikatoren: ifo-Geschäftsklima, Auftragseingänge.", "Das BIP wuchs nur um 0,3 %, die Arbeitslosigkeit sinkt kaum.", "Die Wirtschaft befindet sich im Abschwung (Rezession?)."],
    t32: ["Die EZB hat den Leitzins auf 3,5 % angehoben,", "um die Inflation von 6 % auf das Ziel von 2 % zu senken.", "Höhere Zinsen verteuern Kredite → Investitionen sinken.", "Gefahr: Die Konjunktur wird zusätzlich gebremst.", "Fazit: Preisniveaustabilität hat Vorrang (Art. 127 AEUV)."],
  };
  const ORDER = ["t11", "t12", "t13", "t2a1", "t2a2", "t31", "t32"];

  // Barcode (dekorativ) aus einer Zeichenkette
  PX.barcode = (s, w = 220, h = 46) => {
    let x = 0; const bars = [];
    for (let i = 0; i < 64 && x < w; i++) { const v = PX.hash(s + i); const bw = 1 + Math.floor(v * 3); if (i % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${bw}" height="${h}"/>`); x += bw + 1; }
    return `<svg class="barcode" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${bars.join("")}</svg>`;
  };
  PX.codeOf = (m) => { const km = PX.km(m.km); const ex = PX.exam(km.exam); return `P${String(ex.year).slice(2)}-${PX.subj(ex.subject).short}-${ex.type}|${km.course}|${m.nr}`; };

  function sketch() {
    return `<svg class="sketch" viewBox="0 0 220 150"><path d="M20 10 V135 H210" fill="none" stroke="#1b2a6b" stroke-width="2"/><path d="M30 30 Q110 70 200 125" fill="none" stroke="#1b2a6b" stroke-width="2"/><path d="M30 125 Q110 80 200 25" fill="none" stroke="#1b2a6b" stroke-width="2"/><text x="190" y="22" class="hw">A</text><text x="190" y="120" class="hw">N</text><path d="M20 76 H112 V135" stroke="#1b2a6b" stroke-dasharray="4 4" fill="none"/><text x="2" y="80" class="hw">p*</text><text x="104" y="148" class="hw">x*</text></svg>`;
  }

  // Seite rendern. opts: { anon, marks:[{...,stage}], red:[], notes:[], sel, stage, small }
  PX.pageHtml = function (m, page, opts = {}) {
    const km = PX.km(m.km); const ex = PX.exam(km.exam); const s = PX.subj(ex.subject);
    const rot = page.rot || 0;
    let inner = "";
    if (page.kind === "deckblatt") {
      inner = `<div class="cover"><div class="cv-h"><b>Schriftliche Abiturprüfung ${ex.year}</b><span>Berufliches Gymnasium · Baden-Württemberg</span></div>
        <div class="cv-bc">${PX.barcode(PX.codeOf(m))}<div class="xs">${esc(PX.codeOf(m))}</div></div>
        <table class="cv-t"><tr><td>Prüfungsfach</td><td>${esc(s.name)}</td></tr><tr><td>Termin</td><td>${PX.TYPE[ex.type]}, ${PX.fmtD(ex.date)}</td></tr><tr><td>Schule</td><td>${esc(PX.orgName(km.school))}</td></tr><tr><td>Kurs-ID</td><td>${esc(km.course)}</td></tr><tr><td>Prüflings-ID</td><td>${esc(m.nr)}</td></tr><tr><td>Name</td><td class="hwv">${esc(m.first)} ${esc(m.last)}</td></tr><tr><td>Abgegebene Blätter</td><td class="hwv">${Math.max(1, 3 + Math.floor(PX.hash(m.id) * 3) + 1)}</td></tr></table>
        <div class="cv-f">Unterschrift Aufsicht: <span class="hwv">Haldenwang</span></div></div>`;
    } else {
      const head = opts.anon ? `<div class="sh-head anon">Kopfzeile ausgeblendet · ${esc(PX.pseudo(m))} · Blatt ${page.n}</div>` : `<div class="sh-head"><span>Abitur ${ex.year} · ${esc(s.short)}</span><span>Name: <b class="hwv">${esc(m.first)} ${esc(m.last)}</b></span><span>Nr. ${esc(m.nr)}</span><span>Blatt ${page.n}</span></div>`;
      if (page.kind === "konzept") {
        inner = `${head}<div class="sh-body konzept"><div class="stamp">Konzeptblatt</div><p class="hw strike">Gleichgewicht → p* ≈ 4 €?</p><p class="hw">Notizen zu 3.2: Zins ↑ → Kredit teurer → I ↓</p>${sketch()}</div>`;
      } else {
        const wahl = PX.hash(m.student + "w") < 0.5 ? "2a" : "2b";
        const order = ORDER.map((t) => (t.startsWith("t2a") && wahl === "2b" ? t.replace("t2a", "t2b") : t));
        const per = Math.max(1, Math.ceil(order.length / Math.max(1, 3 + Math.floor(PX.hash(m.id) * 3))));
        const tasks = order.slice((page.n - 1) * per, page.n * per);
        const r = PX.raster(ex);
        const lines = tasks.flatMap((t) => { const task = r?.tasks.find((x) => x.id === t); return [`<p class="hw task">${esc(task ? task.no : t)}</p>`, ...(TEXT[t] || []).slice(0, 2 + Math.floor(PX.hash(m.id + t) * 4)).map((l) => `<p class="hw">${esc(l)}</p>`), t === "t11" ? sketch() : ""]; });
        const nameLine = page.n === 1 && m.student === "afs-0412" ? `<p class="hw pers">(${esc(m.first)} ${esc(m.last)}, ${esc(km.name)})</p>` : "";
        inner = `${head}<div class="sh-body">${nameLine}${lines.join("") || `<p class="hw">…</p>`}</div>`;
      }
    }
    const marks = (opts.marks || []).filter((k) => k.page === page.id).map((k) => `<span class="mk ${k.stage} ${opts.sel === k.id ? "sel" : ""}" data-mk="${k.id}" style="left:${k.x}%;top:${k.y}%" title="${esc(k.text || k.meaning || "")}">${esc(k.code)}${k.text ? `<em>${esc(k.text)}</em>` : ""}</span>`).join("");
    const red = (opts.red || []).filter((x) => x.page === page.id).map((x) => `<span class="redact" data-rd="${x.id}" style="left:${x.x}%;top:${x.y}%;width:${x.w}%;height:${x.h}%"></span>`).join("");
    const notes = (opts.notes || []).filter((x) => x.page === page.id).map((x) => `<span class="pnote" data-nt="${x.id}" style="left:${x.x}%;top:${x.y}%" title="Notiz (nur für Sie sichtbar): ${esc(x.text)}">✎</span>`).join("");
    const q = opts.dpi && opts.dpi < 300 ? "lowdpi" : "";
    return `<div class="sheet ${opts.small ? "small" : ""} ${q}" data-pid="${page.id}"><div class="sheet-rot r${rot}"><div class="sheet-in">${inner}</div></div><div class="overlay">${red}${marks}${notes}</div></div>`;
  };
  PX.pagesOf = (m) => { const s = m.scan ? PX.byId("scans", m.scan) : null; return s ? s.pages : []; };
})();
