window.showClubhouseScreen = function () {
    const clubhouseScreen = document.getElementById("clubhouseScreen");
    const clubhouseMessage = document.getElementById("clubhouseMessage");

    const roundDetailsScreen = document.getElementById("roundDetailsScreen");
    const appContainer = document.getElementById("appContainer");
    const nineteenthHoleScreen = document.getElementById("nineteenthHoleScreen");
    const savedRoundsScreen = document.getElementById("savedRoundsScreen");
    const performanceChartsScreen = document.getElementById("performanceChartsScreen");
    const savedRoundsListScreen = document.getElementById("savedRoundsListScreen");

    if (!clubhouseScreen || !clubhouseMessage) {
        alert("Clubhouse screen elements were not found.");
        return;
    }

    // FIRST CHOICE: use the live current round in memory
    const liveHoles = (typeof holes !== "undefined" && Array.isArray(holes))
        ? holes.filter(h => h && h.saved)
        : [];

    const liveDetails = (typeof getRoundDetails === "function")
        ? getRoundDetails()
        : {};

    // FALLBACK: latest saved round from localStorage
    let storedRound = null;
    try {
        const rounds = JSON.parse(localStorage.getItem("golfStatsCompletedRounds") || "[]");
        storedRound = rounds.length ? rounds[rounds.length - 1] : null;
    } catch (e) {
        storedRound = null;
    }

    let sourceHoles = [];
    let sourceDetails = {};

    if (liveHoles.length > 0) {
        sourceHoles = liveHoles;
        sourceDetails = liveDetails || {};
    } else if (storedRound) {
        sourceHoles = Array.isArray(storedRound.holes)
            ? storedRound.holes.filter(h => h && h.saved)
            : [];
        sourceDetails = storedRound.details || storedRound.roundDetails || {};
    } else {
        alert("No round data was found for Clubhouse yet.");
        return;
    }

    if (roundDetailsScreen) roundDetailsScreen.style.display = "none";
    if (appContainer) appContainer.style.display = "none";
    if (nineteenthHoleScreen) nineteenthHoleScreen.classList.add("hidden");
    if (savedRoundsScreen) savedRoundsScreen.classList.add("hidden");
    if (performanceChartsScreen) performanceChartsScreen.classList.add("hidden");
    if (savedRoundsListScreen) savedRoundsListScreen.classList.add("hidden");

    clubhouseScreen.classList.remove("hidden");
    clubhouseScreen.style.display = "flex";
    clubhouseScreen.style.opacity = "1";
    clubhouseScreen.style.visibility = "visible";

    const totalHoles = sourceHoles.length;

    const firOpportunities = sourceHoles.filter(h => Number(h.par || 0) >= 4).length;
    const firMade = sourceHoles.filter(h => Number(h.par || 0) >= 4 && h.fir === true).length;
    const fir = firOpportunities ? Math.round((firMade / firOpportunities) * 100) : "--";

    const girMade = sourceHoles.filter(h => h.gir === true).length;
    const gir = totalHoles ? Math.round((girMade / totalHoles) * 100) : "--";

    const putts = totalHoles
        ? sourceHoles.reduce((sum, h) => sum + Number(h.putts || 0), 0)
        : "--";

    const score = totalHoles
        ? sourceHoles.reduce((sum, h) => sum + Number(h.score || 0), 0)
        : "--";

    const coursePar = Number(sourceDetails.coursePar || 0);
    const vsPar = coursePar && score !== "--" ? score - coursePar : 0;

    let opener = "Nice work out there!";
    if (vsPar < 0) opener = "Excellent round today.";
    if (vsPar > 5) opener = "Good effort today — keep building.";

    clubhouseMessage.innerHTML = `
        <p class="clubhouse-center"><strong>${opener}</strong></p>

        <p>
            Your round at <strong>${sourceDetails.courseName || "this course"}</strong> shows:
        </p>

        <p>
            You found <strong>${fir}%</strong> of your fairways <br>and
            <strong>${gir}%</strong> of your greens in regulation.
        </p>

        <p>
            You took <strong>${putts}</strong> putts on your way to <br>a score of
            <strong>${score}</strong>.
        </p>

        <p class="clubhouse-center">
            <strong>Keep working, stay consistent, keep the momentum going.<br><span style="color: white;">See you on the next round!</span></strong>
        </p>
    `;

    window.scrollTo(0, 0);
};

window.openClubhouseSummary = function () {
    const currentCourseName =
        (typeof getFieldValue === "function" ? getFieldValue("courseName") : "") || "";

    const liveHoles =
        Array.isArray(window.holes) ? window.holes :
        (typeof holes !== "undefined" && Array.isArray(holes) ? holes : []);

    const liveSavedCount = liveHoles.filter(h => h && h.saved).length;

    // First choice: the round currently in memory
    if (liveSavedCount > 0 && typeof showSummaryForRound === "function") {
        showSummaryForRound(
            liveHoles,
            null,
            "clubhouse",
            currentCourseName
        );
        return;
    }

    // Fallback: most recent saved round from localStorage
    const rounds = JSON.parse(localStorage.getItem("golfStatsCompletedRounds") || "[]");
    const lastRound = rounds[rounds.length - 1];

    if (!lastRound || !Array.isArray(lastRound.holes)) return;

    if (typeof showSummaryForRound === "function") {
        showSummaryForRound(
            lastRound.holes,
            null,
            "clubhouse",
            lastRound.details?.courseName || lastRound.roundDetails?.courseName || ""
        );
    }
};

window.startNewRoundFromClubhouse = function () {
    if (typeof resetCurrentRound === "function") {
        resetCurrentRound();
    }

    const clubhouse = document.getElementById("clubhouseScreen");
    const roundDetails = document.getElementById("roundDetailsScreen");

    if (clubhouse) clubhouse.classList.add("hidden");
    if (roundDetails) roundDetails.style.display = "flex";

    if (typeof updateRoundDetailCompletion === "function") {
        updateRoundDetailCompletion();
    }

    window.scrollTo(0, 0);
};

window.closeClubhouseScreen = function () {
    const clubhouse = document.getElementById("clubhouseScreen");
    const wrapUp = document.getElementById("nineteenthHoleScreen");

    if (clubhouse) clubhouse.classList.add("hidden");
    if (wrapUp) wrapUp.classList.remove("hidden");

    window.scrollTo(0, 0);
};





window.showClubhouseDoneScreen = function (e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    const clubhouse = document.getElementById("clubhouseScreen");
    const doneScreen = document.getElementById("clubhouseDoneScreen");
    const startBtn = document.getElementById("clubhouseDoneStartBtn");
    const logo = document.getElementById("clubhouseDoneLogo");
    const doneBtn = document.getElementById("clubhouseCloseBtn");

    if (!doneScreen) {
        alert("Clubhouse closing screen not found.");
        return;
    }

    if (doneBtn) {
        doneBtn.style.opacity = "0";
        doneBtn.style.visibility = "hidden";
        doneBtn.style.pointerEvents = "none";
        doneBtn.style.boxShadow = "none";
        doneBtn.style.background = "transparent";
        doneBtn.style.borderColor = "transparent";
    }

    if (startBtn) startBtn.style.opacity = "0";

    if (logo) {
        logo.style.opacity = "0";
        logo.style.transform = "scale(0.82)";
    }

    if (clubhouse) {
        clubhouse.style.transition = "opacity 0.4s ease";
        clubhouse.style.opacity = "0";

        setTimeout(() => {
            clubhouse.classList.add("hidden");
            clubhouse.style.display = "none";
            clubhouse.style.opacity = "1";
        }, 400);
    }

    doneScreen.classList.remove("hidden");
    doneScreen.classList.add("show");
    doneScreen.style.display = "flex";
    doneScreen.style.opacity = "1";
    doneScreen.style.visibility = "visible";
    doneScreen.style.zIndex = "999999";

    if (startBtn) {
        setTimeout(() => {
            startBtn.style.opacity = "1";
        }, 1800);
    }

    window.scrollTo(0, 0);
};

window.startNewRoundFromClubhouseDone = function () {
    const doneScreen = document.getElementById("clubhouseDoneScreen");

    if (doneScreen) {
        doneScreen.classList.remove("show");
        doneScreen.style.opacity = "0";
    }

    setTimeout(() => {
        if (doneScreen) {
            doneScreen.classList.add("hidden");
            doneScreen.style.display = "none";
        }

        if (typeof resetCurrentRound === "function") {
            resetCurrentRound();
        }

        const roundDetails = document.getElementById("roundDetailsScreen");
        if (roundDetails) roundDetails.style.display = "flex";

        window.scrollTo(0, 0);
    }, 800);
};