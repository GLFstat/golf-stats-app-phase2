// =========================
// SUPABASE / DOM REFERENCES
// =========================

const SUPABASE_URL = "https://xncgytnnekaytqmypdqv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_UiLB55XsY_iD9m_wUNlSwA_UEjBa5fR";

const portalSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const listEl = document.getElementById("liveRoundsList");
const detailsEl = document.getElementById("roundDetails");
const refreshBtn = document.getElementById("refreshBtn");
const clearFinishedBtn = document.getElementById("clearFinishedBtn");
const clearLiveBtn = document.getElementById("clearLiveBtn");
const maintenanceStatsEl = document.getElementById("maintenanceStats");
const logoutBtn = document.getElementById("logoutBtn");

const portalModalOverlay = document.getElementById("portalModalOverlay");
const portalModalTitle = document.getElementById("portalModalTitle");
const portalModalMessage = document.getElementById("portalModalMessage");
const portalModalSummaryWrap = document.getElementById("portalModalSummaryWrap");
const portalRoundSummaryTable = document.getElementById("portalRoundSummaryTable");
const portalModalActions = document.getElementById("portalModalActions");
const portalModalCancelBtn = document.getElementById("portalModalCancelBtn");
const portalModalConfirmBtn = document.getElementById("portalModalConfirmBtn");

let currentPortalModalResolver = null;
let liveRoundsCache = [];
let currentRounds = [];



// =========================
// ADMIN LOGIN
// Portal stays visible by default.
// Login popup opens only when Log In is tapped.
// =========================

const ADMIN_PASSWORD = "fairway123";
const ADMIN_LOGIN_KEY = "strackerAdminLoggedIn";

function showAdminLogin() {
  const overlay = document.getElementById("adminLoginOverlay");
  if (overlay) overlay.style.display = "flex";
}

function hideAdminLogin() {
  const overlay = document.getElementById("adminLoginOverlay");
  if (overlay) overlay.style.display = "none";
}

function isAdminLoggedIn() {
  return localStorage.getItem(ADMIN_LOGIN_KEY) === "true";
}

function setAdminLoggedIn(value) {
  localStorage.setItem(ADMIN_LOGIN_KEY, value ? "true" : "false");
}

function updateAdminHeaderButtons() {
  const loginBtn = document.getElementById("loginBtn");
  const brandingBtn = document.getElementById("openBrandingModalBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const loggedIn = isAdminLoggedIn();

  if (loginBtn) {
    loginBtn.classList.toggle("hidden", loggedIn);
  }

  if (brandingBtn) {
    brandingBtn.classList.toggle("hidden", !loggedIn);
  }

  if (logoutBtn) {
    logoutBtn.classList.toggle("hidden", !loggedIn);
  }
}

function handleAdminLogin() {
  const passwordInput = document.getElementById("adminPasswordInput");
  const errorBox = document.getElementById("adminLoginError");

  if (!passwordInput || !errorBox) return;

  const enteredPassword = passwordInput.value.trim();

  if (enteredPassword === ADMIN_PASSWORD) {
    setAdminLoggedIn(true);
    hideAdminLogin();
    updateAdminHeaderButtons();
    errorBox.textContent = "";
    passwordInput.value = "";
  } else {
    errorBox.textContent = "Incorrect password.";
  }
}

function handleAdminLogout() {
  setAdminLoggedIn(false);
  hideAdminLogin();
  updateAdminHeaderButtons();

  const passwordInput = document.getElementById("adminPasswordInput");
  const errorBox = document.getElementById("adminLoginError");

  if (passwordInput) passwordInput.value = "";
  if (errorBox) errorBox.textContent = "";
}

function initAdminLogin() {
  const loginBtn = document.getElementById("loginBtn");
  const loginSubmitBtn = document.getElementById("adminLoginBtn");
  const closeAdminLoginBtn = document.getElementById("closeAdminLoginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const passwordInput = document.getElementById("adminPasswordInput");

  // Portal should always be visible on page load.
  // Keep popup hidden until user taps Log In.
  hideAdminLogin();
  updateAdminHeaderButtons();

  if (loginBtn) {
    loginBtn.addEventListener("click", showAdminLogin);
  }

  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener("click", handleAdminLogin);
  }

  if (closeAdminLoginBtn) {
    closeAdminLoginBtn.addEventListener("click", hideAdminLogin);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleAdminLogout);
  }

  if (passwordInput) {
    passwordInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        handleAdminLogin();
      }
    });
  }
}



function closePortalModal() {
  const modalCard = portalModalOverlay?.querySelector(".portal-modal-card");
  if (modalCard) {
    modalCard.classList.remove("hole-detail-modal");
  }

  if (portalModalOverlay) portalModalOverlay.classList.add("hidden");
  if (portalModalTitle) portalModalTitle.textContent = "Notice";
  if (portalModalMessage) portalModalMessage.innerHTML = "";
  if (portalRoundSummaryTable) portalRoundSummaryTable.innerHTML = "";
  if (portalModalSummaryWrap) portalModalSummaryWrap.classList.add("hidden");
  if (portalModalCancelBtn) portalModalCancelBtn.classList.remove("hidden");
  if (portalModalConfirmBtn) portalModalConfirmBtn.textContent = "OK";
  currentPortalModalResolver = null;
}

// =========================
// PORTAL MODAL HELPERS
// Shared alert / confirm / summary modal functions.
// =========================

function showPortalAlert(title, message, confirmText = "OK") {
  return new Promise((resolve) => {
    if (
      !portalModalOverlay ||
      !portalModalTitle ||
      !portalModalMessage ||
      !portalModalCancelBtn ||
      !portalModalConfirmBtn ||
      !portalModalSummaryWrap ||
      !portalRoundSummaryTable
    ) {
      window.alert(message.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, ""));
      resolve(true);
      return;
    }

    currentPortalModalResolver = resolve;

    portalModalTitle.textContent = title || "Notice";
    portalModalMessage.innerHTML = message || "";
    portalModalSummaryWrap.classList.add("hidden");
    portalRoundSummaryTable.innerHTML = "";
    portalModalCancelBtn.classList.add("hidden");
    portalModalConfirmBtn.textContent = confirmText;

    portalModalOverlay.classList.remove("hidden");

    portalModalConfirmBtn.onclick = () => {
      closePortalModal();
      resolve(true);
    };

    portalModalCancelBtn.onclick = () => {
      closePortalModal();
      resolve(false);
    };
  });
}

function showPortalConfirm(title, message, confirmText = "Confirm", cancelText = "Cancel") {
  return new Promise((resolve) => {
    if (
      !portalModalOverlay ||
      !portalModalTitle ||
      !portalModalMessage ||
      !portalModalCancelBtn ||
      !portalModalConfirmBtn ||
      !portalModalSummaryWrap ||
      !portalRoundSummaryTable
    ) {
      const plainMessage = message.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "");
      resolve(window.confirm(plainMessage));
      return;
    }

    currentPortalModalResolver = resolve;

    portalModalTitle.textContent = title || "Please confirm";
    portalModalMessage.innerHTML = message || "";
    portalModalSummaryWrap.classList.add("hidden");
    portalRoundSummaryTable.innerHTML = "";
    portalModalCancelBtn.classList.remove("hidden");
    portalModalCancelBtn.textContent = cancelText;
    portalModalConfirmBtn.textContent = confirmText;

    portalModalOverlay.classList.remove("hidden");

    portalModalConfirmBtn.onclick = () => {
      closePortalModal();
      resolve(true);
    };

    portalModalCancelBtn.onclick = () => {
      closePortalModal();
      resolve(false);
    };
  });
}

function showPortalSummaryModal(title, htmlTable) {
  if (
    !portalModalOverlay ||
    !portalModalTitle ||
    !portalModalMessage ||
    !portalModalCancelBtn ||
    !portalModalConfirmBtn ||
    !portalModalSummaryWrap ||
    !portalRoundSummaryTable
  ) {
    window.alert("Summary modal is not available yet.");
    return;
  }

  portalModalTitle.textContent = title || "Round Summary";
  portalModalMessage.innerHTML = "";
  portalModalSummaryWrap.classList.remove("hidden");
  portalRoundSummaryTable.innerHTML = htmlTable || "<div>No summary available.</div>";
  portalModalCancelBtn.classList.add("hidden");
  portalModalConfirmBtn.textContent = "Close";
  portalModalOverlay.classList.remove("hidden");

  portalModalConfirmBtn.onclick = () => {
    closePortalModal();
  };
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && portalModalOverlay && !portalModalOverlay.classList.contains("hidden")) {
    closePortalModal();
  }
});

if (portalModalOverlay) {
  portalModalOverlay.addEventListener("click", (event) => {
    if (event.target === portalModalOverlay) {
      closePortalModal();
    }
  });
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", loadLiveRounds);
}

if (clearFinishedBtn) {
  clearFinishedBtn.addEventListener("click", clearFinished);
}

if (clearLiveBtn) {
  clearLiveBtn.addEventListener("click", clearLiveSnapshots);
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
  
  });
}

async function loadLastCompletedRound() {
  const card = document.getElementById("latestCompletedRound");
  if (!card) return;

  card.innerHTML = `<p>No completed round found yet.</p>`;
  console.log("loadLastCompletedRound started");

const { data, error } = await portalSupabase
  .from("completed_rounds")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(1);

  console.log("Completed rounds data:", data, "Error:", error);

  if (error) {
    console.error("Error loading last completed round:", error);
    card.innerHTML = `<p>Could not load completed round.</p>`;
    return;
  }

  if (!data || !data.length) {
    card.innerHTML = `<p>No completed round found yet.</p>`;
    return;
  }

  const round = data[0];
  lastCompletedRoundData = round;

  const playerName =
    round.player_name ||
    round.player ||
    round.golfer_name ||
    "Player";

  const courseName =
    round.course_name ||
    round.course ||
    round.details?.courseName ||
    "Unknown Course";

  const summary =
    round.summary_json ||
    round.summary ||
    round.round_summary ||
    {};

  const totalScore =
    round.total_score ??
    summary.totalScore ??
    summary.total_score ??
    "—";

  const toParRaw =
    round.to_par ??
    round.vs_par ??
    summary.vsPar ??
    summary.toPar ??
    summary.to_par ??
    null;

  let toParText = "E";
  if (toParRaw !== null && toParRaw !== undefined && toParRaw !== "") {
    const num = Number(toParRaw);
    if (!Number.isNaN(num)) {
      if (num > 0) toParText = `+${num}`;
      else if (num < 0) toParText = `${num}`;
      else toParText = "E";
    }
  }

  const finishedDate =
    round.finished_at ||
    round.completed_at ||
    round.updated_at ||
    round.created_at ||
    round.round_date ||
    null;

  let finishedText = "No date";
  if (finishedDate) {
    const d = new Date(finishedDate);
    if (!Number.isNaN(d.getTime())) {
      finishedText = d.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
  }

card.innerHTML = `
  <table class="rounds-table">
    <thead>
      <tr>
        <th>Course</th>
        <th>Date</th>
        <th>Score</th>
        <th>To Par</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${courseName}</td>
        <td>${finishedText.replace(", ", ",<br>")}</td>
        <td>${totalScore}</td>
        <td>${toParText}</td>
        <td>
          <button class="round-action-btn summary-btn" onclick="openCompletedSummary()">Summary</button>
        </td>
      </tr>
    </tbody>
  </table>
`;
}
  // Summary modal  for View Summary 

let lastCompletedRoundData = null;

function closeCompletedSummary() {
  const modal = document.getElementById("completedSummaryModal");
  if (modal) modal.classList.add("hidden");
}

function formatToParText(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "E";
  if (num > 0) return `+${num}`;
  if (num < 0) return `${num}`;
  return "E";
}


// =========================
// COMPLETED ROUND SUMMARY BUILDER
// Builds the completed-round summary popup content.
// =========================

function buildCompletedSummaryHtml(payload, round) {
  const holes = Array.isArray(payload?.holes) ? payload.holes : [];

  function isYes(value) {
  return (
    value === true ||
    value === "true" ||
    value === "TRUE" ||
    value === 1 ||
    value === "1" ||
    value === "yes" ||
    value === "Yes" ||
    value === "Y" ||
    value === "y"
  );
}

  function getPenaltyCount(hole) {
    const raw =
      hole?.penalties ??
      hole?.penalty ??
      hole?.penaltyStrokes ??
      hole?.penalty_strokes ??
      0;

    const num = Number(raw);
    return Number.isNaN(num) ? 0 : num;
  }

  function getUpDownValue(hole) {
  return (
    hole?.upAndDown ??
    hole?.up_and_down ??
    hole?.up_down ??
    hole?.upDown ??
    hole?.updown ??
    hole?.upDowns ??
    hole?.up_downs ??
    null
  );
}

  function getSandSaveValue(hole) {
    return hole?.sandSave ?? hole?.sand_save ?? hole?.sand ?? null;
  }

  const totalScore = round?.total_score ?? "—";
  const toPar = round?.vs_par ?? 0;
  const totalPutts = round?.total_putts ?? "—";
  const firPct = round?.fir_pct ?? "—";
  const girPct = round?.gir_pct ?? "—";

  const upDownTotal = holes.reduce((sum, hole) => {
    return sum + (isYes(getUpDownValue(hole)) ? 1 : 0);
  }, 0);

  const sandSaveTotal = holes.reduce((sum, hole) => {
    return sum + (isYes(getSandSaveValue(hole)) ? 1 : 0);
  }, 0);

  const penaltiesTotal = holes.reduce((sum, hole) => {
    return sum + getPenaltyCount(hole);
  }, 0);

const topCards = `
  <div class="summary-top-grid">

    <div class="summary-stat-card">
      <div class="summary-stat-label">Score</div>
      <div class="summary-stat-value">${totalScore}</div>
    </div>

    <div class="summary-stat-card">
      <div class="summary-stat-label">To Par</div>
      <div class="summary-stat-value">${formatToParText(toPar)}</div>
    </div>

    <div class="summary-stat-card">
      <div class="summary-stat-label">FIR %</div>
      <div class="summary-stat-value">${firPct}%</div>
    </div>

     <div class="summary-stat-card">
      <div class="summary-stat-label">GIR %</div>
      <div class="summary-stat-value">${girPct}%</div>
    </div>


    <div class="summary-stat-card">
      <div class="summary-stat-label">Putts</div>
      <div class="summary-stat-value">${totalPutts}</div>
    </div>

      <div class="summary-stat-card">
      <div class="summary-stat-label">Up & Downs</div>
      <div class="summary-stat-value">${upDownTotal}</div>
    </div>

    <div class="summary-stat-card">
      <div class="summary-stat-label">GIR %</div>
      <div class="summary-stat-value">${girPct}%</div>
    </div>

    <div class="summary-stat-card">
      <div class="summary-stat-label">Sand Saves</div>
      <div class="summary-stat-value">${sandSaveTotal}</div>
    </div>

    <div class="summary-stat-card">
      <div class="summary-stat-label">Penalties</div>
      <div class="summary-stat-value">${penaltiesTotal}</div>
    </div>

  </div>
`;

  if (!holes.length) {
    return topCards + `<p>No hole-by-hole data found.</p>`;
  }

const rows = holes.map((hole, index) => {
  const holeNum = hole?.hole ?? index + 1;
  const par = hole?.par ?? "—";
  const rawScore = hole?.score ?? null;
  const putts = hole?.putts ?? "—";

  let scoreDisplay = "—";
  let scoreClass = "";

  const parNum = Number(par);
  const scoreNum = Number(rawScore);

  if (!Number.isNaN(parNum) && !Number.isNaN(scoreNum)) {
    const diff = scoreNum - parNum;

    if (diff === 0) {
      scoreDisplay = "E";
      scoreClass = "score-even";
    } else if (diff < 0) {
      scoreDisplay = `${diff}`;
      scoreClass = "score-under";
    } else {
      scoreDisplay = `+${diff}`;
      scoreClass = "score-over";
    }
  }

  const fir =
    hole?.fir === true ? "Y" :
    hole?.fir === false ? "N" :
    "—";

  const gir =
    hole?.gir === true ? "Y" :
    hole?.gir === false ? "N" :
    "—";

  const upDownRaw = getUpDownValue(hole);

  const upDown =
    isYes(upDownRaw) ? "Y" :
    upDownRaw === false || upDownRaw === "false" || upDownRaw === "N" || upDownRaw === "n" || upDownRaw === "No" || upDownRaw === "no"
      ? "N"
      : "—";

  const sandSave =
    isYes(getSandSaveValue(hole)) ? "Y" :
    getSandSaveValue(hole) === false ? "N" :
    "—";

  const penalties = getPenaltyCount(hole);

  return `
  <tr>
  <td>${holeNum}</td>
  <td>${par}</td>
  <td class="${scoreClass}"><strong>${scoreDisplay}</strong></td>
  <td>${fir === "Y" ? "<strong>Y</strong>" : fir}</td>
  <td>${gir === "Y" ? "<strong>Y</strong>" : gir}</td>
  <td>${putts}</td>
  <td>${upDown === "Y" ? "<strong>Y</strong>" : upDown}</td>
  <td>${sandSave === "Y" ? "<strong>Y</strong>" : sandSave}</td>
  <td>${penalties}</td>
  </tr
  `;
}).join("");

  return `
    ${topCards}

    <div class="summary-hole-section-title">Hole Details</div>

    <div class="summary-hole-table-wrap">
      <table class="summary-hole-table">
        <thead>
          <tr>
          <tr>
<tr>
  <th>Hole</th>
  <th>Par</th>
  <th>Score</th>
  <th>FIR</th>
  <th>GIR</th>
  <th>Putts</th>
  <th>U&D</th>
  <th>SndSv</th>
  <th>Pnlty</th>
</tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

async function openCompletedSummary() {
  if (!lastCompletedRoundData) {
    alert("No round data available.");
    return;
  }

  const payload = lastCompletedRoundData.round_payload;

  if (!payload) {
    alert("No round payload found.");
    return;
  }

  const modal = document.getElementById("completedSummaryModal");
  const titleEl = document.getElementById("completedSummaryTitle");
  const metaEl = document.getElementById("completedSummaryMeta");
  const bodyEl = document.getElementById("completedSummaryBody");

  if (!modal || !titleEl || !metaEl || !bodyEl) {
    alert("Summary popup elements not found.");
    return;
  }

const courseName = lastCompletedRoundData.course_name || "Course";
const playerName = lastCompletedRoundData.player_name || "Player";
const roundDate = lastCompletedRoundData.round_date || "";
const roundType =
  lastCompletedRoundData.round_type ||
  lastCompletedRoundData.type ||
  "Round";

titleEl.textContent = `${playerName} — ${courseName}`;
metaEl.textContent = `${roundDate}  -  ${roundType}`;
bodyEl.innerHTML = buildCompletedSummaryHtml(payload, lastCompletedRoundData);

modal.classList.remove("hidden");
}



async function loadLiveRounds() {
  listEl.innerHTML = "Loading...";

  const { data, error } = await portalSupabase
    .from("live_round_status")
    .select("*")
    .order("last_update", { ascending: false });

  if (error) {
    console.error("Error loading live rounds:", error);
    listEl.innerHTML = `<div style="padding:16px;">Error loading rounds.</div>`;
    detailsEl.innerHTML = `<div class="live-round-content empty">Error loading round details.</div>`;
    maintenanceStatsEl.textContent = "Records: error";
    return;
  }

  currentRounds = data || [];
  renderCompletedRounds(currentRounds);
  renderMaintenanceStats(currentRounds);

  if (currentRounds.length > 0) {
    const activeRound = currentRounds.find((round) => {
      const holesCompleted = Number(round.holes_completed || 0);
      return holesCompleted < 18;
    }) || currentRounds[0];

    showDetails(activeRound);
  } else {
    detailsEl.innerHTML = `<div class="live-round-content empty">No live round snapshots found.</div>`;
  }
}

function renderCompletedRounds(rounds) {
  if (!rounds.length) {
    listEl.innerHTML = `<div style="padding:16px 20px;">No rounds found.</div>`;
    return;
  }

  let html = `
    <table class="rounds-table">
      <thead>
        <tr>
          <th>Course</th>
          <th>Date</th>
          <th>Score</th>
          <th>Test</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  rounds.forEach((round) => {
    const liveDisplayDate =
  round.last_update ||
  round.updated_at ||
  round.created_at ||
  round.round_date;

const dateText = formatDate(liveDisplayDate);
    const isTest = isTestRound(round);

    html += `
      <tr>
        <td>${escapeHtml(round.course_name || "Unknown Course")}</td>
        <td>${escapeHtml(dateText)}</td>
        <td>${escapeHtml(getLiveRoundScoreDisplay(round))}</td>
        <td>${isTest ? `<span class="check-mark">✓</span>` : ``}</td>
        <td>
          <button
            class="round-action-btn"
            type="button"
            onclick='deleteRound(${JSON.stringify(round.session_id || "")}, ${JSON.stringify(round.course_name || "Unknown Course")}, ${JSON.stringify(round.status || "")}, ${JSON.stringify(round.round_date || "")})'
          >
            Delete
          </button>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  listEl.innerHTML = html;
}

// Build hole tile summary popup

function getNumericValueOrNull(value) {
  if (value == null || value === "") return null;

  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatHoleResult(hole) {
  if (!hole || !hole.saved) return "--";

  const score = getNumericValueOrNull(getHoleScore(hole));
  if (score == null) return "--";

  const par = getNumericValueOrNull(getHolePar(hole));
  if (par == null) {
    return String(score);
  }

  const vsPar = score - par;

  if (vsPar === 0) return "E";
  if (vsPar > 0) return `+${vsPar}`;
  return `${vsPar}`;
}

function formatHoleFlag(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value == null || value === "") return "--";
  return String(value);
}

function getHoleNumber(hole, index) {
  return hole?.holeNumber ?? hole?.hole_number ?? hole?.number ?? (index + 1);
}

function getHolePar(hole) {
  return hole?.par
    ?? hole?.holePar
    ?? hole?.hole_par
    ?? hole?.selectedPar
    ?? hole?.selected_par
    ?? hole?.parValue
    ?? hole?.holeParValue
    ?? hole?.teePar
    ?? hole?.coursePar
    ?? null;
}

function getHolePutts(hole) {
  return hole?.putts ?? hole?.puttCount ?? hole?.putts_taken ?? null;
}

function getHoleScore(hole) {
  return hole?.score ?? hole?.strokes ?? null;
}

function getHoleFirValue(hole) {
  return hole?.fairway_hit ?? hole?.fir ?? hole?.fairwayHit ?? null;
}

function getRoundVsParFromHoles(round) {
  const holes = Array.isArray(round?.holes_json) ? round.holes_json : [];
  const savedHoles = holes.filter(h => h && h.saved);

  if (!savedHoles.length) return null;

  let totalScore = 0;
  let totalPar = 0;

  savedHoles.forEach((hole) => {
    const score = getNumericValueOrNull(getHoleScore(hole));
    const par = getNumericValueOrNull(getHolePar(hole));

    if (score != null) totalScore += score;
    if (par != null) totalPar += par;
  });

  if (!totalPar) return null;

  return totalScore - totalPar;
}

function getHoleGirValue(hole) {
  return hole?.gir ?? hole?.green_in_regulation ?? hole?.greenInRegulation ?? null;
}

function getHoleUpDownValue(hole) {
  return hole?.up_down ?? hole?.upDown ?? hole?.up_and_down ?? hole?.updown ?? null;
}

function getHoleSandSaveValue(hole) {
  return hole?.sand_save ?? hole?.sandSave ?? hole?.sand_save_made ?? null;
}

function getHolePenaltiesValue(hole) {
  return hole?.penalties ?? hole?.penalty ?? hole?.penaltyStrokes ?? null;
}

function formatHoleYesNoNA(value, fallback = "--") {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value == null || value === "") return fallback;
  return String(value);
}

function showPortalHoleDetailModal(title, htmlContent) {
  if (
    !portalModalOverlay ||
    !portalModalTitle ||
    !portalModalMessage ||
    !portalModalCancelBtn ||
    !portalModalConfirmBtn ||
    !portalModalSummaryWrap ||
    !portalRoundSummaryTable
  ) {
    window.alert("Hole detail popup is not available.");
    return;
  }

  const modalCard = portalModalOverlay.querySelector(".portal-modal-card");
  if (modalCard) {
    modalCard.classList.add("hole-detail-modal");
  }

  portalModalTitle.textContent = title || "Hole Details";
  portalModalMessage.innerHTML = "";
  portalModalSummaryWrap.classList.remove("hidden");
  portalRoundSummaryTable.innerHTML = htmlContent || "<div>No hole data available.</div>";
  portalModalCancelBtn.classList.add("hidden");
  portalModalConfirmBtn.textContent = "Close";
  portalModalOverlay.classList.remove("hidden");

  portalModalConfirmBtn.onclick = () => {
    closePortalModal();
  };

  portalModalCancelBtn.onclick = () => {
    closePortalModal();
  };
}

function openLiveHoleDetail(index) {
  const round = window.currentLiveRoundForSummary;
  if (!round) return;

  const holes = Array.isArray(round.holes_json) ? round.holes_json : [];
  const hole = holes[index];
  if (!hole) return;

  const holeNumber = getHoleNumber(hole, index);
  const parValue = getHolePar(hole);
  const puttsValue = getHolePutts(hole);
  const firValue = getHoleFirValue(hole);
  const girValue = getHoleGirValue(hole);
  const upDownValue = getHoleUpDownValue(hole);
  const sandSaveValue = getHoleSandSaveValue(hole);
  const penaltiesValue = getHolePenaltiesValue(hole);
  const result = formatHoleResult(hole);

  const parNumber = getNumericValueOrNull(parValue);

  const firDisplay = parNumber === 3
    ? "N/A"
    : formatHoleYesNoNA(firValue);

  const girDisplay = formatHoleYesNoNA(girValue);
  const upDownDisplay = formatHoleYesNoNA(upDownValue);
  const sandSaveDisplay = formatHoleYesNoNA(sandSaveValue);
  const penaltiesDisplay =
    penaltiesValue == null || penaltiesValue === "" ? "--" : String(penaltiesValue);

  const htmlContent = `
    <div class="hole-detail-popup">
      <div class="hole-detail-grid">
        <div class="hole-detail-item">
          <div class="hole-detail-label">Result</div>
          <div class="hole-detail-value">${escapeHtml(result)}</div>
        </div>

        <div class="hole-detail-item">
          <div class="hole-detail-label">Par</div>
          <div class="hole-detail-value">${escapeHtml(parValue == null ? "--" : String(parValue))}</div>
        </div>

        <div class="hole-detail-item">
          <div class="hole-detail-label">Putts</div>
          <div class="hole-detail-value">${escapeHtml(puttsValue == null ? "--" : String(puttsValue))}</div>
        </div>

        <div class="hole-detail-item">
          <div class="hole-detail-label">FIR</div>
          <div class="hole-detail-value">${escapeHtml(firDisplay)}</div>
        </div>

        <div class="hole-detail-item">
          <div class="hole-detail-label">GIR</div>
          <div class="hole-detail-value">${escapeHtml(girDisplay)}</div>
        </div>

        <div class="hole-detail-item">
          <div class="hole-detail-label">Up & Downs</div>
          <div class="hole-detail-value">${escapeHtml(upDownDisplay)}</div>
        </div>

        <div class="hole-detail-item">
          <div class="hole-detail-label">Sand Saves</div>
          <div class="hole-detail-value">${escapeHtml(sandSaveDisplay)}</div>
        </div>

        <div class="hole-detail-item">
          <div class="hole-detail-label">Penalties</div>
          <div class="hole-detail-value">${escapeHtml(penaltiesDisplay)}</div>
        </div>
      </div>
    </div>
  `;

  showPortalHoleDetailModal(`Hole ${holeNumber} Details`, htmlContent);
}


// =========================
// LIVE ROUND DETAIL PANEL
// Main right-side portal detail area, not the popup summary.
// =========================

function showDetails(round) {
  window.currentLiveRoundForSummary = round;

  const holes = Array.isArray(round.holes_json) ? round.holes_json : [];
  const holeDisplay = round.current_hole || holes.filter((h) => h.saved).length || 0;
  const roundVsPar = getRoundVsParFromHoles(round);
  const lastUpdateText = getLastUpdateText(round.last_update);

  const lastUpdateEl = document.getElementById("liveRoundLastUpdate");
  if (lastUpdateEl) {
    lastUpdateEl.textContent = lastUpdateText;
  }

  const savedHoles = holes.filter((h) => h && h.saved);
  const lastSavedHole = savedHoles.length ? savedHoles[savedHoles.length - 1] : null;

  const lastHoleNumber = lastSavedHole
    ? getHoleNumber(lastSavedHole, savedHoles.length - 1)
    : "--";

  const lastHoleParValue = lastSavedHole ? getHolePar(lastSavedHole) : null;
  const lastHolePuttsValue = lastSavedHole ? getHolePutts(lastSavedHole) : null;

  const lastHolePar = lastHoleParValue == null ? "--" : lastHoleParValue;
  const lastHolePutts = lastHolePuttsValue == null ? "--" : lastHolePuttsValue;

  let holesHtml = `<div class="holes-grid">`;

  holes.forEach((h, index) => {
    let display = "-";
    let resultClass = "";

    if (h && h.saved) {
      const par = getNumericValueOrNull(getHolePar(h));
      const score = getNumericValueOrNull(getHoleScore(h));

      if (score != null) {
        if (par != null) {
          const vsPar = score - par;

          display = vsPar === 0
            ? "E"
            : vsPar > 0
              ? `+${vsPar}`
              : `${vsPar}`;

          if (vsPar < 0) {
            resultClass = "hole-birdie";
          } else if (vsPar === 0) {
            resultClass = "hole-par";
          } else {
            resultClass = "hole-bogey";
          }
        } else {
          display = String(score);
          resultClass = "";
        }
      }
    }

    holesHtml += `
      <div class="hole ${h && h.saved ? "saved" : ""} ${resultClass}" onclick="openLiveHoleDetail(${index})">
        <div class="hole-number">Hole ${escapeHtml(String(getHoleNumber(h, index)))}</div>
        <div class="hole-score">${escapeHtml(display)}</div>
      </div>
    `;
  });

  holesHtml += `</div>`;

  detailsEl.innerHTML = `
    <div class="live-player-row">
      <div>
        <div class="live-player-name">${
  escapeHtml(
    (round.player_name && round.player_name.trim())
      ? round.player_name
      : "I Gonzales"
  )
}</div>
        <div class="live-course-name">${escapeHtml(round.course_name || "Unknown Course")}</div>
      </div>

      <div class="live-hole-box">
        <div class="live-hole-number">${escapeHtml(String(holeDisplay))}</div>
        <div class="live-hole-of">of 18</div>
      </div>
    </div>

    <div class="live-stats-list">
      <div class="live-stat-line total-score-line">
        <strong>Total Score:</strong>
        <span class="total-score-value">
          ${escapeHtml(String(round.total_score ?? 0))} (${escapeHtml(formatScore(roundVsPar ?? 0, true))} thru ${escapeHtml(String(round.holes_completed ?? 0))})
        </span>
      </div>
      <div class="live-stat-line"><strong>Total Putts:</strong> ${escapeHtml(String(round.total_putts ?? 0))} (thru ${escapeHtml(String(round.holes_completed ?? 0))})</div>
      <div class="live-stat-line"><strong>FIR:</strong> ${escapeHtml(String(round.total_fir ?? 0))} (${escapeHtml(String(round.holes_completed ? Math.round(((round.total_fir ?? 0) / round.holes_completed) * 100) : 0))}% thru ${escapeHtml(String(round.holes_completed ?? 0))})</div>
      <div class="live-stat-line"><strong>GIR:</strong> ${escapeHtml(String(round.total_gir ?? 0))} (${escapeHtml(String(round.holes_completed ? Math.round(((round.total_gir ?? 0) / round.holes_completed) * 100) : 0))}% thru ${escapeHtml(String(round.holes_completed ?? 0))})</div>
      <div class="live-stat-line"><strong>Up & Downs:</strong> ${escapeHtml(String(round.total_up_downs ?? 0))}</div>
      <div class="live-stat-line"><strong>Last Hole:</strong> ${escapeHtml(String(lastHoleNumber))}</div>
      <div class="live-stat-line"><strong>Last Hole Score:</strong> ${escapeHtml(String(getHoleScore(lastSavedHole) ?? "--"))}</div>
      <div class="live-stat-line"><strong>Last Hole Par:</strong> ${escapeHtml(String(lastHolePar))}</div>
      <div class="live-stat-line"><strong>Last Hole Putts:</strong> ${escapeHtml(String(lastHolePutts))}</div>
      <div class="live-stat-line live-tile-hint">Tap a tile for hole details</div>
    </div>

    ${holesHtml}

    <div class="live-footer-row">
      <button class="refresh-main-btn" type="button" onclick="loadLiveRounds()">Refresh</button>
    </div>
  `;
}

function renderMaintenanceStats(rounds) {
  const testCount = rounds.filter(isTestRound).length;
  maintenanceStatsEl.textContent = `Records: ${rounds.length} total, ${testCount} test round(s)`;
}

function formatScore(score, withPlus = false) {
  const num = Number(score);

  if (!Number.isFinite(num)) return "--";
  if (num === 0) return withPlus ? "E" : "EVEN";
  if (num > 0) return `+${num}`;
  return String(num);
}

function formatDate(value) {
  if (!value) return "--";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatDateTime(value) {
  if (!value) return "--";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getLastUpdateText(lastUpdate) {
  if (!lastUpdate) return "Last update: unavailable";

  const updatedMs = new Date(lastUpdate).getTime();
  if (!updatedMs) return "Last update: unavailable";

  const diffMs = Date.now() - updatedMs;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Last update: just now";
  if (diffMinutes === 1) return "Last update: 1 minute ago";
  if (diffMinutes < 60) return `Last update: ${diffMinutes} minutes ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return "Last update: 1 hour ago";
  if (diffHours < 24) return `Last update: ${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Last update: 1 day ago";
  return `Last update: ${diffDays} days ago`;
}

function buildLiveRoundSummaryTable(round) {
  const holes = Array.isArray(round?.holes_json) ? round.holes_json : [];
  const courseName = round?.course_name || "Unknown Course";

  if (!holes.length) {
    return `<div class="portal-empty-summary">No hole data available.</div>`;
  }

  const rows = holes.map((hole, index) => {
    const holeNumber = hole?.holeNumber ?? hole?.hole_number ?? (index + 1);
    const par = hole?.par ?? "--";
    const score = hole?.saved ? (hole?.score ?? "--") : "--";
    const putts = hole?.saved ? (hole?.putts ?? "--") : "--";

    let fir = "";
    if (hole?.saved) {
      if (hole?.fairway_hit === true) fir = "✓";
      else if (hole?.fairway_hit === false) fir = "";
      else if (hole?.fir === true) fir = "✓";
      else if (hole?.fir === false) fir = "";
      else fir = hole?.fairway_hit ?? hole?.fir ?? "";
    }

    let gir = "";
    if (hole?.saved) {
      if (hole?.gir === true) gir = "✓";
      else if (hole?.gir === false) gir = "";
      else gir = hole?.gir ?? "";
    }

    return `
      <tr>
        <td>${escapeHtml(String(holeNumber))}</td>
        <td>${escapeHtml(String(fir))}</td>
        <td>${escapeHtml(String(gir))}</td>
        <td>${escapeHtml(String(putts))}</td>
        <td>${escapeHtml(String(par))}</td>
        <td>${escapeHtml(String(score))}</td>
      </tr>
    `;
  }).join("");

  return `
    <div style="font-size: 1rem; margin-bottom: 10px; color: #555;">${escapeHtml(courseName)}</div>
    <table class="portal-summary-table">
      <thead>
        <tr>
          <th>Hole</th>
          <th>FIR</th>
          <th>GIR</th>
          <th>Putts</th>
          <th>Par</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function openLiveRoundSummary(round) {
  if (!round) return;

  const htmlTable = buildLiveRoundSummaryTable(round);
  showPortalSummaryModal("Round Summary", htmlTable);
}

function getLiveRoundScoreDisplay(round) {
  const totalScore = Number(round.total_score ?? 0);
  const holesCompleted = Number(round.holes_completed ?? 0);

  if (!holesCompleted) return "--";

  const roundVsPar = getRoundVsParFromHoles(round);

  if (roundVsPar === null || roundVsPar === undefined) {
    return `${totalScore} thru ${holesCompleted}`;
  }

  if (roundVsPar === 0) return `E thru ${holesCompleted}`;
  if (roundVsPar > 0) return `+${roundVsPar} thru ${holesCompleted}`;
  return `${roundVsPar} thru ${holesCompleted}`;
}

function isTestRound(round) {
  const course = (round.course_name || "").toLowerCase();
  const player = (round.player_name || "").toLowerCase();
  return course.includes("test") || player.includes("test");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function clearFinished() {

  if (!isAdminLoggedIn()) {
    await showPortalAlert(
      "Admin Login Required",
      "Please log in before using maintenance delete actions."
    );
    return;
  }

  const testRounds = currentRounds.filter(isTestRound);

  if (!testRounds.length) {
    alert("No test rounds found.");
    return;
  }

  let preview = "Delete the following test rounds?\n\n";

  testRounds.forEach((round, index) => {
    const course = round.course_name || "Unknown Course";
    const date = round.round_date || "Unknown Date";
    preview += `${index + 1}. ${course} (${date})\n`;
  });

  preview +=
    "\nThese are identified as test rounds because the course or player name contains 'test'.\n\n" +
    "This will delete ONLY live snapshots (live_round_status).\n" +
    "Completed rounds will NOT be affected.\n\n" +
    "Proceed?";

  const confirmed = confirm(preview);
  if (!confirmed) return;

  const ids = testRounds.map((r) => r.session_id);

  const { error } = await portalSupabase
    .from("live_round_status")
    .delete()
    .in("session_id", ids);

  if (error) {
    console.error("Error deleting test rounds:", error);
    alert("Could not delete test rounds.");
    return;
  }

  alert(`${ids.length} test round(s) deleted.`);
  loadLiveRounds();
}

async function clearLiveSnapshots() {

  if (!isAdminLoggedIn()) {
    await showPortalAlert(
      "Admin Login Required",
      "Please log in before using maintenance delete actions."
    );
    return;
  }
  
  const message =
    "Clear all live round snapshots?\n\n" +
    "This will delete all current rows from live_round_status only.\n\n" +
    "It will NOT delete any finished rounds already saved in completed_rounds.\n\n" +
    "If a round is still in progress, the player app may still keep a local copy on the phone/browser. " +
    "You may still need to return to the app and choose Start New instead of Resume to fully clear that active round.\n\n" +
    "Delete live snapshots now?";

  const confirmed = confirm(message);
  if (!confirmed) return;

  const { error } = await portalSupabase
    .from("live_round_status")
    .delete()
    .neq("session_id", "");

  if (error) {
    console.error("Error clearing live snapshots:", error);
    alert("Could not clear live snapshots.");
    return;
  }

  alert("Live round snapshot(s) cleared. Completed rounds were not affected.");
  loadLiveRounds();
}

async function deleteRound(sessionId, courseName = "this round", status = "", roundDate = "") {
    if (!isAdminLoggedIn()) {
    await showPortalAlert(
      "Admin Login Required",
      "Please log in before deleting live round snapshots."
    );
    return;
  }
  let message = `<strong>Are you sure you want to delete this entry?</strong><br><br>`;
  message += `<strong>Course:</strong> ${courseName}`;

  if (roundDate) {
    message += `<br><strong>Date:</strong> ${roundDate}`;
  }

  message += `
    <span class="warning-line">WARNING: This action cannot be undone.</span>
    <br>This will remove the round from the live view in this portal.
    <br>It will <strong>NOT</strong> affect any saved, completed rounds.`;

  const confirmed = await showPortalConfirm(
    "Delete this live round snapshot?",
    message,
    "Delete Snapshot",
    "Keep Round"
  );

  if (!confirmed) return;

  const { error } = await portalSupabase
    .from("live_round_status")
    .delete()
    .eq("session_id", sessionId);

  if (error) {
    console.error("Error deleting round:", error);
    await showPortalAlert("Delete failed", "Could not delete the round.");
    return;
  }

  await showPortalAlert("Deleted", "The live round snapshot was deleted.");
  loadLiveRounds();
}



// =========================
// PORTAL BRANDING MODAL
// =========================

const ADMIN_PLAYER_NAME_KEY = "strackerAdminPlayerName";
const ADMIN_HEADER_IMAGE_KEY = "strackerAdminHeaderImage";
const DEFAULT_HEADER_IMAGE = "images/AP-hdr-pics/aphdr-shot1.jpg";

function applyPortalHeaderImage(imagePath) {
  const header = document.querySelector(".portal-header");
  if (!header) return;

  const finalImage = imagePath || DEFAULT_HEADER_IMAGE;
  header.style.backgroundImage = `url("${finalImage}")`;
  header.style.backgroundSize = "cover";
  header.style.backgroundPosition = "center";
  header.style.backgroundRepeat = "no-repeat";
}

function openBrandingModal() {
  const modal = document.getElementById("brandingModal");
  if (modal) modal.classList.remove("hidden");
}

function closeBrandingModal() {
  const modal = document.getElementById("brandingModal");
  if (modal) modal.classList.add("hidden");
}

function initPortalBrandingSafe() {

const playerSelect = document.getElementById("playerNameSelect");

if (playerSelect) {
  // Set initial value
  playerSelect.value = getSavedPlayerName();

  playerSelect.addEventListener("change", function () {
    savePlayerName(playerSelect.value);
    updatePortalTitle();
  });
}

updatePortalTitle();

  const openBtn = document.getElementById("openBrandingModalBtn");
  const closeBtn = document.getElementById("closeBrandingModalBtn");
  const optionButtons = document.querySelectorAll(".branding-option-btn");

  if (openBtn) {
    openBtn.addEventListener("click", openBrandingModal);
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeBrandingModal);
  }

  optionButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const imagePath = btn.dataset.headerImage;
      if (!imagePath) return;

      localStorage.setItem(ADMIN_HEADER_IMAGE_KEY, imagePath);
      applyPortalHeaderImage(imagePath);
    });
  });

  const savedImage = localStorage.getItem(ADMIN_HEADER_IMAGE_KEY) || DEFAULT_HEADER_IMAGE;
  applyPortalHeaderImage(savedImage);
}

function getSavedPlayerName() {
  return localStorage.getItem(ADMIN_PLAYER_NAME_KEY) || "";
}

function savePlayerName(name) {
  localStorage.setItem(ADMIN_PLAYER_NAME_KEY, name);
}

function getPortalPlayerName() {
  const saved = getSavedPlayerName();
  return saved && saved.trim() !== "" ? saved : "I Gonzales";
}

function updatePortalTitle() {
  const el = document.getElementById("portalTitle");
  if (!el) return;

  const name = getPortalPlayerName();
  el.textContent = `Admin Portal for ${name}`;
}




window.loadLiveRounds = loadLiveRounds;
window.deleteRound = deleteRound;
initAdminLogin();

initPortalBrandingSafe();

window.openLiveHoleDetail = openLiveHoleDetail;
window.showDetails = showDetails;

loadLiveRounds();
console.log("about to run loadLastCompletedRound");
loadLastCompletedRound();
console.log("finished calling loadLastCompletedRound");


console.log("ADMIN PORTAL JS IS RUNNING");

setInterval(() => {
  loadLiveRounds();
    loadLastCompletedRound();
}, 5000);