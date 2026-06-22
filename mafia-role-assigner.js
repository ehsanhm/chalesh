/**
 * MafiaFairAssign — multiset-safe fair role assignment (no duplicate slots per round).
 *
 * 1) Split pool into town (teamFa === "شهر") vs non-town (mafia + independent).
 * 2) Pick who gets non-town slots: default = deterministic by highest fair-share deficit
 *    (expected − actual bad games in a sliding window); optional weighted mode.
 * 3) Assign each concrete role slot to exactly one player via weighted choice
 *    WITHOUT replacement (recent same roleId → lower weight; per-role fair share
 *    so each player tends to see almost every pool role over time; recency decay).
 *
 * Bad-side deficit (deficit mode): compare **rates**, not raw counts — otherwise players with
 * long history (large g) get huge |expected − badCount| and dominate non-town picks vs newcomers
 * with short g (same actual fairness, different scale). Deficit = expectedRate − actualRate where
 * expectedRate = badSlotCount/n, actualRate = badCount/g. No history (g=0): use expectedRate alone
 * so new players tie fair “never been bad yet” veterans on the same scale.
 *
 * Uses the same per-player recentGames history as loadFairnessHistory() in index.html.
 */
const MafiaFairAssign = (function () {
  let config = {
    sameRolePenalty: 0.95,
    sameGroupPenalty: 0.85,
    recencyDecay: 0.55,
    minWeight: 0.02,
    /** Fair-share balancing for non-town (bad-side) selection */
    balanceMode: true,
    balanceWindow: 40,
    balanceBoost: 0.55,
    balancePenalty: 0.65,
    /** Who gets non-town slots: 'deficit' = top fair-share deficit (tight spread); 'weighted' = random by weights */
    groupPickMode: "deficit",
    /** Per-role fair share: boost weight if player is below expected times they had this roleId in window */
    roleCoverageMode: true,
    roleCoverageBoost: 0.55,
    roleCoveragePenalty: 0.85,
    /** Master switch for the special troll system. */
    trollSystemEnabled: true,
    /** Troll mode: 'assignment' = dark/white/clash assignment rules, 'block'/'device-lock' = lock this browser/device, 'disabled' = off. */
    trollSystemMode: "assignment",
  };

  /** @type {null | (function(string): { recentGames?: Array<{ roleId?: string }> } | null)} */
  let getLegacyRecord = null;

  // --- troll config ---
  const _TROLL_TRIGGER_RAW = [
    "Mahdi","Mehdi","مهدی",
    "Mahtab","Mehtab","مهتاب",
    "Naser","Nasser","Nasir","Nazer","ناصر",
    "Anahid","Anahita","Anahit","آناهید",
    "Gisoo","Gisu","Gisou","گیسو",
    "Artin","Arteen","آرتین",
    "Golsa","گلسا",
    "Masoud","Masood","Masud","مسعود",
    "Ghasem","Ghassem","Qasem","Kasem","قاسم",
    "Khodayar","KhodaYar","خدایار",
    "Jahanbakhsh","JahanBakhsh","جهانبخش",
    "Shohreh","Shohre","Shoreh","Shore","Shouhreh","Shouhre","Shuhreh","Shuhre","شهره",
    "Mohammad","Mohamad","Mohammed","Mohamed","Muhammad","Muhamad","Muhammed","Muhamed","Mohd","Md","Mammad","Mamad","محمد","محمّد","ممد","ممدی",
    "Payam","پیام",
    "Mehran","مهران",
    "Setareh","Setare","Sitareh","ستاره",
  ];
  // One dark list: every name uses the same _TROLL_PROB priority.
  const _TROLL_DARK_RAW = [
    "Shohreh","Shohre","Shoreh","Shore","Shouhreh","Shouhre","Shuhreh","Shuhre","شهره",
    "Khodayar","KhodaYar","خدایار",
    "Jahanbakhsh","JahanBakhsh","جهانبخش",
    "Ghasem","Ghassem","Qasem","Kasem","قاسم",
    "Masoud","Masood","Masud","مسعود",
    "Payam","پیام",
    "Mehran","مهران",
  ];
  const _TROLL_WHITELIST_RAW = [
    "Naser","Nasser","Nasir","Nazer","ناصر",
    "Anahid","Anahita","Anahit","آناهید",
    "Golsa","گلسا",
    "Mahtab","Mehtab","مهتاب",
    "Setareh","Setare","Sitareh","ستاره",
  ];
  const _TROLL_CLASH_TEAMS_RAW = {
    teamA: [
      ["Mahtab","Mehtab","مهتاب"],
      ["Artin","Arteen","آرتین"],
      ["Khodayar","KhodaYar","خدایار"],
      ["Jahanbakhsh","JahanBakhsh","جهانبخش"],
    ],
    teamB: [
      ["Mohammad","Mohamad","Mohammed","Mohamed","Muhammad","Muhamad","Muhammed","Muhamed","Mohd","Md","Mammad","Mamad","محمد","محمّد","ممد","ممدی"],
      ["Masoud","Masood","Masud","مسعود"],
      ["Mahdi","Mehdi","مهدی"],
      ["Gisoo","Gisu","Gisou","گیسو"],
    ],
  };
  const _TROLL_PROB = 0.5;
  const _TROLL_WHITELIST_PROB = 0.5;
  // Normalize aliases once; player names use the same path before matching.
  const _TROLL_TRIGGER_NORM   = _TROLL_TRIGGER_RAW.map(_trollNorm);
  const _TROLL_DARK_NORM = _TROLL_DARK_RAW.map(_trollNorm);
  const _TROLL_WHITELIST_NORM = _TROLL_WHITELIST_RAW.map(_trollNorm);
  const _TROLL_CLASH_TEAMS_NORM = {
    teamA: _TROLL_CLASH_TEAMS_RAW.teamA.map(function(aliases) { return aliases.map(_trollNorm); }),
    teamB: _TROLL_CLASH_TEAMS_RAW.teamB.map(function(aliases) { return aliases.map(_trollNorm); }),
  };
  const _TROLL_KNOWN_PREFIXES = ["اقا", "خانم", "جناب", "mr", "mrs", "ms", "agha", "aga"];
  const _TROLL_KNOWN_SUFFIXES = ["خان", "جان", "جون", "عزیز", "دل", "khan", "jan", "joon", "jon", "aziz", "dear"];

  function _trollNormalizeDigits(s) {
    return s
      .replace(/[۰-۹]/g, function(ch) { return String(ch.charCodeAt(0) - 0x06F0); })
      .replace(/[٠-٩]/g, function(ch) { return String(ch.charCodeAt(0) - 0x0660); });
  }

  function _trollStripAffixes(compact) {
    var out = compact;
    var changed = true;
    while (changed) {
      changed = false;
      for (var i = 0; i < _TROLL_KNOWN_PREFIXES.length; i++) {
        var p = _TROLL_KNOWN_PREFIXES[i];
        if (out.length > p.length + 1 && out.indexOf(p) === 0) {
          out = out.slice(p.length);
          changed = true;
        }
      }
      var beforeSuffixTrim = out;
      out = out.replace(/(جون+|جان+|jo+n+|ja+n+)$/g, "");
      if (out !== beforeSuffixTrim) changed = true;
      for (var j = 0; j < _TROLL_KNOWN_SUFFIXES.length; j++) {
        var x = _TROLL_KNOWN_SUFFIXES[j];
        if (out.length > x.length + 1 && out.slice(-x.length) === x) {
          out = out.slice(0, -x.length);
          changed = true;
        }
      }
    }
    return out;
  }

  // Normalize names so "۱ مسعود", "مسعود خان", "آقا مهدی", "مهدی3", and Arabic/Persian spelling variants match.
  function _trollNorm(n) {
    var s = String(n || "");
    if (s.normalize) s = s.normalize("NFKC");
    s = _trollNormalizeDigits(s)
      .toLowerCase()
      .replace(/[يى]/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[أإٱآ]/g, "ا")
      .replace(/[ۀة]/g, "ه")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ی")
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0300-\u036f]/g, "")
      .replace(/[\u200c\u200d\u200e\u200f]/g, " ")
      .replace(/[0-9]+/g, " ")
      .replace(/[_\-–—.,،؛:;!?؟()[\]{}"'`~\\/|+*=<>@#$%^&]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return s;
  }

  function _trollNameMatches(normName, normAliases) {
    if (!normName) return false;
    var padded = " " + normName + " ";
    var compact = normName.replace(/\s+/g, "");
    var stripped = _trollStripAffixes(compact);
    for (var i = 0; i < normAliases.length; i++) {
      var alias = normAliases[i];
      if (!alias) continue;
      var aliasCompact = alias.replace(/\s+/g, "");
      if (padded.indexOf(" " + alias + " ") !== -1) return true;
      if (compact.indexOf(aliasCompact) !== -1 || stripped.indexOf(aliasCompact) !== -1) return true;
    }
    return false;
  }

  // Returns true when 3+ trigger names are in the player list.
  function _isTrollTriggered(normNames) {
    var cnt = 0;
    for (var i = 0; i < normNames.length; i++) {
      if (_trollNameMatches(normNames[i], _TROLL_TRIGGER_NORM)) cnt++;
    }
    return cnt >= 3;
  }

  function _isTrollSystemEnabled() {
    return config.trollSystemEnabled !== false && _trollMode() !== "disabled";
  }

  function _trollMode() {
    var raw = String(config.trollSystemMode || "assignment");
    if (raw === "disabled" || raw === "disable" || raw === "off" || raw === "none") return "disabled";
    return (raw === "device-lock" || raw === "deviceLock" || raw === "lock" || raw === "block" || raw === "blocking") ? "device-lock" : "assignment";
  }

  function _isTrollAssignmentMode() {
    return _isTrollSystemEnabled() && _trollMode() === "assignment";
  }

  function _isTrollDeviceLockMode() {
    return _isTrollSystemEnabled() && _trollMode() === "device-lock";
  }

  function _trollLockTargets(playerNames) {
    if (!_isTrollDeviceLockMode() || !Array.isArray(playerNames)) return [];
    var normNames = playerNames.map(_trollNorm);
    if (!_isTrollTriggered(normNames)) return [];
    var targets = [];
    for (var i = 0; i < normNames.length; i++) {
      if (_trollIsDarkName(normNames[i])) {
        targets.push({ index: i, name: String(playerNames[i] || "").trim() });
      }
    }
    return targets;
  }

  function _trollTriggerMatches(playerNames) {
    if (!_isTrollDeviceLockMode() || !Array.isArray(playerNames)) return [];
    var matches = [];
    for (var i = 0; i < playerNames.length; i++) {
      if (_trollNameMatches(_trollNorm(playerNames[i]), _TROLL_TRIGGER_NORM)) {
        matches.push({ index: i, name: String(playerNames[i] || "").trim() });
      }
    }
    return matches;
  }

  function _trollIsDarkName(normName) {
    return _trollNameMatches(normName, _TROLL_DARK_NORM);
  }

  function _trollIsWhiteName(normName) {
    return _trollNameMatches(normName, _TROLL_WHITELIST_NORM);
  }

  function _trollRoleSideKey(roleId, rolesDict) {
    return isTownRole(roleId, rolesDict) ? "town" : "dark";
  }

  function _trollRoleTeamKey(roleId, rolesDict) {
    var team = rolesDict[roleId] && rolesDict[roleId].teamFa;
    if (team === "شهر") return "town";
    if (team === "مافیا") return "mafia";
    if (team === "مستقل") return "independent";
    return _trollRoleSideKey(roleId, rolesDict);
  }

  function _trollFirstMatchIndex(normNames, normAliases, exceptIdx, usedIdxs) {
    for (var i = 0; i < normNames.length; i++) {
      if (i === exceptIdx) continue;
      if (usedIdxs && usedIdxs.has(i)) continue;
      if (_trollNameMatches(normNames[i], normAliases)) return i;
    }
    return null;
  }

  function _trollFindClashTeamMembers(normNames, teamNorms, usedIdxs) {
    var out = [];
    for (var i = 0; i < teamNorms.length; i++) {
      var idx = _trollFirstMatchIndex(normNames, teamNorms[i], null, usedIdxs);
      if (idx === null) continue;
      out.push(idx);
      if (usedIdxs) usedIdxs.add(idx);
    }
    return out;
  }

  function _trollFindClashTeams(normNames) {
    var used = new Set();
    return {
      teamA: _trollFindClashTeamMembers(normNames, _TROLL_CLASH_TEAMS_NORM.teamA, used),
      teamB: _trollFindClashTeamMembers(normNames, _TROLL_CLASH_TEAMS_NORM.teamB, used),
    };
  }

  function _trollHasAssignmentRule(normNames) {
    for (var i = 0; i < normNames.length; i++) {
      if (_trollIsDarkName(normNames[i]) || _trollIsWhiteName(normNames[i])) return true;
    }
    var teams = _trollFindClashTeams(normNames);
    if (teams.teamA.length && teams.teamB.length) return true;
    return false;
  }

  function _trollFindSwapDonor(assignment, normNames, rolesDict, desiredSide, forbiddenIdxs, preferredDonorFn, allowFallback, sideKeyFn) {
    var fallback = null;
    var sideKey = sideKeyFn || _trollRoleSideKey;
    for (var i = 0; i < assignment.length; i++) {
      if (forbiddenIdxs && forbiddenIdxs.has(i)) continue;
      if (sideKey(assignment[i], rolesDict) !== desiredSide) continue;
      if (!preferredDonorFn || preferredDonorFn(i)) return i;
      if (fallback === null) fallback = i;
    }
    return allowFallback === false ? null : fallback;
  }

  function _trollSwapRoles(assignment, a, b) {
    var oldRole = assignment[a];
    assignment[a] = assignment[b];
    assignment[b] = oldRole;
  }

  function _trollMoveIndexToSide(assignment, idx, desiredSide, normNames, rolesDict, preferredDonorFn, allowFallback, sideKeyFn) {
    var sideKey = sideKeyFn || _trollRoleSideKey;
    if (sideKey(assignment[idx], rolesDict) === desiredSide) return true;
    var forbidden = new Set([idx]);
    var donorIdx = _trollFindSwapDonor(assignment, normNames, rolesDict, desiredSide, forbidden, preferredDonorFn, allowFallback, sideKey);
    if (donorIdx === null) return false;
    _trollSwapRoles(assignment, idx, donorIdx);
    return true;
  }

  function _trollApplyWhiteSideRules(assignment, normNames, rolesDict) {
    for (var i = 0; i < normNames.length; i++) {
      if (!_trollIsWhiteName(normNames[i])) continue;
      if (Math.random() >= _TROLL_WHITELIST_PROB) continue;
      _trollMoveIndexToSide(assignment, i, "town", normNames, rolesDict, function(donorIdx) {
        return !_trollIsWhiteName(normNames[donorIdx]);
      }, false);
    }
  }

  function _trollApplyDarkSideRules(assignment, normNames, rolesDict) {
    for (var i = 0; i < normNames.length; i++) {
      if (!_trollIsDarkName(normNames[i])) continue;
      if (Math.random() >= _TROLL_PROB) continue;
      _trollMoveIndexToSide(assignment, i, "dark", normNames, rolesDict, function(donorIdx) {
        return !_trollIsDarkName(normNames[donorIdx]);
      }, false);
    }
  }

  function _trollClashPreference(idx, normNames) {
    return {
      dark: _trollIsDarkName(normNames[idx]) && Math.random() < _TROLL_PROB,
      white: _trollIsWhiteName(normNames[idx]) && Math.random() < _TROLL_WHITELIST_PROB,
    };
  }

  function _trollClashPreferenceForIdx(clashPrefs, idx, normNames) {
    if (!clashPrefs[idx]) clashPrefs[idx] = _trollClashPreference(idx, normNames);
    return clashPrefs[idx];
  }

  function _trollClashSideScore(idx, side, currentSide, clashPrefs) {
    var score = side === currentSide ? 1 : 0;
    var pref = clashPrefs[idx] || {};
    if (pref.white) score += side === "town" ? 1000 : -1000;
    if (pref.dark) score += side !== "town" ? 100 : 0;
    return score;
  }

  function _trollCountRoleTeams(assignment, rolesDict) {
    var counts = {};
    for (var i = 0; i < assignment.length; i++) {
      var side = _trollRoleTeamKey(assignment[i], rolesDict);
      counts[side] = (counts[side] || 0) + 1;
    }
    return counts;
  }

  function _trollChooseClashTeamSides(assignment, teams, normNames, rolesDict, clashPrefs) {
    var idxs = teams.teamA.concat(teams.teamB);
    if (!idxs.length || !teams.teamA.length || !teams.teamB.length) return null;

    var teamByIdx = {};
    for (var a = 0; a < teams.teamA.length; a++) teamByIdx[teams.teamA[a]] = "A";
    for (var b = 0; b < teams.teamB.length; b++) teamByIdx[teams.teamB[b]] = "B";

    var counts = _trollCountRoleTeams(assignment, rolesDict);
    var sides = Object.keys(counts);
    if (sides.length < 2) return null;

    var bestDesired = null;
    var bestScore = -Infinity;
    var desired = {};
    var usedCounts = {};

    function canUseSide(idx, side) {
      if ((usedCounts[side] || 0) >= counts[side]) return false;
      var myTeam = teamByIdx[idx];
      var keys = Object.keys(desired);
      for (var i = 0; i < keys.length; i++) {
        var other = parseInt(keys[i], 10);
        if (teamByIdx[other] !== myTeam && desired[other] === side) return false;
      }
      return true;
    }

    function walk(pos, score) {
      if (pos >= idxs.length) {
        if (score > bestScore) {
          bestScore = score;
          bestDesired = {};
          var keys = Object.keys(desired);
          for (var k = 0; k < keys.length; k++) bestDesired[keys[k]] = desired[keys[k]];
        }
        return;
      }

      var idx = idxs[pos];
      var currentSide = _trollRoleTeamKey(assignment[idx], rolesDict);
      _trollClashPreferenceForIdx(clashPrefs, idx, normNames);
      for (var s = 0; s < sides.length; s++) {
        var side = sides[s];
        if (!canUseSide(idx, side)) continue;
        desired[idx] = side;
        usedCounts[side] = (usedCounts[side] || 0) + 1;
        walk(pos + 1, score + _trollClashSideScore(idx, side, currentSide, clashPrefs));
        usedCounts[side]--;
        delete desired[idx];
      }
    }

    walk(0, 0);
    return bestDesired;
  }

  function _trollApplyClashDesiredSides(assignment, desiredByIdx, normNames, rolesDict, clashPrefs) {
    var idxs = Object.keys(desiredByIdx).map(function(k) { return parseInt(k, 10); });
    var clashSet = new Set(idxs);
    var guard = idxs.length * 3 + 1;
    while (guard-- > 0) {
      var changed = false;
      for (var i = 0; i < idxs.length; i++) {
        var idx = idxs[i];
        var desiredSide = desiredByIdx[idx];
        var currentSide = _trollRoleTeamKey(assignment[idx], rolesDict);
        if (currentSide === desiredSide) continue;

        var partner = null;
        for (var j = 0; j < idxs.length; j++) {
          var other = idxs[j];
          if (other === idx) continue;
          var otherCurrent = _trollRoleTeamKey(assignment[other], rolesDict);
          var otherDesired = desiredByIdx[other];
          if (otherCurrent === desiredSide && otherDesired === currentSide) {
            partner = other;
            break;
          }
        }

        if (partner !== null) {
          _trollSwapRoles(assignment, idx, partner);
          changed = true;
          break;
        }

        var moved = _trollMoveIndexToSide(assignment, idx, desiredSide, normNames, rolesDict, function(donorIdx) {
          if (clashSet.has(donorIdx)) return false;
          var donorPref = _trollClashPreferenceForIdx(clashPrefs, donorIdx, normNames);
          if (desiredSide === "town") return !donorPref.white;
          return !donorPref.dark;
        }, false, _trollRoleTeamKey);
        if (moved) {
          changed = true;
          break;
        }
      }
      if (!changed) break;
    }
  }

  function _trollApplyClashRules(assignment, normNames, rolesDict) {
    var teams = _trollFindClashTeams(normNames);
    if (!teams.teamA.length || !teams.teamB.length) return;
    var clashPrefs = {};
    var desiredByIdx = _trollChooseClashTeamSides(assignment, teams, normNames, rolesDict, clashPrefs);
    if (!desiredByIdx) return;
    _trollApplyClashDesiredSides(assignment, desiredByIdx, normNames, rolesDict, clashPrefs);
  }

  function _trollApplyAssignmentRules(assignment, normNames, rolesDict) {
    if (!Array.isArray(assignment) || !Array.isArray(normNames)) return assignment;
    _trollApplyWhiteSideRules(assignment, normNames, rolesDict);
    _trollApplyDarkSideRules(assignment, normNames, rolesDict);
    _trollApplyClashRules(assignment, normNames, rolesDict);
    return assignment;
  }
  // --- end troll config ---

  function configure(overrides) {
    if (overrides && typeof overrides === "object") Object.assign(config, overrides);
  }

  function init(opts) {
    if (opts && typeof opts.getLegacyRecord === "function") getLegacyRecord = opts.getLegacyRecord;
  }

  function getRolesDict(rolesOpt) {
    const r = rolesOpt || (typeof roles !== "undefined" ? roles : null);
    return r && typeof r === "object" ? r : {};
  }

  function isTownRole(roleId, rolesDict) {
    const t = rolesDict[roleId] && rolesDict[roleId].teamFa;
    return t === "شهر";
  }

  /** Non-town = مافیا or مستقل (independents grouped with "stress" roles). */
  function isNonTownRole(roleId, rolesDict) {
    return !isTownRole(roleId, rolesDict);
  }

  function getRecentGamesNewestFirst(playerName) {
    if (!getLegacyRecord) return [];
    const rec = getLegacyRecord(playerName) || {};
    const games = Array.isArray(rec.recentGames) ? rec.recentGames : [];
    return games.slice().reverse();
  }

  /**
   * Fair-share deficit for non-town (bad side), **rate-based** so different history lengths compare fairly.
   * expectedRate = badSlotCount/nPlayers, actualRate = badCount/g. Higher = more "owed" non-town.
   * g===0: return expectedRate (same scale as a veteran who never had a bad role in a long window).
   */
  function badSideDeficit(playerName, rolesDict, nPlayers, badSlotCount) {
    if (badSlotCount <= 0 || nPlayers <= 0) return 0;
    const expectedRate = badSlotCount / nPlayers;
    const recentFirst = getRecentGamesNewestFirst(playerName);
    const window = recentFirst.slice(0, config.balanceWindow);
    const g = window.length;
    if (g === 0) return expectedRate;
    let badCount = 0;
    for (let i = 0; i < g; i++) {
      const rid = (window[i] && window[i].roleId) || "citizen";
      if (isNonTownRole(rid, rolesDict)) badCount++;
    }
    const actualRate = badCount / g;
    return expectedRate - actualRate;
  }

  /**
   * Fair-share multiplier: compare recent bad-game count to expected share.
   * @param {number} nPlayers
   * @param {number} badSlotCount — non-town slots this deal (from pool)
   */
  function balanceMultiplierForBadSide(playerName, rolesDict, nPlayers, badSlotCount) {
    if (!config.balanceMode || badSlotCount <= 0 || nPlayers <= 0) return 1;
    const { balanceWindow, balanceBoost, balancePenalty, minWeight } = config;
    const expectedRate = badSlotCount / nPlayers;
    const recentFirst = getRecentGamesNewestFirst(playerName);
    const window = recentFirst.slice(0, balanceWindow);
    const g = window.length;
    if (g === 0) return 1;
    let badCount = 0;
    for (let i = 0; i < g; i++) {
      const rid = (window[i] && window[i].roleId) || "citizen";
      if (isNonTownRole(rid, rolesDict)) badCount++;
    }
    const actualRate = badCount / g;
    const deficit = expectedRate - actualRate;
    const excess = actualRate - expectedRate;
    const denom = Math.max(0.05, expectedRate);
    let m = 1;
    if (deficit > 0) m *= 1 + balanceBoost * Math.min(3, deficit / denom);
    if (excess > 0) m /= 1 + balancePenalty * Math.min(3, excess / denom);
    return Math.max(minWeight * 0.5, m);
  }

  /**
   * Weight for selecting this player into a non-town slot (higher = more likely).
   * Recently non-town → lower weight (decay). Optional fair-share balance when nPlayers + badSlotCount passed.
   */
  function calcNonTownGroupWeight(playerName, rolesDict, nPlayers, badSlotCount) {
    const { sameGroupPenalty, recencyDecay, minWeight } = config;
    let decayPart = 1.0;
    const recentFirst = getRecentGamesNewestFirst(playerName);
    for (let i = 0; i < recentFirst.length; i++) {
      const rid = (recentFirst[i] && recentFirst[i].roleId) || "citizen";
      if (isNonTownRole(rid, rolesDict)) {
        const decay = Math.pow(recencyDecay, i);
        decayPart *= 1 - sameGroupPenalty * decay;
      }
    }
    decayPart = Math.max(decayPart, minWeight);
    let bal = 1;
    if (nPlayers != null && badSlotCount != null) {
      bal = balanceMultiplierForBadSide(playerName, rolesDict, nPlayers, badSlotCount);
    }
    return Math.max(minWeight, decayPart * bal);
  }

  /**
   * Count how many times this player had roleId in the first `len` entries of recentFirst (newest first).
   */
  function countRoleIdInRecent(recentFirst, roleId, len) {
    let n = 0;
    const cap = Math.min(recentFirst.length, len);
    for (let i = 0; i < cap; i++) {
      const past = (recentFirst[i] && recentFirst[i].roleId) || "citizen";
      if (past === roleId) n++;
    }
    return n;
  }

  /**
   * Weight for assigning this specific roleId to this player (higher = more likely).
   * Recently had same roleId → lower weight.
   * Optional per-role fair share: if nPlayers and countThisRoleInPool set, compare actual vs
   * expected (g × countInPool) / n for this role in balanceWindow — under → boost, over → penalty.
   */
  function calcRoleSlotWeight(playerName, roleId, nPlayers, countThisRoleInPool) {
    const { sameRolePenalty, recencyDecay, minWeight, balanceWindow, roleCoverageMode, roleCoverageBoost, roleCoveragePenalty } = config;
    let weight = 1.0;
    const recentFirst = getRecentGamesNewestFirst(playerName);
    for (let i = 0; i < recentFirst.length; i++) {
      const past = (recentFirst[i] && recentFirst[i].roleId) || "citizen";
      if (past === roleId) {
        const decay = Math.pow(recencyDecay, i);
        weight *= 1 - sameRolePenalty * decay;
      }
    }
    if (
      roleCoverageMode &&
      nPlayers > 0 &&
      countThisRoleInPool > 0 &&
      Number.isFinite(nPlayers) &&
      Number.isFinite(countThisRoleInPool)
    ) {
      const g = Math.min(recentFirst.length, balanceWindow);
      if (g > 0) {
        const had = countRoleIdInRecent(recentFirst, roleId, balanceWindow);
        const expected = (g * countThisRoleInPool) / nPlayers;
        const deficit = expected - had;
        const denom = Math.max(0.5, expected);
        if (deficit > 0) {
          weight *= 1 + roleCoverageBoost * Math.min(4, deficit / denom);
        } else if (deficit < 0) {
          weight /= 1 + roleCoveragePenalty * Math.min(4, (-deficit) / denom);
        }
      }
    }
    return Math.max(weight, minWeight);
  }

  function weightedPickIndex(items) {
    const total = items.reduce((s, x) => s + x.w, 0);
    if (total <= 0) return 0;
    let r = Math.random() * total;
    for (let j = 0; j < items.length; j++) {
      r -= items[j].w;
      if (r <= 0) return j;
    }
    return items.length - 1;
  }

  /**
   * @param {number[]} indices — player indices still available
   * @param {function(number): number} weightFn — weight for each index
   */
  function weightedSampleWithoutReplacementIndices(indices, weightFn, count) {
    const items = indices.map((idx) => ({ idx, weight: weightFn(idx) }));
    const selected = [];
    for (let k = 0; k < count && items.length > 0; k++) {
      const total = items.reduce((s, x) => s + x.weight, 0);
      let rand = Math.random() * total;
      let pick = 0;
      for (let j = 0; j < items.length; j++) {
        rand -= items[j].weight;
        if (rand <= 0) {
          pick = j;
          break;
        }
      }
      selected.push(items[pick].idx);
      items.splice(pick, 1);
    }
    return selected;
  }

  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Assign multiset roleSlots to playerIndices without replacement, weighted by role history.
   * @param {number[]} playerIndices
   * @param {string[]} roleSlots — multiset (same length as playerIndices)
   * @param {string[]} playerNames — full names array (for lookup by index)
   */
  function assignMultisetToGroup(playerIndices, roleSlots, playerNames, nPlayersTotal) {
    const slots = roleSlots.slice();
    shuffleInPlace(slots);
    const slotCounts = {};
    for (let si = 0; si < roleSlots.length; si++) {
      const r = roleSlots[si];
      slotCounts[r] = (slotCounts[r] || 0) + 1;
    }
    const remaining = new Set(playerIndices);
    const byIndex = {};
    for (const roleId of slots) {
      const pool = Array.from(remaining);
      if (pool.length === 0) break;
      const kInPool = slotCounts[roleId] || 1;
      const items = pool.map((idx) => ({
        idx,
        w: calcRoleSlotWeight(
          String((playerNames[idx] || "")).trim() || "__p" + (idx + 1),
          roleId,
          nPlayersTotal,
          kInPool,
        ),
      }));
      const pick = weightedPickIndex(items);
      const chosen = items[pick].idx;
      remaining.delete(chosen);
      byIndex[chosen] = roleId;
    }
    return byIndex;
  }

  /**
   * @param {string[]} pool — multiset, length n
   * @param {string[]} playerNames — length n
   * @param {{ roles?: object } | undefined} options
   * @returns {string[] | null} — roleId per player index, or null
   */
  function buildAssignment(pool, playerNames, options) {
    const rolesDict = getRolesDict(options && options.roles);
    const n = pool.length;
    if (!n || !playerNames || playerNames.length < n) return null;

    const townSlots = [];
    const nonTownSlots = [];
    for (const rid of pool) {
      if (isTownRole(rid, rolesDict)) townSlots.push(rid);
      else nonTownSlots.push(rid);
    }

    if (townSlots.length + nonTownSlots.length !== n) return null;

    const allIdx = Array.from({ length: n }, (_, i) => i);

    const badSlotCount = nonTownSlots.length;

    // Troll assignment mode starts from the normal fair assignment, then applies
    // probabilistic dark/white/clash nudges to avoid making the list hard-coded.
    const _trollNorms = playerNames.map(_trollNorm);
    const _trollActive = _isTrollAssignmentMode() && _trollHasAssignmentRule(_trollNorms);
    const _candidateIdx = allIdx;

    let nonTownPlayerIdxs = null;
    if (!nonTownPlayerIdxs) {
      if (config.groupPickMode === "weighted") {
        nonTownPlayerIdxs = weightedSampleWithoutReplacementIndices(
          _candidateIdx,
          (idx) => {
            const name = String((playerNames[idx] || "")).trim() || "__p" + (idx + 1);
            return calcNonTownGroupWeight(name, rolesDict, n, badSlotCount);
          },
          badSlotCount,
        );
      } else {
        const items = _candidateIdx.map((idx) => {
          const name = String((playerNames[idx] || "")).trim() || "__p" + (idx + 1);
          const d = badSideDeficit(name, rolesDict, n, badSlotCount);
          return { idx: idx, d: d };
        });
        items.sort(function (a, b) {
          if (b.d !== a.d) return b.d - a.d;
          return Math.random() - 0.5;
        });
        nonTownPlayerIdxs = items.slice(0, badSlotCount).map(function (x) {
          return x.idx;
        });
      }
    }

    const nonSet = new Set(nonTownPlayerIdxs);
    const townPlayerIdxs = allIdx.filter((i) => !nonSet.has(i));

    if (townPlayerIdxs.length !== townSlots.length) return null;

    const assignment = Array(n).fill(null);

    const nonTownMap = assignMultisetToGroup(nonTownPlayerIdxs, nonTownSlots, playerNames, n);
    const townMap = assignMultisetToGroup(townPlayerIdxs, townSlots, playerNames, n);

    for (const idx of nonTownPlayerIdxs) assignment[idx] = nonTownMap[idx];
    for (const idx of townPlayerIdxs) assignment[idx] = townMap[idx];

    if (assignment.some((r) => r == null)) return null;
    if (_trollActive) _trollApplyAssignmentRules(assignment, _trollNorms, rolesDict);
    return assignment;
  }

  return {
    configure,
    init,
    buildAssignment,
    // exposed for tests / debugging
    _calcNonTownGroupWeight: calcNonTownGroupWeight,
    _badSideDeficit: badSideDeficit,
    _balanceMultiplierForBadSide: balanceMultiplierForBadSide,
    _calcRoleSlotWeight: function (playerName, roleId, nPlayersOpt, countThisRoleInPoolOpt) {
      return calcRoleSlotWeight(playerName, roleId, nPlayersOpt, countThisRoleInPoolOpt);
    },
    _countRoleIdInRecent: countRoleIdInRecent,
    _trollConfig: {
      get triggerNames()   { return _TROLL_TRIGGER_RAW.slice(); },
      get darkNames()      { return _TROLL_DARK_RAW.slice(); },
      get mafiaNames()     { return _TROLL_DARK_RAW.slice(); },
      get blacklistNames() { return _TROLL_DARK_RAW.slice(); },
      get clashTeams()     { return {
        teamA: _TROLL_CLASH_TEAMS_RAW.teamA.map(function(aliases) { return aliases.slice(); }),
        teamB: _TROLL_CLASH_TEAMS_RAW.teamB.map(function(aliases) { return aliases.slice(); }),
      }; },
      get whitelistNames() { return _TROLL_WHITELIST_RAW.slice(); },
      get whitelistProb()  { return _TROLL_WHITELIST_PROB; },
      get prob()           { return _TROLL_PROB; },
      get mode()           { return _trollMode(); },
      get enabled()        { return _isTrollSystemEnabled(); },
      get assignmentMode() { return _isTrollAssignmentMode(); },
      get deviceLockMode() { return _isTrollDeviceLockMode(); },
      isTarget:     function(name) { return _trollIsDarkName(_trollNorm(name)); },
      isBlacklisted:function(name) { return _trollIsDarkName(_trollNorm(name)); },
      isWhitelisted:function(name) { return _trollNameMatches(_trollNorm(name), _TROLL_WHITELIST_NORM); },
      isTriggered:  function(names) { return _isTrollSystemEnabled() && Array.isArray(names) && _isTrollTriggered(names.map(_trollNorm)); },
      getLockTargets: _trollLockTargets,
      getTriggerMatches: _trollTriggerMatches,
      shouldLock: function(names) { return _isTrollDeviceLockMode() && Array.isArray(names) && _isTrollTriggered(names.map(_trollNorm)); },
    },
  };
})();
