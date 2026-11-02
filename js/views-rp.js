/* PASCA Klickdummy – Rolle Regierungspräsidium (Schulaufsicht) */
(function () {
  "use strict";
  const PX = window.PX; const { esc, icon, $, $$ } = PX; const O = () => PX.ops;
  const need = ["rp"];
  const rp = () => PX.me()?.org || "rpk";
  const RS = () => PX.S.rp[rp()];
  const schools = () => PX.schools().filter((s) => s.rp === rp());
  const exam = () => PX.mainExam();
  const kmsRP = (ex) => PX.S.kms.filter((k) => schools().some((s) => s.id === k.school) && (!ex || k.exam === ex.id));

  // ---------- Übersicht ----------
  PX.route(/^rp$/, () => ({ title: "Übersicht", shell: "staff", need, render: () => {
    const ex = exam(); const org = PX.org(rp());
    if (!ex) return PX.pagehead("Übersicht", esc(org.name)) + PX.needExam();
    const kms = kmsRP(ex); const st = RS();
    const imp = schools().map((s) => ({ s, ks: kms.filter((k) => k.school === s.id) }));
    const ph = {}; kms.forEach((k) => { const p = PX.phase(k); ph[p.label] = (ph[p.label] || 0) + 1; });
    const ebReq = PX.S.mappen.filter((m) => kms.some((k) => k.id === m.km) && m.ebRequired).length;
    const reports = PX.S.groups.filter((g) => g.exam === ex.id && (g.zk.unavailable || g.eb.unavailable));
    const todo = [];
    if (!st.pool.released) todo.push(["users-round", "RP-weiten Pool prüfen und freigeben (optional)", "#/rp/pool"]);
    if (kms.length && kms.every((k) => k.status === "freigegeben") && !st.built) todo.push(["network", "Korrekturgruppen automatisch bilden", "#/rp/gruppen"]);
    if (st.built && !st.released) todo.push(["badge-check", "Korrekturgruppen prüfen und freigeben", "#/rp/gruppen"]);
    reports.forEach((g) => todo.push(["circle-alert", `${PX.orgShort(g.zk.unavailable ? g.zk.school : g.eb.school)} meldet: ${g.zk.unavailable ? "ZK" : "EB"} für ${PX.kmLabel(g.km)} nicht besetzbar`, "#/rp/gruppen"]));
    return `${PX.pagehead("Übersicht", `${esc(org.name)} · ${esc(PX.examLabel(ex))}`)}
      <div class="statgrid"><div class="stat"><div class="v">${schools().length}</div><div class="small muted">Schulen mit BG</div></div><div class="stat"><div class="v">${kms.length}</div><div class="small muted">Kursmappen</div></div><div class="stat"><div class="v">${PX.sum(kms.map((k) => PX.activeMappen(k).length))}</div><div class="small muted">Prüfungsarbeiten</div></div><div class="stat"><div class="v">${ebReq}</div><div class="small muted">Endbeurteilungen erforderlich (> 3 NP)</div></div></div>
      <div class="grid2 mt"><div class="card pad"><h3>${icon("list-checks")} Aufgaben</h3>${todo.length ? `<ul class="todo">${todo.map(([ic, t, h]) => `<li><a href="${h}">${icon(ic)} ${esc(t)} ${icon("chevron-right")}</a></li>`).join("")}</ul>` : `<p class="small muted">Keine offenen Aufgaben.</p>`}</div>
      <div class="card pad"><h3>${icon("gauge")} Phasen</h3>${Object.keys(ph).length ? Object.entries(ph).map(([l, n]) => `<div class="row between small"><span>${esc(l)}</span><b>${n}</b></div>`).join("") : `<p class="small muted">Noch keine Kursmappen.</p>`}</div></div>
      <h2 class="mt-l">Datenstand der Schulen</h2><div class="tablewrap"><table class="tbl"><thead><tr><th>Schule</th><th>Ort</th><th>Träger</th><th>Import</th><th>Kursmappen freigegeben</th><th>Prüflinge</th></tr></thead><tbody>
      ${imp.map(({ s, ks }) => `<tr><td><b>${esc(s.name)}</b>${s.exclude ? " " + PX.badge("Ausschlussliste ZK/EB", "red") : ""}</td><td>${esc(s.city)}</td><td class="small">${esc(s.traeger)}</td><td>${PX.S.imports[s.id + "|" + ex.id] ? PX.badge(PX.S.imports[s.id + "|" + ex.id].source, "cyan") : PX.badge("ausstehend", "gray")}</td><td>${ks.length ? `${ks.filter((k) => k.status === "freigegeben").length}/${ks.length}` : "–"}</td><td>${PX.sum(ks.map((k) => PX.activeMappen(k).length)) || "–"}</td></tr>`).join("")}</tbody></table></div>`;
  } }));

  // ---------- Pool ----------
  let pq = "";
  PX.route(/^rp\/pool$/, () => ({ title: "RP-Pool", shell: "staff", need, render: () => {
    const p = RS().pool; const list = p.entries.filter((e) => !pq || `${PX.name(e.pid)} ${PX.orgName(PX.byId("persons", e.pid).org)} ${PX.subj(e.subject)?.name}`.toLowerCase().includes(pq.toLowerCase()));
    return `${PX.pagehead("RP-weiter fächerspezifischer Pool", "Ergänzende Datenbasis für seltene oder nicht ausreichend abgedeckte Fächer", `${PX.badge(p.released ? "freigegeben – für Gruppenbildung nutzbar" : "nicht freigegeben", p.released ? "green" : "yellowb")}<button class="btn" id="addp">${icon("user-round-plus")} Aus IDAM hinzufügen</button>${p.released ? `<button class="btn" id="lockp">${icon("lock")} Pool sperren</button>` : `<button class="btn primary" id="relp">${icon("badge-check")} Pool freigeben</button>`}`)}
      <div class="filterbar"><div class="search"><input class="input" id="pq" placeholder="Lehrkraft, Schule, Fach" value="${esc(pq)}">${icon("search")}</div></div>
      <div class="tablewrap"><table class="tbl"><thead><tr><th>Lehrkraft</th><th>Schule</th><th>Regierungsbezirk</th><th>Prüfungsfach</th><th>Schulform</th><th>Status</th><th></th></tr></thead><tbody>
      ${list.map((e) => { const per = PX.byId("persons", e.pid); const o = PX.org(per.org); return `<tr class="${e.locked ? "dim" : ""}"><td><b>${esc(PX.name(per))}</b><div class="xs muted">${esc(per.fn || "")}</div></td><td>${esc(o.name)}, ${esc(o.city)}</td><td>${esc(PX.orgShort(o.rp))}</td><td>${esc(PX.subj(e.subject)?.name)}</td><td class="small">${esc(o.traeger)}</td><td>${e.locked ? PX.badge("gesperrt", "red") : PX.badge("aktiv", "green")}</td><td class="nowrap"><button class="btn xs" data-lock="${e.id}">${e.locked ? "Entsperren" : "Sperren"}</button> <button class="iconbtn" data-rm="${e.id}" aria-label="Entfernen">${icon("trash-2")}</button></td></tr>`; }).join("") || `<tr><td colspan="7" class="muted">Keine Einträge</td></tr>`}</tbody></table></div>
      <p class="xs muted mt-s">Alle Personen- und Schuldaten stammen aus dem IDAM; PASCA speichert nur die Fachzuordnung und den Pool-Status. Änderungen werden erst mit erneuter Freigabe des Pools für die Gruppenbildung wirksam.</p>`;
  }, mount: (r) => {
    const q = $("#pq", r); q.oninput = PX.debounce(() => { pq = q.value; PX.rerender(); const i = $("#pq"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250);
    const rel = $("#relp", r); if (rel) rel.onclick = async () => { if (await PX.confirm("RP-weiten Pool freigeben?", "Der gesamte Pool wird freigegeben; die Korrekturgruppenbildung kann danach auf ihn zugreifen.", "Freigeben")) { O().poolRelease(rp()); PX.commit(); PX.toast("Pool freigegeben", ""); } };
    const lk = $("#lockp", r); if (lk) lk.onclick = () => { RS().pool.released = false; PX.audit("RP-weiten Pool gesperrt", PX.orgName(rp())); PX.commit(); };
    $$("[data-lock]", r).forEach((b) => (b.onclick = () => { O().poolLock(rp(), b.dataset.lock); PX.commit(); }));
    $$("[data-rm]", r).forEach((b) => (b.onclick = async () => { if (await PX.confirm("Eintrag entfernen?", "Bestehende Korrekturgruppen bleiben unverändert.", "Entfernen", true)) { O().poolRemove(rp(), b.dataset.rm); PX.commit(); } }));
    $("#addp", r).onclick = () => {
      const cand = PX.S.persons.filter((p) => p.roles.includes("lk") && (p.subjects || []).length);
      PX.modal({ title: "Lehrkraft aus dem IDAM hinzufügen", icon: "user-round-plus", size: "wide", body: `<div class="search"><input class="input" id="iq" placeholder="Name, Schule oder Fach suchen">${icon("search")}</div><div class="tablewrap mt-s" style="max-height:340px"><table class="tbl compact"><thead><tr><th>Lehrkraft</th><th>Schule</th><th>RP</th><th>Fach</th><th></th></tr></thead><tbody id="ib">${cand.flatMap((p) => p.subjects.map((s) => `<tr data-row="${esc(PX.name(p) + " " + PX.orgName(p.org) + " " + PX.subj(s)?.name).toLowerCase()}"><td>${esc(PX.name(p))}</td><td class="small">${esc(PX.orgName(p.org))}</td><td>${esc(PX.orgShort(PX.org(p.org).rp))}</td><td>${esc(PX.subj(s)?.name)}</td><td><button class="btn xs" data-add="${p.id}|${s}" ${RS().pool.entries.some((e) => e.pid === p.id && e.subject === s) ? "disabled" : ""}>Hinzufügen</button></td></tr>`)).join("")}</tbody></table></div>`,
        foot: `<button class="btn primary" data-close>Fertig</button>`,
        onMount: (m) => { $("#iq", m).oninput = (e) => $$("[data-row]", m).forEach((tr) => (tr.style.display = tr.dataset.row.includes(e.target.value.toLowerCase()) ? "" : "none")); $$("[data-add]", m).forEach((b) => (b.onclick = () => { const [pid, s] = b.dataset.add.split("|"); O().poolAdd(rp(), pid, s); b.disabled = true; b.textContent = "hinzugefügt"; PX.commit(); })); } });
    };
  } }));

  // ---------- Korrekturgruppen ----------
  PX.route(/^rp\/gruppen$/, () => ({ title: "Korrekturgruppen", shell: "staff", need, render: () => {
    const ex = exam(); if (!ex) return PX.needExam();
    const st = RS(); const kms = kmsRP(ex); const rel = kms.filter((k) => k.status === "freigegeben");
    const gs = PX.S.groups.filter((g) => g.exam === ex.id);
    // Belastung je Schule: eigene EK-Arbeiten gegenüber zugewiesenen ZK-Arbeiten (Kurse ungeteilt)
    const loads = {}; gs.forEach((g) => { const k = PX.km(g.km); const n = PX.activeMappen(k).length; const L = (s) => (loads[s] = loads[s] || { ek: 0, zk: 0, eb: 0, kz: 0 }); L(g.ek.school).ek += n; if (g.zk.school) { L(g.zk.school).zk += n; L(g.zk.school).kz++; } if (g.eb.school) L(g.eb.school).eb++; });
    const maxL = Math.max(1, ...Object.values(loads).map((l) => Math.max(l.ek, l.zk)));
    return `${PX.pagehead("Korrekturgruppenbildung", `${esc(PX.examLabel(ex))} · ${esc(PX.orgName(rp()))}`, st.built ? `<button class="btn" id="rebuild" ${st.released ? "disabled" : ""}>${icon("refresh-cw")} Neu berechnen</button>${st.released ? PX.badge("freigegeben am " + PX.fmtD(st.releasedAt), "green") : `<button class="btn primary" id="relg">${icon("badge-check")} Korrekturgruppen freigeben</button>`}` : "")}
      <div class="card pad"><h3>${icon("list-checks")} Voraussetzungen</h3><div class="checklist">
        <div class="${rel.length === kms.length && kms.length ? "ok" : ""}">${icon(rel.length === kms.length && kms.length ? "circle-check" : "circle")} Kursmappen freigegeben: ${rel.length} von ${kms.length} (${schools().filter((s) => kms.some((k) => k.school === s.id && k.status === "freigegeben")).length} Schulen)</div>
        <div class="${st.pool.released ? "ok" : ""}">${icon(st.pool.released ? "circle-check" : "circle")} RP-weiter Pool ${st.pool.released ? "freigegeben" : "nicht freigegeben (optional – Berechnung dann nur mit Schuldaten)"}</div>
        <div class="ok">${icon("circle-check")} Ausschlussliste: ${schools().filter((s) => s.exclude).map((s) => esc(s.name)).join(", ") || "leer"}</div>
        <div class="ok">${icon("circle-check")} Grundlage: ${kms.length} Kurse mit ${PX.sum(kms.map((k) => PX.activeMappen(k).length))} Teilnehmenden aus ${schools().filter((s) => kms.some((k) => k.school === s.id)).length} Schulen</div>
        <div class="ok">${icon("circle-check")} Regeln: jeder Kurs ungeteilt an genau eine ZK- und eine EB-Schule · Entfernung ≥ 50 km · andere Schule · ZK-Belastung je Schule ≈ eigene EK-Belastung · EB nach gemeldeter Kapazität · Priorität Fach: ${esc(PX.subj(ex.subject).prio)}</div>
        <div class="ok">${icon("info")} Das RP ordnet Kurse <b>Schulen</b> zu; die Schulleitungen fügen die Kurse anschließend ihren Fachlehrkräften hinzu.</div></div>
        ${!st.built ? `<button class="btn primary mt" id="build" ${rel.length ? "" : "disabled"}>${icon("zap")} Korrekturgruppen automatisch bilden</button>` : ""}</div>
      ${st.built ? `<h2 class="mt-l">Gebildete Korrekturgruppen (${gs.length})</h2>
        <div class="tablewrap"><table class="tbl erp"><thead><tr><th>Kurs</th><th class="cE">Erstkorrektur</th><th class="cZ">Zweitkorrektur (Schule)</th><th class="cB">Endbeurteilung (Schule)</th><th>Lehrkräfte</th><th></th></tr></thead><tbody>
        ${gs.map((g) => { const k = PX.km(g.km); const n = PX.activeMappen(k).length; const conf = (s) => (g[s].confirmed ? icon("circle-check") : g[s].unavailable ? `<span style="color:var(--red)">${icon("circle-alert")}</span>` : icon("circle")); return `<tr><td><b>${esc(k.name)}</b><div class="xs muted">${esc(PX.orgName(k.school))} · ${n} Teilnehmende</div><div class="xs muted">Pseudonym: ${esc(PX.kmPseudo(k))}</div></td>
          <td class="small">${conf("ek")} ${esc(PX.orgShort(g.ek.school))}<br>${g.ek.teachers.map(PX.name).map(esc).join(", ")}</td>
          <td class="small">${conf("zk")} <b>${esc(PX.orgShort(g.zk.school))}</b> · ${PX.dist(g.zk.school, k.school)} km${g.zk.manual ? " " + PX.badge("manuell", "purple") : ""}${g.zk.pool ? " " + PX.badge("Pool", "purple") : ""}<br><span class="xs">${g.zk.teacher ? "Lehrkraft: " + esc(PX.name(g.zk.teacher)) : g.zk.suggest ? "Pool-Vorschlag: " + esc(PX.name(g.zk.suggest)) : "Lehrkraft: durch die Schulleitung"}</span><div class="xs muted why">${esc(g.why.zk)}</div>${g.zk.unavailable ? `<div class="xs" style="color:var(--red)">Schule meldet: ${esc(g.zk.unavailable)}</div>` : ""}</td>
          <td class="small">${conf("eb")} <b>${esc(PX.orgShort(g.eb.school))}</b><br><span class="xs">${g.eb.teacher ? "Lehrkraft: " + esc(PX.name(g.eb.teacher)) : "Lehrkraft: durch die Schulleitung"}</span><div class="xs muted why">${esc(g.why.eb)}</div>${g.eb.unavailable ? `<div class="xs" style="color:var(--red)">Schule meldet: ${esc(g.eb.unavailable)}</div>` : ""}</td>
          <td class="xs">${PX.groupComplete(g) ? PX.badge("alle zugeordnet", "green") : st.released ? "Zuordnung durch die Schulen ausstehend" : "–"}</td>
          <td class="nowrap"><button class="btn xs" data-edit="${g.id}">${icon("pencil")} ${st.released ? "Eingreifen" : "Bearbeiten"}</button>${g.log.length ? ` <button class="btn xs ghost" data-log="${g.id}">${icon("history")} ${g.log.length}</button>` : ""}</td></tr>`; }).join("")}</tbody></table></div>
        <h3 class="mt-l">Belastung je Schule (Arbeiten)</h3><div class="loadchart">${Object.entries(loads).sort((a, b) => a[0].localeCompare(b[0])).map(([sid, l]) => `<div class="lrow"><span class="small">${esc(PX.orgShort(sid))} <span class="muted xs">${l.kz} ZK-Kurse · ${l.eb} EB-Kurse</span></span><span class="lbar"><i class="ek" style="width:${(l.ek / maxL) * 50}%"></i><i class="zk" style="width:${(l.zk / maxL) * 50}%"></i></span><b class="small">${l.ek} / ${l.zk}</b></div>`).join("")}<div class="legend xs mt-s"><span class="sw ek"></span> eigene Erstkorrektur <span class="sw zk"></span> zugewiesene Zweitkorrektur (Ziel: ausgeglichen)</div></div>
        ${st.released ? `<div class="notice info mt">${icon("info")}<div class="small">Die Korrekturgruppen sind verbindlich. Die Schulleitungsteams fügen die zugewiesenen Kurse ihren Fachlehrkräften hinzu. Eingriffe des Regierungspräsidiums bleiben jederzeit möglich und werden manipulationssicher protokolliert.</div></div>` : ""}` : ""}`;
  }, mount: (r) => {
    const ex = exam(); if (!ex) return;
    const b = $("#build", r); if (b) b.onclick = () => { const close = PX.modal({ title: "Korrekturgruppen werden berechnet", icon: "network", body: `<div class="progress-steps">${["Freigegebene Kursmappen und ASV-Daten laden", "Ausschlussliste und Entfernungen (≥ 50 km) prüfen", "Kurse ungeteilt Schulen zuordnen (Ausgleich EK/ZK je Schule)", "EB-Schulen nach gemeldeter Kapazität zuordnen"].map((t) => `<div class="ok">${icon("circle-check")} ${t}</div>`).join("")}</div>` }); setTimeout(() => { close(); O().buildGroups(rp(), ex.id); PX.commit(); PX.toast("Korrekturgruppen gebildet", `${PX.S.groups.filter((g) => g.exam === ex.id).length} Kursmappen zugeordnet`); }, 900); };
    const rb = $("#rebuild", r); if (rb) rb.onclick = async () => { if (await PX.confirm("Neu berechnen?", "Manuelle Anpassungen gehen verloren.", "Neu berechnen", true)) { O().buildGroups(rp(), ex.id); PX.commit(); } };
    const rg = $("#relg", r); if (rg) rg.onclick = async () => { const gs = PX.S.groups.filter((g) => g.exam === ex.id); if (gs.some((g) => !g.zk.school || !g.eb.school)) return PX.toast("Freigabe nicht möglich", "Nicht jedem Kurs ist eine ZK- und EB-Schule zugeordnet.", "warn"); if (await PX.confirm("Korrekturgruppen freigeben?", `Alle ${gs.length} Korrekturgruppen dieses Prüfungsjahrgangs werden gemeinsam freigegeben und verbindlich. Die Schulen werden informiert und ordnen die Kurse ihren Lehrkräften zu.`, "Freigeben")) { O().releaseGroups(rp(), ex.id); PX.commit(); PX.toast("Korrekturgruppen freigegeben", "Benachrichtigung an die Schulleitungsteams versendet."); } };
    $$("[data-log]", r).forEach((x) => (x.onclick = () => { const g = PX.byId("groups", x.dataset.log); PX.modal({ title: "Änderungsprotokoll " + PX.kmLabel(g.km), icon: "history", body: g.log.map((l) => `<div class="noterow"><div><div class="small">${esc(l.text)}</div><div class="xs muted">${esc(l.at)} · ${esc(PX.name(l.who))}</div></div></div>`).join("") }); }));
    $$("[data-edit]", r).forEach((x) => (x.onclick = () => editDialog(PX.byId("groups", x.dataset.edit))));
  } }));
  function editDialog(g) {
    const k = PX.km(g.km); const ex = PX.exam(k.exam);
    const opts = (stage) => {
      const other = stage === "zk" ? [k.school] : [k.school, g.zk.school];
      return PX.schools().filter((s) => !other.includes(s.id)).map((s) => { const d = Math.min(...other.map((o) => PX.dist(s.id, o))); const warn = s.exclude ? "Ausschlussliste" : d < 50 ? `nur ${d} km` : ""; return `<option value="${s.id}" ${g[stage].school === s.id ? "selected" : ""}>${esc(s.name)} (${esc(PX.orgShort(s.rp))}, ${d} km)${warn ? " ⚠ " + warn : ""}</option>`; }).join("");
    };
    const pool = RS().pool.released ? RS().pool.entries.filter((e) => !e.locked && e.subject === ex.subject) : [];
    PX.modal({ title: "Korrekturgruppe bearbeiten · " + PX.kmLabel(k), icon: "network", size: "wide",
      body: `<p class="small">Das Regierungspräsidium ordnet den Kurs (${PX.activeMappen(k).length} Teilnehmende, ungeteilt) einer <b>Schule</b> zu; die Lehrkraft bestimmt deren Schulleitung.</p>
        <div class="grid2"><div class="field"><label class="lbl">Korrekturstufe</label><select class="select" id="es"><option value="zk">Zweitkorrektur</option><option value="eb">Endbeurteilung</option></select></div><div class="field"><label class="lbl">Schule</label><select class="select" id="esch">${opts("zk")}</select></div></div>
        ${pool.length ? `<div class="field"><label class="lbl">Ausnahmefall: Lehrkraft aus dem RP-weiten Pool vorschlagen (optional)</label><select class="select" id="epool"><option value="">– kein Vorschlag –</option>${pool.map((e) => `<option value="${e.pid}">${esc(PX.name(e.pid))} (${esc(PX.orgShort(PX.byId("persons", e.pid).org))})</option>`).join("")}</select></div>` : ""}
        <div class="field"><label class="lbl">Begründung *</label><input class="input" id="er" placeholder="z. B. Krankheit, Befangenheit, seltenes Fach"></div><div class="notice info">${icon("info")}<div class="small" id="eimpt"></div></div>`,
      foot: `<button class="btn" data-close>Abbrechen</button><button class="btn primary" data-ok>Änderung speichern</button>`,
      onMount: (m, close) => {
        const upd = () => { const st = $("#es", m).value; const s = $("#esch", m).value; const o = PX.org(s); const d = PX.dist(s, k.school); const ls = PX.S.groups.filter((x) => x.exam === g.exam && x[st].school === s); $("#eimpt", m).innerHTML = `Auswirkungen: ${PX.STAGE[st]} von ${esc(PX.orgShort(g[st].school))} → ${esc(PX.orgShort(s))}. Entfernung zur EK-Schule ${d} km${d < 50 ? " <b>(unter 50 km – nur im Ausnahmefall)</b>" : ""}${o.exclude ? " · <b>Schule steht auf der Ausschlussliste</b>" : ""}. Die Schule hat dann ${ls.length + 1} Kurse (${PX.sum(ls.map((x) => PX.activeMappen(PX.km(x.km)).length)) + PX.activeMappen(k).length} Arbeiten) in dieser Stufe. Die bisherige Zuordnung einer Lehrkraft entfällt; die neue Schule wird benachrichtigt.`; };
        $("#es", m).onchange = () => { $("#esch", m).innerHTML = opts($("#es", m).value); upd(); }; $("#esch", m).onchange = upd; upd();
        $("[data-ok]", m).onclick = () => { const st = $("#es", m).value, s = $("#esch", m).value, why = $("#er", m).value.trim(), pp = $("#epool", m)?.value || ""; if (!why) return PX.toast("Begründung fehlt", "", "warn"); if (PX.org(s).exclude) return PX.toast("Nicht zulässig", "Die Schule steht auf der Ausschlussliste.", "error"); O().editGroup(g.id, st, s, why, pp); if (RS().released) PX.notify(PX.sltOf(s).map((p) => p.id), `Das Regierungspräsidium hat Ihrer Schule die ${PX.STAGE[st]} von ${PX.kmPseudo(k)} zugewiesen. Bitte einer Lehrkraft zuordnen.`, "#/slt/korrektoren"); close(); PX.commit(); PX.toast("Korrekturgruppe geändert", "Änderung protokolliert"); };
      } });
  }

  // ---------- Korrekturstand ----------
  let rtab = "stand";
  PX.route(/^rp\/stand$/, () => ({ title: "Korrekturstand", shell: "staff", need, render: () => {
    const ex = exam(); if (!ex) return PX.needExam(); const kms = kmsRP(ex);
    const nta = PX.S.mappen.filter((m) => m.nta && kms.some((k) => k.id === m.km));
    const ebList = PX.S.mappen.filter((m) => m.ebRequired && kms.some((k) => k.id === m.km));
    return `${PX.pagehead("Korrekturstand im Bezirk", esc(PX.examLabel(ex)))}
      <div class="tabs small"><button class="${rtab === "stand" ? "active" : ""}" data-t="stand">Fortschritt</button><button class="${rtab === "eb" ? "active" : ""}" data-t="eb">Endbeurteilungen (${ebList.length})</button><button class="${rtab === "nta" ? "active" : ""}" data-t="nta">Nachteilsausgleiche (${nta.length})</button></div>
      ${rtab === "stand" ? `<div class="tablewrap"><table class="tbl"><thead><tr><th>Kursmappe</th><th>Phase</th><th>EK</th><th>ZK</th><th>EB</th><th style="min-width:260px">Verlauf</th></tr></thead><tbody>${kms.map((k) => { const p = PX.phase(k); const cell = (s) => { const rel = s === "eb" ? PX.activeMappen(k).filter((m) => m.ebRequired) : PX.activeMappen(k); const f = rel.filter((m) => m.corr[s]?.state === "fertig").length; return k.stages[s].sltOk ? PX.badge("✓", "green") : PX.stageOpen(k, s) ? `<span class="xs">${f}/${rel.length}</span>` : "–"; }; return `<tr><td><b>${esc(k.name)}</b> <span class="muted small">${esc(PX.orgShort(k.school))}</span></td><td>${PX.badge(p.label, p.kind)}</td><td>${cell("ek")}</td><td>${cell("zk")}</td><td>${cell("eb")}</td><td>${PX.phaseBar(k)}</td></tr>`; }).join("")}</tbody></table></div>`
      : rtab === "eb" ? (ebList.length ? `<div class="tablewrap"><table class="tbl"><thead><tr><th>Kursmappe</th><th>Mappe</th><th>EK</th><th>ZK</th><th>Abweichung</th><th>Endbeurteilung durch</th><th>Ergebnis</th></tr></thead><tbody>${ebList.map((m) => { const k = PX.km(m.km); const g = PX.groupOf(k); return `<tr><td>${esc(PX.kmLabel(k))}</td><td>${esc(PX.pseudo(m))}</td><td>${m.corr.ek?.np}</td><td>${m.corr.zk?.np}</td><td>${PX.badge(m.diff + " NP", "brown")}</td><td class="small">${esc(PX.name(g.eb.teacher))} (${esc(PX.orgShort(g.eb.school))})</td><td>${m.corr.eb?.state === "fertig" ? m.corr.eb.np + " NP" : "offen"}</td></tr>`; }).join("")}</tbody></table></div>` : PX.empty("Noch keine Endbeurteilungen erforderlich.", "scale"))
      : (nta.length ? `<div class="tablewrap"><table class="tbl"><thead><tr><th>Schule</th><th>Prüfling</th><th>Nachteilsausgleich</th><th>Kenntnisnahme RP</th></tr></thead><tbody>${nta.map((m) => `<tr><td>${esc(PX.orgShort(PX.km(m.km).school))}</td><td>${esc(m.last)}, ${esc(m.first)}</td><td>${esc(m.nta)}</td><td>${m.ntaOk ? PX.badge("zur Kenntnis genommen", "green") : `<button class="btn xs" data-ntaok="${m.id}">Zur Kenntnis nehmen</button>`}</td></tr>`).join("")}</tbody></table></div>` : PX.empty("Keine Nachteilsausgleiche erfasst.", "scale"))}`;
  }, mount: (r) => {
    $$("[data-t]", r).forEach((b) => (b.onclick = () => { rtab = b.dataset.t; PX.rerender(); }));
    $$("[data-ntaok]", r).forEach((b) => (b.onclick = () => { const m = PX.mappe(b.dataset.ntaok); m.ntaOk = true; PX.audit("Nachteilsausgleich zur Kenntnis genommen", `${m.first} ${m.last}`); PX.commit(); }));
  } }));

  // ---------- Einsicht & Archiv ----------
  PX.route(/^rp\/archiv$/, () => ({ title: "Einsicht & Archiv", shell: "staff", need, render: () => {
    const done = PX.S.kms.filter((k) => schools().some((s) => s.id === k.school) && k.finalAt);
    return `${PX.pagehead("Einsichtnahme und Archiv", "Lesezugriff auf korrigierte Prüfungsarbeiten (z. B. bei Unregelmäßigkeiten oder Widerspruch)")}
      ${done.length ? done.map((k) => `<div class="card pad mt"><div class="row between"><h3>${icon("archive")} ${esc(PX.kmLabel(k))}</h3><span class="small muted">archiviert ${PX.fmtD(k.finalAt)} · Löschung ${PX.fmtD(PX.S.archive.find((a) => a.km === k.id)?.deleteAt)}</span></div>
        <div class="tablewrap mt-s"><table class="tbl compact"><thead><tr><th>Prüfling</th><th>EK</th><th>ZK</th><th>EB</th><th>Endnote</th><th></th></tr></thead><tbody>${PX.activeMappen(k).map((m) => `<tr><td>${esc(m.last)}, ${esc(m.first)}</td><td>${m.corr.ek?.np ?? "–"}</td><td>${m.corr.zk?.np ?? "–"}</td><td>${m.corr.eb?.state === "fertig" ? m.corr.eb.np : "–"}</td><td><b>${m.final?.np ?? "–"}</b></td><td><button class="btn xs" data-ein="${m.id}">${icon("printer")} Einsicht (PDF)</button></td></tr>`).join("")}</tbody></table></div></div>`).join("") : PX.empty("Noch keine abgeschlossenen Kursmappen.", "archive")}`;
  }, mount: (r) => { $$("[data-ein]", r).forEach((b) => (b.onclick = () => { O().einsicht(b.dataset.ein); PX.save(); window.open(location.href.split("#")[0] + "#/druck/einsicht/" + b.dataset.ein, "_blank"); PX.commit(); })); } }));
})();
