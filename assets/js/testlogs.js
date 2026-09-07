/*
 * Renders the automatic lemma-test results for a language repo.
 *
 * The data is a per-build artifact on the repo's rolling `generated/docs-data`
 * branch — not committed to `main`, not baked into the Jekyll build. A public
 * repo reads it via `raw.githubusercontent.com` (the one GitHub host that sends
 * CORS headers); a private repo can't (auth required, no CORS header), so its
 * docs workflow copies the branch into the site and `data-src` is a same-origin
 * path. Either way a host page mounts this by including `_includes/testlogs.html`,
 * which emits `#testlogs[data-src]` (the manifest, `testlogs.json`) plus
 * `#testlogs[data-nwo]` (owner/repo, for building github.com links — a
 * same-origin `data-src` has none to scrape). Each suite's full failure list
 * lives in a sibling `testlogs-<id>.json` and is fetched only when that suite
 * is opened, so no single request is large even when a build is badly broken.
 *
 *   data-src           <base>/testlogs.json   (<base> = raw.githubusercontent.com/<owner>/<repo>/generated/docs-data, or a same-origin path for a private repo)
 *   data-nwo           <owner>/<repo>
 *   testlogs.json      { generated, commit, build_url,
 *                        suites: [ { id, title, kind, lexc, lemmas, tested,
 *                                    success_pct, failures, truncated } ] }
 *   testlogs-<id>.json { id, kind, failures: [ ... ] }  — the gtlemmatest /
 *                        gtspelltest -J failure records, unchanged.
 */
(function () {
  var root = document.getElementById("testlogs");
  if (!root || !root.dataset.src) return;
  var manifestUrl = root.dataset.src;

  // "Expand all" state — every suite and every failure open, so the whole
  // page is real DOM text that browser find-in-page can reach.
  var expanded = false;

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // lines() wraps token spans in `backticks`; turn those into <code>.
  function code(s) {
    return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  // Success rate for the summary table. A suite with failures must never read
  // as "100.00 %" just because it rounds up (one failure in ~90k lemmas is
  // 99.9989 %), so floor to 2 decimals whenever there are failures.
  function pct(value, failures) {
    var v = Number(value || 0);
    if (failures > 0) v = Math.floor(v * 100) / 100;
    return v.toFixed(2) + " %";
  }

  function suiteUrl(id) {
    return manifestUrl.replace(/testlogs\.json(\?.*)?$/, "testlogs-" + id + ".json");
  }

  function repoNwo() {
    // A private repo's data-src is a same-origin path with no owner/repo in it,
    // so testlogs.html also emits data-nwo; prefer that. Fall back to scraping
    // the URL for a public repo (raw.githubusercontent.com/<owner>/<repo>/…).
    if (root.dataset.nwo) return root.dataset.nwo;
    var m = manifestUrl.match(
      /raw\.githubusercontent\.com\/([^/]+\/[^/]+)\//
    ) || manifestUrl.match(/github\.com\/([^/]+\/[^/]+)\//);
    return m ? m[1] : null;
  }

  function note(msg) {
    root.innerHTML = '<p class="testlogs-note">' + esc(msg) + "</p>";
  }

  // The empty-state note for a repo with no published test results — either no
  // manifest at all, or a manifest with no suites. Automatic lemma/speller
  // tests are opt-in per repo via the `check:` section of `.build-config.yml`,
  // and a build has to run after that section changes before anything shows up
  // here, so point the reader straight at the file. `/blob/HEAD/` resolves to
  // the repo's default branch, so we needn't know `main` from `master`.
  function buildConfigNote(nwo, lead) {
    // `<a>` goes *inside* `<code>` — the theme styles `code a` (a linked file
    // name) but not `a > code`, which would render as a plain, dead-looking
    // code chip.
    var file = nwo
      ? '<code><a href="https://github.com/' + esc(nwo) +
        '/blob/HEAD/.build-config.yml">.build-config.yml</a></code>'
      : "<code>.build-config.yml</code>";
    return '<p class="testlogs-note">' + esc(lead) + " Automatic lemma and " +
      "speller tests are enabled in the <code>check:</code> section of " +
      file + "; edit that section and run a build for results to appear here. " +
      'See <a href="https://giellalt.github.io/infra/infraremake/' +
      'AddingMorphologicalTestData.html">Adding morphological test data</a> ' +
      "for adding the test data itself.</p>";
  }

  fetch(manifestUrl, { cache: "no-cache" })
    .then(function (r) {
      if (r.status === 404) throw "missing";
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(render)
    .catch(function (e) {
      if (e === "missing") {
        root.innerHTML = buildConfigNote(repoNwo(),
          "No test results have been published for this repository yet.");
        return;
      }
      note("Could not load the latest test results.");
    });

  function render(data) {
    var nwo = repoNwo();
    var suites = data.suites || [];
    var failing = suites.filter(function (s) { return s.failures; });

    var bits = [];
    var gen = data.generated && new Date(data.generated);
    if (gen && !isNaN(gen.getTime())) {
      bits.push("generated " +
        esc(gen.toISOString().slice(0, 16).replace("T", " ")) + " UTC");
    }
    if (data.commit && nwo) {
      bits.push('<code><a href="https://github.com/' + nwo + "/commit/" +
        esc(data.commit) + '">' +
        esc(String(data.commit).slice(0, 8)) + "</a></code>");
    }
    if (data.build_url) {
      bits.push('<a href="' + esc(data.build_url) + '">build log</a>');
    }
    var provenance = bits.length
      ? '<p class="testlogs-note">' + bits.join(" · ") + "</p>"
      : "";

    // A valid manifest with no suites = the repo's last build ran no
    // lemma/speller tests, usually because the `check:` section of
    // `.build-config.yml` has them off (or was just changed and CI hasn't
    // re-run). Point at that file instead of rendering an empty table.
    if (!suites.length) {
      root.innerHTML = provenance +
        buildConfigNote(nwo, "This build ran no lemma or speller tests.");
      return;
    }

    var rows = suites.map(function (s) {
      var n = s.failures || 0;
      var name = n
        ? '<a href="#suite-' + esc(s.id) + '">' + esc(s.title) + "</a>"
        : esc(s.title);
      // A truncated run stopped before testing every lemma, so its success
      // rate is over the tested subset, not the whole lexicon. Show
      // "tested / total" and flag the percentage as partial rather than
      // letting it read as a finished measurement.
      var total = Number(s.lemmas || 0).toLocaleString();
      var lemmaCell = s.truncated && s.tested != null
        ? Number(s.tested).toLocaleString() + " / " + total
        : total;
      var successCell = pct(s.success_pct, n) +
        (s.truncated ? ' <span class="testlogs-note">(partial)</span>' : "");
      return "<tr>" +
        "<td>" + name + "</td>" +
        '<td class="num">' + lemmaCell + "</td>" +
        '<td class="num">' + successCell + "</td>" +
        '<td class="num">' + (n ? n.toLocaleString() + (s.truncated ? "+" : "") : "—") +
        "</td></tr>";
    }).join("");

    root.innerHTML = provenance +
      '<table class="testlogs-summary"><thead><tr>' +
      '<th>Test</th><th class="num">Lemmas</th>' +
      '<th class="num">Success</th><th class="num">Failures</th>' +
      "</tr></thead><tbody>" + rows + "</tbody></table>" +
      (failing.length
        ? '<p><button type="button" class="testlogs-toggle-all">' +
          "Expand all</button></p>"
        : "");

    var btn = root.querySelector(".testlogs-toggle-all");
    if (btn) {
      btn.addEventListener("click", function () {
        expanded = !expanded;
        btn.textContent = expanded ? "Collapse all" : "Expand all";
        applyExpansion();
      });
    }

    failing.forEach(addSuite);
  }

  // Open (or close) every suite and every already-loaded failure. Opening a
  // suite fires its `toggle` handler, which lazy-fetches the failure list; the
  // handler re-applies `expanded` once that HTML is in.
  function applyExpansion() {
    each(root.querySelectorAll("section > details"), function (d) {
      d.open = expanded;
    });
    each(root.querySelectorAll(".testlogs-failures details"), function (d) {
      d.open = expanded;
    });
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
    body.className = "testlogs-failures";
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
        .then(function (d) {
          body.innerHTML = renderFailures(d.failures, s);
          if (expanded) {
            each(body.querySelectorAll("details"), function (x) {
              x.open = true;
            });
          }
        })
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
