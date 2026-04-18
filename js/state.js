// ================= Golf Stats Tracker JS =================

// ===== Global Variables =====
let currentHole = 1;
let currentHoleIndex = 0;
let startingHole = 1;
let playOrder = Array.from({ length: 18 }, (_, i) => i + 1);

let soundOn = true;
let roundStarted = false;
let resumingSavedRound = false;
let summaryReturnTarget = "app";

let roundJustCompleted = false;
let postRoundMode = false;
let postRoundReturnTarget = "";
let postRoundButtonDelayTimer = null;
let postRoundButtonVisible = false;

const holes = new Array(18).fill(null);

const STORAGE_KEY = "golfStatsActiveRound";
const ROUND_BG_INDEX_KEY = "golfStatsRoundBgIndex";
const COMPLETED_ROUNDS_KEY = "golfStatsCompletedRounds";
const APP_VERSION_KEY = "golfStatsDataVersion";
const CURRENT_DATA_VERSION = 1;
const MAX_COMPLETED_ROUNDS = 250;

let pendingSaveAfterValidation = false;
let autoSaveInProgress = false;

const roundBackgrounds = [
    "images/golf-shot1.jpg",
    "images/golf-shot2.jpg",
    "images/golf-shot3.jpg",
    "images/golf-shot4.jpg"
];

let leavingPostRoundDetails = false;

// ===== DOM Elements =====
const saveBtn = document.getElementById("saveHole");
const saveConfirmPopup = document.getElementById("saveConfirmPopup");
const saveConfirmOK = document.getElementById("confirmOK");
const saveConfirmCancel = document.getElementById("confirmCancel");

const validationPopup = document.getElementById("validationPopup");
const validationText = document.getElementById("validationText");
const validationOK = document.getElementById("validationOK");

const prevHoleBtn = document.getElementById("prevHole");
const nextHoleBtn = document.getElementById("nextHole");
const forwardHoleBtn = document.getElementById("forwardHole");
const returnToDetailsBtn = document.getElementById("returnToDetails");

const roundDetailsScreen = document.getElementById("roundDetailsScreen");
const appContainer = document.getElementById("appContainer");
const nineteenthHoleScreen = document.getElementById("nineteenthHoleScreen");

const finalClosurePopup = document.getElementById("finalClosurePopup");
const finalClosureTitle = document.getElementById("finalClosureTitle");
const finalClosureText = document.getElementById("finalClosureText");
const finalClosureBtn = document.getElementById("finalClosureBtn");

const resumeRoundPanel = document.getElementById("resumeRoundPanel");
const resumeRoundCourse = document.getElementById("resumeRoundCourse");
const resumeRoundStatus = document.getElementById("resumeRoundStatus");
const resumeRoundBtn = document.getElementById("resumeRoundBtn");
const newRoundBtn = document.getElementById("newRoundBtn");

const frontParField = document.getElementById("frontPar");
const backParField = document.getElementById("backPar");
const courseParField = document.getElementById("coursePar");
const roundDateField = document.getElementById("roundDate");
const roundDateDisplay = document.getElementById("roundDateDisplay");

const postRoundGuidance = document.getElementById("postRoundGuidance");
const postRoundReturnWrap = document.getElementById("postRoundReturnWrap");
const postRoundReturnBtn = document.getElementById("postRoundReturnBtn");
const roundFormNote = document.getElementById("roundFormNote");

// ===== Round Detail Fields =====
const roundDetailFields = [
    "roundDate",
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