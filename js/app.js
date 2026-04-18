
const DEV_MODE = false; // 🔥 set to true when you want cheat buttons back


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

    persistActiveRound();

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
    adjustSummaryHeight();
    updateCoursePar();
    updateParRowState();
    updateRoundDetailCompletion();
    updateHoleScreen();
    updateResumePanel();
    updatePostRoundUI();
    checkForActiveRoundOnLoad();
});


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
    if (resumeRoundPanel) {
        resumeRoundPanel.classList.add("hidden");
    }
}

function updateResumePanel() {
    if (!resumeRoundPanel) return;

    const saved = getParsedActiveRound();

    // 🚫 HARD STOP — no saved object at all
    if (!saved) {
        resumeRoundPanel.classList.add("hidden");
        return;
    }

    // 🚫 NO HOLES SAVED
    const savedHoleCount = Array.isArray(saved.holes)
        ? saved.holes.filter(h => h && h.saved).length
        : 0;

    // 🚫 NO REAL DETAILS ENTERED
    const details = saved.roundDetails || {};
    const hasRealDetails = Object.values(details).some(v => String(v || "").trim() !== "");

    // 🚫 NOTHING MEANINGFUL → HIDE ARF
    if (savedHoleCount === 0 && !hasRealDetails) {
        resumeRoundPanel.classList.add("hidden");
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
    updateResumePanel();
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

            persistActiveRound();
            updateResumePanel();

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

    const holeData = holes[currentHole - 1];

    if (holeData && holeData.saved) {
        setStats(holeData);
        if (saveBtn) saveBtn.classList.add("inactive");
    } else {
        clearInputs();
        if (saveBtn) saveBtn.classList.remove("inactive");
    }

    updateNavButtons();
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

    if (!selectedPar) {
        missing.push("the hole's Par");
    }

    if (puttsValue === "" || parseInt(puttsValue, 10) <= 0) {
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

    if (!puttsInput || String(puttsInput.value || "").trim() === "" || parseInt(puttsInput.value, 10) <= 0) {
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

    if (selectedPar == null || scoreValue <= 0 || puttsValue <= 0) {
        if (saveConfirmPopup) saveConfirmPopup.style.display = "none";
        showHoleSaveValidationPopup();
        return;
    }

    holes[currentHole - 1] = {
        fir: !!(firEl && firEl.checked),
        gir: !!(girEl && girEl.checked),
        updown: !!(updownEl && updownEl.checked),
        sand: !!(sandEl && sandEl.checked),
        putts: puttsValue,
        penalty: penaltyValue,
        score: scoreValue,
        par: selectedPar,
        saved: true
    };

    if (saveConfirmPopup) saveConfirmPopup.style.display = "none";
    if (validationPopup) validationPopup.style.display = "none";

    pendingSaveAfterValidation = false;
    autoSaveInProgress = false;

    triggerSavedFeedback();

    const savedCount = holes.filter(h => h && h.saved).length;
    const isLastHole = savedCount === 18;

    if (!isLastHole && currentHoleIndex < playOrder.length - 1) {
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


function viewSummary(e, returnTarget = "app") {
    if (e) e.preventDefault();
    showSummaryForRound(
        holes,
        currentHole,
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
    if (savedHoleCount < 18) {
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
        const statsHelpPopup = document.getElementById("statsHelpPopup");
        const statsHelpCloseBtn = document.getElementById("statsHelpCloseBtn");

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
            persistActiveRound();
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

if (deleteAndStartNewBtn) {
    deleteAndStartNewBtn.addEventListener("click", () => {
        hideDeleteRoundPopup();

        clearActiveRoundStorage();
        removeFromStorage(ROUND_BG_INDEX_KEY);
        localStorage.removeItem(HOLE_YARDAGES_KEY);
        resetForBrandNewRound();
        showRoundDetailsScreen();
    });
}


    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            if (holes[currentHole - 1] && holes[currentHole - 1].saved) return;

            const validation = getHoleSaveValidation();

            if (!validation.valid) {
                pendingSaveAfterValidation = true;
                autoSaveInProgress = false;
                showHoleSaveValidationPopup();
                return;
            }

            pendingSaveAfterValidation = false;
            autoSaveInProgress = false;

            const saveConfirmText = document.getElementById("saveConfirmText");
            if (saveConfirmText) {
                saveConfirmText.textContent = `Save Hole ${currentHole} Stats?`;
            }
            if (saveConfirmPopup) saveConfirmPopup.style.display = "flex";
        });
    }

    if (saveConfirmCancel) {
        saveConfirmCancel.addEventListener("click", () => {
            if (saveConfirmPopup) saveConfirmPopup.style.display = "none";
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
            resetForBrandNewRound();
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

            if (savedHoleCount === 18 && (roundJustCompleted || postRoundMode)) {
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
    const enhancedStatsDoneBtn = document.getElementById("enhancedStatsDone");

    if (openEnhancedStatsBtn && enhancedStatsPanel) {
        const updateEnhancedStatsHeader = () => {
            const holeLabel = enhancedStatsPanel.querySelector(".es-panel-hole");
            if (!holeLabel) return;

            let displayHole = currentHole || 1;

            let selectedPar = "";
            const selectedParRadio = document.querySelector('input[name="holePar"]:checked');
            if (selectedParRadio) selectedPar = selectedParRadio.value;
            if (!selectedPar) selectedPar = "4";

            holeLabel.textContent = `Hole ${displayHole} • Par ${selectedPar}`;
        };

        openEnhancedStatsBtn.addEventListener("click", () => {
            updateEnhancedStatsHeader();
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
        });
    }





        /* HOLE YARDAGES */
    const addHoleYardagesBtn = document.getElementById("addHoleYardagesBtn");
    const holeYardagesPopup = document.getElementById("holeYardagesPopup");
    const closeHoleYardagesBtn = document.getElementById("closeHoleYardagesBtn");
    const saveHoleYardagesBtn = document.getElementById("saveHoleYardagesBtn");
    const teeYardageField = document.getElementById("teeYardage");
    const HOLE_YARDAGES_KEY = "strackerPhase2HoleYardages";

    const getHoleYardages = () => {
        const yardages = [];

        for (let i = 1; i <= 18; i++) {
            const input = document.getElementById(`yardage${i}`);
            yardages.push(input ? (parseInt(input.value, 10) || 0) : 0);
        }

        return yardages;
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

    const loadHoleYardages = () => {
        let saved = [];

        try {
            saved = JSON.parse(localStorage.getItem(HOLE_YARDAGES_KEY)) || [];
        } catch (err) {
            console.error("Could not load hole yardages", err);
            saved = [];
        }

        for (let i = 1; i <= 18; i++) {
            const input = document.getElementById(`yardage${i}`);
            if (!input) continue;

            const value = saved[i - 1];
            input.value = value ? value : "";
        }

        updateHoleYardagesTotal();
    };

if (addHoleYardagesBtn && holeYardagesPopup) {
    addHoleYardagesBtn.addEventListener("click", () => {
        const savedRound = getParsedActiveRound();

        if (!savedRound) {
            localStorage.removeItem(HOLE_YARDAGES_KEY);

            for (let i = 1; i <= 18; i++) {
                const input = document.getElementById(`yardage${i}`);
                if (input) input.value = "";
            }

            updateHoleYardagesTotal();
        }

        loadHoleYardages();
        holeYardagesPopup.classList.remove("hidden");
        updateHoleYardagesTotal();
    });
}

    document.querySelectorAll(".yardage-input").forEach(input => {
        input.addEventListener("input", updateHoleYardagesTotal);
    });

    if (closeHoleYardagesBtn && holeYardagesPopup) {
        closeHoleYardagesBtn.addEventListener("click", () => {
            holeYardagesPopup.classList.add("hidden");
        });
    }

    if (saveHoleYardagesBtn && holeYardagesPopup) {
        saveHoleYardagesBtn.addEventListener("click", () => {
            const yardages = getHoleYardages();

            try {
                localStorage.setItem(HOLE_YARDAGES_KEY, JSON.stringify(yardages));
            } catch (err) {
                console.error("Could not save hole yardages", err);
                return;
            }

            updateHoleYardagesTotal();

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

    const savedRoundForYardages = getParsedActiveRound();

if (!savedRoundForYardages) {
    localStorage.removeItem(HOLE_YARDAGES_KEY);

    for (let i = 1; i <= 18; i++) {
        const input = document.getElementById(`yardage${i}`);
        if (input) input.value = "";
    }

    const totalEl = document.getElementById("holeYardagesTotal");
    if (totalEl) totalEl.textContent = "0";

    if (teeYardageField) teeYardageField.value = "";
} else {
    loadHoleYardages();
}


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

}

// Service Worker DISABLED