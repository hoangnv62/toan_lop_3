window.showToast = showToast;
window.showScore = showScore;
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

export function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");

    toast.className = `toast ${type}`;
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3300);
}

export function showScore(total, correct, message = null) {
    const overlay = document.getElementById("score-overlay");
    overlay.innerHTML = "";
    overlay.style.display = "flex";

    const box = document.createElement("div");
    box.className = "score-box";

    box.innerHTML = `
        <span class="score-close">✖</span>
        ${message !== null
            ? `<div class="score-message">${message}</div>`
            : `
                    <div class="score-result">${correct} / ${total}</div>
                    <div class="score-percent">${Math.round((correct / total) * 100)}%</div>
                  `
        }
    `;

    overlay.appendChild(box);

    // Đóng khi bấm X
    box.querySelector(".score-close").onclick = () => closeScore();

    // Đóng khi click ra ngoài
    overlay.onclick = (e) => {
        if (e.target === overlay) closeScore();
    };

}

function closeScore() {
    const overlay = document.getElementById("score-overlay");
    overlay.style.display = "none";
    overlay.innerHTML = "";
}
