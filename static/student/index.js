
import { loadStudentProfileAndLessons, loadProgressAndHistory } from "../student-functions.js";
import { renderWeeklyCalendar } from "../chart.js";
if (window.location.pathname === '/student') {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log("Student dashboard loaded");
        renderWeeklyCalendar();
        await loadStudentProfileAndLessons();
        await loadProgressAndHistory();
    });
}
window.addEventListener("dayChanged", async (event) => {
    const selectedDate = event.detail.date;
    await loadProgressAndHistory(selectedDate);
});