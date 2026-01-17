
import { loadStudentProfileAndLessons, renderWeekCalendar, loadProgressAndHistory } from "../student-functions.js";
if (window.location.pathname === '/student') {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log("Student dashboard loaded");

        await loadStudentProfileAndLessons();
        renderWeekCalendar();
        await loadProgressAndHistory();
    });
}