window.loadStatsAndHistory = loadStatsAndHistory;
window.renderWeeklyCalendar = renderWeeklyCalendar;

export async function loadStatsAndHistory() {
    // Lịch sử
    const resH = await fetch('/api/student/history');
    const hist = await resH.json();
    document.getElementById('history-list').innerHTML = hist.map(h => {
        const color = h.score >= 9 ? '#48bb78' : (h.score >= 5 ? '#ecc94b' : '#f56565');
        return `
            <div class="history-item">
                <div class="h-info">
                    <h4>${h.exam_title}</h4>
                    <p>${h.lesson_title}</p>
                    <small>${new Date(h.created_at).toLocaleDateString('vi-VN')}</small>
                </div>
                <div class="score-badge" style="background:${color}">${h.score}</div>
            </div>`;
    }).join('') || '<p style="text-align:center">Chưa có bài làm nào.</p>';

    // Biểu đồ
    const resS = await fetch('/api/student/stats');
    const stats = await resS.json();
    if (stats.scores && stats.scores.length > 0) {
        new Chart(document.getElementById('progressChart'), {
            type: 'line',
            data: {
                labels: stats.labels,
                datasets: [{
                    label: 'Điểm số',
                    data: stats.scores,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 10 } } }
        });
        renderWeeklyCalendar(stats.dates);
    }
}

export function renderWeeklyCalendar(dates) {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const container = document.getElementById('week-calendar');
    let html = '';
    for (let i = 1; i <= 7; i++) {
        let idx = i === 7 ? 0 : i; // CN là 0
        // Kiểm tra xem có ngày nào trong mảng dates trùng thứ trong tuần này không
        // (Demo đơn giản: check thứ)
        const isActive = dates.some(dt => new Date(dt).getDay() === idx);
        html += `
                <div class="day-box ${isActive ? 'active' : ''}">
                    <div class="day-name">${days[idx]}</div>
                    <div class="day-status">${isActive ? '⭐' : '-'}</div>
                </div>`;
    }
    container.innerHTML = html;
}