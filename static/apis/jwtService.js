export function loginForTeacher(payload) {

}
export async function loginForStudent(payload) {
    const res = await fetch('/api/login/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: payload.phone, password: payload.password })
    });
    return await res.json();
}

export async function checkPhoneNumber(payload) {
    const res = await fetch('/api/check-student-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: payload.phone })
    });
    return await res.json();
}