import { renderUserProfile } from "../student-functions.js";
import { renderWeeklyCalendar } from "../chart.js";
import { getToday, getFirstDayOfWeek } from "../commonUtils.js";

if (window.location.pathname === '/student') {
    document.addEventListener('DOMContentLoaded', async () => {
        renderWeeklyCalendar();

        // GỌI MẶC ĐỊNH
        await renderUserProfile(getFirstDayOfWeek(), getToday());
    });
}

window.addEventListener("dayChanged", async (event) => {
    const selectedDate = event.detail.date;
    await renderUserProfile(getFirstDayOfWeek(), selectedDate);
});
