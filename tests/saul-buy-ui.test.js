/**
 * Tests that the Saul Buy UI displays the correct messages when selecting
 * non-citizen vs citizen targets. Requires flow-ui to be loaded.
 *
 * Run from tests/run.html (loads flow-engine, flow-ui, then this).
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  function setupPedarkhandeForSaulBuy() {
    appState.ui.scenario = "pedarkhande";
    appState.draw = {
      players: [
        { roleId: "godfather", alive: true },
        { roleId: "matador", alive: false },
        { roleId: "watson", alive: true },
        { roleId: "leon", alive: true },
        { roleId: "citizenKane", alive: true },
        { roleId: "constantine", alive: true },
        { roleId: "nostradamus", alive: true },
        { roleId: "saulGoodman", alive: true },
        { roleId: "citizen", alive: true },
      ],
      uiAtDraw: { scenario: "pedarkhande" },
    };
    appState.god = appState.god || {};
    appState.god.flow = {
      phase: "night",
      day: 2,
      step: 0,
      events: [],
      draft: {
        nightActionsByNight: {
          "2": {
            godfatherAction: "saul_buy",
            saulBuyTarget: null,
            matadorDisable: null,
          },
        },
      },
    };
    return ensureFlow();
  }

  const suite = {
    name: "saul-buy-ui",
    tests: [
      {
        name: "Saul Buy UI shows 'Saul buy failed' for non-citizen, 'Saul buy successful' for citizen",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function") return;
          const constantineIdx = 5;
          const citizenIdx = 8;
          const f = setupPedarkhandeForSaulBuy();
          const d = f.draft || {};
          if (!d.nightActionsByNight) d.nightActionsByNight = {};
          if (!d.nightActionsByNight["2"]) d.nightActionsByNight["2"] = {};

          // Select Constantine (non-citizen)
          d.nightActionsByNight["2"].godfatherAction = "saul_buy";
          d.nightActionsByNight["2"].saulBuyTarget = constantineIdx;
          showFlowTool();

          const html1 = window._lastFlowModalHtml || "";
          assert(html1.includes("Saul buy failed"), "UI should show 'Saul buy failed' when selecting non-citizen (Constantine), got: " + (html1.slice(0, 200) || "(empty)"));

          // Change to citizen
          d.nightActionsByNight["2"].saulBuyTarget = citizenIdx;
          showFlowTool();

          const html2 = window._lastFlowModalHtml || "";
          assert(html2.includes("Saul buy successful"), "UI should show 'Saul buy successful' when selecting citizen, got: " + (html2.slice(0, 200) || "(empty)"));
        },
      },
      {
        name: "Saul Buy message updates when selection is changed via card click",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function" || typeof getFlowSteps !== "function") return;
          const constantineIdx = 5;
          const citizenIdx = 8;
          const f = setupPedarkhandeForSaulBuy();
          const d = f.draft || {};
          if (!d.nightActionsByNight) d.nightActionsByNight = {};
          if (!d.nightActionsByNight["2"]) d.nightActionsByNight["2"] = {};
          d.nightActionsByNight["2"].godfatherAction = "saul_buy";
          d.nightActionsByNight["2"].saulBuyTarget = citizenIdx;
          showFlowTool();

          const container = document.getElementById("flowModalContainer");
          if (!container) return;

          const clickCard = (idx) => {
            const card = container.querySelector('.nightPlayerCard[data-field="fl_saul_buy_target"][data-idx="' + idx + '"]');
            if (card) card.click();
          };

          clickCard(constantineIdx);
          const html1 = window._lastFlowModalHtml || "";
          assert(html1.includes("Saul buy failed"), "Message should update to 'Saul buy failed' when clicking non-citizen card");

          clickCard(citizenIdx);
          const html2 = window._lastFlowModalHtml || "";
          assert(html2.includes("Saul buy successful"), "Message should update to 'Saul buy successful' when clicking citizen card");
        },
      },
      {
        name: "Saul Buy success uses note pass (green), failed uses note warn (orange)",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function") return;
          const constantineIdx = 5;
          const citizenIdx = 8;
          const f = setupPedarkhandeForSaulBuy();
          const d = f.draft || {};
          if (!d.nightActionsByNight) d.nightActionsByNight = {};
          if (!d.nightActionsByNight["2"]) d.nightActionsByNight["2"] = {};
          d.nightActionsByNight["2"].godfatherAction = "saul_buy";

          d.nightActionsByNight["2"].saulBuyTarget = constantineIdx;
          showFlowTool();
          const htmlFail = window._lastFlowModalHtml || "";
          assert(htmlFail.includes('class="note warn"') || htmlFail.includes("note warn"), "Saul buy failed should use note warn (orange)");

          d.nightActionsByNight["2"].saulBuyTarget = citizenIdx;
          showFlowTool();
          const htmlSuccess = window._lastFlowModalHtml || "";
          assert(htmlSuccess.includes('class="note pass"') || htmlSuccess.includes("note pass"), "Saul buy successful should use note pass (green)");
        },
      },
    ],
  };

  window.SAUL_BUY_UI_TESTS = suite;
})();
