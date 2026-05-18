let analyticsRenderTimer = null;
let analyticsObserverStarted = false;

function getRoundTotalFromRound(round) {
    if (round.summary && round.summary.totalScore != null) {
        return Number(round.summary.totalScore || 0);
    }

    const savedHoles = Array.isArray(round.holes)
        ? round.holes.filter(h => h && h.saved)
        : [];

    return savedHoles.reduce((sum, h) => sum + Number(h.score || 0), 0);
}

function getRoundVsParFromRound(round) {
    if (round.summary && round.summary.vsPar != null) {
        return Number(round.summary.vsPar || 0);
    }

    const totalScore = getRoundTotalFromRound(round);
    const coursePar = Number(round.details?.coursePar || 0);

    return coursePar ? (totalScore - coursePar) : 0;
}

function getRoundPuttsFromRound(round) {
    const savedHoles = Array.isArray(round.holes)
        ? round.holes.filter(h => h && h.saved)
        : [];

    return savedHoles.reduce((sum, h) => sum + Number(h.putts || 0), 0);
}

function getRoundUpDownsFromRound(round) {
    const savedHoles = Array.isArray(round.holes)
        ? round.holes.filter(h => h && h.saved)
        : [];

    return savedHoles.reduce((sum, h) => sum + (h.updown ? 1 : 0), 0);
}

function formatVsPar(value) {
    const num = Number(value || 0);
    if (num === 0) return "E";
    return `${num > 0 ? "+" : ""}${num}`;
}

function getAnalyticsRounds() {
    const rounds = (typeof getCompletedRounds === "function") ? getCompletedRounds() : [];

    const realRounds = rounds.filter(round => {
        const yardage = Number(round.details?.teeYardage || 0);
        const totalScore = getRoundTotalFromRound(round);
        return yardage > 0 && totalScore > 0;
    });

    if (realRounds.length > 0) {
        return realRounds;
    }
    return [];
}

function renderPerformanceMetrics() {
    const rounds = getAnalyticsRounds();
    const allRounds = getCompletedRounds ? getCompletedRounds() : JSON.parse(localStorage.getItem("golfStatsCompletedRounds") || "[]");

    const avgScoreEl = document.getElementById("avgScoreValue");
    const avgVsParEl = document.getElementById("avgVsParValue");
    const avgPuttsEl = document.getElementById("avgPuttsValue");
    const avgUpDownEl = document.getElementById("avgUpDownValue");

    if (!avgScoreEl || !avgVsParEl || !avgPuttsEl || !avgUpDownEl) return;

if (!allRounds.length) {
    avgScoreEl.textContent = "--";
    avgVsParEl.textContent = "--";
    avgPuttsEl.textContent = "--";
    avgUpDownEl.textContent = "--";
    return;
}

    const totalScores = rounds.reduce((sum, round) => sum + getRoundTotalFromRound(round), 0);
    const totalVsPar = rounds.reduce((sum, round) => sum + getRoundVsParFromRound(round), 0);
    const totalPutts = rounds.reduce((sum, round) => sum + getRoundPuttsFromRound(round), 0);
    const totalUpDowns = rounds.reduce((sum, round) => sum + getRoundUpDownsFromRound(round), 0);

    const avgScore = totalScores / rounds.length;
    const avgVsPar = totalVsPar / rounds.length;
    const avgPutts = totalPutts / rounds.length;
    const avgUpDowns = totalUpDowns / rounds.length;

    avgScoreEl.textContent = avgScore.toFixed(1);
    avgVsParEl.textContent = formatVsPar(Number(avgVsPar.toFixed(1)));
    avgPuttsEl.textContent = avgPutts.toFixed(1);
    avgUpDownEl.textContent = avgUpDowns.toFixed(1);
}

function isSavedRoundsScreenVisible() {
    const savedRoundsScreen = document.getElementById("savedRoundsScreen");
    if (!savedRoundsScreen) return false;

    const hasHiddenClass = savedRoundsScreen.classList.contains("hidden");
    const style = window.getComputedStyle(savedRoundsScreen);

    return !hasHiddenClass && style.display !== "none" && style.visibility !== "hidden";
}

function renderScoreYardageChart() {
    const canvas = document.getElementById("scoreYardageChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parentCard = canvas.closest(".analytics-chart-card");
    const parentWidth = parentCard ? parentCard.clientWidth : 320;

    const cssWidth = Math.max(280, Math.min(parentWidth - 24, 520));
    const cssHeight = 320;

    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // background
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const rounds = getAnalyticsRounds();

    const points = rounds
        .map(round => ({
            yardage: Number(round.details?.teeYardage || 0),
            score: Number(getRoundTotalFromRound(round) || 0),
            courseName: round.details?.courseName || "Course",
            roundDate: round.details?.roundDate || ""
        }))
        .filter(p => p.yardage > 0 && p.score > 0)
        .sort((a, b) => a.yardage - b.yardage);

    // no data
    if (!points.length) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";

    ctx.fillText("No valid round data yet", cssWidth / 2, cssHeight / 2 - 10);
    ctx.fillText("Save at least one full round to begin", cssWidth / 2, cssHeight / 2 + 16);

    const left = 60;
    const right = 20;
    const top = 40;
    const bottom = 50;

    ctx.strokeStyle = "#666";
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, cssHeight - bottom);
    ctx.lineTo(cssWidth - right, cssHeight - bottom);
    ctx.stroke();

    return;
}

    const left = 58;
    const right = 22;
    const top = 42;
    const bottom = 58;

    const plotWidth = cssWidth - left - right;
    const plotHeight = cssHeight - top - bottom;

    let minX = Math.min(...points.map(p => p.yardage));
    let maxX = Math.max(...points.map(p => p.yardage));
    let minY = Math.min(...points.map(p => p.score));
    let maxY = Math.max(...points.map(p => p.score));

    // expand the scale when only one point exists
    if (minX === maxX) {
        minX -= 200;
        maxX += 200;
    } else {
        const xPad = Math.max(50, Math.round((maxX - minX) * 0.1));
        minX -= xPad;
        maxX += xPad;
    }

    if (minY === maxY) {
        minY -= 2;
        maxY += 2;
    } else {
        const yPad = Math.max(1, Math.round((maxY - minY) * 0.15));
        minY -= yPad;
        maxY += yPad;
    }

    function xPos(value) {
        return left + ((value - minX) / (maxX - minX)) * plotWidth;
    }

    function yPos(value) {
        return top + (1 - ((value - minY) / (maxY - minY))) * plotHeight;
    }

    // title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
   

    // axes
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, cssHeight - bottom);
    ctx.lineTo(cssWidth - right, cssHeight - bottom);
    ctx.stroke();

    // horizontal grid lines
    ctx.strokeStyle = "#444444";
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= 4; i++) {
        const y = top + (plotHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(cssWidth - right, y);
        ctx.stroke();
    }

    // draw line only if 2+ points
    if (points.length >= 2) {
        ctx.strokeStyle = "#39ff14";
        ctx.lineWidth = 2;
        ctx.beginPath();

        points.forEach((p, index) => {
            const x = xPos(p.yardage);
            const y = yPos(p.score);
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    }

    // draw dots
    ctx.fillStyle = "#39ff14";
    points.forEach(p => {
        const x = xPos(p.yardage);
        const y = yPos(p.score);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    });




    

    // special message for one point only
// special message for one point only
if (points.length === 1) {
    const p = points[0];
    const x = xPos(p.yardage);
    const y = yPos(p.score);

    const allRounds = getCompletedRounds ? getCompletedRounds() : [];
    const savedRoundCount = Array.isArray(allRounds) ? allRounds.length : 0;
    const roundsNeeded = Math.max(0, 2 - savedRoundCount);
    const roundLabel = savedRoundCount === 1 ? "round" : "rounds";

    ctx.fillStyle = "#ffffff";
    ctx.font = "13px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Only ${savedRoundCount} saved ${roundLabel} so far`, cssWidth / 2, cssHeight - 34);

    if (roundsNeeded > 0) {
        const neededLabel = roundsNeeded === 1 ? "round" : "rounds";
        ctx.fillText(`Add ${roundsNeeded} more ${neededLabel} to show a trend line`, cssWidth / 2, cssHeight - 16);
    } else {
        ctx.fillText(`More round details may be needed for charting`, cssWidth / 2, cssHeight - 16);
    }

    ctx.textAlign = "left";
    ctx.fillText(`Score ${p.score} • ${p.yardage} yds`, x + 10, y - 10);
}

    // x labels
    ctx.fillStyle = "#cccccc";
    ctx.font = "11px Arial";
    ctx.textAlign = "center";
const actualMinX = Math.min(...points.map(p => p.yardage));
const actualMaxX = Math.max(...points.map(p => p.yardage));

ctx.textAlign = "center";
ctx.fillStyle = "#cccccc";
ctx.font = "11px Arial";

const xSteps = 4;
for (let i = 0; i <= xSteps; i++) {
    const value = minX + (i / xSteps) * (maxX - minX);
    const x = xPos(value);
    ctx.fillText(Math.round(value), x, cssHeight - 20);
}

    // y labels
    ctx.textAlign = "right";
    ctx.textAlign = "right";
ctx.fillStyle = "#cccccc";
ctx.font = "11px Arial";

const ySteps = 4;
for (let i = 0; i <= ySteps; i++) {
    const value = minY + (i / ySteps) * (maxY - minY);
    const y = yPos(value);
    ctx.fillText(Math.round(value), left - 8, y + 3);
}

    // axis labels
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Yardage", cssWidth / 2, cssHeight - 2);

    ctx.save();
    ctx.translate(18, cssHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Score", 0, 0);
    ctx.restore();
}


function getFIRPercentFromRound(round) {
    const savedHoles = Array.isArray(round.holes)
        ? round.holes.filter(h => h && h.saved && Number(h.par) >= 4)
        : [];

    if (!savedHoles.length) return 0;

    const firMade = savedHoles.reduce((sum, h) => sum + (h.fir ? 1 : 0), 0);
    return Math.round((firMade / savedHoles.length) * 100);
}

function renderFIRByRoundChart() {
    const canvas = document.getElementById("firByRoundChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parentCard = canvas.closest(".analytics-chart-card");
    const parentWidth = parentCard ? parentCard.clientWidth : 320;

    const cssWidth = Math.max(280, Math.min(parentWidth - 24, 520));
    const cssHeight = 320;

    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const rounds = getAnalyticsRounds();

    const points = rounds.map((round, index) => ({
        roundNumber: index + 1,
        firPercent: getFIRPercentFromRound(round),
        courseName: round.details?.courseName || "Course",
        roundDate: round.details?.roundDate || ""
    }));

    if (!points.length) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("No valid round data yet", cssWidth / 2, cssHeight / 2 - 10);
        ctx.fillText("Save at least one full round to begin", cssWidth / 2, cssHeight / 2 + 16);
        return;
    }

    const left = 50;
    const right = 20;
    const top = 24;
    const bottom = 52;

    const plotWidth = cssWidth - left - right;
    const plotHeight = cssHeight - top - bottom;

    function xPos(index) {
        if (points.length === 1) return left + plotWidth / 2;
        return left + (index / (points.length - 1)) * plotWidth;
    }

    function yPos(value) {
        return top + (1 - (value / 100)) * plotHeight;
    }

    // axes
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, cssHeight - bottom);
    ctx.lineTo(cssWidth - right, cssHeight - bottom);
    ctx.stroke();

    // horizontal grid lines
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= 4; i++) {
        const value = i * 25;
        const y = yPos(value);
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(cssWidth - right, y);
        ctx.stroke();
    }

    // line
    if (points.length >= 2) {
        ctx.strokeStyle = "#39ff14";
        ctx.lineWidth = 2;
        ctx.beginPath();

        points.forEach((p, index) => {
            const x = xPos(index);
            const y = yPos(p.firPercent);
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        ctx.stroke();
    }

    // dots
    ctx.fillStyle = "#39ff14";
    points.forEach((p, index) => {
        const x = xPos(index);
        const y = yPos(p.firPercent);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // x labels
    ctx.fillStyle = "#cccccc";
    ctx.font = "11px Arial";
    ctx.textAlign = "center";

    points.forEach((p, index) => {
        const x = xPos(index);
        ctx.fillText(`R${p.roundNumber}`, x, cssHeight - 20);
    });

    // y labels
    ctx.textAlign = "right";
    [0, 25, 50, 75, 100].forEach(value => {
        const y = yPos(value);
        ctx.fillText(`${value}%`, left - 8, y + 3);
    });

    // axis labels
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Rounds", cssWidth / 2, cssHeight - 2);

    ctx.save();
    ctx.translate(18, cssHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("FIR %", 0, 0);
    ctx.restore();
}


function renderPerformanceReview() {
    renderPerformanceMetrics();
    renderScoreYardageChart();
    renderFIRByRoundChart();
}


function schedulePerformanceReview() {
    clearTimeout(analyticsRenderTimer);

    analyticsRenderTimer = setTimeout(() => {
        if (isSavedRoundsScreenVisible()) {
            renderPerformanceReview();

            // render again shortly after in case another script updates the screen right after
            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (isSavedRoundsScreenVisible()) {
                        renderPerformanceReview();
                    }
                }, 120);
            });
        }
    }, 50);
}

function startAnalyticsObserver() {
    if (analyticsObserverStarted) return;
    analyticsObserverStarted = true;

    const savedRoundsScreen = document.getElementById("savedRoundsScreen");
    if (!savedRoundsScreen) return;

    const observer = new MutationObserver(() => {
        schedulePerformanceReview();
    });

    observer.observe(savedRoundsScreen, {
        attributes: true,
        attributeFilter: ["class", "style"]
    });
}

document.addEventListener("DOMContentLoaded", () => {
    startAnalyticsObserver();
    schedulePerformanceReview();
    initAnalyticsSwiper();  // 👈 ADD THIS LINE
});

window.addEventListener("resize", () => {
    schedulePerformanceReview();
});

window.addEventListener("orientationchange", () => {
    schedulePerformanceReview();
});

// lets app.js manually trigger chart redraw if needed
document.addEventListener("savedRoundsShown", () => {
    schedulePerformanceReview();
});


// ==============================================
// FIR CHART → POPUP BASIC OPEN / CLOSE (TEST)
// ==============================================

document.addEventListener("DOMContentLoaded", () => {
    const popup = document.getElementById("chartPointPopup");
    const closeBtn = document.getElementById("chartPopupClose");

    // TEMP TEST: click FIR chart to open popup
    const firChart = document.getElementById("firByRoundChart");

    if (firChart && popup) {
        firChart.addEventListener("click", () => {
            popup.classList.remove("hidden");
        });
    }

    // Close button
    if (closeBtn && popup) {
        closeBtn.addEventListener("click", () => {
            popup.classList.add("hidden");
        });
    }

    // Click outside popup closes it
    document.addEventListener("click", (e) => {
        if (!popup || popup.classList.contains("hidden")) return;

        const box = popup.querySelector(".chart-popup-box");

        if (box && !box.contains(e.target) && e.target.id !== "firByRoundChart") {
            popup.classList.add("hidden");
        }
    });
});
// ==============================================
// END FIR CHART → POPUP BASIC OPEN / CLOSE (TEST)
// ==============================================


let currentAnalyticsChartIndex = 0;

function updateAnalyticsSwiper() {
    const track = document.getElementById("analyticsSwiperTrack");
    const dots = document.querySelectorAll(".analytics-dot");
    if (!track) return;

    track.style.transform = `translateX(-${currentAnalyticsChartIndex * 100}%)`;

    dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === currentAnalyticsChartIndex);
    });
}

function initAnalyticsSwiper() {
    const swiper = document.getElementById("analyticsSwiper");
    const dots = document.querySelectorAll(".analytics-dot");

    if (!swiper) return;

    let startX = 0;
    let endX = 0;

    swiper.addEventListener("touchstart", e => {
        startX = e.changedTouches[0].clientX;
    }, { passive: true });

    swiper.addEventListener("touchend", e => {
        endX = e.changedTouches[0].clientX;
        const diff = endX - startX;

        if (diff < -40 && currentAnalyticsChartIndex < 1) {
            currentAnalyticsChartIndex++;
            updateAnalyticsSwiper();
        } else if (diff > 40 && currentAnalyticsChartIndex > 0) {
            currentAnalyticsChartIndex--;
            updateAnalyticsSwiper();
        }
    }, { passive: true });

    dots.forEach(dot => {
        dot.addEventListener("click", () => {
            currentAnalyticsChartIndex = Number(dot.dataset.chartIndex || 0);
            updateAnalyticsSwiper();
        });
    });

    updateAnalyticsSwiper();
}