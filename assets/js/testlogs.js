/*
 * Renders the automatic lemma-test results for a language repo.
 *
 * The data is a per-build artifact on the repo's rolling `generated/docs-data`
 * branch, read via `raw.githubusercontent.com` (the one GitHub host that sends
 * CORS headers) — not committed to `main`, not baked into the Jekyll build.
 * The host page points `#testlogs[data-src]` at the manifest (`testlogs.json`);
 * each suite's full failure list lives in a sibling `testlogs-<id>.json` and
 * is fetched only when that suite is opened, so no single request is large
 * even when a build is badly broken.
 *
 *   data-src           https://raw.githubusercontent.com/<owner>/<repo>/generated/docs-data/testlogs.json
 *   testlogs.json      { generated, commit, build_url,
 *                        suites: [ { id, title, kind, lexc, lemmas,
 *                                    success_pct, failures, truncated } ] }
 *   testlogs-<id>.json { id, kind, failures: [ ... ] }  — the gtlemmatest /
 *                        gtspelltest -J failure records, unchanged.
 */
(function () {
  var root = document.getElementById("testlogs");
  if (!root || !root.dataset.src) return;
  var manifestUrl = root.dataset.src;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // lines() wraps token spans in `backticks`; turn those into <code>.
  function code(s) {
    return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  function suiteUrl(id) {
    return manifestUrl.replace(/testlogs\.json(\?.*)?$/, "testlogs-" + id + ".json");
  }

  function repoNwo() {
    var m = manifestUrl.match(
      /raw\.githubusercontent\.com\/([^/]+\/[^/]+)\//
    ) || manifestUrl.match(/github\.com\/([^/]+\/[^/]+)\//);
    return m ? m[1] : null;
  }

  function note(msg) {
    root.innerHTML = '<p class="testlogs-note">' + esc(msg) + "</p>";
  }

  fetch(manifestUrl, { cache: "no-cache" })
    .then(function (r) {
      if (r.status === 404) throw "missing";
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(render)
    .catch(function (e) {
      note(e === "missing"
        ? "No test results have been published yet, or the latest build has not finished."
        : "Could not load the latest test results.");
    });

  function render(data) {
    var nwo = repoNwo();
    var suites = data.suites || [];

    var bits = [];
    if (data.generated) {
      bits.push("generated " +
        esc(new Date(data.generated).toISOString().slice(0, 16)
          .replace("T", " ")) + " UTC");
    }
    if (data.commit && nwo) {
      bits.push('<a href="https://github.com/' + nwo + "/commit/" +
        esc(data.commit) + '"><code>' +
        esc(String(data.commit).slice(0, 8)) + "</code></a>");
    }
    if (data.build_url) {
      bits.push('<a href="' + esc(data.build_url) + '">build log</a>');
    }
    var provenance = bits.length
      ? '<p class="testlogs-note">' + bits.join(" · ") + "</p>"
      : "";

    var rows = suites.map(function (s) {
      var n = s.failures || 0;
      var name = n
        ? '<a href="#suite-' + esc(s.id) + '">' + esc(s.title) + "</a>"
        : esc(s.title);
      return '<tr class="' + (n ? "fail" : "pass") + '">' +
        "<td>" + name + "</td>" +
        '<td class="num">' + Number(s.lemmas || 0).toLocaleString() + "</td>" +
        '<td class="num">' + Number(s.success_pct || 0).toFixed(2) + " %</td>" +
        '<td class="num">' + (n ? n.toLocaleString() + (s.truncated ? "+" : "") : "—") +
        "</td></tr>";
    }).join("");

    root.innerHTML = provenance +
      '<table class="testlogs-summary"><thead><tr>' +
      '<th>Test</th><th class="num">Lemmas</th>' +
      '<th class="num">Success</th><th class="num">Failures</th>' +
      "</tr></thead><tbody>" + rows + "</tbody></table>";

    suites.filter(function (s) { return s.failures; }).forEach(addSuite);
  }

  function addSuite(s) {
    var section = document.createElement("section");
    section.id = "suite-" + s.id;

    var details = document.createElement("details");
    var summary = document.createElement("summary");
    summary.innerHTML = "<strong>" + esc(s.title) + "</strong> — " +
      Number(s.failures).toLocaleString() + (s.truncated ? "+" : "") +
      " failure(s)" +
      (s.lexc ? ' <span class="testlogs-note">(' + esc(s.lexc) + ")</span>" : "");
    details.appendChild(summary);

    var body = document.createElement("div");
    body.innerHTML = '<p class="testlogs-note">Loading…</p>';
    details.appendChild(body);

    var loaded = false;
    details.addEventListener("toggle", function () {
      if (!details.open || loaded) return;
      loaded = true;
      fetch(suiteUrl(s.id), { cache: "no-cache" })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          return r.json();
        })
        .then(function (d) { body.innerHTML = renderFailures(d.failures, s); })
        .catch(function () {
          body.innerHTML =
            '<p class="testlogs-note">Could not load these failures.</p>';
          loaded = false;
        });
    });

    section.appendChild(details);
    root.appendChild(section);
  }

  // A gtlemmatest / gtspelltest -J failure record → a list of items, each
  // { text } and optionally { sub: [text, ...] } for a nested list.
  function items(f) {
    if (f.suggestions !== undefined) {           // speller test
      return f.suggestions.length
        ? f.suggestions.map(function (x) { return { text: "`" + x + "`" }; })
        : [{ text: "not accepted, no suggestions" }];
    }
    var out = [];                                // lemma test
    (f.no_generation || []).forEach(function (x) {
      out.push({ text: "`" + x + "` does not generate!" });
    });
    (f.wrong_generation || []).forEach(function (w) {
      out.push({ text: "`" + w.expected + "` => `" + w.got + "`" });
    });
    if ((f.analyses || []).length) {
      out.push({
        text: "`" + f.lemma + "` has following analyses:",
        sub: f.analyses.map(function (a) { return "`" + a + "`"; }),
      });
    } else {
      out.push({ text: "`" + f.lemma + "` has no analyses either" });
    }
    return out;
  }

  function itemHtml(it) {
    var sub = it.sub && it.sub.length
      ? "<ul>" + it.sub.map(function (s) {
        return "<li>" + code(s) + "</li>";
      }).join("") + "</ul>"
      : "";
    return "<li>" + code(it.text) + sub + "</li>";
  }

  function renderFailures(failures, s) {
    var html = (failures || []).map(function (f) {
      var its = items(f);
      return "<details><summary><strong>" + esc(f.lemma) + "</strong> — " +
        its.length + " issue(s)</summary><ul>" +
        its.map(itemHtml).join("") +
        "</ul></details>";
    }).join("");
    if (s.truncated) {
      html += '<p class="testlogs-note">The test run stopped early; ' +
        "later lemmas were not checked.</p>";
    }
    return html;
  }
})();
