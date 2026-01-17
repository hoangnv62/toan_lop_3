//index.js
import { loadClasses } from '../classes.js';
import { loadDashboardStats } from '../dashboard.js';
import { loadLessons } from '../lessons.js';
document.addEventListener('DOMContentLoaded', () => {
    console.log("Teacher Classes Loaded");
    loadDashboardStats();
});

//dashboard functions
window.loadDashboardStats = loadDashboardStats;

//class functions
window.showSection = showSection;

//lesson functions
window.loadLessons = loadLessons;

export function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    const btn = event.target.closest('.sidebar-btn');
    if (btn) btn.classList.add('active');
    if (sectionId === 'classes') loadClasses();
    if (sectionId === 'lessons') loadLessons();
    if (sectionId === 'dashboard') loadDashboardStats();
}