export async function fetchStudent(dateFrom, dateTo) {
    const res = await fetch(`/api/student/dashboard?dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`);
    return res.json();
}
