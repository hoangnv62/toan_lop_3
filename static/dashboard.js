// ===============================
// DASHBOARD STATE
// ===============================
let dashboardData = null;

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
});

// ===============================
// LOAD DASHBOARD DATA
// ===============================
async function loadDashboard() {
    try {
        const res = await fetch("/api/teacher/dashboard", {
            credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        dashboardData = await res.json();

        renderSummary(dashboardData.summary);
        renderScoreChart(dashboardData.scoreDistribution);
        renderPassRateChart(dashboardData.passRate);

        getAIAdvice();
    } catch (err) {
        console.error("Dashboard error:", err);
    }
}

// ===============================
// SUMMARY CARDS
// ===============================
function renderSummary(summary) {
    document.getElementById("totalStudents").textContent =
        summary.totalStudents ?? 0;
    document.getElementById("totalClasses").textContent =
        summary.totalClasses ?? 0;
    document.getElementById("totalLessons").textContent =
        summary.totalLessons ?? 0;
    document.getElementById("totalExams").textContent =
        summary.totalExams ?? 0;
}

// ===============================
// SCORE DISTRIBUTION CHART
// ===============================
function renderScoreChart(dist) {
    const ctx = document.getElementById("scoreChart");
    if (!ctx) return;

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(dist),
            datasets: [
                {
                    label: "Số học sinh",
                    data: Object.values(dist),
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
            },
        },
    });
}

// ===============================
// PASS RATE CHART
// ===============================
function renderPassRateChart(rate) {
    const ctx = document.getElementById("passRateChart");
    if (!ctx) return;

    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Đạt", "Không đạt"],
            datasets: [
                {
                    data: [rate.pass ?? 0, rate.fail ?? 0],
                },
            ],
        },
        options: {
            responsive: true,
        },
    });
}

// ===============================
// AI ADVICE
// ===============================
export async function getAIAdvice() {
    if (!dashboardData) return;

    const dist = dashboardData.scoreDistribution;
    const totalStudents =
        (dashboardData.passRate?.pass ?? 0) +
        (dashboardData.passRate?.fail ?? 0);

    // Ước lượng điểm trung bình từ phân bố
    const avg =
        (
            (dist["0-4"] ?? 0) * 2 +
            (dist["4-6"] ?? 0) * 5 +
            (dist["6-8"] ?? 0) * 7 +
            (dist["8-10"] ?? 0) * 9
        ) / Math.max(totalStudents, 1);

    try {
        const res = await fetch("/api/teacher/get-advice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                avg: Number(avg.toFixed(2)),
                totalStudents,
                dist,
            }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        renderAIAdvice(data.advice);
    } catch (err) {
        console.error("AI advice error:", err);
        document.getElementById("ai-advice").textContent =
            "⚠️ Không thể phân tích lúc này. Vui lòng thử lại.";
    }
}

// ===============================
// RENDER AI ADVICE
// ===============================
function renderAIAdvice(content) {
    const adviceEl = document.getElementById("ai-advice");
    if (!adviceEl) return;

    if (!content || !Array.isArray(content)) {
        adviceEl.textContent = "Không có lời khuyên.";
        return;
    }

    adviceEl.innerHTML = content
        .map(
            (item) => `
      <div class="ai-item">
        <strong>${item.title || "Lời khuyên"}</strong>
        <p>${item.detail || ""}</p>
      </div>
    `
        )
        .join("");
}

// ===============================
// RELOAD AI BUTTON
// ===============================
document
    .getElementById("reloadAI")
    ?.addEventListener("click", getAIAdvice);
