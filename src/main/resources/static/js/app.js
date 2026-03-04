/* ═══════════════════════════════════════════════════════════
   AETHER — Application Logic v2
   Features: Habit CRUD + Edit, Journal, Insights, Smart Charts
   ═══════════════════════════════════════════════════════════ */

const API = {
    habits: '/api/habits',
    habitsActive: '/api/habits/active',
    journal: '/api/journal',
    progress: '/api/progress/summary'
};

// ── State ──────────────────────────────────────────────────
const state = {
    currentPage: 'dashboard',
    habits: [],
    journals: [],
    journalDate: new Date().toISOString().split('T')[0],
    currentMood: null,
    selectedColor: '#8B5CF6',
    progressDays: 7,
    miniChart: null,
    mainChart: null,
    editingId: null   // null = create mode, number = edit mode
};

// ── Fetch Helper (auth-aware) ──────────────────────────────
const apiFetch = (url, options = {}) => Auth.fetchWithAuth(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
});

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDate();
    initModal();
    initJournal();
    initInsights();
});

// Wait for auth to be ready before loading any data
document.addEventListener('auth-ready', () => {
    // Auto walkthrough on first visit
    if (!localStorage.getItem('aether_onboarded')) {
        setTimeout(() => Walkthrough.start(0), 800);
    }
    loadDashboard();
});

// ═══════════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════════

function initNavigation() {
    document.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => switchPage(link.dataset.page));
    });
}

function switchPage(page) {
    document.querySelectorAll('.nav__link').forEach(l => l.classList.remove('nav__link--active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('nav__link--active');

    document.querySelectorAll('.page').forEach(p => p.classList.remove('page--active'));
    const pageEl = document.getElementById(`page-${page}`);
    void pageEl.offsetWidth; // force reflow for CSS animation
    pageEl.classList.add('page--active');

    state.currentPage = page;
    if (page === 'dashboard') loadDashboard();
    if (page === 'journal') loadJournalPage();
    if (page === 'insights') loadInsights();
}

function initDate() {
    const now = new Date();
    document.getElementById('current-date').textContent =
        now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
}

// ═══════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════

async function loadDashboard() {
    await loadHabits();
    await loadProgressStats();
    await loadMiniChart();
}

async function loadHabits() {
    try {
        const res = await apiFetch(API.habits);
        state.habits = await res.json();
        renderHabits();
    } catch (e) { console.error('Failed to load habits:', e); }
}

function renderHabits() {
    const list = document.getElementById('habit-list');
    const empty = document.getElementById('habits-empty');

    if (!state.habits.length) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = state.habits.map(h => `
        <div class="habit-item ${h.completedToday ? 'habit-item--completed' : ''}"
             style="--habit-color: ${h.color}"
             data-id="${h.id}">
            <div class="habit-check" onclick="toggleHabit(${h.id}, event)">
                ${h.completedToday ? '✓' : ''}
            </div>
            <div class="habit-item__info" onclick="toggleHabit(${h.id}, event)">
                <div class="habit-item__name">${escapeHtml(h.name)}</div>
                ${h.description ? `<div class="habit-item__desc">${escapeHtml(h.description)}</div>` : ''}
            </div>
            <div class="habit-item__actions">
                <button class="habit-action-btn habit-action-btn--edit"
                        onclick="openEditModal(${h.id}, event)" title="Edit">✎</button>
                <button class="habit-action-btn"
                        onclick="deleteHabit(${h.id}, event)" title="Delete">✕</button>
            </div>
        </div>
    `).join('');
}

async function toggleHabit(id, event) {
    event.stopPropagation();
    try {
        const res = await apiFetch(`${API.habits}/${id}/toggle`, { method: 'POST' });
        const updated = await res.json();
        const idx = state.habits.findIndex(h => h.id === id);
        if (idx !== -1) state.habits[idx] = updated;
        renderHabits();
        loadProgressStats();
        loadMiniChart();
        showToast(updated.completedToday ? '◆ HABIT COMPLETED' : '◇ HABIT UNCHECKED');
    } catch (e) { showToast('✕ FAILED TO UPDATE'); }
}

async function deleteHabit(id, event) {
    event.stopPropagation();
    if (!confirm('Delete this habit?\nYour progress history will be preserved in Insights.')) return;
    try {
        await apiFetch(`${API.habits}/${id}`, { method: 'DELETE' });
        state.habits = state.habits.filter(h => h.id !== id);
        renderHabits();
        loadProgressStats();
        loadMiniChart();
        showToast('◆ HABIT ARCHIVED');
    } catch (e) { showToast('✕ FAILED TO DELETE'); }
}

async function loadProgressStats() {
    try {
        const res = await apiFetch(`${API.progress}?days=7`);
        const data = await res.json();
        document.getElementById('streak-value').textContent = data.currentStreak;
        document.getElementById('weekly-avg').textContent = Math.round(data.overallCompletionRate) + '%';

        // Today = last summary entry
        const summaries = (data.dailySummaries || []).filter(d => d.completionRate >= 0);
        const today = summaries[summaries.length - 1];
        document.getElementById('today-progress').textContent =
            today ? Math.round(today.completionRate) + '%' : '—';
    } catch (e) { console.error('Progress stats error:', e); }
}

async function loadMiniChart() {
    try {
        const res = await apiFetch(`${API.progress}?days=7`);
        const data = await res.json();

        // Convert -1.0 sentinel → null so Chart.js shows a gap
        const labels = data.dailySummaries.map(d => d.dayLabel);
        const values = data.dailySummaries.map(d => d.completionRate < 0 ? null : d.completionRate);

        const ctx = document.getElementById('mini-chart').getContext('2d');
        if (state.miniChart) state.miniChart.destroy();

        state.miniChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data: values,
                    borderColor: '#8B5CF6',
                    backgroundColor: createGradient(ctx, '#8B5CF6', 160),
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: values.map(v => v === null ? 'transparent' : '#8B5CF6'),
                    pointBorderColor: '#0A0A0B',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6,
                    spanGaps: false  // show gap where habit didn't exist
                }]
            },
            options: getChartOptions()
        });
    } catch (e) { console.error('Mini chart error:', e); }
}

// ═══════════════════════════════════════════════════════════
//  HABIT MODAL (Create + Edit)
// ═══════════════════════════════════════════════════════════

function initModal() {
    document.getElementById('btn-add-habit').addEventListener('click', openCreateModal);
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-save').addEventListener('click', saveHabit);

    document.getElementById('habit-modal').addEventListener('click', e => {
        if (e.target.id === 'habit-modal') closeModal();
    });

    document.getElementById('habit-name').addEventListener('keydown', e => {
        if (e.key === 'Enter') saveHabit();
    });

    document.querySelectorAll('.color-swatch').forEach(s => {
        s.addEventListener('click', () => {
            document.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('color-swatch--active'));
            s.classList.add('color-swatch--active');
            state.selectedColor = s.dataset.color;
        });
    });
}

function openCreateModal() {
    state.editingId = null;
    document.getElementById('modal-title').textContent = 'NEW HABIT';
    document.getElementById('modal-save').textContent = 'CREATE HABIT';
    document.getElementById('modal-editing-id').value = '';
    document.getElementById('habit-name').value = '';
    document.getElementById('habit-description').value = '';
    // Reset color to first swatch
    state.selectedColor = '#8B5CF6';
    document.querySelectorAll('.color-swatch').forEach((s, i) => {
        s.classList.toggle('color-swatch--active', i === 0);
    });
    document.getElementById('habit-modal').style.display = 'flex';
    document.getElementById('habit-name').focus();
}

function openEditModal(id, event) {
    event.stopPropagation();
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;

    state.editingId = id;
    document.getElementById('modal-title').textContent = 'EDIT HABIT';
    document.getElementById('modal-save').textContent = 'SAVE CHANGES';
    document.getElementById('modal-editing-id').value = id;
    document.getElementById('habit-name').value = habit.name;
    document.getElementById('habit-description').value = habit.description || '';

    // Activate the matching color swatch
    state.selectedColor = habit.color;
    document.querySelectorAll('.color-swatch').forEach(s => {
        s.classList.toggle('color-swatch--active', s.dataset.color === habit.color);
    });

    document.getElementById('habit-modal').style.display = 'flex';
    document.getElementById('habit-name').focus();
}

function closeModal() {
    document.getElementById('habit-modal').style.display = 'none';
    state.editingId = null;
}

async function saveHabit() {
    const name = document.getElementById('habit-name').value.trim();
    if (!name) { showToast('✕ HABIT NAME REQUIRED'); return; }

    const body = {
        name,
        description: document.getElementById('habit-description').value.trim() || null,
        color: state.selectedColor
    };

    try {
        let res;
        if (state.editingId) {
            // Update existing habit
            res = await apiFetch(`${API.habits}/${state.editingId}`, {
                method: 'PUT', body: JSON.stringify(body)
            });
        } else {
            // Create new habit
            res = await apiFetch(API.habits, {
                method: 'POST', body: JSON.stringify(body)
            });
        }

        if (res.ok) {
            closeModal();
            await loadHabits();
            await loadMiniChart();
            showToast(state.editingId ? '◆ HABIT UPDATED' : '◆ HABIT CREATED');
        }
    } catch (e) { showToast('✕ FAILED TO SAVE'); }
}

// ═══════════════════════════════════════════════════════════
//  JOURNAL
// ═══════════════════════════════════════════════════════════

function initJournal() {
    document.getElementById('btn-prev-day').addEventListener('click', () => {
        const d = new Date(state.journalDate + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        state.journalDate = d.toISOString().split('T')[0];
        loadJournalForDate();
    });

    document.getElementById('btn-next-day').addEventListener('click', () => {
        const d = new Date(state.journalDate + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        state.journalDate = d.toISOString().split('T')[0];
        loadJournalForDate();
    });

    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('mood-btn--active'));
            btn.classList.add('mood-btn--active');
            state.currentMood = btn.dataset.mood;
        });
    });

    document.getElementById('btn-save-journal').addEventListener('click', saveJournal);
}

function loadJournalPage() {
    updateJournalDateLabel();
    loadJournalForDate();
    loadJournalEntries();
}

function updateJournalDateLabel() {
    const d = new Date(state.journalDate + 'T00:00:00');
    document.getElementById('journal-date-label').textContent =
        d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}

async function loadJournalForDate() {
    updateJournalDateLabel();
    try {
        const res = await apiFetch(`${API.journal}/date/${state.journalDate}`);
        if (res.status === 204) {
            document.getElementById('journal-title').value = '';
            document.getElementById('journal-content').value = '';
            state.currentMood = null;
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('mood-btn--active'));
            return;
        }
        const entry = await res.json();
        document.getElementById('journal-title').value = entry.title || '';
        document.getElementById('journal-content').value = entry.content || '';
        state.currentMood = entry.mood;
        document.querySelectorAll('.mood-btn').forEach(b => {
            b.classList.toggle('mood-btn--active', b.dataset.mood === entry.mood);
        });
    } catch (e) { console.error('Journal load error:', e); }
}

async function saveJournal() {
    const title = document.getElementById('journal-title').value.trim();
    const content = document.getElementById('journal-content').value.trim();
    if (!title || !content) { showToast('✕ TITLE AND CONTENT REQUIRED'); return; }

    try {
        const res = await apiFetch(API.journal, {
            method: 'POST',
            body: JSON.stringify({ entryDate: state.journalDate, title, content, mood: state.currentMood })
        });
        if (res.ok) {
            const status = document.getElementById('journal-status');
            status.textContent = '◆ SAVED';
            status.classList.add('journal__status--visible');
            setTimeout(() => status.classList.remove('journal__status--visible'), 2500);
            loadJournalEntries();
            showToast('◆ JOURNAL ENTRY SAVED');
        }
    } catch (e) { showToast('✕ FAILED TO SAVE'); }
}

async function loadJournalEntries() {
    try {
        const res = await apiFetch(API.journal);
        const entries = await res.json();
        const container = document.getElementById('journal-entries');
        const empty = document.getElementById('journals-empty');

        if (!entries.length) {
            container.innerHTML = '';
            empty.style.display = 'block';
            return;
        }
        empty.style.display = 'none';
        container.innerHTML = entries.map(e => `
            <div class="journal-entry-card" onclick="navigateToJournal('${e.entryDate}')">
                <div class="journal-entry-card__header">
                    <span class="journal-entry-card__date">${formatDate(e.entryDate)}</span>
                    ${e.mood ? `<span class="journal-entry-card__mood"
                        style="background:var(--mood-${e.mood});color:#fff">${e.mood.toUpperCase()}</span>` : ''}
                </div>
                <div class="journal-entry-card__title">${escapeHtml(e.title)}</div>
                <div class="journal-entry-card__preview">${escapeHtml(e.content.substring(0, 120))}${e.content.length > 120 ? '…' : ''}</div>
            </div>
        `).join('');
    } catch (e) { console.error('Journal entries error:', e); }
}

function navigateToJournal(dateStr) {
    state.journalDate = dateStr;
    loadJournalForDate();
    document.querySelector('.journal__editor').scrollIntoView({ behavior: 'smooth' });
}

// ═══════════════════════════════════════════════════════════
//  INSIGHTS
// ═══════════════════════════════════════════════════════════

function initInsights() {
    document.querySelectorAll('.range-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('range-btn--active'));
            btn.classList.add('range-btn--active');
            state.progressDays = parseInt(btn.dataset.days);
            loadInsights();
        });
    });
}

async function loadInsights() {
    try {
        const res = await apiFetch(`${API.progress}?days=${state.progressDays}`);
        const data = await res.json();
        renderMainChart(data);
        renderHabitBreakdown(data);
        renderInsightsStats(data);
    } catch (e) { console.error('Insights error:', e); }
}

function renderMainChart(data) {
    const labels = data.dailySummaries.map(d => {
        const date = new Date(d.date + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    // -1.0 sentinel → null (chart gap for days before first habit)
    const values = data.dailySummaries.map(d => d.completionRate < 0 ? null : d.completionRate);

    const ctx = document.getElementById('main-chart').getContext('2d');
    if (state.mainChart) state.mainChart.destroy();

    state.mainChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Completion %',
                data: values,
                backgroundColor: values.map(v => {
                    if (v === null) return 'rgba(63,63,70,0.15)';
                    if (v >= 80) return 'rgba(16,185,129,0.7)';
                    if (v >= 50) return 'rgba(245,158,11,0.7)';
                    if (v > 0) return 'rgba(239,68,68,0.5)';
                    return 'rgba(63,63,70,0.3)';
                }),
                borderColor: values.map(v => {
                    if (v === null) return '#3F3F46';
                    if (v >= 80) return '#10B981';
                    if (v >= 50) return '#F59E0B';
                    if (v > 0) return '#EF4444';
                    return '#3F3F46';
                }),
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            ...getChartOptions(),
            plugins: {
                ...getChartOptions().plugins,
                tooltip: {
                    ...getChartOptions().plugins.tooltip,
                    callbacks: {
                        label: ctx => ctx.raw === null
                            ? 'No habits existed yet'
                            : `${Math.round(ctx.raw)}% completion`
                    }
                }
            }
        }
    });
}

function renderHabitBreakdown(data) {
    const container = document.getElementById('habit-breakdown');
    if (!data.totalActiveHabits || !data.dailySummaries.length) {
        container.innerHTML = '<p class="text-muted" style="padding:16px">No data available.</p>';
        return;
    }

    const habitStats = {};
    data.dailySummaries.forEach(day => {
        if (day.habitStatus) {
            Object.entries(day.habitStatus).forEach(([name, completed]) => {
                if (!habitStats[name]) habitStats[name] = { total: 0, completed: 0 };
                habitStats[name].total++;
                if (completed) habitStats[name].completed++;
            });
        }
    });

    const habitColors = {};
    state.habits.forEach(h => { habitColors[h.name] = h.color; });

    container.innerHTML = Object.entries(habitStats)
        .sort((a, b) => (b[1].completed / b[1].total) - (a[1].completed / a[1].total))
        .map(([name, stats]) => {
            const rate = Math.round((stats.completed / stats.total) * 100);
            const color = habitColors[name] || '#8B5CF6';
            return `
                <div class="breakdown-card" style="--card-color:${color}">
                    <div class="breakdown-card__name">${escapeHtml(name)}</div>
                    <div class="breakdown-card__bar">
                        <div class="breakdown-card__fill" style="width:${rate}%;background:${color}"></div>
                    </div>
                    <div class="breakdown-card__rate">${stats.completed}/${stats.total} days — ${rate}%</div>
                </div>`;
        }).join('');
}

function renderInsightsStats(data) {
    const validDays = data.dailySummaries.filter(d => d.completionRate >= 0);
    let bestDay = null, worstDay = null, bestRate = -1, worstRate = 101;

    validDays.forEach(d => {
        if (d.completionRate > bestRate) { bestRate = d.completionRate; bestDay = d; }
        if (d.completionRate < worstRate) { worstRate = d.completionRate; worstDay = d; }
    });

    document.getElementById('best-day').textContent = bestDay ? `${bestDay.dayLabel} (${Math.round(bestRate)}%)` : '—';
    document.getElementById('worst-day').textContent = worstDay ? `${worstDay.dayLabel} (${Math.round(worstRate)}%)` : '—';
    document.getElementById('overall-rate').textContent = Math.round(data.overallCompletionRate) + '%';
    document.getElementById('insights-streak').textContent = data.currentStreak + ' days';
}

// ═══════════════════════════════════════════════════════════
//  CHART HELPERS
// ═══════════════════════════════════════════════════════════

function createGradient(ctx, color, height) {
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, color + '40');
    g.addColorStop(1, color + '05');
    return g;
}

function getChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#18181B',
                titleColor: '#FAFAFA',
                bodyColor: '#A1A1AA',
                borderColor: '#3F3F46',
                borderWidth: 1,
                cornerRadius: 4,
                padding: 12,
                titleFont: { family: "'JetBrains Mono'", size: 11 },
                bodyFont: { family: "'JetBrains Mono'", size: 11 },
                callbacks: { label: ctx => `${Math.round(ctx.raw ?? 0)}% completion` }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(63,63,70,0.3)', drawBorder: false },
                ticks: { color: '#71717A', font: { family: "'JetBrains Mono'", size: 10 } },
                border: { display: false }
            },
            y: {
                min: 0, max: 100,
                grid: { color: 'rgba(63,63,70,0.15)', drawBorder: false },
                ticks: {
                    color: '#71717A', font: { family: "'JetBrains Mono'", size: 10 },
                    callback: v => v + '%', stepSize: 25
                },
                border: { display: false }
            }
        },
        interaction: { intersect: false, mode: 'index' }
    };
}

// ═══════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = message;
    toast.style.display = 'block';
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 2500);
}
