/* PASCA Klickdummy – Darstellung eingescannter Prüfungsseiten (simuliert, „handschriftlich“) */
(function () {
  "use strict";
  const PX = window.PX; const { esc } = PX;

  const LINES = ["Im Marktgleichgewicht stimmen angebotene und nachgefragte Menge überein.", "Gleichgewichtspreis: 4,00 €, Gleichgewichtsmenge 1.200 Stück.", "Liegt der Preis darüber, entsteht ein Angebotsüberhang;", "die Anbieter senken den Preis, bis der Markt geräumt ist.",
    "Ein Höchstpreis unter dem Gleichgewichtspreis führt zu Knappheit.", "Folgen: Schwarzmärkte, Rationierung, Warteschlangen.", "Deckungsbeitrag je Stück = 42 € − 24 € = 18 €", "Gewinnschwelle = 120.000 € : 18 € = 6.667 Stück",
    "Eigenfinanzierung: keine Zinsen, aber Mitspracherechte.", "Darlehen: feste Laufzeit, Zins 4,2 % p. a., Sicherheiten nötig.", "Leasing schont die Liquidität, ist aber insgesamt teurer.", "Ich empfehle das Annuitätendarlehen, weil die Belastung gleich bleibt.",
    "Produktpolitik: nachhaltige Verpackung, neue Variante.", "Preispolitik: Penetrationsstrategie im ersten Jahr.", "Marktanteil = 12 Mio. € : 80 Mio. € = 15 %", "Frühindikatoren: ifo-Geschäftsklima, Auftragseingänge.",
    "Das BIP wuchs nur um 0,3 %, die Arbeitslosigkeit sinkt kaum.", "Die EZB hat den Leitzins auf 3,5 % angehoben,", "um die Inflation auf das Ziel von 2 % zu senken.", "Höhere Zinsen verteuern Kredite → Investitionen sinken."];

  // Schülerwahl, wie sie sich aus der Arbeit ergibt (deterministisch je Prüfling – Grundlage für Seiten und Demo-Korrektur)
  PX.paperChoice = function (m, r) {
    const w = {};
    (r.groups || []).filter((g) => g.chooser !== "lehrer").forEach((g) => { const opts = [...g.options].sort((a, b) => PX.hash(m.student + g.id + a) - PX.hash(m.student + g.id + b)); w[g.id] = opts.slice(0, g.pick).sort((a, b) => g.options.indexOf(a) - g.options.indexOf(b)); });
    return w;
  };
  PX.paperLehrerwahl = function (km, r) { const w = {}; (r.groups || []).filter((g) => g.chooser === "lehrer").forEach((g) => { w[g.id] = g.options.slice(0, g.pick).map((_, i) => g.options[(Math.floor(PX.hash(km.id + g.id) * g.options.length) + i) % g.options.length]); }); return w; };

  // Aufteilung der bearbeiteten Teilaufgaben auf die Blätter (deterministisch) – Grundlage für Seitenbild und Sprungmarken
  PX.TEXT_TOP = 12.7;
  PX.paperLayout = function (m) {
    const km = PX.km(m.km); const ex = PX.exam(km.exam); const r = PX.raster(ex); if (!r) return [];
    const leaves = PX.activeLeaves(r, { wahl: PX.paperChoice(m, r) }, { lehrerwahl: km.lehrerwahl || PX.paperLehrerwahl(km, r) }).filter((l) => PX.partOf(r, l)?.scoring !== "extern");
    const nSheets = Math.max(1, PX.pagesOf(m).filter((p) => p.kind === "blatt").length || 3);
    const per = Math.max(1, Math.ceil(leaves.length / nSheets)); const out = [];
    for (let n = 1; n <= nSheets; n++) {
      let line = n === 1 && m.student === "afs-0412" ? 1 : 0;
      leaves.slice((n - 1) * per, n * per).forEach((t, ti) => { const k = 1 + Math.floor(PX.hash(m.id + t.id) * 3); const sk = n === 1 && ti === 0; out.push({ id: t.id, no: t.no, n, y: Math.round((PX.TEXT_TOP + 2.6 + 5.2 * line) * 10) / 10, k, st: Math.floor(PX.hash(t.id) * LINES.length), sketch: sk }); line += 1 + k + (sk ? 6 : 0); });
    }
    return out;
  };
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
        inner = `${head}<div class="sh-body konzept"><div class="stamp">Konzeptpapier · ${page.konzeptBy === "manuell" ? "manuell gekennzeichnet" : "Farbmarkierung erkannt"}</div><p class="hw strike">Gleichgewicht → p* ≈ 4 €?</p><p class="hw">Notizen zu 3.2: Zins ↑ → Kredit teurer → I ↓</p>${sketch()}</div>`;
      } else {
        const L = PX.paperLayout(m).filter((x) => x.n === page.n);
        const lines = L.flatMap((t) => [`<p class="hw task">${esc(t.no)}</p>`, ...Array.from({ length: t.k }, (_, i) => `<p class="hw">${esc(LINES[(t.st + i) % LINES.length])}</p>`), t.sketch ? sketch() : ""]);
        const nameLine = page.n === 1 && m.student === "afs-0412" ? `<p class="hw pers">(${esc(m.first)} ${esc(m.last)}, ${esc(km.name)})</p>` : "";
        inner = `${head}<div class="sh-body">${nameLine}${lines.join("") || `<p class="hw">…</p>`}</div>`;
      }
    }
    const ownMarks = (opts.marks || []).filter((k) => k.page === page.id);
    const ov = PX.marksOverlay(ownMarks, opts);
    const anc = (opts.anchors || []).filter((a) => a.page === page.id).map((a) => `<span class="ancflag" style="top:${((a.y ?? 4) / PX.PH) * 100}%" title="Sprungmarke ${esc(a.no)}">${esc(a.no)}</span>`).join("");
    const red = (opts.red || []).filter((x) => x.page === page.id).map((x) => `<span class="redact" data-rd="${x.id}" style="left:${x.x}%;top:${x.y}%;width:${x.w}%;height:${x.h}%"></span>`).join("");
    const notes = (opts.notes || []).filter((x) => x.page === page.id).map((x) => `<span class="pnote" data-nt="${x.id}" style="left:${x.x}%;top:${x.y}%" title="Notiz (nur für Sie sichtbar): ${esc(x.text)}">✎</span>`).join("");
    const q = opts.dpi && opts.dpi < 300 ? "lowdpi" : "";
    return `<div class="sheet ${opts.small ? "small" : ""} ${q} ${page.kind === "konzept" ? "konzeptpapier" : ""}" data-pid="${page.id}"><div class="sheet-rot r${rot}"><div class="sheet-in ${page.kind === "deckblatt" ? "" : "page"}">${inner}</div></div><div class="overlay">${page.kind !== "deckblatt" ? `<div class="kmargin l"></div><div class="kmargin r"></div>` : ""}${red}<svg class="mksvg" viewBox="0 0 100 ${PX.PH}">${ov.svg}</svg>${ov.signs}${anc}${notes}</div></div>`;
  };
  // ---------- Randkorrektur (wie Mockup Prüfungsplattform): Koordinaten in Breiten-Einheiten (0–100, Höhe 0–141,4) ----------
  PX.PH = 141.4; PX.LH = 5.2; PX.LINE0 = 12.7;
  PX.MARGIN = { ek: { side: "right", x0: 86.6, w: 12.6, vx: 85.6 }, zk: { side: "left", x0: 7.6, w: 6.8, vx: 14.4 }, eb: { side: "left", x0: 0.5, w: 6.7, vx: 7.2 } };
  PX.snapLine = (y) => PX.LINE0 + Math.max(1, Math.round((y - PX.LINE0) / PX.LH + 0.35)) * PX.LH - 0.5;
  const waves = (x1, x2, y) => { let d = `M${x1},${y}`; let up = true; for (let x = x1; x < x2; x += 1.2) { d += ` Q${x + 0.6},${y + (up ? -0.55 : 0.55)} ${Math.min(x + 1.2, x2)},${y}`; up = !up; } return d; };
  PX.marksOverlay = function (marks, opts = {}) {
    let svg = ""; const groups = { ek: [], zk: [], eb: [] };
    marks.forEach((k) => {
      const sel = opts.sel === k.id; const cls = `ann ${k.stage} ${sel ? "sel" : ""}`;
      if (k.kind === "hline") {
        const y = k.y; const d = k.style === "wavy" ? waves(k.x1, k.x2, y) : `M${k.x1},${y} L${k.x2},${y}` + (k.style === "double" ? ` M${k.x1},${y + 0.7} L${k.x2},${y + 0.7}` : "");
        svg += `<g class="${cls}" data-mk="${k.id}"><path class="ln" d="${d}"/><path class="hit" d="M${k.x1},${y + 0.3} L${k.x2},${y + 0.3}"/></g>`;
      } else if (k.kind === "vline") {
        const x = PX.MARGIN[k.stage].vx;
        svg += `<g class="${cls}" data-mk="${k.id}"><path class="ln v" d="M${x},${k.y1} L${x},${k.y2}"/><path class="hit" d="M${x},${k.y1} L${x},${k.y2}"/></g>`;
      } else if (k.kind === "sign" || k.kind === "text") groups[k.stage]?.push(k);
    });
    // Korrekturzeichen derselben Zeile kommasepariert am Rand (EK rechts, ZK links, EB links außen)
    let signs = "";
    Object.entries(groups).forEach(([st, list]) => {
      const M = PX.MARGIN[st]; const rows = [];
      list.forEach((k) => { const key = Math.round(k.ay / PX.LH); const g = rows.find((r) => r.key === key); if (g) g.items.push(k); else rows.push({ key, y: k.ay, items: [k] }); });
      let bottom = -99;
      rows.sort((a, b) => a.y - b.y).forEach((g) => {
        g.items.sort((a, b) => a.ax - b.ax);
        const top = Math.max(g.y - 1.9, bottom + 0.2);
        const len = g.items.reduce((n, x) => n + (x.kind === "text" ? 2 : String(x.code).length) + 2, -2);
        bottom = top + Math.max(1, Math.ceil((len * 1.55) / M.w)) * 3.1;
        signs += `<div class="ksgroup ${M.side} ${st}" style="left:${M.x0}%;top:${(top / PX.PH) * 100}%;width:${M.w}%">${g.items.map((k, i) => `<span data-mk="${k.id}" data-ax="${k.ax}" data-ay="${k.ay}" class="${opts.sel === k.id ? "sel" : ""}" title="${esc(k.kind === "text" ? k.text : k.meaning || "")}">${k.kind === "text" ? `»<em>${esc(k.text)}</em>` : esc(k.code)}${k.count ? `<sub>${PX.fmtNP(k.count)}</sub>` : ""}</span>${i < g.items.length - 1 ? `<i class="kscomma">, </i>` : ""}`).join("")}</div>`;
      });
    });
    return { svg, signs };
  };
  PX.pagesOf = (m) => { if (m.pages) return m.pages; const s = m.scan ? PX.byId("scans", m.scan) : null; return s ? s.pages : []; };
})();
