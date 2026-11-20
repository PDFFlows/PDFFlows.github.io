// The hero demo: a message to the Assistant, its tool calls, and the page changing beside it.
// With reduced motion the finished review is shown at once. Replay runs it again.

(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var log = document.getElementById("log");
  var replay = document.getElementById("replay");
  var timers = [];

  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function page(step, on) {
    var e = document.querySelector('[data-step="' + step + '"]');
    if (e) e.classList.toggle("is-on", on);
  }

  function add(node) {
    if (!reduce) node.classList.add("step-in");
    log.appendChild(node);
    return node;
  }

  // A tool row: a spinner while it runs, then a check and its time.
  function tool(name, args, ms) {
    var row = add(el("div", "tool", '<span class="spin" aria-hidden="true"></span><b>' + name + '</b><span class="args">' + args + '</span><span class="ms"></span>'));
    return function (after) {
      row.querySelector(".spin").outerHTML = CHECK;
      row.querySelector(".ms").textContent = ms;
      row.setAttribute("aria-label", name + " finished in " + ms);
      if (after) after();
    };
  }

  var script = [
    [300, function () { add(el("div", "bubble", "Check the units on this page and comment each problem.")); }],
    [900, function () { this.t1 = tool("find_text", "query: kN/m², page: 3", "38 ms"); }],
    [700, function () { this.t1(); }],
    [400, function () { this.t2 = tool("markup_text", "style: highlight, query: 18 kN/m², comment: Unit weight is…", "52 ms"); }],
    [800, function () { this.t2(function () { page("hl1", true); }); }],
    [500, function () { page("note", true); }],
    [500, function () { this.t3 = tool("replace_text", "query: 310 kN, replacement: 310 kPa", "61 ms"); }],
    [800, function () { this.t3(function () { page("strike", true); }); }],
    [350, function () { page("ins", true); }],
    [600, function () { this.t4 = tool("render_page", "page: 3, dpi: 96", "140 ms"); }],
    [900, function () { this.t4(); }],
    [500, function () {
      add(el("div", "reply", "Two unit problems on page 3. The unit weight reads <strong>kN/m²</strong>; it should be kN/m³, so I left a comment there. The allowable pressure was written in <strong>kN</strong>; I changed it to kPa. Undo takes both back."));
    }],
    [300, function () { add(el("div", "stats", "4 tool calls · 1 undo step")); }]
  ];

  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    log.innerHTML = "";
    ["hl1", "note", "strike", "ins"].forEach(function (s) { page(s, false); });
  }

  // instant: the finished review, drawn at once (first paint, and reduced motion).
  function run(instant) {
    reset();
    var ctx = {};
    if (instant) {
      script.forEach(function (s) { s[1].call(ctx); });
      ["t1", "t2", "t3", "t4"].forEach(function (k) { if (ctx[k]) ctx[k](); });
      ["hl1", "note", "strike", "ins"].forEach(function (s) { page(s, true); });
      return;
    }
    replay.disabled = true;
    var at = 0;
    script.forEach(function (s, i) {
      at += s[0];
      timers.push(setTimeout(function () {
        s[1].call(ctx);
        if (i === script.length - 1) replay.disabled = false;
      }, at));
    });
  }

  replay.addEventListener("click", function () { run(reduce); });

  // Start when the demo comes into view (once); draw the title's highlighter at load.
  var drawn = document.querySelectorAll("[data-draw]");
  requestAnimationFrame(function () {
    drawn.forEach(function (d) { d.classList.add("is-on"); });
  });
  // The page opens on the finished review; once the demo has been in view for a moment it
  // plays from the start, once. Replay plays it again.
  run(true);
  var demo = document.querySelector(".demo");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        io.disconnect();
        timers.push(setTimeout(function () { run(false); }, 2600));
      }
    }, { threshold: 0.5 });
    io.observe(demo);
  }

  // Copy the connect command.
  var copy = document.getElementById("copy");
  copy.addEventListener("click", function () {
    var text = "claude mcp add --scope user pdfflow -- /Applications/PDFflow.app/Contents/MacOS/pdfflow --mcp";
    var done = function () {
      copy.textContent = "Copied";
      copy.setAttribute("aria-pressed", "true");
      setTimeout(function () {
        copy.textContent = "Copy";
        copy.setAttribute("aria-pressed", "false");
      }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { copy.textContent = "Select and copy"; });
    } else {
      copy.textContent = "Select and copy";
    }
  });
})();
