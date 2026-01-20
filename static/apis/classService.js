export async function fetchClasses() {
    const res = await fetch(`/api/classes`, {
        method: 'GET'
    });
    return res.json();
}

export async function updateClass(classId, newName) {
    const res = await fetch(`/api/classes/${classId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ className: newName }),
    });
    return res.json();
}