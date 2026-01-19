window.loadStatsAndHistory = loadStatsAndHistory;
window.renderWeeklyCalendar = renderWeeklyCalendar;
window.selectDay = selectDay;


let selectedDay = null;
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
        //renderWeeklyCalendar(stats.dates);
    }
}

export function renderWeeklyCalendar() {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const container = document.getElementById('week-calendar');
    let html = '';

    const today = new Date();
    const currentDay = today.getDay(); // 0 = CN

    // Tìm ngày CN đầu tuần
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - currentDay);

    for (let i = 0; i < 7; i++) {
        const date = new Date(sunday);
        date.setDate(sunday.getDate() + i);

        const formatted = formatDate(date);
        const isToday = formatted === formatDate(today);

        html += `
            <div class="day-box ${isToday ? 'active' : ''}"
                 onclick="selectDay('${formatted}')">
                <div class="day-name">${days[date.getDay()]}</div>
            </div>`;
    }

    container.innerHTML = html;
}
export function selectDay(dateStr) {
    selectedDay = dateStr;

    // reset active
    document.querySelectorAll('.day-box').forEach(b => b.classList.remove('active'));

    // active ô được chọn
    event.currentTarget.classList.add('active');

    console.log("Selected day:", selectedDay);

    window.dispatchEvent(new CustomEvent("dayChanged",
        {
            detail: {
                date: selectedDay
            }
        }));
}
function formatDate(date) {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}