function getRoundTotalPutts() {
    return holes.reduce((sum, h) => {
        return sum + ((h && h.saved) ? Number(h.putts || 0) : 0);
    }, 0);
}

// ===== Storage Helpers =====
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error("Storage save failed:", e);
        return false;
    }
}

function loadFromStorage(key, fallback = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (e) {
        console.error("Storage load failed:", e);
        return fallback;
    }
}

function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error("Storage remove failed:", e);
    }
}

function initializeAppStorage() {
    try {
        const version = Number(localStorage.getItem(APP_VERSION_KEY) || 0);

        if (!localStorage.getItem(COMPLETED_ROUNDS_KEY)) {
            saveToStorage(COMPLETED_ROUNDS_KEY, []);
        }

        if (version < CURRENT_DATA_VERSION) {
            localStorage.setItem(APP_VERSION_KEY, String(CURRENT_DATA_VERSION));
        }
    } catch (e) {
        console.error("Storage init failed:", e);
    }
}

// ===== Completed Round History =====
function getCompletedRounds() {
    const rounds = loadFromStorage(COMPLETED_ROUNDS_KEY, null);

    if (Array.isArray(rounds)) {
        return rounds;
    }

    const backupRounds = loadFromStorage("completed_rounds_backup", []);

    if (Array.isArray(backupRounds)) {
        saveToStorage(COMPLETED_ROUNDS_KEY, backupRounds);
        return backupRounds;
    }

    return [];
}

function saveCompletedRounds(rounds) {
    const trimmed = Array.isArray(rounds) ? rounds.slice(0, MAX_COMPLETED_ROUNDS) : [];

    const mainSaved = saveToStorage(COMPLETED_ROUNDS_KEY, trimmed);
    const backupSaved = saveToStorage("completed_rounds_backup", trimmed);

    return mainSaved && backupSaved;
}

async function addCompletedRound(round) {
    const rounds = getCompletedRounds();
    rounds.unshift(round);

    const savedLocally = saveCompletedRounds(rounds);

    if (!savedLocally) {
        return false;
    }

    try {
        if (window.uploadCompletedRoundToSupabase) {
            const result = await window.uploadCompletedRoundToSupabase(round);

            if (!result.success) {
                console.warn("Round saved locally, but Supabase upload failed:", result.error);
            }
        }
    } catch (err) {
        console.warn("Round saved locally, but cloud upload crashed:", err);
    }

    return true;
}

function generateRoundId() {
    return `round_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getSavedHoleCount() {
    return holes.filter(h => h && h.saved).length;
}

function buildCompletedRound() {
    return {
        id: generateRoundId(),
        date: new Date().toISOString(),
        version: CURRENT_DATA_VERSION,
        details: {
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
        },
        holes: holes.map((h, idx) => {
            if (!h) {
                return {
                    hole: idx + 1,
                    fir: false,
                    gir: false,
                    updown: false,
                    sand: false,
                    putts: 0,
                    penalty: 0,
                    score: 0,
                    par: null,
                    saved: false
                };
            }

            return {
                hole: idx + 1,
                fir: !!h.fir,
                gir: !!h.gir,
                updown: !!h.updown,
                sand: !!h.sand,
                putts: Number(h.putts || 0),
                penalty: Number(h.penalty || 0),
                score: Number(h.score || 0),
                par: h.par == null ? null : Number(h.par),
                saved: !!h.saved
            };
        })
    };
}

window.archiveCompletedRound = async function archiveCompletedRound() {
    console.log("🔥 archiveCompletedRound RUNNING");

    if (!roundJustCompleted || getSavedHoleCount() !== 18) {
        console.log("[ARCHIVE] stopped early");
        return true;
    }

    if (roundFinalized) {
        console.log("[ARCHIVE] already finalized");
        return true;
    }

    roundFinalized = true;

    const round = buildCompletedRound();
    round.roundFinalized = true;

    console.log("[ARCHIVE] built round:", round);

    const saved = await addCompletedRound(round);

    console.log("[ARCHIVE] addCompletedRound returned:", saved);

    if (!saved) {
        alert("Could not save round history.");
        roundFinalized = false;
        return false;
    }

    if (window.deleteLiveRoundTracking) {
        console.log("[ARCHIVE] deleting live round row from Supabase");
        await window.deleteLiveRoundTracking();
    } else {
        console.warn("[ARCHIVE] deleteLiveRoundTracking is missing on window");
    }

    removeFromStorage(STORAGE_KEY);
    removeFromStorage("backup_round");
    removeFromStorage(ROUND_BG_INDEX_KEY);

    console.log("[ARCHIVE] archive complete");

    return true;
};

function finalizeCompletedRoundIfNeeded() {
    if (!roundJustCompleted) return true;
    return archiveCompletedRound();
}

function clearActiveRoundStorage() {
    removeFromStorage(STORAGE_KEY);
    removeFromStorage("backup_round");
    removeFromStorage(ROUND_BG_INDEX_KEY);
    roundFinalized = false;
}
function getParsedActiveRound() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const backupRaw = localStorage.getItem("backup_round");

    if (!raw && !backupRaw) return null;

    try {
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error("Failed to parse active round:", err);
    }

    try {
        if (backupRaw) {
            console.warn("Main active round missing or bad. Restoring from backup.");
            const parsedBackup = JSON.parse(backupRaw);

            localStorage.setItem(STORAGE_KEY, backupRaw);
            return parsedBackup;
        }
    } catch (backupErr) {
        console.error("Failed to parse backup round:", backupErr);
    }

    clearActiveRoundStorage();
    removeFromStorage("backup_round");
    return null;
}

function hasResumableRoundData(saved) {
    if (!saved || typeof saved !== "object") return false;

    if (saved.roundFinalized) return false;

    const savedHoles = Array.isArray(saved.holes) ? saved.holes : [];
    const savedRoundDetails = saved.roundDetails || {};

    const hasSavedHoles = savedHoles.some(h => h && h.saved);
    const hasAnyRoundDetails = hasMeaningfulRoundDetails(savedRoundDetails);

    return hasSavedHoles || hasAnyRoundDetails || !!saved.roundJustCompleted;
}

function persistActiveRound() {
    const roundDetails = getRoundDetails();

    const hasSavedHoles = holes.some(h => h && h.saved);
    const hasAnyRoundDetails = hasMeaningfulRoundDetails(roundDetails);

    if (!hasSavedHoles && !hasAnyRoundDetails && !roundStarted && !roundJustCompleted && !postRoundMode) {
        clearActiveRoundStorage();
        updateResumePanel();
        return;
    }

    const payload = {
        roundStarted,
        roundFinalized,
        currentHole,
        currentHoleIndex,
        startingHole,
        playOrder,
        holes,
        roundDetails,
        soundOn,
        roundJustCompleted,
        postRoundMode,
        postRoundReturnTarget,
        lastUpdated: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    // 🔒 Backup save (safety layer)
localStorage.setItem("backup_round", JSON.stringify(payload));
    updateResumePanel();
}

function saveActiveRound() {
    persistActiveRound();
}

function applyLoadedRound(saved) {
    const savedHoles = Array.isArray(saved.holes) ? saved.holes : [];
    const savedRoundDetails = saved.roundDetails || {};

    roundStarted = !!saved.roundStarted;
    roundFinalized = !!saved.roundFinalized;
    roundJustCompleted = !!saved.roundJustCompleted;
    postRoundMode = !!saved.postRoundMode;
    postRoundReturnTarget = String(saved.postRoundReturnTarget || "");

    currentHole = Number(saved.currentHole) || 1;
    currentHoleIndex = Number(saved.currentHoleIndex) || 0;
    startingHole = Number(saved.startingHole) || 1;

    playOrder = Array.isArray(saved.playOrder) && saved.playOrder.length === 18
        ? saved.playOrder
        : buildPlayOrder(startingHole);

    for (let i = 0; i < 18; i++) {
        holes[i] = savedHoles[i] || null;
    }

    setRoundDetails(savedRoundDetails);

    if (typeof saved.soundOn === "boolean") {
        soundOn = saved.soundOn;
        if (speakerToggle) {
            speakerToggle.textContent = soundOn ? "🔊" : "🔇";
        }
    }

    if (currentHoleIndex < 0 || currentHoleIndex > 17) {
        currentHoleIndex = 0;
    }

    syncCurrentHoleFromIndex();
    updatePostRoundUI();
}

function loadActiveRoundIfPresent() {
    const saved = getParsedActiveRound();

    if (!saved || !hasResumableRoundData(saved)) {
        clearActiveRoundStorage();
        updateResumePanel();
        return false;
    }

    applyLoadedRound(saved);
    updateResumePanel();
    return true;
}

function checkForActiveRoundOnLoad() {
    const saved = getParsedActiveRound();

    if (!saved) {
        updateResumePanel();
        return;
    }

    if (!hasResumableRoundData(saved)) {
        clearActiveRoundStorage();
        updateResumePanel();
        return;
    }

    updateResumePanel();
}

function seedTestCompletedRounds() {
    const sampleRounds = [
        {
            id: generateRoundId(),
            date: new Date("2026-03-20").toISOString(),
            version: CURRENT_DATA_VERSION,
            roundFinalized: true,
            details: {
                roundDate: "2026-03-20",
                roundType: "Tournament",
                courseName: "Highland Meadows",
                startingHole: "1",
                teeSlope: "128",
                teeRating: "71.4",
                teeYardage: "6400",
                frontPar: "36",
                backPar: "36",
                coursePar: "72"
            },
            summary: {
                totalScore: 78,
                vsPar: 6
            },
            holes: Array.from({ length: 18 }, (_, i) => ({
                hole: i + 1,
                fir: i % 2 === 0,
                gir: i % 3 === 0,
                updown: i % 4 === 0,
                sand: false,
                putts: 2,
                penalty: 0,
                score: 4,
                par: 4,
                saved: true
            }))
        },
        {
            id: generateRoundId(),
            date: new Date("2026-03-21").toISOString(),
            version: CURRENT_DATA_VERSION,
            roundFinalized: true,
            details: {
                roundDate: "2026-03-21",
                roundType: "Practice",
                courseName: "Fox Hollow",
                startingHole: "1",
                teeSlope: "131",
                teeRating: "72.8",
                teeYardage: "6625",
                frontPar: "36",
                backPar: "36",
                coursePar: "72"
            },
            summary: {
                totalScore: 75,
                vsPar: 3
            },
            holes: Array.from({ length: 18 }, (_, i) => ({
                hole: i + 1,
                fir: i % 2 !== 0,
                gir: i % 3 !== 0,
                updown: i % 5 === 0,
                sand: i === 6 || i === 14,
                putts: 2,
                penalty: i === 8 ? 1 : 0,
                score: 4,
                par: 4,
                saved: true
            }))
        },
        {
            id: generateRoundId(),
            date: new Date("2026-03-22").toISOString(),
            version: CURRENT_DATA_VERSION,
            roundFinalized: true,
            details: {
                roundDate: "2026-03-22",
                roundType: "Tournament",
                courseName: "CommonGround",
                startingHole: "1",
                teeSlope: "134",
                teeRating: "73.6",
                teeYardage: "6840",
                frontPar: "36",
                backPar: "36",
                coursePar: "72"
            },
            summary: {
                totalScore: 73,
                vsPar: 1
            },
            holes: Array.from({ length: 18 }, (_, i) => ({
                hole: i + 1,
                fir: true,
                gir: i % 4 !== 0,
                updown: i % 6 === 0,
                sand: i === 11,
                putts: i % 5 === 0 ? 1 : 2,
                penalty: 0,
                score: 4,
                par: 4,
                saved: true
            }))
        }
    ];
}
