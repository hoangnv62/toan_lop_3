window.loadDashboardStats = loadDashboardStats;
window.getAIAdvice = getAIAdvice;

// 1. Dashboard stats + AI advice
export async function loadDashboardStats() {
    try {
        const res = await fetch('/api/teacher/stats/overall', { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const stats = await res.json();

        document.getElementById('total-students').textContent = stats.student_count || 0;
        document.getElementById('total-exams').textContent = stats.total_exams_taken || 0;
        document.getElementById('class-avg').textContent = (stats.class_avg || 0).toFixed(1);

        const ctx = document.getElementById('distChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Giỏi (9-10)', 'Khá (7-8.9)', 'Trung bình (5-6.9)', 'Yếu (<5)'],
                datasets: [{
                    data: stats.distribution || [0, 0, 0, 0],
                    backgroundColor: ['#48bb78', '#ecc94b', '#ed8936', '#f56565'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });

        await getAIAdvice();
    } catch (err) {
        console.error("Lỗi tải dashboard:", err);
        document.getElementById('ai-advice').textContent = "Không tải được dữ liệu.";
    }
}

export async function getAIAdvice() {
    const avg = parseFloat(document.getElementById('class-avg').textContent) || 0;
    const total = parseInt(document.getElementById('total-exams').textContent) || 0;

    try {
        const res = await fetch('/api/teacher/get-advice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ avg, total, dist: [] })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const adviceEl = document.getElementById('ai-advice');
        let content = data.advice || "Không có lời khuyên lúc này.";

        if (typeof content === 'string') {
            content = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
            try { content = JSON.parse(content); } catch { }
        }

        if (Array.isArray(content) && content.length > 0) {
            adviceEl.innerHTML = content.map(item => `
                <div style="margin-bottom:1.2rem; padding:1rem; background:rgba(99,102,241,0.05); border-radius:0.8rem;">
                    <strong style="color:#4c51bf;">${item.title || 'Lời khuyên'}</strong><br>
                    <p style="margin-top:0.5rem; color:#4a5568;">${item.detail || item}</p>
                </div>
            `).join('');
        } else {
            adviceEl.textContent = typeof content === 'string' ? content : "Không có lời khuyên.";
        }
    } catch (err) {
        console.error("Lỗi AI advice:", err);
        document.getElementById('ai-advice').textContent = "Hãy khuyến khích học sinh làm bài đều hơn nhé!";
    }
}
