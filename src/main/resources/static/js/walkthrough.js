/* ═══════════════════════════════════════════════════════════
   AETHER — walkthrough.js
   Step-by-step spotlight onboarding system.
   Uses an SVG mask to create a "cutout" spotlight effect.
   ═══════════════════════════════════════════════════════════ */

const Walkthrough = (() => {

    // ── Step Definitions ─────────────────────────────────────
    const STEPS = [
        {
            targetId: 'stats-bar',
            title: 'YOUR DAILY SNAPSHOT',
            body: 'These three cards show your current streak, today\'s completion rate, and your 7-day average. They update live as you check off habits.',
            position: 'bottom'
        },
        {
            targetId: 'habits-section',
            title: 'DAILY PROTOCOL',
            body: 'This is your habit checklist. Click any habit row to toggle it as complete for today. Each habit has a colored accent you can customize.',
            position: 'bottom'
        },
        {
            targetId: 'btn-add-habit',
            title: 'ADD NEW HABITS',
            body: 'Click here to create a new habit. Give it a name, a description, and choose a color. Habits can also be edited or soft-deleted at any time.',
            position: 'bottom'
        },
        {
            targetId: 'mini-chart-section',
            title: '7-DAY OVERVIEW',
            body: 'This chart shows your completion rate for the past 7 days. Days before a habit existed are correctly excluded from the average.',
            position: 'top'
        },
        {
            targetId: 'nav-journal',
            title: 'DAILY JOURNAL',
            body: 'Navigate here to write a journal entry for today. Select your mood, write freely, and browse past entries. Only one entry per day.',
            position: 'bottom'
        },
        {
            targetId: 'nav-insights',
            title: 'INSIGHTS & ANALYTICS',
            body: 'View your completion trends over 7, 14, or 30 days. See individual habit breakdowns, your best day, and overall completion rate.',
            position: 'bottom'
        }
    ];

    let currentStep = 0;
    let isActive = false;

    // ── DOM Refs ──────────────────────────────────────────────
    const overlay = () => document.getElementById('walkthrough-overlay');
    const tooltip = () => document.getElementById('walkthrough-tooltip');
    const svgEl = () => document.getElementById('walkthrough-svg');
    const hole = () => document.getElementById('spotlight-hole');
    const stepEl = () => document.getElementById('wt-step');
    const titleEl = () => document.getElementById('wt-title');
    const bodyEl = () => document.getElementById('wt-body');
    const dotsEl = () => document.getElementById('wt-dots');
    const prevBtn = () => document.getElementById('wt-prev');
    const nextBtn = () => document.getElementById('wt-next');
    const skipBtn = () => document.getElementById('wt-skip');

    // ── Public API ────────────────────────────────────────────
    function start(stepIndex = 0) {
        isActive = true;
        currentStep = stepIndex;
        const el = overlay();
        if (el) el.style.display = 'block';
        bindKeys();
        renderStep();
    }

    function stop() {
        isActive = false;
        const el = overlay();
        if (el) el.style.display = 'none';
        unbindKeys();
        localStorage.setItem('aether_onboarded', '1');
    }

    // ── Rendering ─────────────────────────────────────────────
    function renderStep() {
        const step = STEPS[currentStep];
        const target = document.getElementById(step.targetId);
        const total = STEPS.length;
        const num = currentStep + 1;

        // Update text
        stepEl().textContent = `STEP ${num} OF ${total}`;
        titleEl().textContent = step.title;
        bodyEl().textContent = step.body;

        // Update dots
        dotsEl().innerHTML = STEPS.map((_, i) =>
            `<div class="walkthrough-dot ${i === currentStep ? 'walkthrough-dot--active' : ''}"></div>`
        ).join('');

        // Update buttons
        prevBtn().style.visibility = currentStep === 0 ? 'hidden' : 'visible';
        nextBtn().textContent = currentStep === total - 1 ? "LET'S GO →" : 'NEXT →';

        // Spotlight the target
        if (target) {
            spotlightElement(target);
            positionTooltip(target, step.position);
        }
    }

    function spotlightElement(el) {
        const PADDING = 10;
        const rect = el.getBoundingClientRect();
        const holeEl = hole();
        const svg = svgEl();

        // Size the SVG to viewport
        svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);

        // Animate hole to element bounds
        holeEl.setAttribute('x', rect.left - PADDING);
        holeEl.setAttribute('y', rect.top - PADDING);
        holeEl.setAttribute('width', rect.width + PADDING * 2);
        holeEl.setAttribute('height', rect.height + PADDING * 2);
    }

    function positionTooltip(targetEl, preferredPos) {
        const PADDING = 16;
        const rect = targetEl.getBoundingClientRect();
        const tip = tooltip();
        const tipW = 300;
        const tipH = tip.offsetHeight || 180;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let top, left;

        if (preferredPos === 'bottom' && rect.bottom + tipH + PADDING < vh) {
            top = rect.bottom + PADDING;
            left = rect.left + rect.width / 2 - tipW / 2;
        } else if (preferredPos === 'top' && rect.top - tipH - PADDING > 0) {
            top = rect.top - tipH - PADDING;
            left = rect.left + rect.width / 2 - tipW / 2;
        } else {
            // Fallback: center of screen
            top = vh / 2 - tipH / 2;
            left = vw / 2 - tipW / 2;
        }

        // Clamp to viewport
        left = Math.max(PADDING, Math.min(left, vw - tipW - PADDING));
        top = Math.max(PADDING, Math.min(top, vh - tipH - PADDING));

        tip.style.left = `${left}px`;
        tip.style.top = `${top}px`;
    }

    // ── Navigation ────────────────────────────────────────────
    function goNext() {
        if (currentStep < STEPS.length - 1) {
            currentStep++;
            renderStep();
        } else {
            stop();
        }
    }

    function goPrev() {
        if (currentStep > 0) {
            currentStep--;
            renderStep();
        }
    }

    // ── Keyboard ──────────────────────────────────────────────
    function handleKey(e) {
        if (!isActive) return;
        if (e.key === 'ArrowRight' || e.key === 'Enter') goNext();
        if (e.key === 'ArrowLeft') goPrev();
        if (e.key === 'Escape') stop();
    }

    function bindKeys() { document.addEventListener('keydown', handleKey); }
    function unbindKeys() { document.removeEventListener('keydown', handleKey); }

    // ── Init Button Handlers ──────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        nextBtn()?.addEventListener('click', goNext);
        prevBtn()?.addEventListener('click', goPrev);
        skipBtn()?.addEventListener('click', stop);

        document.getElementById('btn-guide')?.addEventListener('click', () => start(0));

        // Resize: re-render spotlight on window resize
        window.addEventListener('resize', () => {
            if (isActive) renderStep();
        });
    });

    return { start, stop };
})();
