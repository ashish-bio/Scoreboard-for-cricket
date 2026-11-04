/* Default scorecard, shown until a saved one exists. Placeholder names and numbers. */
var DEFAULT_DATA = {
  sample: true,
  college: "Government Polytechnic Kishanganj",
  date: "Match date to be added",
  venue: "College ground",
  overs: 10,
  manOfMatch: "Player 1 (Civil Strikers)",
  teams: [
    {
      name: "Civil Strikers",
      batting: [
        { n: "Player 1", r: 31, b: 18, f: 3, s: 1, out: "b Bowler 1" },
        { n: "Player 2", r: 22, b: 14, f: 2, s: 1, out: "c Fielder 3 b Bowler 2" },
        { n: "Player 3", r: 14, b: 9, f: 1, s: 0, out: "run out" },
        { n: "Player 4", r: 15, b: 8, f: 1, s: 1, out: "b Bowler 4" },
        { n: "Player 5", r: 5, b: 6, f: 0, s: 0, out: "lbw b Bowler 5" },
        { n: "Player 6", r: 3, b: 3, f: 0, s: 0, out: "" },
        { n: "Player 7", r: 1, b: 1, f: 0, s: 0, out: "" }
      ],
      extras: { wd: 3, nb: 1, b: 1, lb: 0 },
      overRuns: [7, 9, 12, 6, 11, 8, 13, 10, 9, 11],
      bowlers: [
        { n: "Player 12", o: 2, r: 17, w: 2 },
        { n: "Player 13", o: 2, r: 21, w: 1 },
        { n: "Player 14", o: 2, r: 19, w: 0 },
        { n: "Player 15", o: 2, r: 22, w: 1 },
        { n: "Player 16", o: 2, r: 16, w: 1 }
      ]
    },
    {
      name: "Mechanical Mavericks",
      batting: [
        { n: "Player 12", r: 28, b: 14, f: 3, s: 1, out: "c Fielder 2 b Bowler 1" },
        { n: "Player 13", r: 19, b: 11, f: 2, s: 0, out: "b Bowler 2" },
        { n: "Player 14", r: 12, b: 9, f: 1, s: 0, out: "lbw b Bowler 4" },
        { n: "Player 15", r: 9, b: 7, f: 1, s: 0, out: "b Bowler 4" },
        { n: "Player 16", r: 8, b: 6, f: 0, s: 1, out: "c Fielder 5 b Bowler 3" },
        { n: "Player 17", r: 4, b: 4, f: 0, s: 0, out: "run out" },
        { n: "Player 18", r: 3, b: 3, f: 0, s: 0, out: "b Bowler 1" },
        { n: "Player 19", r: 2, b: 2, f: 0, s: 0, out: "c Fielder 1 b Bowler 5" },
        { n: "Player 20", r: 0, b: 3, f: 0, s: 0, out: "" }
      ],
      extras: { wd: 4, nb: 1, b: 0, lb: 1 },
      overRuns: [6, 8, 10, 7, 11, 9, 14, 6, 10, 10],
      bowlers: [
        { n: "Player 1", o: 2, r: 19, w: 2 },
        { n: "Player 2", o: 2, r: 17, w: 2 },
        { n: "Player 3", o: 2, r: 20, w: 1 },
        { n: "Player 4", o: 2, r: 14, w: 2 },
        { n: "Player 5", o: 2, r: 20, w: 1 }
      ]
    }
  ]
};

(function () {
  var DATA = JSON.parse(JSON.stringify(DEFAULT_DATA));
  var canEdit = false, editing = false, edTab = "match", draft = null;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function sum(a, f) { return a.reduce(function (t, x) { return t + f(x); }, 0); }
  function num(v) { var n = parseFloat(v); return isFinite(n) && n > 0 ? n : 0; }
  function ob(o) { var w = Math.floor(o); return w * 6 + Math.round((o - w) * 10); }
  function extrasTotal(e) { return e.wd + e.nb + e.b + e.lb; }

  /* ---------- Display ---------- */
  function renderAll() {
    var T = DATA.teams.map(function (t) {
      var bat = sum(t.batting, function (p) { return p.r; });
      var legal = sum(t.batting, function (p) { return p.b; }) + t.extras.b + t.extras.lb;
      return { t: t, total: bat + extrasTotal(t.extras), wkts: t.batting.filter(function (p) { return p.out; }).length, ovs: Math.floor(legal / 6) + "." + (legal % 6) };
    });
    var A = T[0], B = T[1];
    $("title").textContent = A.t.name + " v " + B.t.name;
    $("sub").textContent = [DATA.college, DATA.date, DATA.venue, DATA.overs + " overs a side"].join(" · ");

    var sm = $("sample");
    if (DATA.sample) {
      sm.hidden = false;
      sm.textContent = canEdit ? "Sample figures. Tap Edit scorecard to enter the real match." : "Sample figures. Team names, players and scores are placeholders until the real scorecard is added.";
    } else { sm.hidden = true; }

    var res;
    if (A.total === 0 && B.total === 0) res = "Result to be added";
    else if (A.total > B.total) res = A.t.name + " won by " + (A.total - B.total) + " run" + (A.total - B.total === 1 ? "" : "s");
    else if (B.total > A.total) { var wl = Math.max(0, 10 - B.wkts); res = B.t.name + " won by " + wl + " wicket" + (wl === 1 ? "" : "s"); }
    else res = "Match tied";
    $("result").textContent = res;

    $("tiles").innerHTML = T.map(function (x) {
      return '<div class="tile"><div class="tn">' + esc(x.t.name) + '</div><div class="ts">' + x.total + '<span class="sl">/</span>' + x.wkts + '</div><div class="to">' + x.ovs + "<small>overs</small></div></div>";
    }).join("");

    var best = null, bw = null;
    T.forEach(function (x, i) {
      x.t.batting.forEach(function (p) { if (!best || p.r > best.p.r) best = { p: p, team: x.t.name }; });
      x.t.bowlers.forEach(function (p) { if (!bw || p.w > bw.p.w || (p.w === bw.p.w && p.r < bw.p.r)) bw = { p: p, team: T[1 - i].t.name }; });
    });
    var hl = "";
    if (best) hl += '<div><dt>Top scorer</dt><dd>' + esc(best.p.n) + " " + best.p.r + "<small>" + best.p.b + " balls · " + esc(best.team) + "</small></dd></div>";
    if (bw) hl += '<div><dt>Best bowler</dt><dd>' + esc(bw.p.n) + " " + bw.p.w + "/" + bw.p.r + "<small>" + esc(bw.p.o) + " overs · " + esc(bw.team) + "</small></dd></div>";
    if (DATA.manOfMatch) hl += '<div><dt>Man of the match</dt><dd>' + esc(DATA.manOfMatch) + "</dd></div>";
    $("hl").innerHTML = hl || '<p class="empty">Highlights appear once players are added.</p>';

    renderChart(T);

    function econ(p) { var b = ob(p.o); return b ? (p.r / (b / 6)).toFixed(1) : "0.0"; }
    function innings(i) {
      var x = T[i], opp = T[1 - i], e = x.t.extras;
      var rows = x.t.batting.map(function (p) {
        var sr = p.b ? ((p.r / p.b) * 100).toFixed(0) : "0";
        return "<tr><td>" + esc(p.n) + '<span class="how">' + esc(p.out || "not out") + '</span></td><td class="r">' + p.r + (p.out ? "" : "*") + "</td><td>" + p.b + "</td><td>" + p.f + "</td><td>" + p.s + "</td><td>" + sr + "</td></tr>";
      }).join("");
      var brow = x.t.bowlers.map(function (p) {
        return "<tr><td>" + esc(p.n) + "</td><td>" + esc(p.o) + "</td><td>" + p.r + '</td><td class="r">' + p.w + "</td><td>" + econ(p) + "</td></tr>";
      }).join("");
      return '<section class="panel"><h2>' + (i === 0 ? "1st" : "2nd") + " innings · " + esc(x.t.name) + " " + x.total + "/" + x.wkts + " (" + x.ovs + " ov)</h2>" +
        (rows ? '<div class="scroll"><table><thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead><tbody>' + rows + "</tbody></table></div>" : '<p class="empty">No batting added yet.</p>') +
        '<p class="extras">Extras <b>' + extrasTotal(e) + "</b> (wd " + e.wd + ", nb " + e.nb + ", b " + e.b + ", lb " + e.lb + ")</p>" +
        '<div class="bowl-title">Bowling · ' + esc(opp.t.name) + "</div>" +
        (brow ? '<div class="scroll"><table><thead><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Econ</th></tr></thead><tbody>' + brow + "</tbody></table></div>" : '<p class="empty">No bowling added yet.</p>') + "</section>";
    }
    $("innings").innerHTML = innings(0) + innings(1);
  }

  function renderChart(T) {
    var o0 = T[0].t.overRuns, o1 = T[1].t.overRuns;
    var panel = $("chartPanel");
    if (!o0.length || !o1.length) { panel.hidden = true; return; }
    panel.hidden = false;
    var cols = ["var(--team-a)", "var(--team-b)"];
    $("legend").innerHTML = T.map(function (x, i) { return '<span><span class="dot" style="background:' + cols[i] + '"></span>' + esc(x.t.name) + "</span>"; }).join("");
    var W = 640, H = 280, ml = 40, mr = 70, mt = 16, mb = 34;
    var n = Math.max(DATA.overs, o0.length, o1.length);
    var cum = [o0, o1].map(function (a) { var c = 0; return [0].concat(a.map(function (r) { c += r; return c; })); });
    var maxV = Math.max(cum[0][cum[0].length - 1], cum[1][cum[1].length - 1], 1);
    var yMax = Math.ceil((maxV + 1) / 20) * 20;
    function X(o) { return ml + (o / n) * (W - ml - mr); }
    function Y(v) { return mt + (1 - v / yMax) * (H - mt - mb); }
    var g = "", step = n > 20 ? 5 : 2;
    for (var v = 0; v <= yMax; v += 20) g += '<line class="grid" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text x="' + (ml - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + "</text>";
    for (var o = 0; o <= n; o += step) g += '<text x="' + X(o) + '" y="' + (H - 12) + '" text-anchor="middle">' + o + "</text>";
    g += '<text x="' + ((ml + W - mr) / 2) + '" y="' + H + '" text-anchor="middle">Overs</text>';
    var ly = cum.map(function (c) { return Y(c[c.length - 1]); });
    var close = Math.abs(ly[0] - ly[1]) < 16;
    cum.forEach(function (c, i) {
      var pts = c.map(function (v2, o2) { return X(o2) + "," + Y(v2); }).join(" ");
      var last = c.length - 1, ty = ly[i] + 4;
      if (close) ty += (ly[i] >= ly[1 - i] && (ly[i] !== ly[1 - i] || i === 1)) ? 8 : -8;
      g += '<polyline fill="none" stroke="' + cols[i] + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="' + pts + '"/>';
      g += '<circle cx="' + X(last) + '" cy="' + ly[i] + '" r="5" fill="' + cols[i] + '"/>';
      g += '<text class="lbl" x="' + (X(last) + 10) + '" y="' + ty + '" style="fill:' + cols[i] + '">' + c[last] + "</text>";
    });
    $("chartWrap").innerHTML = '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Cumulative runs by over for both teams">' + g + "</svg>";
  }

  /* ---------- Editor ---------- */
  function blankRow() { return { n: "", r: 0, b: 0, f: 0, s: 0, out: "" }; }
  function blankBowler() { return { n: "", o: 0, r: 0, w: 0 }; }
  function blankData() {
    function team(name) {
      var bat = [], bowl = [], i;
      for (i = 0; i < 11; i++) bat.push(blankRow());
      for (i = 0; i < 6; i++) bowl.push(blankBowler());
      return { name: name, batting: bat, extras: { wd: 0, nb: 0, b: 0, lb: 0 }, overRuns: [], bowlers: bowl };
    }
    return { sample: false, college: DATA.college, date: "", venue: "", overs: DATA.overs, manOfMatch: "", teams: [team("Team A"), team("Team B")] };
  }
  function val(id) { var el = $(id); return el ? el.value.trim() : ""; }

  function fld(label, id, value, type, extra) {
    return '<label class="f" for="' + id + '">' + label + '<input id="' + id + '" type="' + (type || "text") + '" value="' + esc(value) + '" ' + (extra || "") + "></label>";
  }
  function numCell(label, cls, v, blank, step) {
    return '<label class="f">' + label + '<input class="' + cls + '" type="number" min="0" ' + (step ? 'step="' + step + '" ' : "") + 'inputmode="decimal" value="' + (blank && !v ? "" : esc(v)) + '"></label>';
  }

  function renderEditor() {
    var ed = $("editor"), d = draft;
    var h = '<div class="editor-bar"><div class="seg" role="group" aria-label="Scorecard sections">' +
      '<button type="button" data-tab="match" aria-pressed="' + (edTab === "match") + '">Match</button>' +
      '<button type="button" data-tab="0" aria-pressed="' + (edTab === "0") + '">' + esc(d.teams[0].name) + " innings</button>" +
      '<button type="button" data-tab="1" aria-pressed="' + (edTab === "1") + '">' + esc(d.teams[1].name) + " innings</button></div>" +
      '<div class="seg"><button type="button" class="btn ghost small" id="edCancel">Cancel</button><button type="button" class="btn small" id="edSave">Save scorecard</button></div></div>';

    if (edTab === "match") {
      h += '<div class="fields">' + fld("Team that batted first", "ed-t0", d.teams[0].name, "text", 'maxlength="40"') + fld("Team that batted second", "ed-t1", d.teams[1].name, "text", 'maxlength="40"') +
        fld("College", "ed-college", d.college, "text", 'maxlength="80"') + fld("Match date", "ed-date", d.date, "text", 'maxlength="40" placeholder="e.g. 14 Oct 2026"') +
        fld("Ground", "ed-venue", d.venue, "text", 'maxlength="60"') + fld("Overs per side", "ed-overs", d.overs, "number", 'min="1" max="50" inputmode="numeric"') +
        fld("Man of the match", "ed-mom", d.manOfMatch, "text", 'maxlength="60" placeholder="Name (team)"') + "</div>" +
        '<p class="hint">Fill in the two innings next. The result, totals and highlights are worked out from the runs you enter.</p>' +
        '<div><button type="button" class="btn ghost small" id="edClear">Clear sample and start with blank rows</button></div>';
      // keep hidden inputs for the other tabs' data out of the DOM: collect() reads only what is rendered, so keep draft in sync before switching
    } else {
      var i = parseInt(edTab, 10), t = d.teams[i], opp = d.teams[1 - i];
      h += '<div class="sec-title">Batting · ' + esc(t.name) + "</div>";
      t.batting.forEach(function (p, k) {
        h += '<div class="card brow" data-i="' + i + '"><div class="row-head"><span>Batter ' + (k + 1) + '</span><button type="button" class="btn danger small" data-rm="bat" data-k="' + k + '">Remove</button></div>' +
          '<label class="f">Name<input class="f-n" type="text" maxlength="40" value="' + esc(p.n) + '"></label>' +
          '<div class="grid4">' + numCell("Runs", "f-r", p.r, !p.n) + numCell("Balls", "f-b", p.b, !p.n) + numCell("4s", "f-f", p.f, !p.n) + numCell("6s", "f-s", p.s, !p.n) + "</div>" +
          '<label class="f">How out (leave empty if not out)<input class="f-o" type="text" maxlength="60" value="' + esc(p.out) + '" placeholder="e.g. b Bowler, run out"></label></div>';
      });
      h += '<div><button type="button" class="btn ghost small" data-add="bat">Add batter</button></div>';
      h += '<div class="sec-title">Extras</div><div class="grid4">' +
        ["wd", "nb", "b", "lb"].map(function (k) { var lab = { wd: "Wides", nb: "No balls", b: "Byes", lb: "Leg byes" }[k]; return fld(lab, "ed-x" + i + "-" + k, t.extras[k], "number", 'min="0" inputmode="numeric"'); }).join("") + "</div>";
      h += '<div class="sec-title">Bowling · ' + esc(opp.name) + "</div>";
      t.bowlers.forEach(function (p, k) {
        h += '<div class="card wrow" data-i="' + i + '"><div class="row-head"><span>Bowler ' + (k + 1) + '</span><button type="button" class="btn danger small" data-rm="bowl" data-k="' + k + '">Remove</button></div>' +
          '<label class="f">Name<input class="f-n" type="text" maxlength="40" value="' + esc(p.n) + '"></label>' +
          '<div class="grid3">' + numCell("Overs", "f-o", p.o, !p.n, "0.1") + numCell("Runs", "f-r", p.r, !p.n) + numCell("Wickets", "f-w", p.w, !p.n) + "</div></div>";
      });
      h += '<div><button type="button" class="btn ghost small" data-add="bowl">Add bowler</button></div>';
      h += '<div class="sec-title">Runs in each over</div>' + fld("Runs per over, separated by commas (optional, draws the chart)", "ed-or" + i, t.overRuns.join(", "), "text", 'placeholder="e.g. 7, 9, 12, 6"');
    }
    h += '<p class="status" id="edStatus" role="status"></p>';
    ed.innerHTML = h;
  }

  function collect(keepBlank) {
    /* Reads whichever tab is on screen; fields of the other tab fall back to the draft. */
    var base = draft ? JSON.parse(JSON.stringify(draft)) : JSON.parse(JSON.stringify(DATA));
    var onMatch = !!$("ed-t0");
    var d = base;
    if (onMatch) {
      d.college = val("ed-college") || DATA.college;
      d.date = val("ed-date"); d.venue = val("ed-venue");
      d.overs = Math.max(1, Math.round(num(val("ed-overs"))) || DATA.overs);
      d.manOfMatch = val("ed-mom");
      d.teams[0].name = val("ed-t0") || "Team A"; d.teams[1].name = val("ed-t1") || "Team B";
    }
    [0, 1].forEach(function (i) {
      var rows = document.querySelectorAll('#editor .brow[data-i="' + i + '"]');
      if (!rows.length && !$("ed-x" + i + "-wd")) return;
      var t = d.teams[i];
      t.batting = []; t.bowlers = [];
      rows.forEach(function (row) {
        var g = function (c) { return row.querySelector("." + c).value.trim(); };
        var p = { n: g("f-n"), r: Math.round(num(g("f-r"))), b: Math.round(num(g("f-b"))), f: Math.round(num(g("f-f"))), s: Math.round(num(g("f-s"))), out: g("f-o") };
        if (p.n || keepBlank) t.batting.push(p);
      });
      document.querySelectorAll('#editor .wrow[data-i="' + i + '"]').forEach(function (row) {
        var g = function (c) { return row.querySelector("." + c).value.trim(); };
        var p = { n: g("f-n"), o: num(g("f-o")), r: Math.round(num(g("f-r"))), w: Math.round(num(g("f-w"))) };
        if (p.n || keepBlank) t.bowlers.push(p);
      });
      t.extras = {};
      ["wd", "nb", "b", "lb"].forEach(function (k) { t.extras[k] = Math.round(num(val("ed-x" + i + "-" + k))); });
      t.overRuns = val("ed-or" + i).split(/[\s,]+/).filter(function (s) { return s !== ""; }).map(function (s) { return num(s); });
    });
    d.sample = false;
    if (!keepBlank) {
      d.teams.forEach(function (t) {
        t.batting = t.batting.filter(function (p) { return p.n; });
        t.bowlers = t.bowlers.filter(function (p) { return p.n; });
      });
    }
    return d;
  }

  function openEditor() {
    draft = JSON.parse(JSON.stringify(DATA));
    edTab = "match"; editing = true;
    $("editor").hidden = false; $("editBtn").hidden = true;
    renderEditor();
    $("editor").scrollIntoView({ block: "start" });
  }
  function closeEditor() {
    editing = false; draft = null;
    $("editor").hidden = true; $("editor").innerHTML = "";
    $("editBtn").hidden = !canEdit;
  }
  function status(msg, err) { var s = $("edStatus"); if (s) { s.textContent = msg; s.className = "status" + (err ? " err" : ""); } }

  var STORE_KEY = "kishanganj-scorecard-v1";
  function save() {
    var d = collect(false);
    draft = collect(true);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(d));
    } catch (e) {
      status("Could not save in this browser. Check that site storage is allowed.", true);
      return;
    }
    DATA = d; renderAll(); closeEditor();
  }

  $("editBtn").addEventListener("click", openEditor);
  $("editor").addEventListener("click", function (ev) {
    var b = ev.target.closest("button"); if (!b) return;
    if (b.id === "edCancel") { closeEditor(); return; }
    if (b.id === "edSave") { save(); return; }
    if (b.id === "edClear") { var bd = blankData(); bd.college = draft.college; bd.overs = draft.overs; draft = bd; edTab = "match"; renderEditor(); status("Sample cleared. Fill in the details, then tap Save scorecard."); return; }
    if (b.hasAttribute("data-tab")) { draft = collect(true); edTab = b.getAttribute("data-tab"); renderEditor(); return; }
    var i = parseInt(edTab, 10);
    if (b.hasAttribute("data-add")) {
      draft = collect(true);
      if (b.getAttribute("data-add") === "bat") draft.teams[i].batting.push(blankRow()); else draft.teams[i].bowlers.push(blankBowler());
      renderEditor(); return;
    }
    if (b.hasAttribute("data-rm")) {
      draft = collect(true);
      var k = parseInt(b.getAttribute("data-k"), 10);
      (b.getAttribute("data-rm") === "bat" ? draft.teams[i].batting : draft.teams[i].bowlers).splice(k, 1);
      renderEditor(); return;
    }
  });

  /* ---------- Start ---------- */
  function normalize(d) {
    if (!d || !d.teams || d.teams.length !== 2) return null;
    d.teams.forEach(function (t) {
      t.batting = t.batting || []; t.bowlers = t.bowlers || t.bowling || []; t.overRuns = t.overRuns || [];
      t.extras = t.extras || {}; ["wd", "nb", "b", "lb"].forEach(function (k) { t.extras[k] = t.extras[k] || 0; });
    });
    return d;
  }
  canEdit = true;
  $("editBtn").hidden = false;
  try {
    var saved = normalize(JSON.parse(localStorage.getItem(STORE_KEY) || "null"));
    if (saved) DATA = saved;
  } catch (e) {}
  renderAll();
})();
