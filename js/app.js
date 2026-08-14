

const DEV_MODE = false; // 🔥 set to true when you want cheat buttons back

// Keeps ARF hidden after user chooses Delete and Start New, until Start Round is actually tapped.
let suppressResumePanelUntilStart = false;


// ===== Mobile touch handling for counter buttons =====
function wireCounterTouchButtons() {
    document.querySelectorAll(".counter-group button").forEach(btn => {
        btn.addEventListener("touchstart", e => {
            e.preventDefault();
            btn.click();
        }, { passive: false });
    });
}

// ===== Splash Screen Removal =====
window.addEventListener("load", () => {
    const splash = document.getElementById("splashScreen");
    const overlay = document.getElementById("fadeOverlay");
    const totalSplashTime = 5200;

    if (!splash) {
        showRoundDetailsScreen();
        return;
    }

    splash.style.display = "block";
    splash.style.opacity = "1";

    if (overlay) {
        overlay.style.display = "block";
        overlay.style.opacity = "1";
    }

    setTimeout(() => {
        splash.style.transition = "opacity 0.5s ease";
        splash.style.opacity = "0";

        if (overlay) {
            overlay.style.transition = "opacity 0.5s ease";
            overlay.style.opacity = "0";
        }

        setTimeout(() => {
            splash.style.display = "none";

            if (overlay) {
                overlay.style.display = "none";
            }

            updateResumePanel();
            showRoundDetailsScreen();
        }, 500);
    }, totalSplashTime);
});


function loadDemoRound() {
    const pars = [4,3,5,4,4,5,3,4,4, 4,3,5,4,4,5,3,4,4];
    const scores = [5,3,4,4,6,5,2,4,5, 4,3,6,4,3,5,4,4,5];
    const putts = [2,2,1,2,2,2,1,2,2, 2,2,2,2,1,2,2,2,2];

    const roundDate = document.getElementById("roundDate");
    const roundType = document.getElementById("roundType");
    const courseName = document.getElementById("courseName");
    const startingHoleField = document.getElementById("startingHole");
    const teeSlope = document.getElementById("teeSlope");
    const teeRating = document.getElementById("teeRating");
    const teeYardage = document.getElementById("teeYardage");
    const frontPar = document.getElementById("frontPar");
    const backPar = document.getElementById("backPar");
    const coursePar = document.getElementById("coursePar");

    if (roundDate && !roundDate.value) {
        roundDate.value = new Date().toISOString().split("T")[0];
    }
    if (roundType) roundType.value = "Practice";
    if (courseName) courseName.value = "Demo Course";
    if (startingHoleField) startingHoleField.value = "1";
    if (teeSlope) teeSlope.value = "125";
    if (teeRating) teeRating.value = "71.4";
    if (teeYardage) teeYardage.value = "6520";
    if (frontPar) frontPar.value = "36";
    if (backPar) backPar.value = "36";
    if (coursePar) coursePar.value = "72";

    for (let i = 0; i < 18; i++) {
        holes[i] = {
            fir: pars[i] >= 4 ? (i % 2 === 0) : false,
            gir: i % 3 === 0,
            putts: putts[i],
            updown: false,
            sand: i === 5 || i === 15,
            penalty: i === 4 ? 1 : 0,
            score: scores[i],
            par: pars[i],
            saved: true
        };
    }

    currentHole = 18;
    currentHoleIndex = 17;
    startingHole = 1;
    playOrder = Array.from({ length: 18 }, (_, i) => i + 1);

    roundStarted = true;
    resumingSavedRound = false;
    roundJustCompleted = true;
    postRoundMode = false;
    postRoundReturnTarget = "nineteenth";
    roundFinalized = false;

    if (roundStarted || anyHoleSaved() || roundJustCompleted || postRoundMode) {
    persistActiveRound();
}

    if (typeof updateCoursePar === "function") updateCoursePar();
    if (typeof updateRoundDetailCompletion === "function") updateRoundDetailCompletion();
    if (typeof updateHoleScreen === "function") updateHoleScreen();
    if (typeof updateSummary === "function") updateSummary();
    if (typeof updatePostRoundUI === "function") updatePostRoundUI();

    if (typeof show19thHoleScreen === "function") {
        show19thHoleScreen();
    }
}




// ===== DEV BUILD LABEL =====
function setDevBuildLabel() {
    const el = document.getElementById("devBuildLabel");
    if (!el) return;

    const now = new Date();
    const label = now.toLocaleString();

    el.textContent = `DEV BUILD — ${label}`;
}


// ===== DOM Ready Setup =====
document.addEventListener("DOMContentLoaded", () => {
       // ===== INIT DEV BUILD LABEL =====
    setDevBuildLabel();
     // your existing startup code continues...
    initializeAppStorage();
    preloadRoundBackgrounds();
    wireCounterTouchButtons();
    setAutofilledTodayDate();
    loadRoundBackground();
    wireRoundDetailListeners();
    wireStaticEventListeners();

    // ===== Zero Putts Popup Wiring =====
    const confirmZeroPuttsBtn = document.getElementById("confirmZeroPuttsBtn");
    const cancelZeroPuttsBtn = document.getElementById("cancelZeroPuttsBtn");
    const zeroPuttsPopup = document.getElementById("zeroPuttsPopup");
    const closeZeroPutts = document.getElementById("closeZeroPutts");

    if (confirmZeroPuttsBtn) {
        confirmZeroPuttsBtn.addEventListener("click", () => {
            const puttsEl = document.getElementById("putts");
            if (puttsEl) puttsEl.value = 0;

            window.zeroPuttsConfirmed = true;

            if (zeroPuttsPopup) zeroPuttsPopup.style.display = "none";

            completeHoleSave(); // 👈 IMPORTANT: call directly
        });
    }

    if (cancelZeroPuttsBtn) {
        cancelZeroPuttsBtn.addEventListener("click", () => {
            if (zeroPuttsPopup) zeroPuttsPopup.style.display = "none";
        });
    }

    if (closeZeroPutts) {
        closeZeroPutts.addEventListener("click", () => {
            if (zeroPuttsPopup) zeroPuttsPopup.style.display = "none";
        });
    }

    adjustSummaryHeight();
    updateCoursePar();
    updateParRowState();
    updateRoundDetailCompletion();
    updateHoleScreen();
    updateResumePanel();
    updatePostRoundUI();
    checkForActiveRoundOnLoad();

});


let returnToSavePopupAfterStats = false;




function hidePerformanceStatPanels(exceptId = "") {
    ["teeShotPanel", "approachPanel", "puttingPanel", "shortGamePanel", "notesPanel"].forEach(id => {
        if (id !== exceptId) {
            document.getElementById(id)?.classList.add("hidden");
        }
    });
}

// ===== Speaker Toggle =====
const speakerToggle = document.getElementById("speakerToggle");
if (speakerToggle) {
    speakerToggle.addEventListener("click", function () {
        soundOn = !soundOn;
        this.textContent = soundOn ? "🔊" : "🔇";
        if (roundStarted || roundJustCompleted || postRoundMode) persistActiveRound();
    });
}

// ===== Helpers =====
function buildPlayOrder(startHole) {
    const order = [];
    for (let i = 0; i < 18; i++) {
        order.push(((startHole - 1 + i) % 18) + 1);
    }
    return order;
}

function syncCurrentHoleFromIndex() {
    currentHole = playOrder[currentHoleIndex];
}

function getFieldValue(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
}

function anyHoleSaved() {
    return holes.some(h => h && h.saved);
}

function getExpectedRoundLength() {
    const selected = parseInt(getFieldValue("roundLength"), 10);
    return selected === 9 ? 9 : 18;
}

function getRoundDetails() {
    return {
        roundDate: getFieldValue("roundDate"),
        roundType: getFieldValue("roundType"),
        roundLength: getFieldValue("roundLength"),
        courseName: getFieldValue("courseName"),
        startingHole: getFieldValue("startingHole"),
        teeSlope: getFieldValue("teeSlope"),
        teeRating: getFieldValue("teeRating"),
        teeYardage: getFieldValue("teeYardage"),
        frontPar: getFieldValue("frontPar"),
        backPar: getFieldValue("backPar"),
        coursePar: getFieldValue("coursePar")
    };
}




/* ===== Hole Pars from Yardages/Pars popup ===== */
function getCurrentHoleParFromYardages() {
    try {
        const saved = localStorage.getItem("strackerPhase2HolePars");
        if (!saved) return null;

        const pars = JSON.parse(saved);
        if (!Array.isArray(pars)) return null;

        const par = parseInt(pars[currentHole - 1], 10);
        return par > 0 ? par : null;
    } catch (e) {
        return null;
    }
}

function getCurrentHoleParValue() {
    const popupPar = getCurrentHoleParFromYardages();
    if (popupPar) return popupPar;

    const selectedParEl = document.querySelector('input[name="holePar"]:checked');
    if (selectedParEl && Number(selectedParEl.value) > 0) {
        return Number(selectedParEl.value);
    }

    const holeData = holes[currentHole - 1];
    if (holeData && Number(holeData.par) > 0) {
        return Number(holeData.par);
    }

    return 4;
}


function updateApproachLabelsForPar() {
    const tileTitle = document.getElementById("approachTileTitle");
    const panelTitle = document.getElementById("approachPanelTitle");

    const currentPar =
        typeof getCurrentHoleParValue === "function"
            ? Number(getCurrentHoleParValue())
            : 4;

    const label = currentPar === 5
        ? "Position / Approach"
        : "Approach";

    if (tileTitle) tileTitle.textContent = label;
    if (panelTitle) panelTitle.textContent = label;
}


function updateTeeShotDirectionLayout() {

    const teeDirectionGrid = document.getElementById("teeShotDirectionGrid");
    const teeDirCenter = document.getElementById("teeDirCenter");
    const teePar3TopResult = document.getElementById("teePar3TopResult");
    const teePar3BottomResults = document.getElementById("teePar3BottomResults");

    const teeShotTipBodyStandard = document.getElementById("teeShotTipBodyStandard");
const teeShotTipBodyPar3 = document.getElementById("teeShotTipBodyPar3");
const teeShotPanel = document.getElementById("teeShotPanel");

    const currentPar =
        typeof getCurrentHoleParValue === "function"
            ? Number(getCurrentHoleParValue())
            : 4;
            
if (teeDirectionGrid) {
    teeDirectionGrid.classList.toggle("tee-par3-grid", currentPar === 3);
}

if (teeShotPanel) {
    teeShotPanel.classList.toggle("tee-shot-par3-mode", currentPar === 3);
}

if (teeDirCenter) {
    teeDirCenter.textContent =
        currentPar === 3 ? "On Green" : "Center";
}

if (teeDirLeft) {
    teeDirLeft.textContent =
        currentPar === 3 ? "Off Left" : "Left";
}

if (teeDirRight) {
    teeDirRight.textContent =
        currentPar === 3 ? "Off Right" : "Right";
}

    // Show Par 3-only Tee Shot result chips only on Par 3 holes.
    if (teePar3TopResult) {
        teePar3TopResult.classList.toggle("hidden", currentPar !== 3);
    }

    if (teePar3BottomResults) {
        teePar3BottomResults.classList.toggle("hidden", currentPar !== 3);
    }

// Switch Tee Shot ProTip wording for Par 3 vs Par 4/5.
if (teeShotTipBodyStandard) {
    teeShotTipBodyStandard.style.display = currentPar === 3 ? "none" : "block";
}

if (teeShotTipBodyPar3) {
    teeShotTipBodyPar3.style.display = currentPar === 3 ? "block" : "none";
}

// Disable Tee Shot highlight + pulse behavior on Par 3 holes.
const teeShotHighlight = document.getElementById("teeShotTipHighlight");
const teeShotTipBtn = document.getElementById("teeShotTipBtn");

if (teeShotHighlight) {
    teeShotHighlight.style.display = currentPar === 3 ? "none" : "";
}

if (teeShotTipBtn) {
    teeShotTipBtn.classList.add("protip-attention");
}

}


function syncHoleParRadioFromStoredPar() {
    const radios = document.querySelectorAll('input[name="holePar"]');
    const holeData = holes[currentHole - 1];

    // Always clear first so a previous hole's selected Par does not carry forward.
    radios.forEach(radio => {
        radio.checked = false;
    });

    // If this hole is already saved, protect its saved par.
    if (holeData && holeData.saved && Number(holeData.par) > 0) {
        radios.forEach(radio => {
            radio.checked = Number(radio.value) === Number(holeData.par);
        });
        return;
    }

    // If Yardages popup has a stored par, use it.
    const storedPar = getCurrentHoleParFromYardages();
    if (storedPar) {
        radios.forEach(radio => {
            radio.checked = Number(radio.value) === Number(storedPar);
        });
    }

    // If Yardages popup says P / blank, leave all par radios unselected.
}



function getCurrentHoleYardage() {
    try {
        const saved = localStorage.getItem("strackerPhase2HoleYardages");
        if (!saved) return null;

        const yardages = JSON.parse(saved);
        if (!Array.isArray(yardages)) return null;

        const yds = parseInt(yardages[currentHole - 1], 10);
        return yds > 0 ? yds : null;
    } catch (e) {
        return null;
    }
}

function getTeeShotRemainingYardage() {
    const holeYardage = getCurrentHoleYardage();
    if (!holeYardage) return null;

    const holeData = holes[currentHole - 1];
    const savedDistance = holeData && holeData.teeShot
        ? Number(holeData.teeShot.distance)
        : null;

    const draftDistance =
        typeof teeShotDraft !== "undefined" && teeShotDraft
            ? Number(teeShotDraft.distance)
            : null;

    const teeDist = savedDistance || draftDistance;

    if (!teeDist) return null;

    const remaining = holeYardage - teeDist;
    return remaining > 0 ? remaining : 0;
}



function hasMeaningfulRoundDetails(details = {}) {
    const meaningfulFields = [
        "roundType",
        "roundLength",
        "courseName",
        "startingHole",
        "teeSlope",
        "teeRating",
        "teeYardage",
        "frontPar",
        "backPar",
        "coursePar"
    ];

    return meaningfulFields.some(key => String(details[key] || "").trim() !== "");
}

function setRoundDetails(details = {}) {
    roundDetailFields.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = details[id] ?? "";
    });

    if (roundDateField) {
        roundDateField.dataset.autofilled = details.roundDate ? "false" : "true";
    }

    updateRoundDateDisplay();
    updateCoursePar();
    updateParRowState();
    updateRoundDetailCompletion();
    updatePostRoundUI();
}

function hideResumePanel() {
    if (!resumeRoundPanel) return;

    resumeRoundPanel.classList.add("hidden");
    resumeRoundPanel.style.setProperty("display", "none", "important");
    resumeRoundPanel.style.setProperty("visibility", "hidden", "important");
    resumeRoundPanel.style.setProperty("opacity", "0", "important");
    resumeRoundPanel.setAttribute("aria-hidden", "true");
}

function updateResumePanel() {
    if (!resumeRoundPanel) return;

    if (suppressResumePanelUntilStart && !roundStarted && !anyHoleSaved()) {
        hideResumePanel();
        return;
    }

    const saved = getParsedActiveRound();

    // 🚫 HARD STOP — no saved object at all
    if (!saved) {
        hideResumePanel();
        return;
    }

    // 🚫 NO HOLES SAVED
    const savedHoleCount = Array.isArray(saved.holes)
        ? saved.holes.filter(h => h && h.saved).length
        : 0;

    // 🚫 NO REAL DETAILS ENTERED
    const details = saved.roundDetails || {};
    // Do NOT count the auto-filled Date as a real active round.
    const hasRealDetails = hasMeaningfulRoundDetails(details);

    // 🚫 NOTHING MEANINGFUL → HIDE ARF
    if (savedHoleCount === 0 && !hasRealDetails) {
        hideResumePanel();
        return;
    }

    // ===== EXISTING DISPLAY LOGIC =====

    const resumeIndex = Number(saved.currentHoleIndex) || 0;
    const resumeHole = Array.isArray(saved.playOrder) && saved.playOrder.length === 18
        ? saved.playOrder[Math.max(0, Math.min(17, resumeIndex))]
        : 1;

    if (resumeRoundCourse) {
        resumeRoundCourse.textContent = details.courseName || "Course not entered";
    }

    if (resumeRoundStatus) {
        if (saved.roundJustCompleted) {
            if (saved.postRoundMode) {
                resumeRoundStatus.textContent = "Round complete • finishing Round Details";
            } else if (saved.postRoundReturnTarget === "nineteenth") {
                resumeRoundStatus.textContent = "Round complete • at 19th Hole flow";
            } else {
                resumeRoundStatus.textContent = "Round complete flow in progress";
            }
        } else {
            resumeRoundStatus.textContent =
                `You're on Hole ${resumeHole} • ${savedHoleCount} hole${savedHoleCount === 1 ? "" : "s"} saved`;
        }
    }

    resumeRoundPanel.style.removeProperty("display");
    resumeRoundPanel.style.removeProperty("visibility");
    resumeRoundPanel.style.removeProperty("opacity");
    resumeRoundPanel.removeAttribute("aria-hidden");
    resumeRoundPanel.classList.remove("hidden");
}

function showStatsScreen() {
    hideResumePanel();

    if (roundDetailsScreen) roundDetailsScreen.style.display = "none";
    if (nineteenthHoleScreen) nineteenthHoleScreen.classList.add("hidden");
    if (appContainer) {
        appContainer.style.display = "block";
        appContainer.style.opacity = "1";
        appContainer.style.transform = "scale(1)";
    }

    updateHoleScreen();
    window.scrollTo(0, 0);
}

function showRoundDetailsScreen() {
    if (roundDetailsScreen) roundDetailsScreen.style.display = "flex";
    if (appContainer) appContainer.style.display = "none";
    if (nineteenthHoleScreen) nineteenthHoleScreen.classList.add("hidden");

    const saved = getParsedActiveRound();
    const savedHoleCount = saved && Array.isArray(saved.holes)
        ? saved.holes.filter(h => h && h.saved).length
        : 0;
    const savedHasRealDetails = saved && hasMeaningfulRoundDetails(saved.roundDetails || {});
    const savedNeedsResumePanel =
        !!saved &&
        (savedHoleCount > 0 || savedHasRealDetails || saved.roundJustCompleted || saved.postRoundMode);

    if (suppressResumePanelUntilStart && !roundStarted && !anyHoleSaved()) {
        hideResumePanel();
    } else if (savedNeedsResumePanel || roundStarted || anyHoleSaved() || roundJustCompleted || postRoundMode) {
        updateResumePanel();
    } else {
        hideResumePanel();
    }

    updatePostRoundUI();
    window.scrollTo(0, 0);
}

function preloadRoundBackgrounds() {
    if (!Array.isArray(roundBackgrounds)) return;

    roundBackgrounds.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

function applyRoundBackground(index) {
    if (!roundBackgrounds.length) return;

    const safeIndex = ((index % roundBackgrounds.length) + roundBackgrounds.length) % roundBackgrounds.length;

    document.documentElement.style.setProperty(
        "--round-bg-image",
        `url("${roundBackgrounds[safeIndex]}")`
    );
}

function getCurrentRoundBackgroundIndex() {
    const saved = parseInt(localStorage.getItem(ROUND_BG_INDEX_KEY), 10);
    return Number.isNaN(saved) ? -1 : saved;
}

function setCurrentRoundBackgroundIndex(index) {
    localStorage.setItem(ROUND_BG_INDEX_KEY, String(index));
}

function loadRoundBackground() {
    const current = getCurrentRoundBackgroundIndex();
    applyRoundBackground(current < 0 ? 0 : current);
}

function advanceRoundBackground() {
    if (!roundBackgrounds.length) return;
    const nextIndex = (getCurrentRoundBackgroundIndex() + 1) % roundBackgrounds.length;
    setCurrentRoundBackgroundIndex(nextIndex);
    applyRoundBackground(nextIndex);
}

function getRoundTotalScore() {
    return holes.reduce((sum, h) => {
        return sum + ((h && h.saved) ? (h.score || 0) : 0);
    }, 0);
}

function getRoundScoreVsPar() {
    const savedHoles = holes.filter(h => h && h.saved);

    const playedPar = savedHoles.reduce((sum, h) => {
        return sum + Number(h.par || 0);
    }, 0);

    return getRoundTotalScore() - playedPar;
}

function getCompletionHeadline() {
    const diff = getRoundScoreVsPar();

    if (diff >= 6) {
        return "Round Complete!<br>Your round has been saved.";
    } else if (diff >= 3 && diff <= 5) {
        return "Round Complete<br>Good job — your round has been saved.";
    } else {
        return "Round Complete!<br>Fantastic play!<br>Your round has been saved.";
    }
}

function clearAllValidationHighlights() {
    document.querySelectorAll(".validation-highlight").forEach(el => {
        el.classList.remove("validation-highlight");
    });

    document.querySelectorAll(".row-incomplete-required").forEach(el => {
        el.classList.remove("row-incomplete-required");
    });

    const teeRow = document.getElementById("row-teeInfo");
    if (teeRow) {
        teeRow.classList.remove("row-incomplete-postround");
    }
}

function clearValidationHighlight(selector) {
    const el = document.querySelector(selector);
    if (el) el.classList.remove("validation-highlight");
}

function clearValidationHighlightFromElement(element) {
    if (element) element.classList.remove("validation-highlight");
}

function clearRequiredRowHighlightForField(fieldId) {
    const rowMap = {
        roundDate: "row-roundDate",
        roundType: "row-roundType",
        roundLength: "row-roundLength",
        courseName: "row-courseName",
        startingHole: "row-startingHole",
        teeSlope: "row-teeInfo",
        teeRating: "row-teeInfo",
        teeYardage: "row-teeInfo",
        frontPar: "row-coursePars",
        backPar: "row-coursePars",
        coursePar: "row-coursePars"
    };

    const rowId = rowMap[fieldId];
    if (!rowId) return;

    const row = document.getElementById(rowId);
    if (!row) return;

    if (rowId === "row-coursePars") {
        const frontFilled = getFieldValue("frontPar") !== "";
        const backFilled = getFieldValue("backPar") !== "";
        if (frontFilled && backFilled) {
            row.classList.remove("row-incomplete-required");
        }
        return;
    }

    if (getFieldValue(fieldId) !== "") {
        row.classList.remove("row-incomplete-required");
    }
}

function hideFinalClosurePopup() {
    if (finalClosurePopup) {
        finalClosurePopup.style.display = "none";
    }
}

function resetForBrandNewRound() {
    console.log("Starting a brand-new round: clearing old live session");

    if (typeof window.clearLiveSessionId === "function") {
        window.clearLiveSessionId();
    }

    resetCurrentRound();
}

function resetCurrentRound() {
    // ===== FULL STATE RESET =====
    currentHole = 1;
    currentHoleIndex = 0;
    startingHole = 1;
    playOrder = buildPlayOrder(1);

    roundStarted = false;
    roundFinalized = false;
    roundJustCompleted = false;
    roundEndedEarly = false;
    completedHoleCount = null;
    postRoundMode = false;
    postRoundReturnTarget = "";
    pendingSaveAfterValidation = false;
    autoSaveInProgress = false;
    resumingSavedRound = false;

    summaryReturnTarget = "app";
    postRoundButtonVisible = false;

    if (postRoundButtonDelayTimer) {
        clearTimeout(postRoundButtonDelayTimer);
        postRoundButtonDelayTimer = null;
    }

    // ===== CLEAR HOLES =====
    for (let i = 0; i < 18; i++) {
        holes[i] = null;
    }

    // ===== CLEAR UI =====
    clearInputs();
    clearAllValidationHighlights();

    const fieldIds = [
        "roundType",
        "roundLength",
        "courseName",
        "startingHole",
        "teeSlope",
        "teeRating",
        "teeYardage",
        "frontPar",
        "backPar",
        "coursePar"
    ];

    fieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    if (roundDateField) {
        roundDateField.value = "";
        roundDateField.dataset.autofilled = "true";
    }

    setAutofilledTodayDate();

    const startingHoleField = document.getElementById("startingHole");
    if (startingHoleField) startingHoleField.disabled = false;

    // ===== FORCE ALL SCREENS CLOSED =====
    const roundCompleteModal = document.getElementById("roundCompleteModal");
    const summaryModal = document.getElementById("summaryModal");

    if (roundCompleteModal) roundCompleteModal.style.display = "none";
    if (summaryModal) summaryModal.style.display = "none";
    if (nineteenthHoleScreen) nineteenthHoleScreen.classList.add("hidden");

// 🔥 CRITICAL — CLEAR STORAGE CLEANLY
clearActiveRoundStorage();
removeFromStorage(ROUND_BG_INDEX_KEY);
// PHASE 2 — Keep pre-round hole yardages/pars available until a different set is loaded or overwritten.
// Do NOT clear HOLE_YARDAGES_KEY or HOLE_PARS_KEY here.

    // ===== RESET UI STATE =====
    loadRoundBackground();
    updateCoursePar();
    updateParRowState();
    updateRoundDetailCompletion();
    updateHoleScreen();
    updateResumePanel();
    updatePostRoundUI();

    // 🔥 CRITICAL — FORCE APP TO ROUND DETAILS
    showRoundDetailsScreen();

    window.scrollTo(0, 0);
}

// ===== Round Detail Completion / Validation =====
function formatDisplayDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString + "T12:00:00");
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function updateRoundDateDisplay() {
    if (!roundDateField || !roundDateDisplay) return;
    roundDateDisplay.textContent = roundDateField.value ? formatDisplayDate(roundDateField.value) : "";
}

function setAutofilledTodayDate() {
    if (!roundDateField) return;

    const today = new Date().toISOString().split("T")[0];

    if (!roundDateField.value) {
        roundDateField.value = today;
        roundDateField.dataset.autofilled = "true";
    }

    updateRoundDateDisplay();
}

function updateRowState(rowId, complete) {
    const row = document.getElementById(rowId);
    if (!row) return;
    row.classList.toggle("row-complete", complete);
}

function updateParRowState() {
    const parRow = document.getElementById("row-coursePars");
    if (!parRow) return;

    const frontFilled = getFieldValue("frontPar") !== "";
    const backFilled = getFieldValue("backPar") !== "";
    const complete = frontFilled && backFilled;

    parRow.classList.toggle("row-complete", complete);

    if (complete) {
        parRow.classList.remove("row-incomplete-required");
    }
}

function updateRoundDetailCompletion() {
    updateRowState("row-roundDate", false);
    updateRowState("row-roundType", getFieldValue("roundType") !== "");
    updateRowState("row-roundLength", getFieldValue("roundLength") !== "");
    updateRowState("row-courseName", getFieldValue("courseName") !== "");
    updateRowState("row-startingHole", getFieldValue("startingHole") !== "");

    const teeFields = [
        getFieldValue("teeSlope"),
        getFieldValue("teeRating"),
        getFieldValue("teeYardage")
    ];

    updateRowState("row-teeInfo", teeFields.some(val => val !== ""));
    updateParRowState();
}

function validateRoundDetailsForStart() {
    clearAllValidationHighlights();

    const missing = [];

    const requiredRows = [
        { rowId: "row-roundDate", fieldId: "roundDate", label: "Date" },
        { rowId: "row-roundType", fieldId: "roundType", label: "Round Type" },
        { rowId: "row-roundLength", fieldId: "roundLength", label: "Round Length" },
        { rowId: "row-courseName", fieldId: "courseName", label: "Course Name" },
        { rowId: "row-startingHole", fieldId: "startingHole", label: "Starting Hole" },
        { rowId: "row-coursePars", fieldId: null, label: "Front and Back 9 Par" }
    ];

    requiredRows.forEach(item => {
        let isComplete = false;

        if (item.rowId === "row-coursePars") {
            isComplete = getFieldValue("frontPar") !== "" && getFieldValue("backPar") !== "";
        } else {
            isComplete = getFieldValue(item.fieldId) !== "";
        }

        if (!isComplete) {
            missing.push(item.label);
            const row = document.getElementById(item.rowId);
            if (row) row.classList.add("row-incomplete-required");
        }
    });

    if (missing.length > 0) {
        let message = "Please complete ";
        if (missing.length === 1) {
            message += `${missing[0]} before starting the round.`;
        } else if (missing.length === 2) {
            message += `${missing[0]} and ${missing[1]} before starting the round.`;
        } else {
            const last = missing.pop();
            message += `${missing.join(", ")}, and ${last} before starting the round.`;
        }
        return { valid: false, message };
    }

    return { valid: true };
}

function wireRoundDetailListeners() {
    roundDetailFields.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        const handler = () => {
            updateCoursePar();
            updateRoundDetailCompletion();
            clearRequiredRowHighlightForField(id);

            if (id === "roundDate" && roundDateField) {
                roundDateField.dataset.autofilled = "false";
                updateRoundDateDisplay();
            }
            // Only persist Round Details once a real round exists.
            // This prevents ARF from reappearing while filling a clean new round.
            if (roundStarted || anyHoleSaved() || roundJustCompleted || postRoundMode) {
                persistActiveRound();
                updateResumePanel();
            } else {
                hideResumePanel();
            }

            updatePostRoundUI();
        };

        el.addEventListener("input", handler);
        el.addEventListener("change", handler);
    });
}

// ===== Stats Functions =====
function getStats() {
    return {
        fir: document.getElementById("fir")?.checked || false,
        gir: document.getElementById("gir")?.checked || false,
        updown: document.getElementById("updown")?.checked || false,
        sand: document.getElementById("sand")?.checked || false,
        putts: parseInt(document.getElementById("putts")?.value, 10) || 0,
        penalty: parseInt(document.getElementById("penalty")?.value, 10) || 0,
        score: parseInt(document.getElementById("score")?.value, 10) || 0
    };
}

function setStats(data) {
    if (!data) {
        clearInputs();
        return;
    }

    const fir = document.getElementById("fir");
    const gir = document.getElementById("gir");
    const updown = document.getElementById("updown");
    const sand = document.getElementById("sand");
    const putts = document.getElementById("putts");
    const penalty = document.getElementById("penalty");
    const score = document.getElementById("score");

    if (fir) fir.checked = !!data.fir;
    if (gir) gir.checked = !!data.gir;
    if (updown) updown.checked = !!data.updown;
    if (sand) sand.checked = !!data.sand;
    if (putts) putts.value = data.putts ?? 0;
    if (penalty) penalty.value = data.penalty ?? 0;
    if (score) score.value = data.score ?? 0;

    document.querySelectorAll('input[name="holePar"]').forEach(radio => {
        radio.checked = Number(radio.value) === Number(data.par);
    });
}

function clearInputs() {
    const fir = document.getElementById("fir");
    const gir = document.getElementById("gir");
    const updown = document.getElementById("updown");
    const sand = document.getElementById("sand");
    const putts = document.getElementById("putts");
    const penalty = document.getElementById("penalty");
    const score = document.getElementById("score");

    if (fir) fir.checked = false;
    if (gir) gir.checked = false;
    if (updown) updown.checked = false;
    if (sand) sand.checked = false;
    if (putts) putts.value = 0;
    if (penalty) penalty.value = 0;
    if (score) score.value = 0;

    document.querySelectorAll('input[name="holePar"]').forEach(radio => {
        radio.checked = false;
    });

    pendingSaveAfterValidation = false;
    autoSaveInProgress = false;
    clearAllValidationHighlights();
}

function updateNavButtons() {
    // 🔒 Safety guard — prevents crash if playOrder isn't ready
    if (!playOrder || playOrder.length === 0) return;

    const atFirstHole = currentHoleIndex <= 0;
    const atLastHole = currentHoleIndex >= playOrder.length - 1;

    if (prevHoleBtn) {
        prevHoleBtn.disabled = atFirstHole;
        prevHoleBtn.classList.toggle("disabled", atFirstHole);
    }

    if (nextHoleBtn) {
        nextHoleBtn.disabled = atLastHole;
        nextHoleBtn.classList.toggle("disabled", atLastHole);
    }

    if (forwardHoleBtn) {
        forwardHoleBtn.disabled = atLastHole;
        forwardHoleBtn.classList.toggle("disabled", atLastHole);
    }
}

function updateHoleScreen() {
    syncCurrentHoleFromIndex();

    const header = document.getElementById("holeHeader");
    if (header) header.textContent = currentHole;

    const headerYardage = document.getElementById("holeHeaderYardage");
    if (headerYardage) {
        const yds = typeof getCurrentHoleYardage === "function"
            ? getCurrentHoleYardage()
            : null;

        if (yds) {
            headerYardage.innerHTML =
                `: <span class="yardage-number">${yds}</span> <span class="yardage-unit">Yds</span>`;
        } else {
            headerYardage.textContent = " —";
        }
    }

    const holeData = holes[currentHole - 1];

    if (holeData && holeData.saved) {
        setStats(holeData);

        // PHASE 2 — Restore saved Tee Shot club selection
        const savedClub = holeData?.teeShot?.club || "D";

        document.querySelectorAll(".tee-club-btn").forEach(btn => {
            btn.classList.toggle(
                "active",
                btn.dataset.club === savedClub
            );
        });

        window.teeShotDraft = window.teeShotDraft || {};
        window.teeShotDraft.club = savedClub;

        // PHASE 2 — Saved holes stay visually dimmed, but still clickable for edit confirmation.
        if (saveBtn) {
            saveBtn.textContent = "Save Hole";
            saveBtn.classList.add("inactive");
            saveBtn.disabled = false;
            saveBtn.style.pointerEvents = "auto";
        }
    } else {
        clearInputs();

        // PHASE 2 — Reset Tee Shot club selection for new/unsaved hole
        document.querySelectorAll(".tee-club-btn").forEach(btn => {
            btn.classList.toggle(
                "active",
                btn.dataset.club === "D"
            );
        });

        window.teeShotDraft = window.teeShotDraft || {};
        window.teeShotDraft.club = "D";

        if (saveBtn) {
            saveBtn.textContent = "Save Hole";
            saveBtn.classList.remove("inactive");
            saveBtn.disabled = false;
            saveBtn.style.pointerEvents = "auto";
        }
    }

    if (!holeData || !holeData.saved) {
        syncHoleParRadioFromStoredPar();
    }

    updateNavButtons();
    refreshTeeShotTile();
    refreshApproachTileClean();
    refreshApproachTile();
    refreshPuttingTile();
    refreshShortGameTile();
    updateApproachLabelsForPar();
    updateTeeShotDirectionLayout();
    refreshNotesTile();

    const endRoundEarlyBtn = document.getElementById("endRoundEarlyBtn");

        if (endRoundEarlyBtn) {
            const savedHoleCount = holes.filter(h => h && h.saved).length;

            const shouldShowEndEarly =
                roundStarted &&
                savedHoleCount > 0 &&
                !roundJustCompleted;

            endRoundEarlyBtn.style.display =
                shouldShowEndEarly ? "inline-block" : "none";
    }
}

function goToHole(holeNum) {
    const foundIndex = playOrder.indexOf(holeNum);
    if (foundIndex === -1) return;

    pendingSaveAfterValidation = false;
    autoSaveInProgress = false;

    currentHoleIndex = foundIndex;
    syncCurrentHoleFromIndex();
    updateHoleScreen();

    if (roundStarted) persistActiveRound();
}

function goToNextHole() {
    if (currentHoleIndex >= playOrder.length - 1) return;

    pendingSaveAfterValidation = false;
    autoSaveInProgress = false;

    currentHoleIndex++;
    syncCurrentHoleFromIndex();
    updateHoleScreen();

    if (roundStarted) persistActiveRound();
}

function goToPrevHole() {
    if (currentHoleIndex <= 0) return;

    pendingSaveAfterValidation = false;
    autoSaveInProgress = false;

    currentHoleIndex--;
    syncCurrentHoleFromIndex();
    updateHoleScreen();

    if (roundStarted) persistActiveRound();
}

// ===== Save / Validation Helpers =====
function getHoleSaveValidation() {
    const missing = [];

    const selectedPar = document.querySelector('input[name="holePar"]:checked');
    const puttsInput = document.getElementById("putts");
    const scoreInput = document.getElementById("score");

    const puttsValue = puttsInput ? String(puttsInput.value || "").trim() : "";
    const scoreValue = scoreInput ? String(scoreInput.value || "").trim() : "";

if (puttsValue === "") {
    missing.push("Putts");
}

    if (scoreValue === "" || parseInt(scoreValue, 10) <= 0) {
        missing.push("the hole's Score");
    }

    return {
        valid: missing.length === 0,
        missing
    };
}

function applyHoleValidationHighlights() {
    const selectedPar = document.querySelector('input[name="holePar"]:checked');
    const puttsInput = document.getElementById("putts");
    const scoreInput = document.getElementById("score");

    if (!selectedPar) {
        document.querySelector(".hole-par-container")?.classList.add("validation-highlight");
    }

if (!puttsInput || String(puttsInput.value || "").trim() === "") {
    puttsInput?.closest(".stat-counter")?.classList.add("validation-highlight");
}

    if (!scoreInput || String(scoreInput.value || "").trim() === "" || parseInt(scoreInput.value, 10) <= 0) {
        scoreInput?.closest(".stat-counter")?.classList.add("validation-highlight");
    }
}

function buildHoleValidationMessage(missing) {
    let message = "Please enter ";

    if (missing.length === 1) {
        message += `${missing[0]} before saving.`;
    } else if (missing.length === 2) {
        message += `${missing[0]} and ${missing[1]} before saving.`;
    } else {
        message += `${missing[0]}, ${missing[1]}, and ${missing[2]} before saving.`;
    }

    return message;
}

function showDeleteRoundPopup() {
    if (deleteRoundPopup) {
        deleteRoundPopup.classList.remove("hidden");
        deleteRoundPopup.style.display = "flex";
        deleteRoundPopup.style.visibility = "visible";
        deleteRoundPopup.style.opacity = "1";
    }
}

function hideDeleteRoundPopup() {
    if (deleteRoundPopup) {
        deleteRoundPopup.classList.add("hidden");
        deleteRoundPopup.style.display = "none";
    }
}

function showHoleSaveValidationPopup() {
    const validation = getHoleSaveValidation();

    clearAllValidationHighlights();
    applyHoleValidationHighlights();

    if (validationText) {
        validationText.textContent = buildHoleValidationMessage(validation.missing);
    }

    if (validationPopup) {
        validationPopup.style.display = "flex";
    }
}

function triggerSavedFeedback() {
    const holeSavedFade = document.getElementById("holeSavedFade");
    const holeSavedNumber = document.getElementById("holeSavedNumber");

    if (!holeSavedFade) return;

    if (holeSavedNumber) {
        holeSavedNumber.textContent = currentHole;
    }

    holeSavedFade.style.display = "flex";
    holeSavedFade.style.visibility = "visible";
    holeSavedFade.style.opacity = "0";
    holeSavedFade.style.pointerEvents = "none";
    holeSavedFade.style.zIndex = "99999";

    void holeSavedFade.offsetWidth;

    holeSavedFade.style.opacity = "1";

    setTimeout(() => {
        holeSavedFade.style.opacity = "0";

        setTimeout(() => {
            holeSavedFade.style.display = "none";
            holeSavedFade.style.visibility = "hidden";
        }, 450);
    }, 700);

    if (navigator.vibrate) {
        navigator.vibrate(60);
    }
}


/* Tee Shot tile saved state */
const refreshTeeShotTile = () => {
    const tile = document.getElementById("openTeeShotStats");
    if (!tile) return;

    const holeData = holes[currentHole - 1];
    const hasSavedTeeShot =
        holeData &&
        holeData.teeShot &&
        holeData.teeShot.direction &&
        holeData.teeShot.distance !== null;

    tile.classList.toggle("saved", !!hasSavedTeeShot);
};


function saveTeeShot() {
    const holeIndex = currentHole - 1;

    if (!holes[holeIndex]) {
        holes[holeIndex] = {};
    }

const displayDistance = parseInt(
    String(document.getElementById("teeDistanceDisplay")?.textContent || "").replace(/[^\d]/g, ""),
    10
);

holes[holeIndex].teeShot = {
    club: window.teeShotDraft?.club || "D",
    direction: window.teeShotDraft?.direction || "",
    distance: Number.isFinite(displayDistance)
        ? displayDistance
        : (window.teeShotDraft?.distance ?? null)
};

    persistActiveRound();

    const teeShotPanel = document.getElementById("teeShotPanel");
    const enhancedStatsPanel = document.getElementById("enhancedStatsPanel");

    if (teeShotPanel) teeShotPanel.classList.add("hidden");
    if (enhancedStatsPanel) enhancedStatsPanel.classList.remove("hidden");

    if (typeof refreshTeeShotTile === "function") {
        refreshTeeShotTile();
    }
    if (typeof stopProTipAttention === "function") {
    stopProTipAttention("teeShot", false);
}
if (typeof closeProTipPopup === "function") {
    closeProTipPopup("teeShot");
}
}


function completeHoleSave() {
    const selectedParEl = document.querySelector('input[name="holePar"]:checked');
    const puttsEl = document.getElementById("putts");
    const penaltyEl = document.getElementById("penalty");
    const scoreEl = document.getElementById("score");
    const firEl = document.getElementById("fir");
    const girEl = document.getElementById("gir");
    const updownEl = document.getElementById("updown");
    const sandEl = document.getElementById("sand");

    const selectedPar = selectedParEl ? parseInt(selectedParEl.value, 10) : null;
    const puttsValue = puttsEl ? parseInt(puttsEl.value, 10) || 0 : 0;
    const penaltyValue = penaltyEl ? parseInt(penaltyEl.value, 10) || 0 : 0;
    const scoreValue = scoreEl ? parseInt(scoreEl.value, 10) || 0 : 0;

if (selectedPar == null || scoreValue <= 0) {
    if (saveConfirmPopup) saveConfirmPopup.style.display = "none";
    showHoleSaveValidationPopup();
    return;
}

    const existingHole = holes[currentHole - 1] || {};

    holes[currentHole - 1] = {
        fir: !!(firEl && firEl.checked),
        gir: !!(girEl && girEl.checked),
        updown: !!(updownEl && updownEl.checked),
        sand: !!(sandEl && sandEl.checked),
        putts: puttsValue,
        penalty: penaltyValue,
        score: scoreValue,
        par: selectedPar,
        yardage: typeof getCurrentHoleYardage === "function" ? getCurrentHoleYardage() : null,

        // Preserve +Stats already saved before Save Hole
        teeShot: existingHole.teeShot || null,
        approach: existingHole.approach || null,
        shortGame: existingHole.shortGame || null,
        putting: existingHole.putting || null,
        notes: existingHole.notes || null,

        saved: true
    };

    console.log("SAVED HOLE WITH +STATS:", holes[currentHole - 1]);

    if (saveConfirmPopup) saveConfirmPopup.style.display = "none";
    if (validationPopup) validationPopup.style.display = "none";

const wasEditingSavedHole = window.editingSavedHole === true;

pendingSaveAfterValidation = false;
autoSaveInProgress = false;
window.zeroPuttsConfirmed = false;
window.editingSavedHole = false;

if (saveBtn) {
    saveBtn.textContent = "Save Hole";
}

    triggerSavedFeedback();

    const savedCount = holes.filter(h => h && h.saved).length;
    const isLastHole = savedCount === getExpectedRoundLength();

// PHASE 2 — Normal saves advance to next hole.
// Edited saved holes stay on the same hole after updating.
if (!wasEditingSavedHole && !isLastHole && currentHoleIndex < playOrder.length - 1) {
    currentHoleIndex++;
    syncCurrentHoleFromIndex();
}

    if (isLastHole) {
        roundJustCompleted = true;
    }

    roundStarted = true;
    roundFinalized = false;
    persistActiveRound();
    updateLiveRoundTracking();
    updateHoleScreen();

    if (isLastHole) {
        setTimeout(() => {
            showRoundCompleteModal();
        }, 1100);
    }
}

function tryAutoSaveAfterCorrection() {
    if (!pendingSaveAfterValidation || autoSaveInProgress) return;
    if (holes[currentHole - 1] && holes[currentHole - 1].saved) return;

    const validation = getHoleSaveValidation();

    if (!validation.valid) {
        return;
    }

    // Validation is now satisfied, but do NOT auto-save.
    // Let the user tap Save Hole again when ready.
    autoSaveInProgress = false;
}

// ===== Summary =====
function formatRelativeScore(score, par) {
    if (par == null || score === "" || score == null) return "";
    const diff = score - par;
    return diff === 0 ? "E" : (diff > 0 ? `+${diff}` : `${diff}`);
}

function getScoreCircleClass(score, par) {
    let circleClass = "score-circle";
    if (par == null || score === "" || score == null) return circleClass;

    const diff = score - par;
    if (diff === -2) circleClass += " eagle";
    else if (diff === -1) circleClass += " birdie";
    else if (diff === 0) circleClass += " par";
    else if (diff === 1) circleClass += " bogey";
    else if (diff >= 2) circleClass += " double-bogey";

    return circleClass;
}


function showSummaryForRound(roundHoles, highlightedHole = null, returnTarget = "app", courseName = "") {
    summaryReturnTarget = returnTarget;

const summaryModal = document.getElementById("summaryModal");
const summaryCourseNameEl = document.getElementById("summaryCourseName");
const tbody = document.querySelector("#summaryTable tbody");

if (!summaryModal || !tbody) return;

if (summaryCourseNameEl) {
    summaryCourseNameEl.textContent = courseName || "";
}

    const safeHoles = Array.isArray(roundHoles) ? roundHoles : [];

    tbody.innerHTML = "";

    let frontTotals = { fir: 0, gir: 0, putts: 0, updown: 0, sand: 0, penalty: 0, score: 0, saved: 0 };
    let backTotals = { fir: 0, gir: 0, putts: 0, updown: 0, sand: 0, penalty: 0, score: 0, saved: 0 };
    let totalTotals = { fir: 0, gir: 0, putts: 0, updown: 0, sand: 0, penalty: 0, score: 0, saved: 0 };

    let frontCumulativeScore = 0;
    let backCumulativeScore = 0;

    tbody.innerHTML += `<tr class="sub-header"><td colspan="8">Front 9</td></tr>`;

    for (let i = 0; i < 18; i++) {
        const actualHoleNumber = i + 1;
        const h = safeHoles[i];
        const isSaved = !!(h && h.saved);

        const holeData = isSaved
            ? h
            : { fir: false, gir: false, putts: "", updown: false, sand: false, penalty: "", score: "", par: null };

        const highlight = highlightedHole === actualHoleNumber ? 'style="background:#e0ffe0"' : "";
        const scoreText = formatRelativeScore(holeData.score, holeData.par);
        const circleClass = getScoreCircleClass(holeData.score, holeData.par);

        tbody.innerHTML += `<tr ${highlight}>
            <td>${actualHoleNumber}</td>
            <td>${holeData.fir ? "✔" : ""}</td>
            <td>${holeData.gir ? "✔" : ""}</td>
            <td>${holeData.putts}</td>
            <td>${holeData.updown ? 1 : ""}</td>
            <td>${holeData.sand ? 1 : ""}</td>
            <td>${holeData.penalty}</td>
            <td><div class="${circleClass}">${scoreText}</div></td>
        </tr>`;

        if (isSaved) {
            const section = actualHoleNumber <= 9 ? frontTotals : backTotals;

            section.fir += holeData.fir ? 1 : 0;
            section.gir += holeData.gir ? 1 : 0;
            section.putts += holeData.putts || 0;
            section.updown += holeData.updown ? 1 : 0;
            section.sand += holeData.sand ? 1 : 0;
            section.penalty += holeData.penalty || 0;
            section.score += holeData.score || 0;
            section.saved++;

            totalTotals.fir += holeData.fir ? 1 : 0;
            totalTotals.gir += holeData.gir ? 1 : 0;
            totalTotals.putts += holeData.putts || 0;
            totalTotals.updown += holeData.updown ? 1 : 0;
            totalTotals.sand += holeData.sand ? 1 : 0;
            totalTotals.penalty += holeData.penalty || 0;
            totalTotals.score += holeData.score || 0;
            totalTotals.saved++;

            if (holeData.par != null) {
                if (actualHoleNumber <= 9) frontCumulativeScore += holeData.score - holeData.par;
                if (actualHoleNumber >= 10) backCumulativeScore += holeData.score - holeData.par;
            }
        }

        if (actualHoleNumber === 9) {
            const frontScoreText = frontTotals.saved
                ? (frontCumulativeScore === 0 ? "E" : (frontCumulativeScore > 0 ? `+${frontCumulativeScore}` : `${frontCumulativeScore}`))
                : "";

            tbody.innerHTML += `<tr class="totals-title">
                <td>Totals</td>
                <td>${frontTotals.saved ? Math.round(frontTotals.fir / frontTotals.saved * 100) + "%" : ""}</td>
                <td>${frontTotals.saved ? Math.round(frontTotals.gir / frontTotals.saved * 100) + "%" : ""}</td>
                <td>${frontTotals.putts}</td>
                <td>${frontTotals.updown}</td>
                <td>${frontTotals.sand}</td>
                <td>${frontTotals.penalty}</td>
                <td>${frontScoreText}</td>
            </tr>`;
            tbody.innerHTML += `<tr style="height:14px;"></tr>`;
            tbody.innerHTML += `<tr class="sub-header"><td colspan="8">Back 9</td></tr>`;
        }

        if (actualHoleNumber === 18) {
            const backScoreText = backTotals.saved
                ? (backCumulativeScore === 0 ? "E" : (backCumulativeScore > 0 ? `+${backCumulativeScore}` : `${backCumulativeScore}`))
                : "";

            tbody.innerHTML += `<tr class="totals-title">
                <td>Totals</td>
                <td>${backTotals.saved ? Math.round(backTotals.fir / backTotals.saved * 100) + "%" : ""}</td>
                <td>${backTotals.saved ? Math.round(backTotals.gir / backTotals.saved * 100) + "%" : ""}</td>
                <td>${backTotals.putts}</td>
                <td>${backTotals.updown}</td>
                <td>${backTotals.sand}</td>
                <td>${backTotals.penalty}</td>
                <td>${backScoreText}</td>
            </tr>`;

            tbody.innerHTML += `<tr style="height:30px;"></tr>`;
            tbody.innerHTML += `<tr class="sub-header" style="background:#d5fadf;"><td colspan="8">Complete Round</td></tr>`;
            tbody.innerHTML += `<tr class="totals-title">
                <td>Totals</td>
                <td>${totalTotals.saved ? Math.round(totalTotals.fir / totalTotals.saved * 100) + "%" : ""}</td>
                <td>${totalTotals.saved ? Math.round(totalTotals.gir / totalTotals.saved * 100) + "%" : ""}</td>
                <td>${totalTotals.putts}</td>
                <td>${totalTotals.updown}</td>
                <td>${totalTotals.sand}</td>
                <td>${totalTotals.penalty}</td>
                <td>${totalTotals.score}</td>
            </tr>`;
        }
    }

    if (summaryCourseNameEl) {
    if (returnTarget === "savedRoundsList") {
        // From saved round
        const rounds = getCompletedRounds();
        const match = rounds.find(r => r.holes === roundHoles);
        summaryCourseNameEl.textContent = match?.details?.courseName || "";
    } else {
        // Current round
        summaryCourseNameEl.textContent = getFieldValue("courseName") || "";
    }
}

    summaryModal.style.display = "flex";
}


function getCurrentSummaryHighlightHole() {
    // Highlight the hole the user should be playing NEXT.
    // This avoids the summary getting stuck on Hole 1 if currentHole has not
    // been re-synced yet after reload/resume or after saving a hole.
    if (Array.isArray(playOrder) && playOrder.length === 18) {
        const nextUnplayedHole = playOrder.find(holeNum => {
            const holeData = holes[holeNum - 1];
            return !(holeData && holeData.saved);
        });

        if (nextUnplayedHole) {
            return nextUnplayedHole;
        }
    }

    if (typeof syncCurrentHoleFromIndex === "function") {
        syncCurrentHoleFromIndex();
    }

    return currentHole;
}


// ===== PERFORMANCE TRENDS EXPERIMENT START =====
// Optional read-only +Stats trend summary.
// Safe to remove if feature does not feel right.
// Uses saved holes[] data only.
// Does NOT affect V1, Supabase save flow, Coach Dashboard, or 0-putts flow.

function getMostCommonPerformanceValue(values) {
    const counts = {};

    values
        .filter(value => value !== null && value !== undefined && String(value).trim() !== "")
        .forEach(value => {
            const key = String(value).trim();
            counts[key] = (counts[key] || 0) + 1;
        });

    let bestValue = "";
    let bestCount = 0;

    Object.keys(counts).forEach(key => {
        if (counts[key] > bestCount) {
            bestValue = key;
            bestCount = counts[key];
        }
    });

    return bestValue;
}

function getApproachTrendText(approaches) {
    const leaveValues = approaches
        .map(a => Number(a.leaveDistance))
        .filter(n => !Number.isNaN(n));

    const resultValues = approaches
        .map(a => String(a.result || "").trim())
        .filter(Boolean);

    const commonResult = getMostCommonPerformanceValue(resultValues);

    if (leaveValues.length > 0) {
        const avgLeave = Math.round(
            leaveValues.reduce((sum, n) => sum + n, 0) / leaveValues.length
        );

        if (avgLeave > 0) {
            return `Approaches are averaging ${avgLeave} yds short.`;
        }

        if (avgLeave < 0) {
            return `Approaches are averaging ${Math.abs(avgLeave)} yds long.`;
        }

        return `Approaches are averaging pin high.`;
    }

    if (commonResult) {
        return `Most common approach result: ${commonResult}.`;
    }

    return "";
}

function buildPerformanceTrendsHTML(roundHoles) {
    const savedHoles = (Array.isArray(roundHoles) ? roundHoles : [])
        .filter(hole => hole && hole.saved);

    if (!savedHoles.length) {
        return `<div class="performance-trends-line">No saved holes yet.</div>`;
    }

    const completedCount = savedHoles.length;

    const teeShots = savedHoles
        .map(hole => hole.teeShot)
        .filter(tee => tee && Number(tee.distance) > 0);

    const approaches = savedHoles
        .map(hole => hole.approach)
        .filter(approach => approach && (approach.result || Number(approach.distance) > 0));

    const shortGames = savedHoles
        .map(hole => hole.shortGame)
        .filter(shortGame => shortGame && (shortGame.result || shortGame.type));

    const puttValues = savedHoles
        .map(hole => Number(hole.putts))
        .filter(n => !Number.isNaN(n));

    const sections = [];

    if (teeShots.length > 0) {
        const avgDrive = Math.round(
            teeShots.reduce((sum, tee) => sum + Number(tee.distance || 0), 0) / teeShots.length
        );

        const commonDirection = getMostCommonPerformanceValue(
            teeShots.map(tee => tee.direction)
        );

        const directionText = commonDirection
            ? `Pattern: trending ${String(commonDirection).toLowerCase()}.`
            : "";

        sections.push(`
            <div class="performance-trends-section">
                <div class="performance-trends-section-title">Tee Shots</div>
                <div class="performance-trends-line">Drives are averaging ${avgDrive} yds.</div>
                ${directionText ? `<div class="performance-trends-line">${directionText}</div>` : ""}
            </div>
        `);
    }

    if (approaches.length > 0) {
        const approachTrendText = getApproachTrendText(approaches);
        const commonApproachResult = getMostCommonPerformanceValue(
            approaches.map(a => a.result)
        );

        sections.push(`
            <div class="performance-trends-section">
                <div class="performance-trends-section-title">Approach Shots</div>
                ${approachTrendText ? `<div class="performance-trends-line">${approachTrendText}</div>` : ""}
                ${commonApproachResult ? `<div class="performance-trends-line">Most common miss: ${commonApproachResult}.</div>` : ""}
            </div>
        `);
    }

    if (shortGames.length > 0) {
        const commonShortGameResult = getMostCommonPerformanceValue(
            shortGames.map(sg => sg.result)
        );

        sections.push(`
            <div class="performance-trends-section">
                <div class="performance-trends-section-title">Short Game</div>
                <div class="performance-trends-line">Most common result: ${commonShortGameResult || "Not enough data yet"}.</div>
            </div>
        `);
    }

    if (puttValues.length > 0) {
        const avgPutts = (
            puttValues.reduce((sum, n) => sum + n, 0) / puttValues.length
        ).toFixed(1);

        sections.push(`
            <div class="performance-trends-section">
                <div class="performance-trends-section-title">Putting</div>
                <div class="performance-trends-line">Putts are averaging ${avgPutts} per hole.</div>
            </div>
        `);
    }

    if (!sections.length) {
        return `<div class="performance-trends-line">No performance stats saved yet.</div>`;
    }

    return `
        <div class="performance-trends-line"><strong>After ${completedCount} saved hole${completedCount === 1 ? "" : "s"}:</strong></div>
        <br>
        ${sections.join("")}
    `;
}

function showPerformanceTrends() {
    const modal = document.getElementById("performanceTrendsModal");
    const body = document.getElementById("performanceTrendsBody");

    if (!modal || !body) return;

    body.innerHTML = buildPerformanceTrendsHTML(holes);
    modal.style.display = "flex";
}

function hidePerformanceTrends() {
    const modal = document.getElementById("performanceTrendsModal");
    if (modal) modal.style.display = "none";
}

// ===== PERFORMANCE TRENDS EXPERIMENT END =====




function viewSummary(e, returnTarget = "app") {
    if (e) e.preventDefault();

    const summaryHighlightHole =
        returnTarget === "app" ? getCurrentSummaryHighlightHole() : currentHole;

    showSummaryForRound(
        holes,
        summaryHighlightHole,
        returnTarget,
        getFieldValue("courseName")
    );
}


function restoreAfterSummaryExit() {
    const roundCompleteModal = document.getElementById("roundCompleteModal");

    if (summaryReturnTarget === "roundComplete") {
        if (roundCompleteModal) roundCompleteModal.style.display = "flex";
        return;
    }

        if (summaryReturnTarget === "savedRoundsList") {
        const roundDetailsScreen = document.getElementById("roundDetailsScreen");
        const appContainer = document.getElementById("appContainer");
        const nineteenthHoleScreen = document.getElementById("nineteenthHoleScreen");
        const savedRoundsScreen = document.getElementById("savedRoundsScreen");
        const performanceChartsScreen = document.getElementById("performanceChartsScreen");
        const savedRoundsListScreen = document.getElementById("savedRoundsListScreen");

        if (roundDetailsScreen) roundDetailsScreen.style.display = "none";
        if (appContainer) appContainer.style.display = "none";
        if (nineteenthHoleScreen) nineteenthHoleScreen.classList.add("hidden");
        if (savedRoundsScreen) savedRoundsScreen.classList.add("hidden");
        if (performanceChartsScreen) performanceChartsScreen.classList.add("hidden");
        if (savedRoundsListScreen) savedRoundsListScreen.classList.remove("hidden");

        window.scrollTo(0, 0);
        return;
    }

    if (summaryReturnTarget === "nineteenth") {
        show19thHoleScreen();
        return;
    }

    showStatsScreen();
}

// ===== Summary Height Fix =====
function adjustSummaryHeight() {
    const summaryModal = document.getElementById("summaryModal");
    const summaryBox = document.querySelector(".summary-box");

    if (summaryBox && summaryModal) {
        const maxHeight = window.innerHeight - 120;
        summaryBox.style.maxHeight = `${maxHeight}px`;
        summaryModal.style.overflowY = "auto";
    }
}

// ===== Course Par Auto-calc =====
function updateCoursePar() {
    const front = parseInt(frontParField?.value, 10) || 0;
    const back = parseInt(backParField?.value, 10) || 0;
    if (courseParField) {
        courseParField.value = (front || back) ? front + back : "";
    }
}

// ===== Round Completion / Post-Round =====


function isValidTeeSlope(value) {
    const v = String(value || "").trim();
    if (!/^\d{2,3}$/.test(v)) return false;
    const n = Number(v);
    return n >= 55 && n <= 155;
}

function isValidTeeRating(value) {
    const v = String(value || "").trim();
    if (!/^\d{2}(\.\d)?$/.test(v)) return false;
    const n = Number(v);
    return n >= 50 && n <= 90;
}

function isValidTeeYardage(value) {
    const v = String(value || "").trim();
    if (!/^\d{4}$/.test(v)) return false;
    const n = Number(v);
    return n >= 1000 && n <= 9000;
}

function getMissingTeeDetails() {
    const slopeValue = getFieldValue("teeSlope");
    const ratingValue = getFieldValue("teeRating");
    const yardageValue = getFieldValue("teeYardage");

    const missing = [];

    // Slope: require at least 2 digits, allow 2 or 3
    if (!/^\d{2,3}$/.test(slopeValue)) {
        missing.push("Slope");
    }

    // Rating: require at least 2 digits, allow optional decimal
    // Examples accepted: 69, 69.0, 71.4
    if (!/^\d{2}(\.\d)?$/.test(ratingValue)) {
        missing.push("Rating");
    }

    // Yardage: require exactly 4 digits
    if (!/^\d{4}$/.test(yardageValue)) {
        missing.push("Yardage");
    }

    return missing;
}

function arePostRoundDetailsComplete() {
    return getMissingTeeDetails().length === 0;
}

function openPostRoundDetails(target) {
    postRoundMode = true;
    postRoundReturnTarget = target;
    roundFinalized = false;
    persistActiveRound();
    showRoundDetailsScreen();
    updatePostRoundUI();
}

function finishPostRoundDetails() {
    leavingPostRoundDetails = true;

    if (postRoundButtonDelayTimer) {
        clearTimeout(postRoundButtonDelayTimer);
        postRoundButtonDelayTimer = null;
    }

    if (postRoundReturnWrap) {
        postRoundReturnWrap.classList.remove("active");
        postRoundReturnWrap.style.display = "none";
    }

    postRoundMode = false;
    persistActiveRound();
    updatePostRoundUI();

    if (postRoundReturnTarget === "nineteenth") {
        show19thHoleScreen();
    } else {
        showRoundCompleteModal();
    }

    setTimeout(() => {
        leavingPostRoundDetails = false;
    }, 50);
}

function updatePostRoundUI() {
    const teeRow = document.getElementById("row-teeInfo");
    const startRoundBtn = document.getElementById("startRoundBtn");
    const demoRoundBtn = document.getElementById("demoRoundBtn");

    if (!teeRow || !startRoundBtn) return;
    if (leavingPostRoundDetails) return;

    const detailsComplete = arePostRoundDetailsComplete();

    teeRow.classList.remove("row-incomplete-postround");

    if (postRoundButtonDelayTimer) {
        clearTimeout(postRoundButtonDelayTimer);
        postRoundButtonDelayTimer = null;
    }

    if (postRoundGuidance) {
        postRoundGuidance.style.display = "none";
    }

    if (postRoundReturnWrap) {
        postRoundReturnWrap.classList.remove("active");
        postRoundReturnWrap.style.display = "none";
    }

    postRoundButtonVisible = false;

    if (!postRoundMode) {
        if (roundFormNote) roundFormNote.style.display = "block";
        startRoundBtn.style.display = "block";
        return;
    }

    if (roundFormNote) roundFormNote.style.display = "none";
    startRoundBtn.style.display = "none";

    if (!detailsComplete) {
        teeRow.classList.add("row-incomplete-postround");

        if (postRoundGuidance) {
            postRoundGuidance.innerHTML = "Fill in Slope, Rating, and Yardage to continue.";
            postRoundGuidance.style.display = "block";
        }

        return;
    }

    if (postRoundGuidance) {
        postRoundGuidance.innerHTML = "Round Details complete — continue below.";
        postRoundGuidance.style.display = "block";
    }

    if (postRoundReturnBtn) {
        postRoundReturnBtn.textContent =
            postRoundReturnTarget === "roundComplete"
                ? "Back to Round Complete"
                : "Back to Round Wrap-up";
    }

    postRoundButtonDelayTimer = setTimeout(() => {
        if (!postRoundMode) return;
        if (!arePostRoundDetailsComplete()) return;

        if (postRoundReturnWrap) {
            postRoundReturnWrap.style.display = "flex";
            void postRoundReturnWrap.offsetWidth;
            postRoundReturnWrap.classList.add("active");
        }

        postRoundButtonVisible = true;
        postRoundButtonDelayTimer = null;
    }, 350);
}

function update19thHoleActionState() {
    const nineteenthDetailsBtn = document.getElementById("nineteenthDetailsBtn");
    const nineteenthNewRoundBtn = document.getElementById("nineteenthNewRoundBtn");
    const viewSavedRoundsBtn = document.getElementById("viewSavedRoundsBtn");
    const savedRoundsBackBtn = document.getElementById("savedRoundsBackBtn");

    if (!nineteenthDetailsBtn) return;

    const detailsComplete = arePostRoundDetailsComplete();

    if (detailsComplete) {
        nineteenthDetailsBtn.style.display = "none";
    } else {
        nineteenthDetailsBtn.style.display = "inline-block";
        nineteenthDetailsBtn.textContent = "Finish Round Details";
    }

    if (nineteenthNewRoundBtn) {
        nineteenthNewRoundBtn.style.display = "inline-block";
    }
}

function showFinalClosurePopup(fromCompletedDetails = false) {
    if (!finalClosurePopup || !finalClosureTitle || !finalClosureText) return;

    finalClosureTitle.textContent = fromCompletedDetails
        ? "Round Details Completed"
        : "Round Complete";

    finalClosureText.textContent =
        "Awesome. Complete stats make your analysis more accurate and more useful to coaches and recruiters. Keep up the good work!";

    finalClosurePopup.style.display = "flex";
}



function playSplashToFreshRoundDetails() {
    const splash = document.getElementById("splashScreen");
    const overlay = document.getElementById("fadeOverlay");
    const roundCompleteModal = document.getElementById("roundCompleteModal");
    const summaryModal = document.getElementById("summaryModal");

    hideFinalClosurePopup();

    if (!finalizeCompletedRoundIfNeeded()) return;

    if (roundCompleteModal) roundCompleteModal.style.display = "none";
    if (summaryModal) summaryModal.style.display = "none";
    if (nineteenthHoleScreen) nineteenthHoleScreen.classList.add("hidden");

    resetForBrandNewRound();
    showRoundDetailsScreen();

    if (splash) {
        splash.style.display = "block";
        splash.style.opacity = "1";
        splash.style.transition = "none";
    }

    if (overlay) {
        overlay.style.display = "block";
        overlay.style.opacity = "1";
        overlay.style.transition = "none";
    }

    if (splash) void splash.offsetWidth;

    if (splash) splash.style.transition = "opacity 0.35s ease";
    if (overlay) overlay.style.transition = "opacity 0.35s ease";

    setTimeout(() => {
        if (splash) splash.style.opacity = "0";
        if (overlay) overlay.style.opacity = "0";

        setTimeout(() => {
            if (splash) splash.style.display = "none";
            if (overlay) overlay.style.display = "none";
        }, 350);
    }, 1100);
}

function endRoundEarly() {
    const savedHoleCount = holes.filter(h => h && h.saved).length;

    if (savedHoleCount <= 0) {
        alert("No completed holes are available to save.");
        return;
    }

    roundEndedEarly = true;
    completedHoleCount = savedHoleCount;
    roundJustCompleted = true;
    roundFinalized = false;

    persistActiveRound();

    showRoundCompleteModal();
}

function showRoundCompleteModal() {
    const modal = document.getElementById("roundCompleteModal");
    const text = document.getElementById("roundCompleteText");
    const subtext = document.getElementById("roundCompleteSubtext");
    const roundCompleteDetailsBtn = document.getElementById("roundCompleteDetailsBtn");
    const roundCompleteCloseBtn = document.getElementById("roundCompleteCloseBtn");

    if (!modal || !text || !subtext) return;

    roundJustCompleted = true;
    roundFinalized = false;

    text.innerHTML = getCompletionHeadline();

    const missing = getMissingTeeDetails();
    const detailsComplete = missing.length === 0;

    if (roundCompleteDetailsBtn) {
        if (detailsComplete) {
            roundCompleteDetailsBtn.style.display = "none";
        } else {
            roundCompleteDetailsBtn.style.display = "inline-block";
            roundCompleteDetailsBtn.textContent = "Finish Round Details";
        }
    }

    if (roundCompleteCloseBtn) {
        roundCompleteCloseBtn.textContent = detailsComplete ? "Continue to Round Wrap-up" : "Go to Round Wrap-up";
    }

    if (detailsComplete) {
        subtext.innerHTML = "Your round data is complete and ready for analysis.";
    } else {
        subtext.innerHTML =
            `To improve benchmark and recruitment comparison analytics, please add: <span class="highlight-green">${missing.join(", ")}</span> in Round Details.`;
    }

    postRoundMode = false;
    persistActiveRound();
    updatePostRoundUI();
    modal.style.display = "flex";
}

function show19thHoleScreen() {
    const savedHoleCount = holes.filter(h => h && h.saved).length;

    // Do not allow Round Wrap-up unless the round is actually complete
    const validEarlyFinish =
        roundEndedEarly &&
        completedHoleCount != null &&
        savedHoleCount === Number(completedHoleCount);

    if (savedHoleCount < getExpectedRoundLength() && !validEarlyFinish) {
        showStatsScreen();
        window.scrollTo(0, 0);
        return;
    }

    const roundCompleteModal = document.getElementById("roundCompleteModal");
    const summaryModal = document.getElementById("summaryModal");

    if (roundCompleteModal) roundCompleteModal.style.display = "none";
    if (summaryModal) summaryModal.style.display = "none";
    if (roundDetailsScreen) roundDetailsScreen.style.display = "none";
    if (appContainer) appContainer.style.display = "none";

    if (nineteenthHoleScreen) {
        nineteenthHoleScreen.classList.remove("hidden");
    }

    populate19thHole();
    update19thHoleActionState();
    updateResumePanel();
    window.scrollTo(0, 0);
}

function getAverageScoreByPar(targetPar) {
    let total = 0;
    let count = 0;

    holes.forEach(h => {
        if (h && h.saved && h.par === targetPar) {
            total += h.score || 0;
            count++;
        }
    });

    return count ? (total / count).toFixed(2) : "--";
}

function populateParAverages() {
    const par3Avg = document.getElementById("par3Avg");
    const par4Avg = document.getElementById("par4Avg");
    const par5Avg = document.getElementById("par5Avg");

    if (par3Avg) par3Avg.textContent = getAverageScoreByPar(3);
    if (par4Avg) par4Avg.textContent = getAverageScoreByPar(4);
    if (par5Avg) par5Avg.textContent = getAverageScoreByPar(5);
}

function updateMissingReminder() {
    const missing = getMissingTeeDetails();
    const el = document.getElementById("missingCourseDataReminder");
    if (!el) return;

    if (missing.length > 0) {
        el.style.display = "block";
        el.innerHTML = `Add <span class="highlight-green">${missing.join(", ")}</span><br>in Round Details for better analysis.`;
    } else {
        el.style.display = "block";
        el.innerHTML = `Excellent. Your round details are complete and ready for stronger analysis and coach/recruiter review.`;
    }
}

function getRoundResultClass(vsPar) {
    if (vsPar <= -2) return "eagle";
    if (vsPar === -1) return "birdie";
    if (vsPar === 0) return "par";
    if (vsPar === 1) return "bogey";
    return "double-bogey";
}

function populate19thHole() {
    const finalScore = getRoundTotalScore();
    const vsPar = getRoundScoreVsPar();
    const vsParText = vsPar === 0 ? "E" : (vsPar > 0 ? `+${vsPar}` : `${vsPar}`);

    const nineteenthFinalScore = document.getElementById("nineteenthFinalScore");
    const nineteenthVsPar = document.getElementById("nineteenthVsPar");
    const finalScoreCircle = document.getElementById("finalScoreCircle");
    const nineteenthHeadline = document.getElementById("nineteenthHeadline");
    const roundPuttsTotal = document.getElementById("roundPuttsTotal");

    if (nineteenthFinalScore) nineteenthFinalScore.textContent = finalScore;
    if (nineteenthVsPar) nineteenthVsPar.textContent = vsParText;
    if (nineteenthHeadline) nineteenthHeadline.innerHTML = getCompletionHeadline();

    if (roundPuttsTotal) roundPuttsTotal.textContent = getRoundTotalPutts();

    if (finalScoreCircle) {
        finalScoreCircle.textContent = vsParText;
        finalScoreCircle.className = `score-circle nineteenth-score-circle ${getRoundResultClass(vsPar)}`;
    }

    populateParAverages();
    updateMissingReminder();
    update19thHoleActionState();
}

// ===== Static Event Listeners =====

window.showSavedRoundsHub = function () {
    const roundDetailsScreen = document.getElementById("roundDetailsScreen");
    const appContainer = document.getElementById("appContainer");
    const nineteenthHoleScreen = document.getElementById("nineteenthHoleScreen");
    const savedRoundsScreen = document.getElementById("savedRoundsScreen");
    const performanceChartsScreen = document.getElementById("performanceChartsScreen");
    const savedRoundsListScreen = document.getElementById("savedRoundsListScreen");

    if (roundDetailsScreen) roundDetailsScreen.style.display = "none";
    if (appContainer) appContainer.style.display = "none";
    if (nineteenthHoleScreen) nineteenthHoleScreen.classList.add("hidden");
    if (performanceChartsScreen) performanceChartsScreen.classList.add("hidden");
    if (savedRoundsListScreen) savedRoundsListScreen.classList.add("hidden");
    if (savedRoundsScreen) savedRoundsScreen.classList.remove("hidden");

    window.scrollTo(0, 0);
};


function wireStaticEventListeners() {
    const statsHelpBtn = document.getElementById("statsHelpBtn");
    const endRoundEarlyBtn = document.getElementById("endRoundEarlyBtn");
    const statsHelpPopup = document.getElementById("statsHelpPopup");
    const statsHelpCloseBtn = document.getElementById("statsHelpCloseBtn");
    const saveConfirmStay = document.getElementById("confirmStay");

    if (endRoundEarlyBtn) {
        endRoundEarlyBtn.addEventListener("click", () => {
            const savedHoleCount = holes.filter(h => h && h.saved).length;

            if (savedHoleCount <= 0) {
                alert("No completed holes are available to save.");
                return;
            }

            const confirmed = window.confirm(
                `End this round after ${savedHoleCount} completed hole${savedHoleCount === 1 ? "" : "s"}?`
            );

            if (!confirmed) return;

            endRoundEarly();
        });
    }

document.getElementById("saveConfirmClose")?.addEventListener("click", () => {
    document.getElementById("saveConfirmPopup").style.display = "none";
});

const teeShotValidationOK = document.getElementById("teeShotValidationOK");

    if (statsHelpBtn && statsHelpPopup) {
        statsHelpBtn.addEventListener("click", () => {
            statsHelpPopup.style.display = "flex";
        });
    }

    if (statsHelpCloseBtn && statsHelpPopup) {
        statsHelpCloseBtn.addEventListener("click", () => {
            statsHelpPopup.style.display = "none";
        });
    }



    const demoRoundBtn = document.getElementById("demoRoundBtn");
    if (demoRoundBtn) {
        demoRoundBtn.addEventListener("click", function () {
            loadDemoRound();
        });

        demoRoundBtn.addEventListener("touchend", function (e) {
            e.preventDefault();
            loadDemoRound();
        }, { passive: false });
    }

    const fillTo18Btn = document.getElementById("fillTo18Btn");
    if (fillTo18Btn) {
        fillTo18Btn.addEventListener("click", function () {
            fillAllButLastHole();
            showStatsScreen();
        });

        fillTo18Btn.addEventListener("touchend", function (e) {
            e.preventDefault();
            fillAllButLastHole();
            showStatsScreen();
        }, { passive: false });
    }

    const seeStatsBtn = document.getElementById("seeStats");
    if (seeStatsBtn) {
        seeStatsBtn.addEventListener("click", e => viewSummary(e, "app"));
        seeStatsBtn.addEventListener("touchend", e => {
            e.preventDefault();
            viewSummary(e, "app");
        }, { passive: false });
    }

    document.querySelectorAll(".plus").forEach(btn => {
        btn.addEventListener("click", function () {
            const input = this.parentElement.querySelector("input");
            if (!input) return;

            let val = parseInt(input.value, 10) || 0;
            input.value = val + 1;

            if (input.id === "putts" || input.id === "score") {
                clearValidationHighlightFromElement(input.closest(".stat-counter"));
                tryAutoSaveAfterCorrection();
            }
        });
    });

    document.querySelectorAll(".minus").forEach(btn => {
        btn.addEventListener("click", function () {
            const input = this.parentElement.querySelector("input");
            if (!input) return;

            let val = parseInt(input.value, 10) || 0;
            if (val > 0) val--;
            input.value = val;

            if (input.id === "putts" || input.id === "score") {
                clearValidationHighlightFromElement(input.closest(".stat-counter"));
                tryAutoSaveAfterCorrection();
            }
        });
    });

    if (prevHoleBtn) {
        prevHoleBtn.addEventListener("click", goToPrevHole);
    }

    if (nextHoleBtn) {
        nextHoleBtn.addEventListener("click", goToNextHole);
    }

    if (forwardHoleBtn) {
        forwardHoleBtn.addEventListener("click", goToNextHole);
    }

if (returnToDetailsBtn) {
    returnToDetailsBtn.addEventListener("click", () => {
        const startingHoleField = document.getElementById("startingHole");

        if (startingHoleField) {
            startingHoleField.disabled = anyHoleSaved();
        }

        pendingSaveAfterValidation = false;
        autoSaveInProgress = false;

        if (typeof persistActiveRound === "function") {
            persistActiveRound();
        }

        showRoundDetailsScreen();
    });
}

    if (postRoundReturnBtn) {
        let postRoundReturnBusy = false;

        postRoundReturnBtn.type = "button";

        const handlePostRoundReturn = e => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (postRoundReturnBusy) return;
            if (!postRoundMode) return;
            if (!arePostRoundDetailsComplete()) return;

            postRoundReturnBusy = true;

            if (document.activeElement && typeof document.activeElement.blur === "function") {
                document.activeElement.blur();
            }

            finishPostRoundDetails();

            setTimeout(() => {
                postRoundReturnBusy = false;
            }, 300);
        };

        postRoundReturnBtn.addEventListener("pointerdown", handlePostRoundReturn);
    }

    if (resumeRoundBtn) {
        resumeRoundBtn.addEventListener("click", () => {
            const loaded = loadActiveRoundIfPresent();
            if (!loaded) return;

            resumingSavedRound = true;
            loadRoundBackground();

            if (roundJustCompleted) {
                if (postRoundMode) {
                    showRoundDetailsScreen();
                } else if (postRoundReturnTarget === "nineteenth") {
                    show19thHoleScreen();
                } else {
                    showRoundCompleteModal();
                }
                return;
            }

            showStatsScreen();
            updateHoleScreen();
        });
    }

if (newRoundBtn) {
    newRoundBtn.addEventListener("click", () => {
        const saved = getParsedActiveRound();

        if (saved) {
            showDeleteRoundPopup();
        } else {
            clearActiveRoundStorage();
            removeFromStorage(ROUND_BG_INDEX_KEY);
            resetForBrandNewRound();
            showRoundDetailsScreen();
        }
    });
}

if (keepCurrentRoundBtn) {
    keepCurrentRoundBtn.addEventListener("click", () => {
        hideDeleteRoundPopup();
    });
}


function forceClearRoundDetailsForm() {
    const ids = [
        "roundType",
        "courseName",
        "startingHole",
        "teeSlope",
        "teeRating",
        "teeYardage",
        "frontPar",
        "backPar",
        "coursePar"
    ];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.value = "";

        if (el.tagName === "SELECT") {
            el.selectedIndex = 0;
        }
    });

    if (roundDateField) {
        roundDateField.value = "";
        roundDateField.dataset.autofilled = "true";
    }

    document.querySelectorAll(".yardage-input, .compact-yardage-input, .compact-par-input").forEach(input => {
        input.value = "";
    });

    const yardageTotal = document.getElementById("holeYardagesTotal");
    if (yardageTotal) yardageTotal.textContent = "0";

    setAutofilledTodayDate();
    clearAllValidationHighlights();
    updateCoursePar();
    updateParRowState();
    updateRoundDetailCompletion();
    updateRoundDateDisplay();
}

function startCleanNewRoundNow(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") {
            e.stopImmediatePropagation();
        }
    }

    suppressResumePanelUntilStart = true;

    hideDeleteRoundPopup();
    hideResumePanel();

    clearActiveRoundStorage();
    removeFromStorage(ROUND_BG_INDEX_KEY);
// Keep hole yardages/pars entered on Round Details.
// They should not be wiped when starting the new round.
// localStorage.removeItem(HOLE_YARDAGES_KEY);
// localStorage.removeItem(HOLE_PARS_KEY);

    resetCurrentRound();

    suppressResumePanelUntilStart = true;

    forceClearRoundDetailsForm();
    hideResumePanel();

    if (appContainer) appContainer.style.display = "none";
    if (nineteenthHoleScreen) nineteenthHoleScreen.classList.add("hidden");
    if (roundDetailsScreen) roundDetailsScreen.style.display = "flex";

    requestAnimationFrame(() => {
        suppressResumePanelUntilStart = true;
        forceClearRoundDetailsForm();
        hideResumePanel();
        window.scrollTo(0, 0);
    });

    return false;
}
if (deleteAndStartNewBtn) {
    deleteAndStartNewBtn.addEventListener("click", startCleanNewRoundNow);
}
if (saveBtn) {
    saveBtn.addEventListener("click", () => {
        if (!roundStarted) return;

if (holes[currentHole - 1] && holes[currentHole - 1].saved && !window.editingSavedHole) {
    const wantsToEdit = window.confirm(
        "This hole has already been saved.\n\nDo you want to edit it?"
    );

    if (!wantsToEdit) {
        return;
    }

    // PHASE 2 — Re-open saved hole for editing. Do not save yet.
    window.editingSavedHole = true;
    saveBtn.classList.remove("inactive");
    saveBtn.textContent = "Update Hole";

    return;
}

        const validation = getHoleSaveValidation();

        if (!validation.valid) {
            pendingSaveAfterValidation = true;
            autoSaveInProgress = false;
            showHoleSaveValidationPopup();
            return;
        }

pendingSaveAfterValidation = false;
autoSaveInProgress = false;

// ✅ Zero Putts confirmation only after required fields pass
const puttsForZeroCheck = parseInt(document.getElementById("putts")?.value, 10);

if (puttsForZeroCheck === 0 && window.zeroPuttsConfirmed !== true) {
    const zeroPuttsPopup = document.getElementById("zeroPuttsPopup");
    const puttsInput = document.getElementById("putts");

    if (puttsInput) {
        puttsInput.closest(".stat-counter")?.classList.add("validation-highlight");
    }

    if (zeroPuttsPopup) {
        zeroPuttsPopup.style.display = "flex";
    }
    return;
}

window.zeroPuttsConfirmed = false;

        const saveConfirmText = document.getElementById("saveConfirmText");
        const saveConfirmHeader = document.getElementById("saveConfirmHeader");

        if (saveConfirmHeader) {
    saveConfirmHeader.textContent = `Save Hole ${currentHole}?`;
}

if (saveConfirmText) {
    let performanceCount = 0;
    const currentHoleData = holes[currentHole - 1] || {};

// Tee Shot
if (
    (window.teeShotDraft &&
        window.teeShotDraft.direction &&
        window.teeShotDraft.distance !== null) ||
    currentHoleData.teeShot
) {
    performanceCount++;
}

// Approach
if (
    (window.approachDraft &&
        window.approachDraft.distance !== null &&
        window.approachDraft.result) ||
    currentHoleData.approach
) {
    performanceCount++;
}

// Putting
if (
    (window.puttingDraft && window.puttingDraft.putts && window.puttingDraft.putts.length > 0) ||
    currentHoleData.putting
) {
    performanceCount++;
}

// Short Game
if (
    (window.shortGameDraft &&
        window.shortGameDraft.type &&
        window.shortGameDraft.distance !== null &&
        window.shortGameDraft.result) ||
    currentHoleData.shortGame
) {
    performanceCount++;
}

// Notes
const notesText = window.notesDraft ? String(window.notesDraft.text || "").trim() : "";
const notesTags = window.notesDraft && Array.isArray(window.notesDraft.tags) ? window.notesDraft.tags : [];
if (
    (notesText || notesTags.length > 0) ||
    (currentHoleData.notes &&
        ((Array.isArray(currentHoleData.notes.tags) && currentHoleData.notes.tags.length > 0) ||
         String(currentHoleData.notes.text || "").trim() !== ""))
) {
    performanceCount++;
}

const countColors = [
  "#c62828", // 0 red
  "#d96b1a", // 1 orange-red
  "#9da61a", // 2 olive
  "#4f9a2a", // 3 greenish
  "#2f7d38", // 4 green
  "#1f6f2f"  // 5 strong green
];

const countColor = countColors[performanceCount] || "#c62828";
const countText = `${performanceCount} of 5`;

    saveConfirmText.innerHTML =
        `<span style="color:${countColor}; font-weight:800;">${countText} <br>Performance Stats added.</span><br>` +
        `<span style="color:black; font-weight:500;">Add more +Stats now, <br>or save this hole and move on.</span>`;
}

        if (saveConfirmPopup) saveConfirmPopup.style.display = "flex";
    });
}

   

if (saveConfirmCancel) {
    saveConfirmCancel.addEventListener("click", () => {
        returnToSavePopupAfterStats = true;

        if (saveConfirmPopup) saveConfirmPopup.style.display = "none";

        const enhancedStatsPanel = document.getElementById("enhancedStatsPanel");
        if (enhancedStatsPanel) {
            enhancedStatsPanel.classList.remove("hidden");
        }
    });
}


if (saveConfirmStay) {
    saveConfirmStay.addEventListener("click", () => {
        if (saveConfirmPopup) {
            saveConfirmPopup.style.display = "none";
        }
    });
}


if (teeShotValidationOK) {
    teeShotValidationOK.addEventListener("click", () => {
        const teeShotValidationPopup = document.getElementById("teeShotValidationPopup");
        if (teeShotValidationPopup) {
            teeShotValidationPopup.style.display = "none";
        }
    });
}


if (validationOK) {
    validationOK.addEventListener("click", () => {
        if (validationPopup) validationPopup.style.display = "none";
    });
}

    document.querySelectorAll(".hole-par-radio").forEach(label => {
        label.addEventListener("click", () => {
            clearValidationHighlight(".hole-par-container");
            tryAutoSaveAfterCorrection();
        });
    });

    const putts = document.getElementById("putts");
    const score = document.getElementById("score");

    if (putts) {
        putts.addEventListener("input", () => {
            clearValidationHighlightFromElement(putts.closest(".stat-counter"));
            tryAutoSaveAfterCorrection();
        });
    }

    if (score) {
        score.addEventListener("input", () => {
            clearValidationHighlightFromElement(score.closest(".stat-counter"));
            tryAutoSaveAfterCorrection();
        });
    }

    if (saveConfirmOK) {
        saveConfirmOK.addEventListener("click", () => {
            completeHoleSave();
        });
    }

    const exitSummary = document.getElementById("exitSummary");
    if (exitSummary) {
        exitSummary.addEventListener("click", () => {
            const summaryModal = document.getElementById("summaryModal");
            if (summaryModal) summaryModal.style.display = "none";
            restoreAfterSummaryExit();
        });
    }


// ===== PERFORMANCE TRENDS EXPERIMENT START =====
// Button wiring for optional read-only Performance Trends popup.
// Safe to remove if feature does not feel right.

const performanceTrendButtonIds = [
    "viewPerformanceTrendsBtn",
    "nineteenthPerformanceTrendsBtn",
    "clubhousePerformanceTrendsBtn"
];

performanceTrendButtonIds.forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.addEventListener("click", () => {
        showPerformanceTrends();
    });
});

const exitPerformanceTrends = document.getElementById("exitPerformanceTrends");
if (exitPerformanceTrends) {
    exitPerformanceTrends.addEventListener("click", () => {
        hidePerformanceTrends();
    });
}

// ===== PERFORMANCE TRENDS EXPERIMENT END =====


    if (frontParField) {
        frontParField.addEventListener("input", () => {
            updateCoursePar();
            updateParRowState();
        });
        frontParField.addEventListener("change", updateParRowState);
    }

    if (backParField) {
        backParField.addEventListener("input", () => {
            updateCoursePar();
            updateParRowState();
        });
        backParField.addEventListener("change", updateParRowState);
    }

    const startRoundBtn = document.getElementById("startRoundBtn");
   if (startRoundBtn) {
    startRoundBtn.addEventListener("click", () => {
        suppressResumePanelUntilStart = false;

        updateCoursePar();
        updateParRowState();

        if (postRoundMode) {
            return;
        }

        const validation = validateRoundDetailsForStart();
        if (!validation.valid) {
            if (validationText) validationText.textContent = validation.message;
            if (validationPopup) validationPopup.style.display = "flex";
            return;
        }

        const startingHoleField = document.getElementById("startingHole");
        if (startingHoleField) {
            startingHoleField.disabled = anyHoleSaved();
        }

        const isBrandNewRound = !roundStarted || !anyHoleSaved();

        if (isBrandNewRound) {
            startingHole = parseInt(document.getElementById("startingHole")?.value, 10) || 1;
            playOrder = buildPlayOrder(startingHole);
            currentHoleIndex = 0;
            syncCurrentHoleFromIndex();
            roundFinalized = false;
            advanceRoundBackground();
        }

        suppressResumePanelUntilStart = false;
        roundStarted = true;
        roundFinalized = false;
        persistActiveRound();
        updateResumePanel();
        showStatsScreen();
    });
}

    const roundCompleteSummaryBtn = document.getElementById("roundCompleteSummaryBtn");
    if (roundCompleteSummaryBtn) {
        roundCompleteSummaryBtn.addEventListener("click", e => {
            const roundCompleteModal = document.getElementById("roundCompleteModal");
            if (roundCompleteModal) roundCompleteModal.style.display = "none";
            viewSummary(e, "roundComplete");
        });
    }

    const roundCompleteDetailsBtn = document.getElementById("roundCompleteDetailsBtn");
    if (roundCompleteDetailsBtn) {
        roundCompleteDetailsBtn.addEventListener("click", () => {
            const roundCompleteModal = document.getElementById("roundCompleteModal");
            if (roundCompleteModal) roundCompleteModal.style.display = "none";
            openPostRoundDetails("roundComplete");
        });
    }

    const roundCompleteCloseBtn = document.getElementById("roundCompleteCloseBtn");
if (roundCompleteCloseBtn) {
    roundCompleteCloseBtn.addEventListener("click", () => {
        postRoundMode = false;
        postRoundReturnTarget = "nineteenth";
        persistActiveRound();

        if (typeof finalizeCompletedRoundIfNeeded === "function") {
            finalizeCompletedRoundIfNeeded();
        }

        show19thHoleScreen();
    });
}

window.renderSavedRounds = function () {
    const savedRoundsList = document.getElementById("savedRoundsList");
    if (!savedRoundsList) return;

    const rounds = getCompletedRounds();
    savedRoundsList.innerHTML = "";

    if (!rounds || !rounds.length) {
        savedRoundsList.innerHTML = "<p style='color:white;'>No saved rounds yet.</p>";
        return;
    }

    rounds.forEach(round => {
        const item = document.createElement("div");
        item.className = "saved-round-item";
        item.style.cursor = "pointer";

        const dateText = round.details?.roundDate
            ? round.details.roundDate
            : new Date(round.date).toLocaleDateString();

        const courseName = round.details?.courseName || "Unknown Course";

        let totalScore = "";
        let vsParText = "";

        if (round.summary) {
            totalScore = round.summary.totalScore ?? "";
            const vsPar = Number(round.summary.vsPar ?? 0);
            vsParText = vsPar === 0 ? "E" : `${vsPar > 0 ? "+" : ""}${vsPar}`;
        } else {
            const savedHoles = Array.isArray(round.holes)
                ? round.holes.filter(h => h && h.saved)
                : [];

            const total = savedHoles.reduce((sum, h) => sum + Number(h.score || 0), 0);
            const coursePar = Number(round.details?.coursePar || 0);
            const vsPar = coursePar ? (total - coursePar) : 0;

            totalScore = total;
            vsParText = vsPar === 0 ? "E" : `${vsPar > 0 ? "+" : ""}${vsPar}`;
        }

        let resultClass = "";
        if (vsParText === "E") resultClass = "score-even";
        else if (vsParText.startsWith("+")) resultClass = "score-over";
        else resultClass = "score-under";

        item.innerHTML = `
            <div><strong>${dateText}</strong></div>
            <div>${courseName}</div>
            <div class="${resultClass}">Score: ${totalScore} (${vsParText})</div>
        `;

        item.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();

            showSummaryForRound(
                round.holes || [],
                null,
                "savedRoundsList",
                ""
            );
        });

        savedRoundsList.appendChild(item);
    });
};

    const nineteenthSummaryBtn = document.getElementById("nineteenthSummaryBtn");
    if (nineteenthSummaryBtn) {
        nineteenthSummaryBtn.addEventListener("click", e => {
            viewSummary(e, "nineteenth");
        });
        nineteenthSummaryBtn.addEventListener("touchend", e => {
            e.preventDefault();
            viewSummary(e, "nineteenth");
        }, { passive: false });
    }

    const nineteenthDetailsBtn = document.getElementById("nineteenthDetailsBtn");
    if (nineteenthDetailsBtn) {
        nineteenthDetailsBtn.addEventListener("click", () => {
            openPostRoundDetails("nineteenth");
        });
    }

    
const nineteenthNewRoundBtn = document.getElementById("nineteenthNewRoundBtn");
if (nineteenthNewRoundBtn) {
    nineteenthNewRoundBtn.addEventListener("click", () => {
        const splash = document.getElementById("splashScreen");
        const overlay = document.getElementById("fadeOverlay");
        const finalClosurePopup = document.getElementById("finalClosurePopup");
        const roundCompleteModal = document.getElementById("roundCompleteModal");
        const summaryModal = document.getElementById("summaryModal");
        const clubhouseScreen = document.getElementById("clubhouseScreen");
        const clubhouseDoneScreen = document.getElementById("clubhouseDoneScreen");

        if (splash) splash.style.display = "none";
        if (overlay) overlay.style.display = "none";
        if (finalClosurePopup) finalClosurePopup.style.display = "none";
        if (roundCompleteModal) roundCompleteModal.style.display = "none";
        if (summaryModal) summaryModal.style.display = "none";
        if (clubhouseScreen) clubhouseScreen.classList.add("hidden");
        if (clubhouseDoneScreen) clubhouseDoneScreen.classList.add("hidden");

        resetForBrandNewRound();
        showRoundDetailsScreen();
    });
}

    const viewSavedRoundsBtn = document.getElementById("viewSavedRoundsBtn");

    function showPerformanceChartsScreen() {
        const savedRoundsScreen = document.getElementById("savedRoundsScreen");
        const performanceChartsScreen = document.getElementById("performanceChartsScreen");
        const savedRoundsListScreen = document.getElementById("savedRoundsListScreen");

        if (savedRoundsScreen) savedRoundsScreen.classList.add("hidden");
        if (savedRoundsListScreen) savedRoundsListScreen.classList.add("hidden");
        if (performanceChartsScreen) performanceChartsScreen.classList.remove("hidden");

        if (typeof renderPerformanceReview === "function") {
            setTimeout(() => {
                renderPerformanceReview();
            }, 120);
        }
    }

    function showSavedRoundsListScreen() {
        const savedRoundsScreen = document.getElementById("savedRoundsScreen");
        const performanceChartsScreen = document.getElementById("performanceChartsScreen");
        const savedRoundsListScreen = document.getElementById("savedRoundsListScreen");

        if (savedRoundsScreen) savedRoundsScreen.classList.add("hidden");
        if (performanceChartsScreen) performanceChartsScreen.classList.add("hidden");
        if (savedRoundsListScreen) savedRoundsListScreen.classList.remove("hidden");

        if (typeof renderSavedRounds === "function") {
            renderSavedRounds();
        }
    }

    if (viewSavedRoundsBtn) {
    const openSavedRoundsFromWrapUp = e => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const savedRoundsScreen = document.getElementById("savedRoundsScreen");
        const performanceChartsScreen = document.getElementById("performanceChartsScreen");
        const savedRoundsListScreen = document.getElementById("savedRoundsListScreen");
        const nineteenthHoleScreen = document.getElementById("nineteenthHoleScreen");
        const roundDetailsScreen = document.getElementById("roundDetailsScreen");
        const appContainer = document.getElementById("appContainer");

        if (roundDetailsScreen) roundDetailsScreen.style.display = "none";
        if (appContainer) appContainer.style.display = "none";
        if (nineteenthHoleScreen) nineteenthHoleScreen.classList.add("hidden");
        if (performanceChartsScreen) performanceChartsScreen.classList.add("hidden");

        // 🔥 KEY CHANGE — go to HUB instead of list
        if (savedRoundsListScreen) savedRoundsListScreen.classList.add("hidden");
        if (savedRoundsScreen) savedRoundsScreen.classList.remove("hidden");

        window.scrollTo(0, 0);
    };

    viewSavedRoundsBtn.addEventListener("click", openSavedRoundsFromWrapUp);
    viewSavedRoundsBtn.addEventListener("touchend", openSavedRoundsFromWrapUp, { passive: false });
}

    const savedRoundsBackBtn = document.getElementById("savedRoundsBackBtn");
    if (savedRoundsBackBtn) {
        savedRoundsBackBtn.addEventListener("click", () => {
            const savedRoundsScreen = document.getElementById("savedRoundsScreen");

            if (savedRoundsScreen) {
                savedRoundsScreen.classList.add("hidden");
            }

            if (roundJustCompleted || postRoundMode) {
                show19thHoleScreen();
            } else {
                showStatsScreen();
            }

            window.scrollTo(0, 0);
        });
    }

    const openPerformanceChartsBtn = document.getElementById("openPerformanceChartsBtn");
    if (openPerformanceChartsBtn) {
        openPerformanceChartsBtn.addEventListener("click", () => {
            showPerformanceChartsScreen();
        });
    }

    const openSavedRoundsListBtn = document.getElementById("openSavedRoundsListBtn");
    if (openSavedRoundsListBtn) {
        openSavedRoundsListBtn.addEventListener("click", () => {
            showSavedRoundsListScreen();
        });
    }

    const performanceChartsBackBtn = document.getElementById("performanceChartsBackBtn");
    if (performanceChartsBackBtn) {
        performanceChartsBackBtn.addEventListener("click", () => {
            showSavedRoundsHub();
        });
    }

    const savedRoundsListBackBtn = document.getElementById("savedRoundsListBackBtn");
    if (savedRoundsListBackBtn) {
        savedRoundsListBackBtn.addEventListener("click", () => {
            showSavedRoundsHub();
        });
    }

    const savedRoundsHubBackBtn = document.getElementById("savedRoundsHubBackBtn");
    if (savedRoundsHubBackBtn) {
        savedRoundsHubBackBtn.addEventListener("click", () => {
            const savedRoundsScreen = document.getElementById("savedRoundsScreen");

            if (savedRoundsScreen) {
                savedRoundsScreen.classList.add("hidden");
            }

            const savedHoleCount = holes.filter(h => h && h.saved).length;
            const validCompletedRound =
                savedHoleCount === getExpectedRoundLength() ||
                (
                    roundEndedEarly &&
                    completedHoleCount != null &&
                    savedHoleCount === Number(completedHoleCount)
                );

            if (validCompletedRound && (roundJustCompleted || postRoundMode)) {
                show19thHoleScreen();
            } else {
                showStatsScreen();
            }

            window.scrollTo(0, 0);
        });
    }


    /* + STATS PANEL */
    const openEnhancedStatsBtn = document.getElementById("openEnhancedStats");
    const enhancedStatsPanel = document.getElementById("enhancedStatsPanel");
    const closeEnhancedStatsBtn = document.getElementById("closeEnhancedStats");
    const enhancedStatsDoneBtn = document.getElementById("doneEnhancedStats");
    const cancelEnhancedStatsBtn = document.getElementById("cancelEnhancedStats");

    if (openEnhancedStatsBtn && enhancedStatsPanel) {
        const updateEnhancedStatsHeader = () => {
            const holeLabel = enhancedStatsPanel.querySelector(".es-panel-hole");
            if (!holeLabel) return;

            let displayHole = currentHole || 1;

            let selectedPar = "";

            if (typeof getCurrentHoleParForTeeShot === "function") {
            selectedPar = getCurrentHoleParForTeeShot();
        } else {
            const selectedParRadio = document.querySelector('input[name="holePar"]:checked');
            if (selectedParRadio) selectedPar = selectedParRadio.value;
}

if (!selectedPar) selectedPar = "4";

            // ===== +Stats Header Text With Hole Yardage =====
const holeYardage =
    typeof getCurrentHoleYardage === "function"
        ? getCurrentHoleYardage()
        : null;

holeLabel.textContent = holeYardage
    ? `Hole ${displayHole} • Par ${selectedPar} • ${holeYardage} yds`
    : `Hole ${displayHole} • Par ${selectedPar}`;
        };

        openEnhancedStatsBtn.addEventListener("click", () => {
            updateEnhancedStatsHeader();
            refreshTeeShotTile();
            refreshApproachTile();
            refreshPuttingTile();
            refreshShortGameTile();
            refreshNotesTile();
            enhancedStatsPanel.classList.remove("hidden");
        });
    }

    if (closeEnhancedStatsBtn && enhancedStatsPanel) {
        closeEnhancedStatsBtn.addEventListener("click", () => {
            enhancedStatsPanel.classList.add("hidden");
        });
    }
if (enhancedStatsDoneBtn && enhancedStatsPanel) {
    enhancedStatsDoneBtn.addEventListener("click", () => {
        enhancedStatsPanel.classList.add("hidden");

        if (returnToSavePopupAfterStats && saveConfirmPopup) {
            returnToSavePopupAfterStats = false;
            saveConfirmPopup.style.display = "flex";
setTimeout(() => {
    if (saveBtn) saveBtn.click();
}, 0);
        }
    });
}


if (cancelEnhancedStatsBtn && enhancedStatsPanel) {
    cancelEnhancedStatsBtn.addEventListener("click", () => {
        enhancedStatsPanel.classList.add("hidden");
    });
}


    const openTeeShotStatsBtn = document.getElementById("openTeeShotStats");
    const teeShotPanel = document.getElementById("teeShotPanel");
    const closeTeeShotPanelBtn = document.getElementById("closeTeeShotPanel");
    const cancelTeeShotStatsBtn = document.getElementById("cancelTeeShotStats");
    const teeShotHoleLabel = document.getElementById("teeShotHoleLabel");

const updateTeeShotHeader = () => {
    if (!teeShotHoleLabel) return;

    const displayHole = currentHole || 1;
    const selectedPar = getCurrentHoleParForTeeShot();

    const holeYardage =
        typeof getCurrentHoleYardage === "function"
            ? getCurrentHoleYardage()
            : null;

    teeShotHoleLabel.textContent = holeYardage
        ? `Hole ${displayHole} • Par ${selectedPar} • ${holeYardage} yds`
        : `Hole ${displayHole} • Par ${selectedPar}`;
};

// Tee Shot open handler moved lower after Tee Shot helper functions are declared.

if (closeTeeShotPanelBtn && teeShotPanel && enhancedStatsPanel) {
    closeTeeShotPanelBtn.addEventListener("click", () => {
        teeShotPanel.classList.add("hidden");
        enhancedStatsPanel.classList.remove("hidden");
    });
}

if (cancelTeeShotStatsBtn && teeShotPanel && enhancedStatsPanel) {
    cancelTeeShotStatsBtn.addEventListener("click", () => {
        teeShotPanel.classList.add("hidden");
        enhancedStatsPanel.classList.remove("hidden");
    });
}

const teeDirLeftBtn = document.getElementById("teeDirLeft");
const teeDirCenterBtn = document.getElementById("teeDirCenter");
const teeDirRightBtn = document.getElementById("teeDirRight");

// Par 3-only Tee Shot result buttons
const teeDirLongBtn = document.getElementById("teeDirLong");
const teeDirShortBtn = document.getElementById("teeDirShort");
const teeDirHoledBtn = document.getElementById("teeDirHoled");

let teeChipButtons = document.querySelectorAll(".tee-chip-btn");
const teeDistanceDisplay = document.getElementById("teeDistanceDisplay");
window.teeClubButtons = document.querySelectorAll(".tee-club-btn");

// PHASE 2 — Tee Shot Club Used selection
window.teeClubButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        window.teeClubButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        window.teeShotDraft.club = btn.dataset.club || "D";
    });
});

window.teeShotDraft = window.teeShotDraft || {
    club: "D",
    direction: "",
    distance: null
};

const setTeeDirection = (direction) => {
    window.teeShotDraft.direction = direction;

    const firEl = document.getElementById("fir");
    const girEl = document.getElementById("gir");

    const currentPar =
        typeof getCurrentHoleParValue === "function"
            ? Number(getCurrentHoleParValue())
            : 4;

    if (currentPar === 3) {
        // Par 3: On Green checks GIR, never FIR.
        if (girEl) girEl.checked = direction === "center";
        if (firEl) firEl.checked = false;
    } else {
        // Par 4/5: Center checks FIR.
        if (firEl) firEl.checked = direction === "center";
    }

    if (teeDirLeftBtn) teeDirLeftBtn.classList.remove("active");
    if (teeDirCenterBtn) teeDirCenterBtn.classList.remove("active");
    if (teeDirRightBtn) teeDirRightBtn.classList.remove("active");
    if (teeDirLongBtn) teeDirLongBtn.classList.remove("active");
    if (teeDirShortBtn) teeDirShortBtn.classList.remove("active");
    if (teeDirHoledBtn) teeDirHoledBtn.classList.remove("active");

    if (direction === "left" && teeDirLeftBtn) teeDirLeftBtn.classList.add("active");
    if (direction === "center" && teeDirCenterBtn) teeDirCenterBtn.classList.add("active");
    if (direction === "right" && teeDirRightBtn) teeDirRightBtn.classList.add("active");
    if (direction === "long" && teeDirLongBtn) teeDirLongBtn.classList.add("active");
    if (direction === "short" && teeDirShortBtn) teeDirShortBtn.classList.add("active");
   // Holed is visual-only for now, so do not auto-select it when the Tee Shot panel opens.
if (direction === "holed" && teeDirHoledBtn && window.allowTeeHoledActive === true) {
    teeDirHoledBtn.classList.add("active");
}

    if (typeof updateTeeShotSummary === "function") {
        updateTeeShotSummary();
    }
};

const setTeeDistance = (distance) => {
    const cleanDistance = parseInt(distance, 10);

    if (isNaN(cleanDistance)) return;

    window.teeShotDraft.distance = cleanDistance;

    if (teeDistanceDisplay) {
        teeDistanceDisplay.textContent = cleanDistance + " yds";
    }

    teeChipButtons.forEach((btn) => {
        btn.classList.remove("active");
        if (parseInt(btn.dataset.distance, 10) === cleanDistance) {
            btn.classList.add("active");
        }
    });

    if (typeof updateTeeShotSummary === "function") {
        updateTeeShotSummary();
    }
};


const resetTeeShotDraft = () => {
    window.teeShotDraft.direction = "";
    window.teeShotDraft.distance = null;

    if (teeDirLeftBtn) teeDirLeftBtn.classList.remove("active");
    if (teeDirCenterBtn) teeDirCenterBtn.classList.remove("active");
    if (teeDirRightBtn) teeDirRightBtn.classList.remove("active");
    if (teeDirLongBtn) teeDirLongBtn.classList.remove("active");
    if (teeDirShortBtn) teeDirShortBtn.classList.remove("active");
    if (teeDirHoledBtn) teeDirHoledBtn.classList.remove("active");

    teeChipButtons.forEach((btn) => btn.classList.remove("active"));

    if (teeDistanceDisplay) {
        teeDistanceDisplay.textContent = "— yds";
    }

    if (typeof updateTeeShotSummary === "function") {
        updateTeeShotSummary();
    }
};

    const loadTeeShotForCurrentHole = () => {
        const holeData = holes[currentHole - 1];

if (holeData && holeData.teeShot) {
    resetTeeShotDraft();

    // PHASE 2 — Restore saved Tee Shot club when reopening hole
window.teeShotDraft.club = holeData.teeShot.club || "D";

document.querySelectorAll(".tee-club-btn").forEach(btn => {
    btn.classList.toggle(
        "active",
        btn.dataset.club === window.teeShotDraft.club
    );
});

    // Holed is visual-only for now.
    // Do not restore it when opening the Tee Shot panel.
    if (holeData.teeShot.direction === "holed") {
        if (typeof updateTeeShotSummary === "function") {
            updateTeeShotSummary();
        }
        return;
    }

    if (holeData.teeShot.direction) {
        setTeeDirection(holeData.teeShot.direction);
    }

    if (holeData.teeShot.distance !== null && holeData.teeShot.distance !== undefined) {
        setTeeDistance(parseInt(holeData.teeShot.distance, 10));
    }

    if (typeof updateTeeShotSummary === "function") {
        updateTeeShotSummary();
    }

} else {
    resetTeeShotDraft();

    // PHASE 2 — Reset club selection for unsaved holes when Tee Shot panel opens.
    window.teeShotDraft.club = "D";

    document.querySelectorAll(".tee-club-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.club === "D");
    });
}
    };
    

    if (teeDirLeftBtn) {
        teeDirLeftBtn.addEventListener("click", () => setTeeDirection("left"));
    }

    if (teeDirCenterBtn) {
        teeDirCenterBtn.addEventListener("click", () => setTeeDirection("center"));
    }

    if (teeDirRightBtn) {
        teeDirRightBtn.addEventListener("click", () => setTeeDirection("right"));
    }

    // ===== Par 3-only Tee Shot result button handlers =====
// Safe: these buttons are hidden on Par 4/5 by CSS.
if (teeDirLongBtn) {
    teeDirLongBtn.addEventListener("click", () => setTeeDirection("long"));
}

if (teeDirShortBtn) {
    teeDirShortBtn.addEventListener("click", () => setTeeDirection("short"));
}

if (teeDirHoledBtn) {
    teeDirHoledBtn.addEventListener("click", () => {
    window.allowTeeHoledActive = true;
    setTeeDirection("holed");
});
}

    if (teeChipButtons.length) {
        teeChipButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const distance = parseInt(btn.dataset.distance, 10);
                if (!isNaN(distance)) setTeeDistance(distance);
            });
        });
    }

const teeDistanceMinusBtn = document.getElementById("teeDistanceMinus");
const teeDistancePlusBtn = document.getElementById("teeDistancePlus");

const getCurrentHoleParForTeeShot = () => {
    return getCurrentHoleParValue();
};

const clampTeeDistance = (value) => {
    const par = getCurrentHoleParForTeeShot();

    if (par === 3) {
        return Math.max(100, Math.min(260, value));
    }

    return Math.max(100, Math.min(400, value));
};

const adjustTeeDistance = (amount) => {
    let currentDistance = Number(window.teeShotDraft.distance);

    if (!currentDistance || isNaN(currentDistance)) {
        currentDistance = getCurrentHoleParForTeeShot() === 3 ? 200 : 275;
    }

    const nextDistance = clampTeeDistance(currentDistance + amount);
    setTeeDistance(nextDistance);
};


/* ========================================
   SAFE TEE SHOT +/- HOLD HANDLING
   Tap = 1 yard
   Hold = repeats safely
======================================== */

let teeHoldTimer = null;
let teeHoldActive = false;

const stopTeeHoldRepeat = () => {
    teeHoldActive = false;

    if (teeHoldTimer) {
        clearInterval(teeHoldTimer);
        teeHoldTimer = null;
    }
};

const addHoldRepeat = (button, amount) => {
    if (!button) return;

    button.style.touchAction = "none";

    button.addEventListener("pointerdown", e => {
        e.preventDefault();
        e.stopPropagation();

        stopTeeHoldRepeat();

        teeHoldActive = true;
        adjustTeeDistance(amount);

        teeHoldTimer = setInterval(() => {
            if (!teeHoldActive) {
                stopTeeHoldRepeat();
                return;
            }

            adjustTeeDistance(amount);
        }, 90);

        if (button.setPointerCapture && e.pointerId != null) {
            try {
                button.setPointerCapture(e.pointerId);
            } catch (err) {
                // Safe no-op if browser refuses capture
            }
        }
    });

    [
        "pointerup",
        "pointercancel",
        "pointerleave",
        "lostpointercapture"
    ].forEach(evt => {
        button.addEventListener(evt, stopTeeHoldRepeat);
    });
};

addHoldRepeat(teeDistanceMinusBtn, -1);
addHoldRepeat(teeDistancePlusBtn, 1);

if (openTeeShotStatsBtn && teeShotPanel && enhancedStatsPanel) {
    updateTeeShotDirectionLayout();
    openTeeShotStatsBtn.addEventListener("click", () => {
        hidePerformanceStatPanels("teeShotPanel");
        enhancedStatsPanel.classList.add("hidden");

// Par 3-only layout refresh must run before loading saved Tee Shot state.

const teePar3TopResult = document.getElementById("teePar3TopResult");
const teePar3BottomResults = document.getElementById("teePar3BottomResults");
updateTeeShotDirectionLayout();
updateTeeShotDistanceChips();
loadTeeShotForCurrentHole();
updateTeeShotHeader();



        if (typeof updateTeeShotSummary === "function") {
            updateTeeShotSummary();
        }

        teeShotPanel.classList.remove("hidden");

const summaryBox = document.querySelector("#teeShotPanel .tee-shot-summary-box");
if (summaryBox) {
    summaryBox.classList.remove("protip-reference-highlight");
}

if (teePar3ExtraResults) {
    teePar3ExtraResults.classList.toggle("hidden", currentPar !== 3);
}

startTeeShotTipAttention();
    });
}


window.addEventListener("blur", stopTeeHoldRepeat);
document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopTeeHoldRepeat();
});



    const saveTeeShotStatsBtn = document.getElementById("saveTeeShotStats");
    const teeShotSummaryText = document.getElementById("teeShotSummaryText");

const updateTeeShotDistanceChips = () => {
    const chipRow = document.getElementById("teeShotChipRow");
    if (!chipRow) return;

    const par = getCurrentHoleParForTeeShot();

    const values = Number(par) === 3
        ? [160, 180, 200, 220]
        : [250, 275, 300, 325];

    chipRow.innerHTML = values.map(val => `
        <button class="tee-chip-btn" type="button" data-distance="${val}">
            ${val}
        </button>
    `).join("");

    teeChipButtons = chipRow.querySelectorAll(".tee-chip-btn");

    teeChipButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const distance = parseInt(btn.dataset.distance, 10);

            if (!isNaN(distance)) {
                setTeeDistance(distance);
            }
        });
    });
};


const getCurrentHoleYardage = () => {
    try {
        const saved = localStorage.getItem(HOLE_YARDAGES_KEY);
        if (!saved) return null;

        const yardages = JSON.parse(saved);
        if (!Array.isArray(yardages)) return null;

        const yds = parseInt(yardages[currentHole - 1], 10);
        return yds > 0 ? yds : null;
    } catch (err) {
        console.error("Could not read hole yardage", err);
        return null;
    }
};


const updateTeeShotSummary = () => {
    if (!teeShotSummaryText) return;

    const direction = window.teeShotDraft.direction;
    const distance = window.teeShotDraft.distance;

    const baseImage = document.getElementById("teeShotBaseImage");
    const flightLine = document.getElementById("teeShotFlightLine");
    const endDot = document.getElementById("teeShotEndDot");

    const line100 = document.getElementById("teeShot100Line");
    const line200 = document.getElementById("teeShot200Line");
    const line300 = document.getElementById("teeShot300Line");

    const text100 = document.getElementById("teeShot100Text");
    const text200 = document.getElementById("teeShot200Text");
    const text300 = document.getElementById("teeShot300Text");

    const holeData = holes[currentHole - 1];
    const selectedParEl = document.querySelector('input[name="holePar"]:checked');
    const par = getCurrentHoleParForTeeShot();
    const isPar3 = par === 3;

    const actualHoleYardage =
    typeof getCurrentHoleYardage === "function"
        ? getCurrentHoleYardage()
        : null;

    if (baseImage) {
        baseImage.src = isPar3
            ? "images/fairways-3.png"
            : "images/fairways-45.png";
    }

    const x1 = 115;
    const y1 = 130;

    let mark1;
    let mark2;
    let mark3;
    let label1;
    let label2;
    let label3;
    let yardsAtFinalMarker;
    let maxDist;

    if (isPar3 && actualHoleYardage) {
    mark1 = 300;
    mark2 = 515;
    mark3 = 735;

        label1 = `${Math.round(actualHoleYardage * 0.33)} yds`;
        label2 = `${Math.round(actualHoleYardage * 0.66)} yds`;
        label3 = `${actualHoleYardage} yds`;

        yardsAtFinalMarker = actualHoleYardage;
        maxDist = actualHoleYardage + 40;
    } else if (isPar3) {
        mark1 = 220;
        mark2 = 430;
        mark3 = 610;

        label1 = "75 yds";
        label2 = "150 yds";
        label3 = "225 yds";

        yardsAtFinalMarker = 225;
        maxDist = 260;
    } else {
        mark1 = 250;
        mark2 = 450;
        mark3 = 650;

        label1 = "100 yds";
        label2 = "200 yds";
        label3 = "300 yds";

        yardsAtFinalMarker = 300;
        maxDist = 350;
    }

    if (line100) { line100.setAttribute("x1", mark1); line100.setAttribute("x2", mark1); }
    if (line200) { line200.setAttribute("x1", mark2); line200.setAttribute("x2", mark2); }
    if (line300) { line300.setAttribute("x1", mark3); line300.setAttribute("x2", mark3); }

    if (text100) { text100.setAttribute("x", mark1); text100.setAttribute("y", "-32"); text100.textContent = label1; }
    if (text200) { text200.setAttribute("x", mark2); text200.setAttribute("y", "-32"); text200.textContent = label2; }
    if (text300) { text300.setAttribute("x", mark3); text300.setAttribute("y", "-32"); text300.textContent = label3; }

    if (direction && distance !== null && Number(distance) > 0) {
        const prettyDirection =
            direction.charAt(0).toUpperCase() + direction.slice(1);

        const remainingToHole =
    actualHoleYardage && distance
        ? Math.max(0, actualHoleYardage - distance)
        : null;

    teeShotSummaryText.innerHTML = remainingToHole !== null
        ? `${prettyDirection} • ${distance} yds • <span class="tee-summary-highlight">${remainingToHole} yds to hole</span>`
        : `${prettyDirection} • ${distance} yds`;

        const d = Math.max(0, Math.min(maxDist, distance));
        const scaleWidth = mark3 - x1;
        const x2 = x1 + (d / yardsAtFinalMarker) * scaleWidth;

        let y2 = y1;
        if (direction === "left") y2 = 92;
        if (direction === "right") y2 = 168;

        if (flightLine) {
            flightLine.setAttribute("x1", x1);
            flightLine.setAttribute("y1", y1);
            flightLine.setAttribute("x2", x2);
            flightLine.setAttribute("y2", y2);
        }

        if (endDot) {
            endDot.setAttribute("cx", x2);
            endDot.setAttribute("cy", y2);
        }
    } else {
        teeShotSummaryText.innerHTML = actualHoleYardage
            ? `<span class="tee-summary-highlight">${actualHoleYardage} yds to hole</span>`
            : "No tee shot saved yet.";

        if (flightLine) {
            flightLine.setAttribute("x1", x1);
            flightLine.setAttribute("y1", y1);
            flightLine.setAttribute("x2", x1);
            flightLine.setAttribute("y2", y1);
        }

        if (endDot) {
            endDot.setAttribute("cx", x1);
            endDot.setAttribute("cy", y1);
        }
    }
};

if (saveTeeShotStatsBtn && teeShotPanel) {
    saveTeeShotStatsBtn.addEventListener("click", () => {
        if (!window.teeShotDraft.direction || window.teeShotDraft.distance === null) {
            const teeShotValidationPopup = document.getElementById("teeShotValidationPopup");
            if (teeShotValidationPopup) {
                teeShotValidationPopup.style.display = "flex";
            }
            return;
        }

        saveTeeShot();
    });
}

    if (enhancedStatsDoneBtn && enhancedStatsPanel) {
        enhancedStatsDoneBtn.addEventListener("click", () => {
            enhancedStatsPanel.classList.add("hidden");
        });
    }



/* ===== Universal +Stats ProTip System =====
   One shared system for Tee Shot, Approach, Short Game, Putting, and Notes.
   Each popup can have its own text in HTML and its own vertical position in CSS.
======================================== */

const STRACKER_PROTIPS = {
    teeShot: {
        panelId: "teeShotPanel",
        buttonId: "teeShotTipBtn",
        popupId: "teeShotTipPopup",
        closeId: "closeTeeShotTipBtn",
        openTileId: "openTeeShotStats",
        saveBtnId: "saveTeeShotStats",
        closePanelId: "closeTeeShotPanel",
        highlightSelector: "#teeShotSummaryText",
        isSaved: () => !!(holes[currentHole - 1] && holes[currentHole - 1].teeShot)
    },
    approach: {
        panelId: "approachPanel",
        buttonId: "approachTipBtn",
        popupId: "approachTipPopup",
        closeId: "closeApproachTipBtn",
        openTileId: "openApproachStats",
        saveBtnId: "saveApproachStats",
        closePanelId: "closeApproachPanel",
        highlightSelector: "#approachDistanceDisplay",
        isSaved: () => !!(holes[currentHole - 1] && holes[currentHole - 1].approach)
    },
    shortGame: {
        panelId: "shortGamePanel",
        buttonId: "shortGameTipBtn",
        popupId: "shortGameTipPopup",
        closeId: "closeShortGameTipBtn",
        openTileId: "openShortGameStats",
        saveBtnId: "saveShortGameStats",
        closePanelId: "closeShortGamePanel",
        highlightSelector: "#shortGameDistanceDisplay",
        isSaved: () => !!(holes[currentHole - 1] && holes[currentHole - 1].shortGame)
    },
    putting: {
        panelId: "puttingPanel",
        buttonId: "puttingTipBtn",
        popupId: "puttingTipPopup",
        closeId: "closePuttingTipBtn",
        openTileId: "openPuttingStats",
        saveBtnId: "savePuttingStats",
        closePanelId: "closePuttingPanel",
        highlightSelector: "#puttingDistanceDisplay",
        isSaved: () => !!(holes[currentHole - 1] && holes[currentHole - 1].putting)
    },
    notes: {
        panelId: "notesPanel",
        buttonId: "notesTipBtn",
        popupId: "notesTipPopup",
        closeId: "closeNotesTipBtn",
        openTileId: "openNotesStats",
        saveBtnId: "saveNotesStats",
        closePanelId: "closeNotesPanel",
        highlightSelector: "#holeNotesText",
        isSaved: () => {
            const note = holes[currentHole - 1] && holes[currentHole - 1].notes;
            return !!(note && ((Array.isArray(note.tags) && note.tags.length > 0) || String(note.text || "").trim() !== ""));
        }
    }
};

const strackerProTipState = {};

function getProTipConfig(key) {
    return STRACKER_PROTIPS[key] || null;
}

function getProTipState(key) {
    if (!strackerProTipState[key]) {
        strackerProTipState[key] = { timer: null, hasOpened: false };
    }
    return strackerProTipState[key];
}

function getCurrentProTipKeyFromButton(buttonId) {
    return Object.keys(STRACKER_PROTIPS).find(key => STRACKER_PROTIPS[key].buttonId === buttonId) || null;
}

function getProTipButton(key) {
    const cfg = getProTipConfig(key);
    return cfg ? document.querySelector(`#${cfg.panelId} #${cfg.buttonId}`) : null;
}

function getProTipHighlightTarget(key) {
    const cfg = getProTipConfig(key);
    return cfg && cfg.highlightSelector ? document.querySelector(cfg.highlightSelector) : null;
}

function clearProTipHighlight(key) {
    const target = getProTipHighlightTarget(key);
    if (target) {
        target.classList.remove("protip-target-highlight");
        target.classList.remove("approach-protip-highlight");
    }
}

function addProTipHighlight(key) {
    const target = getProTipHighlightTarget(key);
    if (target) {
        target.classList.add("protip-target-highlight");
        if (key === "approach") {
            target.classList.add("approach-protip-highlight");
        }
    }
}
function isProTipSaved(key) {
    const cfg = getProTipConfig(key);
    if (!cfg || typeof cfg.isSaved !== "function") return false;

    try {
        return !!cfg.isSaved();
    } catch (err) {
        return false;
    }
}

function runProTipBlink(tipBtn) {
    if (!tipBtn) return;

    tipBtn.classList.remove("protip-attention");
    void tipBtn.offsetWidth;
    tipBtn.classList.add("protip-attention");

    setTimeout(() => {
        tipBtn.classList.remove("protip-attention");
    }, 3200);
}

function stopProTipAttention(key, markOpened = true) {
    const state = getProTipState(key);
    const tipBtn = getProTipButton(key);

    if (markOpened) state.hasOpened = true;

    if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
    }

    if (tipBtn) {
        tipBtn.classList.remove("protip-attention");
    }
}

function startProTipAttention(key) {
    const cfg = getProTipConfig(key);
    const state = getProTipState(key);
    const tipBtn = getProTipButton(key);

    if (!cfg || !tipBtn) return;

    if (isProTipSaved(key)) {
        stopProTipAttention(key, false);
        return;
    }

    if (state.hasOpened) return;

    if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
    }

    state.timer = setTimeout(() => {
        if (state.hasOpened || isProTipSaved(key)) return;

        runProTipBlink(tipBtn);

        state.timer = setTimeout(() => {
            startProTipAttention(key);
        }, 4000);
    }, 2000);
}

function resetAndStartProTipForPanel(key) {
    const cfg = getProTipConfig(key);
    if (!cfg) return;

    const state = getProTipState(key);
    state.hasOpened = false;

    clearProTipHighlight(key);

    if (isProTipSaved(key)) {
        stopProTipAttention(key, false);
        return;
    }

    startProTipAttention(key);
}

function openProTipPopup(key) {
    const cfg = getProTipConfig(key);
    if (!cfg) return;

    stopProTipAttention(key, true);

    const popup = document.getElementById(cfg.popupId);
    if (popup) popup.classList.remove("hidden");

    addProTipHighlight(key);
}

function closeProTipPopup(key) {
    const cfg = getProTipConfig(key);
    if (!cfg) return;

    const popup = document.getElementById(cfg.popupId);
    if (popup) popup.classList.add("hidden");

    clearProTipHighlight(key);
}

function closeAllProTipPopups() {
    Object.keys(STRACKER_PROTIPS).forEach(key => closeProTipPopup(key));
}

// Compatibility wrappers for older Tee/Approach calls already in this app.
function startTeeShotTipAttention() {
    resetAndStartProTipForPanel("teeShot");
}

function stopTeeShotTipAttention() {
    stopProTipAttention("teeShot", true);
}

function startApproachTipAttention() {
    resetAndStartProTipForPanel("approach");
}

function stopApproachTipAttention() {
    stopProTipAttention("approach", true);
}

window.startApproachTipAttentionP2 = function () {
    resetAndStartProTipForPanel("approach");
};

window.stopApproachTipAttentionP2 = function () {
    stopProTipAttention("approach", true);
};

// Main ProTip click handling.
document.addEventListener("click", function (e) {
    Object.keys(STRACKER_PROTIPS).forEach(key => {
        const cfg = STRACKER_PROTIPS[key];

        if (e.target.closest(`#${cfg.panelId} #${cfg.buttonId}`)) {

            // Refresh Tee Shot Par 3 / Par 4-5 wording before opening tip.
            if (key === "teeShot" && typeof updateTeeShotDirectionLayout === "function") {
                updateTeeShotDirectionLayout();
            }

            openProTipPopup(key);
        }

        if (e.target.closest(`#${cfg.closeId}`)) {
            closeProTipPopup(key);
        }
    });
});

// Start tip pulse after each +Stats panel opens, and stop it once that stat is saved or panel is closed.
document.addEventListener("DOMContentLoaded", () => {
    Object.keys(STRACKER_PROTIPS).forEach(key => {
        const cfg = STRACKER_PROTIPS[key];

        const openTile = document.getElementById(cfg.openTileId);
        if (openTile) {
            openTile.addEventListener("click", () => {
                setTimeout(() => resetAndStartProTipForPanel(key), 450);
            });
        }

        const saveBtn = document.getElementById(cfg.saveBtnId);
        if (saveBtn) {
            saveBtn.addEventListener("click", () => {
                stopProTipAttention(key, false);
                closeProTipPopup(key);
            });
        }

        const closePanelBtn = document.getElementById(cfg.closePanelId);
        if (closePanelBtn) {
            closePanelBtn.addEventListener("click", () => {
                stopProTipAttention(key, false);
                closeProTipPopup(key);
            });
        }
    });
});


        /* HOLE YARDAGES */
    const addHoleYardagesBtn = document.getElementById("addHoleYardagesBtn");
    const holeYardagesPopup = document.getElementById("holeYardagesPopup");
    const closeHoleYardagesBtn = document.getElementById("closeHoleYardagesBtn");
    const saveHoleYardagesBtn = document.getElementById("saveHoleYardagesBtn");
    const cancelHoleYardagesBtn = document.getElementById("cancelHoleYardagesBtn");
    const teeYardageField = document.getElementById("teeYardage");
    const HOLE_YARDAGES_KEY = "strackerPhase2HoleYardages";
    const HOLE_PARS_KEY = "strackerPhase2HolePars";

    const getHoleYardages = () => {
        const yardages = [];

        for (let i = 1; i <= 18; i++) {
            const input = document.getElementById(`yardage${i}`);
            yardages.push(input ? (parseInt(input.value, 10) || 0) : 0);
        }

        return yardages;
    };


const getHolePars = () => {
    const pars = [];

    for (let i = 1; i <= 18; i++) {
        const input = document.getElementById(`par${i}`);
        const enteredPar = input ? parseInt(input.value, 10) : 0;

        // IMPORTANT:
        // P / blank saves as 0 so the user can intentionally clear
        // the Yardages popup par for an unsaved hole.
        pars.push(enteredPar > 0 ? enteredPar : 0);
    }

    return pars;
};


    const updateHoleYardagesTotal = () => {
        let total = 0;

        for (let i = 1; i <= 18; i++) {
            const input = document.getElementById(`yardage${i}`);
            if (input) total += parseInt(input.value, 10) || 0;
        }

        const totalEl = document.getElementById("holeYardagesTotal");
        if (totalEl) totalEl.textContent = total;

        // Do not auto-overwrite tee yardage field here
    };


const updateYardageMismatchState = () => {
    if (!teeYardageField) return;

    const teeValue = parseInt(teeYardageField.value, 10) || 0;
    const yardages = getHoleYardages();
    const holeTotal = yardages.reduce((sum, value) => sum + (parseInt(value, 10) || 0), 0);

    if (teeValue > 0 && holeTotal > 0 && teeValue !== holeTotal) {
        teeYardageField.classList.add("yardage-mismatch");
    } else {
        teeYardageField.classList.remove("yardage-mismatch");
    }
};



const loadHoleYardages = () => {
    let saved = [];
    let savedPars = [];

    try {
        saved = JSON.parse(localStorage.getItem(HOLE_YARDAGES_KEY)) || [];
        savedPars = JSON.parse(localStorage.getItem(HOLE_PARS_KEY)) || [];
    } catch (err) {
        console.error("Could not load hole yardages", err);
        saved = [];
        savedPars = [];
    }

    for (let i = 1; i <= 18; i++) {
        const input = document.getElementById(`yardage${i}`);
        if (input) {
            const value = saved[i - 1];
            input.value = value ? value : "";
        }

        const parInput = document.getElementById(`par${i}`);
        if (parInput) {
            const parValue = parseInt(savedPars[i - 1], 10);
            parInput.value = parValue > 0 ? String(parValue) : "";
        }
    }

    updateHoleYardagesTotal();
    updateYardageMismatchState();
};

if (addHoleYardagesBtn && holeYardagesPopup) {
    addHoleYardagesBtn.addEventListener("click", () => {
        loadHoleYardages();

        // PHASE 2 — Refresh saved course yardage dropdown every time popup opens
        if (typeof populateSavedCourseYardageSelect === "function") {
            populateSavedCourseYardageSelect();
        }

        // PHASE 2 — If Round Details course already has a saved yardage set,
        // automatically select it in the popup dropdown.
        const courseName = getFieldValue("courseName");
        const teeYardage = getFieldValue("teeYardage");
        const savedSelect = document.getElementById("savedCourseYardageSelect");

        if (courseName && savedSelect) {
            const exactKey = buildCourseYardageLibraryKey(courseName, teeYardage);

            if (exactKey && savedSelect.querySelector(`option[value="${CSS.escape(exactKey)}"]`)) {
                savedSelect.value = exactKey;
            } else {
                const matchingOption = Array.from(savedSelect.options).find(option =>
                    option.value.toLowerCase().startsWith(courseName.toLowerCase() + " |")
                );

                if (matchingOption) {
                    savedSelect.value = matchingOption.value;
                }
            }
        }

        updateHoleYardagesTotal();
        holeYardagesPopup.classList.remove("hidden");
    });
}

document.querySelectorAll(".yardage-input, .compact-yardage-input").forEach(input => {
    input.addEventListener("input", () => {
        updateHoleYardagesTotal();
        updateYardageMismatchState();
    });
});

document.querySelectorAll(".compact-par-input").forEach(input => {
    input.addEventListener("input", () => {
        // Par values are saved with the Yardages/Pars popup.
    });
});

    if (closeHoleYardagesBtn && holeYardagesPopup) {
        closeHoleYardagesBtn.addEventListener("click", () => {
            holeYardagesPopup.classList.add("hidden");
        });
    }


    if (cancelHoleYardagesBtn && holeYardagesPopup) {
    cancelHoleYardagesBtn.addEventListener("click", () => {
        holeYardagesPopup.classList.add("hidden");
    });
}


    if (saveHoleYardagesBtn && holeYardagesPopup) {
        saveHoleYardagesBtn.addEventListener("click", () => {
            const yardages = getHoleYardages();
            const pars = getHolePars();

            try {
                localStorage.setItem(HOLE_YARDAGES_KEY, JSON.stringify(yardages));
                localStorage.setItem(HOLE_PARS_KEY, JSON.stringify(pars));
            } catch (err) {
                console.error("Could not save hole yardages", err);
                return;
            }

            updateHoleYardagesTotal();
            syncHoleParRadioFromStoredPar();
            updateHoleScreen();

            const originalText = saveHoleYardagesBtn.textContent;
            saveHoleYardagesBtn.textContent = "Yardages Saved ✓";
            saveHoleYardagesBtn.disabled = true;

            setTimeout(() => {
                saveHoleYardagesBtn.textContent = originalText;
                saveHoleYardagesBtn.disabled = false;
                holeYardagesPopup.classList.add("hidden");
            }, 1000);
        });
    }

loadHoleYardages();

}



/* ========================================
   PHASE 2 – LOCAL COURSE YARDAGE LIBRARY
======================================== */

const COURSE_YARDAGE_LIBRARY_KEY = "strackerCourseYardageLibraryP2";

function getCourseYardageLibrary() {
    try {
        return JSON.parse(localStorage.getItem(COURSE_YARDAGE_LIBRARY_KEY)) || {};
    } catch (err) {
        console.warn("Could not read course yardage library:", err);
        return {};
    }
}

function saveCourseYardageLibrary(library) {
    try {
        localStorage.setItem(
            COURSE_YARDAGE_LIBRARY_KEY,
            JSON.stringify(library || {})
        );
    } catch (err) {
        console.warn("Could not save course yardage library:", err);
    }
}

function buildCourseYardageLibraryKey(courseName, teeYardage) {
    const cleanCourse = String(courseName || "").trim();
    const cleanYardage = String(teeYardage || "").trim();

    if (!cleanCourse) return "";

    return `${cleanCourse} | ${cleanYardage || "No Course Yardage"}`;
}

function getCurrentHoleYardagesFromInputs() {
    const holeYardages = {};

    for (let i = 1; i <= 18; i++) {
        const input = document.getElementById(`yardage${i}`);

        holeYardages[i] = input
            ? input.value.trim()
            : "";
    }

    return holeYardages;
}

function applyHoleYardagesToInputs(holeYardages = {}) {
    for (let i = 1; i <= 18; i++) {
        const input = document.getElementById(`yardage${i}`);

        if (input) {
            input.value = holeYardages[i] || "";
        }
    }

    let total = 0;

    for (let i = 1; i <= 18; i++) {
        const input = document.getElementById(`yardage${i}`);
        const value = input ? parseInt(input.value, 10) : 0;
        total += Number.isNaN(value) ? 0 : value;
    }

    const totalEl = document.getElementById("holeYardagesTotal");
    if (totalEl) {
        totalEl.textContent = total;
    }
}

function calculateSavedHoleYardageTotal(holeYardages = {}) {
    let total = 0;

    Object.values(holeYardages).forEach((value) => {
        const num = parseInt(value, 10);

        if (!Number.isNaN(num)) {
            total += num;
        }
    });

    return total;
}

function populateSavedCourseYardageSelect() {
    const select = document.getElementById("savedCourseYardageSelect");
    if (!select) return;

    const library = getCourseYardageLibrary();
    const courseName = getFieldValue("courseName");
    const teeYardage = getFieldValue("teeYardage");
    const draftKey = courseName
        ? buildCourseYardageLibraryKey(courseName, teeYardage)
        : "";

    select.innerHTML = `<option value="">Select saved course yardages</option>`;

    // PHASE 2 — Show current Round Details course as the pending new yardage set.
    if (draftKey && !library[draftKey]) {
        const draftOption = document.createElement("option");
        draftOption.value = `__NEW__${draftKey}`;
        draftOption.textContent = draftKey;
        select.appendChild(draftOption);
        select.value = draftOption.value;
    }

    Object.keys(library)
        .sort((a, b) => a.localeCompare(b))
        .forEach((key) => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = key;
            select.appendChild(option);

            if (key === draftKey) {
                select.value = key;
            }
        });
}

function saveCurrentCourseYardageSet() {
    let courseName = getFieldValue("courseName");

const selectedCourseSetRaw = document.getElementById("savedCourseYardageSelect")?.value || "";
const selectedCourseSet = selectedCourseSetRaw.startsWith("__NEW__") ? "" : selectedCourseSetRaw;

if (!selectedCourseSet) {
    const enteredName = prompt("Save yardages as course name:", courseName || "");

    if (!enteredName || !enteredName.trim()) {
        return;
    }

    courseName = enteredName.trim();

    const courseNameInput = document.getElementById("courseName");
    if (courseNameInput && !courseNameInput.value.trim()) {
        courseNameInput.value = courseName;
    }
}
    const teeYardage = getFieldValue("teeYardage");

    const holeYardages =
        getCurrentHoleYardagesFromInputs();

    const holeYardageTotal =
        calculateSavedHoleYardageTotal(holeYardages);

    if (!courseName) {
        showYardageConfirmPopup({
            title: "Course Name Needed",
            message:
                "Enter a Course Name before saving this yardage set.",
            showCancel: false
        });

        return;
    }

    const filledCount = Object.values(holeYardages)
        .filter(v => String(v || "").trim() !== "")
        .length;

    if (filledCount < 18) {
        showYardageConfirmPopup({
            title: "Incomplete Yardages",
            message:
                `Only ${filledCount} of 18 hole yardages are entered.`,
            showCancel: false
        });

        return;
    }

    const key =
        buildCourseYardageLibraryKey(
            courseName,
            teeYardage
        );

    const library = getCourseYardageLibrary();

    library[key] = {
        courseName,
        teeYardage,
        holeYardages,
        holeYardageTotal,
        savedAt: new Date().toISOString()
    };

    saveCourseYardageLibrary(library);

    populateSavedCourseYardageSelect();

    const select = document.getElementById(
        "savedCourseYardageSelect"
    );

    if (select) {
        select.value = key;
    }

showCourseLibraryMessage(
    "Course Yardages Saved",
    `${courseName} yardages saved locally.`
);
}

function loadSelectedCourseYardageSet() {
    const select = document.getElementById(
        "savedCourseYardageSelect"
    );

    if (!select || !select.value) return;

    const library = getCourseYardageLibrary();

    const savedSet = library[select.value];

    if (!savedSet) return;

    // PHASE 2 — Auto-fill Round Details Course Name from selected saved yardage set
const courseNameInput = document.getElementById("courseName");

if (courseNameInput && savedSet.courseName) {
    courseNameInput.value = savedSet.courseName;
}

    applyHoleYardagesToInputs(
        savedSet.holeYardages || {}
    );

    window.savedHoleYardages =
        savedSet.holeYardages || {};

    const teeYardageInput =
        document.getElementById("teeYardage");

  // PHASE 2 — Always sync tee yardage from selected saved yardage set
if (teeYardageInput && savedSet.teeYardage) {
    teeYardageInput.value = savedSet.teeYardage;
}

updateCoursePar();
updateParRowState();
updateRoundDetailCompletion();

showCourseLibraryMessage(
    "Yardages Loaded",
    `${savedSet.courseName} yardages loaded.`
);
}

const savedCourseYardageSelect =
    document.getElementById(
        "savedCourseYardageSelect"
    );

if (savedCourseYardageSelect) {
    savedCourseYardageSelect.addEventListener(
        "change",
        loadSelectedCourseYardageSet
    );
}

populateSavedCourseYardageSelect();



// ===== Window Events =====
window.addEventListener("resize", adjustSummaryHeight);
window.addEventListener("orientationchange", adjustSummaryHeight);

// ===== DEV / TEST HELPERS =====
    if (!Array.isArray(playOrder) || playOrder.length !== 18) {
        const startHoleValue = parseInt(document.getElementById("startingHole")?.value, 10) || 1;
        startingHole = startHoleValue;
        playOrder = buildPlayOrder(startingHole);
    }

function fillAllButLastHole() {
    for (let i = 0; i < 18; i++) {
        holes[i] = null;
    }

    if (!Array.isArray(playOrder) || playOrder.length !== 18) {
        const startHoleValue = parseInt(document.getElementById("startingHole")?.value, 10) || 1;
        startingHole = startHoleValue;
        playOrder = buildPlayOrder(startingHole);
    }

    // Standard Par 72 test layout:
    // Front 9 = 36, Back 9 = 36, Total = 72
    const testPars = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4];

    for (let i = 0; i < playOrder.length - 1; i++) {
        const holeNum = playOrder[i];
        const par = testPars[holeNum - 1];

        holes[holeNum - 1] = {
            fir: par >= 4 ? Math.random() > 0.5 : false,
            gir: Math.random() > 0.5,
            updown: Math.random() > 0.75,
            sand: Math.random() > 0.85,
            putts: 2,
            penalty: 0,
            score: par,
            par: par,
            saved: true
        };
    }

    const lastHoleNum = playOrder[playOrder.length - 1];
    holes[lastHoleNum - 1] = null;

    currentHoleIndex = playOrder.length - 1;
    syncCurrentHoleFromIndex();
    roundStarted = true;
    roundFinalized = false;
    roundJustCompleted = false;
    postRoundMode = false;
    postRoundReturnTarget = "";
    persistActiveRound();
    updateHoleScreen();

    console.log("✅ Test mode: 17 holes filled at even par, ready for final hole");
}

function resetRoundData() {
    for (let i = 0; i < 18; i++) {
        holes[i] = null;
    }

    currentHoleIndex = 0;
    syncCurrentHoleFromIndex();
    roundStarted = false;
    roundFinalized = false;
    roundJustCompleted = false;
    postRoundMode = false;
    postRoundReturnTarget = "";
    pendingSaveAfterValidation = false;
    autoSaveInProgress = false;
    resumingSavedRound = false;
    summaryReturnTarget = "app";
    postRoundButtonVisible = false;

    if (postRoundButtonDelayTimer) {
        clearTimeout(postRoundButtonDelayTimer);
        postRoundButtonDelayTimer = null;
    }

    clearActiveRoundStorage();
    removeFromStorage(ROUND_BG_INDEX_KEY);
    loadRoundBackground();
    updateHoleScreen();
    updatePostRoundUI();

    console.log("🔄 Round data reset");
}



window.addEventListener("load", () => {
    if (DEV_MODE && window.location.search.includes("test")) {
        fillAllButLastHole();
    }
});





/* ========================================
   APPROACH +STATS
======================================== */

let approachHoldTimer = null;
let approachPressActive = false;

let approachDraft = {
    base: null,
    distance: null,
    result: null
};

// These match the fixed ruler lines in the Approach SVG.
// 200 yds = x 150, 150 yds = x 333, 100 yds = x 515, 50 yds = x 698, 0 yds = x 880.
// Distance runs left/right toward the red 0-yard line. Direction runs above/below that line.
const APPROACH_HOLE_X = 880;
const APPROACH_HOLE_Y = 150;
const APPROACH_BALL_Y = 205;
const APPROACH_PIXELS_PER_YARD = 3.65;
const APPROACH_RESULT_DISTANCE_OFFSET = 78;
const APPROACH_RESULT_DIRECTION_OFFSET = 62;

function getApproachPanel() {
    return document.getElementById("approachPanel");
}

function resetApproachDraft() {
    approachDraft = {
        base: null,
        distance: null,
        result: null
    };
}

function getApproachXFromDistance(distance) {
    const safeDistance = Math.max(0, Math.min(220, Number(distance || 0)));
    return APPROACH_HOLE_X - (safeDistance * APPROACH_PIXELS_PER_YARD);
}


function updateApproachDistanceToHoleLabel() {
    const label = document.getElementById("approachDistanceToHoleLabel");
    if (!label) return;

    const remaining = getTeeShotRemainingYardage();

    label.innerHTML = remaining !== null
    ? `<span class="approach-yardage-number">${remaining}</span> yds to hole`
    : "—";
}


function openApproachStats() {
    const panel = getApproachPanel();
    const enhancedStatsPanel = document.getElementById("enhancedStatsPanel");

    if (!panel) return;

    hidePerformanceStatPanels("approachPanel");

    loadApproachForCurrentHole();
    updateApproachHoleLabel();
    updateApproachDistanceToHoleLabel();

if (enhancedStatsPanel) enhancedStatsPanel.classList.add("hidden");
panel.classList.remove("hidden");

if (typeof window.startApproachTipAttentionP2 === "function") {
    window._approachTipHasOpened = false;
    window.startApproachTipAttentionP2();
}

setTimeout(updateApproachDisplay, 30);
}

function closeApproachStats() {
    stopApproachHold();

    const panel = getApproachPanel();
    const enhancedStatsPanel = document.getElementById("enhancedStatsPanel");

    if (panel) panel.classList.add("hidden");
    if (enhancedStatsPanel) enhancedStatsPanel.classList.remove("hidden");
}

function updateApproachHoleLabel() {
    const label = document.getElementById("approachHoleLabel");
    if (!label) return;

    const selectedPar = document.querySelector('input[name="holePar"]:checked');
    const par = holes[currentHole - 1]?.par || selectedPar?.value || "—";

    const holeYardage =
        typeof getCurrentHoleYardage === "function"
            ? getCurrentHoleYardage()
            : null;

    label.textContent = holeYardage
        ? `HOLE ${currentHole} • PAR ${par} • ${holeYardage} YDS`
        : `HOLE ${currentHole} • PAR ${par}`;
}

function setApproachBase(value) {
    const distance = Number(value);

    approachDraft.base = distance;
    approachDraft.distance = distance;

    document.querySelectorAll(".approach-chip-btn").forEach(btn => {
        btn.classList.toggle(
            "active",
            Number(btn.dataset.distance) === distance
        );
    });

    updateApproachDisplay();
}

function adjustApproachDistance(change) {
    if (!approachDraft.distance) {
        setApproachBase(150);
    }

    approachDraft.distance = Number(approachDraft.distance || 150) + change;

    if (approachDraft.distance < 1) approachDraft.distance = 1;
    if (approachDraft.distance > 220) approachDraft.distance = 220;

    // Once the user fine-tunes away from a preset, no fixed distance chip should remain highlighted.
    document.querySelectorAll(".approach-chip-btn").forEach(btn => {
        btn.classList.toggle(
            "active",
            Number(btn.dataset.distance) === Number(approachDraft.distance)
        );
    });

    updateApproachDisplay();
}

function getApproachResultParts(resultValue) {
    const result = String(resultValue || "").toLowerCase();

    let distanceAxis = "pinHigh";
    if (result.includes("short")) distanceAxis = "short";
    if (result.includes("long")) distanceAxis = "long";

    let directionAxis = "center";
    if (result.includes("left")) directionAxis = "left";
    if (result.includes("right")) directionAxis = "right";

    return { distanceAxis, directionAxis };
}

function getApproachEndPoint() {
    // Endpoint mapping:
    // Short / Pin High / Long = distance axis, so x moves before/on/past the red 0-yard line.
    // Left / Center / Right = direction axis, so y moves off target while still keeping the correct distance.
    let x = APPROACH_HOLE_X;
    let y = APPROACH_HOLE_Y;

    const { distanceAxis, directionAxis } = getApproachResultParts(approachDraft.result);

    if (distanceAxis === "short") x -= APPROACH_RESULT_DISTANCE_OFFSET;
    if (distanceAxis === "long") x += APPROACH_RESULT_DISTANCE_OFFSET;

    if (directionAxis === "left") y -= APPROACH_RESULT_DIRECTION_OFFSET;
    if (directionAxis === "right") y += APPROACH_RESULT_DIRECTION_OFFSET;

    return { x, y };
}


function updateApproachDisplay() {
    const distanceDisplay = document.getElementById("approachDistanceDisplay");
    const movingLabel = document.getElementById("approachMovingLabel");
    const flightLine = document.getElementById("approachFlightLine");
    const startDot = document.getElementById("approachStartDot");
    const endDot = document.getElementById("approachEndDot");

const distance = approachDraft.distance || approachDraft.base || 0;
const baseDistance = approachDraft.base || distance || 0;

const ballX = getApproachXFromDistance(baseDistance);

let endPoint = getApproachEndPoint();

const rawLeaveDistance =
    baseDistance > 0 && distance > 0
        ? baseDistance - distance
        : null;

if (rawLeaveDistance !== null) {
    endPoint.x = APPROACH_HOLE_X - (rawLeaveDistance * APPROACH_PIXELS_PER_YARD);
}

    if (distanceDisplay) {
        distanceDisplay.textContent = distance ? `${distance} yds` : "— yds";
    }

    if (movingLabel) {
        movingLabel.setAttribute("x", ballX);
        movingLabel.setAttribute("y", APPROACH_BALL_Y - 28);
        movingLabel.textContent = distance ? `${distance} yds` : "";
    }

    if (startDot) {
        startDot.setAttribute("cx", ballX);
        startDot.setAttribute("cy", APPROACH_BALL_Y);
    }

    if (endDot) {
        endDot.setAttribute("cx", endPoint.x);
        endDot.setAttribute("cy", endPoint.y);
    }

    if (flightLine) {
        flightLine.setAttribute("x1", ballX);
        flightLine.setAttribute("y1", APPROACH_BALL_Y);
        flightLine.setAttribute("x2", endPoint.x);
        flightLine.setAttribute("y2", endPoint.y);
    }

    updateApproachSummary();
}

function setApproachResult(value) {
    approachDraft.result = value;

    document.querySelectorAll(".approach-result-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.result === value);
    });

    updateApproachDisplay();
}

function updateApproachSummary() {
    const box = document.getElementById("approachSummaryText");
    if (!box) return;

    const shotDistance = Number(approachDraft.distance || approachDraft.base || 0);
    const startingDistance =
        typeof getTeeShotRemainingYardage === "function"
            ? Number(getTeeShotRemainingYardage())
            : 0;

const rawLeaveDistance =
    startingDistance > 0 && shotDistance > 0
        ? startingDistance - shotDistance
        : null;

const leaveText =
    rawLeaveDistance === null
        ? null
        : rawLeaveDistance > 0
            ? `${rawLeaveDistance} yds to hole`
            : rawLeaveDistance < 0
                ? `${Math.abs(rawLeaveDistance)} yds long`
                : `Pin high`;

    const parts = [];

    if (shotDistance) parts.push(`${shotDistance} yds`);
    if (approachDraft.result) parts.push(approachDraft.result);

if (leaveText) {
    parts.push(leaveText);
}

    box.textContent = parts.join(" • ");
}

function saveApproachStats() {
    const holeData = holes[currentHole - 1] || {};
    const shotDistance = Number(approachDraft.distance || approachDraft.base || 0);
    const startingDistance =
        typeof getTeeShotRemainingYardage === "function"
            ? Number(getTeeShotRemainingYardage())
            : 0;
    const leaveDistance =
        startingDistance > 0 && shotDistance > 0
            ? Math.max(0, startingDistance - shotDistance)
            : null;

    holeData.approach = {
        base: approachDraft.base,
        distance: approachDraft.distance,
        result: approachDraft.result,
        leaveDistance: leaveDistance
    };

    holes[currentHole - 1] = holeData;

    if (typeof persistActiveRound === "function") {
        persistActiveRound();
    }

refreshApproachTile();

if (typeof stopProTipAttention === "function") {
    stopProTipAttention("approach", false);
}
if (typeof closeProTipPopup === "function") {
    closeProTipPopup("approach");
}

closeApproachStats();
}

function loadApproachForCurrentHole() {
    resetApproachDraft();

    const holeData = holes[currentHole - 1];

    document.querySelectorAll(".approach-chip-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    document.querySelectorAll(".approach-result-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    if (holeData && holeData.approach) {
        const a = holeData.approach;

        approachDraft.base = Number(a.base || a.distance || 0) || null;
        approachDraft.distance = Number(a.distance || a.base || 0) || null;
        approachDraft.result = a.result || null;

        document.querySelectorAll(".approach-chip-btn").forEach(btn => {
            btn.classList.toggle(
                "active",
                Number(btn.dataset.distance) === Number(approachDraft.base)
            );
        });

        if (approachDraft.result) {
            document.querySelectorAll(".approach-result-btn").forEach(btn => {
                btn.classList.toggle(
                    "active",
                    btn.dataset.result === approachDraft.result
                );
            });
        }

 } else {
    // No saved approach yet.
    // Seed Approach distance from Tee Shot remaining yardage, if available.
    const remaining = typeof getTeeShotRemainingYardage === "function"
        ? getTeeShotRemainingYardage()
        : null;

    if (remaining !== null && remaining > 0) {
        approachDraft.base = remaining;
        approachDraft.distance = remaining;

        document.querySelectorAll(".approach-chip-btn").forEach(btn => {
            btn.classList.toggle(
                "active",
                Number(btn.dataset.distance) === Number(remaining)
            );
        });
    }
}

    updateApproachDisplay();
}

function refreshApproachTile() {
    const tile = document.getElementById("openApproachStats");
    if (!tile) return;

    const holeData = holes[currentHole - 1];
    tile.classList.toggle("saved", !!(holeData && holeData.approach));
}

// Compatibility alias for the existing updateHoleScreen() call.
function refreshApproachTileClean() {
    refreshApproachTile();
}

function startApproachHold(change) {
    stopApproachHold();

    approachPressActive = true;
    adjustApproachDistance(change);

    approachHoldTimer = setInterval(() => {
        if (!approachPressActive) {
            stopApproachHold();
            return;
        }

        adjustApproachDistance(change);
    }, 80);
}

function stopApproachHold() {
    approachPressActive = false;

    if (!approachHoldTimer) return;

    clearInterval(approachHoldTimer);
    approachHoldTimer = null;
}

function wireApproachButton(btn, change) {
    if (!btn) return;

    // Pointer events handle both mouse and touch. Do not also wire touchstart/mousedown,
    // or one press can fire more than once on some devices.
    btn.addEventListener("pointerdown", e => {
        e.preventDefault();
        startApproachHold(change);
    });
}

/* Wire buttons */
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("openApproachStats")
        ?.addEventListener("click", openApproachStats);

    document.getElementById("closeApproachPanel")
        ?.addEventListener("click", closeApproachStats);

    document.getElementById("cancelApproachStats")
        ?.addEventListener("click", closeApproachStats);

    document.getElementById("saveApproachStats")
        ?.addEventListener("click", saveApproachStats);

    document.querySelectorAll(".approach-chip-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            setApproachBase(Number(btn.dataset.distance));
        });
    });

    document.querySelectorAll(".approach-result-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            setApproachResult(btn.dataset.result);
        });
    });

    wireApproachButton(document.getElementById("approachDistanceMinus"), -1);
    wireApproachButton(document.getElementById("approachDistancePlus"), 1);

    [
        "pointerup",
        "pointercancel",
        "pointerleave",
        "touchend",
        "touchcancel",
        "mouseup",
        "mouseleave",
        "blur"
    ].forEach(evt => {
        window.addEventListener(evt, stopApproachHold);
        document.addEventListener(evt, stopApproachHold);
    });

    updateApproachDisplay();
});



// Service Worker DISABLED
/* =====================================================
   PUTTING +STATS PANEL — PHASE 2
===================================================== */
let puttingHoldTimer = null;
let puttingPressActive = false;
let puttingAdvanceTimer = null;

let puttingDraft = {
    activePutt: 1,
    putts: [
        { start: 3, result: null, leave: null },
        { start: null, result: null, leave: null },
        { start: null, result: null, leave: null }
    ]
};

const PUTTING_HOLE_POINT = { x: 500, y: 120 };
const PUTTING_DISTANCE_Y = {
    0: 120,
    3: 175,
    6: 225,
    10: 305,
    15: 395,
    20: 500,
    30: 635
};

function getPuttingPanel() {
    return document.getElementById("puttingPanel");
}

function resetPuttingDraft() {
    puttingDraft = {
        activePutt: 1,
        putts: [
            { start: 3, result: null, leave: null },
            { start: null, result: null, leave: null },
            { start: null, result: null, leave: null }
        ]
    };
}

function getActivePuttingEntry() {
    return puttingDraft.putts[Math.max(0, puttingDraft.activePutt - 1)];
}

function getPuttingYFromFeet(feet) {
    const value = Math.max(0, Math.min(30, Number(feet) || 0));
    const stops = [0, 3, 6, 10, 15, 20, 30];

    for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i];
        const b = stops[i + 1];
        if (value >= a && value <= b) {
            const pct = (value - a) / (b - a);
            return PUTTING_DISTANCE_Y[a] + ((PUTTING_DISTANCE_Y[b] - PUTTING_DISTANCE_Y[a]) * pct);
        }
    }

    return PUTTING_DISTANCE_Y[30];
}

function getPuttingLeaveDistance(startFeet, result) {
    const start = Number(startFeet) || 3;

    if (result === "Made") return 0;
    if (start <= 3) return 2;
    if (start <= 6) return 3;
    if (start <= 10) return 3;
    if (start <= 15) return 4;
    if (start <= 20) return 5;
    return 8;
}

function getPuttingFinishPoint(entry) {
    const start = Number(entry.start) || 3;
    const result = entry.result || null;
    const leave = getPuttingLeaveDistance(start, result);

    if (result === "Made") {
        return { x: PUTTING_HOLE_POINT.x, y: PUTTING_HOLE_POINT.y, label: "Made", leave };
    }

    let x = PUTTING_HOLE_POINT.x;
    let y = getPuttingYFromFeet(leave);

if (result === "Left") {
    x = PUTTING_HOLE_POINT.x - 70;
    return { x, y, label: "", leave };
}

if (result === "Right") {
    x = PUTTING_HOLE_POINT.x + 70;
    return { x, y, label: "", leave };
}
    if (result === "Long") {
        return { x, y: PUTTING_HOLE_POINT.y - 38, label: "", leave };
    }

    if (result === "Short") {
        return { x, y, label: "", leave };
    }

    return {
        x: PUTTING_HOLE_POINT.x,
        y: getPuttingYFromFeet(start),
        label: "",
        leave: null
    };
}

function updatePuttingHoleLabel() {
    const label = document.getElementById("puttingHoleLabel");
    if (!label) return;

    let parText = "";
    const selectedPar = document.querySelector('input[name="holePar"]:checked');
    if (selectedPar && selectedPar.value) parText = ` • PAR ${selectedPar.value}`;

    label.textContent = `HOLE ${currentHole}${parText}`;
}

function openPuttingStats() {
    const panel = getPuttingPanel();
    if (!panel) return;

    // 🔥 MATCH Tee Shot behavior
    const enhancedStatsPanel = document.getElementById("enhancedStatsPanel");
    if (enhancedStatsPanel) enhancedStatsPanel.classList.add("hidden");

    loadPuttingForCurrentHole();
    updatePuttingHoleLabel();
    panel.classList.remove("hidden");
    setTimeout(() => updatePuttingDisplay(true), 35);
}

function closePuttingStats() {
    stopPuttingHold();
    const panel = getPuttingPanel();
    if (panel) panel.classList.add("hidden");
}

function setPuttingDistance(value) {
    const entry = getActivePuttingEntry();
    entry.start = Math.max(1, Math.min(60, Number(value) || 3));
    entry.result = null;
    entry.leave = null;
    entry.userSelectedStart = true;
    updatePuttingDisplay(true);
}

function adjustPuttingDistance(change) {
    const entry = getActivePuttingEntry();
    entry.start = Math.max(1, Math.min(60, Number(entry.start || 3) + change));
    entry.result = null;
    entry.leave = null;
    updatePuttingDisplay(true);
}

function setPuttingResult(result) {
    const entry = getActivePuttingEntry();

    if (puttingAdvanceTimer) {
        clearTimeout(puttingAdvanceTimer);
        puttingAdvanceTimer = null;
    }

    entry.result = result;
    entry.leave = result === "Made" ? 0 : null;

    if (result === "Made") {
        for (let i = puttingDraft.activePutt; i < puttingDraft.putts.length; i++) {
            if (i > puttingDraft.activePutt - 1) {
                puttingDraft.putts[i].start = null;
                puttingDraft.putts[i].result = null;
                puttingDraft.putts[i].leave = null;
                puttingDraft.putts[i].userSelectedStart = false;
            }
        }

        updatePuttingDisplay(false);
        return;
    }

    if (puttingDraft.activePutt < 3) {
        const nextEntry = puttingDraft.putts[puttingDraft.activePutt];

        if (nextEntry) {
            nextEntry.start = null;
            nextEntry.result = null;
            nextEntry.leave = null;
            nextEntry.userSelectedStart = false;
        }

        puttingDraft.activePutt += 1;
    }

    updatePuttingDisplay(false);
}

function updatePuttingChipStates() {
    const entry = getActivePuttingEntry();

    document.querySelectorAll(".putting-chip-btn").forEach(btn => {
        btn.classList.toggle(
            "active",
            !!entry.userSelectedStart && Number(btn.dataset.distance) === Number(entry.start)
        );
    });

    document.querySelectorAll(".putting-result-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.result === entry.result);
    });

    const madeBtn = document.getElementById("puttingMadeBtn");
    if (madeBtn) madeBtn.classList.toggle("active", entry.result === "Made");
}

function updatePuttingDisplay(animate = false) {
    const stepTitle = document.getElementById("puttingStepTitle");
    const distanceDisplay = document.getElementById("puttingDistanceDisplay");
    const ball = document.getElementById("puttingBallDot");
    const label = document.getElementById("puttingBallLabel");
    const labelBox = document.getElementById("puttingBallLabelBox");
    const path = document.getElementById("puttingRollPath");

    const entry = getActivePuttingEntry();
    const start = entry.userSelectedStart ? Number(entry.start) : null;
    const visualStart = start || 3;

    let startX = PUTTING_HOLE_POINT.x;

    const startPoint = {
        x: startX,
        y: getPuttingYFromFeet(visualStart)
    };

    const finishPoint = getPuttingFinishPoint(entry);
    const showPoint = entry.result ? finishPoint : startPoint;

    if (stepTitle) stepTitle.textContent = `PUTT #${puttingDraft.activePutt}`;
    if (distanceDisplay) {
        distanceDisplay.textContent = start ? `${start} ft` : "Select";
    }

    updatePuttingChipStates();
    updatePuttingTabStates();

    // ✅ FIXED ARC LOGIC
    if (path) {
        const midY = (startPoint.y + showPoint.y) / 2;

        // Always bend toward the hole (natural putting arc)
        const curveX = PUTTING_HOLE_POINT.x;

        path.setAttribute(
            "d",
            `M ${startPoint.x} ${startPoint.y} Q ${curveX} ${midY} ${showPoint.x} ${showPoint.y}`
        );
    }

if (ball) {
    ball.classList.remove("putting-ball-animate");

    if (animate && entry.result) {
        ball.setAttribute("cx", startPoint.x);
        ball.setAttribute("cy", startPoint.y);

        // Force browser to apply the reset position before animating.
        void ball.getBoundingClientRect();

        ball.classList.add("putting-ball-animate");

        requestAnimationFrame(() => {
            ball.setAttribute("cx", showPoint.x);
            ball.setAttribute("cy", showPoint.y);
        });
    } else {
        ball.setAttribute("cx", showPoint.x);
        ball.setAttribute("cy", showPoint.y);
    }
}

    const labelText = entry.result === "Made"
        ? "Made"
        : (entry.result ? `${entry.leave || ""}` : (start ? `${start} ft` : "Select"));

    const labelX = showPoint.x + 72;
    const labelY = showPoint.y - 4;

    if (label) {
        label.textContent = labelText;
        label.setAttribute("x", labelX + 37);
        label.setAttribute("y", labelY + 18);
    }

    if (labelBox) {
        const w = labelText.length > 4 ? 92 : 74;
        labelBox.setAttribute("x", labelX);
        labelBox.setAttribute("y", labelY);
        labelBox.setAttribute("width", w);
    }

    updatePuttingSummary();
}


function updatePuttingTabStates() {
    const tabs = document.querySelectorAll("#puttingPanel .putting-tab");
    if (!tabs.length || !puttingDraft || !Array.isArray(puttingDraft.putts)) return;

    const madeIndex = puttingDraft.putts.findIndex(
        p => p && p.result === "Made"
    );

    const activeIndex = Math.max(
        0,
        Math.min(2, puttingDraft.activePutt - 1)
    );

    tabs.forEach((tab, index) => {
        const puttNumber = index + 1;
        const putt = puttingDraft.putts[index];

        tab.classList.remove(
            "active",
            "complete",
            "future",
            "putting-tab-hidden"
        );

        // Hide future unused putts after made
        if (madeIndex >= 0 && index > madeIndex) {
            tab.classList.add("putting-tab-hidden");
            return;
        }

        // ONLY the made putt turns green with check
        if (putt && putt.result === "Made") {
            tab.classList.add("complete");
            tab.textContent = `PUTT #${puttNumber} ✓`;
            return;
        }

        // Current active putt
        if (index === activeIndex && madeIndex === -1) {
            tab.classList.add("active");
            tab.textContent = `PUTT #${puttNumber}`;
            return;
        }

        // Previous missed putts stay black
        if (putt && putt.result) {
            tab.classList.add("active");
            tab.textContent = `PUTT #${puttNumber}`;
            return;
        }

        // Future putts stay dim gray
        tab.classList.add("future");
        tab.textContent = `PUTT #${puttNumber}`;
    });
}

function updatePuttingSummary() {
    const putt1 = puttingDraft.putts[0];
    const putt2 = puttingDraft.putts[1];
    const madeIndex = puttingDraft.putts.findIndex(p => p && p.result === "Made");
    const completed = puttingDraft.putts.filter(p => p && p.result).length;
    const startedCount = puttingDraft.putts.filter(p => p && p.userSelectedStart).length;

    const total = madeIndex >= 0
    ? madeIndex + 1
    : startedCount;

    const p1Start = document.getElementById("putt1StartSummary");
    const p1Result = document.getElementById("putt1ResultSummary");
    const p2Start = document.getElementById("putt2StartSummary");
    const p2Result = document.getElementById("putt2ResultSummary");
    const totalEl = document.getElementById("puttingTotalSummary");

    if (p1Start) p1Start.textContent = putt1?.start ? `${putt1.start} ft` : "---";
    if (p1Result) {
        p1Result.textContent = putt1?.result || "---";
        p1Result.classList.toggle("miss", !!putt1?.result && putt1.result !== "Made");
    }
    if (p2Start) p2Start.textContent = putt2?.start ? `${putt2.start} ft` : "---";
    if (p2Result) {
        p2Result.textContent = putt2?.result || "---";
        p2Result.classList.toggle("miss", !!putt2?.result && putt2.result !== "Made");
    }
    if (totalEl) totalEl.textContent = total || 0;
}

function savePuttingStats() {
    const completed = puttingDraft.putts.filter(p => p && p.result);
    if (!completed.length) return;

    if (!holes[currentHole - 1]) holes[currentHole - 1] = {};

    holes[currentHole - 1].putting = {
        activePutt: puttingDraft.activePutt,
        putts: puttingDraft.putts.map(p => ({
            start: p.start,
            result: p.result,
            leave: p.leave
        }))
    };

    const madeIndex = puttingDraft.putts.findIndex(p => p && p.result === "Made");
    const totalPutts = madeIndex >= 0 ? madeIndex + 1 : completed.length;
    const puttsInput = document.getElementById("putts");
    if (puttsInput && totalPutts > 0) {
        puttsInput.value = totalPutts;
        clearValidationHighlightFromElement(puttsInput.closest(".stat-counter"));
    }

    if (roundStarted) persistActiveRound();
    refreshPuttingTile();
    closePuttingStats();
}

function loadPuttingForCurrentHole() {
    resetPuttingDraft();

    const holeData = holes[currentHole - 1];
    if (holeData && holeData.putting && Array.isArray(holeData.putting.putts)) {
        puttingDraft.putts = holeData.putting.putts.map(p => ({
            start: p.start ?? null,
            result: p.result ?? null,
            leave: p.leave ?? null
        }));

        while (puttingDraft.putts.length < 3) {
            puttingDraft.putts.push({ start: null, result: null, leave: null });
        }

        const firstOpen = puttingDraft.putts.findIndex(p => !p.result);
        puttingDraft.activePutt = firstOpen === -1 ? Math.min(3, puttingDraft.putts.length) : firstOpen + 1;
        if (!puttingDraft.putts[puttingDraft.activePutt - 1].start) {
            puttingDraft.putts[puttingDraft.activePutt - 1].start = 3;
        }
    }

    updatePuttingDisplay(false);
}

function refreshPuttingTile() {
    const tile = document.getElementById("openPuttingStats");
    if (!tile) return;

    const holeData = holes[currentHole - 1];
    tile.classList.toggle("saved", !!(holeData && holeData.putting));
}

function startPuttingHold(change) {
    stopPuttingHold();
    puttingPressActive = true;
    adjustPuttingDistance(change);

    puttingHoldTimer = setInterval(() => {
        if (!puttingPressActive) {
            stopPuttingHold();
            return;
        }
        adjustPuttingDistance(change);
    }, 90);
}

function stopPuttingHold() {
    puttingPressActive = false;
    if (!puttingHoldTimer) return;
    clearInterval(puttingHoldTimer);
    puttingHoldTimer = null;
}

function wirePuttingHoldButton(btn, change) {
    if (!btn) return;
    btn.addEventListener("pointerdown", e => {
        e.preventDefault();
        startPuttingHold(change);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("openPuttingStats")?.addEventListener("click", openPuttingStats);
    document.getElementById("closePuttingPanel")?.addEventListener("click", closePuttingStats);
    document.getElementById("cancelPuttingStats")?.addEventListener("click", closePuttingStats);
    document.getElementById("savePuttingStats")?.addEventListener("click", savePuttingStats);

    document.querySelectorAll(".putting-chip-btn").forEach(btn => {
        btn.addEventListener("click", () => setPuttingDistance(Number(btn.dataset.distance)));
    });

    document.querySelectorAll(".putting-result-btn").forEach(btn => {
        btn.addEventListener("click", () => setPuttingResult(btn.dataset.result));
    });

    document.getElementById("puttingMadeBtn")?.addEventListener("click", () => setPuttingResult("Made"));

    wirePuttingHoldButton(document.getElementById("puttingDistanceMinus"), -1);
    wirePuttingHoldButton(document.getElementById("puttingDistancePlus"), 1);

    ["pointerup", "pointercancel", "pointerleave", "touchend", "touchcancel", "mouseup", "mouseleave", "blur"].forEach(evt => {
        window.addEventListener(evt, stopPuttingHold);
        document.addEventListener(evt, stopPuttingHold);
    });

    refreshPuttingTile();
});





// ===== Short Game +Stats =====
window.shortGameDraft = window.shortGameDraft || {
    type: null,
    lie: null,
    distance: null,
    result: null
};

let shortGameHoldTimer = null;
let shortGamePressActive = false;

function resetShortGameDraft() {
    window.shortGameDraft = {
        type: null,
        lie: null,
        distance: 30,
        result: null
    };
}

function getShortGamePanel() {
    return document.getElementById("shortGamePanel");
}

function updateShortGameHoleLabel() {
    const label = document.getElementById("shortGameHoleLabel");
    if (!label) return;

    let selectedPar = "";
    const parRadio = document.querySelector('input[name="holePar"]:checked');
    if (parRadio && parRadio.value) selectedPar = parRadio.value;

    const holeYardage =
        typeof getCurrentHoleYardage === "function"
            ? getCurrentHoleYardage()
            : null;

    let labelText = `Hole ${currentHole} • Par ${selectedPar}`;

    if (holeYardage) {
        labelText += ` • ${holeYardage} yds`;
    }

    label.textContent = labelText;
}

function setShortGameButtonState(selector, dataName, value) {
    document.querySelectorAll(selector).forEach(btn => {
        const btnValue = btn.dataset[dataName];

        btn.classList.toggle(
            "active",
            String(btnValue) === String(value)
        );
    });
}

function updateShortGameDisplay(animate = true) {
    const draft = window.shortGameDraft || {};
    const display = document.getElementById("shortGameDistanceDisplay");
    const summary = document.getElementById("shortGameSummaryText");

    const distance = Number(draft.distance || 30);
    if (display) display.textContent = `${distance} yds`;

    setShortGameButtonState(".shortgame-type-btn", "type", draft.type);
    setShortGameButtonState(".shortgame-lie-btn", "lie", draft.lie);
    setShortGameButtonState(".shortgame-distance-btn", "distance", distance);
    setShortGameButtonState(".shortgame-result-btn", "result", draft.result);

    if (summary) {
        const parts = [];
        if (draft.type) parts.push(draft.type);
        if (draft.lie) parts.push(draft.lie);
        if (distance) parts.push(`${distance} yds`);
        if (draft.result) parts.push(draft.result);
        summary.textContent = parts.length ? parts.join(" • ") : "No short game shot saved yet.";
        
    }

    updateShortGameGraphic(animate);
}

function getShortGameStartPoint() {
    const draft = window.shortGameDraft || {};
    const lie = String(draft.lie || "").toLowerCase();

    if (lie === "bunker") {
        return { x: 250, y: 370 };
    }

    if (lie === "rough" || lie === "trouble") {
        return { x: 720, y: 55 };
    }

    if (lie === "fringe") {
        return { x: 520, y: 300 };
    }

    return { x: 430, y: 430 };
}

function getShortGameEndPoint() {
    const result = window.shortGameDraft?.result || "";
    const points = {
        "Holed": { x: 715, y: 250 },
        "Inside 3 ft": { x: 695, y: 262 },
        "3-6 ft": { x: 670, y: 282 },
        "Inside 6 ft": { x: 670, y: 282 },
        "6-10 ft": { x: 640, y: 310 },
        "Inside 10 ft": { x: 640, y: 310 },
        "10+ ft": { x: 590, y: 352 },
        "Short": { x: 610, y: 390 },
        "Long": { x: 765, y: 188 },
        "Left": { x: 620, y: 235 },
        "Right": { x: 800, y: 278 }
    };

    return points[result] || { x: 695, y: 262 };
}

function updateShortGameGraphic(animate = true) {
    const path = document.getElementById("shortGameFlightPath");
    const startDot = document.getElementById("shortGameStartDot");
    const ball = document.getElementById("shortGameBallDot");
    if (!path || !startDot || !ball) return;

    const start = getShortGameStartPoint();
    const end = getShortGameEndPoint();
    const cx = (start.x + end.x) / 2;
    const cy = Math.min(start.y, end.y) - 115;

    path.setAttribute("d", `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`);
    startDot.setAttribute("cx", start.x);
    startDot.setAttribute("cy", start.y);
    ball.setAttribute("cx", end.x);
    ball.setAttribute("cy", end.y);

    if (animate) {
        ball.classList.remove("sg-animate");
        // Force reflow so quick result taps re-run the bounce.
        ball.getBoundingClientRect();
        ball.classList.add("sg-animate");
    }
}

function loadShortGameForCurrentHole() {
    resetShortGameDraft();

    const holeData = holes[currentHole - 1];
    if (holeData && holeData.shortGame) {
        window.shortGameDraft = {
            type: holeData.shortGame.type || null,
            lie: holeData.shortGame.lie || null,
            distance: Number(holeData.shortGame.distance || 30),
            result: normalizeShortGameResult(holeData.shortGame.result || null) || null
        };
    }

    updateShortGameDisplay(false);
}

function getShortGameSeedDistance() {
    const hole = holes[currentHole - 1] || {};

    const holeYardage =
        typeof getCurrentHoleYardage === "function"
            ? Number(getCurrentHoleYardage())
            : 0;

    const teeDistance =
        hole.teeShot && Number(hole.teeShot.distance) > 0
            ? Number(hole.teeShot.distance)
            : 0;

    const approachDistance =
        hole.approach && Number(hole.approach.distance) > 0
            ? Number(hole.approach.distance)
            : 0;

    // First choice: if Approach saved an exact remaining distance, use it.
    if (hole.approach && Number(hole.approach.leaveDistance) > 0) {
        return Number(hole.approach.leaveDistance);
    }

    // Second choice: if Approach exists, calculate from hole yardage - tee shot - approach.
    if (hole.approach && holeYardage > 0 && approachDistance > 0) {
        const approachLeave = holeYardage - teeDistance - approachDistance;
        return Math.abs(approachLeave);
    }

    // Third choice: if Tee Shot exists, calculate from hole yardage - tee shot.
    if (hole.teeShot && holeYardage > 0 && teeDistance > 0) {
        const teeLeave = holeYardage - teeDistance;
        return teeLeave > 0 ? teeLeave : 1;
    }

    // Final fallback only if no useful tee/approach data exists.
    return 30;
}


function openShortGameStats() {
    const panel = getShortGamePanel();
    if (!panel) return;

    const enhancedStatsPanel = document.getElementById("enhancedStatsPanel");
    if (enhancedStatsPanel) enhancedStatsPanel.classList.add("hidden");

loadShortGameForCurrentHole();

const savedShortGame = holes[currentHole - 1]?.shortGame;

if (!savedShortGame) {
    window.shortGameDraft.distance = getShortGameSeedDistance();
}

updateShortGameDisplay(false);
updateShortGameHoleLabel();
panel.classList.remove("hidden");

const shortGameTipBtn = document.getElementById("shortGameTipBtn");

if (shortGameTipBtn) {
    shortGameTipBtn.classList.add("protip-attention");
}

    // Keep the top of the Short Game panel reachable after opening on phone/PWA.
    panel.scrollTop = 0;
    const body = panel.querySelector(".es-panel-body");
    if (body) body.scrollTop = 0;
    window.scrollTo(0, 0);

    setTimeout(() => {
        panel.scrollTop = 0;
        if (body) body.scrollTop = 0;
        updateShortGameGraphic(true);
    }, 35);
}

function closeShortGameStats(returnToStats = false) {
    stopShortGameHold();
    const panel = getShortGamePanel();
    if (panel) panel.classList.add("hidden");

    if (returnToStats) {
        const enhancedStatsPanel = document.getElementById("enhancedStatsPanel");
        if (enhancedStatsPanel) enhancedStatsPanel.classList.remove("hidden");
    }
}

function setShortGameType(value) {
    window.shortGameDraft.type = value;
    if ((value === "Bunker" || value === "Sand") && !window.shortGameDraft.lie) {
        window.shortGameDraft.lie = "Bunker";
    }
    updateShortGameDisplay(true);
}

function setShortGameLie(value) {
    window.shortGameDraft.lie = value;
    if (value === "Bunker" && !window.shortGameDraft.type) {
        window.shortGameDraft.type = "Sand";
    }
    updateShortGameDisplay(true);
}

function setShortGameDistance(value) {
    window.shortGameDraft.distance = Math.max(1, Math.min(80, Number(value) || 30));
    updateShortGameDisplay(true);
}

function adjustShortGameDistance(change) {
    setShortGameDistance(Number(window.shortGameDraft.distance || 30) + change);
}

// ===== SHORT GAME RESULT GRID EXPERIMENT START =====
// Normalizes old/simple Short Game results into the new Approach-style combined result language.
// Safe to remove if this layout does not feel right.
// Does not alter Short Game seeding or save flow.

function normalizeShortGameResult(value) {
    if (value === "Left") return "Pin High Left";
    if (value === "Right") return "Pin High Right";
    if (value === "Center") return "Pin High Center";
    if (value === "Short") return "Short Center";
    if (value === "Long") return "Long Center";
    return value;
}

function setShortGameResult(value) {
    const normalizedValue = normalizeShortGameResult(value);

    if (normalizedValue === "Holed") {
        window.shortGameDraft.leave = "";
        window.shortGameDraft.result = "Holed";
        updateShortGameDisplay(true);
        return;
    }

    window.shortGameDraft.result = normalizedValue;
    updateShortGameDisplay(true);
}

// ===== SHORT GAME RESULT GRID EXPERIMENT END =====

function saveShortGameStats() {
    const draft = window.shortGameDraft || {};
    if (!draft.type || !draft.distance || !draft.result) {
        const summary = document.getElementById("shortGameSummaryText");
        if (summary) {
            summary.textContent = "Choose Shot Type, Distance, and Result before saving.";
        }
        return;
    }

    if (!holes[currentHole - 1]) holes[currentHole - 1] = {};

    holes[currentHole - 1].shortGame = {
        type: draft.type,
        lie: draft.lie || "",
        distance: Number(draft.distance || 0),
        result: draft.result
    };

    if (roundStarted || anyHoleSaved()) persistActiveRound();

    refreshShortGameTile();
    closeShortGameStats();

    const enhancedStatsPanel = document.getElementById("enhancedStatsPanel");
    if (enhancedStatsPanel) enhancedStatsPanel.classList.remove("hidden");
}

function refreshShortGameTile() {
    const tile = document.getElementById("openShortGameStats");
    if (!tile) return;

    const holeData = holes[currentHole - 1];
    tile.classList.toggle("saved", !!(holeData && holeData.shortGame));
}

function startShortGameHold(change) {
    stopShortGameHold();
    shortGamePressActive = true;
    adjustShortGameDistance(change);

    shortGameHoldTimer = setInterval(() => {
        if (!shortGamePressActive) {
            stopShortGameHold();
            return;
        }
        adjustShortGameDistance(change);
    }, 90);
}

function stopShortGameHold() {
    shortGamePressActive = false;
    if (!shortGameHoldTimer) return;

    clearInterval(shortGameHoldTimer);
    shortGameHoldTimer = null;
}

function wireShortGameHoldButton(btn, change) {
    if (!btn) return;
    btn.addEventListener("pointerdown", e => {
        e.preventDefault();
        startShortGameHold(change);
    });
}


// ===== Notes +Stats =====
window.notesDraft = window.notesDraft || {
    tags: [],
    text: ""
};

function getNotesPanel() {
    return document.getElementById("notesPanel");
}

function updateNotesHoleLabel() {
    const label = document.getElementById("notesHoleLabel");
    if (!label) return;

    let parText = "";
    const selectedPar = document.querySelector('input[name="holePar"]:checked');
    if (selectedPar && selectedPar.value) parText = ` • PAR ${selectedPar.value}`;

    label.textContent = `HOLE ${currentHole}${parText}`;
}

function loadNotesForCurrentHole() {
    const holeData = holes[currentHole - 1];
    const saved = holeData && holeData.notes ? holeData.notes : null;

    window.notesDraft = {
        tags: saved && Array.isArray(saved.tags) ? [...saved.tags] : [],
        text: saved ? String(saved.text || "") : ""
    };

    const textArea = document.getElementById("holeNotesText");
    if (textArea) textArea.value = window.notesDraft.text;

    updateNotesDisplay();
}

function updateNotesDisplay() {
    const tags = window.notesDraft?.tags || [];
    document.querySelectorAll(".notes-tag-btn").forEach(btn => {
        btn.classList.toggle("active", tags.includes(btn.dataset.tag));
    });

    const textArea = document.getElementById("holeNotesText");
    const charCount = document.getElementById("notesCharCount");
    if (textArea && charCount) {
        charCount.textContent = `${textArea.value.length} / 500`;
    }
}

function openNotesStats() {
    const panel = getNotesPanel();
    if (!panel) return;

    const enhancedStatsPanel = document.getElementById("enhancedStatsPanel");
    if (enhancedStatsPanel) enhancedStatsPanel.classList.add("hidden");

    loadNotesForCurrentHole();
    updateNotesHoleLabel();
    panel.classList.remove("hidden");

    const textArea = document.getElementById("holeNotesText");
    if (textArea) setTimeout(() => textArea.focus(), 50);
}

function closeNotesStats(returnToStats = false) {
    const panel = getNotesPanel();
    if (panel) panel.classList.add("hidden");

    if (returnToStats) {
        const enhancedStatsPanel = document.getElementById("enhancedStatsPanel");
        if (enhancedStatsPanel) enhancedStatsPanel.classList.remove("hidden");
    }
}

function toggleNotesTag(tag) {
    const tags = window.notesDraft.tags || [];
    if (tags.includes(tag)) {
        window.notesDraft.tags = tags.filter(t => t !== tag);
    } else {
        window.notesDraft.tags = [...tags, tag];
    }
    updateNotesDisplay();
}

function saveNotesStats() {
    const textArea = document.getElementById("holeNotesText");
    const text = textArea ? String(textArea.value || "").trim() : "";
    const tags = window.notesDraft.tags || [];

    if (!text && tags.length === 0) {
        closeNotesStats();
        return;
    }

    if (!holes[currentHole - 1]) holes[currentHole - 1] = {};

    holes[currentHole - 1].notes = {
        tags: [...tags],
        text
    };

    window.notesDraft.text = text;

    if (roundStarted || anyHoleSaved()) persistActiveRound();

    refreshNotesTile();
    closeNotesStats();

    const enhancedStatsPanel = document.getElementById("enhancedStatsPanel");
    if (enhancedStatsPanel) enhancedStatsPanel.classList.remove("hidden");
}

function refreshNotesTile() {
    const tile = document.getElementById("openNotesStats");
    if (!tile) return;

    const note = holes[currentHole - 1]?.notes;
    const hasNotes = !!(note && ((Array.isArray(note.tags) && note.tags.length > 0) || String(note.text || "").trim() !== ""));
    tile.classList.toggle("saved", hasNotes);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("openShortGameStats")?.addEventListener("click", openShortGameStats);
    document.getElementById("closeShortGamePanel")?.addEventListener("click", closeShortGameStats);
    document.getElementById("cancelShortGameStats")?.addEventListener("click", () => closeShortGameStats(true));
    document.getElementById("saveShortGameStats")?.addEventListener("click", saveShortGameStats);

    document.querySelectorAll(".shortgame-type-btn").forEach(btn => {
        btn.addEventListener("click", () => setShortGameType(btn.dataset.type));
    });

    document.querySelectorAll(".shortgame-lie-btn").forEach(btn => {
        btn.addEventListener("click", () => setShortGameLie(btn.dataset.lie));
    });

    document.querySelectorAll(".shortgame-distance-btn").forEach(btn => {
        btn.addEventListener("click", () => setShortGameDistance(Number(btn.dataset.distance)));
    });

    document.querySelectorAll(".shortgame-result-btn").forEach(btn => {
        btn.addEventListener("click", () => setShortGameResult(btn.dataset.result));
    });

    wireShortGameHoldButton(document.getElementById("shortGameDistanceMinus"), -1);
    wireShortGameHoldButton(document.getElementById("shortGameDistancePlus"), 1);

    ["pointerup", "pointercancel", "pointerleave", "touchend", "mouseup", "blur"].forEach(evt => {
        window.addEventListener(evt, stopShortGameHold, { passive: true });
    });

    document.getElementById("openNotesStats")?.addEventListener("click", openNotesStats);
    document.getElementById("closeNotesPanel")?.addEventListener("click", closeNotesStats);
    document.getElementById("cancelNotesStats")?.addEventListener("click", () => closeNotesStats(true));
    document.getElementById("saveNotesStats")?.addEventListener("click", saveNotesStats);

    document.querySelectorAll(".notes-tag-btn").forEach(btn => {
        btn.addEventListener("click", () => toggleNotesTag(btn.dataset.tag));
    });

    const textArea = document.getElementById("holeNotesText");
    if (textArea) {
        textArea.addEventListener("input", () => {
            window.notesDraft.text = textArea.value;
            updateNotesDisplay();
        });
    }
});



// ===== Short Game trajectory override: mockup-based start, carry, rollout =====
// Added after original functions so these definitions take precedence.
const SHORT_GAME_LEAVE_VALUES_OVERRIDE = ["Inside 3 ft", "Inside 6 ft", "Inside 10 ft", "3-6 ft", "6-10 ft", "10+ ft"];

function normalizeShortGameResult(value) {
    const result = String(value || "").trim();
    if (result === "Left") return "Pin High Left";
    if (result === "Right") return "Pin High Right";
    if (result === "Center") return "Pin High Center";
    return result;
}

function updateShortGameDisplay(animate = true) {
    const draft = window.shortGameDraft || {};
    const display = document.getElementById("shortGameDistanceDisplay");
    const distanceLabel = document.getElementById("shortGameDistanceToHoleLabel");
    const summary = document.getElementById("shortGameSummaryText");
    const distance = Number(draft.distance || 30);
    const normalizedResult = normalizeShortGameResult(draft.result);

    if (display) display.textContent = `${distance} yds`;
    if (distanceLabel) {
    distanceLabel.innerHTML =
        `<strong>${distance} yds <span class="shortgame-to-hole-text">to hole</span>`;
}

    setShortGameButtonState(".shortgame-type-btn", "type", draft.type);
    setShortGameButtonState(".shortgame-lie-btn", "lie", draft.lie);
    setShortGameButtonState(".shortgame-distance-btn", "distance", distance);

    document.querySelectorAll(".shortgame-result-btn").forEach(btn => {
        const value = String(btn.dataset.result || "");
        btn.classList.toggle("active", value === String(draft.leave || "") || value === String(normalizedResult || ""));
    });

    if (summary) {
        const parts = [];
        if (draft.type) parts.push(draft.type);
        if (draft.lie) parts.push(draft.lie);
        if (distance) parts.push(`${distance} yds`);
        if (draft.leave) parts.push(draft.leave);
        if (normalizedResult) parts.push(normalizedResult);
        summary.textContent = parts.length ? parts.join(" • ") : "No short game shot saved yet.";
    }

    updateShortGameGraphic(animate);
}

function ensureShortGameRollPath(anchorEl) {
    let el = document.getElementById("shortGameRollPath");
    if (el) return el;
    if (!anchorEl || !anchorEl.parentNode) return null;

    el = document.createElementNS("http://www.w3.org/2000/svg", "path");
    el.setAttribute("id", "shortGameRollPath");
    el.setAttribute("fill", "none");
    el.setAttribute("stroke", "#ffffff");
    el.setAttribute("stroke-width", "6");
    el.setAttribute("stroke-linecap", "round");
    el.setAttribute("stroke-dasharray", "9 11");
    el.setAttribute("opacity", "0.96");
    anchorEl.parentNode.insertBefore(el, anchorEl.nextSibling);
    return el;
}

function resetShortGameDraft() {
    window.shortGameDraft = {
        type: null,
        lie: null,
        distance: 30,
        leave: null,
        result: null
    };
}

function getShortGameStartPoint() {
    const lie = window.shortGameDraft?.lie || "";
    const points = {
        Fairway: { x: 410, y: 520 },
        // Rough start point moved up and slightly right into the dark rough.
        Rough: { x: 850, y: 315 },
        Bunker: { x: 170, y: 370 },
        Sand: { x: 170, y: 370 },
        Fringe: { x: 540, y: 305 }
    };
    return points[lie] || { x: 410, y: 520 };
}

function getShortGameCupPoint() {
    return { x: 520, y: 235 };
}

function getShortGameLeaveRadius() {
    const leave = window.shortGameDraft?.leave || "Inside 6 ft";
    if (leave === "Inside 3 ft" || leave === "3-6 ft") return 24;
    if (leave === "Inside 10 ft" || leave === "6-10 ft" || leave === "10+ ft") return 68;
    return 42;
}

function getShortGameEndPoint() {
    const draft = window.shortGameDraft || {};
    const result = normalizeShortGameResult(draft.result || "");
    const cup = getShortGameCupPoint();
    const start = getShortGameStartPoint();
    const radius = getShortGameLeaveRadius();

    if (result === "Holed") return { ...cup };
    if (!result) return start;

    const dx = start.x - cup.x;
    const dy = start.y - cup.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / len;
    const uy = dy / len;

    let x = cup.x;
    let y = cup.y;

    if (result.includes("Short")) {
        x += ux * radius;
        y += uy * radius;
    } else if (result.includes("Long")) {
        x -= ux * radius;
        y -= uy * radius;
    }

    if (result.includes("Left")) x -= radius;
    if (result.includes("Right")) x += radius;

    return { x, y };
}

function getShortGameLandingPoint(start, end) {
    const draft = window.shortGameDraft || {};
    if (!draft.result) return { ...start };

    const rollBack = ({ Chip: 78, Pitch: 50, Sand: 30, Bunker: 30 }[draft.type]) || 54;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const usableRoll = Math.min(rollBack, len * 0.33);

    return {
        x: end.x - (dx / len) * usableRoll,
        y: end.y - (dy / len) * usableRoll
    };
}

function getShortGameCarryControlPoint(start, landing) {
    const type = window.shortGameDraft?.type || "Chip";
    const lift = ({ Chip: 95, Pitch: 125, Sand: 150, Bunker: 150 }[type]) || 110;
    return {
        x: (start.x + landing.x) / 2,
        y: Math.min(start.y, landing.y) - lift
    };
}

function setShortGameBallPosition(ball, point) {
    if (!ball || !point) return;
    ball.setAttribute("cx", point.x);
    ball.setAttribute("cy", point.y);
}

function animateShortGameBall(ball, carryPath, rollPath, start, end) {
    if (!ball || !carryPath || !rollPath) return;

    if (window.shortGameAnimationFrame) {
        cancelAnimationFrame(window.shortGameAnimationFrame);
        window.shortGameAnimationFrame = null;
    }

    const carryLength = Math.max(1, carryPath.getTotalLength ? carryPath.getTotalLength() : 1);
    const rollLength = Math.max(1, rollPath.getTotalLength ? rollPath.getTotalLength() : 1);
    const totalLength = carryLength + rollLength;
    const duration = 760;
    const startTime = performance.now();
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    function step(now) {
        const raw = Math.min(1, (now - startTime) / duration);
        const t = easeOutCubic(raw);
        const travelled = t * totalLength;
        const point = travelled <= carryLength
            ? carryPath.getPointAtLength(travelled)
            : rollPath.getPointAtLength(Math.min(rollLength, travelled - carryLength));

        setShortGameBallPosition(ball, point);

        if (raw < 1) {
            window.shortGameAnimationFrame = requestAnimationFrame(step);
        } else {
            setShortGameBallPosition(ball, end);
            window.shortGameAnimationFrame = null;
        }
    }

    setShortGameBallPosition(ball, start);
    window.shortGameAnimationFrame = requestAnimationFrame(step);
}

function updateShortGameGraphic(animate = true) {
    const flightPath = document.getElementById("shortGameFlightPath");
    const startDot = document.getElementById("shortGameStartDot");
    const ball = document.getElementById("shortGameBallDot");
    if (!flightPath || !startDot || !ball) return;

    const rollPath = ensureShortGameRollPath(flightPath);
    const draft = window.shortGameDraft || {};
    const start = getShortGameStartPoint();
    const end = getShortGameEndPoint();
    const landing = getShortGameLandingPoint(start, end);
    const control = getShortGameCarryControlPoint(start, landing);
    const hasFinalResult = !!draft.result;

    flightPath.setAttribute("d", hasFinalResult
        ? `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${landing.x} ${landing.y}`
        : `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${start.x} ${start.y}`
    );

    if (rollPath) {
        rollPath.setAttribute("d", hasFinalResult
            ? `M ${landing.x} ${landing.y} L ${end.x} ${end.y}`
            : `M ${start.x} ${start.y} L ${start.x} ${start.y}`
        );
    }

    startDot.setAttribute("cx", start.x);
    startDot.setAttribute("cy", start.y);

    if (hasFinalResult && animate) {
        animateShortGameBall(ball, flightPath, rollPath, start, end);
    } else {
        setShortGameBallPosition(ball, hasFinalResult ? end : start);
    }
}

function loadShortGameForCurrentHole() {
    resetShortGameDraft();
    const holeData = holes[currentHole - 1];
    if (holeData && holeData.shortGame) {
        window.shortGameDraft = {
            type: holeData.shortGame.type || null,
            lie: holeData.shortGame.lie || null,
            distance: Number(holeData.shortGame.distance || 30),
            leave: holeData.shortGame.leave || null,
            result: normalizeShortGameResult(holeData.shortGame.result || null) || null
        };
    }
    updateShortGameDisplay(false);
}

function setShortGameType(value) {
    window.shortGameDraft.type = value;
    if ((value === "Bunker" || value === "Sand") && !window.shortGameDraft.lie) {
        window.shortGameDraft.lie = "Bunker";
    }
    updateShortGameDisplay(false);
}

function setShortGameLie(value) {
    window.shortGameDraft.lie = value;
    if (value === "Bunker" && !window.shortGameDraft.type) {
        window.shortGameDraft.type = "Sand";
    }
    updateShortGameDisplay(false);
}

function setShortGameDistance(value) {
    window.shortGameDraft.distance = Math.max(1, Math.min(80, Number(value) || 30));
    updateShortGameDisplay(false);
}

function setShortGameResult(value) {
    if (SHORT_GAME_LEAVE_VALUES_OVERRIDE.includes(value)) {
        window.shortGameDraft.leave = value;
        updateShortGameDisplay(false);
        return;
    }
    window.shortGameDraft.result = normalizeShortGameResult(value);
    updateShortGameDisplay(true);
}

function saveShortGameStats() {
    const draft = window.shortGameDraft || {};
    if (!draft.type || !draft.lie || !draft.distance || !draft.result) {
        const summary = document.getElementById("shortGameSummaryText");
        if (summary) summary.textContent = "Choose Shot Type, Lie/Situation, Distance, and Result before saving.";
        return;
    }

    if (!holes[currentHole - 1]) holes[currentHole - 1] = {};
    holes[currentHole - 1].shortGame = {
        type: draft.type,
        lie: draft.lie || "",
        distance: Number(draft.distance || 0),
        leave: draft.leave || "",
        result: normalizeShortGameResult(draft.result)
    };

    if (roundStarted || anyHoleSaved()) persistActiveRound();
    refreshShortGameTile();
    closeShortGameStats();

    const enhancedStatsPanel = document.getElementById("enhancedStatsPanel");
    if (enhancedStatsPanel) enhancedStatsPanel.classList.remove("hidden");
}



// ===== FINAL FIX: Hole page text links =====
document.addEventListener("DOMContentLoaded", () => {
    const returnBtn = document.getElementById("returnToDetailsBtn");
    const yardageBtn = document.getElementById("viewHoleYardagesBtn");
    const yardagePopup = document.getElementById("holeYardagesPopup");

    if (returnBtn) {
        returnBtn.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();

            const startingHoleField = document.getElementById("startingHole");
            if (startingHoleField) {
                startingHoleField.disabled = anyHoleSaved();
            }

            pendingSaveAfterValidation = false;
            autoSaveInProgress = false;

            if (typeof persistActiveRound === "function") {
                persistActiveRound();
            }

            showRoundDetailsScreen();
        });
    }

    if (yardageBtn && yardagePopup) {
    yardageBtn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();

        // Move popup out of hidden Round Details screen so it can appear on Hole Stats page
        document.body.appendChild(yardagePopup);

        if (typeof loadHoleYardages === "function") {
            loadHoleYardages();
        }

        if (typeof updateHoleYardagesTotal === "function") {
            updateHoleYardagesTotal();
        }

        yardagePopup.classList.remove("hidden");
        yardagePopup.style.display = "flex";
        yardagePopup.style.visibility = "visible";
        yardagePopup.style.opacity = "1";
    });
}
});


/* ========================================
   PHASE 2 – COURSE YARDAGE LIBRARY GLOBAL FIX
======================================== */

function showCourseLibraryMessage(title, message) {
    if (typeof showYardageConfirmPopup === "function") {
        showYardageConfirmPopup({
            title,
            message,
            showCancel: false
        });
    } else {
        alert(`${title}\n\n${message}`);
    }
}

window.deleteSelectedCourseYardageSet = function () {
    const select = document.getElementById("savedCourseYardageSelect");

    if (!select || !select.value) {
        showCourseLibraryMessage(
            "No Saved Set Selected",
            "Select a saved course yardage set before deleting."
        );
        return;
    }

    const library = getCourseYardageLibrary();
    const key = select.value;

    if (!library[key]) return;

    const confirmed = confirm(`Delete saved yardage set?\n\n${key}`);
    if (!confirmed) return;

    delete library[key];

    saveCourseYardageLibrary(library);
    populateSavedCourseYardageSelect();

    showCourseLibraryMessage(
        "Course Set Deleted",
        "The saved course yardage set was deleted locally."
    );
};

window.renameSelectedCourseYardageSet = function () {
    const select = document.getElementById("savedCourseYardageSelect");

    if (!select || !select.value) {
        showCourseLibraryMessage(
            "No Saved Set Selected",
            "Select a saved course yardage set before renaming."
        );
        return;
    }

    const library = getCourseYardageLibrary();
    const oldKey = select.value;
    const savedSet = library[oldKey];

    if (!savedSet) return;

    const newCourseName = prompt("Enter the new course name:", savedSet.courseName || "");
    if (!newCourseName || !newCourseName.trim()) return;

    const newKey = buildCourseYardageLibraryKey(newCourseName.trim(), savedSet.teeYardage);

    if (newKey !== oldKey && library[newKey]) {
        showCourseLibraryMessage(
            "Name Already Exists",
            "A saved yardage set with that course name and yardage already exists."
        );
        return;
    }

    savedSet.courseName = newCourseName.trim();

    delete library[oldKey];
    library[newKey] = savedSet;

    saveCourseYardageLibrary(library);
    populateSavedCourseYardageSelect();

    select.value = newKey;

    showCourseLibraryMessage(
        "Course Set Renamed",
        `Saved set renamed to ${newCourseName.trim()}.`
    );
};


function showCourseLibraryMessage(title, message) {
    alert(`${title}\n\n${message}`);
}