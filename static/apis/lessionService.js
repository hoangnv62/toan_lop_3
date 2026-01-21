export async function fetchLessons() {
    const res = await fetch('/api/lessons', {
        method: "GET",
        credentials: 'include'
    });
    return res.json();
}

export async function fetchLesson(id) {
    const res = await fetch(`/api/lessons/${id}`, {
        method: "GET",
    })
    return res.json();
}

export async function createLesson(payload) {
    const res = await fetch("/api/lessons", {
        method: "POST",
        headers: {
            'Content-Type': "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload)
    })
    return res.json();
}

export async function updateLesson(id, payload) {
    const res = await fetch(`/api/lessons/${id}`, {
        method: "PUT",
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify(payload)
    })
    return res.json();
}

export async function deleteLesson(id) {
    const res = await fetch(`/api/lessons/${id}`, {
        method: "DELETE",
    })
    return res.json();
}