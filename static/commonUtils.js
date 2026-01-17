export function getScoreColor(avg) {
    if (avg >= 9) return '#38a169';       // xanh lá đậm
    if (avg >= 7) return '#4299e1';      // xanh dương
    if (avg >= 5) return '#ed8936';      // cam
    return '#e53e3e';                    // đỏ
}

export function convertToDate(input) {
    const date = new Date(input);

    const formatted =
        String(date.getDate()).padStart(2, '0') + '/' +
        String(date.getMonth() + 1).padStart(2, '0') + '/' +
        date.getFullYear();
    return formatted;
}