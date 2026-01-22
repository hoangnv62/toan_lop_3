export async function fetchExam(id) {
    const res = await fetch(`/api/exams/${id}`, {
        method: "GET",
        credentials: 'include'
    });
    return res.json();
}

export async function deleteExam(id) {
    const res = await fetch(`/api/exams/${id}`, {
        method: "DELETE"
    })
    return res.json();
}

export async function saveExam(lessonId, examId, payload) {
    const url = examId
        ? `/api/lessons/${lessonId}/exams/${examId}`
        : `/api/lessons/${lessonId}/exams`;
    const method = examId ? "PUT" : "POST";
    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload)
    })
    return res.json();
}

export async function submit(payload) {
    const res = await fetch("/api/student/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
    });

    return res.json();
}