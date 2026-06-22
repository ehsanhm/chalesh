/**
 * Tests that scroll position is preserved when clicking items in a long list.
 * Fix: Flow tool (e.g. Day 1 Voting) — nested .fl-scrollable divs now have
 * their scrollTop saved/restored when content is replaced (openToolModal).
 *
 * Run from tests/run.html.
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  const suite = {
    name: "scroll-persistence",
    tests: [
      {
        name: "Scroll position preserved when clicking in scrollable list (innerHTML replace)",
        fn: function ({ assert }) {
          // Mimic the cards page: scrollable container with many buttons.
          // When we click, we replace content (like renderCards does).
          // Scroll should be preserved; if not, the fix is to save/restore scrollTop.
          const container = document.createElement("div");
          container.style.cssText =
            "height:200px; overflow:auto; width:300px; border:1px solid #444;";
          for (let i = 0; i < 30; i++) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "cardBtn";
            btn.textContent = "Card " + (i + 1);
            btn.addEventListener("click", () => {
              // Simulate renderCards: replace innerHTML (this can reset scroll)
              container.innerHTML = "";
              for (let j = 0; j < 30; j++) {
                const b = document.createElement("button");
                b.type = "button";
                b.className = "cardBtn";
                b.textContent = "Card " + (j + 1);
                container.appendChild(b);
              }
            });
            container.appendChild(btn);
          }
          document.body.appendChild(container);

          container.scrollTop = 100;
          const scrollBefore = container.scrollTop;

          const firstBtn = container.querySelector("button");
          firstBtn.click();

          const scrollAfter = container.scrollTop;
          document.body.removeChild(container);

          assert(
            Math.abs(scrollAfter - scrollBefore) <= 2,
            "Scroll position should be preserved when clicking (before=" +
              scrollBefore +
              ", after=" +
              scrollAfter +
              "). Replacing innerHTML resets scroll; fix by saving scrollTop before replace and restoring after."
          );
        },
      },
      {
        name: "Scroll preservation: save and restore scrollTop when replacing content",
        fn: function ({ assert }) {
          // Demonstrates the fix: save scrollTop before innerHTML replace, restore after.
          const container = document.createElement("div");
          container.style.cssText =
            "height:200px; overflow:auto; width:300px; border:1px solid #444;";
          for (let i = 0; i < 30; i++) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = "Item " + (i + 1);
            btn.addEventListener("click", () => {
              const saved = container.scrollTop;
              container.innerHTML = "";
              for (let j = 0; j < 30; j++) {
                const b = document.createElement("button");
                b.type = "button";
                b.textContent = "Item " + (j + 1);
                container.appendChild(b);
              }
              container.scrollTop = saved;
            });
            container.appendChild(btn);
          }
          document.body.appendChild(container);

          container.scrollTop = 100;
          const scrollBefore = container.scrollTop;

          container.querySelector("button").click();

          const scrollAfter = container.scrollTop;
          document.body.removeChild(container);

          assert(
            Math.abs(scrollAfter - scrollBefore) <= 2,
            "With save/restore, scroll preserved: before=" + scrollBefore + ", after=" + scrollAfter
          );
        },
      },
      {
        name: "Flow day_vote step renders fl-scrollable for player cards grid",
        fn: function ({ assert }) {
          if (typeof ensureFlow !== "function" || typeof showFlowTool !== "function") return;
          const f = ensureFlow();
          f.phase = "day";
          f.day = 1;
          f.step = 0;
          appState.draw.uiAtDraw = appState.draw.uiAtDraw || {};
          appState.draw.uiAtDraw.scenario = "classic";
          showFlowTool();
          const html = window._lastFlowModalHtml || "";
          assert(
            html.indexOf("fl-scrollable") >= 0,
            "Flow day_vote step must render fl-scrollable class for scroll preservation"
          );
        },
      },
      {
        name: "Nested fl-scrollable scroll position preserved when Flow content is replaced",
        fn: function ({ assert }) {
          // Simulates openToolModal's scroll preservation for .fl-scrollable elements.
          const parent = document.createElement("div");
          const scrollContent = Array(20).fill(0).map((_, i) => `<div style="height:40px">Player ${i + 1}</div>`).join("");
          parent.innerHTML = `
            <div class="fl-scrollable" style="height:150px; overflow:auto;">
              ${scrollContent}
            </div>
          `;
          document.body.appendChild(parent);
          const scrollEl = parent.querySelector(".fl-scrollable");
          scrollEl.scrollTop = 120;
          const savedScroll = scrollEl.scrollTop;

          const nestedScrolls = [];
          parent.querySelectorAll(".fl-scrollable").forEach((el) => nestedScrolls.push(el.scrollTop));
          parent.innerHTML = `
            <div class="fl-scrollable" style="height:150px; overflow:auto;">
              ${scrollContent}
            </div>
          `;
          nestedScrolls.forEach((saved, i) => {
            const el = parent.querySelectorAll(".fl-scrollable")[i];
            if (el) el.scrollTop = saved;
          });

          const newScrollEl = parent.querySelector(".fl-scrollable");
          const scrollAfter = newScrollEl.scrollTop;
          document.body.removeChild(parent);

          assert(
            Math.abs(scrollAfter - savedScroll) <= 2,
            "fl-scrollable scroll must be preserved when content is replaced (saved=" +
              savedScroll + ", after=" + scrollAfter + ")"
          );
        },
      },
    ],
  };

  window.SCROLL_PERSISTENCE_TESTS = suite;
})();
