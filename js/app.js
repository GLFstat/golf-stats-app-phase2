

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

function getRoundDetails() {
    return {
        roundDate: getFieldValue("roundDate"),
        roundType: getFieldValue("roundType"),
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
    const coursePar = parseInt(document.getElementById("coursePar")?.value, 10) || 0;
    return getRoundTotalScore() - coursePar;
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
localStorage.removeItem(HOLE_YARDAGES_KEY);
localStorage.removeItem("strackerPhase2HolePars");

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
         
